'use client';

import GlobalSearch from '@/components/search/GlobalSearch';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import Image from 'next/image';
import Link from 'next/link';
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
  showNotifications = true,
  showLanguageSwitcher = true,
  showSearch = true,
  className = '',
}) {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const actionsList = toActionsList(actionButtons);
  const hasQuickActions = showSearch || actionButton || actionsList.length > 0;

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
            <div className='text-primary-600 flex items-center justify-center shrink-0' style={{ width: 24, height: 24 }}>
              {icon}
            </div>
          )}
          <div className='min-w-0'>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className='text-body-xs text-neutral-500 flex items-center gap-1.5 mb-0.5' aria-label='Breadcrumb'>
                {breadcrumbs.map((crumb, index) => (
                  <span key={index} className='flex items-center gap-1.5'>
                    {index > 0 && <span className='text-neutral-300'>/</span>}
                    {crumb.href ? (
                      <a
                        href={crumb.href}
                        className='hover:text-primary-600 transition-colors'
                        onClick={(e) => {
                          if (crumb.onClick) {
                            e.preventDefault();
                            crumb.onClick();
                          }
                        }}
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span className={index === breadcrumbs.length - 1 ? 'text-neutral-900 font-medium' : ''}>
                        {crumb.label}
                      </span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            <h1 className='sticky-header-bar__title'>{title}</h1>
            {(subtitle || description) && (
              <div className='sticky-header-bar__meta'>{subtitle || description}</div>
            )}
          </div>
        </div>

        <div className='sticky-header-bar__center'>
          <Link href='/dashboard' className='header-logo-link' aria-label='Home'>
            <Image
              src='/images/logoclinic.png'
              alt='Clinic Logo'
              width={120}
              height={40}
              className='object-contain'
              priority
              quality={90}
              sizes='120px'
              style={{ height: '40px', width: 'auto', maxWidth: '140px', objectFit: 'contain' }}
            />
          </Link>
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
                  <svg className='icon icon-sm' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                  </svg>
                </Button>
              </div>
            )}
            {actionButton && <div className='flex items-center'>{actionButton}</div>}
            {actionsList.length > 0 && (
              <div className='flex items-center gap-2'>
                {actionsList.map((btn, i) => (
                  <Fragment key={i}>{btn}</Fragment>
                ))}
              </div>
            )}
          </div>
          {hasQuickActions && showLanguageSwitcher ? (
            <span className='sticky-header-bar__pipe' aria-hidden />
          ) : null}
          {showLanguageSwitcher && (
            <div className='sticky-header-bar__right-group'>
              <div className='header-control-box'>
                <LanguageSwitcher variant='light' size='sm' />
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
      <GlobalSearch isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </header>
  );
}
