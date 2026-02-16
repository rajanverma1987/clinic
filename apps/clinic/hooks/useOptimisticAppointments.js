/**
 * Hook for optimistic UI updates for appointments
 * Updates UI immediately before API calls complete, providing instant feedback.
 */

import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useCallback, useState } from 'react';

/**
 * Hook for optimistic appointment operations
 * @param {Array} initialAppointments - Initial appointments array
 * @returns {Object} { appointments, setAppointments, createAppointment, updateAppointment, deleteAppointment }
 */
export function useOptimisticAppointments(initialAppointments = []) {
  const { t } = useI18n();
  const [appointments, setAppointments] = useState(initialAppointments);

  /**
   * Create appointment with optimistic update
   */
  const createAppointment = useCallback(async (data) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticAppointment = {
      ...data,
      _id: tempId,
      _pending: true,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update - add to beginning of list
    setAppointments((prev) => [optimisticAppointment, ...prev]);

    try {
      const response = await apiClient.post('/appointments', data);

      if (response.success && response.data) {
        const createdAppointment = response.data.data || response.data;

        // Replace temp with real data
        setAppointments((prev) => prev.map((a) => (a._id === tempId ? createdAppointment : a)));

        showSuccess(t('appointments.createdSuccess'));
        return createdAppointment;
      } else {
        throw new Error(response.error?.message || 'Failed to create appointment');
      }
    } catch (error) {
      // Rollback on error
      setAppointments((prev) => prev.filter((a) => a._id !== tempId));
      logger.error('Failed to create appointment', error);
      showError(t('appointments.createFailed'));
      throw error;
    }
  }, []);

  /**
   * Update appointment with optimistic update
   */
  const updateAppointment = useCallback(
    async (id, data) => {
      // Store original for rollback
      const originalAppointment = appointments.find((a) => a._id === id);

      if (!originalAppointment) {
        throw new Error('Appointment not found');
      }

      // Optimistic update
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, ...data, _pending: true } : a)),
      );

      try {
        const response = await apiClient.patch(`/appointments/${id}`, data);

        if (response.success && response.data) {
          const updatedAppointment = response.data.data || response.data;

          // Replace with server data
          setAppointments((prev) => prev.map((a) => (a._id === id ? updatedAppointment : a)));

          showSuccess(t('appointments.updateSuccess'));
          return updatedAppointment;
        } else {
          throw new Error(response.error?.message || 'Failed to update appointment');
        }
      } catch (error) {
        // Rollback on error
        if (originalAppointment) {
          setAppointments((prev) => prev.map((a) => (a._id === id ? originalAppointment : a)));
        }
        logger.error('Failed to update appointment', error);
        showError(t('appointments.updateFailed'));
        throw error;
      }
    },
    [appointments],
  );

  /**
   * Delete appointment with optimistic update
   */
  const deleteAppointment = useCallback(
    async (id) => {
      const originalAppointments = [...appointments];

      // Optimistic delete
      setAppointments((prev) => prev.filter((a) => a._id !== id));

      try {
        const response = await apiClient.delete(`/appointments/${id}`);

        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to delete appointment');
        }

        showSuccess(t('appointments.deleteSuccess'));
      } catch (error) {
        // Rollback on error
        setAppointments(originalAppointments);
        logger.error('Failed to delete appointment', error);
        showError(t('appointments.deleteFailed'));
        throw error;
      }
    },
    [appointments],
  );

  return {
    appointments,
    setAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
}
