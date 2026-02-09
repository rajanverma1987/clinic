'use client';

export function DataSecuritySection() {
  const securityFeatures = [
    {
      title: 'End-to-end encryption with real-time threat monitoring',
      icon: (
        <svg
          style={{ width: '24px', height: '24px' }}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
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
      title: 'HIPAA-compliant data hosting on AWS servers',
      icon: (
        <svg
          style={{ width: '24px', height: '24px' }}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
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
      title: 'Two-factor authentication for all users',
      icon: (
        <svg
          style={{ width: '24px', height: '24px' }}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
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
      title: 'Strict policy against data selling or misuse',
      icon: (
        <svg
          style={{ width: '24px', height: '24px' }}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
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
      title: 'Full transparency in data handling practices',
      icon: (
        <svg
          style={{ width: '24px', height: '24px' }}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
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
    <section
      className='py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden'
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
          top: '-180px',
          right: '-180px',
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
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
          <div>
            <h2
              className='text-neutral-900 mb-6'
              style={{
                fontSize: '48px',
                lineHeight: '56px',
                letterSpacing: '-0.02em',
                fontWeight: '700',
              }}
            >
              Committed to Data Security
            </h2>
            <p
              className='text-neutral-600 mb-12'
              style={{
                fontSize: '18px',
                lineHeight: '28px',
                letterSpacing: '-0.01em',
                fontWeight: '400',
              }}
            >
              Protecting your clinic&apos;s sensitive information is a top priority.
            </p>

            <div className='space-y-5'>
              {securityFeatures.map((feature, index) => (
                <div
                  key={index}
                  className='flex items-start gap-4 group hover:bg-white/50 rounded-xl p-3'
                >
                  <div
                    className='flex-shrink-0 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-200 transition-transform duration-300'
                    style={{ width: '52px', height: '52px', transform: 'scale(1)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {feature.icon}
                  </div>
                  <p
                    className='text-neutral-700 flex-1 group-hover:text-neutral-900'
                    style={{
                      fontSize: '16px',
                      lineHeight: '26px',
                      letterSpacing: '-0.01em',
                      fontWeight: '400',
                      paddingTop: '14px',
                    }}
                  >
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
                    { label: 'Encrypted', value: '100%', icon: '🔒' },
                    { label: 'Monitored', value: '24/7', icon: '🛡️' },
                    { label: 'Compliant', value: 'HIPAA', icon: '✓' },
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
