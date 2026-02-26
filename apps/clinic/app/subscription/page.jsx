'use client';

import { PlusIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { SubscriptionCard } from '@/components/ui/SubscriptionCard';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useFeatures } from '@/contexts/FeatureContext';
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
  FIX_PLAN_PRICES_USD_CENTS,
  OUTCOME_POSITIONING,
  PLAN_DISPLAY_NAMES,
  PLAN_TRIAL_DAYS,
  WHICH_PLAN,
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
  const { refreshFeatures } = useFeatures();
  const { t } = useI18n();
  /** Subscription pricing is USD; payment method is PayPal only. */
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
      if (response.success && response.data) {
        const list = Array.isArray(response.data) ? response.data : [response.data];
        setAvailablePlans(list);
      }
    } catch (error) {
      logger.error('Failed to fetch plans', error);
      setFetchError((prev) => prev || error.message || t('subscription.noPlansDescription'));
    }
  };

  /** Run subscription API and redirect to PayPal. */
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
      title: t('subscription.confirmUpgradeTitle'),
      message: msg,
      confirmLabel: t('common.confirm'),
      cancelLabel: t('common.cancel'),
      variant: 'info',
      onConfirm: async () => {
        const method = isPaidPlan ? 'paypal' : null;
        setUpgrading(true);
        setUpgradingMethod(method);
        try {
          if (isPaidPlan) {
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
          } else if (isFreePlan && subscription) {
            const response = await apiClient.put(
              `/subscriptions/${subscription._id}?action=upgrade`,
              { planId },
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
            await refreshFeatures();
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
            await refreshFeatures();
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
            { cancelAtPeriodEnd: !subscription.cancelAtPeriodEnd },
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

  /** Format USD cents → "$24.99" */
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
      (amount || 0) / 100,
    );

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
              <>
                <span className='sub-addon-badge' aria-hidden>
                  ✓ {safeTranslate('subscription.added', 'Added')}
                </span>
                {canManageSubscription && (
                  <button
                    type='button'
                    onClick={() => handleRemoveAddon(addon.key, addon.labelKey)}
                    disabled={!!addonLoading}
                    className='sub-addon-remove text-body-sm text-status-error hover:underline ml-2'
                    aria-label={safeTranslate('subscription.removeAddon', 'Remove')}
                  >
                    {addonLoading === addon.key
                      ? '…'
                      : safeTranslate('subscription.removeAddon', 'Remove')}
                  </button>
                )}
              </>
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

  /** Plans: Basic / Smart Clinic / Enterprise — USD, PayPal only. */
  const ALLOWED_PLAN_NAMES = ['Basic', 'Smart Clinic', 'Enterprise'];
  const normalizedPlanName = (name) => (name && String(name).trim()) || '';
  const isAllowedPlan = (name) =>
    ALLOWED_PLAN_NAMES.some(
      (allowed) => normalizedPlanName(name).toLowerCase() === allowed.toLowerCase(),
    );
  const sortOrder = (name) => {
    const n = normalizedPlanName(name).toLowerCase();
    const i = ALLOWED_PLAN_NAMES.findIndex((a) => a.toLowerCase() === n);
    return i >= 0 ? i : 999;
  };

  const uniquePlans = availablePlans
    .filter((plan) => plan && plan.name && isAllowedPlan(plan.name))
    .reduce((acc, plan) => {
      const key = normalizedPlanName(plan.name).toLowerCase();
      if (acc.some((p) => normalizedPlanName(p.name).toLowerCase() === key)) return acc;
      acc.push(plan);
      return acc;
    }, [])
    .sort((a, b) => sortOrder(a.name) - sortOrder(b.name));

  // Plans to display (exclude current active plan)
  const displayPlans = uniquePlans.filter((plan) => {
    if (subscription?.planId && typeof subscription.planId === 'object' && plan?._id) {
      const subPlanId = String(subscription.planId._id);
      const planId = String(plan._id);
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
  if (loading) return <Layout loading />;

  // Any registered account can purchase a new subscription.
  const canPurchase = true;
  // Only the account that originally purchased can upgrade, downgrade, or cancel.
  const currentUserId = String(user.id || user.userId || '');
  const subscriptionOwnerId = subscription
    ? String(subscription.userId || subscription.createdBy || '')
    : '';
  const canManageSubscription = subscription
    ? subscriptionOwnerId
      ? subscriptionOwnerId === currentUserId
      : !!user.isPrimaryAccount
    : canPurchase;

  const hasActiveSubscription =
    subscription && subscription.planId && typeof subscription.planId === 'object';

  // No plans at all: empty state
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
        {/* ── Error Banner ───────────────────────────────────────────────── */}
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

        {/* ── Current Subscription + Add-ons ─────────────────────────────── */}
        {hasActiveSubscription && (
          <div className='sub-details-addons-row'>
            {/* Current Plan Details */}
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

                <div className='sub-detail-row'>
                  <span className='sub-detail-label'>{t('subscriptionSpec.plan')}</span>
                  <span className='sub-detail-value font-semibold'>
                    {subscription.planId?.name || '—'}
                  </span>
                </div>

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

            {/* Add-ons — only shown when subscribed */}
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
        )}

        {/* ── Available Plans ─────────────────────────────────────────────── */}
        {displayPlans.length > 0 && (
          <div className='dashboard-section'>
            <h2 className='sub-section-title'>
              <span className='sub-accent' />
              {hasActiveSubscription
                ? t('subscription.upgradeOrChangePlan')
                : t('subscription.chooseAPlan')}
            </h2>
            <p className='sub-section-desc'>
              {hasActiveSubscription
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
                // Normalize DB plan name (handles legacy ENTERPRISE, CLINIC, SOLO etc.)
                const canonicalName = PLAN_DISPLAY_NAMES[plan.name] || plan.name;
                // All plans are USD-only. Override DB price/currency from spec constants when available.
                const fixedPriceCents = FIX_PLAN_PRICES_USD_CENTS[canonicalName];
                const cardPrice = fixedPriceCents ?? plan.price;
                const cardCurrency = fixedPriceCents != null ? 'USD' : plan.currency || 'USD';
                const isPaid = (Number(cardPrice) || 0) > 0;
                // CARD_FEATURES_BY_PLAN stores plain text strings — pass directly, do NOT translate
                const cardFeatures = (
                  CARD_FEATURES_BY_PLAN[canonicalName] ||
                  CARD_FEATURES_BY_PLAN[plan.name] ||
                  []
                ).length
                  ? CARD_FEATURES_BY_PLAN[canonicalName] || CARD_FEATURES_BY_PLAN[plan.name]
                  : dedupeFeatures(plan.features);
                return (
                  <SubscriptionCard
                    key={plan._id || plan.name}
                    name={t(`subscriptionSpec.planName${canonicalName}`) || canonicalName}
                    description={t(`subscriptionSpec.planDesc${canonicalName}`) || plan.description}
                    price={cardPrice}
                    currency={cardCurrency}
                    billingCycle={plan.billingCycle}
                    features={cardFeatures}
                    maxUsers={plan.maxUsers}
                    maxPatients={plan.maxPatients}
                    maxStorageGB={plan.maxStorageGB}
                    isPopular={plan.isPopular}
                    yearlySaveAmount={YEARLY_SAVE[canonicalName]}
                    trialDays={PLAN_TRIAL_DAYS[canonicalName] ?? 90}
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
                        ? hasActiveSubscription
                          ? t('subscription.switchToPlan')
                          : t('subscription.getStarted')
                        : hasActiveSubscription
                          ? t('subscription.viewOnly')
                          : t('subscription.getStarted')
                    }
                    ctaDisabled={upgrading || (!!hasActiveSubscription && !canManageSubscription)}
                  />
                );
              })}
            </div>

            {/* PayPal Payment Modal */}
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

        {/* ── Feature Comparison Table ────────────────────────────────────── */}
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

        {/* ── Which Plan is Right for You? ────────────────────────────────── */}
        <div className='dashboard-section sub-section-compact'>
          <Card>
            <h3 className='sub-section-title' style={{ marginTop: 0 }}>
              <span className='sub-accent' />
              {t('subscriptionSpec.whichPlan')}
            </h3>
            <div
              className='content-grid-3 content-grid-gap-4'
              style={{ marginTop: 'var(--space-4)' }}
            >
              {WHICH_PLAN.map(({ planSlug, titleKey, bulletsKey, bestForKey }) => {
                const bullets =
                  t(bulletsKey)
                    ?.split(';')
                    .map((s) => s.trim())
                    .filter(Boolean) || [];
                return (
                  <div key={planSlug} className='sub-which-plan-card'>
                    <div className='sub-which-plan-name'>{planSlug}</div>
                    <p className='sub-which-plan-title'>{t(titleKey)}</p>
                    <ul className='sub-which-plan-bullets'>
                      {bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                    <p className='sub-which-plan-best'>
                      <strong>{t('subscriptionSpec.bestForLabel')}</strong> {t(bestForKey)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ── Included in All Plans ───────────────────────────────────────── */}
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

        {/* ── What You Achieve (Outcome Positioning) ──────────────────────── */}
        <div className='dashboard-section sub-section-compact'>
          <Card>
            <h3 className='sub-section-title' style={{ marginTop: 0 }}>
              <span className='sub-accent' />
              {t('subscriptionSpec.outcomePositioning')}
            </h3>
            <div
              className='content-grid-3 content-grid-gap-4'
              style={{ marginTop: 'var(--space-4)' }}
            >
              {OUTCOME_POSITIONING.map(({ plan, outcomeKey }) => (
                <div key={plan} className='sub-outcome-card'>
                  <div className='sub-outcome-plan'>{plan}</div>
                  <p className='sub-outcome-text'>{t(outcomeKey)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
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

        {/* ── Footer: Terms & Support ─────────────────────────────────────── */}
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
