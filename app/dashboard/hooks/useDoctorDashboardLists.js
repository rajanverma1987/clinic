import { apiClient } from '@/lib/api/client';
import { useCallback, useState } from 'react';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for fetching doctor-specific dashboard lists
 * Filters all data by doctor's doctorId
 */
export function useDoctorDashboardLists() {
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [newPatientRequests, setNewPatientRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardLists = useCallback(async () => {
    if (!user || user.role !== 'doctor') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get doctor profile to get doctorId
      if (!doctorId) {
        const doctorResponse = await apiClient.get(`/doctors/user/${user._id}`);
        if (doctorResponse.success && doctorResponse.data) {
          setDoctorId(doctorResponse.data._id);
        } else {
          throw new Error('Doctor profile not found');
        }
      }

      const currentDoctorId = doctorId || (await apiClient.get(`/doctors/user/${user._id}`)).data._id;

      // Fetch today's appointments for this doctor
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResponse = await apiClient.get(
        `/appointments?doctorId=${currentDoctorId}&date=${today}&limit=10&sortBy=startTime&sortOrder=asc`
      );
      const fetchedAppointments = extractArrayData(appointmentsResponse);
      setTodayAppointments(Array.isArray(fetchedAppointments) ? fetchedAppointments.slice(0, 10) : []);

      // Fetch upcoming appointments (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const upcomingResponse = await apiClient.get(
        `/appointments?doctorId=${currentDoctorId}&startDate=${today}&endDate=${nextWeek.toISOString().split('T')[0]}&limit=10&sortBy=startTime&sortOrder=asc`
      );
      const upcomingData = extractArrayData(upcomingResponse);
      setUpcomingAppointments(Array.isArray(upcomingData) ? upcomingData.slice(0, 10) : []);

      // Fetch recent patients (patients seen by this doctor)
      try {
        const patientsResponse = await apiClient.get(
          `/patients?doctorId=${currentDoctorId}&limit=10&sortBy=createdAt&sortOrder=desc`
        );
        const patientsData = extractArrayData(patientsResponse, 'patients');
        setRecentPatients(Array.isArray(patientsData) ? patientsData.slice(0, 10) : []);
      } catch (err) {
        console.error('Failed to fetch recent patients:', err);
        setRecentPatients([]);
      }

      // Fetch pending reviews (completed appointments without clinical notes)
      try {
        const reviewsResponse = await apiClient.get(
          `/appointments?doctorId=${currentDoctorId}&status=completed&hasClinicalNote=false&limit=10&sortBy=appointmentDate&sortOrder=desc`
        );
        const reviewsData = extractArrayData(reviewsResponse);
        setPendingReviews(Array.isArray(reviewsData) ? reviewsData.slice(0, 10) : []);
      } catch (err) {
        console.error('Failed to fetch pending reviews:', err);
        setPendingReviews([]);
      }

      // Fetch new patient requests (pending appointments)
      try {
        const requestsResponse = await apiClient.get(
          `/appointments?doctorId=${currentDoctorId}&status=pending&limit=10&sortBy=createdAt&sortOrder=desc`
        );
        const requestsData = extractArrayData(requestsResponse);
        setNewPatientRequests(Array.isArray(requestsData) ? requestsData.slice(0, 10) : []);
      } catch (err) {
        console.error('Failed to fetch new patient requests:', err);
        setNewPatientRequests([]);
      }
    } catch (err) {
      console.error('Failed to fetch doctor dashboard lists:', err);
      setError(err);
      // Set default values
      setTodayAppointments([]);
      setRecentPatients([]);
      setUpcomingAppointments([]);
      setPendingReviews([]);
      setNewPatientRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user, doctorId]);

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
