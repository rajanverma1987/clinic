'use client';

import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useState } from 'react';

export default function SupportPage() {
  const [openFaqs, setOpenFaqs] = useState({});

  const toggleFaq = (categoryIndex, faqIndex) => {
    const key = `${categoryIndex}-${faqIndex}`;
    setOpenFaqs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click the "Get Started" button on our homepage or visit the registration page. You\'ll need to provide your clinic information and create an admin account. A 14-day free trial is available to get you started.',
        },
        {
          q: 'What information do I need to set up my clinic?',
          a: "You'll need basic clinic information including name, address, contact details, timezone, currency, and tax settings. You can also configure appointment types, consultation durations, and other clinic-specific settings.",
        },
        {
          q: 'Is there a mobile app?',
          a: "Currently, Doctor's Clinic is accessible through web browsers on desktop and mobile devices. We are working on native mobile apps for iOS and Android, which will be available in the future.",
        },
      ],
    },
    {
      category: 'Features & Functionality',
      questions: [
        {
          q: 'How do I schedule appointments?',
          a: 'Navigate to the Appointments section, click "New Appointment", and fill in the patient, doctor, date, time, and appointment type. The system will automatically check for conflicts and send reminders.',
        },
        {
          q: 'Can I customize clinical note templates?',
          a: 'Yes! You can create custom note templates for different specialties, appointment types, or individual doctors. Templates support SOAP format and can include pre-filled sections.',
        },
        {
          q: 'How does prescription management work?',
          a: 'Prescriptions can be created during appointments, include region-specific drug information, and support refills. The system tracks prescription status (draft, active, dispensed) and maintains a complete audit trail.',
        },
        {
          q: 'What payment methods are supported?',
          a: 'The billing system supports multiple payment methods including cash, card, UPI, bank transfer, cheque, and insurance. You can track partial payments and payment reconciliation.',
        },
        {
          q: 'How do inventory alerts work?',
          a: 'The system automatically monitors stock levels and sends alerts when items fall below the reorder point. You can also view expired items and low stock reports.',
        },
      ],
    },
    {
      category: 'Security & Compliance',
      questions: [
        {
          q: "Is Doctor's Clinic HIPAA compliant?",
          a: "Yes, Doctor's Clinic is designed to be HIPAA compliant. We implement encryption for PHI, maintain audit logs, use role-based access control, and execute Business Associate Agreements with healthcare providers.",
        },
        {
          q: 'How is patient data encrypted?',
          a: 'Protected Health Information (PHI) is encrypted using AES-256-GCM encryption at rest. All data transmission uses TLS/SSL encryption. We never store PHI in logs or include it in notifications.',
        },
        {
          q: 'Can I export my data?',
          a: "Yes, you can export your data at any time. Contact support to request a data export, and we'll provide your data in a structured format. This is also available for GDPR compliance.",
        },
        {
          q: 'What happens to my data if I cancel?',
          a: 'We retain your data for a period as required by law and healthcare regulations. You can request data export before cancellation. After the retention period, data is securely deleted or anonymized.',
        },
      ],
    },
    {
      category: 'Billing & Pricing',
      questions: [
        {
          q: 'What are the pricing plans?',
          a: "We offer flexible pricing based on the number of users and features. Contact our sales team for detailed pricing information and to discuss which plan best fits your clinic's needs.",
        },
        {
          q: 'Is there a free trial?',
          a: 'Yes, we offer a 14-day free trial with full access to all features. No credit card is required to start your trial.',
        },
        {
          q: 'Can I change my plan later?',
          a: 'Absolutely! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept major credit cards, debit cards, and bank transfers. Annual plans may be eligible for discounts.',
        },
      ],
    },
    {
      category: 'Technical Support',
      questions: [
        {
          q: 'What browsers are supported?',
          a: "Doctor's Clinic works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for optimal performance.",
        },
        {
          q: 'Do I need to install any software?',
          a: "No installation is required! Doctor's Clinic is a cloud-based platform accessible through your web browser. Just sign up and start using it immediately.",
        },
        {
          q: 'How do I report a bug or issue?',
          a: 'You can report issues through the support contact form, email us at support@clinichub.com, or use the in-app feedback feature. We prioritize security and critical issues.',
        },
        {
          q: 'Is there an API available?',
          a: "Yes, Doctor's Clinic is built API-first to support future integrations and mobile apps. API documentation is available for enterprise customers. Contact us for API access.",
        },
      ],
    },
  ];

  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1'>
        {/* Hero Section */}
        <section
          className='bg-gradient-to-br from-white via-neutral-50 to-primary-50/30 relative overflow-hidden'
          style={{
            paddingTop: '140px',
            paddingBottom: '80px',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          {/* Background accents */}
          <div
            className='absolute top-0 right-0 bg-primary-100 rounded-full mix-blend-multiply filter opacity-30'
            style={{ width: '400px', height: '400px', filter: 'blur(100px)' }}
          ></div>
          <div
            className='absolute bottom-0 left-0 bg-secondary-100 rounded-full mix-blend-multiply filter opacity-30'
            style={{ width: '400px', height: '400px', filter: 'blur(100px)' }}
          ></div>

          <div className='max-w-7xl mx-auto relative z-10'>
            <div className='text-center'>
              {/* Premium badge */}
              <div
                className='inline-flex items-center bg-white border border-neutral-200 text-primary-700 rounded-lg font-medium'
                style={{
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  marginBottom: '32px',
                  gap: '10px',
                  fontSize: '13px',
                  lineHeight: '18px',
                  letterSpacing: '0.01em',
                  fontWeight: '500',
                }}
              >
                <svg
                  style={{ width: '18px', height: '18px' }}
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>24/7 Support Available</span>
              </div>

              <h1
                className='text-neutral-900'
                style={{
                  fontSize: '56px',
                  lineHeight: '64px',
                  letterSpacing: '-0.02em',
                  fontWeight: '700',
                  marginBottom: '24px',
                }}
              >
                Support Center
              </h1>
              <p
                className='text-neutral-700 max-w-3xl mx-auto'
                style={{
                  fontSize: '20px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '400',
                }}
              >
                Find answers to common questions or get in touch with our support team
              </p>
            </div>
          </div>
        </section>

        {/* Quick Links Section */}
        <section
          className='bg-white'
          style={{
            paddingTop: '64px',
            paddingBottom: '64px',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          <div className='max-w-7xl mx-auto'>
            <div
              className='grid grid-cols-1 md:grid-cols-3'
              style={{ gap: '24px', marginBottom: '64px' }}
            >
              <Link
                href='/support/contact'
                className='group relative bg-white border-2 border-neutral-200 rounded-2xl hover:border-primary-300 hover:shadow-xl overflow-hidden'
                style={{ padding: '32px' }}
              >
                {/* Gradient overlay on hover */}
                <div className='absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100'></div>

                <div className='relative z-10'>
                  <div
                    className='bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 shadow-lg'
                    style={{ width: '64px', height: '64px', marginBottom: '24px' }}
                  >
                    <svg
                      className='text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      style={{ width: '32px', height: '32px' }}
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                      />
                    </svg>
                  </div>
                  <h3
                    className='text-2xl font-bold text-neutral-900 group-hover:text-primary-600'
                    style={{ marginBottom: '12px' }}
                  >
                    Contact Support
                  </h3>
                  <p className='text-neutral-600 text-body-md leading-relaxed'>
                    Get help from our support team via email or contact form
                  </p>
                  <div
                    className='flex items-center text-primary-600 font-semibold group-hover:translate-x-2'
                    style={{ marginTop: '24px' }}
                  >
                    <span>Get in touch</span>
                    <svg
                      className='fill-none stroke-currentColor'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      style={{ width: '20px', height: '20px', marginLeft: '8px' }}
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13 7l5 5m0 0l-5 5m5-5H6'
                      />
                    </svg>
                  </div>
                </div>
              </Link>

              <Link
                href='/support#faq'
                className='group relative bg-white border-2 border-neutral-200 rounded-2xl hover:border-secondary-300 hover:shadow-xl overflow-hidden'
                style={{ padding: '32px' }}
              >
                <div className='absolute inset-0 bg-gradient-to-br from-secondary-50 to-transparent opacity-0 group-hover:opacity-100'></div>

                <div className='relative z-10'>
                  <div
                    className='bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 shadow-lg'
                    style={{ width: '64px', height: '64px', marginBottom: '24px' }}
                  >
                    <svg
                      className='text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      style={{ width: '32px', height: '32px' }}
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <h3
                    className='text-2xl font-bold text-neutral-900 group-hover:text-secondary-600'
                    style={{ marginBottom: '12px' }}
                  >
                    FAQ
                  </h3>
                  <p className='text-neutral-600 text-body-md leading-relaxed'>
                    Browse frequently asked questions and find quick answers
                  </p>
                  <div
                    className='flex items-center text-secondary-600 font-semibold group-hover:translate-x-2'
                    style={{ marginTop: '24px' }}
                  >
                    <span>View FAQs</span>
                    <svg
                      className='fill-none stroke-currentColor'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      style={{ width: '20px', height: '20px', marginLeft: '8px' }}
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13 7l5 5m0 0l-5 5m5-5H6'
                      />
                    </svg>
                  </div>
                </div>
              </Link>

              <a
                href='#'
                className='group relative bg-white border-2 border-neutral-200 rounded-2xl hover:border-primary-300 hover:shadow-xl overflow-hidden'
                style={{ padding: '32px' }}
              >
                <div className='absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100'></div>

                <div className='relative z-10'>
                  <div
                    className='bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 shadow-lg'
                    style={{ width: '64px', height: '64px', marginBottom: '24px' }}
                  >
                    <svg
                      className='text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      style={{ width: '32px', height: '32px' }}
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                      />
                    </svg>
                  </div>
                  <h3
                    className='text-2xl font-bold text-neutral-900 group-hover:text-primary-600'
                    style={{ marginBottom: '12px' }}
                  >
                    Documentation
                  </h3>
                  <p className='text-neutral-600 text-body-md leading-relaxed'>
                    Access user guides and API documentation
                  </p>
                  <div
                    className='flex items-center text-primary-600 font-semibold group-hover:translate-x-2'
                    style={{ marginTop: '24px' }}
                  >
                    <span>View docs</span>
                    <svg
                      className='fill-none stroke-currentColor'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      style={{ width: '20px', height: '20px', marginLeft: '8px' }}
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13 7l5 5m0 0l-5 5m5-5H6'
                      />
                    </svg>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id='faq'
          className='bg-neutral-50'
          style={{
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          <div className='max-w-7xl mx-auto'>
            <div className='text-center' style={{ marginBottom: '64px' }}>
              <h2
                className='text-neutral-900'
                style={{
                  fontSize: '48px',
                  lineHeight: '56px',
                  letterSpacing: '-0.02em',
                  fontWeight: '700',
                  marginBottom: '16px',
                }}
              >
                Frequently Asked Questions
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
                Everything you need to know about Doctor&apos;s Clinic
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {faqs.map((category, categoryIndex) => (
                <div
                  key={categoryIndex}
                  className='bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md'
                  style={{ padding: '32px' }}
                >
                  <h3
                    className='text-neutral-900 border-b border-neutral-200'
                    style={{
                      fontSize: '28px',
                      lineHeight: '36px',
                      letterSpacing: '-0.01em',
                      fontWeight: '700',
                      marginBottom: '24px',
                      paddingBottom: '16px',
                    }}
                  >
                    {category.category}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {category.questions.map((faq, faqIndex) => {
                      const key = `${categoryIndex}-${faqIndex}`;
                      const isOpen = openFaqs[key];

                      return (
                        <div
                          key={faqIndex}
                          className='border border-neutral-200 rounded-xl overflow-hidden hover:border-primary-300'
                        >
                          <button
                            onClick={() => toggleFaq(categoryIndex, faqIndex)}
                            className='w-full text-left flex items-center justify-between group hover:bg-neutral-50'
                            style={{
                              paddingLeft: '24px',
                              paddingRight: '24px',
                              paddingTop: '20px',
                              paddingBottom: '20px',
                            }}
                          >
                            <div className='flex items-start flex-1'>
                              <div
                                className='rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200'
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  marginRight: '16px',
                                  marginTop: '2px',
                                }}
                              >
                                <svg
                                  className={`text-primary-600 ${
                                    isOpen ? 'rotate-180' : ''
                                  }`}
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                  style={{ width: '16px', height: '16px' }}
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M19 9l-7 7-7-7'
                                  />
                                </svg>
                              </div>
                              <h4
                                className='text-neutral-900 font-semibold flex-1 group-hover:text-primary-600'
                                style={{
                                  fontSize: '18px',
                                  lineHeight: '28px',
                                  letterSpacing: '-0.01em',
                                  fontWeight: '600',
                                }}
                              >
                                {faq.q}
                              </h4>
                            </div>
                          </button>

                          {/* Answer Content - Collapsible */}
                          <div
                            className={` ${
                              isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                            } overflow-hidden`}
                          >
                            <div
                              style={{
                                paddingLeft: '64px',
                                paddingRight: '24px',
                                paddingBottom: '24px',
                              }}
                            >
                              <div
                                className='text-neutral-700 border-t border-neutral-100'
                                style={{
                                  fontSize: '16px',
                                  lineHeight: '26px',
                                  letterSpacing: '-0.01em',
                                  fontWeight: '400',
                                  paddingTop: '8px',
                                }}
                              >
                                {faq.a}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Still Need Help CTA */}
        <section
          className='bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden'
          style={{
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          {/* Background pattern */}
          <div
            className='absolute inset-0 opacity-10'
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>

          <div className='max-w-4xl mx-auto text-center relative z-10'>
            <div
              className='inline-flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-2xl'
              style={{ width: '80px', height: '80px', marginBottom: '24px' }}
            >
              <svg
                className='text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                style={{ width: '40px', height: '40px' }}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z'
                />
              </svg>
            </div>
            <h2
              className='text-white'
              style={{
                fontSize: '40px',
                lineHeight: '48px',
                letterSpacing: '-0.02em',
                fontWeight: '700',
                marginBottom: '16px',
              }}
            >
              Still Need Help?
            </h2>
            <p
              className='text-primary-100 max-w-2xl mx-auto'
              style={{
                fontSize: '18px',
                lineHeight: '28px',
                letterSpacing: '-0.01em',
                fontWeight: '400',
                marginBottom: '32px',
              }}
            >
              Our support team is here to help you get the most out of Doctor&apos;s Clinic
            </p>
            <Link href='/support/contact'>
              <Button variant='secondary' size='md' className='whitespace-nowrap'>
                Contact Support
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
