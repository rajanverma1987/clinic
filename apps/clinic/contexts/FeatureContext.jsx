'use client';

import { apiClient } from '@/lib/api/client.js';
import { isTestAccount } from '@/lib/constants/test-account.js';
import { createContext, useContext, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useAuth } from './AuthContext.jsx';

const FEATURES_KEY = '/api/features';
const featuresFetcher = async () => {
  const res = await apiClient.get('/features');
  if (!res?.success || !res?.data) throw new Error('Features fetch failed');
  return res.data;
};

const FeatureContext = createContext(undefined);

/** TEMPORARY: Premium subscription for test account UI. REMOVE before production. */
function getTestAccountPremiumState() {
  const farFuture = new Date();
  farFuture.setFullYear(farFuture.getFullYear() + 1);
  return {
    features: ['*'],
    limits: { maxUsers: 500, maxPatients: 500000, maxStorageGB: 5000 },
    subscription: {
      status: 'ACTIVE',
      currentPeriodEnd: farFuture.toISOString(),
      trialDaysRemaining: null,
      paypalApprovalUrl: null,
      addons: [
        { addonKey: 'aiAssist' },
        { addonKey: 'advancedAnalytics' },
        { addonKey: 'automationPro' },
        { addonKey: 'apiIntegration' },
      ],
    },
  };
}

export function FeatureProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [features, setFeatures] = useState([]);
  const [limits, setLimits] = useState({});
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const swrKey =
    user?.tenantId && user?.role !== 'super_admin' && !isTestAccount(user?.email)
      ? FEATURES_KEY
      : null;
  const {
    data: featuresData,
    isLoading: featuresLoading,
    mutate,
  } = useSWR(swrKey, featuresFetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setFeatures([]);
      setLimits({});
      setSubscription(null);
      setLoading(false);
      return;
    }
    if (!authLoading && user?.role === 'super_admin') {
      setFeatures(['*']);
      setLimits({});
      setSubscription(null);
      setLoading(false);
      return;
    }
    if (!authLoading && user && isTestAccount(user.email)) {
      const premium = getTestAccountPremiumState();
      setFeatures(premium.features);
      setLimits(premium.limits);
      setSubscription(premium.subscription);
      setLoading(false);
      return;
    }
    if (!authLoading && user && swrKey) {
      setLoading(featuresLoading);
      if (featuresData) {
        setFeatures(featuresData.features || []);
        setLimits(featuresData.limits || {});
        setSubscription(featuresData.subscription ?? null);
      } else if (!featuresLoading) {
        setFeatures([]);
        setLimits({});
        setSubscription(null);
      }
    }
  }, [authLoading, user, swrKey, featuresData, featuresLoading]);

  const fetchFeatures = async () => {
    if (swrKey) await mutate();
  };

  // Refetch subscription when user returns (e.g. from PayPal or pricing); SWR deduping avoids hammering API
  useEffect(() => {
    if (!user || user.role === 'super_admin') return;
    const onFocus = () => mutate();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, mutate]);

  const hasFeature = (featureName) => {
    if (features.includes('*')) return true; // Super admin
    return features.includes(featureName);
  };

  const hasAnyFeature = (featureNames) => {
    if (features.includes('*')) return true; // Super admin
    return featureNames.some((feature) => features.includes(feature));
  };

  const hasAllFeatures = (featureNames) => {
    if (features.includes('*')) return true; // Super admin
    return featureNames.every((feature) => features.includes(feature));
  };

  /** Check if tenant has a subscription add-on (e.g. aiAssist for AI Assistance). */
  const hasAddon = (addonKey) => {
    if (features.includes('*')) return true; // Super admin
    const list = subscription?.addons;
    return Array.isArray(list) && list.some((a) => a.addonKey === addonKey);
  };

  const checkLimit = (limitType, currentCount) => {
    let limit;
    switch (limitType) {
      case 'users':
        limit = limits.maxUsers;
        break;
      case 'patients':
        limit = limits.maxPatients;
        break;
      case 'storage':
        limit = limits.maxStorageGB;
        break;
    }

    // If no limit is set, allow unlimited
    if (limit === undefined) {
      return true;
    }

    return currentCount < limit;
  };

  const refreshFeatures = async () => {
    await fetchFeatures();
  };

  return (
    <FeatureContext.Provider
      value={{
        features,
        limits,
        subscription,
        loading,
        hasFeature,
        hasAnyFeature,
        hasAllFeatures,
        hasAddon,
        checkLimit,
        refreshFeatures,
      }}
    >
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeatures() {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
}
