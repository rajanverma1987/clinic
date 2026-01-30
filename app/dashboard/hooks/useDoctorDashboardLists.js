import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import * as dashboardCache from '@/lib/cache/dashboard-cache';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

/**
 * Doctor dashboard lists – parallel fetch, cache-first when returning to Dashboard.
 */
export function useDoctorDashboardLists() {
  const { user } = useAuth();
  const userId =
    user?.role === 'doctor'
      ? (user?._id ?? user?.id ?? user?.userId ?? null)
      : null;

  const [doctorId, setDoctorId] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [newPatientRequests, setNewPatientRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache-first: show last data immediately when returning to dashboard (no loading flash)
  useLayoutEffect(() => {
    if (!userId || userId === 'undefined') {
      setLoading(false);
      return;
    }
    const cached = dashboardCache.getData('doctorLists', userId);
    if (cached && typeof cached === 'object') {
      setTodayAppointments(cached.todayAppointments ?? []);
      setRecentPatients(cached.recentPatients ?? []);
      setUpcomingAppointments(cached.upcomingAppointments ?? []);
      setPendingReviews(cached.pendingReviews ?? []);
      setNewPatientRequests(cached.newPatientRequests ?? []);
      setLoading(false);
    }
  }, [userId]);

  const fetchDashboardLists = useCallback(async () => {
    const role = (user?.role || '').toLowerCase();
    if (!user || role !== 'doctor') {
      setLoading(false);
      return;
    }
    if (!userId || userId === 'undefined') {
      setLoading(false);
      return;
    }

    const cached = dashboardCache.getData('doctorLists', userId);
    const isBackgroundRevalidate = !!cached;

    try {
      if (!isBackgroundRevalidate) setLoading(true);
      setError(null);

      // Resolve doctorId (single call, required for all list URLs)
      let currentDoctorId = doctorId;
      if (!currentDoctorId && userId) {
        const doctorResponse = await apiClient.get(
          `/doctors/user/${encodeURIComponent(userId)}`
        );
        if (doctorResponse.success && doctorResponse.data) {
          currentDoctorId = doctorResponse.data._id;
          setDoctorId(currentDoctorId);
        } else {
          setLoading(false);
          return;
        }
      }

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const endDate = nextWeek.toISOString().split('T')[0];

      // Fire all list requests in parallel (one round-trip after doctorId)
      const [todayRes, upcomingRes, patientsRes, reviewsRes, requestsRes] =
        await Promise.allSettled([
          apiClient.get(
            `/appointments?doctorId=${currentDoctorId}&date=${today}&limit=10&sortBy=startTime&sortOrder=asc`
          ),
          apiClient.get(
            `/appointments?doctorId=${currentDoctorId}&startDate=${today}&endDate=${endDate}&limit=10&sortBy=startTime&sortOrder=asc`
          ),
          apiClient.get(
            `/patients?doctorId=${currentDoctorId}&limit=10&sortBy=createdAt&sortOrder=desc`
          ),
          apiClient.get(
            `/appointments?doctorId=${currentDoctorId}&status=completed&hasClinicalNote=false&limit=10&sortBy=appointmentDate&sortOrder=desc`
          ),
          apiClient.get(
            `/appointments?doctorId=${currentDoctorId}&status=pending&limit=10&sortBy=createdAt&sortOrder=desc`
          ),
        ]);

      const todayData = todayRes.status === 'fulfilled' ? extractArrayData(todayRes.value) : [];
      const todayList = Array.isArray(todayData) ? todayData.slice(0, 10) : [];
      setTodayAppointments(todayList);

      const upcomingData =
        upcomingRes.status === 'fulfilled' ? extractArrayData(upcomingRes.value) : [];
      const upcomingList = Array.isArray(upcomingData) ? upcomingData.slice(0, 10) : [];
      setUpcomingAppointments(upcomingList);

      const patientsData =
        patientsRes.status === 'fulfilled' ? extractArrayData(patientsRes.value, 'patients') : [];
      const patientsList = Array.isArray(patientsData) ? patientsData.slice(0, 10) : [];
      setRecentPatients(patientsList);

      const reviewsData =
        reviewsRes.status === 'fulfilled' ? extractArrayData(reviewsRes.value) : [];
      const reviewsList = Array.isArray(reviewsData) ? reviewsData.slice(0, 10) : [];
      setPendingReviews(reviewsList);

      const requestsData =
        requestsRes.status === 'fulfilled' ? extractArrayData(requestsRes.value) : [];
      const requestsList = Array.isArray(requestsData) ? requestsData.slice(0, 10) : [];
      setNewPatientRequests(requestsList);

      const payload = {
        todayAppointments: todayList,
        recentPatients: patientsList,
        upcomingAppointments: upcomingList,
        pendingReviews: reviewsList,
        newPatientRequests: requestsList,
      };
      dashboardCache.set('doctorLists', userId, payload);
    } catch (err) {
      // Fetch failed
      setError(err);
      setTodayAppointments([]);
      setRecentPatients([]);
      setUpcomingAppointments([]);
      setPendingReviews([]);
      setNewPatientRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user, userId, doctorId]);

  // Trigger initial fetch when no cache (otherwise loading stays true forever)
  useEffect(() => {
    if (!userId || userId === 'undefined' || (user?.role || '').toLowerCase() !== 'doctor') return;
    const cached = dashboardCache.getData('doctorLists', userId);
    if (cached && typeof cached === 'object') return; // Cache already restored by useLayoutEffect
    fetchDashboardLists();
  }, [userId, user?.role, fetchDashboardLists]);

  return {
    todayAppointments,
    recentPatients,
    upcomingAppointments,
    pendingReviews,
    newPatientRequests,
    loading,
    error,
    fetchDashboardLists,
    doctorId,
  };
}
