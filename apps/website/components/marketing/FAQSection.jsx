'use client';

import { ChevronDownIcon } from '@/components/icons';
import { useI18n } from '@/contexts/I18nContext';

export function FAQSection({ openFaqIndex, onFaqToggle }) {
  const { t } = useI18n();
  const faqs = [
    { question: t('homepage.faq1Question'), answer: t('homepage.faq1Answer') },
    { question: t('homepage.faq2Question'), answer: t('homepage.faq2Answer') },
    { question: t('homepage.faq3Question'), answer: t('homepage.faq3Answer') },
    { question: t('homepage.faq4Question'), answer: t('homepage.faq4Answer') },
    { question: t('homepage.faq5Question'), answer: t('homepage.faq5Answer') },
    { question: t('homepage.faq6Question'), answer: t('homepage.faq6Answer') },
  ];

  return (
    <section
      className='bg-white'
      style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        paddingLeft: '32px',
        paddingRight: '32px',
      }}
    >
      <div className='max-w-4xl mx-auto'>
        <div className='text-center mb-10'>
          <h2
            className='text-neutral-900 mb-4'
            style={{
              fontSize: '48px',
              lineHeight: '56px',
              letterSpacing: '-0.02em',
              fontWeight: '700',
            }}
          >
            {t('homepage.faqTitle')}
          </h2>
          <p
            className='text-neutral-700'
            style={{
              fontSize: '18px',
              lineHeight: '28px',
              letterSpacing: '-0.01em',
              fontWeight: '400',
            }}
          >
            {t('homepage.faqSubtitle')}
          </p>
        </div>

        <div className='space-y-4'>
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className={`bg-white rounded-xl border overflow-hidden ${
                  isOpen
                    ? 'border-primary-500 shadow-lg'
                    : 'border-neutral-200 hover:border-primary-300 hover:shadow-md'
                }`}
              >
                <button
                  onClick={() => onFaqToggle(index)}
                  className='w-full p-6 flex items-center justify-between text-left group'
                >
                  <h3
                    className={`font-semibold flex-1 pr-4 ${
                      isOpen ? 'text-primary-700' : 'text-neutral-900 group-hover:text-primary-600'
                    }`}
                    style={{
                      fontSize: '18px',
                      lineHeight: '28px',
                      letterSpacing: '-0.01em',
                      fontWeight: '600',
                    }}
                  >
                    {faq.question}
                  </h3>
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isOpen
                        ? 'bg-primary-100 text-primary-600 rotate-180'
                        : 'bg-neutral-100 text-neutral-600 group-hover:bg-primary-50 group-hover:text-primary-600'
                    }`}
                  >
                    <ChevronDownIcon style={{ width: 20, height: 20 }} />
                  </div>
                </button>

                <div
                  className={`${
                    isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  } overflow-hidden`}
                >
                  <div className='px-6 pb-6'>
                    <div
                      className='text-neutral-700 pt-2 border-t border-neutral-100'
                      style={{
                        fontSize: '16px',
                        lineHeight: '26px',
                        letterSpacing: '-0.01em',
                        fontWeight: '400',
                      }}
                    >
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
