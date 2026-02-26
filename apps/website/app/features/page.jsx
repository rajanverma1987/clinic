'use client';

import {
  CalendarIcon,
  LayoutDashboardIcon,
  ReceiptIcon,
  ShieldIcon,
  SmartphoneIcon,
  UsersIcon,
} from '@/components/icons';
import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { SubscribeStrip } from '@/components/marketing/SubscribeStrip';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';

/**
 * Feature block for alternating left/right layout (Dochours-style).
 */
function FeatureBlock({ overline, title, description, bullets, reverse, icon }) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center py-12 ${
        reverse ? 'lg:flex-row-reverse' : ''
      }`}
    >
      <div className={reverse ? 'lg:order-2' : ''}>
        <p className='text-primary-600 font-semibold text-sm uppercase tracking-wider mb-4'>
          {overline}
        </p>
        <h2 className='text-section-heading text-neutral-900 mb-4'>{title}</h2>
        <p className='text-body-lg text-neutral-700 mb-6'>{description}</p>
        <ul className='space-y-3'>
          {bullets.map((bullet, i) => (
            <li key={i} className='flex items-center gap-3 text-neutral-700'>
              <span className='shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500' aria-hidden />
              <span className='text-body-md'>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={reverse ? 'lg:order-1' : ''}>
        <div
          className='rounded-2xl bg-primary-50 border border-primary-100 h-64 lg:h-80 flex items-center justify-center text-primary-500 transition-smooth hover-scale-subtle'
          aria-hidden
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  const { t } = useI18n();

  const blocks = [
    {
      overline: t('featuresPage.block1Overline'),
      title: t('featuresPage.block1Title'),
      description: t('featuresPage.block1Desc'),
      bullets: [
        t('featuresPage.block1Bullet1'),
        t('featuresPage.block1Bullet2'),
        t('featuresPage.block1Bullet3'),
      ],
      icon: <CalendarIcon className='text-primary-500 w-20 h-20 shrink-0' />,
    },
    {
      overline: t('featuresPage.block2Overline'),
      title: t('featuresPage.block2Title'),
      description: t('featuresPage.block2Desc'),
      bullets: [
        t('featuresPage.block2Bullet1'),
        t('featuresPage.block2Bullet2'),
        t('featuresPage.block2Bullet3'),
      ],
      icon: <ShieldIcon className='text-primary-500 w-20 h-20 shrink-0' />,
    },
    {
      overline: t('featuresPage.block3Overline'),
      title: t('featuresPage.block3Title'),
      description: t('featuresPage.block3Desc'),
      bullets: [
        t('featuresPage.block3Bullet1'),
        t('featuresPage.block3Bullet2'),
        t('featuresPage.block3Bullet3'),
      ],
      icon: <LayoutDashboardIcon className='text-primary-500 w-20 h-20 shrink-0' />,
    },
    {
      overline: t('featuresPage.block4Overline'),
      title: t('featuresPage.block4Title'),
      description: t('featuresPage.block4Desc'),
      bullets: [
        t('featuresPage.block4Bullet1'),
        t('featuresPage.block4Bullet2'),
        t('featuresPage.block4Bullet3'),
      ],
      icon: <UsersIcon className='text-primary-500 w-20 h-20 shrink-0' />,
    },
    {
      overline: t('featuresPage.block5Overline'),
      title: t('featuresPage.block5Title'),
      description: t('featuresPage.block5Desc'),
      bullets: [
        t('featuresPage.block5Bullet1'),
        t('featuresPage.block5Bullet2'),
        t('featuresPage.block5Bullet3'),
      ],
      icon: <ReceiptIcon className='text-primary-500 w-20 h-20 shrink-0' />,
    },
    {
      overline: t('featuresPage.block6Overline'),
      title: t('featuresPage.block6Title'),
      description: t('featuresPage.block6Desc'),
      bullets: [
        t('featuresPage.block6Bullet1'),
        t('featuresPage.block6Bullet2'),
        t('featuresPage.block6Bullet3'),
      ],
      icon: <SmartphoneIcon className='text-primary-500 w-20 h-20 shrink-0' />,
    },
  ];

  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1 page-main'>
        <div className='page-content page-content-max'>
          <Breadcrumb
            items={[
              { label: t('navigation.home'), href: '/' },
              { label: t('navigation.features'), href: '/features' },
            ]}
          />

          {/* Hero */}
          <section className='pt-8 pb-12 text-center max-w-3xl mx-auto'>
            <h1 className='text-hero text-neutral-900 mb-4'>{t('featuresPage.heroTitle')}</h1>
            <p className='text-body-lg text-neutral-700 mb-4 font-medium'>
              {t('featuresPage.heroSubtitle')}
            </p>
            <p className='text-body-md text-neutral-600'>{t('featuresPage.heroIntro')}</p>
          </section>

          {/* Feature blocks – alternating layout */}
          <section className='border-t border-neutral-200'>
            {blocks.map((block, i) => (
              <div key={i} className='border-b border-neutral-200'>
                <FeatureBlock
                  overline={block.overline}
                  title={block.title}
                  description={block.description}
                  bullets={block.bullets}
                  reverse={i % 2 === 1}
                  icon={block.icon}
                />
              </div>
            ))}
          </section>

          {/* CTA – Streamlining care (Dochours-style) */}
          <section className='section-bg text-center py-12 px-6 rounded-2xl mt-8 border border-neutral-200 transition-smooth'>
            <p className='text-primary-600 font-semibold text-sm uppercase tracking-wider mb-2'>
              {t('featuresPage.ctaTitle')}
            </p>
            <h2 className='text-h2 text-neutral-900 mb-6'>{t('featuresPage.ctaSubtitle')}</h2>
            <ul className='flex flex-wrap justify-center gap-6 mb-6'>
              {[
                t('featuresPage.ctaBullet1'),
                t('featuresPage.ctaBullet2'),
                t('featuresPage.ctaBullet3'),
              ].map((label, i) => (
                <li key={i} className='flex items-center gap-2 text-neutral-700 font-medium'>
                  <span className='w-2 h-2 rounded-full bg-primary-500' aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
            <p className='text-body-md text-neutral-600 max-w-2xl mx-auto mb-6'>
              {t('featuresPage.ctaDescription')}
            </p>
            <Link href='/support/contact'>
              <Button variant='primary' size='lg' className='px-8 py-3'>
                {t('featuresPage.bookDemo')}
              </Button>
            </Link>
          </section>

          <SubscribeStrip />
        </div>
      </main>
      <Footer />
    </div>
  );
}
