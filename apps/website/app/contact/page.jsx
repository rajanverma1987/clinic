'use client';

import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';

const SUPPORT_EMAIL = 'support@doctorsclinic.services';

export default function ContactPage() {
  const { t } = useI18n();
  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1 page-main'>
        <div className='page-content page-content-narrow'>
          <Breadcrumb
            items={[{ label: t('navigation.home'), href: '/' }, { label: t('navigation.contact') }]}
          />

          {/* Header Section */}
          <div className='mb-8'>
            <h1 className='text-h1 text-neutral-900 mb-4'>{t('contact.title')}</h1>
            <p className='text-neutral-600 mb-6 text-base'>
              {t('contact.emailIntro')}{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className='text-primary-600 hover:text-primary-700 hover:underline'
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </div>

          {/* Content */}
          <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-8 md:p-12 mb-8'>
            <p className='text-neutral-700 mb-6 text-base leading-relaxed'>
              {t('contact.loginHint')}
            </p>

            <div className='mt-8 pt-8 border-t border-neutral-200'>
              <h2 className='text-h2 text-neutral-900 mb-4'>{t('contact.needMoreHelp')}</h2>
              <p className='text-neutral-700 mb-6 text-base leading-relaxed'>
                {t('contact.supportCenterIntro')}
              </p>
              <Link
                href='/support/contact'
                className='inline-flex items-center text-primary-600 hover:text-primary-700 font-medium'
              >
                {t('contact.formPage')}
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
            <h2 className='text-h2 text-neutral-900 mb-4'>Contact Information</h2>
            <div className='space-y-4'>
              <div className='bg-white p-4 rounded-lg border border-neutral-200'>
                <h3 className='text-neutral-900 font-semibold mb-2'>Support Email</h3>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className='text-primary-600 hover:text-primary-700 hover:underline text-sm'
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
              <div className='bg-white p-4 rounded-lg border border-neutral-200'>
                <h3 className='text-neutral-900 font-semibold mb-2'>Response Time</h3>
                <p className='text-neutral-700 text-sm'>
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
