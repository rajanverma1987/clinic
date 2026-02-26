'use client';

import { useI18n } from '@/contexts/I18nContext';
import { CLINIC_APP_URL } from '@/lib/config';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useMemo } from 'react';

function FooterComponent() {
  const { t } = useI18n();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const clinicAppUrl = useMemo(() => CLINIC_APP_URL.replace(/\/$/, ''), []);

  return (
    <footer
      className='relative overflow-hidden bg-neutral-100 border-t border-neutral-200'
      dir='ltr'
    >
      {/* Subtle background accents */}
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute -top-[120px] -right-[120px] w-[400px] h-[400px] bg-primary-100/30 rounded-full blur-[80px] mix-blend-multiply opacity-40' />
        <div className='absolute -bottom-[120px] -left-[120px] w-[400px] h-[400px] bg-primary-100/30 rounded-full blur-[80px] mix-blend-multiply opacity-40' />
      </div>

      {/* Main content */}
      <div className='relative z-10' dir='ltr'>
        <div className='section-padding-x section-padding-y'>
          <div className='max-w-7xl mx-auto'>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
              {/* Product */}
              <div dir='ltr'>
                <h4 className='text-neutral-900 font-semibold mb-3 text-body-sm tracking-tight text-left'>
                  {t('footer.product') || 'Product'}
                </h4>
                <ul className='flex flex-col gap-2 text-left'>
                  {[
                    {
                      href: '/features',
                      label: t('footer.features') || 'Features',
                      external: false,
                    },
                    { href: '/about', label: t('footer.about') || 'About', external: false },
                    {
                      href: '/pricing',
                      label: t('navigation.pricing') || 'Pricing',
                      external: false,
                    },
                    {
                      href: `${clinicAppUrl}/register`,
                      label: t('footer.getStarted') || 'Get Started',
                      external: true,
                    },
                  ].map((link) => (
                    <li key={link.href}>
                      {link.external ? (
                        <a
                          href={link.href}
                          className='text-neutral-600 hover:text-primary-600 text-body-sm transition-smooth-fast'
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className='text-neutral-600 hover:text-primary-600 text-body-sm transition-smooth-fast'
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources – Terms, Privacy, Legal, Contact */}
              <div dir='ltr'>
                <h4 className='text-neutral-900 font-semibold mb-3 text-body-sm tracking-tight text-left'>
                  {t('footer.resources') || 'Resources'}
                </h4>
                <ul className='flex flex-col gap-2 text-left'>
                  {[
                    { href: '/legal', label: t('footer.legalInfo') },
                    { href: '/privacy', label: t('footer.privacyPolicy') || 'Privacy Policy' },
                    { href: '/terms', label: t('footer.termsOfService') || 'Terms of Service' },
                    { href: '/support/contact', label: t('footer.contactUs') || 'Contact Us' },
                  ].map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className='text-neutral-600 hover:text-primary-600 text-body-sm transition-smooth-fast'
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div dir='ltr'>
                <h4 className='text-neutral-900 font-semibold mb-3 text-body-sm tracking-tight text-left'>
                  {t('footer.contact') || t('footer.contactUs')}
                </h4>
                <ul className='flex flex-col gap-2 text-left'>
                  <li>
                    <a
                      href='mailto:support@doctorsclinic.services'
                      className='text-neutral-600 hover:text-primary-600 text-body-sm transition-smooth-fast'
                    >
                      support@doctorsclinic.services
                    </a>
                  </li>
                </ul>
              </div>

              {/* Brand & Trust */}
              <div dir='ltr'>
                <div className='mb-3'>
                  <div className='relative flex items-center w-[160px] h-[45px]'>
                    <Image
                      src='/images/logoclinic.png'
                      alt='Clinic Logo'
                      width={160}
                      height={45}
                      className='object-contain w-full h-auto max-h-[45px]'
                      quality={90}
                      sizes='160px'
                      priority
                    />
                  </div>
                </div>
                <p className='text-neutral-600 mb-3 text-body-xs max-w-[220px] text-left'>
                  {t('footer.description') ||
                    'Comprehensive clinic management solution for modern healthcare providers.'}
                </p>
                {/* Trust Badge */}
                <div
                  className='flex items-center gap-1.5 px-2.5 py-1.5 w-fit bg-primary-100 border border-primary-300 rounded-lg'
                  dir='ltr'
                >
                  <svg
                    className='w-3.5 h-3.5 text-primary-600 shrink-0'
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
                  <span className='text-primary-700 font-semibold text-[11px]'>
                    HIPAA Compliant
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className='border-t border-neutral-200'>
          <div className='max-w-7xl mx-auto section-padding-x py-4'>
            <div className='flex flex-col sm:flex-row justify-between items-center gap-3'>
              <p className='text-neutral-600 text-center sm:text-left text-[10px] leading-[14px]'>
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
