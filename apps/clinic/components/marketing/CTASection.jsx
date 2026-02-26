'use client';

import { ChatIcon, DocumentIcon, MailIcon, PhoneIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';

export function CTASection({ user }) {
  const { t } = useI18n();

  const channels = [
    {
      title: 'Email',
      value: 'support@clinic.com',
      icon: MailIcon,
      link: 'mailto:support@clinic.com',
    },
    {
      title: 'Phone',
      value: '+1 (555) 123-4567',
      icon: PhoneIcon,
      link: 'tel:+15551234567',
    },
    {
      title: 'WhatsApp',
      value: '+1 (555) 123-4567',
      icon: ChatIcon,
      link: 'https://wa.me/15551234567',
    },
    {
      title: 'Inquiry Form',
      value: 'Contact Us',
      icon: DocumentIcon,
      link: '/support/contact',
    },
  ];

  return (
    <section className='relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-neutral-50 dark:bg-neutral-900/40'>
      <div className='max-w-5xl mx-auto'>
        <header className='text-center mb-12'>
          <p className='text-sm font-medium text-primary-600 dark:text-primary-400 mb-3'>
            {t('supportCenter.supportAvailable24_7')}
          </p>
          <h2 className='text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight mb-3'>
            {t('supportCenter.getInTouch')}
          </h2>
          <p className='text-neutral-600 dark:text-neutral-400 text-base max-w-lg mx-auto'>
            {t('supportCenter.getInTouchDesc')}
          </p>
        </header>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10'>
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <a
                key={channel.title}
                href={channel.link}
                className='group flex flex-col items-center text-center p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200'
              >
                <span className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 mb-4 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-200'>
                  <Icon className='icon icon-md' />
                </span>
                <span className='font-medium text-neutral-900 dark:text-neutral-100'>
                  {channel.title}
                </span>
                <span className='text-sm text-neutral-600 dark:text-neutral-400 mt-1'>
                  {channel.value}
                </span>
              </a>
            );
          })}
        </div>

        <div className='text-center'>
          <Link href='/support/contact'>
            <Button variant='primary' size='md'>
              {t('supportCenter.sendMessage')}
            </Button>
          </Link>
          <p className='mt-3 text-sm text-neutral-500 dark:text-neutral-400'>
            {t('supportCenter.response24h')}
          </p>
        </div>
      </div>
    </section>
  );
}
