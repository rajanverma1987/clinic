'use client';

export function FAQSection({ openFaqIndex, onFaqToggle }) {
  const faqs = [
    {
      question: 'Is data secure?',
      answer:
        'Yes, we use end-to-end encryption, HIPAA-compliant, and implement strict security measures to protect all patient data.',
    },
    {
      question: 'Can multiple doctors use it?',
      answer:
        'Absolutely! Our platform supports multiple doctors, staff members, and departments. You can assign different roles and permissions to each user.',
    },
    {
      question: 'Is there a mobile app?',
      answer:
        'Yes, our platform is fully responsive and works seamlessly on mobile devices. We also offer native mobile apps for iOS and Android.',
    },
    {
      question: 'What about backups?',
      answer:
        'We perform automated daily backups of all data with 30-day retention. All backups are encrypted and stored in secure, geographically distributed locations.',
    },
    {
      question: 'Can I customize the platform for my clinic?',
      answer:
        'Yes, our Premium and Enterprise plans offer extensive customization options including custom branding, workflows, and integrations.',
    },
    {
      question: 'What kind of support do you provide?',
      answer:
        'We offer email support for all plans, priority support for Standard and above, and 24/7 dedicated support for Premium and Enterprise customers.',
    },
  ];

  return (
    <section className='py-32 px-4 sm:px-6 lg:px-8 bg-white'>
      <div className='max-w-4xl mx-auto'>
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
            Frequently Asked Questions
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
            Everything you need to know about our platform
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
                    <svg
                      style={{ width: '20px', height: '20px' }}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
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
