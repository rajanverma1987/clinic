'use client';

import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { ClientBreadcrumb } from '@/components/ui/ClientBreadcrumb';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';

export default function TermsPage() {
  const { t, locale } = useI18n();
  const dateLocale = locale === 'ar' ? 'ar-EG' : locale === 'es' ? 'es' : 'en-US';
  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1 page-main'>
        <div className='page-content page-content-narrow'>
          <ClientBreadcrumb
            items={[
              { href: '/', labelKey: 'navigation.home' },
              { labelKey: 'footer.termsOfService' },
            ]}
          />

          <h1 className='text-h1 text-neutral-900 mb-4'>
            {t('terms.pageTitle')}
          </h1>
          <p className='text-body-md text-neutral-600 mb-8'>
            {t('terms.lastUpdated')}{' '}
            {new Date().toLocaleDateString(dateLocale, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          <div className='prose prose-lg max-w-none'>
            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section1Title')}
              </h2>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section1P1')}
              </p>
              <p className='text-body-md text-neutral-700'>
                {t('terms.section1P2')}
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section2Title')}
              </h2>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section2Intro')}
              </p>
              <ul className='text-body-md list-disc pl-6 text-neutral-700 mb-4 space-y-2'>
                <li>{t('terms.section2Li1')}</li>
                <li>{t('terms.section2Li2')}</li>
                <li>{t('terms.section2Li3')}</li>
                <li>{t('terms.section2Li4')}</li>
                <li>{t('terms.section2Li5')}</li>
                <li>{t('terms.section2Li6')}</li>
                <li>{t('terms.section2Li7')}</li>
              </ul>
              <p className='text-body-md text-neutral-700'>
                {t('terms.section2Outro')}
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section3Title')}
              </h2>
              <h3 className='text-h3 text-neutral-900 mb-3'>
                {t('terms.section3_1Title')}
              </h3>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section3_1Intro')}
              </p>
              <ul className='text-body-md list-disc pl-6 text-neutral-700 mb-4 space-y-2'>
                <li>{t('terms.section3_1Li1')}</li>
                <li>{t('terms.section3_1Li2')}</li>
                <li>{t('terms.section3_1Li3')}</li>
                <li>{t('terms.section3_1Li4')}</li>
                <li>{t('terms.section3_1Li5')}</li>
              </ul>
              <h3 className='text-h3 text-neutral-900 mb-3'>
                {t('terms.section3_2Title')}
              </h3>
              <p className='text-body-md text-neutral-700'>
                {t('terms.section3_2Text')}
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section4Title')}
              </h2>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section4Intro')}
              </p>
              <ul className='text-body-md list-disc pl-6 text-neutral-700 mb-4 space-y-2'>
                <li>{t('terms.section4Li1')}</li>
                <li>{t('terms.section4Li2')}</li>
                <li>{t('terms.section4Li3')}</li>
                <li>{t('terms.section4Li4')}</li>
                <li>{t('terms.section4Li5')}</li>
                <li>{t('terms.section4Li6')}</li>
                <li>{t('terms.section4Li7')}</li>
                <li>{t('terms.section4Li8')}</li>
                <li>{t('terms.section4Li9')}</li>
              </ul>
            </section>

            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section5Title')}
              </h2>
              <h3 className='text-h3 text-neutral-900 mb-3'>
                {t('terms.section5_1Title')}
              </h3>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section5_1Intro')}
              </p>
              <ul className='text-body-md list-disc pl-6 text-neutral-700 mb-4 space-y-2'>
                <li>{t('terms.section5_1Li1')}</li>
                <li>{t('terms.section5_1Li2')}</li>
                <li>{t('terms.section5_1Li3')}</li>
                <li>{t('terms.section5_1Li4')}</li>
                <li>{t('terms.section5_1Li5')}</li>
              </ul>
              <h3 className='text-h3 text-neutral-900 mb-3'>
                {t('terms.section5_2Title')}
              </h3>
              <p className='text-body-md text-neutral-700'>
                {t('terms.section5_2Text')}
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section6Title')}
              </h2>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section6P1')}
              </p>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section6P2')}
              </p>
              <p className='text-body-md text-neutral-700'>
                {t('terms.section6P3')}
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section7Title')}
              </h2>
              <h3 className='text-h3 text-neutral-900 mb-3'>
                {t('terms.section7_1Title')}
              </h3>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section7_1Text')}
              </p>
              <h3 className='text-h3 text-neutral-900 mb-3'>
                {t('terms.section7_2Title')}
              </h3>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section7_2Text')}
              </p>
              <h3 className='text-h3 text-neutral-900 mb-3'>
                {t('terms.section7_3Title')}
              </h3>
              <p className='text-body-md text-neutral-700'>
                {t('terms.section7_3Text')}
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section8Title')}
              </h2>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section8Intro')}
              </p>
              <ul className='text-body-md list-disc pl-6 text-neutral-700 mb-4 space-y-2'>
                <li>{t('terms.section8Li1')}</li>
                <li>{t('terms.section8Li2')}</li>
                <li>{t('terms.section8Li3')}</li>
                <li>{t('terms.section8Li4')}</li>
              </ul>
              <p className='text-body-md text-neutral-700'>
                {t('terms.section8Outro')}
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section9Title')}
              </h2>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section9Intro')}
              </p>
              <ul className='text-body-md list-disc pl-6 text-neutral-700 mb-4 space-y-2'>
                <li>{t('terms.section9Li1')}</li>
                <li>{t('terms.section9Li2')}</li>
                <li>{t('terms.section9Li3')}</li>
              </ul>
              <p className='text-body-md text-neutral-700'>
                {t('terms.section9Outro')}
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section10Title')}
              </h2>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section10P1')}
              </p>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section10P2')}
              </p>
              <p className='text-body-md text-neutral-700'>
                {t('terms.section10P3')}
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section11Title')}
              </h2>
              <p className='text-body-md text-neutral-700'>
                {t('terms.section11Text')}
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section12Title')}
              </h2>
              <h3 className='text-h3 text-neutral-900 mb-3'>
                {t('terms.section12_1Title')}
              </h3>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section12_1Text')}
              </p>
              <h3 className='text-h3 text-neutral-900 mb-3'>
                {t('terms.section12_2Title')}
              </h3>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section12_2Intro')}
              </p>
              <ul className='text-body-md list-disc pl-6 text-neutral-700 mb-4 space-y-2'>
                <li>{t('terms.section12_2Li1')}</li>
                <li>{t('terms.section12_2Li2')}</li>
                <li>{t('terms.section12_2Li3')}</li>
                <li>{t('terms.section12_2Li4')}</li>
              </ul>
              <h3 className='text-h3 text-neutral-900 mb-3'>
                {t('terms.section12_3Title')}
              </h3>
              <p className='text-body-md text-neutral-700'>
                {t('terms.section12_3Text')}
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section13Title')}
              </h2>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section13P1')}
              </p>
              <p className='text-body-md text-neutral-700'>
                {t('terms.section13P2')}
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section14Title')}
              </h2>
              <p className='text-body-md text-neutral-700'>
                {t('terms.section14Text')}
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='text-h2 text-neutral-900 mb-4'>
                {t('terms.section15Title')}
              </h2>
              <p className='text-body-md text-neutral-700 mb-4'>
                {t('terms.section15Intro')}
              </p>
              <div className='bg-neutral-100 p-6 rounded-lg'>
                <p className='text-neutral-700 mb-2'>
                  <strong>{t('terms.section15Email')}:</strong>{' '}
                  <a
                    href='mailto:legal@doctorsclinic.services'
                    className='text-primary-600 hover:underline'
                  >
                    legal@doctorsclinic.services
                  </a>
                </p>
                <p className='text-body-md text-neutral-700'>
                  <strong>{t('terms.section15Support')}:</strong>{' '}
                  <Link href='/support/contact' className='text-primary-600 hover:underline'>
                    {t('terms.contactSupport')}
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
