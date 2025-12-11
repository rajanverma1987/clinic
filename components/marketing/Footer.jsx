'use client';

import { useI18n } from '@/contexts/I18nContext';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useMemo } from 'react';

function FooterComponent() {
  const { t } = useI18n();
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className='relative overflow-hidden bg-neutral-50 border-t border-neutral-200' dir='ltr'>
      {/* Subtle Background Accents */}
      <div className='absolute inset-0'>
        {/* Subtle gradient accents */}
        <div
          className='absolute top-0 right-0 bg-primary-100/30 rounded-full mix-blend-multiply filter opacity-40'
          style={{ width: '400px', height: '400px', filter: 'blur(80px)', transform: 'translate(30%, -30%)' }}
        ></div>
        <div
          className='absolute bottom-0 left-0 bg-secondary-100/30 rounded-full mix-blend-multiply filter opacity-40'
          style={{ width: '400px', height: '400px', filter: 'blur(80px)', transform: 'translate(-30%, 30%)' }}
        ></div>
      </div>

      {/* Main Content - Extra Compact Design */}
      <div className='relative z-10' dir='ltr'>
        {/* Compact Links Section */}
        <div style={{ paddingTop: '32px', paddingBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
          <div className='max-w-7xl mx-auto'>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
              {/* Product */}
              <div dir='ltr'>
                <h4
                  className='text-neutral-900 font-semibold mb-3'
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '-0.01em',
                    fontWeight: '600',
                    textAlign: 'left',
                  }}
                >
                  {t('footer.product') || 'Product'}
                </h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  {[
                    { href: '/#features', label: t('footer.features') || 'Features' },
                    { href: '/pricing', label: t('navigation.pricing') || 'Pricing' },
                    { href: '/register', label: t('footer.getStarted') || 'Get Started' },
                  ].map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className='text-neutral-600 hover:text-primary-600'
                        style={{ fontSize: '14px', lineHeight: '20px' }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div dir='ltr'>
                <h4
                  className='text-neutral-900 font-semibold mb-3'
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '-0.01em',
                    fontWeight: '600',
                    textAlign: 'left',
                  }}
                >
                  {t('footer.legal') || 'Legal'}
                </h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  {[
                    { href: '/privacy', label: t('footer.privacyPolicy') || 'Privacy Policy' },
                    { href: '/terms', label: t('footer.termsOfService') || 'Terms of Service' },
                    { href: '/support/contact', label: t('footer.contactUs') || 'Contact Us' },
                  ].map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className='text-neutral-600 hover:text-primary-600'
                        style={{ fontSize: '14px', lineHeight: '20px' }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div dir='ltr'>
                <h4
                  className='text-neutral-900 font-semibold mb-3'
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '-0.01em',
                    fontWeight: '600',
                    textAlign: 'left',
                  }}
                >
                  Contact
                </h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  <li>
                    <a
                      href='mailto:support@clinic.com'
                      className='text-neutral-600 hover:text-primary-600'
                      style={{ fontSize: '14px', lineHeight: '20px' }}
                    >
                      support@clinic.com
                    </a>
                  </li>
                </ul>
              </div>

              {/* Brand & Trust */}
              <div dir='ltr'>
                <div style={{ marginBottom: '12px' }}>
                  <div className='relative flex items-center' style={{ width: '160px', height: '45px' }}>
                    <Image
                      src='/images/logoclinic.png'
                      alt='Clinic Logo'
                      width={160}
                      height={45}
                      className='object-contain'
                      quality={90}
                      sizes='160px'
                      style={{ width: '100%', height: '100%' }}
                      priority
                    />
                  </div>
                </div>
                <p
                  className='text-neutral-600 mb-3'
                  style={{
                    fontSize: '12px',
                    lineHeight: '18px',
                    maxWidth: '220px',
                    textAlign: 'left',
                  }}
                >
                  {t('footer.description') ||
                    'Comprehensive clinic management solution for modern healthcare providers.'}
                </p>
                {/* Trust Badge */}
                <div className='flex items-center bg-primary-100 border border-primary-300 rounded-lg' style={{ gap: '6px', paddingLeft: '10px', paddingRight: '10px', paddingTop: '6px', paddingBottom: '6px', width: 'fit-content', direction: 'ltr' }}>
                      <svg
                    style={{ width: '14px', height: '14px' }}
                    className='text-primary-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                      d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                        />
                      </svg>
                  <span className='text-primary-700 font-semibold' style={{ fontSize: '11px', fontWeight: '600' }}>HIPAA Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Extra Compact */}
        <div className='border-t border-neutral-200'>
          <div className='max-w-7xl mx-auto' style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '16px', paddingBottom: '16px' }}>
            <div className='flex flex-col sm:flex-row justify-between items-center' style={{ gap: '12px' }}>
              <p className='text-neutral-600 text-center sm:text-left' style={{ fontSize: '12px', lineHeight: '18px' }}>
                &copy; {currentYear} {t('footer.allRightsReserved') || 'All rights reserved'}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export const Footer = memo(FooterComponent);

