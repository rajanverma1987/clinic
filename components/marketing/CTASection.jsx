'use client';

import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function CTASection({ user }) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <section
      className='relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden'
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 50%, #e6f7fe 100%)',
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
          transform: 'translate(30%, -30%)',
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
        <div className='text-center mb-16'>
          <div className='inline-flex items-center bg-white border border-neutral-200 rounded-full px-4 py-1.5 mb-6 shadow-sm'>
            <svg className='w-4 h-4 text-primary-600 mr-2' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' />
              <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z' />
            </svg>
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
              icon: (
                <svg
                  style={{ width: '32px', height: '32px' }}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                  />
                </svg>
              ),
              link: 'mailto:support@clinic.com',
              bgGradient: 'from-primary-100 to-primary-50',
              iconBg: 'bg-primary-500',
            },
            {
              title: 'Phone',
              value: '+1 (555) 123-4567',
              icon: (
                <svg
                  style={{ width: '32px', height: '32px' }}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                  />
                </svg>
              ),
              link: 'tel:+15551234567',
              bgGradient: 'from-secondary-100 to-secondary-50',
              iconBg: 'bg-secondary-500',
            },
            {
              title: 'WhatsApp',
              value: '+1 (555) 123-4567',
              icon: (
                <svg
                  style={{ width: '32px', height: '32px' }}
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' />
                </svg>
              ),
              link: 'https://wa.me/15551234567',
              bgGradient: 'from-primary-100 to-primary-50',
              iconBg: 'bg-primary-500',
            },
            {
              title: 'Inquiry Form',
              value: 'Contact Us',
              icon: (
                <svg
                  style={{ width: '32px', height: '32px' }}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
              ),
              link: '/support/contact',
              bgGradient: 'from-secondary-100 to-secondary-50',
              iconBg: 'bg-secondary-500',
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
                <div className='mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0'>
                  <svg
                    className='w-5 h-5 mx-auto text-primary-600'
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
              <div className='absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-secondary-500/10 to-transparent rounded-tr-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
            </a>
          ))}
        </div>

        <div className='text-center mt-12'>
          <div className='inline-block relative group'>
            <div className='absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500'></div>
            <Link href='/support/contact'>
              <Button
                variant='primary'
                size='md'
                className='relative whitespace-nowrap px-8 py-3 shadow-lg hover:shadow-2xl transition-all duration-300 animate-button-pulse'
              >
                <span className='flex items-center gap-2'>
                  Send Us a Message
                  <svg
                    className='w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300'
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
            <svg className='w-4 h-4 text-secondary-500' fill='currentColor' viewBox='0 0 20 20'>
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
