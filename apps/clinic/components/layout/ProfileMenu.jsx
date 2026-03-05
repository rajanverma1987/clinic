/**
 * Profile Menu Component
 * User profile menu for sidebar
 * Extracted from TopNav
 */

'use client';

import {
  BellIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HistoryIcon,
  SettingsIcon,
} from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useI18n } from '@/contexts/I18nContext.jsx';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function ProfileMenu({ isCollapsed, showSubscriptionLinks = false }) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [avatarError, setAvatarError] = useState(false);
  const userMenuRef = useRef(null);
  const userMenuDropdownRef = useRef(null);

  const updateDropdownPosition = useCallback(() => {
    if (!userMenuRef.current) return;
    const rect = userMenuRef.current.getBoundingClientRect();
    if (isCollapsed) {
      // Collapsed: open to the RIGHT of the sidebar, at avatar's vertical midpoint
      setDropdownPosition({ top: rect.top, left: rect.right + 8, mode: 'right' });
    } else {
      // Expanded footer: open ABOVE the profile row
      setDropdownPosition({ top: rect.top, left: rect.left, mode: 'above' });
    }
  }, [isCollapsed]);

  // Helper function to get translation with fallback
  const getTranslation = useCallback(
    (key, fallback) => {
      const translation = t(key);
      return translation !== key ? translation : fallback;
    },
    [t],
  );

  // Localized first/last name by current locale (Arabic, Spanish, or default)
  const localizedFirst = user && (locale === 'ar' && user.firstName_ar ? user.firstName_ar : locale === 'es' && user.firstName_es ? user.firstName_es : user.firstName);
  const localizedLast = user && (locale === 'ar' && user.lastName_ar ? user.lastName_ar : locale === 'es' && user.lastName_es ? user.lastName_es : user.lastName);

  // User display name: translated prefix for doctors + localized name
  const userDisplayName = user
    ? `${user.role === 'doctor' ? `${t('common.doctorPrefix')} ` : ''}${localizedFirst || ''} ${localizedLast || ''}`.trim() ||
      t('common.user')
    : '';

  // Initials from localized name so they match the displayed name (e.g. Arabic initials when locale is ar)
  const userInitials =
    (user &&
      [localizedFirst?.[0], localizedLast?.[0]]
        .filter(Boolean)
        .map((c) => (typeof c === 'string' ? c : String(c)).toUpperCase())
        .join('')) ||
    user?.email?.[0]?.toUpperCase() ||
    'U';

  // User role display
  const userRoleDisplay = user
    ? (() => {
        const roleMap = {
          super_admin: t('common.roleSuperAdmin'),
          clinic_admin: t('common.roleClinicAdmin'),
          doctor: t('common.roleDoctor'),
          staff: t('common.roleStaff'),
          manager: t('settings.roleManager'),
        };
        return roleMap[user.role] || user.role || t('common.user');
      })()
    : '';

  // Position dropdown when opened; update on scroll/resize
  useLayoutEffect(() => {
    if (!showUserMenu || !userMenuRef.current) return;
    updateDropdownPosition();
    const onScrollOrResize = () => updateDropdownPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [showUserMenu, updateDropdownPosition]);

  // Reset avatar error when user or avatar URL changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar, user?.id]);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target) &&
        userMenuDropdownRef.current &&
        !userMenuDropdownRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleSettingsClick = useCallback(() => {
    setShowUserMenu(false);
    router.push('/settings');
  }, [router]);

  const handleSubscriptionClick = useCallback(() => {
    setShowUserMenu(false);
    router.push('/subscription');
  }, [router]);

  const handlePaymentHistoryClick = useCallback(() => {
    setShowUserMenu(false);
    router.push('/payment-history');
  }, [router]);

  const toggleUserMenu = useCallback(() => {
    setShowUserMenu((prev) => !prev);
  }, []);

  if (!user) return null;

  return (
    <>
      <div ref={userMenuRef}>
        {isCollapsed ? (
          /* Collapsed: centered avatar, click opens dropdown to the right */
          <Button
            type='button'
            variant='ghost'
            onClick={toggleUserMenu}
            className='group relative flex items-center justify-center mx-auto w-16 h-16 rounded-full min-w-0'
            aria-label={t('common.userMenu')}
            aria-expanded={showUserMenu}
            aria-haspopup='true'
          >
            <div className='overflow-hidden rounded-full bg-primary-600 flex items-center justify-center text-white font-bold ring-2 ring-primary-100 dark:ring-primary-900/50 shadow-md w-16 h-16 text-lg group-hover:ring-primary-200 transition-all'>
              {user?.avatar && !avatarError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={userDisplayName || t('common.altProfile')}
                  className='w-full h-full object-cover'
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span aria-hidden>{userInitials}</span>
              )}
            </div>
            <span
              className={`absolute bottom-0 right-0 w-2 h-2 border border-white dark:border-neutral-900 rounded-full ${user?.isActive ? 'bg-green-500' : 'bg-red-500'}`}
              aria-hidden
            />
          </Button>
        ) : (
          /* Expanded: large avatar, minimal padding – max space for image */
          <Button
            type='button'
            variant='ghost'
            fullWidth
            align='start'
            className={[
              'group flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-150',
              showUserMenu
                ? 'bg-neutral-100 dark:bg-neutral-800'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
            ].join(' ')}
            onClick={toggleUserMenu}
            aria-label={t('common.userMenu')}
            aria-expanded={showUserMenu}
            aria-haspopup='true'
          >
            {/* Large avatar – max size, minimal surrounding space */}
            <div className='relative flex-shrink-0'>
              <div className='overflow-hidden rounded-full bg-primary-600 flex items-center justify-center text-white font-bold ring-2 ring-primary-100 dark:ring-primary-900/50 shadow-md w-32 h-32 text-2xl group-hover:ring-primary-200 dark:group-hover:ring-primary-800 transition-all duration-150'>
                {user?.avatar && !avatarError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={userDisplayName || t('common.altProfile')}
                    className='w-full h-full object-cover object-center'
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span aria-hidden>{userInitials}</span>
                )}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white dark:border-neutral-900 rounded-full ${user?.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                aria-hidden
              />
            </div>

            {/* Name + role — key so locale switch updates prefix/role/name immediately */}
            <div key={locale} className='flex-1 min-w-0 text-left'>
              <p className='text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate leading-tight'>
                {userDisplayName}
              </p>
              <p className='text-xs font-semibold text-primary-600 dark:text-primary-400 truncate leading-tight mt-1'>
                {userRoleDisplay}
              </p>
            </div>

            {/* Chevron — rotates when open */}
            <ChevronDownIcon
              className={`w-3.5 h-3.5 text-neutral-400 flex-shrink-0 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
            />
          </Button>
        )}

        {showUserMenu && typeof document !== 'undefined'
          ? createPortal(
              <div
                ref={userMenuDropdownRef}
                className='profile-dropdown bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600'
                role='menu'
                aria-label={t('common.accountMenu')}
                style={{
                  position: 'fixed',
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  transform:
                    dropdownPosition.mode === 'above' ? 'translateY(calc(-100% - 8px))' : 'none',
                  zIndex: 10050,
                }}
              >
                <div className='profile-dropdown__header'>{t('common.account')}</div>
                <div className='profile-dropdown__body'>
                  {showSubscriptionLinks && (
                    <>
                      <Button
                        type='button'
                        variant='ghost'
                        fullWidth
                        align='start'
                        className='profile-dropdown__item'
                        onClick={handleSubscriptionClick}
                        role='menuitem'
                      >
                        <span className='profile-dropdown__item-icon'>
                          <BellIcon className='icon icon-sm' />
                        </span>
                        <span className='profile-dropdown__item-text'>
                          <span className='profile-dropdown__item-label'>
                            {getTranslation('subscription.title', 'Subscription')}
                          </span>
                        </span>
                        <ChevronRightIcon className='icon icon-xs text-neutral-400 flex-shrink-0' />
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        fullWidth
                        align='start'
                        className='profile-dropdown__item'
                        onClick={handlePaymentHistoryClick}
                        role='menuitem'
                      >
                        <span className='profile-dropdown__item-icon'>
                          <HistoryIcon className='icon icon-sm' />
                        </span>
                        <span className='profile-dropdown__item-text'>
                          <span className='profile-dropdown__item-label'>
                            {getTranslation('subscription.paymentHistory', 'Payment History')}
                          </span>
                        </span>
                        <ChevronRightIcon className='icon icon-xs text-neutral-400 flex-shrink-0' />
                      </Button>
                      <div className='profile-dropdown__divider' />
                    </>
                  )}
                  <Button
                    type='button'
                    variant='ghost'
                    fullWidth
                    align='start'
                    className='profile-dropdown__item'
                    onClick={handleSettingsClick}
                    role='menuitem'
                  >
                    <span className='profile-dropdown__item-icon'>
                      <SettingsIcon className='icon icon-sm' />
                    </span>
                    <span className='profile-dropdown__item-text'>
                      <span className='profile-dropdown__item-label'>
                        {getTranslation('settings.title', 'Settings')}
                      </span>
                      <span className='profile-dropdown__item-desc'>
                        {t('common.managePreferences')}
                      </span>
                    </span>
                    <ChevronRightIcon className='icon icon-xs text-neutral-400 flex-shrink-0' />
                  </Button>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    </>
  );
}
