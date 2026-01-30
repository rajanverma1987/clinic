'use client';

/**
 * Real-time Notification Center Component
 *
 * Displays notifications with real-time updates via Socket.IO
 *
 * Features:
 * - Real-time notification delivery
 * - Mark as read/unread
 * - Filter by type
 * - Click to navigate to related entity
 * - Unread count badge
 *
 * @module components/notifications/NotificationCenter
 * @since 1.0.0
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger.js';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const NOTIFICATION_TYPES = {
  APPOINTMENT: 'appointment',
  PRESCRIPTION: 'prescription',
  PAYMENT: 'payment',
  LAB_RESULT: 'lab_result',
  SYSTEM: 'system',
};

const TYPE_ICONS = {
  [NOTIFICATION_TYPES.APPOINTMENT]: '📅',
  [NOTIFICATION_TYPES.PRESCRIPTION]: '💊',
  [NOTIFICATION_TYPES.PAYMENT]: '💰',
  [NOTIFICATION_TYPES.LAB_RESULT]: '🧪',
  [NOTIFICATION_TYPES.SYSTEM]: '🔔',
};

export function NotificationCenter({ isOpen, onClose, unreadCount: externalUnreadCount, onUnreadCountChange }) {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, appointment, prescription, etc.
  const socketRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Real-time Socket.IO connection
  useEffect(() => {
    if (!user?.tenantId) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    const socket = io(`${socketUrl}/realtime`, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      logger.info('[Notifications] Socket connected');
      if (user.tenantId) {
        socket.emit('join-tenant', user.tenantId);
      }
    });

    // Listen for new notifications
    socket.on('notification.new', (notification) => {
      logger.info('[Notifications] New notification received', notification);
      setNotifications((prev) => [notification, ...prev]);
      if (onUnreadCountChange) {
        onUnreadCountChange((prev) => (prev || 0) + 1);
      }
    });

    // Listen for notification updates
    socket.on('notification.updated', (updatedNotification) => {
      setNotifications((prev) =>
        prev.map((n) => (n._id === updatedNotification._id ? updatedNotification : n))
      );
    });

    socket.on('disconnect', () => {
      logger.info('[Notifications] Socket disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user?.tenantId, onUnreadCountChange]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/notifications?limit=50&sortBy=createdAt&sortOrder=desc');
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (err) {
      logger.error('Failed to fetch notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId
            ? { ...n, channels: { ...n.channels, inApp: { ...n.channels?.inApp, read: true } } }
            : n
        )
      );
      if (onUnreadCountChange) {
        onUnreadCountChange((prev) => Math.max(0, (prev || 0) - 1));
      }
    } catch (err) {
      logger.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.post('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          channels: { ...n.channels, inApp: { ...n.channels?.inApp, read: true } }
        }))
      );
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
    } catch (err) {
      logger.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    await handleMarkAsRead(notification._id);

    // Navigate to related entity
    if (notification.data?.appointmentId) {
      router.push(`/appointments/${notification.data.appointmentId}`);
      onClose();
    } else if (notification.data?.prescriptionId) {
      router.push(`/prescriptions/${notification.data.prescriptionId}`);
      onClose();
    } else if (notification.data?.invoiceId) {
      router.push(`/invoices/${notification.data.invoiceId}`);
      onClose();
    } else if (notification.data?.patientId) {
      router.push(`/patients/${notification.data.patientId}`);
      onClose();
    }
  };

  const unreadCount = notifications.filter((n) => !n.channels?.inApp?.read).length;
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.channels?.inApp?.read;
    return n.type === filter;
  });

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-neutral-600/25 dark:bg-black/40 z-50 flex items-start justify-end pt-16 pr-4'>
      <Card className='w-full max-w-md shadow-2xl'>
        <div className='p-4 border-b border-neutral-200 dark:border-neutral-600 flex items-center justify-between'>
          <h2 className='text-lg font-bold text-neutral-900 dark:text-neutral-100'>
            Notifications {unreadCount > 0 && (
              <span className='ml-2 px-2 py-1 bg-primary-600 text-white text-xs rounded-full'>
                {unreadCount}
              </span>
            )}
          </h2>
          <div className='flex gap-2'>
            {unreadCount > 0 && (
              <Button variant='secondary' size='sm' onClick={handleMarkAllAsRead}>
                Mark All Read
              </Button>
            )}
            <Button
              variant='ghost'
              size='xs'
              iconOnly
              onClick={onClose}
              className='text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-xl'
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className='p-3 border-b border-neutral-200 dark:border-neutral-600 flex gap-2 overflow-x-auto'>
          <button
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
            }`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
              filter === 'unread'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
            }`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          {Object.values(NOTIFICATION_TYPES).map((type) => {
            const count = notifications.filter((n) => n.type === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
                  filter === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                }`}
                onClick={() => setFilter(type)}
              >
                {TYPE_ICONS[type]} {type.replace('_', ' ')} ({count})
              </button>
            );
          })}
        </div>

        <div className='max-h-96 overflow-y-auto'>
          {loading ? (
            <div className='p-8 text-center'>
              <Loader size='sm' inline />
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className='divide-y divide-neutral-200 dark:divide-neutral-600'>
              {filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors ${
                    !notification.channels?.inApp?.read ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className='flex items-start gap-3'>
                    <div className='text-2xl'>{TYPE_ICONS[notification.type] || '🔔'}</div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <p className='font-medium text-neutral-900 dark:text-neutral-100'>{notification.title}</p>
                        {!notification.channels?.inApp?.read && (
                          <div className='w-2 h-2 rounded-full bg-primary-600 flex-shrink-0 mt-1'></div>
                        )}
                      </div>
                      <p className='text-sm text-neutral-600 dark:text-neutral-400 mt-1'>{notification.message}</p>
                      <div className='flex items-center gap-2 mt-2'>
                        <p className='text-xs text-neutral-500 dark:text-neutral-400'>
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        {notification.priority && (
                          <Tag
                            className={
                              notification.priority === 'urgent'
                                ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                                : notification.priority === 'high'
                                ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200'
                                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                            }
                          >
                            {notification.priority}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='p-8 text-center text-neutral-500 dark:text-neutral-400'>
              <p>No notifications</p>
              {filter !== 'all' && (
                <p className='text-xs mt-2'>Try changing the filter</p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
