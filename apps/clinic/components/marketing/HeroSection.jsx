'use client';

import { CalendarIcon, CheckIcon, PlayIcon, UserIcon, XIcon, ZapIcon } from '@/components/icons';
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
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e4fb5' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
              <CheckIcon className='text-primary-500' style={{ width: 18, height: 18 }} />
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
                  color: 'var(--color-primary-900)',
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
              className='flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start items-center'
              style={{ gap: '20px', marginBottom: '64px' }}
            >
              <Button
                variant='primary'
                size='md'
                className='w-full sm:w-auto whitespace-nowrap animate-button-pulse'
                onClick={() => router.push('/pricing')}
                style={{
                  boxShadow: '0 8px 24px -6px rgba(45, 156, 219, 0.4)',
                }}
              >
                <ZapIcon className='mr-2' style={{ width: 18, height: 18 }} />
                {t('homepage.startFreeTrial')}
              </Button>
              <Button
                variant='secondary'
                size='md'
                className='w-full sm:w-auto whitespace-nowrap animate-button-pulse'
                onClick={() => router.push('/doctors/register')}
              >
                <UserIcon className='mr-2' style={{ width: 18, height: 18 }} />
                {t('homepage.forDoctors')}
              </Button>
              <Button
                variant='secondary'
                size='md'
                className='w-full sm:w-auto whitespace-nowrap animate-button-pulse'
                onClick={onContactClick}
              >
                <PlayIcon className='mr-2' style={{ width: 18, height: 18 }} />
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
                <CheckIcon
                  style={{ width: 18, height: 18, marginRight: '8px' }}
                  className='text-secondary-500'
                />
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
                <CalendarIcon
                  style={{ width: 18, height: 18, marginRight: '8px' }}
                  className='text-primary-500'
                />
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
                <XIcon
                  style={{ width: 18, height: 18, marginRight: '8px' }}
                  className='text-neutral-500'
                />
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
                alt={t('common.altClinicManagement')}
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
