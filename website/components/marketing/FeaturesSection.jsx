'use client';

import {
  BarChart2Icon,
  BellIcon,
  CalendarIcon,
  ChevronDownIcon,
  DocumentIcon,
  HomeIcon,
  InventoryIcon,
  LanguagesIcon,
  PrescriptionIcon,
  QueueIcon,
  ReceiptIcon,
  SmartphoneIcon,
  UsersIcon,
} from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';

const iconClass = 'icon icon-lg';

export function FeaturesSection({ showAllFeatures, onToggleFeatures }) {
  const { t } = useI18n();

  const features = [
    {
      title: t('homepage.patientManagement'),
      description: t('homepage.patientManagementDesc'),
      icon: <UsersIcon className={`${iconClass} text-primary-600`} />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.appointmentScheduling'),
      description: t('homepage.appointmentSchedulingDesc'),
      icon: <CalendarIcon className={`${iconClass} text-primary-700`} />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.billingInvoicing'),
      description: t('homepage.billingInvoicingDesc'),
      icon: <ReceiptIcon className={`${iconClass} text-primary-600`} />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.reportsAnalytics'),
      description: t('homepage.reportsAnalyticsDesc'),
      icon: <BarChart2Icon className={`${iconClass} text-primary-700`} />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.automatedReminders'),
      description: t('homepage.automatedRemindersDesc'),
      icon: <BellIcon className={`${iconClass} text-primary-600`} />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.multiLocationSupport'),
      description: t('homepage.multiLocationSupportDesc'),
      icon: <HomeIcon className={`${iconClass} text-primary-700`} />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.clinicalNotes'),
      description: t('homepage.clinicalNotesDesc'),
      icon: <DocumentIcon className={`${iconClass} text-primary-600`} />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.prescriptions'),
      description: t('homepage.prescriptionsDesc'),
      icon: <PrescriptionIcon className={`${iconClass} text-primary-700`} />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.inventoryManagement'),
      description: t('homepage.inventoryManagementDesc'),
      icon: <InventoryIcon className={`${iconClass} text-primary-600`} />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.queueManagement'),
      description: t('homepage.queueManagementDesc'),
      icon: <QueueIcon className={`${iconClass} text-primary-700`} />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.multiLanguageSupport'),
      description: t('homepage.multiLanguageSupportDesc'),
      icon: <LanguagesIcon className={`${iconClass} text-primary-600`} />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.mobileReadyPlatform'),
      description: t('homepage.mobileReadyPlatformDesc'),
      icon: <SmartphoneIcon className={`${iconClass} text-primary-700`} />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
  ];

  return (
    <section
      id='features'
      className='bg-gradient-to-b from-white via-neutral-50/50 to-white relative overflow-hidden'
      style={{
        paddingTop: '64px',
        paddingBottom: '64px',
        paddingLeft: '32px',
        paddingRight: '32px',
      }}
    >
      <div
        className='absolute top-1/4 right-0 bg-primary-100/30 rounded-full mix-blend-multiply filter opacity-40'
        style={{ width: '500px', height: '500px', filter: 'blur(100px)' }}
      />
      <div
        className='absolute bottom-1/4 left-0 bg-primary-100/30 rounded-full mix-blend-multiply filter opacity-40'
        style={{ width: '500px', height: '500px', filter: 'blur(100px)' }}
      />

      <div className='section-container relative z-10'>
        <div className='text-center mb-16'>
          <h2 className='section-title mb-6'>{t('homepage.featuresTitle')}</h2>
          <p className='text-neutral-700 max-w-3xl mx-auto text-body-lg'>
            {t('homepage.featuresDescription')}
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' style={{ gap: '32px' }}>
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group bg-white border border-neutral-200 rounded-xl ${feature.hoverColor} hover:shadow-lg ${feature.hidden ? 'hidden' : ''}`}
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
            <ChevronDownIcon
              className={showAllFeatures ? 'rotate-180' : ''}
              style={{ width: 'var(--space-5)', height: 'var(--space-5)' }}
            />
          </Button>
        </div>
      </div>
    </section>
  );
}
