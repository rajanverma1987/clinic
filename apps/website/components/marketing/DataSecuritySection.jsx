'use client';

import { useI18n } from '@/contexts/I18nContext';

export function DataSecuritySection() {
  const { t } = useI18n();
  const securityFeatures = [
    {
      title: t('homepage.dataSecurityFeature1'),
      icon: (
        <svg className='w-6 h-6 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
          />
        </svg>
      ),
    },
    {
      title: t('homepage.dataSecurityFeature2'),
      icon: (
        <svg className='w-6 h-6 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
          />
        </svg>
      ),
    },
    {
      title: t('homepage.dataSecurityFeature3'),
      icon: (
        <svg className='w-6 h-6 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      ),
    },
    {
      title: t('homepage.dataSecurityFeature4'),
      icon: (
        <svg className='w-6 h-6 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
          />
        </svg>
      ),
    },
    {
      title: t('homepage.dataSecurityFeature5'),
      icon: (
        <svg className='w-6 h-6 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
          />
        </svg>
      ),
    },
  ];

  return (
    <section className='section-padding-x section-padding-y relative overflow-hidden bg-gradient-to-br from-white via-neutral-100 to-primary-50/30'>
      <div className='absolute -top-[180px] -right-[180px] w-[600px] h-[600px] rounded-full bg-primary-200/20 blur-[80px]' />
      <div className='absolute -bottom-[150px] -left-[150px] w-[500px] h-[500px] rounded-full bg-secondary-200/20 blur-[80px]' />
      <div
        className='absolute inset-0 opacity-[0.02] bg-[length:60px_60px]'
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D9CDB' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className='max-w-7xl mx-auto relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
          <div>
            <p className='text-primary-600 font-semibold text-sm uppercase tracking-wider mb-4'>
              {t('homepage.securityOverline')}
            </p>
            <h2 className='text-neutral-900 mb-6 text-5xl leading-[56px] tracking-tight font-bold'>
              {t('homepage.dataSecurityTitle')}
            </h2>
            <p className='text-neutral-600 mb-12 text-lg leading-7 tracking-tight font-normal'>
              {t('homepage.dataSecuritySubtitle')}
            </p>

            <div className='space-y-5'>
              {securityFeatures.map((feature, index) => (
                <div
                  key={index}
                  className='flex items-start gap-4 group hover:bg-white/50 rounded-xl p-3'
                >
                  <div className='flex-shrink-0 w-[52px] h-[52px] rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-200 transition-transform duration-300 hover:scale-[1.02]'>
                    {feature.icon}
                  </div>
                  <p className='text-neutral-700 flex-1 group-hover:text-neutral-900 text-body-md leading-[26px] tracking-tight font-normal'>
                    {feature.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className='relative'>
            <div
              className='bg-white rounded-2xl border-2 border-neutral-200 p-10 shadow-xl hover:shadow-2xl'
              style={{ minHeight: '600px' }}
            >
              <div
                className='flex flex-col items-center justify-center'
                style={{ minHeight: '500px' }}
              >
                <div className='relative mb-10'>
                  <div
                    className='bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white shadow-2xl relative z-10'
                    style={{ width: '180px', height: '180px' }}
                  >
                    <svg
                      style={{ width: '100px', height: '100px' }}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                      />
                    </svg>
                  </div>
                  <div
                    className='absolute inset-0 border-2 border-primary-200/50 rounded-full'
                    style={{
                      borderTopColor: 'transparent',
                      borderRightColor: 'transparent',
                    }}
                  ></div>
                </div>

                <div className='grid grid-cols-3 gap-4 w-full max-w-md mb-8'>
                  {[
                    { label: t('homepage.dataSecurityStatEncrypted'), value: '100%', icon: '🔒' },
                    { label: t('homepage.dataSecurityStatMonitored'), value: '24/7', icon: '🛡️' },
                    { label: t('homepage.dataSecurityStatCompliant'), value: 'HIPAA', icon: '✓' },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className='bg-neutral-50 rounded-xl p-4 border border-neutral-200 text-center hover:bg-white hover:shadow-md'
                    >
                      <div
                        className='text-2xl mb-2'
                        style={{ fontSize: '24px', lineHeight: '28px' }}
                      >
                        {stat.icon}
                      </div>
                      <div
                        className='text-primary-600 font-bold mb-1'
                        style={{ fontSize: '18px', lineHeight: '24px', fontWeight: '700' }}
                      >
                        {stat.value}
                      </div>
                      <div
                        className='text-neutral-600'
                        style={{ fontSize: '12px', lineHeight: '16px', fontWeight: '500' }}
                      >
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className='flex flex-wrap items-center justify-center gap-3'>
                  {['HIPAA', 'GDPR', 'SOC 2'].map((badge, i) => (
                    <div
                      key={i}
                      className='bg-primary-100 border-2 border-primary-300 rounded-lg px-5 py-2.5 hover:bg-primary-200 hover:border-primary-400'
                    >
                      <span
                        className='text-primary-700 font-semibold'
                        style={{ fontSize: '13px', letterSpacing: '0.05em', fontWeight: '600' }}
                      >
                        {badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
