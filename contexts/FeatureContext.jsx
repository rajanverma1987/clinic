'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { apiClient } from '@/lib/api/client.js';

const FeatureContext = createContext(undefined);

export function FeatureProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [features, setFeatures] = useState([]);
  const [limits, setLimits] = useState({});
  const [subscription, setSubscription] = useState(null);
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
      const response = await apiClient.get('/features');

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

  const hasFeature = (featureName) => {
    if (features.includes('*')) return true; // Super admin
    return features.includes(featureName);
  };

  const hasAnyFeature = (featureNames) => {
    if (features.includes('*')) return true; // Super admin
    return featureNames.some(feature => features.includes(feature));
  };

  const hasAllFeatures = (featureNames) => {
    if (features.includes('*')) return true; // Super admin
    return featureNames.every(feature => features.includes(feature));
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

