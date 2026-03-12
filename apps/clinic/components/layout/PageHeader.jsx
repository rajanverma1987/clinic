'use client';

import { RefreshCwIcon, SearchIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAppNotifications } from '@/contexts/AppNotificationsContext';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useState } from 'react';

/** Normalize actionButtons to an array so we always render the same way. */
function toActionsList(actionButtons) {
  if (actionButtons == null) return [];
  return Array.isArray(actionButtons) ? actionButtons : [actionButtons];
}

/**
 * PageHeader – enterprise-level sticky header.
 * Left: page title + meta inline. Right: search pill | refresh | actions | theme | lang | bell.
 * onOpenSearch is owned by Layout to keep a single GlobalSearch instance.
 */
export function PageHeader({
  title,
  subtitle,
  description,
  actionButton,
  actionButtons,
  icon,
  notifications: notificationsProp = [],
  unreadCount: unreadCountProp = 0,
  onNotificationClick: onNotificationClickProp,
  onMarkAsRead: onMarkAsReadProp,
  onMarkAllAsRead: onMarkAllAsReadProp,
  onRefresh,
  refreshing = false,
  showNotifications = true,
  onOpenNotifications,
  onOpenSearch,
  showLanguageSwitcher = true,
  showSearch = true,
  className = '',
  variant = 'default',
}) {
  const { t } = useI18n();
  const { isDark } = useTheme();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [defaultRefreshing, setDefaultRefreshing] = useState(false);
  const actionsList = toActionsList(actionButtons);

  // Use context notifications if props are empty
  const appNotifications = useAppNotifications();
  const useContextNotifications = notificationsProp.length === 0 && unreadCountProp === 0;

  const notifications = useContextNotifications
    ? appNotifications.notifications
    : notificationsProp;
  const unreadCount = useContextNotifications ? appNotifications.unreadCount : unreadCountProp;
  const onNotificationClick =
    onNotificationClickProp ||
    ((notification) => {
      if (notification.type === 'appointment') {
        router.push('/appointments');
      } else if (notification.type === 'inventory') {
        router.push('/inventory');
      }
      if (useContextNotifications) {
        appNotifications.markAsRead(notification.id);
      }
    });
  const onMarkAsRead =
    onMarkAsReadProp || (useContextNotifications ? appNotifications.markAsRead : undefined);
  const onMarkAllAsRead =
    onMarkAllAsReadProp || (useContextNotifications ? appNotifications.markAllAsRead : undefined);

  const handleRefresh = useCallback(() => {
    if (typeof onRefresh === 'function') {
      onRefresh();
    } else {
      setDefaultRefreshing(true);
      router.refresh();
      setTimeout(() => setDefaultRefreshing(false), 800);
    }
  }, [onRefresh, router]);

  const isRefreshing = typeof onRefresh === 'function' ? refreshing : defaultRefreshing;

  useEffect(() => {
    const el = document.querySelector('[data-main-scroll]');
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 4);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const isDashboard = variant === 'dashboard';
  const hasActions = actionButton != null || actionsList.length > 0;

  const meta = subtitle || description;

  return (
    <header
      role='banner'
      className={`page-header ${isDashboard ? 'page-header--dashboard' : ''} ${
        scrolled ? 'page-header--scrolled' : ''
      } ${className}`}
      style={
        isDashboard
          ? { marginBottom: 0 }
          : { marginBottom: 'var(--dashboard-element-gap, var(--space-6, 24px))' }
      }
    >
      <div className='page-header__bar'>
        <div className='page-header__title-block'>
          {icon && (
            <span className='page-header__icon' aria-hidden>
              {icon}
            </span>
          )}
          <div className='page-header__title-wrap'>
            <h1 className='page-header__title'>{title}</h1>
            {meta && <p className='page-header__subtitle'>{meta}</p>}
          </div>
        </div>

        <div className='page-header__tools'>
          {showSearch && (
            <Button
              type='button'
              variant='ghost'
              onClick={onOpenSearch ?? (() => window.dispatchEvent(new CustomEvent('openSearch')))}
              className='page-header__search'
              aria-label={t('common.ariaLabelSearch')}
            >
              <SearchIcon className='page-header__search-icon' ariaHidden />
              <span className='page-header__search-text'>
                {t('common.searchPlaceholder') || 'Search...'}
              </span>
            </Button>
          )}

          <Button
            type='button'
            variant='ghost'
            onClick={handleRefresh}
            disabled={isRefreshing}
            className='page-header__btn'
            title={isRefreshing ? t('common.updating') : t('common.refresh')}
            aria-label={isRefreshing ? t('common.updating') : t('common.refresh')}
            aria-busy={isRefreshing}
          >
            <RefreshCwIcon
              className={`icon icon-md ${isRefreshing ? 'animate-spin' : ''}`}
              ariaHidden
            />
          </Button>

          {hasActions && (
            <>
              <span className='page-header__divider' aria-hidden />
              {actionButton && <div className='page-header__actions'>{actionButton}</div>}
              {actionsList.map((btn, i) => (
                <Fragment key={i}>{btn}</Fragment>
              ))}
            </>
          )}

          <span className='page-header__divider' aria-hidden />

          <div className='page-header__utils'>
            <ThemeToggle size='sm' />
            {showLanguageSwitcher && (
              <LanguageSwitcher variant={isDark ? 'dark' : 'light'} size='sm' />
            )}
            {showNotifications && (
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                onNotificationClick={onNotificationClick}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                onOpenPanel={onOpenNotifications}
                size='sm'
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
