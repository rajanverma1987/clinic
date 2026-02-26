'use client';

import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { useState } from 'react';

export default function ContactPage() {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Simulate form submission
    // In a real application, this would send data to your API
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: 'general',
        message: '',
      });
    }, 1500);
  };

  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1'>
        {/* Hero Section */}
        <section
          className='bg-gradient-to-br from-white via-neutral-50 to-primary-50/30 relative overflow-hidden'
          style={{
            paddingTop: '120px',
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
            <Breadcrumb
              items={[
                { label: t('common.home'), href: '/' },
                { label: t('contact.breadcrumbSupport'), href: '/support' },
                { label: t('contact.breadcrumbContact') },
              ]}
            />

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
                  fontSize: '14px',
                  lineHeight: '20px',
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
                <span>{t('contact.badgeHereToHelp')}</span>
              </div>

              <h1
                className='text-neutral-900'
                style={{
                  fontSize: '32px',
                  lineHeight: '40px',
                  letterSpacing: '-0.02em',
                  fontWeight: '700',
                  marginBottom: '24px',
                }}
              >
                {t('contact.title')}
              </h1>
              <p
                className='text-neutral-700 max-w-3xl mx-auto'
                style={{
                  fontSize: '18px',
                  lineHeight: '28px',
                  letterSpacing: '-0.01em',
                  fontWeight: '400',
                }}
              >
                {t('contact.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section
          className='bg-white'
          style={{
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          <div className='max-w-7xl mx-auto'>
            <div className='grid grid-cols-1 lg:grid-cols-3' style={{ gap: '32px' }}>
              {/* Contact Information */}
              <div className='lg:col-span-1'>
                <div
                  className='bg-white border-2 border-neutral-200 rounded-2xl shadow-sm hover:shadow-md'
                  style={{ padding: '32px', marginBottom: '24px' }}
                >
                  <h3
                    className='text-neutral-900'
                    style={{
                      fontSize: '24px',
                      lineHeight: '32px',
                      letterSpacing: '-0.01em',
                      fontWeight: '600',
                      marginBottom: '24px',
                    }}
                  >
                    {t('contact.getInTouch')}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className='flex items-start group'>
                      <div
                        className='bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 shadow-lg'
                        style={{ width: '48px', height: '48px', marginRight: '16px' }}
                      >
                        <svg
                          className='text-white'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                          style={{ width: '24px', height: '24px' }}
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                          />
                        </svg>
                      </div>
                      <div>
                        <p
                          className='font-semibold text-neutral-900'
                          style={{ marginBottom: '4px' }}
                        >
                          {t('contact.email')}
                        </p>
                        <a
                          href='mailto:support@doctorsclinic.services'
                          className='text-primary-600 hover:text-primary-700 hover:underline'
                          style={{ fontSize: '16px', lineHeight: '24px' }}
                        >
                          support@doctorsclinic.services
                        </a>
                      </div>
                    </div>

                    <div className='flex items-start group'>
                      <div
                        className='bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 shadow-lg'
                        style={{ width: '48px', height: '48px', marginRight: '16px' }}
                      >
                        <svg
                          className='text-white'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                          style={{ width: '24px', height: '24px' }}
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                          />
                        </svg>
                      </div>
                      <div>
                        <p
                          className='font-semibold text-neutral-900'
                          style={{ marginBottom: '4px' }}
                        >
                          {t('contact.phone')}
                        </p>
                        <a
                          href='tel:+1-800-CLINIC'
                          className='text-primary-600 hover:text-primary-700 hover:underline'
                          style={{ fontSize: '16px', lineHeight: '24px' }}
                        >
                          +1 (800) CLINIC
                        </a>
                      </div>
                    </div>

                    <div className='flex items-start group'>
                      <div
                        className='bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 shadow-lg'
                        style={{ width: '48px', height: '48px', marginRight: '16px' }}
                      >
                        <svg
                          className='text-white'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                          style={{ width: '24px', height: '24px' }}
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                          />
                        </svg>
                      </div>
                      <div>
                        <p
                          className='font-semibold text-neutral-900'
                          style={{ marginBottom: '4px' }}
                        >
                          Response Time
                        </p>
                        <p
                          className='text-neutral-600'
                          style={{ fontSize: '16px', lineHeight: '24px' }}
                        >
                          We typically respond within 24 hours
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className='bg-gradient-to-br from-primary-50 to-primary-100/50 border-2 border-primary-200 rounded-2xl shadow-sm'
                  style={{ padding: '32px' }}
                >
                  <h4
                    className='font-bold text-neutral-900'
                    style={{
                      fontSize: '18px',
                      lineHeight: '28px',
                      marginBottom: '16px',
                    }}
                  >
                    Business Hours
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p
                      className='text-neutral-700'
                      style={{ fontSize: '14px', lineHeight: '20px' }}
                    >
                      Monday - Friday: 9:00 AM - 6:00 PM EST
                    </p>
                    <p
                      className='text-neutral-700'
                      style={{ fontSize: '14px', lineHeight: '20px' }}
                    >
                      Saturday - Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className='lg:col-span-2'>
                <div
                  className='bg-white border-2 border-neutral-200 rounded-2xl shadow-sm hover:shadow-md'
                  style={{ padding: '48px' }}
                >
                  <h2
                    className='text-neutral-900'
                    style={{
                      fontSize: '28px',
                      lineHeight: '36px',
                      letterSpacing: '-0.01em',
                      fontWeight: '700',
                      marginBottom: '32px',
                    }}
                  >
                    {t('contact.sendMessage')}
                  </h2>
                  <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                  >
                    <div className='grid grid-cols-1 md:grid-cols-2' style={{ gap: '24px' }}>
                      <div>
                        <label
                          htmlFor='name'
                          className='block font-semibold text-neutral-900'
                          style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '20px' }}
                        >
                          {t('contact.name')} *
                        </label>
                        <input
                          type='text'
                          id='name'
                          name='name'
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className='w-full border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                          style={{
                            paddingLeft: '16px',
                            paddingRight: '16px',
                            paddingTop: '12px',
                            paddingBottom: '12px',
                            fontSize: '16px',
                            lineHeight: '24px',
                          }}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor='email'
                          className='block font-semibold text-neutral-900'
                          style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '20px' }}
                        >
                          {t('contact.email')} *
                        </label>
                        <input
                          type='email'
                          id='email'
                          name='email'
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className='w-full border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                          style={{
                            paddingLeft: '16px',
                            paddingRight: '16px',
                            paddingTop: '12px',
                            paddingBottom: '12px',
                            fontSize: '16px',
                            lineHeight: '24px',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor='category'
                        className='block font-semibold text-neutral-900'
                        style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '20px' }}
                      >
                        {t('contact.category')} *
                      </label>
                      <select
                        id='category'
                        name='category'
                        required
                        value={formData.category}
                        onChange={handleChange}
                        className='w-full border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                        style={{
                          paddingLeft: '16px',
                          paddingRight: '16px',
                          paddingTop: '12px',
                          paddingBottom: '12px',
                          fontSize: '16px',
                          lineHeight: '24px',
                        }}
                      >
                        <option value='general'>{t('contact.general')}</option>
                        <option value='technical'>{t('contact.technical')}</option>
                        <option value='billing'>{t('contact.billing')}</option>
                        <option value='feature'>{t('contact.featureRequest')}</option>
                        <option value='security'>{t('contact.securityConcern')}</option>
                        <option value='other'>{t('contact.other')}</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor='subject'
                        className='block font-semibold text-neutral-900'
                        style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '20px' }}
                      >
                        {t('contact.subject')} *
                      </label>
                      <input
                        type='text'
                        id='subject'
                        name='subject'
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className='w-full border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                        style={{
                          paddingLeft: '16px',
                          paddingRight: '16px',
                          paddingTop: '12px',
                          paddingBottom: '12px',
                          fontSize: '16px',
                          lineHeight: '24px',
                        }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor='message'
                        className='block font-semibold text-neutral-900'
                        style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '20px' }}
                      >
                        {t('contact.message')} *
                      </label>
                      <textarea
                        id='message'
                        name='message'
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        className='w-full border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none'
                        style={{
                          paddingLeft: '16px',
                          paddingRight: '16px',
                          paddingTop: '12px',
                          paddingBottom: '12px',
                          fontSize: '16px',
                          lineHeight: '24px',
                        }}
                      />
                    </div>

                    {submitStatus === 'success' && (
                      <div
                        className='bg-secondary-100 border-2 border-secondary-200 text-secondary-700 rounded-xl'
                        style={{
                          paddingLeft: '16px',
                          paddingRight: '16px',
                          paddingTop: '12px',
                          paddingBottom: '12px',
                        }}
                      >
                        {t('contact.successMessage')}
                      </div>
                    )}

                    {submitStatus === 'error' && (
                      <div
                        className='bg-status-error/10 border-2 border-status-error/30 text-status-error rounded-xl'
                        style={{
                          paddingLeft: '16px',
                          paddingRight: '16px',
                          paddingTop: '12px',
                          paddingBottom: '12px',
                        }}
                      >
                        {t('contact.errorMessage')}
                      </div>
                    )}

                    <Button
                      type='submit'
                      variant='primary'
                      size='md'
                      isLoading={isSubmitting}
                      disabled={isSubmitting}
                      className='w-full'
                    >
                      {t('contact.submit')}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
