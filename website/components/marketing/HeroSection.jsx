'use client';

import { CalendarIcon, CheckIcon, XIcon } from '@/components/icons';
import { useI18n } from '@/contexts/I18nContext';
import Image from 'next/image';

export function HeroSection() {
  const { t } = useI18n();

  return (
    <section
      className='relative overflow-hidden section-bg'
      style={{
        paddingTop: '128px',
        paddingBottom: '96px',
        paddingLeft: 'var(--space-8)',
        paddingRight: 'var(--space-8)',
      }}
    >
      {/* Animated gradient orbs – theme vars */}
      <div
        className='absolute top-0 right-0 rounded-full hero-orb-1'
        style={{
          width: '600px',
          height: '600px',
          background: 'var(--section-orb-primary)',
          filter: 'blur(80px)',
          top: '-150px',
          right: '-150px',
        }}
      />
      <div
        className='absolute bottom-0 left-0 rounded-full hero-orb-2'
        style={{
          width: '500px',
          height: '500px',
          background: 'var(--section-orb-secondary)',
          filter: 'blur(80px)',
          bottom: '-150px',
          left: '-150px',
        }}
      />

      {/* Premium grid pattern */}
      <div
        className='absolute inset-0 opacity-[0.02]'
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e4fb5' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      ></div>

      <div className='section-container relative z-10'>
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
              <CheckIcon className='icon icon-sm text-primary-500' />
              <span>{t('homepage.hipaaGdprCompliant')}</span>
            </div>

            {/* Main Heading */}
            <h1
              className='text-neutral-900 hero-heading'
              style={{
                marginBottom: '32px',
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
                .hero-heading { font-size: 40px; line-height: 1.2; }
                @media (min-width: 768px) {
                  .hero-heading { font-size: 48px !important; line-height: 1.15 !important; }
                }
                @media (min-width: 1024px) {
                  .hero-heading { font-size: 56px !important; line-height: 1.15 !important; }
                }
              `,
              }}
            />

            {/* Description */}
            <p className='text-neutral-700 max-w-2xl mx-auto lg:mx-0 text-body-lg mb-12'>
              {t('homepage.heroDescription')}
            </p>

            {/* Trust badges – designed row: icon + text in subtle pills */}
            <div className='flex flex-wrap items-center justify-center lg:justify-start gap-3'>
              <div className='hero-trust-badge'>
                <CheckIcon className='hero-trust-badge__icon' aria-hidden />
                <span className='hero-trust-badge__text'>{t('homepage.noCreditCardRequired')}</span>
              </div>
              <div className='hero-trust-badge'>
                <CalendarIcon className='hero-trust-badge__icon' aria-hidden />
                <span className='hero-trust-badge__text'>{t('homepage.freeTrial')}</span>
              </div>
              <div className='hero-trust-badge'>
                <XIcon className='hero-trust-badge__icon' aria-hidden />
                <span className='hero-trust-badge__text'>{t('homepage.cancelAnytime')}</span>
              </div>
            </div>
          </div>

          {/* Right Image with Premium Effects */}
          <div className='relative'>
            {/* Glow effect behind image */}
            <div
              className='absolute inset-0 rounded-2xl'
              style={{
                background: 'var(--hero-image-glow)',
                filter: 'blur(40px)',
                transform: 'scale(0.95)',
              }}
            />

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
                  background: 'var(--hero-shine-overlay)',
                  backgroundSize: '200% 100%',
                  transition: 'opacity 0.3s ease',
                }}
              />

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
