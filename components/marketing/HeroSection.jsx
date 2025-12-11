'use client';

import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function HeroSection({ onContactClick }) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <section
      className='relative overflow-hidden'
      style={{
        paddingTop: '120px',
        paddingBottom: '100px',
        paddingLeft: '32px',
        paddingRight: '32px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 50%, #e6f7fe 100%)',
      }}
    >
      {/* Animated gradient orbs - theme colors */}
      <div
        className='absolute top-0 right-0 rounded-full hero-orb-1'
        style={{
          width: '600px',
          height: '600px',
          background:
            'radial-gradient(circle, rgba(45, 156, 219, 0.12) 0%, rgba(45, 156, 219, 0.04) 40%, transparent 70%)',
          filter: 'blur(80px)',
          transform: 'translate(30%, -30%)',
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
          transform: 'translate(-30%, 30%)',
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
            {/* Premium Badge */}
            <div
              className='inline-flex items-center bg-white/80 border-2 border-primary-200 text-primary-700 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
              style={{
                paddingLeft: '20px',
                paddingRight: '20px',
                paddingTop: '10px',
                paddingBottom: '10px',
                gap: '10px',
                marginBottom: '48px',
                fontSize: '14px',
                lineHeight: '20px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <svg
                style={{ width: '18px', height: '18px' }}
                className='text-primary-500'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
              <span>{t('homepage.hipaaGdprCompliant')}</span>
            </div>

            {/* Main Heading */}
            <h1
              className='text-neutral-900'
              style={{
                marginBottom: '32px',
                fontSize: '56px',
                lineHeight: '64px',
                letterSpacing: '-0.02em',
                fontWeight: '700',
              }}
            >
              <span className='block'>{t('homepage.heroTitle')}</span>
              <span
                className='block'
                style={{
                  marginTop: '12px',
                  color: '#2D9CDB',
                  fontWeight: '700',
                }}
              >
                {t('homepage.heroSubtitle')}
              </span>
            </h1>
            <style
              dangerouslySetInnerHTML={{
                __html: `
                @media (min-width: 768px) {
                  h1 {
                    font-size: 64px !important;
                    line-height: 72px !important;
                  }
                }
                @media (min-width: 1024px) {
                  h1 {
                    font-size: 72px !important;
                    line-height: 80px !important;
                  }
                }
              `,
              }}
            />

            {/* Description */}
            <p
              className='text-neutral-700 max-w-2xl mx-auto lg:mx-0'
              style={{
                marginBottom: '56px',
                fontSize: '18px',
                lineHeight: '28px',
                fontWeight: '400',
              }}
            >
              {t('homepage.heroDescription')}
            </p>

            {/* CTA Buttons */}
            <div
              className='flex flex-col sm:flex-row justify-center lg:justify-start items-center'
              style={{ gap: '20px', marginBottom: '64px' }}
            >
              <Button
                variant='primary'
                size='md'
                className='w-full sm:w-auto whitespace-nowrap animate-button-pulse'
                onClick={() => router.push('/register')}
                style={{
                  boxShadow: '0 8px 24px -6px rgba(45, 156, 219, 0.4)',
                }}
              >
                <svg
                  className='mr-2'
                  style={{ width: '18px', height: '18px' }}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 10V3L4 14h7v7l9-11h-7z'
                  />
                </svg>
                {t('homepage.startFreeTrial')}
              </Button>
              <Button
                variant='secondary'
                size='md'
                className='w-full sm:w-auto whitespace-nowrap animate-button-pulse'
                onClick={onContactClick}
              >
                <svg
                  className='mr-2'
                  style={{ width: '18px', height: '18px' }}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                {t('homepage.scheduleDemo')}
              </Button>
            </div>

            {/* Trust Badges */}
            <div
              className='flex flex-wrap items-center justify-center lg:justify-start'
              style={{ gap: '24px' }}
            >
              <div
                className='flex items-center text-neutral-700'
                style={{
                  fontSize: '14px',
                  lineHeight: '20px',
                  fontWeight: '500',
                }}
              >
                <svg
                  style={{ width: '18px', height: '18px', marginRight: '8px' }}
                  className='text-secondary-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>{t('homepage.noCreditCardRequired')}</span>
              </div>
              <div
                className='flex items-center text-neutral-700'
                style={{
                  fontSize: '14px',
                  lineHeight: '20px',
                  fontWeight: '500',
                }}
              >
                <svg
                  style={{ width: '18px', height: '18px', marginRight: '8px' }}
                  className='text-primary-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>{t('homepage.freeTrial')}</span>
              </div>
              <div
                className='flex items-center text-neutral-700'
                style={{
                  fontSize: '14px',
                  lineHeight: '20px',
                  fontWeight: '500',
                }}
              >
                <svg
                  style={{ width: '18px', height: '18px', marginRight: '8px' }}
                  className='text-neutral-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                    clipRule='evenodd'
                  />
                </svg>
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
                className='object-cover w-full h-full'
                priority
                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 900px'
                quality={95}
                style={{ width: '100%', height: 'auto', display: 'block' }}
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
