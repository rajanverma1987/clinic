'use client';

import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';

export function FeaturesSection({ showAllFeatures, onToggleFeatures }) {
  const { t } = useI18n();

  const features = [
    {
      title: t('homepage.patientManagement'),
      description: t('homepage.patientManagementDesc'),
      icon: (
        <svg
          style={{ width: '28px', height: '28px' }}
          className='text-primary-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth={2}
        >
          <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
          <circle cx='9' cy='7' r='4' />
          <path d='M22 21v-2a4 4 0 0 0-3-3.87' />
          <path d='M16 3.13a4 4 0 0 1 0 7.75' />
        </svg>
      ),
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.appointmentScheduling'),
      description: t('homepage.appointmentSchedulingDesc'),
      icon: (
        <svg
          style={{ width: '28px', height: '28px' }}
          className='text-secondary-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth={2}
        >
          <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
          <line x1='16' y1='2' x2='16' y2='6' />
          <line x1='8' y1='2' x2='8' y2='6' />
          <line x1='3' y1='10' x2='21' y2='10' />
        </svg>
      ),
      bgColor: 'bg-secondary-50',
      hoverColor: 'hover:border-secondary-300',
    },
    {
      title: t('homepage.billingInvoicing'),
      description: t('homepage.billingInvoicingDesc'),
      icon: (
        <svg
          style={{ width: '28px', height: '28px' }}
          className='text-primary-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth={2}
        >
          <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
          <path d='M14 2v6h6' />
          <path d='M16 13H8' />
          <path d='M16 17H8' />
          <path d='M10 9H8' />
        </svg>
      ),
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.reportsAnalytics'),
      description: t('homepage.reportsAnalyticsDesc'),
      icon: (
        <svg
          style={{ width: '28px', height: '28px' }}
          className='text-secondary-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth={2}
        >
          <line x1='18' y1='20' x2='18' y2='10' />
          <line x1='12' y1='20' x2='12' y2='4' />
          <line x1='6' y1='20' x2='6' y2='14' />
        </svg>
      ),
      bgColor: 'bg-secondary-50',
      hoverColor: 'hover:border-secondary-300',
    },
    {
      title: t('homepage.automatedReminders'),
      description: t('homepage.automatedRemindersDesc'),
      icon: (
        <svg
          style={{ width: '28px', height: '28px' }}
          className='text-primary-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth={2}
        >
          <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' />
          <path d='M13.73 21a2 2 0 0 1-3.46 0' />
        </svg>
      ),
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.multiLocationSupport'),
      description: t('homepage.multiLocationSupportDesc'),
      icon: (
        <svg
          style={{ width: '28px', height: '28px' }}
          className='text-secondary-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth={2}
        >
          <path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' />
          <polyline points='9 22 9 12 15 12 15 22' />
        </svg>
      ),
      bgColor: 'bg-secondary-50',
      hoverColor: 'hover:border-secondary-300',
    },
    {
      title: t('homepage.clinicalNotes'),
      description: t('homepage.clinicalNotesDesc'),
      icon: (
        <svg
          style={{ width: '28px', height: '28px' }}
          className='text-primary-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth={2}
        >
          <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
          <path d='M14 2v6h6' />
          <path d='M16 13H8' />
          <path d='M16 17H8' />
          <path d='M10 9H8' />
        </svg>
      ),
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.prescriptions'),
      description: t('homepage.prescriptionsDesc'),
      icon: (
        <svg
          style={{ width: '28px', height: '28px' }}
          className='text-secondary-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth={2}
        >
          <rect x='3' y='8' width='18' height='4' rx='1' />
          <path d='M12 8v13' />
          <path d='M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7' />
          <path d='M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5' />
        </svg>
      ),
      bgColor: 'bg-secondary-50',
      hoverColor: 'hover:border-secondary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.inventoryManagement'),
      description: t('homepage.inventoryManagementDesc'),
      icon: (
        <svg
          style={{ width: '28px', height: '28px' }}
          className='text-primary-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth={2}
        >
          <path d='M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z' />
          <line x1='3' y1='6' x2='21' y2='6' />
          <path d='M16 10a4 4 0 0 1-8 0' />
        </svg>
      ),
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.queueManagement'),
      description: t('homepage.queueManagementDesc'),
      icon: (
        <svg
          style={{ width: '28px', height: '28px' }}
          className='text-secondary-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth={2}
        >
          <rect x='3' y='5' width='6' height='6' rx='1' />
          <path d='M3 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0z' />
          <path d='M13 7h8' />
          <path d='M13 17h8' />
          <path d='M13 12h8' />
        </svg>
      ),
      bgColor: 'bg-secondary-50',
      hoverColor: 'hover:border-secondary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.multiLanguageSupport'),
      description: t('homepage.multiLanguageSupportDesc'),
      icon: (
        <svg
          style={{ width: '28px', height: '28px' }}
          className='text-primary-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth={2}
        >
          <circle cx='12' cy='12' r='10' />
          <line x1='2' y1='12' x2='22' y2='12' />
          <path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' />
        </svg>
      ),
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.mobileReadyPlatform'),
      description: t('homepage.mobileReadyPlatformDesc'),
      icon: (
        <svg
          style={{ width: '28px', height: '28px' }}
          className='text-secondary-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth={2}
        >
          <rect x='5' y='2' width='14' height='20' rx='2' ry='2' />
          <line x1='12' y1='18' x2='12.01' y2='18' />
        </svg>
      ),
      bgColor: 'bg-secondary-50',
      hoverColor: 'hover:border-secondary-300',
      hidden: !showAllFeatures,
    },
  ];

  return (
    <section
      id='features'
      className='bg-gradient-to-b from-white via-neutral-50/50 to-white relative overflow-hidden'
      style={{
        paddingTop: '100px',
        paddingBottom: '100px',
        paddingLeft: '32px',
        paddingRight: '32px',
      }}
    >
      <div
        className='absolute top-1/4 right-0 bg-primary-100/30 rounded-full mix-blend-multiply filter opacity-40'
        style={{ width: '500px', height: '500px', filter: 'blur(100px)' }}
      ></div>
      <div
        className='absolute bottom-1/4 left-0 bg-secondary-100/30 rounded-full mix-blend-multiply filter opacity-40'
        style={{ width: '500px', height: '500px', filter: 'blur(100px)' }}
      ></div>

      <div className='max-w-7xl mx-auto relative z-10'>
        <div className='text-center' style={{ marginBottom: '64px' }}>
          <h2
            className='text-neutral-900'
            style={{
              fontSize: '56px',
              lineHeight: '64px',
              letterSpacing: '-0.02em',
              fontWeight: '700',
              marginBottom: '24px',
            }}
          >
            {t('homepage.featuresTitle')}
          </h2>
          <p
            className='text-neutral-700 max-w-3xl mx-auto'
            style={{
              fontSize: '20px',
              lineHeight: '32px',
              letterSpacing: '-0.01em',
              fontWeight: '400',
            }}
          >
            {t('homepage.featuresDescription')}
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' style={{ gap: '32px' }}>
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group bg-white border border-neutral-200 rounded-xl ${
                feature.hoverColor
              } hover:shadow-lg ${feature.hidden ? 'hidden' : ''}`}
              style={{ padding: '32px' }}
            >
              <div
                className={`${feature.bgColor} rounded-full flex items-center justify-center mb-6 transition-transform duration-300`}
                style={{ width: '56px', height: '56px', transform: 'scale(1)' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {feature.icon}
              </div>
              <h3
                className='text-neutral-900 font-semibold'
                style={{
                  fontSize: '20px',
                  lineHeight: '28px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                  marginBottom: '12px',
                }}
              >
                {feature.title}
              </h3>
              <p
                className='text-neutral-600'
                style={{
                  fontSize: '15px',
                  lineHeight: '24px',
                  letterSpacing: '-0.01em',
                  fontWeight: '400',
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div
          className='text-center flex justify-center items-center'
          style={{
            marginTop: 'var(--space-12)',
            paddingTop: 'var(--space-8)',
          }}
        >
          <Button
            variant='secondary'
            size='lg'
            onClick={onToggleFeatures}
            className='flex items-center justify-center gap-3'
            style={{
              minWidth: '200px',
              paddingLeft: 'var(--space-6)',
              paddingRight: 'var(--space-6)',
              paddingTop: 'var(--space-3)',
              paddingBottom: 'var(--space-3)',
            }}
          >
            <span>{showAllFeatures ? t('homepage.viewLess') : t('homepage.viewMore')}</span>
            <svg
              className={`${showAllFeatures ? 'rotate-180' : ''}`}
              style={{ width: 'var(--space-5)', height: 'var(--space-5)' }}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </Button>
        </div>
      </div>
    </section>
  );
}
