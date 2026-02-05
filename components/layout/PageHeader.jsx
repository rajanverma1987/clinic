'use client';

import { RefreshCwIcon, SearchIcon } from '@/components/icons';
import GlobalSearch from '@/components/search/GlobalSearch';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Fragment, useEffect, useState } from 'react';

/** Normalize actionButtons to an array so we always render the same way (array or single node). */
function toActionsList(actionButtons) {
  if (actionButtons == null) return [];
  return Array.isArray(actionButtons) ? actionButtons : [actionButtons];
}

/**
 * PageHeader – sticky header for dashboard pages
 * Sticks to top of scroll area, shows elevation shadow when scrolled
 * actionButtons: array of React nodes, or a single node (both supported)
 */
export function PageHeader({
  title,
  subtitle,
  description,
  actionButton,
  actionButtons,
  breadcrumbs,
  icon,
  notifications = [],
  unreadCount = 0,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh,
  showNotifications = true,
  showLanguageSwitcher = true,
  showSearch = true,
  className = '',
}) {
  const { t } = useI18n();
  const { isDark } = useTheme();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const actionsList = toActionsList(actionButtons);
  const hasQuickActions =
    showSearch || actionButton || actionsList.length > 0 || typeof onRefresh === 'function';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const el = document.querySelector('[data-main-scroll]');
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 4);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      role='banner'
      className={`sticky-header-bar ${scrolled ? 'header-scrolled' : ''} ${className}`}
      style={{ marginBottom: 'var(--dashboard-element-gap, 16px)' }}
    >
      <div className='sticky-header-bar__inner'>
        <div className='sticky-header-bar__left'>
          {icon && (
            <div
              className='text-primary-600 flex items-center justify-center shrink-0'
              style={{ width: 24, height: 24 }}
            >
              {icon}
            </div>
          )}
          <div className='min-w-0'>
            <h1 className='sticky-header-bar__title'>{title}</h1>
            {(subtitle || description) && (
              <div className='sticky-header-bar__meta'>{subtitle || description}</div>
            )}
          </div>
        </div>

        <div className='sticky-header-bar__right'>
          {/* Quick Action: search + page actions */}
          <div className='sticky-header-bar__right-group'>
            {showSearch && (
              <div className='header-control-box header-control-box--icon'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowSearchModal(true)}
                  title='Search (Ctrl+K)'
                  className='header-search-trigger'
                  aria-label='Search'
                >
                  <SearchIcon className='icon icon-sm' ariaHidden />
                </Button>
              </div>
            )}
            {typeof onRefresh === 'function' && (
              <div className='header-control-box header-control-box--icon'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={onRefresh}
                  title={t('common.refresh')}
                  aria-label={t('common.refresh')}
                >
                  <RefreshCwIcon className='icon icon-sm' ariaHidden />
                </Button>
              </div>
            )}
            {(actionButton || actionsList.length > 0) && (
              <>
                <span className='sticky-header-bar__pipe' aria-hidden />
                {actionButton && (
                  <div className='flex items-center gap-3 min-w-0'>{actionButton}</div>
                )}
                {actionsList.length > 0 && (
                  <div className='flex items-center gap-2'>
                    {actionsList.map((btn, i) => (
                      <Fragment key={i}>{btn}</Fragment>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {hasQuickActions || showLanguageSwitcher ? (
            <span className='sticky-header-bar__pipe' aria-hidden />
          ) : null}
          <div className='sticky-header-bar__right-group'>
            <div className='header-control-box header-control-box--icon'>
              <ThemeToggle size='sm' />
            </div>
          </div>
          {showLanguageSwitcher && (
            <div className='sticky-header-bar__right-group'>
              <div className='header-control-box'>
                <LanguageSwitcher variant={isDark ? 'dark' : 'light'} size='sm' />
              </div>
            </div>
          )}
          {showLanguageSwitcher && showNotifications ? (
            <span className='sticky-header-bar__pipe' aria-hidden />
          ) : null}
          {showNotifications && (
            <div className='sticky-header-bar__right-group'>
              <div className='header-control-box header-control-box--icon'>
                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onNotificationClick={onNotificationClick}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAllAsRead={onMarkAllAsRead}
                  size='sm'
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          items={breadcrumbs.map((c) => ({
            label: c.label,
            href: c.href,
            onClick: c.onClick,
          }))}
        />
      )}
      <GlobalSearch isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </header>
  );
}
