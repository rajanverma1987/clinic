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

export function FeaturesSection({ showAllFeatures, onToggleFeatures }) {
  const { t } = useI18n();

  const features = [
    {
      title: t('homepage.patientManagement'),
      description: t('homepage.patientManagementDesc'),
      icon: <UsersIcon className='text-primary-600 w-7 h-7 shrink-0' />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.appointmentScheduling'),
      description: t('homepage.appointmentSchedulingDesc'),
      icon: <CalendarIcon className='text-primary-700 w-7 h-7 shrink-0' />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.billingInvoicing'),
      description: t('homepage.billingInvoicingDesc'),
      icon: <ReceiptIcon className='text-primary-600 w-7 h-7 shrink-0' />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.reportsAnalytics'),
      description: t('homepage.reportsAnalyticsDesc'),
      icon: <BarChart2Icon className='text-primary-700 w-7 h-7 shrink-0' />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.automatedReminders'),
      description: t('homepage.automatedRemindersDesc'),
      icon: <BellIcon className='text-primary-600 w-7 h-7 shrink-0' />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.multiLocationSupport'),
      description: t('homepage.multiLocationSupportDesc'),
      icon: <HomeIcon className='text-primary-700 w-7 h-7 shrink-0' />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
    },
    {
      title: t('homepage.clinicalNotes'),
      description: t('homepage.clinicalNotesDesc'),
      icon: <DocumentIcon className='text-primary-600 w-7 h-7 shrink-0' />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.prescriptions'),
      description: t('homepage.prescriptionsDesc'),
      icon: <PrescriptionIcon className='text-primary-700 w-7 h-7 shrink-0' />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.inventoryManagement'),
      description: t('homepage.inventoryManagementDesc'),
      icon: <InventoryIcon className='text-primary-600 w-7 h-7 shrink-0' />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.queueManagement'),
      description: t('homepage.queueManagementDesc'),
      icon: <QueueIcon className='text-primary-700 w-7 h-7 shrink-0' />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.multiLanguageSupport'),
      description: t('homepage.multiLanguageSupportDesc'),
      icon: <LanguagesIcon className='text-primary-600 w-7 h-7 shrink-0' />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
    {
      title: t('homepage.mobileReadyPlatform'),
      description: t('homepage.mobileReadyPlatformDesc'),
      icon: <SmartphoneIcon className='text-primary-700 w-7 h-7 shrink-0' />,
      bgColor: 'bg-primary-50',
      hoverColor: 'hover:border-primary-300',
      hidden: !showAllFeatures,
    },
  ];

  return (
    <section
      id='features'
      className='bg-gradient-to-b from-white via-neutral-50/50 to-white relative overflow-hidden section-padding-x section-padding-y'
    >
      <div className='absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary-100/30 rounded-full blur-[100px] mix-blend-multiply opacity-40' />
      <div className='absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-primary-100/30 rounded-full blur-[100px] mix-blend-multiply opacity-40' />

      <div className='max-w-7xl mx-auto relative z-10'>
        <div className='text-center mb-16'>
          <p className='text-primary-600 font-semibold text-sm uppercase tracking-wider mb-4'>
            {t('homepage.featuresOverline')}
          </p>
          <h2 className='text-neutral-900 text-[56px] leading-[64px] tracking-tight font-bold mb-6'>
            {t('homepage.featuresTitle')}
          </h2>
          <p className='text-neutral-700 max-w-3xl mx-auto text-xl leading-8 tracking-tight font-normal'>
            {t('homepage.featuresDescription')}
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group bg-white border border-neutral-200 rounded-xl p-8 ${feature.hoverColor} hover:shadow-lg ${feature.hidden ? 'hidden' : ''}`}
            >
              <div
                className={`${feature.bgColor} rounded-full flex items-center justify-center mb-6 w-14 h-14 transition-transform duration-300 hover:scale-[1.02]`}
              >
                {feature.icon}
              </div>
              <h3 className='text-neutral-900 font-semibold text-xl leading-7 tracking-tight mb-3'>
                {feature.title}
              </h3>
              <p className='text-neutral-600 text-[15px] leading-6 tracking-tight font-normal'>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className='text-center flex justify-center items-center mt-12 pt-8'>
          <Button
            variant='secondary'
            size='lg'
            onClick={onToggleFeatures}
            className='flex items-center justify-center gap-3 min-w-[200px] px-6 py-3'
          >
            <span>{showAllFeatures ? t('homepage.viewLess') : t('homepage.viewMore')}</span>
            <ChevronDownIcon
              className={`w-5 h-5 shrink-0 ${showAllFeatures ? 'rotate-180' : ''}`}
            />
          </Button>
        </div>
      </div>
    </section>
  );
}
