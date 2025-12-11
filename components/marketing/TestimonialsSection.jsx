'use client';

import { useI18n } from '@/contexts/I18nContext';

export function TestimonialsSection({
  currentTestimonialIndex,
  setCurrentTestimonialIndex,
  cardsPerView,
}) {
  const { t } = useI18n();

  const testimonials = [
    {
      text: t('homepage.testimonial1'),
      name: 'Dr. Sarah Johnson',
      role: 'Family Medicine, HealthCare Plus',
      initials: 'SJ',
      bgColor: 'bg-primary-500',
    },
    {
      text: t('homepage.testimonial2'),
      name: 'Dr. Rajesh Mehta',
      role: 'Cardiologist, Global Heart Center',
      initials: 'RM',
      bgColor: 'bg-secondary-500',
    },
    {
      text: t('homepage.testimonial3'),
      name: 'Dr. Maria Williams',
      role: 'Pediatrician, Little Smiles Clinic',
      initials: 'MW',
      bgColor: 'bg-primary-300',
    },
    {
      text: t('homepage.testimonial4'),
      name: 'Dr. James Anderson',
      role: 'Multi-Location Manager, Health Network',
      initials: 'JA',
      bgColor: 'bg-secondary-700',
    },
    {
      text: t('homepage.testimonial5'),
      name: 'Dr. Emily Chen',
      role: 'Internal Medicine, City Medical Group',
      initials: 'EC',
      bgColor: 'bg-primary-700',
    },
    {
      text: t('homepage.testimonial6'),
      name: 'Dr. Michael Brown',
      role: 'Pharmacy Director, Care Pharmacy',
      initials: 'MB',
      bgColor: 'bg-secondary-500',
    },
  ];

  const totalSlides = Math.ceil(testimonials.length / cardsPerView);

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
          <h2
            className='text-neutral-900 mb-6'
            style={{
              fontSize: '48px',
              lineHeight: '56px',
              letterSpacing: '-0.02em',
              fontWeight: '700',
            }}
          >
            {t('homepage.testimonialsTitle')}
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
            {t('homepage.testimonialsDescription')}
          </p>
        </div>

        <div className='relative'>
          <div className='overflow-hidden'>
            <div
              className='flex'
              style={{
                transform: `translateX(-${currentTestimonialIndex * (100 / 3)}%)`,
              }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className='flex-shrink-0 px-4'
                  style={{ width: `${100 / cardsPerView}%` }}
                >
                  <div className='p-8 rounded-xl border border-neutral-200 bg-white hover:shadow-lg h-full'>
                    <div className='flex items-center mb-4'>
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          style={{ width: '20px', height: '20px' }}
                          className='text-status-warning'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                        </svg>
                      ))}
                    </div>
                    <p
                      className='text-neutral-700 mb-6 italic'
                      style={{
                        fontSize: '16px',
                        lineHeight: '26px',
                        letterSpacing: '-0.01em',
                        fontWeight: '400',
                      }}
                    >
                      &ldquo;{testimonial.text}&rdquo;
                    </p>
                    <div className='flex items-center'>
                      <div
                        className={`${testimonial.bgColor} rounded-full flex items-center justify-center text-white font-semibold mr-4`}
                        style={{ width: '48px', height: '48px', fontSize: '16px' }}
                      >
                        {testimonial.initials}
                      </div>
                      <div>
                        <h4
                          className='font-semibold text-neutral-900'
                          style={{
                            fontSize: '18px',
                            lineHeight: '28px',
                            letterSpacing: '-0.01em',
                            fontWeight: '600',
                          }}
                        >
                          {testimonial.name}
                        </h4>
                        <p
                          className='text-neutral-600'
                          style={{
                            fontSize: '14px',
                            lineHeight: '20px',
                            fontWeight: '400',
                          }}
                        >
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() =>
              setCurrentTestimonialIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1))
            }
            className='absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl border border-neutral-200 hover:border-primary-500 z-10'
            aria-label='Previous testimonial'
          >
            <svg
              style={{ width: '24px', height: '24px' }}
              className='text-neutral-700 hover:text-primary-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>
          <button
            onClick={() =>
              setCurrentTestimonialIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1))
            }
            className='absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl border border-neutral-200 hover:border-primary-500 z-10'
            aria-label='Next testimonial'
          >
            <svg
              style={{ width: '24px', height: '24px' }}
              className='text-neutral-700 hover:text-primary-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          </button>

          <div className='flex justify-center items-center gap-2 mt-8'>
            {[...Array(totalSlides)].map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonialIndex(index)}
                className={`rounded-full ${
                  currentTestimonialIndex === index
                    ? 'bg-primary-500 w-8 h-3'
                    : 'bg-neutral-300 w-3 h-3 hover:bg-neutral-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
