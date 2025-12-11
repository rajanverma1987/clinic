'use client';

import { Button } from '@/components/ui/Button.jsx';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useI18n } from '@/contexts/I18nContext.jsx';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export function Header() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mark component as mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side after mount
    if (typeof window === 'undefined' || !mounted) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    // Set initial scroll state
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  const navigationLinks = useMemo(
    () => [
      { href: '/#features', label: t('navigation.features') },
      { href: '/blog', label: t('navigation.blog') || 'Blog' },
      { href: '/pricing', label: t('navigation.pricing') },
      { href: '/support', label: t('navigation.support') },
      { href: '/support/contact', label: t('navigation.contact') },
    ],
    [t]
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-xl border-b border-neutral-200'
          : 'bg-white border-b border-neutral-100'
      }`}
      style={{
        transitionProperty: 'background-color, box-shadow, border-color',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
      }}
    >
      <nav className='max-w-7xl mx-auto' style={{ paddingLeft: '32px', paddingRight: '32px' }}>
        <div className='flex justify-between items-center' style={{ height: '80px' }}>
          {/* Logo Section */}
          <div className='flex items-center'>
            <Link href='/' className='flex items-center'>
              <div
                className='relative flex items-center justify-center'
                style={{ width: '180px', height: '50px' }}
              >
                <Image
                  src='/images/logoclinic.png'
                  alt='Clinic Logo'
                  width={180}
                  height={50}
                  className='object-contain'
                  style={{ width: '100%', height: '100%' }}
                  priority
                  quality={90}
                  sizes='180px'
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex items-center' style={{ gap: '4px' }}>
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className='text-body-md text-neutral-700 font-medium relative group overflow-hidden rounded-lg'
                style={{
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                }}
              >
                <span className='relative z-10 group-hover:text-primary-500'>{link.label}</span>
                {/* Background hover effect */}
                <span className='absolute inset-0 bg-primary-50 scale-x-0 group-hover:scale-x-100 origin-left rounded-lg'></span>
                {/* Underline effect */}
                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full rounded-full'></span>
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className='flex items-center' style={{ gap: '12px' }}>
            {/* Language Switcher - Best practice: in header, before action buttons */}
            <div className='hidden sm:block'>
              <LanguageSwitcher variant='light' size='sm' />
            </div>

            {/* User Actions */}
            {user ? (
              // Logged in user
              <>
                {/* User Profile Card - Matching Sidebar Style */}
                <div className='hidden md:flex bg-white rounded-xl border border-neutral-200 p-3 shadow-sm hover:shadow-md'>
                  <div className='flex items-center gap-3'>
                    {/* Avatar */}
                    <div className='relative flex-shrink-0'>
                      <div
                        className='bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white font-semibold'
                        style={{
                          width: 'var(--size-2xl)',
                          height: 'var(--size-2xl)',
                          fontSize: 'var(--text-body-md)',
                        }}
                      >
                        {user?.firstName?.[0]?.toUpperCase() || 'U'}
                        {user?.lastName?.[0]?.toUpperCase() || ''}
                      </div>
                      {/* Status Dot */}
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 border-2 border-white rounded-full shadow-md ${
                          user?.isActive ? 'bg-secondary-500' : 'bg-status-error'
                        }`}
                        style={{
                          width: 'var(--space-3)',
                          height: 'var(--space-3)',
                        }}
                        title={user?.isActive ? 'Active' : 'Inactive'}
                      ></div>
                    </div>
                    {/* User Info */}
                    <div className='flex-1 min-w-0'>
                      <p
                        className='text-neutral-900 font-semibold truncate'
                        style={{
                          fontSize: 'var(--text-body-sm)',
                          lineHeight: 'var(--text-body-sm-line-height)',
                        }}
                      >
                        {user.role === 'doctor'
                          ? `Dr. ${user.firstName} ${user.lastName}`
                          : `${user.firstName} ${user.lastName}`}
                      </p>
                      <p
                        className='text-neutral-600 truncate'
                        style={{
                          fontSize: 'var(--text-body-xs)',
                          lineHeight: 'var(--text-body-xs-line-height)',
                        }}
                      >
                        {user.role === 'super_admin'
                          ? 'Super Admin'
                          : user.role === 'clinic_admin'
                          ? 'Clinic Admin'
                          : user.role === 'doctor'
                          ? 'Doctor'
                          : user.role === 'staff'
                          ? 'Staff'
                          : user.role || 'User'}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={() => router.push('/dashboard')}
                  className='whitespace-nowrap px-5 py-2.5'
                >
                  <svg
                    className='mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    style={{ width: '16px', height: '16px' }}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                    />
                  </svg>
                  {t('navigation.goToDashboard')}
                </Button>
              </>
            ) : (
              // Not logged in
              <>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => router.push('/login')}
                  className='whitespace-nowrap hidden sm:flex px-5 py-2.5 animate-button-pulse'
                >
                  {t('auth.login')}
                </Button>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={() => router.push('/register')}
                  className='whitespace-nowrap px-5 py-2.5 animate-button-pulse'
                >
                  <svg
                    className='mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    style={{ width: '16px', height: '16px' }}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 10V3L4 14h7v7l9-11h-7z'
                    />
                  </svg>
                  {t('navigation.getStarted')}
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='lg:hidden rounded-xl text-neutral-700 hover:bg-neutral-100'
              aria-label='Toggle menu'
              style={{ padding: '8px' }}
            >
              {mobileMenuOpen ? (
                <svg
                  style={{ width: '24px', height: '24px' }}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              ) : (
                <svg
                  style={{ width: '24px', height: '24px' }}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className='lg:hidden border-t border-neutral-200 bg-white'>
            <div
              style={{
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '16px',
                paddingBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className='block px-4 py-3 text-body-md text-neutral-700 font-medium relative group overflow-hidden rounded-lg'
                >
                  <span className='relative z-10 group-hover:text-primary-500'>{link.label}</span>
                  {/* Background hover effect */}
                  <span className='absolute inset-0 bg-primary-50 scale-x-0 group-hover:scale-x-100 origin-left rounded-lg'></span>
                  {/* Underline effect */}
                  <span className='absolute bottom-2 left-4 w-0 h-0.5 bg-primary-500 group-hover:w-[calc(100%-2rem)] rounded-full'></span>
                </Link>
              ))}
              {/* Language Switcher in Mobile Menu */}
              <div style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
                  <LanguageSwitcher variant='light' size='sm' />
                </div>
              </div>
              <div style={{ paddingTop: '16px', borderTop: '1px solid rgb(229, 231, 235)' }}>
                {user ? (
                  <div
                    style={{
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {/* Mobile User Profile Card - Matching Sidebar Style */}
                    <div
                      className='bg-white rounded-xl border border-neutral-200 p-3 shadow-sm'
                      style={{
                        marginBottom: '8px',
                      }}
                    >
                      <div className='flex items-center gap-3'>
                        {/* Avatar */}
                        <div className='relative flex-shrink-0'>
                          <div
                            className='bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white font-semibold'
                            style={{
                              width: 'var(--size-2xl)',
                              height: 'var(--size-2xl)',
                              fontSize: 'var(--text-body-md)',
                            }}
                          >
                            {user?.firstName?.[0]?.toUpperCase() || 'U'}
                            {user?.lastName?.[0]?.toUpperCase() || ''}
                          </div>
                          {/* Status Dot */}
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 border-2 border-white rounded-full shadow-md ${
                              user?.isActive ? 'bg-secondary-500' : 'bg-status-error'
                            }`}
                            style={{
                              width: 'var(--space-3)',
                              height: 'var(--space-3)',
                            }}
                            title={user?.isActive ? 'Active' : 'Inactive'}
                          ></div>
                        </div>
                        {/* User Info */}
                        <div className='flex-1 min-w-0'>
                          <p
                            className='text-neutral-900 font-semibold truncate'
                            style={{
                              fontSize: 'var(--text-body-sm)',
                              lineHeight: 'var(--text-body-sm-line-height)',
                            }}
                          >
                            {user.role === 'doctor'
                              ? `Dr. ${user.firstName} ${user.lastName}`
                              : `${user.firstName} ${user.lastName}`}
                          </p>
                          <p
                            className='text-neutral-600 truncate'
                            style={{
                              fontSize: 'var(--text-body-xs)',
                              lineHeight: 'var(--text-body-xs-line-height)',
                            }}
                          >
                            {user.role === 'super_admin'
                              ? 'Super Admin'
                              : user.role === 'clinic_admin'
                              ? 'Clinic Admin'
                              : user.role === 'doctor'
                              ? 'Doctor'
                              : user.role === 'staff'
                              ? 'Staff'
                              : user.role || 'User'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant='primary'
                      size='md'
                      onClick={() => {
                        router.push('/dashboard');
                        setMobileMenuOpen(false);
                      }}
                      className='w-full'
                    >
                      {t('navigation.goToDashboard')}
                    </Button>
                  </div>
                ) : (
                  <div
                    style={{
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <Button
                      variant='secondary'
                      size='md'
                      onClick={() => {
                        router.push('/login');
                        setMobileMenuOpen(false);
                      }}
                      className='w-full animate-button-pulse'
                    >
                      {t('auth.login')}
                    </Button>
                    <Button
                      variant='primary'
                      size='sm'
                      onClick={() => {
                        router.push('/register');
                        setMobileMenuOpen(false);
                      }}
                      className='w-full px-5 py-2.5 animate-button-pulse'
                    >
                      {t('navigation.getStarted')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
