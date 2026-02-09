'use client';

import { ChatIcon, DocumentIcon, MailIcon, PhoneIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function CTASection({ user }) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <section
      className='relative overflow-hidden'
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 50%, #e6f7fe 100%)',
        paddingTop: '80px',
        paddingBottom: '80px',
        paddingLeft: '32px',
        paddingRight: '32px',
      }}
    >
      {/* Animated gradient orbs - theme colors */}
      <div
        className='absolute top-0 right-0 rounded-full'
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
        className='absolute bottom-0 left-0 rounded-full'
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
        <div className='text-center mb-16'>
          <div className='inline-flex items-center bg-white border border-neutral-200 rounded-full px-4 py-1.5 mb-6 shadow-sm'>
            <MailIcon className='icon icon-xs text-primary-600 mr-2' />
            <span className='text-xs font-semibold text-neutral-700 tracking-wide uppercase'>
              24/7 Support Available
            </span>
          </div>

          <h2
            className='text-neutral-900 mb-6'
            style={{
              fontSize: '48px',
              lineHeight: '56px',
              letterSpacing: '-0.02em',
              fontWeight: '700',
            }}
          >
            Get In Touch
          </h2>
          <p
            className='text-neutral-700 max-w-2xl mx-auto'
            style={{
              fontSize: '18px',
              lineHeight: '28px',
              letterSpacing: '-0.01em',
              fontWeight: '400',
            }}
          >
            We&apos;re here to help. Reach out to us through any of these channels.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12'>
          {[
            {
              title: 'Email',
              value: 'support@clinic.com',
              icon: <MailIcon style={{ width: 32, height: 32 }} />,
              link: 'mailto:support@clinic.com',
              bgGradient: 'from-primary-100 to-primary-50',
              iconBg: 'bg-primary-500',
            },
            {
              title: 'Phone',
              value: '+1 (555) 123-4567',
              icon: <PhoneIcon style={{ width: 32, height: 32 }} />,
              link: 'tel:+15551234567',
              bgGradient: 'from-primary-100 to-primary-50',
              iconBg: 'bg-primary-500',
            },
            {
              title: 'WhatsApp',
              value: '+1 (555) 123-4567',
              icon: <ChatIcon style={{ width: 32, height: 32 }} />,
              link: 'https://wa.me/15551234567',
              bgGradient: 'from-primary-100 to-primary-50',
              iconBg: 'bg-primary-500',
            },
            {
              title: 'Inquiry Form',
              value: 'Contact Us',
              icon: <DocumentIcon style={{ width: 32, height: 32 }} />,
              link: '/support/contact',
              bgGradient: 'from-primary-100 to-primary-50',
              iconBg: 'bg-primary-500',
            },
          ].map((contact, index) => (
            <a
              key={index}
              href={contact.link}
              className='group relative bg-white rounded-2xl border-2 border-neutral-200 p-8 hover:border-primary-300 hover:shadow-2xl text-center overflow-hidden transition-all duration-500'
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${contact.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                style={{ zIndex: 0 }}
              ></div>
              <div
                className='absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out'
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  zIndex: 1,
                }}
              ></div>
              <div className='relative z-10'>
                <div className='relative mx-auto mb-6' style={{ width: '72px', height: '72px' }}>
                  <div
                    className={`absolute inset-0 ${contact.iconBg} rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500`}
                  ></div>
                  <div
                    className={`relative ${contact.iconBg} rounded-2xl flex items-center justify-center text-white transition-transform duration-300 shadow-xl`}
                    style={{ width: '72px', height: '72px', transform: 'scale(1)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <div className='transition-transform duration-300'>{contact.icon}</div>
                  </div>
                </div>
                <h3
                  className='text-neutral-900 font-semibold mb-3 group-hover:text-primary-700 transition-colors duration-300'
                  style={{
                    fontSize: '20px',
                    lineHeight: '28px',
                    letterSpacing: '-0.01em',
                    fontWeight: '600',
                  }}
                >
                  {contact.title}
                </h3>
                <p
                  className='text-neutral-600 group-hover:text-neutral-800 transition-colors duration-300 font-medium'
                  style={{
                    fontSize: '16px',
                    lineHeight: '24px',
                    letterSpacing: '-0.01em',
                    fontWeight: '500',
                  }}
                >
                  {contact.value}
                </p>
                <div className='mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100'>
                  <svg
                    className='icon icon-sm mx-auto text-primary-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 8l4 4m0 0l-4 4m4-4H3'
                    />
                  </svg>
                </div>
              </div>
              <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-500/10 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
              <div className='absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-primary-500/10 to-transparent rounded-tr-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
            </a>
          ))}
        </div>

        <div className='text-center mt-12'>
          <div className='inline-block relative group'>
            <div className='absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500'></div>
            <Link href='/support/contact'>
              <Button
                variant='primary'
                size='md'
                className='relative whitespace-nowrap px-8 py-3 shadow-lg hover:shadow-2xl transition-all duration-300 animate-button-pulse'
              >
                <span className='flex items-center gap-2'>
                  Send Us a Message
                  <svg
                    className='icon icon-xs transform group-hover:scale-110 transition-transform duration-300'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M14 5l7 7m0 0l-7 7m7-7H3'
                    />
                  </svg>
                </span>
              </Button>
            </Link>
          </div>
          <p className='mt-4 text-sm text-neutral-500 flex items-center justify-center gap-2'>
            <svg className='icon icon-xs text-primary-500' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            Response within 24 hours guaranteed
          </p>
        </div>
      </div>
    </section>
  );
}
