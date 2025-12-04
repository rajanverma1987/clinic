/**
 * React Hook for Feature Access Checking
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';

export function useFeatures() {
  const { user } = useAuth();
  const [features, setFeatures] = useState([]);
  const [limits, setLimits] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.tenantId) {
      fetchFeatures();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchFeatures = async () => {
    try {
      const response = await apiClient.get('/features');
      if (response.success && response.data) {
        setFeatures(response.data.features || []);
        setLimits(response.data.limits || {});
      }
    } catch (error) {
      console.error('Failed to fetch features:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature) => {
    if (user?.role === 'super_admin') return true;
    return features.includes(feature);
  };

  const hasAnyFeature = (requiredFeatures) => {
    if (user?.role === 'super_admin') return true;
    if (requiredFeatures.length === 0) return true;
    return requiredFeatures.some(feature => features.includes(feature));
  };

  const hasAllFeatures = (requiredFeatures) => {
    if (user?.role === 'super_admin') return true;
    if (requiredFeatures.length === 0) return true;
    return requiredFeatures.every(feature => features.includes(feature));
  };

  return {
    features,
    limits,
    loading,
    hasFeature,
    hasAnyFeature,
    hasAllFeatures,
    refresh: fetchFeatures,
  };
}

