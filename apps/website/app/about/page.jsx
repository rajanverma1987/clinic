'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/marketing/Footer';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';

export default function AboutPage() {
  const { t } = useI18n();
  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1 pb-24 pt-32 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-4xl mx-auto'>
          {/* Back Link */}
          <div className='mb-8'>
            <Link
              href='/'
              className='inline-flex items-center text-primary-600 hover:text-primary-700 font-medium group text-base'
            >
              <svg
                className='w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform'
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
              Back to Home
            </Link>
          </div>

          {/* Header Section */}
          <div className='mb-12'>
            <h1 className='text-neutral-900 mb-4 text-3xl font-bold tracking-tight'>
              {t('about.title') || 'About'}
            </h1>
            <div className='flex items-center gap-3 flex-wrap'>
              <div className='flex items-center gap-2 bg-primary-100 px-3 py-1 rounded-full'>
                <svg
                  className='w-3.5 h-3.5 text-primary-600'
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
                <span className='text-primary-700 font-semibold text-xs'>
                  HIPAA & GDPR Compliant
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-8 md:p-12'>
            <p className='text-neutral-700 mb-6 text-base leading-relaxed'>
              {t('about.description') ||
                'We build software to help clinics and healthcare professionals manage appointments, patients, prescriptions, and billing — securely and in one place.'}
            </p>

            <div className='mt-8 pt-8 border-t border-neutral-200'>
              <h2 className='text-neutral-900 mb-4 text-2xl font-semibold'>Our Mission</h2>
              <p className='text-neutral-700 mb-4 text-base leading-relaxed'>
                We are dedicated to providing healthcare professionals with powerful, secure, and
                intuitive tools to manage their clinics efficiently. Our platform helps you focus on
                what matters most—delivering excellent patient care.
              </p>
            </div>

            <div className='mt-8 pt-8 border-t border-neutral-200'>
              <h2 className='text-neutral-900 mb-4 text-2xl font-semibold'>Why Choose Us</h2>
              <ul className='list-disc pl-6 text-neutral-700 space-y-2 text-base'>
                <li>Enterprise-grade security with HIPAA and GDPR compliance</li>
                <li>Comprehensive clinic management in one unified platform</li>
                <li>Designed for healthcare professionals, by healthcare professionals</li>
                <li>Scalable solution that grows with your practice</li>
                <li>24/7 support and regular feature updates</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
