'use client';

import { apiClient } from '@/lib/api/client.js';
import { isTestAccount } from '@/lib/constants/test-account.js';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

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
    },
  };
}

export function FeatureProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [features, setFeatures] = useState([]);
  const [limits, setLimits] = useState({});
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFeatures = async () => {
    if (!user || user.role === 'super_admin') {
      // Super admin = company account: full access, no subscription/plan gating
      setFeatures(['*']);
      setLimits({});
      setSubscription(null);
      setLoading(false);
      return;
    }

    // TEMPORARY: Test account gets premium access (client-side fallback). REMOVE before production.
    if (isTestAccount(user.email)) {
      const premium = getTestAccountPremiumState();
      setFeatures(premium.features);
      setLimits(premium.limits);
      setSubscription(premium.subscription);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Doctor and all clinic roles: plan-wise access (tenant subscription features)
      const response = await apiClient.get('/features');

      if (response.success && response.data) {
        setFeatures(response.data.features || []);
        setLimits(response.data.limits || {});
        setSubscription(response.data.subscription || null);
      }
    } catch (_error) {
      setFeatures([]);
      setLimits({});
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchFeatures();
    } else if (!authLoading && !user) {
      setFeatures([]);
      setLimits({});
      setSubscription(null);
      setLoading(false);
    }
  }, [authLoading, user]);

  // Refetch subscription when user returns (e.g. from PayPal or pricing) so purchase syncs to account
  useEffect(() => {
    if (!user || user.role === 'super_admin') return;
    const onFocus = () => fetchFeatures();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user]);

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
