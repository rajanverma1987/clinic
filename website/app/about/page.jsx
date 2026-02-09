'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/marketing/Footer';
import { useI18n } from '@/contexts/I18nContext';

export default function AboutPage() {
  const { t } = useI18n();
  return (
    <div className='min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 pt-16 max-w-7xl mx-auto px-6 py-16'>
        <h1 className='text-3xl font-bold mb-6'>{t('about.title')}</h1>
        <p className='text-neutral-600 max-w-2xl'>{t('about.description')}</p>
      </main>
      <Footer />
    </div>
  );
}
