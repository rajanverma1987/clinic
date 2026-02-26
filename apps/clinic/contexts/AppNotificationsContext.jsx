'use client';

/**
 * App Notifications Context
 * Provides centralized notification data for the bell icon dropdown
 * Fetches low stock items and today's appointments
 */

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AppNotificationsContext = createContext(undefined);

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function AppNotificationsProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user || authLoading) return;

    setLoading(true);
    try {
      const notifs = [];

      // Fetch low stock items
      const lowStockRes = await apiClient.get('/inventory/items?lowStock=true&limit=10');
      if (lowStockRes.success && lowStockRes.data) {
        const lowStockItems = Array.isArray(lowStockRes.data) 
          ? lowStockRes.data 
          : lowStockRes.data.data || [];
        
        lowStockItems.forEach((item, index) => {
          const qty = item.availableQuantity || 0;
          const unit = item.unit || t('common.units');
          notifs.push({
            id: `low-stock-${item._id || index}`,
            type: 'inventory',
            title: t('notifications.lowStockAlert'),
            message: t('notifications.lowStockMessage', {
              name: item.name,
              quantity: qty,
              unit,
            }),
            unread: true,
            createdAt: new Date().toISOString(),
            data: { itemId: item._id },
          });
        });
      }

      // Fetch today's appointments
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const appointmentsRes = await apiClient.get(`/appointments?date=${dateStr}&limit=20`);
      if (appointmentsRes.success && appointmentsRes.data) {
        const appointments = Array.isArray(appointmentsRes.data) 
          ? appointmentsRes.data 
          : appointmentsRes.data.data || [];
        
        // Filter upcoming appointments (within next 2 hours)
        const now = new Date();
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        
        const upcomingAppointments = appointments.filter((apt) => {
          const aptTime = new Date(apt.appointmentDate || apt.date);
          return aptTime >= now && aptTime <= twoHoursLater && apt.status !== 'completed' && apt.status !== 'cancelled';
        });

        upcomingAppointments.forEach((apt, index) => {
          const aptTime = new Date(apt.appointmentDate || apt.date);
          const timeStr = aptTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const patientName = apt.patient?.name || apt.patientName || t('common.patient');
          notifs.push({
            id: `appointment-${apt._id || index}`,
            type: 'appointment',
            title: t('notifications.upcomingAppointment'),
            message: t('notifications.appointmentAt', { name: patientName, time: timeStr }),
            unread: true,
            createdAt: new Date().toISOString(),
            data: { appointmentId: apt._id },
          });
        });

        // Also show total appointments for today
        if (appointments.length > 0) {
          const pendingCount = appointments.filter(
            (a) => a.status !== 'completed' && a.status !== 'cancelled'
          ).length;
          
          if (pendingCount > 0) {
            notifs.unshift({
              id: 'today-appointments-summary',
              type: 'appointment',
              title: t('notifications.todaysAppointments'),
              message: t('notifications.appointmentsScheduledToday', { count: pendingCount }),
              unread: true,
              createdAt: new Date().toISOString(),
              data: { count: pendingCount },
            });
          }
        }
      }

      setNotifications(notifs);
      setLastFetched(new Date());
    } catch (err) {
      logger.error('Notifications fetch failed', { message: err?.message });
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, t]);

  // Initial fetch when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      fetchNotifications();
    }
  }, [user, authLoading, fetchNotifications]);

  // Auto-refresh notifications
  useEffect(() => {
    if (!user || authLoading) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [user, authLoading, fetchNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => n.unread).length;
  }, [notifications]);

  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, unread: false } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      lastFetched,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, unreadCount, loading, lastFetched, fetchNotifications, markAsRead, markAllAsRead]
  );

  return (
    <AppNotificationsContext.Provider value={value}>{children}</AppNotificationsContext.Provider>
  );
}

export function useAppNotifications() {
  const context = useContext(AppNotificationsContext);
  if (context === undefined) {
    throw new Error('useAppNotifications must be used within an AppNotificationsProvider');
  }
  return context;
}
