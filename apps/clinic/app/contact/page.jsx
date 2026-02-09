'use client';

import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';

export default function ContactPage() {
  const { t } = useI18n();
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@doctorsclinic.services';

  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1 pb-24 px-4 sm:px-6 lg:px-8' style={{ paddingTop: '120px' }}>
        <div className='max-w-4xl mx-auto'>
          {/* Back Link */}
          <div className='mb-8'>
            <Link
              href='/pricing'
              className='inline-flex items-center text-primary-600 hover:text-primary-700 font-medium group'
              style={{ fontSize: '15px', lineHeight: '24px' }}
            >
              <svg
                style={{ width: '18px', height: '18px', marginRight: '8px' }}
                className='group-hover:-translate-x-1 transition-transform'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
              Back to Pricing
            </Link>
          </div>

          {/* Header Section */}
          <div className='mb-12'>
            <h1
              className='text-neutral-900 mb-4'
              style={{
                fontSize: '32px',
                lineHeight: '40px',
                letterSpacing: '-0.02em',
                fontWeight: '700',
              }}
            >
              {t('contact.title') || 'Contact'}
            </h1>
            <p
              className='text-neutral-600 mb-6'
              style={{
                fontSize: '16px',
                lineHeight: '24px',
                letterSpacing: '-0.01em',
              }}
            >
              {t('contact.emailIntro') || 'For general inquiries or support, email us at'}{' '}
              <a
                href={`mailto:${supportEmail}`}
                className='text-primary-600 hover:text-primary-700 hover:underline'
              >
                {supportEmail}
              </a>
              .
            </p>
          </div>

          {/* Content */}
          <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-8 md:p-12 mb-8'>
            <p
              className='text-neutral-700 mb-6'
              style={{
                fontSize: '16px',
                lineHeight: '26px',
                letterSpacing: '-0.01em',
              }}
            >
              {t('contact.loginHint') ||
                'Existing users: sign in to your account for in-app support and faster help.'}
            </p>

            <div className='mt-8 pt-8 border-t border-neutral-200'>
              <h2
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                Need More Help?
              </h2>
              <p
                className='text-neutral-700 mb-6'
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                For detailed inquiries, technical support, or to submit a contact form, visit our
                support center.
              </p>
              <Link
                href='/support/contact'
                className='inline-flex items-center text-primary-600 hover:text-primary-700 font-medium'
                style={{ fontSize: '16px' }}
              >
                {t('contact.formPage') || 'Use the contact form'}
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
          </div>

          {/* Contact Information Card */}
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
              Contact Information
            </h2>
            <div className='space-y-4'>
              <div className='bg-white p-4 rounded-lg border border-neutral-200'>
                <h3 className='text-neutral-900 font-semibold mb-2' style={{ fontSize: '16px' }}>
                  Support Email
                </h3>
                <a
                  href={`mailto:${supportEmail}`}
                  className='text-primary-600 hover:text-primary-700 hover:underline'
                  style={{ fontSize: '14px' }}
                >
                  {supportEmail}
                </a>
              </div>
              <div className='bg-white p-4 rounded-lg border border-neutral-200'>
                <h3 className='text-neutral-900 font-semibold mb-2' style={{ fontSize: '16px' }}>
                  Response Time
                </h3>
                <p className='text-neutral-700' style={{ fontSize: '14px' }}>
                  We typically respond within 24 hours during business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
