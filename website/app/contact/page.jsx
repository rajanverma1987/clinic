'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/marketing/Footer';
import { useI18n } from '@/contexts/I18nContext';

export default function ContactPage() {
  const { t } = useI18n();
  return (
    <div className='min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 pt-16 max-w-7xl mx-auto px-6 py-16'>
        <h1 className='text-3xl font-bold mb-6'>{t('contact.title')}</h1>
        <p className='text-neutral-600 mb-4'>
          {t('contact.emailIntro')}{' '}
          <a
            href='mailto:support@doctorsclinic.services'
            className='text-primary-600 hover:underline'
          >
            support@doctorsclinic.services
          </a>
          .
        </p>
        <p className='text-neutral-600'>{t('contact.loginHint')}</p>
      </main>
      <Footer />
    </div>
  );
}
