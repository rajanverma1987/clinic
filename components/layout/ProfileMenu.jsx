/**
 * Profile Menu Component
 * User profile menu for sidebar
 * Extracted from TopNav
 */

'use client';

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
    [t]
  );

  // User display name
  const userDisplayName = user
    ? `${user.role === 'doctor' ? 'Dr. ' : ''}${user.firstName || ''} ${user.lastName || ''}`.trim() || t('common.user')
    : '';

  // User role display
  const userRoleDisplay = user
    ? (() => {
        const roleMap = {
          super_admin: t('common.roleSuperAdmin'),
          clinic_admin: t('common.roleClinicAdmin'),
          doctor: t('common.roleDoctor'),
          staff: t('common.roleStaff'),
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

  const handleLogout = useCallback(() => {
    setShowLogoutConfirm(false);
    logout();
  }, [logout]);

  const toggleUserMenu = useCallback(() => {
    setShowUserMenu((prev) => !prev);
  }, []);

  if (!user) return null;

  return (
    <>
      <div className='profile-menu' ref={userMenuRef} style={{ background: '#ffffff' }}>
        <button
          type='button'
          onClick={toggleUserMenu}
          className={`group w-full flex items-center gap-3 rounded-xl border p-2.5 shadow-sm transition-all duration-200 ${
            isCollapsed ? 'justify-center px-2.5' : 'px-3'
          } ${
            showUserMenu
              ? 'border-primary-300 bg-white'
              : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md'
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
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={userDisplayName || 'Profile'}
                  className='w-full h-full object-cover'
                />
              ) : (
                <>
                  {user?.firstName?.[0]?.toUpperCase() || 'U'}
                  {!isCollapsed && user?.lastName?.[0]?.toUpperCase()}
                </>
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
              <p className='text-neutral-900 font-bold truncate text-sm'>{userDisplayName}</p>
              <p className='text-neutral-600 truncate text-xs font-medium'>{userRoleDisplay}</p>
            </div>
          )}
          {!isCollapsed && (
            <svg
              className={`icon icon-xs text-neutral-400 flex-shrink-0 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              aria-hidden
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M19 9l-7 7-7-7' />
            </svg>
          )}
        </button>

        {showUserMenu && !isCollapsed && typeof document !== 'undefined'
          ? createPortal(
            <div
              ref={userMenuDropdownRef}
              className='profile-dropdown'
              role='menu'
              aria-label='Account menu'
              style={{
                position: 'fixed',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                background: '#ffffff',
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
                    <IconSettings />
                  </span>
                  <span className='profile-dropdown__item-text'>
                    <span className='profile-dropdown__item-label'>{getTranslation('settings.title', 'Settings')}</span>
                    <span className='profile-dropdown__item-desc'>Manage your preferences</span>
                  </span>
                  <svg className='icon icon-xs text-neutral-400 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </button>
                <div className='profile-dropdown__divider' />
                <button
                  type='button'
                  className='profile-dropdown__item profile-dropdown__item--danger'
                  onClick={handleLogoutClick}
                  role='menuitem'
                >
                  <span className='profile-dropdown__item-icon'>
                    <IconLogout />
                  </span>
                  <span className='profile-dropdown__item-text'>
                    <span className='profile-dropdown__item-label'>{getTranslation('auth.logout', 'Logout')}</span>
                    <span className='profile-dropdown__item-desc'>{t('auth.signOutDescription')}</span>
                  </span>
                  <svg className='icon icon-xs text-neutral-400 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </button>
              </div>
            </div>,
            document.body
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
          <p className='text-neutral-700' style={{ fontSize: '16px', lineHeight: '24px' }}>
            {getTranslation(
              'auth.logoutConfirmMessage',
              'Are you sure you want to sign out? You will need to sign in again to access your account.'
            )}
          </p>
          <div className='flex items-center justify-end gap-3 pt-4 border-t border-neutral-200'>
            <Button variant='secondary' size='md' onClick={() => setShowLogoutConfirm(false)}>
              {getTranslation('common.cancel', 'Cancel')}
            </Button>
            <Button variant='logout' size='md' onClick={handleLogout}>
              {getTranslation('auth.signOut', 'Sign Out')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// Icon Components
function IconLogout() {
  return (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
      />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
      />
    </svg>
  );
}
