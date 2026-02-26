'use client';

import { CalendarIcon, CheckIcon, XIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { CLINIC_APP_URL } from '@/lib/config';
import Image from 'next/image';
import Link from 'next/link';

export function HeroSection({ onContactClick }) {
  const { t } = useI18n();
  const registerUrl = CLINIC_APP_URL.replace(/\/$/, '') + '/register';

  return (
    <section className='section-bg relative overflow-hidden pt-[5vh] pb-16 px-8'>
      {/* Animated gradient orbs - theme colors */}
      <div
        className='absolute top-0 right-0 rounded-full hero-orb-1'
        style={{
          width: '600px',
          height: '600px',
          background:
            'radial-gradient(circle, rgba(45, 156, 219, 0.12) 0%, rgba(45, 156, 219, 0.04) 40%, transparent 70%)',
          filter: 'blur(80px)',
          top: '-150px',
          right: '-150px',
        }}
      ></div>
      <div
        className='absolute bottom-0 left-0 rounded-full hero-orb-2'
        style={{
          width: '500px',
          height: '500px',
          background:
            'radial-gradient(circle, rgba(39, 174, 96, 0.12) 0%, rgba(39, 174, 96, 0.04) 40%, transparent 70%)',
          filter: 'blur(80px)',
          bottom: '-150px',
          left: '-150px',
        }}
      ></div>

      {/* Premium grid pattern */}
      <div
        className='absolute inset-0 opacity-[0.02]'
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D9CDB' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      ></div>

      <div className='max-w-7xl mx-auto relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
          {/* Left Content */}
          <div className='text-center lg:text-left'>
            {/* Optional overline – clean hierarchy (Dochours-style) */}
            <p className='text-primary-600 font-semibold text-sm uppercase tracking-wider mb-4'>
              {t('homepage.heroOverline')}
            </p>
            {/* Premium Badge */}
            <div className='inline-flex items-center gap-2.5 px-5 py-2.5 mb-8 text-body-sm font-semibold bg-white/80 border-2 border-primary-200 text-primary-700 rounded-full shadow-lg hover:shadow-xl transition-smooth hover-scale-subtle backdrop-blur-sm'>
              <CheckIcon className='text-primary-500 w-[18px] h-[18px] shrink-0' />
              <span>{t('homepage.hipaaGdprCompliant')}</span>
            </div>

            {/* Main Heading */}
            <h1 className='text-hero-xl text-neutral-900 mb-6'>
              <span className='block'>{t('homepage.heroTitle')}</span>
              <span className='block mt-3 text-primary-500 font-bold'>
                {t('homepage.heroSubtitle')}
              </span>
            </h1>

            {/* Description */}
            <p className='text-body-lg text-neutral-700 max-w-2xl mx-auto lg:mx-0 mb-6'>
              {t('homepage.heroDescription')}
            </p>

            {/* CTAs – Dochours-style: Try it free + Book a Demo */}
            <div className='flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-10'>
              <a href={registerUrl}>
                <Button variant='primary' size='lg' className='whitespace-nowrap px-6 py-3'>
                  {t('homepage.tryItFree')}
                </Button>
              </a>
              <Link href='/support/contact'>
                <Button variant='secondary' size='lg' className='whitespace-nowrap px-6 py-3'>
                  {t('homepage.bookDemo')}
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className='flex flex-wrap items-center justify-center lg:justify-start gap-6'>
              <div className='flex items-center text-body-sm font-medium text-neutral-700'>
                <CheckIcon className='w-[18px] h-[18px] mr-2 shrink-0 text-secondary-500' />
                <span>{t('homepage.noCreditCardRequired')}</span>
              </div>
              <div className='flex items-center text-body-sm font-medium text-neutral-700'>
                <CalendarIcon className='w-[18px] h-[18px] mr-2 shrink-0 text-primary-500' />
                <span>{t('homepage.freeTrial')}</span>
              </div>
              <div className='flex items-center text-body-sm font-medium text-neutral-700'>
                <XIcon className='w-[18px] h-[18px] mr-2 shrink-0 text-neutral-500' />
                <span>{t('homepage.cancelAnytime')}</span>
              </div>
            </div>
          </div>

          {/* Right Image with Premium Effects */}
          <div className='relative'>
            {/* Glow effect behind image */}
            <div
              className='absolute inset-0 rounded-2xl'
              style={{
                background:
                  'linear-gradient(135deg, rgba(45, 156, 219, 0.15), rgba(39, 174, 96, 0.15))',
                filter: 'blur(40px)',
                transform: 'scale(0.95)',
              }}
            ></div>

            <div
              className='relative rounded-2xl overflow-hidden group border-2 border-white/80 shadow-xl'
              style={{
                transition: 'box-shadow 0.5s ease',
              }}
            >
              {/* Premium overlay gradient - very light */}
              <div className='absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-neutral-50/3 pointer-events-none z-10'></div>

              {/* Shining effect on hover - very subtle */}
              <div
                className='absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none z-20 hero-shine'
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  transition: 'opacity 0.3s ease',
                }}
              ></div>

              <Image
                src='/images/bannerhero.png'
                alt='Clinic Management Platform'
                width={900}
                height={675}
                className='object-cover w-full h-auto block'
                priority
                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 900px'
                quality={95}
              />

              {/* Bottom gradient overlay - very light */}
              <div className='absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-neutral-50/5 to-transparent pointer-events-none z-10'></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
