'use client';

import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';

export default function LegalPage() {
  const { t, locale } = useI18n();
  const dateLocale = locale === 'ar' ? 'ar-EG' : locale === 'es' ? 'es' : 'en-US';
  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1 page-main'>
        <div className='page-content page-content-wide'>
          <Breadcrumb
            items={[{ label: t('navigation.home'), href: '/' }, { label: t('footer.legalInfo') }]}
          />

          {/* Header Section */}
          <div className='mb-12'>
            <h1 className='text-h1 text-neutral-900 mb-4'>
              {t('legal.title')}
            </h1>
            <div className='flex items-center gap-3 flex-wrap'>
              <p className='text-body-md text-neutral-600'>
                {t('legal.lastUpdated')}{' '}
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
                <span className='text-body-xs font-semibold text-primary-700'>
                  {t('homepage.hipaaGdprCompliant')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mb-8'>
            <h2 className='text-h3 text-neutral-900 mb-4'>{t('legal.quickNav')}</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Link
                href='#disclaimers'
                className='flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-colors'
              >
                <svg
                  className='w-5 h-5 text-neutral-900'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <span className='text-body-md text-neutral-700'>{t('legal.disclaimers')}</span>
              </Link>
              <Link
                href='/privacy'
                className='flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-colors'
              >
                <svg
                  className='w-5 h-5 text-neutral-900'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                  />
                </svg>
                <span className='text-body-md text-neutral-700'>{t('legal.privacyPolicy')}</span>
              </Link>
              <Link
                href='/terms'
                className='flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-colors'
              >
                <svg
                  className='w-5 h-5 text-neutral-900'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                <span className='text-body-md text-neutral-700'>{t('legal.termsOfService')}</span>
              </Link>
              <Link
                href='/support/contact'
                className='flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-colors'
              >
                <svg
                  className='w-5 h-5 text-neutral-900'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                  />
                </svg>
                <span className='text-body-md text-neutral-700'>{t('legal.contactSupport')}</span>
              </Link>
            </div>
          </div>

          {/* All Disclaimers Section */}
          <div id='disclaimers' className='space-y-8 mb-12'>
            <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-8'>
              <h2
                className='text-neutral-900 mb-6'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {t('legal.importantDisclaimers')}
              </h2>
              <p
                className='text-neutral-700 mb-6'
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: '400',
                }}
              >
                {t('legal.disclaimersIntro')}
              </p>

              {/* HIPAA Compliance Disclaimer */}
              <div className='mb-6'>
                <Disclaimer type='general' />
              </div>

              {/* Medical Disclaimer */}
              <div className='mb-6'>
                <Disclaimer type='medical' />
              </div>

              {/* Prescription Disclaimer */}
              <div className='mb-6'>
                <Disclaimer type='prescription' />
              </div>

              {/* Telemedicine Disclaimer */}
              <div className='mb-6'>
                <Disclaimer type='telemedicine' />
              </div>

              {/* Data Protection Disclaimer */}
              <div>
                <Disclaimer type='data' />
              </div>
            </div>
          </div>

          {/* Terms of Service Summary */}
          <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-8 mb-8'>
            <h2
              className='text-neutral-900 mb-4'
              style={{
                fontSize: '24px',
                lineHeight: '32px',
                letterSpacing: '-0.01em',
                fontWeight: '600',
              }}
            >
              {t('legal.termsSummaryTitle')}
            </h2>
            <p
              className='text-neutral-700 mb-4'
              style={{
                fontSize: '16px',
                lineHeight: '26px',
              }}
            >
              {t('legal.termsSummaryIntro')}
            </p>
            <ul
              className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'
              style={{ fontSize: '16px', lineHeight: '26px' }}
            >
              <li>{t('legal.termsPoint1')}</li>
              <li>{t('legal.termsPoint2')}</li>
              <li>{t('legal.termsPoint3')}</li>
              <li>{t('legal.termsPoint4')}</li>
              <li>{t('legal.termsPoint5')}</li>
            </ul>
            <Link
              href='/terms'
              className='inline-flex items-center text-primary-600 hover:text-primary-700 font-medium'
              style={{ fontSize: '16px' }}
            >
              {t('legal.readFullTerms')}
              <svg className='w-4 h-4 ml-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </Link>
          </div>

          {/* Privacy Policy Summary */}
          <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-8 mb-8'>
            <h2
              className='text-neutral-900 mb-4'
              style={{
                fontSize: '24px',
                lineHeight: '32px',
                letterSpacing: '-0.01em',
                fontWeight: '600',
              }}
            >
              {t('legal.privacySummaryTitle')}
            </h2>
            <p
              className='text-neutral-700 mb-4'
              style={{
                fontSize: '16px',
                lineHeight: '26px',
              }}
            >
              {t('legal.privacySummaryIntro')}
            </p>
            <ul
              className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'
              style={{ fontSize: '16px', lineHeight: '26px' }}
            >
              <li>{t('legal.privacyBullet1')}</li>
              <li>{t('legal.privacyBullet2')}</li>
              <li>{t('legal.privacyBullet3')}</li>
              <li>{t('legal.privacyBullet4')}</li>
              <li>{t('legal.privacyBullet5')}</li>
              <li>{t('legal.privacyBullet6')}</li>
            </ul>
            <Link
              href='/privacy'
              className='inline-flex items-center text-primary-600 hover:text-primary-700 font-medium'
              style={{ fontSize: '16px' }}
            >
              {t('legal.readFullPrivacy')}
              <svg className='w-4 h-4 ml-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </Link>
          </div>

          {/* Compliance Information */}
          <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-8 mb-8'>
            <h2
              className='text-neutral-900 mb-4'
              style={{
                fontSize: '24px',
                lineHeight: '32px',
                letterSpacing: '-0.01em',
                fontWeight: '600',
              }}
            >
              {t('legal.complianceTitle')}
            </h2>
            <div className='space-y-6'>
              <div>
                <h3
                  className='text-neutral-900 mb-3'
                  style={{
                    fontSize: '20px',
                    lineHeight: '28px',
                    fontWeight: '600',
                  }}
                >
                  {t('legal.hipaaTitle')}
                </h3>
                <p
                  className='text-neutral-700 mb-3'
                  style={{
                    fontSize: '16px',
                    lineHeight: '26px',
                  }}
                >
                  {t('legal.hipaaIntro')}
                </p>
                <ul
                  className='list-disc pl-6 text-neutral-700 space-y-2'
                  style={{ fontSize: '16px', lineHeight: '26px' }}
                >
                  <li>{t('legal.hipaaBullet1')}</li>
                  <li>{t('legal.hipaaBullet2')}</li>
                  <li>{t('legal.hipaaBullet3')}</li>
                  <li>{t('legal.hipaaBullet4')}</li>
                </ul>
              </div>

              <div>
                <h3
                  className='text-neutral-900 mb-3'
                  style={{
                    fontSize: '20px',
                    lineHeight: '28px',
                    fontWeight: '600',
                  }}
                >
                  {t('legal.gdprTitle')}
                </h3>
                <p
                  className='text-neutral-700 mb-3'
                  style={{
                    fontSize: '16px',
                    lineHeight: '26px',
                  }}
                >
                  {t('legal.gdprIntro')}
                </p>
                <ul
                  className='list-disc pl-6 text-neutral-700 space-y-2'
                  style={{ fontSize: '16px', lineHeight: '26px' }}
                >
                  <li>{t('legal.gdprBullet1')}</li>
                  <li>{t('legal.gdprBullet2')}</li>
                  <li>{t('legal.gdprBullet3')}</li>
                  <li>{t('legal.gdprBullet4')}</li>
                  <li>{t('legal.gdprBullet5')}</li>
                  <li>{t('legal.gdprBullet6')}</li>
                </ul>
              </div>

              <div>
                <h3
                  className='text-neutral-900 mb-3'
                  style={{
                    fontSize: '20px',
                    lineHeight: '28px',
                    fontWeight: '600',
                  }}
                >
                  {t('legal.globalTitle')}
                </h3>
                <p
                  className='text-neutral-700'
                  style={{
                    fontSize: '16px',
                    lineHeight: '26px',
                  }}
                >
                  {t('legal.globalIntro')}
                </p>
                <ul
                  className='list-disc pl-6 text-neutral-700 mt-3 space-y-2'
                  style={{ fontSize: '16px', lineHeight: '26px' }}
                >
                  <li>{t('legal.globalBullet1')}</li>
                  <li>{t('legal.globalBullet2')}</li>
                  <li>{t('legal.globalBullet3')}</li>
                  <li>{t('legal.globalBullet4')}</li>
                  <li>{t('legal.globalBullet5')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className='bg-primary-50 rounded-xl border border-primary-200 p-8'>
            <h2
              className='text-neutral-900 mb-4'
              style={{
                fontSize: '24px',
                lineHeight: '32px',
                letterSpacing: '-0.01em',
                fontWeight: '600',
              }}
            >
              {t('legal.questionsTitle')}
            </h2>
            <p
              className='text-neutral-700 mb-6'
              style={{
                fontSize: '16px',
                lineHeight: '26px',
              }}
            >
              {t('legal.questionsIntro')}
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-white p-4 rounded-lg border border-neutral-200'>
                <h3 className='text-neutral-900 font-semibold mb-2' style={{ fontSize: '16px' }}>
                  {t('legal.privacyDataProtection')}
                </h3>
                <a
                  href='mailto:privacy@doctorsclinic.services'
                  className='text-primary-600 hover:text-primary-700 hover:underline'
                  style={{ fontSize: '14px' }}
                >
                  privacy@doctorsclinic.services
                </a>
              </div>
              <div className='bg-white p-4 rounded-lg border border-neutral-200'>
                <h3 className='text-neutral-900 font-semibold mb-2' style={{ fontSize: '16px' }}>
                  {t('legal.legalTerms')}
                </h3>
                <a
                  href='mailto:legal@doctorsclinic.services'
                  className='text-primary-600 hover:text-primary-700 hover:underline'
                  style={{ fontSize: '14px' }}
                >
                  legal@doctorsclinic.services
                </a>
              </div>
              <div className='bg-white p-4 rounded-lg border border-neutral-200'>
                <h3 className='text-neutral-900 font-semibold mb-2' style={{ fontSize: '16px' }}>
                  {t('legal.dpo')}
                </h3>
                <a
                  href='mailto:dpo@doctorsclinic.services'
                  className='text-primary-600 hover:text-primary-700 hover:underline'
                  style={{ fontSize: '14px' }}
                >
                  dpo@doctorsclinic.services
                </a>
              </div>
              <div className='bg-white p-4 rounded-lg border border-neutral-200'>
                <h3 className='text-neutral-900 font-semibold mb-2' style={{ fontSize: '16px' }}>
                  {t('legal.generalSupport')}
                </h3>
                <Link
                  href='/support/contact'
                  className='text-primary-600 hover:text-primary-700 hover:underline'
                  style={{ fontSize: '14px' }}
                >
                  {t('legal.contactSupport')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
