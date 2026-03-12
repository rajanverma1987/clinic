'use client';

import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { ClientBreadcrumb } from '@/components/ui/ClientBreadcrumb';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';

export default function PrivacyPage() {
  const { t, locale } = useI18n();
  const dateLocale = locale === 'ar' ? 'ar-EG' : locale === 'es' ? 'es' : 'en-US';
  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1 page-main'>
        <div className='page-content page-content-narrow'>
          <ClientBreadcrumb
            items={[
              { href: '/', labelKey: 'navigation.home' },
              { labelKey: 'footer.privacyPolicy' },
            ]}
          />

          {/* Header Section */}
          <div className='mb-12'>
            <h1 className='text-h1 text-neutral-900 mb-4'>
              {t('privacy.pageTitle')}
            </h1>
            <div className='flex items-center gap-3'>
              <p className='text-body-md text-neutral-600'>
                {t('privacy.lastUpdated')}{' '}
                {new Date().toLocaleDateString(dateLocale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <span className='text-neutral-300'>•</span>
              <div className='flex items-center gap-2 bg-primary-100 px-3 py-1 rounded-full'>
                <svg
                  className='icon icon-sm text-primary-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                  />
                </svg>
                <span
                  className='text-primary-700 font-semibold'
                  style={{ fontSize: '12px', fontWeight: '600' }}
                >
                  {t('privacy.hipaaGdprBadge')}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className='bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 md:p-12'>
            <section className='mb-10'>
              <h2
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('privacy.section1Title')}
              </h2>
              <p
                className='text-neutral-700 mb-4'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section1P1')}
              </p>
              <p
                className='text-neutral-700'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section1P2')}
              </p>
            </section>

            <section className='mb-10'>
              <h2
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('privacy.section2Title')}
              </h2>
              <h3
                className='text-neutral-900 mb-3'
                style={{
                  fontSize: '20px',
                  lineHeight: '28px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('privacy.section2_1Title')}
              </h3>
              <p
                className='text-neutral-700 mb-4'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section2_1Intro')}
              </p>
              <ul
                className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'
                style={{ fontSize: '16px', lineHeight: '26px' }}
              >
                <li>{t('privacy.section2_1Li1')}</li>
                <li>{t('privacy.section2_1Li2')}</li>
                <li>{t('privacy.section2_1Li3')}</li>
                <li>{t('privacy.section2_1Li4')}</li>
              </ul>

              <h3
                className='text-neutral-900 mb-3'
                style={{
                  fontSize: '20px',
                  lineHeight: '28px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('privacy.section2_2Title')}
              </h3>
              <p
                className='text-neutral-700 mb-4'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section2_2Intro')}
              </p>
              <ul
                className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'
                style={{ fontSize: '16px', lineHeight: '26px' }}
              >
                <li>{t('privacy.section2_2Li1')}</li>
                <li>{t('privacy.section2_2Li2')}</li>
                <li>{t('privacy.section2_2Li3')}</li>
                <li>{t('privacy.section2_2Li4')}</li>
                <li>{t('privacy.section2_2Li5')}</li>
              </ul>
              <p
                className='text-neutral-700'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section2_2Outro')}
              </p>
            </section>

            <section className='mb-10'>
              <h2
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('privacy.section3Title')}
              </h2>
              <p
                className='text-neutral-700 mb-4'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section3Intro')}
              </p>
              <ul
                className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'
                style={{ fontSize: '16px', lineHeight: '26px' }}
              >
                <li>{t('privacy.section3Li1')}</li>
                <li>{t('privacy.section3Li2')}</li>
                <li>{t('privacy.section3Li3')}</li>
                <li>{t('privacy.section3Li4')}</li>
                <li>{t('privacy.section3Li5')}</li>
                <li>{t('privacy.section3Li6')}</li>
              </ul>
              <p
                className='text-neutral-700'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section3Outro')}
              </p>
            </section>

            <section className='mb-10'>
              <h2
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('privacy.section4Title')}
              </h2>
              <p
                className='text-neutral-700 mb-4'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section4Intro')}
              </p>
              <ul
                className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'
                style={{ fontSize: '16px', lineHeight: '26px' }}
              >
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section4Encryption')}:</strong>{' '}
                  {t('privacy.section4EncryptionText')}
                </li>
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section4Access')}:</strong>{' '}
                  {t('privacy.section4AccessText')}
                </li>
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section4Audit')}:</strong>{' '}
                  {t('privacy.section4AuditText')}
                </li>
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section4Network')}:</strong>{' '}
                  {t('privacy.section4NetworkText')}
                </li>
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section4Regular')}:</strong>{' '}
                  {t('privacy.section4RegularText')}
                </li>
              </ul>
            </section>

            <section className='mb-10'>
              <h2
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('privacy.section5Title')}
              </h2>
              <p
                className='text-neutral-700 mb-4'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section5Intro')}
              </p>
              <ul
                className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'
                style={{ fontSize: '16px', lineHeight: '26px' }}
              >
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section5Service')}:</strong>{' '}
                  {t('privacy.section5ServiceText')}
                </li>
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section5Legal')}:</strong>{' '}
                  {t('privacy.section5LegalText')}
                </li>
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section5Business')}:</strong>{' '}
                  {t('privacy.section5BusinessText')}
                </li>
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section5Consent')}:</strong>{' '}
                  {t('privacy.section5ConsentText')}
                </li>
              </ul>
            </section>

            <section className='mb-10'>
              <h2
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('privacy.section6Title')}
              </h2>
              <p
                className='text-neutral-700 mb-4'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section6Intro')}
              </p>
              <ul
                className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'
                style={{ fontSize: '16px', lineHeight: '26px' }}
              >
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section6Access')}:</strong>{' '}
                  {t('privacy.section6AccessText')}
                </li>
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section6Rectification')}:</strong>{' '}
                  {t('privacy.section6RectificationText')}
                </li>
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section6Erasure')}:</strong>{' '}
                  {t('privacy.section6ErasureText')}
                </li>
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section6Restrict')}:</strong>{' '}
                  {t('privacy.section6RestrictText')}
                </li>
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section6Portability')}:</strong>{' '}
                  {t('privacy.section6PortabilityText')}
                </li>
                <li>
                  <strong className='text-neutral-900'>{t('privacy.section6Object')}:</strong>{' '}
                  {t('privacy.section6ObjectText')}
                </li>
              </ul>
              <p
                className='text-neutral-700'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section6Contact')}{' '}
                <a
                  href='mailto:privacy@doctorsclinic.services'
                  className='text-primary-600 hover:text-primary-700 hover:underline'
                >
                  privacy@doctorsclinic.services
                </a>
                .
              </p>
            </section>

            <section className='mb-10'>
              <h2
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('privacy.section7Title')}
              </h2>
              <p
                className='text-neutral-700 mb-4'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section7Intro')}
              </p>
              <ul
                className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'
                style={{ fontSize: '16px', lineHeight: '26px' }}
              >
                <li>{t('privacy.section7Li1')}</li>
                <li>{t('privacy.section7Li2')}</li>
                <li>{t('privacy.section7Li3')}</li>
                <li>{t('privacy.section7Li4')}</li>
                <li>{t('privacy.section7Li5')}</li>
              </ul>
            </section>

            <section className='mb-10'>
              <h2
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('privacy.section8Title')}
              </h2>
              <p
                className='text-neutral-700 mb-4'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section8Intro')}
              </p>
              <ul
                className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'
                style={{ fontSize: '16px', lineHeight: '26px' }}
              >
                <li>{t('privacy.section8Li1')}</li>
                <li>{t('privacy.section8Li2')}</li>
                <li>{t('privacy.section8Li3')}</li>
              </ul>
              <p
                className='text-neutral-700'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section8Outro')}
              </p>
            </section>

            <section className='mb-10'>
              <h2
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('privacy.section9Title')}
              </h2>
              <p
                className='text-neutral-700 mb-4'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section9Intro')}
              </p>
              <ul
                className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'
                style={{ fontSize: '16px', lineHeight: '26px' }}
              >
                <li>{t('privacy.section9Li1')}</li>
                <li>{t('privacy.section9Li2')}</li>
                <li>{t('privacy.section9Li3')}</li>
              </ul>
            </section>

            <section className='mb-10'>
              <h2
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('privacy.section10Title')}
              </h2>
              <p
                className='text-neutral-700'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section10Text')}
              </p>
            </section>

            <section className='mb-10'>
              <h2
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('privacy.section11Title')}
              </h2>
              <p
                className='text-neutral-700'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section11Text')}
              </p>
            </section>

            <section className='mb-10'>
              <h2
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('privacy.section12Title')}
              </h2>
              <p
                className='text-neutral-700 mb-4'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('privacy.section12Intro')}
              </p>
              <div className='bg-neutral-100 border border-neutral-200 p-6 rounded-xl'>
                <p
                  className='text-neutral-700 mb-3'
                  style={{
                    fontSize: '16px',
                    lineHeight: '24px',
                  }}
                >
                  <strong className='text-neutral-900'>{t('privacy.section12Email')}:</strong>{' '}
                  <a
                    href='mailto:privacy@doctorsclinic.services'
                    className='text-primary-600 hover:text-primary-700 hover:underline'
                  >
                    privacy@doctorsclinic.services
                  </a>
                </p>
                <p
                  className='text-neutral-700 mb-3'
                  style={{
                    fontSize: '16px',
                    lineHeight: '24px',
                  }}
                >
                  <strong className='text-neutral-900'>{t('privacy.section12DPO')}:</strong>{' '}
                  <a
                    href='mailto:dpo@doctorsclinic.services'
                    className='text-primary-600 hover:text-primary-700 hover:underline'
                  >
                    dpo@doctorsclinic.services
                  </a>
                </p>
                <p
                  className='text-neutral-700'
                  style={{
                    fontSize: '16px',
                    lineHeight: '24px',
                  }}
                >
                  <strong className='text-neutral-900'>{t('privacy.section12Support')}:</strong>{' '}
                  <Link
                    href='/support/contact'
                    className='text-primary-600 hover:text-primary-700 hover:underline'
                  >
                    {t('privacy.contactSupport')}
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
