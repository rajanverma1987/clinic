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
      name: t('homepage.testimonial1Name'),
      role: t('homepage.testimonial1Role'),
      initials: 'SJ',
      bgColor: 'bg-primary-500',
    },
    {
      text: t('homepage.testimonial2'),
      name: t('homepage.testimonial2Name'),
      role: t('homepage.testimonial2Role'),
      initials: 'RM',
      bgColor: 'bg-primary-500',
    },
    {
      text: t('homepage.testimonial3'),
      name: t('homepage.testimonial3Name'),
      role: t('homepage.testimonial3Role'),
      initials: 'MW',
      bgColor: 'bg-primary-500',
    },
    {
      text: t('homepage.testimonial4'),
      name: t('homepage.testimonial4Name'),
      role: t('homepage.testimonial4Role'),
      initials: 'JA',
      bgColor: 'bg-primary-600',
    },
    {
      text: t('homepage.testimonial5'),
      name: t('homepage.testimonial5Name'),
      role: t('homepage.testimonial5Role'),
      initials: 'EC',
      bgColor: 'bg-primary-500',
    },
    {
      text: t('homepage.testimonial6'),
      name: t('homepage.testimonial6Name'),
      role: t('homepage.testimonial6Role'),
      initials: 'MB',
      bgColor: 'bg-primary-500',
    },
  ];

  const totalSlides = Math.ceil(testimonials.length / (cardsPerView || 1));

  return (
    <section className='py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50'>
      <div className='max-w-6xl mx-auto'>
        <header className='text-center mb-10 sm:mb-12'>
          <h2 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-3'>
            {t('homepage.testimonialsTitle')}
          </h2>
          <p className='text-neutral-600 text-base sm:text-lg max-w-2xl mx-auto'>
            {t('homepage.testimonialsDescription')}
          </p>
        </header>

        <div className='relative px-2 sm:px-4'>
          <div className='overflow-hidden rounded-2xl'>
            <div
              className='flex transition-transform duration-300 ease-out'
              style={{
                transform: `translateX(-${currentTestimonialIndex * (100 / (cardsPerView || 1))}%)`,
              }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className='flex-shrink-0 px-2 sm:px-3'
                  style={{ width: `${100 / (cardsPerView || 1)}%` }}
                >
                  <article className='h-full rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-200'>
                    <div className='flex gap-1 mb-4' aria-hidden='true'>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <svg
                          key={i}
                          className='w-5 h-5 text-amber-400'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                          aria-hidden='true'
                        >
                          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                        </svg>
                      ))}
                    </div>
                    <blockquote className='text-neutral-700 text-base sm:text-lg leading-relaxed mb-6 italic'>
                      &ldquo;{testimonial.text}&rdquo;
                    </blockquote>
                    <footer className='flex items-center gap-4'>
                      <div
                        className={`${testimonial.bgColor} flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm`}
                      >
                        {testimonial.initials}
                      </div>
                      <div className='min-w-0'>
                        <cite className='not-italic font-semibold text-neutral-900 block'>
                          {testimonial.name}
                        </cite>
                        <p className='text-neutral-500 text-sm'>{testimonial.role}</p>
                      </div>
                    </footer>
                  </article>
                </div>
              ))}
            </div>
          </div>

          {/* Prev / Next */}
          {totalSlides > 1 && (
            <>
              <button
                type='button'
                onClick={() =>
                  setCurrentTestimonialIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1))
                }
                className='absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-neutral-200 shadow-md hover:shadow-lg hover:border-primary-300 flex items-center justify-center text-neutral-600 hover:text-primary-600 transition-colors'
                aria-label={t('homepage.testimonialPrev')}
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 19l-7-7 7-7'
                  />
                </svg>
              </button>
              <button
                type='button'
                onClick={() =>
                  setCurrentTestimonialIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1))
                }
                className='absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-neutral-200 shadow-md hover:shadow-lg hover:border-primary-300 flex items-center justify-center text-neutral-600 hover:text-primary-600 transition-colors'
                aria-label={t('homepage.testimonialNext')}
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </button>
            </>
          )}

          {/* Dots */}
          {totalSlides > 1 && (
            <div
              className='flex justify-center gap-2 mt-8'
              role='tablist'
              aria-label='Testimonial slides'
            >
              {[...Array(totalSlides)].map((_, index) => (
                <button
                  key={index}
                  type='button'
                  role='tab'
                  aria-selected={currentTestimonialIndex === index}
                  aria-label={`${t('homepage.testimonialSlide')} ${index + 1}`}
                  onClick={() => setCurrentTestimonialIndex(index)}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    currentTestimonialIndex === index
                      ? 'w-8 bg-primary-500'
                      : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
