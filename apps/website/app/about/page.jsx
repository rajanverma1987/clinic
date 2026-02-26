'use client';

import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useI18n } from '@/contexts/I18nContext';

export default function AboutPage() {
  const { t } = useI18n();
  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1' style={{ paddingTop: '120px' }}>
        <div
          className='max-w-4xl mx-auto'
          style={{ paddingLeft: '32px', paddingRight: '32px', paddingBottom: '64px' }}
        >
          <Breadcrumb items={[{ label: t('common.home'), href: '/' }, { label: t('navigation.about') }]} />

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
              {t('about.title')}
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
                  {t('about.hipaaGdprBadge')}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-8 md:p-12'>
            <p className='text-neutral-700 mb-6 text-base leading-relaxed'>
              {t('about.description')}
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
                {t('about.ourMission')}
              </h2>
              <p className='text-neutral-700 mb-4 text-base leading-relaxed'>
                {t('about.missionText')}
              </p>
            </div>

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
                {t('about.whyChooseUs')}
              </h2>
              <ul className='list-disc pl-6 text-neutral-700 space-y-2 text-base'>
                <li>{t('about.bullet1')}</li>
                <li>{t('about.bullet2')}</li>
                <li>{t('about.bullet3')}</li>
                <li>{t('about.bullet4')}</li>
                <li>{t('about.bullet5')}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
