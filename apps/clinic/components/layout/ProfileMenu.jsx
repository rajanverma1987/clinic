/**
 * Profile Menu Component
 * User profile menu for sidebar
 * Extracted from TopNav
 */

'use client';

import { ChevronDownIcon, ChevronRightIcon, LogOutIcon, SettingsIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useI18n } from '@/contexts/I18nContext.jsx';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function ProfileMenu({ isCollapsed }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [avatarError, setAvatarError] = useState(false);
  const userMenuRef = useRef(null);
  const userMenuDropdownRef = useRef(null);

  const updateDropdownPosition = useCallback(() => {
    if (!userMenuRef.current) return;
    const rect = userMenuRef.current.getBoundingClientRect();
    setDropdownPosition({ top: rect.bottom + 8, left: rect.left });
  }, []);

  // Helper function to get translation with fallback
  const getTranslation = useCallback(
    (key, fallback) => {
      const translation = t(key);
      return translation !== key ? translation : fallback;
    },
    [t],
  );

  // User display name
  const userDisplayName = user
    ? `${user.role === 'doctor' ? 'Dr. ' : ''}${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      t('common.user')
    : '';

  // Initials for avatar fallback: first letter of first name + first letter of last name (e.g. "SR" for Shiv Ram)
  const userInitials =
    (user &&
      [user.firstName?.[0], user.lastName?.[0]]
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

  const handleLogoutClick = useCallback(() => {
    setShowUserMenu(false);
    setShowLogoutConfirm(true);
  }, []);

  const handleLogout = useCallback(
    (e) => {
      e?.stopPropagation?.();
      setShowLogoutConfirm(false);
      logout();
    },
    [logout],
  );

  const toggleUserMenu = useCallback(() => {
    setShowUserMenu((prev) => !prev);
  }, []);

  if (!user) return null;

  return (
    <>
      <div className='profile-menu bg-white dark:bg-neutral-800' ref={userMenuRef}>
        <button
          type='button'
          onClick={toggleUserMenu}
          className={`group w-full flex items-center gap-3 rounded-xl border p-2.5 shadow-sm transition-all duration-200 ${
            isCollapsed ? 'justify-center px-2.5' : 'px-3'
          } ${
            showUserMenu
              ? 'border-primary-300 bg-white dark:bg-neutral-800 dark:border-primary-500'
              : 'border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-500 hover:shadow-md'
          }`}
          aria-label='User menu'
          aria-expanded={showUserMenu}
          aria-haspopup='true'
        >
          <div className='relative flex-shrink-0'>
            <div
              className='overflow-hidden rounded-full bg-primary-600 flex items-center justify-center text-white font-bold ring-2 ring-white shadow-md'
              style={{
                width: isCollapsed ? 40 : 56,
                height: isCollapsed ? 40 : 56,
                fontSize: isCollapsed ? 14 : 18,
              }}
            >
              {user?.avatar && !avatarError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={userDisplayName || 'Profile'}
                  className='w-full h-full object-cover'
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span aria-hidden>{userInitials}</span>
              )}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
                user?.isActive ? 'bg-green-500' : 'bg-red-500'
              }`}
              aria-hidden
            />
          </div>
          {!isCollapsed && (
            <div className='flex-1 min-w-0 text-left'>
              <p className='text-neutral-900 dark:text-neutral-100 font-bold truncate text-sm'>
                {userDisplayName}
              </p>
              <p className='text-neutral-600 dark:text-neutral-300 truncate text-xs font-medium'>
                {userRoleDisplay}
              </p>
              {user?.subscriptionPlan?.name && (
                <p
                  className='text-neutral-500 dark:text-neutral-400 truncate text-xs mt-0.5'
                  title={user.subscriptionPlan.name}
                >
                  {getTranslation('sidebar.subscriptionType', 'Plan')}: {user.subscriptionPlan.name}
                </p>
              )}
            </div>
          )}
          {!isCollapsed && (
            <ChevronDownIcon
              className={`icon icon-xs text-neutral-400 flex-shrink-0 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
            />
          )}
        </button>

        {showUserMenu && !isCollapsed && typeof document !== 'undefined'
          ? createPortal(
              <div
                ref={userMenuDropdownRef}
                className='profile-dropdown bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600'
                role='menu'
                aria-label='Account menu'
                style={{
                  position: 'fixed',
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  zIndex: 10050,
                }}
              >
                <div className='profile-dropdown__header'>{t('common.account')}</div>
                <div className='profile-dropdown__body'>
                  <button
                    type='button'
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
                      <span className='profile-dropdown__item-desc'>Manage your preferences</span>
                    </span>
                    <ChevronRightIcon className='icon icon-xs text-neutral-400 flex-shrink-0' />
                  </button>
                  <div className='profile-dropdown__divider' />
                  <button
                    type='button'
                    className='profile-dropdown__item profile-dropdown__item--danger'
                    onClick={handleLogoutClick}
                    role='menuitem'
                  >
                    <span className='profile-dropdown__item-icon'>
                      <LogOutIcon className='icon icon-sm' />
                    </span>
                    <span className='profile-dropdown__item-text'>
                      <span className='profile-dropdown__item-label'>
                        {getTranslation('auth.logout', 'Logout')}
                      </span>
                      <span className='profile-dropdown__item-desc'>
                        {t('auth.signOutDescription')}
                      </span>
                    </span>
                    <ChevronRightIcon className='icon icon-xs text-neutral-400 flex-shrink-0' />
                  </button>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={getTranslation('auth.confirmLogout', 'Confirm Sign Out')}
        size='sm'
      >
        <div className='space-y-4'>
          <p
            className='text-neutral-700 dark:text-neutral-300'
            style={{ fontSize: '16px', lineHeight: '24px' }}
          >
            {getTranslation(
              'auth.logoutConfirmMessage',
              'Are you sure you want to sign out? You will need to sign in again to access your account.',
            )}
          </p>
          <div className='flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-600'>
            <Button variant='secondary' size='md' onClick={() => setShowLogoutConfirm(false)}>
              {getTranslation('common.cancel', 'Cancel')}
            </Button>
            <Button variant='logout' size='md' onClick={handleLogout} type='button'>
              {getTranslation('auth.signOut', 'Sign Out')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
