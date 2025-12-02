'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '@/lib/api/client';

interface SubscriptionInfo {
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED' | 'PENDING' | null;
  currentPeriodEnd?: string;
  trialDaysRemaining?: number;
  paypalApprovalUrl?: string;
}

interface FeatureContextType {
  features: string[];
  limits: {
    maxUsers?: number;
    maxPatients?: number;
    maxStorageGB?: number;
  };
  subscription: SubscriptionInfo | null;
  loading: boolean;
  hasFeature: (featureName: string) => boolean;
  hasAnyFeature: (featureNames: string[]) => boolean;
  hasAllFeatures: (featureNames: string[]) => boolean;
  checkLimit: (limitType: 'users' | 'patients' | 'storage', currentCount: number) => boolean;
  refreshFeatures: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export function FeatureProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [features, setFeatures] = useState<string[]>([]);
  const [limits, setLimits] = useState<{
    maxUsers?: number;
    maxPatients?: number;
    maxStorageGB?: number;
  }>({});
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFeatures = async () => {
    if (!user || user.role === 'super_admin') {
      // Super admin has all features
      setFeatures(['*']);
      setLimits({});
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get<{
        features: string[];
        limits: {
          maxUsers?: number;
          maxPatients?: number;
          maxStorageGB?: number;
        };
        subscription?: SubscriptionInfo | null;
      }>('/features');

      if (response.success && response.data) {
        setFeatures(response.data.features || []);
        setLimits(response.data.limits || {});
        setSubscription(response.data.subscription || null);
      }
    } catch (error) {
      console.error('Failed to fetch features:', error);
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

  const hasFeature = (featureName: string): boolean => {
    if (features.includes('*')) return true; // Super admin
    return features.includes(featureName);
  };

  const hasAnyFeature = (featureNames: string[]): boolean => {
    if (features.includes('*')) return true; // Super admin
    return featureNames.some(feature => features.includes(feature));
  };

  const hasAllFeatures = (featureNames: string[]): boolean => {
    if (features.includes('*')) return true; // Super admin
    return featureNames.every(feature => features.includes(feature));
  };

  const checkLimit = (
    limitType: 'users' | 'patients' | 'storage',
    currentCount: number
  ): boolean => {
    let limit: number | undefined;
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

