'use client';

import { PlusIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { SubscriptionCard } from '@/components/ui/SubscriptionCard';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { apiClient } from '@/lib/api/client';
import { CARD_FEATURES_BY_PLAN } from '@/lib/constants/plan-features';
import {
  ADDONS,
  ALL_PLANS_INCLUDED_KEYS,
  COMPARISON_TABLE_PLAN_SLUGS,
  COMPARISON_TABLE_ROWS,
  FAQ_ITEMS,
  OUTCOME_POSITIONING,
  YEARLY_SAVE,
} from '@/lib/constants/subscription-spec';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { open: openConfirm } = useConfirmation();
  const { t } = useI18n();
  /** Subscription pricing is USD only; payment method is PayPal only. */
  const displayCurrency = 'USD';
  const displayLocale = 'en-US';
  const { handleError, safeTranslate } = useErrorHandler({ t, showToast: true });
  const [subscription, setSubscription] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradingMethod, setUpgradingMethod] = useState(null);
  const [addonLoading, setAddonLoading] = useState(null);
  const [faqOpen, setFaqOpen] = useState(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [paymentModalPlan, setPaymentModalPlan] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchSubscription();
      fetchAvailablePlans();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const fetchSubscription = async () => {
    setFetchError(null);
    try {
      const response = await apiClient.get('/subscriptions');
      if (!response.success || !response.data) {
        setSubscription(null);
        setLoading(false);
        return;
      }
      const data = response.data;
      if (Array.isArray(data)) {
        setSubscription(null);
      } else if (data.planId && typeof data.planId === 'object') {
        setSubscription(data);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      logger.error('Failed to fetch subscription', error);
      setSubscription(null);
      setFetchError(error.message || t('subscription.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const response = await apiClient.get('/subscription-plans');
      if (response.success && response.data) setAvailablePlans(response.data);
    } catch (error) {
      logger.error('Failed to fetch plans', error);
      setFetchError((prev) => prev || error.message || t('subscription.noPlansDescription'));
    }
  };

  /** Run subscription API and redirect (used from payment method modal, no confirm dialog). */
  const handlePaymentWithMethod = async (planId, paymentMethod) => {
    if (!user) return;
    const plan = availablePlans.find((p) => p._id === planId);
    if (!plan) {
      showError(t('subscription.updateFailed'));
      return;
    }
    setUpgrading(true);
    setUpgradingMethod(paymentMethod);
    try {
      const response = await apiClient.post('/subscriptions', {
        planId,
        customerEmail: user.email,
        customerName: `${user.firstName} ${user.lastName}`.trim() || user.email,
        paymentMethod,
      });
      if (response.success && response.data) {
        if (response.data.approvalUrl) {
          setPaymentModalPlan(null);
          window.location.href = response.data.approvalUrl;
          return;
        }
        showSuccess(t('subscription.subscriptionUpdated'));
        setPaymentModalPlan(null);
        fetchSubscription();
      } else {
        showError(response.error?.message || t('subscription.updateFailed'));
      }
    } catch (error) {
      logger.error('Failed to create subscription', error);
      showError(error.message || t('subscription.updateFailed'));
    } finally {
      setUpgrading(false);
      setUpgradingMethod(null);
    }
  };

  const handleUpgrade = async (planId, paymentMethod = 'paypal') => {
    if (!user) return;
    const plan = availablePlans.find((p) => p._id === planId);
    if (!plan) {
      showError(t('subscription.updateFailed'));
      return;
    }
    const planPrice = Number(plan.price) || 0;
    const isPaidPlan = planPrice > 0;
    const isFreePlan = planPrice === 0;

    const action = subscription
      ? t('subscription.confirmUpgradeActionChange')
      : t('subscription.confirmUpgradeActionSubscribe');
    const msg = t('subscription.confirmUpgrade')
      .replace('{{action}}', action)
      .replace('{{planName}}', plan.name);

    openConfirm({
      title: t('subscription.confirmUpgradeTitle') || 'Confirm',
      message: msg,
      confirmLabel: t('common.confirm'),
      cancelLabel: t('common.cancel'),
      variant: 'info',
      onConfirm: async () => {
        const method = isPaidPlan ? 'paypal' : null;
        setUpgrading(true);
        setUpgradingMethod(method);
        try {
          if (isPaidPlan && (subscription || !subscription)) {
            const response = await apiClient.post('/subscriptions', {
              planId,
              customerEmail: user.email,
              customerName: `${user.firstName} ${user.lastName}`.trim() || user.email,
              paymentMethod: method || 'paypal',
            });
            if (response.success && response.data) {
              if (response.data.approvalUrl) {
                window.location.href = response.data.approvalUrl;
              } else {
                showSuccess(t('subscription.subscriptionUpdated'));
                fetchSubscription();
              }
            } else {
              showError(response.error?.message || t('subscription.updateFailed'));
            }
          } else if ((isFreePlan || !isPaidPlan) && subscription) {
            const response = await apiClient.put(
              `/subscriptions/${subscription._id}?action=upgrade`,
              {
                planId,
              },
            );
            if (response.success) {
              showSuccess(t('subscription.subscriptionUpdated'));
              fetchSubscription();
            } else {
              showError(response.error?.message || t('subscription.updateFailed'));
            }
          }
        } catch (error) {
          logger.error('Failed to update subscription', error);
          showError(error.message || t('subscription.updateFailed'));
        } finally {
          setUpgrading(false);
          setUpgradingMethod(null);
        }
      },
    });
  };

  const handleAddAddon = (addon) => {
    if (!subscription?._id) return;
    const name = t(addon.labelKey);
    const msg = t('subscription.confirmAddAddon').replace('{{name}}', name);
    openConfirm({
      title: t('common.confirm'),
      message: msg,
      confirmLabel: t('common.confirm'),
      cancelLabel: t('common.cancel'),
      variant: 'info',
      onConfirm: async () => {
        setAddonLoading(addon.key);
        try {
          const response = await apiClient.post(`/subscriptions/${subscription._id}/addons`, {
            addonKey: addon.key,
            quantity: 1,
          });
          if (response.success) {
            await fetchSubscription();
            showSuccess(t('subscription.addonAdded'));
          } else {
            showError(response.error?.message || t('subscription.updateFailed'));
          }
        } catch (error) {
          showError(error.message || t('subscription.updateFailed'));
        } finally {
          setAddonLoading(null);
        }
      },
    });
  };

  const handleRemoveAddon = (addonKey, labelKey) => {
    if (!subscription?._id) return;
    const name = t(labelKey);
    const msg = t('subscription.confirmRemoveAddon').replace('{{name}}', name);
    openConfirm({
      title: t('common.confirm'),
      message: msg,
      confirmLabel: t('common.confirm'),
      cancelLabel: t('common.cancel'),
      variant: 'warning',
      onConfirm: async () => {
        setAddonLoading(addonKey);
        try {
          const response = await apiClient.delete(`/subscriptions/${subscription._id}/addons`, {
            data: { addonKey },
          });
          if (response.success) {
            await fetchSubscription();
            showSuccess(t('subscription.addonRemoved'));
          } else {
            showError(response.error?.message || t('subscription.updateFailed'));
          }
        } catch (error) {
          showError(error.message || t('subscription.updateFailed'));
        } finally {
          setAddonLoading(null);
        }
      },
    });
  };

  const handleCancel = () => {
    if (!subscription) return;
    const confirmMessage = subscription.cancelAtPeriodEnd
      ? t('subscription.confirmReactivate')
      : t('subscription.confirmCancel');
    openConfirm({
      title: subscription.cancelAtPeriodEnd
        ? t('subscription.reactivateSubscription')
        : t('subscription.cancelSubscription'),
      message: confirmMessage,
      confirmLabel: t('common.confirm'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
      onConfirm: async () => {
        setCancelling(true);
        try {
          const response = await apiClient.post(
            `/subscriptions/${subscription._id}?action=cancel`,
            {
              cancelAtPeriodEnd: !subscription.cancelAtPeriodEnd,
            },
          );
          if (response.success) {
            fetchSubscription();
            showSuccess(t('subscription.subscriptionUpdated'));
          } else {
            showError(response.error?.message || t('subscription.updateFailed'));
          }
        } catch (error) {
          logger.error('Failed to cancel subscription', error);
          showError(error.message || t('subscription.updateFailed'));
        } finally {
          setCancelling(false);
        }
      },
    });
  };

  /** Subscription pricing is USD only. */
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
      (amount || 0) / 100,
    );

  const renderAddonCard = (addon) => {
    try {
      const hasSubscription = subscription && subscription._id;
      const alreadyAdded =
        Array.isArray(subscription?.addons) &&
        subscription.addons.some((a) => a.addonKey === addon.key);
      const canAdd = canManageSubscription && hasSubscription && !alreadyAdded;
      return (
        <div key={addon.key} className='sub-addon-card'>
          <div className='sub-addon-card-header'>
            <div className='sub-addon-title'>
              {safeTranslate(addon?.labelKey, addon?.key || 'Add-on')}
            </div>
            {canAdd && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                iconOnly
                className='sub-addon-add-icon min-w-0'
                onClick={() => handleAddAddon(addon)}
                disabled={!!addonLoading}
                aria-label={safeTranslate('subscription.addAddon', 'Add')}
                title={safeTranslate('subscription.addAddon', 'Add')}
              >
                {addonLoading === addon.key ? (
                  <span className='sub-addon-add-icon-spinner' aria-hidden />
                ) : (
                  <PlusIcon className='icon icon-sm' ariaHidden />
                )}
              </Button>
            )}
            {alreadyAdded && (
              <span className='sub-addon-badge' aria-hidden>
                ✓ {safeTranslate('subscription.added', 'Added')}
              </span>
            )}
          </div>
          {addon?.descriptionKey && (
            <p className='sub-addon-description'>{safeTranslate(addon.descriptionKey, '')}</p>
          )}
          {addon?.price ? <div className='sub-addon-price'>{addon.price}</div> : null}
          {addon?.noteKey ? (
            <p className='sub-addon-note'>{safeTranslate(addon.noteKey, '')}</p>
          ) : null}
        </div>
      );
    } catch (error) {
      logger.error('Error rendering addon card:', addon?.key, error);
      return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'success',
      CANCELLED: 'danger',
      SUSPENDED: 'warning',
      EXPIRED: 'danger',
      PENDING: 'warning',
    };
    return colors[status] || 'default';
  };

  /** Plans: Core / Pro / Enterprise. USD only, PayPal only. */
  const ALLOWED_PLAN_NAMES = ['Core', 'Pro', 'Enterprise'];

  // Dedupe plans by name; keep only allowed plans and sort by ALLOWED_PLAN_NAMES order
  const uniquePlans = availablePlans
    .filter((plan) => plan && plan.name && ALLOWED_PLAN_NAMES.includes(plan.name))
    .reduce((acc, plan) => {
      if (acc.some((p) => p.name === plan.name)) return acc;
      acc.push(plan);
      return acc;
    }, [])
    .sort((a, b) => ALLOWED_PLAN_NAMES.indexOf(a.name) - ALLOWED_PLAN_NAMES.indexOf(b.name));

  const displayPlans = uniquePlans.filter((plan) => {
    if (
      subscription &&
      subscription.planId &&
      typeof subscription.planId === 'object' &&
      plan &&
      plan._id
    ) {
      const subPlanId = subscription.planId._id?.toString?.() ?? String(subscription.planId._id);
      const planId = plan._id?.toString?.() ?? String(plan._id);
      if (subPlanId === planId) return false;
    }
    return true;
  });

  const dedupeFeatures = (arr) => {
    if (!Array.isArray(arr)) return [];
    const seen = new Set();
    return arr.filter((f) => {
      const s = String(f).trim();
      if (!s || seen.has(s)) return false;
      seen.add(s);
      return true;
    });
  };

  if (!user) return null;
  if (loading) return <Loader type='page' text={t('common.loading')} />;

  // Only the primary account (registered with full clinic details) can purchase or manage subscription. Staff/doctors created by admin cannot.
  const canManageSubscription = !!user.isPrimaryAccount;

  // No plans at all: show empty state with i18n
  if (uniquePlans.length === 0) {
    return (
      <Layout>
        <PageHeader
          title={t('subscription.title')}
          subtitle={t('subscription.subtitle')}
          notifications={[]}
          unreadCount={0}
        />
        <div className='dashboard-container sub-page-wrap'>
          <div className='dashboard-section'>
            <Card>
              <EmptyState
                title={t('subscription.noPlansAvailable')}
                message={t('subscription.noPlansDescription')}
                actionLabel={t('subscription.viewPlans')}
                onAction={() => router.push('/pricing')}
              />
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title={t('subscription.title')}
        subtitle={t('subscription.subtitle')}
        notifications={[]}
        unreadCount={0}
      />
      <div className='dashboard-container sub-page-wrap'>
        {fetchError && (
          <div className='dashboard-section'>
            <div className='sub-error-banner' role='alert'>
              <span>{fetchError}</span>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => {
                  setLoading(true);
                  fetchSubscription();
                  fetchAvailablePlans();
                }}
              >
                {t('common.retry')}
              </Button>
            </div>
          </div>
        )}
        {/* Subscription details and Add-ons side by side (2-column layout) */}
        {subscription && subscription.planId && typeof subscription.planId === 'object' ? (
          <div className='sub-details-addons-row'>
            <div className='dashboard-section sub-details-col'>
              <h2 className='sub-section-title'>
                <span className='sub-accent' />
                {t('subscription.currentPlan')}
              </h2>
              <Card
                title={t('subscription.subscriptionDetails')}
                className='sub-details-card-inner'
              >
                <div className='sub-detail-row'>
                  <span className='sub-detail-label'>{t('subscription.status')}</span>
                  <Tag variant={getStatusColor(subscription.status)}>{subscription.status}</Tag>
                </div>
                {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
                  <div className='sub-detail-row'>
                    <span className='sub-detail-label'>{t('subscription.currentPeriod')}</span>
                    <span className='sub-detail-value'>
                      {formatDate(subscription.currentPeriodStart)} –{' '}
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                )}
                {subscription.nextBillingDate && (
                  <div className='sub-detail-row'>
                    <span className='sub-detail-label'>{t('subscription.nextBillingDate')}</span>
                    <span className='sub-detail-value'>
                      {formatDate(subscription.nextBillingDate)}
                    </span>
                  </div>
                )}
                {subscription.planId && (
                  <div className='sub-detail-row'>
                    <span className='sub-detail-label'>{t('subscription.monthlyCost')}</span>
                    <span className='sub-detail-value'>
                      {formatCurrency(subscription.planId?.price || 0)} /{' '}
                      {subscription.planId?.billingCycle === 'YEARLY'
                        ? t('pricing.perYear')
                        : t('pricing.perMonth')}
                    </span>
                  </div>
                )}
                {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
                  <div className='sub-trial-notice'>
                    <p className='sub-detail-value'>
                      {t('subscription.trialEndsOn').replace(
                        '{{date}}',
                        formatDate(subscription.trialEnd),
                      )}
                      .{' '}
                      {t('subscription.afterTrialPlanContinues')
                        .replace('{{planName}}', subscription.planId?.name || '')
                        .replace(
                          '{{amount}}',
                          subscription.planId ? formatCurrency(subscription.planId.price || 0) : '',
                        )}
                    </p>
                  </div>
                )}
                {subscription.cancelAtPeriodEnd && (
                  <div className='sub-alert'>
                    <span className='text-amber-600' aria-hidden>
                      ⚠
                    </span>
                    <p>
                      {t('subscription.cancelWarning').replace(
                        '{{date}}',
                        formatDate(subscription.currentPeriodEnd),
                      )}
                    </p>
                  </div>
                )}
                <div className='sub-actions'>
                  {canManageSubscription && (
                    <>
                      <Button
                        variant='link'
                        size='xs'
                        onClick={handleCancel}
                        isLoading={cancelling}
                        className={
                          subscription.cancelAtPeriodEnd
                            ? 'text-primary-600 dark:text-primary-400'
                            : '!text-status-error hover:!text-red-700 dark:hover:!text-red-400'
                        }
                      >
                        {subscription.cancelAtPeriodEnd
                          ? t('subscription.reactivateSubscription')
                          : t('subscription.cancelSubscription')}
                      </Button>
                      <span className='sub-actions-sep' aria-hidden>
                        ·
                      </span>
                    </>
                  )}
                  <Link
                    href='/payment-history'
                    className='sub-action-link text-body-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline underline-offset-2'
                  >
                    {t('subscription.viewPaymentHistory')}
                  </Link>
                </div>
              </Card>
            </div>

            <div className='dashboard-section sub-addons-col sub-section-compact'>
              <h2 className='sub-section-title'>
                <span className='sub-accent' />
                {t('subscriptionSpec.addOns')}
              </h2>
              <Card className='sub-details-card-inner'>
                <p
                  className='sub-section-desc'
                  style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}
                >
                  {t('subscriptionSpec.addOnsSubtitle')}
                </p>
                <div className='content-grid-2 content-grid-gap-3'>
                  {ADDONS.map(renderAddonCard)}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <>
            {/* Add-ons catalog – full width when no current plan */}
            <div className='dashboard-section sub-section-compact'>
              <Card title={t('subscriptionSpec.addOns')}>
                <p
                  className='sub-section-desc'
                  style={{ marginTop: 0, marginBottom: 'var(--space-3)' }}
                >
                  {t('subscriptionSpec.addOnsSubtitle')}
                </p>
                <div className='content-grid-3 content-grid-gap-3'>
                  {ADDONS.map(renderAddonCard)}
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Other plans (excludes current plan) */}
        {displayPlans.length > 0 && (
          <div className='dashboard-section'>
            <h2 className='sub-section-title'>
              <span className='sub-accent' />
              {subscription ? t('subscription.upgradeOrChangePlan') : t('subscription.chooseAPlan')}
            </h2>
            <p className='sub-section-desc'>
              {subscription
                ? t('subscription.upgradeDescription')
                : t('subscription.chooseDescription')}
            </p>
            <p className='sub-section-desc sub-section-desc--trial'>
              {t('subscription.allPlansIncludeTrial')}
            </p>
            {displayPlans.some((p) => (Number(p.price) || 0) > 0) && (
              <p className='sub-payment-security-note' role='status'>
                {t('subscription.securePaymentNote')}
              </p>
            )}
            <div className='content-grid-3 content-grid-gap-6'>
              {displayPlans.map((plan) => {
                const isPaid = (Number(plan.price) || 0) > 0;
                return (
                  <SubscriptionCard
                    key={plan._id || plan.name}
                    name={plan.name}
                    description={plan.description}
                    price={plan.price}
                    currency={plan.currency}
                    billingCycle={plan.billingCycle}
                    features={CARD_FEATURES_BY_PLAN[plan.name] || dedupeFeatures(plan.features)}
                    maxUsers={plan.maxUsers}
                    maxPatients={plan.maxPatients}
                    maxStorageGB={plan.maxStorageGB}
                    isPopular={plan.isPopular}
                    yearlySaveAmount={YEARLY_SAVE[plan.name]}
                    trialDays={plan.trialDays ?? 14}
                    displayCurrency={displayCurrency}
                    displayLocale={displayLocale}
                    showPaymentMethods={canManageSubscription && isPaid}
                    onSubscribe={
                      canManageSubscription && isPaid ? () => setPaymentModalPlan(plan) : undefined
                    }
                    onSelect={
                      canManageSubscription && !isPaid ? () => handleUpgrade(plan._id) : undefined
                    }
                    ctaText={
                      canManageSubscription
                        ? subscription
                          ? t('subscription.switchToPlan')
                          : t('subscription.getStarted')
                        : t('subscription.viewOnly')
                    }
                    ctaDisabled={upgrading || !canManageSubscription}
                  />
                );
              })}
            </div>

            <Modal
              isOpen={!!paymentModalPlan}
              onClose={() => !upgrading && setPaymentModalPlan(null)}
              title={
                paymentModalPlan
                  ? `${t('subscription.subscribe')} – ${paymentModalPlan.name}`
                  : t('subscription.payWithPayPal')
              }
              size='sm'
            >
              {paymentModalPlan && (
                <div className='sub-payment-modal-content'>
                  <p className='sub-payment-modal-note' role='status'>
                    {t('subscription.securePaymentNote')}
                  </p>
                  <div className='sub-payment-modal-buttons'>
                    <Button
                      variant='primary'
                      size='md'
                      className='sub-payment-modal-btn'
                      onClick={() => handlePaymentWithMethod(paymentModalPlan._id, 'paypal')}
                      disabled={upgrading}
                      isLoading={upgradingMethod === 'paypal'}
                    >
                      {t('subscription.payWithPayPal')}
                    </Button>
                  </div>
                </div>
              )}
            </Modal>
          </div>
        )}

        {/* Feature comparison (collapsible) */}
        <div className='dashboard-section sub-section-compact'>
          <Card>
            <Button
              type='button'
              variant='ghost'
              fullWidth
              align='start'
              className='sub-comparison-toggle'
              onClick={() => setComparisonOpen((o) => !o)}
              aria-expanded={comparisonOpen}
            >
              <span>{t('subscriptionSpec.comparisonTable')}</span>
              <span aria-hidden>{comparisonOpen ? '−' : '+'}</span>
            </Button>
            {comparisonOpen && (
              <div className='sub-comparison-wrap'>
                <table>
                  <thead>
                    <tr>
                      <th>{t('subscriptionSpec.feature')}</th>
                      {COMPARISON_TABLE_PLAN_SLUGS.map((slug) => (
                        <th key={slug}>{slug}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_TABLE_ROWS.map((row, idx) => (
                      <tr key={idx}>
                        <td>{t(row[0])}</td>
                        {row.slice(1).map((cell, cidx) => (
                          <td key={cidx}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Included in ALL Plans */}
        <div className='dashboard-section sub-section-compact'>
          <Card>
            <h3 className='sub-section-title' style={{ marginTop: 0 }}>
              <span className='sub-accent' />
              {t('subscriptionSpec.includedInAllPlans')}
            </h3>
            <ul className='sub-included-list'>
              {ALL_PLANS_INCLUDED_KEYS.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Outcome Positioning */}
        <div className='dashboard-section sub-section-compact'>
          <Card>
            <h3 className='sub-section-title' style={{ marginTop: 0 }}>
              <span className='sub-accent' />
              {t('subscriptionSpec.outcomePositioning')}
            </h3>
            <div className='sub-outcome-wrap'>
              <table className='sub-outcome-table'>
                <thead>
                  <tr>
                    <th>{t('subscriptionSpec.plan')}</th>
                    <th>{t('subscriptionSpec.outcome')}</th>
                  </tr>
                </thead>
                <tbody>
                  {OUTCOME_POSITIONING.map(({ plan, outcomeKey }) => (
                    <tr key={plan}>
                      <td>{plan}</td>
                      <td>{t(outcomeKey)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* What You Deliver */}
        <div className='dashboard-section sub-section-compact'>
          <Card className='sub-what-you-deliver-card'>
            <h3 className='sub-section-title' style={{ marginTop: 0 }}>
              <span className='sub-accent' />
              {t('subscriptionSpec.whatYouDeliver')}
            </h3>
            <p className='sub-what-you-deliver-tagline'>
              {t('subscriptionSpec.whatYouDeliverTagline')}
            </p>
          </Card>
        </div>

        {/* FAQ (compact) */}
        <div className='dashboard-section sub-section-compact'>
          <Card title={t('subscriptionSpec.faq')}>
            <div className='sub-faq-list'>
              {FAQ_ITEMS.map((item, idx) => (
                <div key={idx} className='sub-faq-item'>
                  <Button
                    type='button'
                    variant='ghost'
                    fullWidth
                    align='start'
                    onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                    aria-expanded={faqOpen === idx}
                  >
                    {t(item.questionKey)}
                    <span>{faqOpen === idx ? '−' : '+'}</span>
                  </Button>
                  {faqOpen === idx && <div className='sub-faq-answer'>{t(item.answerKey)}</div>}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Terms & support (one line) */}
        <div className='dashboard-section sub-footer-line'>
          <p className='sub-terms-one-line'>
            {t('subscription.termsOneLine')}{' '}
            <Button variant='link' href='/pricing'>
              {t('subscription.comparePlans')}
            </Button>
            {' · '}
            <Button variant='link' href='/support'>
              {t('subscriptionSpec.contactSupport')}
            </Button>
          </p>
        </div>
      </div>
    </Layout>
  );
}
