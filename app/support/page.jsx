import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Support & FAQ | Doctor\'s Clinic',
  description: 'Get help and find answers to frequently asked questions about Doctor\'s Clinic',
};

export default function SupportPage() {
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
          a: 'You\'ll need basic clinic information including name, address, contact details, timezone, currency, and tax settings. You can also configure appointment types, consultation durations, and other clinic-specific settings.',
        },
        {
          q: 'Is there a mobile app?',
          a: 'Currently, Doctor\'s Clinic is accessible through web browsers on desktop and mobile devices. We are working on native mobile apps for iOS and Android, which will be available in the future.',
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
          q: 'Is Doctor\'s Clinic HIPAA compliant?',
          a: 'Yes, Doctor\'s Clinic is designed to be HIPAA compliant. We implement encryption for PHI, maintain audit logs, use role-based access control, and execute Business Associate Agreements with healthcare providers.',
        },
        {
          q: 'How is patient data encrypted?',
          a: 'Protected Health Information (PHI) is encrypted using AES-256-GCM encryption at rest. All data transmission uses TLS/SSL encryption. We never store PHI in logs or include it in notifications.',
        },
        {
          q: 'Can I export my data?',
          a: 'Yes, you can export your data at any time. Contact support to request a data export, and we\'ll provide your data in a structured format. This is also available for GDPR compliance.',
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
          a: 'We offer flexible pricing based on the number of users and features. Contact our sales team for detailed pricing information and to discuss which plan best fits your clinic\'s needs.',
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
          a: 'Doctor\'s Clinic works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for optimal performance.',
        },
        {
          q: 'Do I need to install any software?',
          a: 'No installation is required! Doctor\'s Clinic is a cloud-based platform accessible through your web browser. Just sign up and start using it immediately.',
        },
        {
          q: 'How do I report a bug or issue?',
          a: 'You can report issues through the support contact form, email us at support@clinichub.com, or use the in-app feedback feature. We prioritize security and critical issues.',
        },
        {
          q: 'Is there an API available?',
          a: 'Yes, Doctor\'s Clinic is built API-first to support future integrations and mobile apps. API documentation is available for enterprise customers. Contact us for API access.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Support Center
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions or get in touch with our support
              team
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Link
              href="/support/contact"
              className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover-lift group animate-fade-in"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-300">
                <svg
                  className="w-6 h-6 text-blue-600 group-hover:rotate-12 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                Contact Support
              </h3>
              <p className="text-gray-600">
                Get help from our support team via email or contact form
              </p>
            </Link>

            <Link
              href="/support#faq"
              className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover-lift group animate-fade-in animation-delay-1000"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                <svg
                  className="w-6 h-6 text-green-600 group-hover:rotate-12 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                FAQ
              </h3>
              <p className="text-gray-600">
                Browse frequently asked questions and find quick answers
              </p>
            </Link>

            <a
              href="#"
              className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover-lift group animate-fade-in animation-delay-2000"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 group-hover:scale-110 transition-all duration-300">
                <svg
                  className="w-6 h-6 text-purple-600 group-hover:rotate-12 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                Documentation
              </h3>
              <p className="text-gray-600">
                Access user guides and API documentation
              </p>
            </a>
          </div>

          {/* FAQ Section */}
          <section id="faq" className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>

            <div className="space-y-12">
              {faqs.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                    {category.category}
                  </h3>
                  <div className="space-y-4">
                    {category.questions.map((faq, faqIndex) => (
                      <div
                        key={faqIndex}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-blue-300 transition-all duration-300 group"
                      >
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors flex items-start">
                          <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {faq.q}
                        </h4>
                        <p className="text-gray-700 leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Still Need Help */}
          <section className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Still Need Help?
            </h2>
            <p className="text-blue-100 mb-6">
              Our support team is here to help you get the most out of Doctor\'s Clinic
            </p>
            <Link href="/support/contact">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Contact Support
              </button>
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

