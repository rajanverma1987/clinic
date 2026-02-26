'use client';

import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { CLINIC_APP_URL } from '@/lib/config';
import Link from 'next/link';

export default function ApiDocsPage() {
  const { t } = useI18n();
  const clinicAppUrl = CLINIC_APP_URL.replace(/\/$/, '');

  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1 page-main'>
        <section className='bg-gradient-to-br from-white via-neutral-50 to-primary-50/30 relative overflow-hidden pt-12 pb-12 px-8'>
          <div
            className='absolute top-0 right-0 bg-primary-100 rounded-full mix-blend-multiply filter opacity-30'
            style={{ width: '400px', height: '400px', filter: 'blur(100px)' }}
          />
          <div
            className='absolute bottom-0 left-0 bg-secondary-100 rounded-full mix-blend-multiply filter opacity-30'
            style={{ width: '400px', height: '400px', filter: 'blur(100px)' }}
          />

          <div className='max-w-4xl mx-auto relative z-10'>
            <Breadcrumb
              items={[
                { label: t('navigation.home'), href: '/' },
                { label: t('navigation.support'), href: '/support' },
                { label: t('navigation.documentation') },
              ]}
            />

            <h1 className='text-h1 text-neutral-900 mb-4'>Documentation & API</h1>
            <p className='text-neutral-700 mb-8 text-base leading-relaxed max-w-2xl'>
              Access user guides, API documentation, and integration resources for Doctor&apos;s
              Clinic.
            </p>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <Link
                href='/support'
                className='block bg-white rounded-xl border-2 border-neutral-200 p-6 hover:border-primary-300 hover:shadow-lg transition-all group'
              >
                <div className='flex items-center gap-4 mb-4'>
                  <div className='bg-primary-100 rounded-lg p-3 group-hover:bg-primary-200'>
                    <svg
                      className='w-8 h-8 text-primary-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                      />
                    </svg>
                  </div>
                  <h2 className='text-xl font-bold text-neutral-900'>User Guides</h2>
                </div>
                <p className='text-neutral-600 text-sm mb-4'>
                  Learn how to get started, manage appointments, patients, billing, and more.
                </p>
                <span className='text-primary-600 font-medium group-hover:underline'>
                  Visit Support Center →
                </span>
              </Link>

              <div className='block bg-white rounded-xl border-2 border-neutral-200 p-6'>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='bg-neutral-100 rounded-lg p-3'>
                    <svg
                      className='w-8 h-8 text-neutral-500'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
                      />
                    </svg>
                  </div>
                  <h2 className='text-xl font-bold text-neutral-900'>API Documentation</h2>
                </div>
                <p className='text-neutral-600 text-sm mb-4'>
                  REST API documentation is available for enterprise customers. Contact us for API
                  access.
                </p>
                <Link href='/support/contact'>
                  <Button variant='outline' size='md'>
                    Request API Access
                  </Button>
                </Link>
              </div>
            </div>

            <div className='mt-12 p-6 bg-primary-50 rounded-xl border border-primary-200'>
              <h3 className='text-lg font-semibold text-neutral-900 mb-2'>Need Help?</h3>
              <p className='text-neutral-700 text-sm mb-4'>
                Our support team is available to answer your questions and help you integrate with
                Doctor&apos;s Clinic.
              </p>
              <div className='flex flex-wrap gap-4'>
                <Link href='/support/contact'>
                  <Button variant='primary' size='md'>
                    Contact Support
                  </Button>
                </Link>
                <a href={`${clinicAppUrl}/register`}>
                  <Button variant='secondary' size='md'>
                    Start Free Trial
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
