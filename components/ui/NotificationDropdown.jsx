'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './NotificationDropdown.css';

/**
 * NotificationDropdown Component
 * Displays a bell icon with notification count and dropdown menu
 * Similar structure to LanguageSwitcher for consistency
 */
export function NotificationDropdown({
  notifications = [],
  unreadCount = 0,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  size = 'md',
}) {
  // Ensure notifications is always an array
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  const isSmall = size === 'sm';

  // Ensure component is mounted (for portal)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    const updatePosition = () => {
      if (!dropdownRef.current) return;

      const rect = dropdownRef.current.getBoundingClientRect();
      const dropdownWidth = 360;
      const dropdownHeight = 400;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const spaceOnRight = viewportWidth - rect.right;
      const spaceOnLeft = rect.left;
      const spaceOnBottom = viewportHeight - rect.bottom;
      const spaceOnTop = rect.top;
      const padding = 16;

      // Calculate position - always align to the right edge of the button
      // Ensure dropdown stays within viewport bounds
      let leftPosition = rect.right - dropdownWidth;

      // If it would go off the left edge, align to left edge instead
      if (leftPosition < padding) {
        leftPosition = rect.left;
      }

      // If it would go off the right edge, align to right edge of viewport
      if (leftPosition + dropdownWidth > viewportWidth - padding) {
        leftPosition = viewportWidth - dropdownWidth - padding;
      }

      const alignBottom =
        spaceOnBottom >= dropdownHeight + padding || spaceOnTop < dropdownHeight + padding;

      setDropdownStyle({
        position: 'fixed',
        zIndex: 10050,
        left: `${leftPosition}px`,
        right: 'auto',
        ...(alignBottom
          ? {
              top: `${rect.bottom + 12}px`,
              bottom: 'auto',
            }
          : {
              bottom: `${viewportHeight - rect.top + 12}px`,
              top: 'auto',
            }),
      });
    };

    // Initial position
    updatePosition();

    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleNotificationClick = (notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    if (notification.unread && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notificationDate.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment':
        return (
          <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
        );
      case 'prescription':
        return (
          <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
        );
      case 'reminder':
        return (
          <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        );
      case 'system':
      default:
        return (
          <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        );
    }
  };

  const buttonClasses = [
    'NotificationDropdown-button',
    isSmall ? 'NotificationDropdown-button--sm' : 'NotificationDropdown-button--md',
    isOpen ? 'is-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const dropdownContent =
    isOpen && mounted ? (
      <>
        {/* Backdrop */}
        <div
          className='NotificationDropdown-backdrop'
          onClick={() => setIsOpen(false)}
          onMouseDown={(e) => e.preventDefault()}
          aria-hidden='true'
        />
        {/* Dropdown Menu */}
        <div
          className='NotificationDropdown-dropdown'
          ref={dropdownMenuRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={dropdownStyle}
        >
          {/* Header */}
          <div className='NotificationDropdown-header'>
            <h3 className='NotificationDropdown-title'>Notifications</h3>
            {unreadCount > 0 && (
              <button
                type='button'
                onClick={handleMarkAllAsRead}
                className='NotificationDropdown-mark-all'
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className='NotificationDropdown-list'>
            {safeNotifications.length === 0 ? (
              <div className='NotificationDropdown-empty'>
                <svg
                  className='NotificationDropdown-empty-icon'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                  />
                </svg>
                <p className='NotificationDropdown-empty-text'>No notifications</p>
                <p className='NotificationDropdown-empty-subtext'>You&apos;re all caught up!</p>
              </div>
            ) : (
              safeNotifications.map((notification) => {
                const itemClasses = [
                  'NotificationDropdown-item',
                  notification.unread ? 'is-unread' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <button
                    key={notification.id}
                    type='button'
                    onClick={() => handleNotificationClick(notification)}
                    className={itemClasses}
                  >
                    <div className='NotificationDropdown-item-icon'>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className='NotificationDropdown-item-content'>
                      <div className='NotificationDropdown-item-title'>{notification.title}</div>
                      <div className='NotificationDropdown-item-message'>
                        {notification.message}
                      </div>
                      <div className='NotificationDropdown-item-time'>
                        {formatTime(notification.createdAt)}
                      </div>
                    </div>
                    {notification.unread && <div className='NotificationDropdown-item-dot'></div>}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {safeNotifications.length > 0 && (
            <div className='NotificationDropdown-footer'>
              <button
                type='button'
                onClick={() => setIsOpen(false)}
                className='NotificationDropdown-view-all'
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      </>
    ) : null;

  return (
    <>
      <div className='NotificationDropdown' ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          type='button'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={buttonClasses}
          aria-label='Notifications'
          aria-expanded={isOpen}
        >
          <svg
            className='NotificationDropdown-icon'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
            />
          </svg>
          {/* Badge */}
          {unreadCount > 0 && (
            <span className='NotificationDropdown-badge'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Render dropdown via portal to document.body */}
      {mounted && dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
}
