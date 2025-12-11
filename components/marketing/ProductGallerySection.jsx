'use client';

import { useState } from 'react';

export function ProductGallerySection() {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      title: 'Dashboard',
      description:
        'Comprehensive overview of your clinic operations with real-time insights and key metrics at a glance',
      highlights: [
        'Real-time analytics and KPIs',
        'Quick access to recent activities',
        'Customizable widgets',
        'Multi-clinic overview support',
      ],
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
            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
          />
        </svg>
      ),
    },
    {
      title: 'Calendar',
      description:
        'Smart scheduling with conflict detection and automated reminders for seamless appointment management',
      highlights: [
        'Drag-and-drop scheduling',
        'Automatic conflict detection',
        'Multi-doctor calendar view',
        'Recurring appointment support',
      ],
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
            d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
      ),
    },
    {
      title: 'Patients',
      description:
        'Complete patient records management with secure access and comprehensive medical history tracking',
      highlights: [
        'Digital patient profiles',
        'Medical history tracking',
        'Document management',
        'HIPAA-compliant storage',
      ],
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
            d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
          />
        </svg>
      ),
    },
    {
      title: 'Billing',
      description:
        'Streamlined invoicing and payment tracking with automated reminders and multi-payment gateway support',
      highlights: [
        'Automated invoice generation',
        'Payment tracking and history',
        'Multi-currency support',
        'Insurance claim management',
      ],
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
            d='M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z'
          />
        </svg>
      ),
    },
    {
      title: 'Reports',
      description:
        'Advanced analytics and insights with customizable reports and data visualization tools',
      highlights: [
        'Custom report builder',
        'Revenue analytics',
        'Patient statistics',
        'Export to PDF/Excel',
      ],
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
            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
          />
        </svg>
      ),
    },
    {
      title: 'Prescriptions',
      description:
        'Digital prescription management with e-prescription support and pharmacy integration',
      highlights: [
        'Digital prescription creation',
        'E-prescription support',
        'Pharmacy integration',
        'Prescription history tracking',
      ],
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
            d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
          />
        </svg>
      ),
    },
  ];

  return (
    <section className='relative py-32 px-4 sm:px-6 lg:px-8 bg-white'>
      <div className='max-w-7xl mx-auto'>
        <div className='text-center mb-16'>
          <div className='inline-flex items-center bg-primary-50 border border-primary-200 rounded-full px-4 py-1.5 mb-6'>
            <span className='text-xs font-semibold text-primary-700 tracking-wide uppercase'>
              Platform Overview
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
            See It In Action
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
            Discover how our platform transforms clinic management with powerful, intuitive features
          </p>
        </div>

        {/* Interactive Tabbed Interface */}
        <div className='bg-white rounded-2xl border-2 border-neutral-200 shadow-xl overflow-hidden'>
          <div className='grid grid-cols-1 lg:grid-cols-2'>
            {/* Left Side - Feature Tabs */}
            <div className='bg-neutral-50 border-r border-neutral-200 p-6 lg:p-8'>
              <div className='space-y-2'>
                {features.map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                      activeTab === index
                        ? 'bg-white border-primary-300 shadow-md'
                        : 'bg-transparent border-neutral-200 hover:border-neutral-300 hover:bg-white/50'
                    }`}
                  >
                    <div className='flex items-start gap-4'>
                      <div
                        className={`flex-shrink-0 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                          activeTab === index
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}
                        style={{ width: '48px', height: '48px' }}
                      >
                        {feature.icon}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h3
                          className={`font-semibold mb-1 transition-colors duration-300 ${
                            activeTab === index ? 'text-primary-700' : 'text-neutral-900'
                          }`}
                          style={{
                            fontSize: '18px',
                            lineHeight: '24px',
                            fontWeight: '600',
                          }}
                        >
                          {feature.title}
                        </h3>
                        <p
                          className='text-neutral-600 text-sm'
                          style={{
                            fontSize: '14px',
                            lineHeight: '20px',
                          }}
                        >
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Side - Active Feature Details */}
            <div className='p-6 lg:p-8'>
              <div className='h-full flex flex-col justify-center'>
                <div className='mb-6'>
                  <div
                    className='inline-flex items-center justify-center bg-primary-100 text-primary-600 rounded-xl mb-4'
                    style={{ width: '64px', height: '64px' }}
                  >
                    {features[activeTab].icon}
                  </div>
                  <h3
                    className='text-neutral-900 mb-3'
                    style={{
                      fontSize: '32px',
                      lineHeight: '40px',
                      letterSpacing: '-0.02em',
                      fontWeight: '700',
                    }}
                  >
                    {features[activeTab].title}
                  </h3>
                  <p
                    className='text-neutral-700 mb-6'
                    style={{
                      fontSize: '16px',
                      lineHeight: '24px',
                    }}
                  >
                    {features[activeTab].description}
                  </p>
                </div>

                <div className='space-y-3'>
                  {features[activeTab].highlights.map((highlight, index) => (
                    <div key={index} className='flex items-start gap-3'>
                      <div className='flex-shrink-0 mt-1'>
                        <svg
                          className='w-5 h-5 text-primary-600'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M5 13l4 4L19 7'
                          />
                        </svg>
                      </div>
                      <p
                        className='text-neutral-700'
                        style={{
                          fontSize: '15px',
                          lineHeight: '24px',
                        }}
                      >
                        {highlight}
                      </p>
                    </div>
                  ))}
                </div>

                <div className='mt-8 pt-6 border-t border-neutral-200'>
                  <button
                    className='bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200'
                    style={{
                      fontSize: '16px',
                    }}
                  >
                    Explore {features[activeTab].title}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
