import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for fetching doctor-specific dashboard statistics
 * Filters data by doctor's userId
 */
export function useDoctorDashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!user || user.role !== 'doctor') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use optimized single API call instead of 8+ separate calls
      // This reduces API calls from 8+ to just 1, dramatically improving performance
      const response = await apiClient.get('/doctors/dashboard');
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch dashboard stats');
      }
    } catch (err) {
      console.error('Failed to fetch doctor dashboard stats:', err);
      setError(err);
      // Set default stats on error
      setStats({
        totalPatients: 0,
        todayAppointments: 0,
        pendingReviews: 0,
        patientsWaiting: 0,
        completedConsultations: 0,
        revenue: 0,
        earningsToday: 0,
        revenueTrend: 0,
        appointmentsTrend: 0,
        patientsTrend: 0,
        averageRating: 0,
        totalReviews: 0,
        responseRate: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { stats, loading, error, fetchStats };
}
