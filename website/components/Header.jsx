'use client';

import { Button } from '@/components/ui/Button.jsx';
import { useI18n } from '@/contexts/I18nContext.jsx';
import { CLINIC_APP_URL } from '@/lib/config';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

/**
 * Marketing header. Matches clinic marketing header: scroll effect, logo, nav hover styles, CTA buttons.
 * No auth; Login / Get Clinic Access point to clinic app.
 */
export function Header() {
  const router = useRouter();
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !mounted) return;
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  const clinicAppUrl = useMemo(() => CLINIC_APP_URL.replace(/\/$/, ''), []);
  const loginUrl = `${clinicAppUrl}/login`;
  const tryForFreeUrl = `${clinicAppUrl}/try-for-free`;

  const navigationLinks = useMemo(
    () => [
      { href: '/#features', label: t('navigation.features') || 'Features' },
      { href: '/blog', label: t('navigation.blog') || 'Blog' },
      { href: '/pricing', label: t('navigation.pricing') || 'Pricing' },
      { href: '/about', label: t('navigation.about') || 'About' },
      { href: '/contact', label: t('navigation.contact') || 'Contact' },
    ],
    [t],
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
        width: '100%',
      }}
    >
      <nav className='max-w-7xl mx-auto' style={{ paddingLeft: '32px', paddingRight: '32px' }}>
        <div className='flex justify-between items-center' style={{ height: '80px' }}>
          <div className='flex items-center'>
            <Link href='/' className='flex items-center'>
              <div
                className='relative flex items-center justify-center'
                style={{ width: '180px', height: '50px' }}
              >
                <Image
                  src='/images/logoclinic.png'
                  alt='Doctor&#39;s Clinic'
                  width={180}
                  height={50}
                  className='object-contain'
                  style={{ width: '100%', height: 'auto', maxHeight: '50px' }}
                  priority
                  quality={90}
                  sizes='180px'
                />
              </div>
            </Link>
          </div>

          <div className='hidden lg:flex items-center' style={{ gap: '4px' }}>
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className='text-neutral-700 font-medium relative group overflow-hidden rounded-lg'
                style={{
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  fontSize: '14px',
                  lineHeight: '20px',
                }}
              >
                <span className='relative z-10 group-hover:text-primary-500'>{link.label}</span>
                <span className='absolute inset-0 bg-primary-50 scale-x-0 group-hover:scale-x-100 origin-left rounded-lg transition-transform duration-200' />
                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full rounded-full transition-all duration-200' />
              </Link>
            ))}
          </div>

          <div className='flex items-center' style={{ gap: '12px' }}>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => {
                window.location.href = loginUrl;
              }}
              className='whitespace-nowrap hidden sm:flex px-5 py-2.5'
            >
              {t('auth.login') || 'Login'}
            </Button>
            <Button
              variant='primary'
              size='sm'
              onClick={() => {
                window.location.href = tryForFreeUrl;
              }}
              className='whitespace-nowrap px-5 py-2.5'
            >
              {t('homepage.tryForFree') || t('homepage.startFreeTrial') || 'Try for free'}
            </Button>

            <button
              type='button'
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
                  className='block px-4 py-3 text-neutral-700 font-medium relative group overflow-hidden rounded-lg'
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  <span className='relative z-10 group-hover:text-primary-500'>{link.label}</span>
                  <span className='absolute inset-0 bg-primary-50 scale-x-0 group-hover:scale-x-100 origin-left rounded-lg transition-transform duration-200' />
                  <span className='absolute bottom-2 left-4 w-0 h-0.5 bg-primary-500 group-hover:w-[calc(100%-2rem)] rounded-full transition-all duration-200' />
                </Link>
              ))}
              <div className='pt-4 border-t border-neutral-200'>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Button
                    variant='secondary'
                    size='md'
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.location.href = loginUrl;
                    }}
                    className='w-full'
                  >
                    {t('auth.login') || 'Login'}
                  </Button>
                  <Button
                    variant='primary'
                    size='md'
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.location.href = tryForFreeUrl;
                    }}
                    className='w-full'
                  >
                    {t('homepage.tryForFree') || t('homepage.startFreeTrial') || 'Try for free'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
