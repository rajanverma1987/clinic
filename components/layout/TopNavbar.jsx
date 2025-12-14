'use client';

import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function TopNavbar() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications when user is available
  useEffect(() => {
    if (!authLoading && user) {
      // TODO: Replace with real API call
      // For now, start with empty notifications
      setNotifications([]);
      setUnreadCount(0);

      // Example API call (uncomment when ready):
      // const fetchNotifications = async () => {
      //   try {
      //     const response = await apiClient.get('/notifications');
      //     if (response.success && response.data) {
      //       setNotifications(response.data.notifications || []);
      //       setUnreadCount(response.data.unreadCount || 0);
      //     }
      //   } catch (error) {
      //     console.error('Failed to fetch notifications:', error);
      //   }
      // };
      // fetchNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [authLoading, user]);

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

  const handleMarkAsRead = (notificationId) => {
    // Mark individual notification as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, unread: false } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = () => {
    // Mark all notifications as read
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
  };

  // Don't show navbar on login/register/forgot-password pages
  const hideNavbarPages = ['/login', '/register', '/forgot-password'];
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
