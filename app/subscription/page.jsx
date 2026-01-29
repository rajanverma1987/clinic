'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { SubscriptionCard } from '@/components/ui/SubscriptionCard';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { CARD_FEATURES_BY_PLAN } from '@/lib/constants/plan-features';
import {
  ADDONS,
  COMPARISON_TABLE_PLAN_SLUGS,
  COMPARISON_TABLE_ROWS,
  FAQ_ITEMS,
  YEARLY_SAVE,
} from '@/lib/constants/subscription-spec';
import { logger } from '@/lib/utils/logger';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
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

  const handleUpgrade = async (planId, paymentMethod = 'paypal') => {
    if (!user) return;
    const plan = availablePlans.find((p) => p._id === planId);
    if (!plan) {
      alert(t('subscription.updateFailed'));
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
    if (!window.confirm(msg)) return;

    const method = isPaidPlan ? (paymentMethod === 'card' ? 'card' : 'paypal') : null;
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
          if (response.data.checkoutUrl) {
            window.location.href = response.data.checkoutUrl;
          } else if (response.data.approvalUrl) {
            window.location.href = response.data.approvalUrl;
          } else {
            alert(t('subscription.subscriptionUpdated'));
            fetchSubscription();
          }
        } else {
          alert(response.error?.message || t('subscription.updateFailed'));
        }
      } else if ((isFreePlan || !isPaidPlan) && subscription) {
        const response = await apiClient.put(`/subscriptions/${subscription._id}?action=upgrade`, {
          planId,
        });
        if (response.success) {
          alert(t('subscription.subscriptionUpdated'));
          fetchSubscription();
        } else {
          alert(response.error?.message || t('subscription.updateFailed'));
        }
      }
    } catch (error) {
      logger.error('Failed to update subscription', error);
      alert(error.message || t('subscription.updateFailed'));
    } finally {
      setUpgrading(false);
      setUpgradingMethod(null);
    }
  };

  const handleAddAddon = async (addon) => {
    if (!subscription?._id) return;
    const name = t(addon.labelKey);
    const msg = t('subscription.confirmAddAddon').replace('{{name}}', name);
    if (!window.confirm(msg)) return;
    setAddonLoading(addon.key);
    try {
      const response = await apiClient.post(`/subscriptions/${subscription._id}/addons`, {
        addonKey: addon.key,
        quantity: 1,
      });
      if (response.success) {
        await fetchSubscription();
        alert(t('subscription.addonAdded'));
      }
    } catch (error) {
      alert(error.message || t('subscription.updateFailed'));
    } finally {
      setAddonLoading(null);
    }
  };

  const handleRemoveAddon = async (addonKey, labelKey) => {
    if (!subscription?._id) return;
    const name = t(labelKey);
    const msg = t('subscription.confirmRemoveAddon').replace('{{name}}', name);
    if (!window.confirm(msg)) return;
    setAddonLoading(addonKey);
    try {
      const response = await apiClient.delete(`/subscriptions/${subscription._id}/addons`, {
        data: { addonKey },
      });
      if (response.success) {
        await fetchSubscription();
        alert(t('subscription.addonRemoved'));
      }
    } catch (error) {
      alert(error.message || t('subscription.updateFailed'));
    } finally {
      setAddonLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;
    const confirmMessage = subscription.cancelAtPeriodEnd
      ? t('subscription.confirmReactivate')
      : t('subscription.confirmCancel');
    if (!window.confirm(confirmMessage)) return;
    setCancelling(true);
    try {
      const response = await apiClient.post(`/subscriptions/${subscription._id}?action=cancel`, {
        cancelAtPeriodEnd: !subscription.cancelAtPeriodEnd,
      });
      if (response.success) fetchSubscription();
    } catch (error) {
      logger.error('Failed to cancel subscription', error);
      alert(error.message || t('subscription.updateFailed'));
    } finally {
      setCancelling(false);
    }
  };

  const formatCurrency = (amount, currency) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(
      amount / 100
    );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
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

  // Show SOLO, CLINIC, ENTERPRISE only (no free plan; all plans have 14-day free trial, then billing)
  const ALLOWED_PLAN_NAMES = ['SOLO', 'CLINIC', 'ENTERPRISE'];

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
  if (loading) return <Loader fullScreen size='lg' />;

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
            <div
              className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 flex items-center justify-between gap-4 flex-wrap'
              role='alert'
            >
              <span className='text-sm'>{fetchError}</span>
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
        {/* Current Plan – right-side details only (no plan card) */}
        {subscription && subscription.planId && typeof subscription.planId === 'object' && (
          <div className='dashboard-section'>
            <h2 className='sub-section-title'>
              <span className='sub-accent' />
              {t('subscription.currentPlan')}
            </h2>
            <Card title={t('subscription.subscriptionDetails')} className='sub-details-card-inner'>
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
                    {formatCurrency(
                      subscription.planId?.price || 0,
                      subscription.planId?.currency || 'USD'
                    )}{' '}
                    /{' '}
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
                      formatDate(subscription.trialEnd)
                    )}
                    .{' '}
                    {t('subscription.afterTrialPlanContinues')
                      .replace('{{planName}}', subscription.planId?.name || '')
                      .replace(
                        '{{amount}}',
                        subscription.planId
                          ? formatCurrency(
                              subscription.planId.price || 0,
                              subscription.planId.currency || 'USD'
                            )
                          : ''
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
                      formatDate(subscription.currentPeriodEnd)
                    )}
                  </p>
                </div>
              )}
              <div className='sub-actions'>
                <Button
                  variant={subscription.cancelAtPeriodEnd ? 'primary' : 'secondary'}
                  onClick={handleCancel}
                  isLoading={cancelling}
                >
                  {subscription.cancelAtPeriodEnd
                    ? t('subscription.reactivateSubscription')
                    : t('subscription.cancelSubscription')}
                </Button>
                <Button variant='secondary' onClick={() => router.push('/payment-history')}>
                  {t('subscription.viewPaymentHistory')}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Your add-ons (when user has subscription with add-ons) */}
        {subscription &&
          subscription._id &&
          Array.isArray(subscription.addons) &&
          subscription.addons.length > 0 && (
            <div className='dashboard-section sub-section-compact'>
              <h2 className='sub-section-title'>
                <span className='sub-accent' />
                {t('subscription.yourAddons')}
              </h2>
              <Card>
                <p
                  className='sub-section-desc'
                  style={{ marginTop: 0, marginBottom: 'var(--space-3)' }}
                >
                  {t('subscription.yourAddonsDescription')}
                </p>
                <ul className='sub-your-addons-list'>
                  {subscription.addons.map((item) => {
                    const spec = ADDONS.find((a) => a.key === item.addonKey);
                    const label = spec ? t(spec.labelKey) : item.addonKey;
                    return (
                      <li key={item.addonKey} className='sub-your-addon-item'>
                        <span className='sub-your-addon-label'>
                          {label}
                          {item.option ? ` (${item.option})` : ''}
                          {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                        </span>
                        <Button
                          variant='secondary'
                          size='sm'
                          onClick={() =>
                            handleRemoveAddon(item.addonKey, spec?.labelKey || item.addonKey)
                          }
                          isLoading={addonLoading === item.addonKey}
                          disabled={!!addonLoading}
                        >
                          {t('subscription.removeAddon')}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </div>
          )}

        {/* Add-ons catalog */}
        <div className='dashboard-section sub-section-compact'>
          <Card title={t('subscriptionSpec.addOns')}>
            <p
              className='sub-section-desc'
              style={{ marginTop: 0, marginBottom: 'var(--space-3)' }}
            >
              {t('subscriptionSpec.addOnsSubtitle')}
            </p>
            <div className='sub-addons-grid'>
              {ADDONS.map((addon) => {
                const hasSubscription = subscription && subscription._id;
                const alreadyAdded =
                  Array.isArray(subscription?.addons) &&
                  subscription.addons.some((a) => a.addonKey === addon.key);
                const canAdd = hasSubscription && !alreadyAdded;
                return (
                  <div key={addon.key} className='sub-addon-card'>
                    <div className='sub-addon-title'>{t(addon.labelKey)}</div>
                    <div className='sub-addon-price'>{addon.price}</div>
                    <p className='sub-addon-note'>{t(addon.noteKey)}</p>
                    {canAdd && (
                      <Button
                        variant='primary'
                        size='sm'
                        className='sub-addon-add-btn'
                        onClick={() => handleAddAddon(addon)}
                        isLoading={addonLoading === addon.key}
                        disabled={!!addonLoading}
                      >
                        {t('subscription.addAddon')}
                      </Button>
                    )}
                    {alreadyAdded && (
                      <span className='sub-addon-badge' aria-hidden>
                        ✓ {t('subscription.added')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

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
            <div className='sub-plans-grid'>
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
                    showPaymentMethods={isPaid}
                    onPayWithCard={isPaid ? () => handleUpgrade(plan._id, 'card') : undefined}
                    onPayWithPayPal={isPaid ? () => handleUpgrade(plan._id, 'paypal') : undefined}
                    onSelect={!isPaid ? () => handleUpgrade(plan._id) : undefined}
                    ctaText={
                      subscription ? t('subscription.switchToPlan') : t('subscription.getStarted')
                    }
                    ctaDisabled={upgrading}
                    loadingCard={upgradingMethod === 'card'}
                    loadingPayPal={upgradingMethod === 'paypal'}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Feature comparison (collapsible) */}
        <div className='dashboard-section sub-section-compact'>
          <Card>
            <button
              type='button'
              className='sub-comparison-toggle'
              onClick={() => setComparisonOpen((o) => !o)}
              aria-expanded={comparisonOpen}
            >
              <span>{t('subscriptionSpec.comparisonTable')}</span>
              <span aria-hidden>{comparisonOpen ? '−' : '+'}</span>
            </button>
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

        {/* FAQ (compact) */}
        <div className='dashboard-section sub-section-compact'>
          <Card title={t('subscriptionSpec.faq')}>
            <div className='sub-faq-list'>
              {FAQ_ITEMS.map((item, idx) => (
                <div key={idx} className='sub-faq-item'>
                  <button
                    type='button'
                    onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                    aria-expanded={faqOpen === idx}
                  >
                    {t(item.questionKey)}
                    <span>{faqOpen === idx ? '−' : '+'}</span>
                  </button>
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
            <button
              type='button'
              className='sub-link-button'
              onClick={() => router.push('/pricing')}
            >
              {t('subscription.comparePlans')}
            </button>
            {' · '}
            <button
              type='button'
              className='sub-link-button'
              onClick={() => router.push('/support')}
            >
              {t('subscriptionSpec.contactSupport')}
            </button>
          </p>
        </div>
      </div>
    </Layout>
  );
}
