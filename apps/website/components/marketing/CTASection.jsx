'use client';

import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { CLINIC_APP_URL } from '@/lib/config';
import Link from 'next/link';

export function CTASection({ user }) {
  const { t } = useI18n();
  const registerUrl = CLINIC_APP_URL.replace(/\/$/, '') + '/register';

  return (
    <section className='relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-5xl mx-auto'>
        <div className='rounded-2xl border border-neutral-200 bg-white shadow-xl shadow-neutral-200/50 overflow-hidden'>
          <div className='grid grid-cols-1 lg:grid-cols-2'>
            {/* Left: Start / Try it free */}
            <div className='p-8 sm:p-10 lg:pr-0 flex flex-col justify-center'>
              <p className='text-xs font-semibold uppercase tracking-wider text-primary-600 mb-3'>
                {t('homepage.ctaPromise')}
              </p>
              <h2 className='text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mb-4'>
                {t('homepage.ctaHeadline')}
              </h2>
              <p className='text-neutral-600 text-base mb-6 max-w-md'>{t('homepage.ctaSubline')}</p>
              <div className='flex flex-wrap gap-3'>
                <a href={registerUrl}>
                  <Button variant='primary' size='lg'>
                    {t('homepage.tryItFree')}
                  </Button>
                </a>
                <Link href='/support/contact'>
                  <Button variant='secondary' size='lg'>
                    {t('homepage.bookDemo')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Get in touch */}
            <div className='p-8 sm:p-10 lg:pl-10 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-neutral-200 bg-neutral-50/60'>
              <p className='text-xs font-semibold uppercase tracking-wider text-primary-600 mb-3'>
                {t('homepage.ctaSupport24')}
              </p>
              <h3 className='text-xl font-semibold text-neutral-900 mb-2'>
                {t('homepage.ctaGetInTouch')}
              </h3>
              <p className='text-neutral-600 text-sm mb-5'>{t('homepage.ctaGetInTouchDesc')}</p>
              <Link href='/support/contact'>
                <Button variant='primary' size='md' className='w-full sm:w-auto'>
                  {t('homepage.ctaSendMessage')}
                </Button>
              </Link>
              <p className='mt-3 text-xs text-neutral-500'>{t('homepage.ctaResponseGuarantee')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
