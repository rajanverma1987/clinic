'use client';

import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/** Normalize API notification to dropdown shape: { id, unread, title, message, type, ... } */
function normalizeNotification(n) {
  const id = n._id?.toString() ?? n.id;
  const unread = n.channels?.inApp?.read !== true;
  return { ...n, id, unread };
}

export function TopNavbar() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        apiClient.get('/notifications'),
        apiClient.get('/notifications/unread-count'),
      ]);
      if (listRes?.success && listRes?.data?.notifications) {
        setNotifications((listRes.data.notifications || []).map(normalizeNotification));
      }
      if (countRes?.success && typeof countRes?.data?.count === 'number') {
        setUnreadCount(countRes.data.count);
      }
    } catch (err) {
      logger.warn('TopNavbar: failed to fetch notifications', err);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [authLoading, user, fetchNotifications]);

  const handleNotificationClick = (notification) => {
    // Handle notification click - navigate based on type
    if (notification.type === 'appointment') {
      router.push('/appointments');
    } else if (notification.type === 'invoice') {
      router.push('/invoices');
    } else if (notification.type === 'inventory') {
      router.push('/inventory');
    } else if (notification.type === 'lot') {
      router.push('/inventory/lots');
    } else if (notification.type === 'prescription') {
      router.push('/prescriptions');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, unread: false } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await apiClient.put(`/notifications/${notificationId}/read`, {});
    } catch (err) {
      logger.warn('TopNavbar: failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
    try {
      await apiClient.put('/notifications/read-all', {});
    } catch (err) {
      logger.warn('TopNavbar: failed to mark all as read', err);
    }
  };

  // Don't show navbar on login/register/forgot-password pages
  const hideNavbarPages = ['/login', '/forgot-password'];
  const shouldHide = hideNavbarPages.some((page) => pathname?.startsWith(page));

  if (authLoading || !user || shouldHide) {
    return null;
  }

  return (
    <div
      className='sticky top-0 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-sm'
      style={{
        height: '48px',
        minHeight: '48px',
        maxHeight: '48px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        zIndex: 1000,
        position: 'sticky',
      }}
    >
      <div className='flex items-center justify-end h-full px-4' style={{ gap: 'var(--gap-2)' }}>
        {/* Language Switcher */}
        <div
          className='bg-white/80 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md'
          style={{
            backdropFilter: 'blur(8px)',
            overflow: 'visible',
            position: 'relative',
          }}
        >
          <LanguageSwitcher variant='light' size='sm' />
        </div>

        {/* Notification Dropdown */}
        <div
          className='bg-white/80 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md'
          style={{
            backdropFilter: 'blur(8px)',
            overflow: 'visible',
            position: 'relative',
          }}
        >
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onNotificationClick={handleNotificationClick}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            size='sm'
          />
        </div>
      </div>
    </div>
  );
}
