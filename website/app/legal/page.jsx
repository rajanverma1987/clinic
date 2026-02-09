'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/marketing/Footer';
import { Disclaimer } from '@/components/ui/Disclaimer';
import Link from 'next/link';

const SUPPORT_EMAIL = 'support@doctorsclinic.services';

export default function LegalPage() {
  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1 pb-24 pt-32 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-5xl mx-auto'>
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

          <div className='mb-12'>
            <h1 className='text-neutral-900 mb-4 text-3xl font-bold tracking-tight'>
              Legal Information & Disclaimers
            </h1>
            <div className='flex items-center gap-3 flex-wrap'>
              <p className='text-neutral-600 text-base'>
                Last updated:{' '}
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <span className='text-neutral-300'>•</span>
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

          <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mb-8'>
            <h2 className='text-xl font-semibold text-neutral-900 mb-4'>Quick Navigation</h2>
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
                <span className='text-neutral-700'>Disclaimers</span>
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
                <span className='text-neutral-700'>Privacy Policy</span>
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
                <span className='text-neutral-700'>Terms of Service</span>
              </Link>
              <Link
                href='/contact'
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
                <span className='text-neutral-700'>Contact Support</span>
              </Link>
            </div>
          </div>

          <div id='disclaimers' className='space-y-8 mb-12'>
            <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-8'>
              <h2 className='text-neutral-900 mb-6 text-2xl font-semibold'>
                Important Disclaimers
              </h2>
              <p className='text-neutral-700 mb-6 text-base'>
                The following disclaimers apply to all users of this clinic management system.
                Please read them carefully.
              </p>
              <div className='mb-6'>
                <Disclaimer type='general' />
              </div>
              <div className='mb-6'>
                <Disclaimer type='medical' />
              </div>
              <div className='mb-6'>
                <Disclaimer type='prescription' />
              </div>
              <div className='mb-6'>
                <Disclaimer type='telemedicine' />
              </div>
              <div>
                <Disclaimer type='data' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-8 mb-8'>
            <h2 className='text-neutral-900 mb-4 text-2xl font-semibold'>Terms of Service</h2>
            <p className='text-neutral-700 mb-4 text-base leading-relaxed'>
              By using this clinic management system, you agree to our Terms of Service. Key points
              include:
            </p>
            <ul className='list-disc pl-6 text-neutral-700 mb-4 space-y-2 text-base'>
              <li>You must be at least 18 years old to use this service</li>
              <li>You are responsible for maintaining account security</li>
              <li>
                You must comply with all applicable healthcare regulations (HIPAA, GDPR, etc.)
              </li>
              <li>You agree not to use the service for illegal purposes</li>
              <li>We reserve the right to terminate accounts that violate these terms</li>
            </ul>
            <Link
              href='/terms'
              className='inline-flex items-center text-primary-600 hover:text-primary-700 font-medium'
            >
              Read Full Terms of Service
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

          <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-8 mb-8'>
            <h2 className='text-neutral-900 mb-4 text-2xl font-semibold'>Privacy Policy</h2>
            <p className='text-neutral-700 mb-4 text-base leading-relaxed'>
              We are committed to protecting your privacy and the security of Protected Health
              Information (PHI). Our privacy practices include:
            </p>
            <ul className='list-disc pl-6 text-neutral-700 mb-4 space-y-2 text-base'>
              <li>AES-256-GCM encryption for all PHI at rest and in transit</li>
              <li>Role-based access control and multi-factor authentication</li>
              <li>Comprehensive audit logging for all data access</li>
              <li>Compliance with HIPAA and GDPR regulations</li>
              <li>No sale or sharing of PHI for marketing purposes</li>
              <li>Your rights to access, correct, and delete your data (GDPR)</li>
            </ul>
            <Link
              href='/privacy'
              className='inline-flex items-center text-primary-600 hover:text-primary-700 font-medium'
            >
              Read Full Privacy Policy
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

          <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-8 mb-8'>
            <h2 className='text-neutral-900 mb-4 text-2xl font-semibold'>
              Compliance & Regulations
            </h2>
            <div className='space-y-6'>
              <div>
                <h3 className='text-neutral-900 mb-3 text-xl font-semibold'>
                  HIPAA Compliance (United States)
                </h3>
                <p className='text-neutral-700 mb-3 text-base'>
                  We comply with HIPAA and act as a Business Associate. We maintain administrative,
                  physical, and technical safeguards, BAAs, and incident reporting.
                </p>
              </div>
              <div>
                <h3 className='text-neutral-900 mb-3 text-xl font-semibold'>
                  GDPR Compliance (European Union)
                </h3>
                <p className='text-neutral-700 mb-3 text-base'>
                  For EEA users we comply with GDPR. You have the right to access, rectify, erasure,
                  restrict processing, data portability, and to object.
                </p>
              </div>
              <div>
                <h3 className='text-neutral-900 mb-3 text-xl font-semibold'>Global Compliance</h3>
                <p className='text-neutral-700 text-base'>
                  We strive to comply with applicable data protection laws (HIPAA, GDPR, PIPEDA,
                  PDPA, and other regional regulations).
                </p>
              </div>
            </div>
          </div>

          <div className='bg-primary-50 rounded-xl border border-primary-200 p-8'>
            <h2 className='text-neutral-900 mb-4 text-2xl font-semibold'>Questions or Concerns?</h2>
            <p className='text-neutral-700 mb-6 text-base'>
              If you have questions about our legal policies, disclaimers, or compliance practices,
              please contact us:
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-white p-4 rounded-lg border border-neutral-200'>
                <h3 className='text-neutral-900 font-semibold mb-2'>General Support</h3>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className='text-primary-600 hover:text-primary-700 hover:underline text-sm'
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
              <div className='bg-white p-4 rounded-lg border border-neutral-200'>
                <h3 className='text-neutral-900 font-semibold mb-2'>Contact Support</h3>
                <Link
                  href='/contact'
                  className='text-primary-600 hover:text-primary-700 hover:underline text-sm'
                >
                  Contact page
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
