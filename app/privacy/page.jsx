import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Doctor\'s Clinic',
  description: 'Privacy Policy for Doctor\'s Clinic - Clinic Management System',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      <main className="flex-1 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium group"
              style={{ fontSize: '15px', lineHeight: '24px' }}
            >
              <svg
                style={{ width: '18px', height: '18px', marginRight: '8px' }}
                className='group-hover:-translate-x-1'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
              </svg>
              Back to Home
            </Link>
          </div>

          {/* Header Section */}
          <div className="mb-12">
            <h1 
              className="text-neutral-900 mb-4"
              style={{
                fontSize: '48px',
                lineHeight: '56px',
                letterSpacing: '-0.02em',
                fontWeight: '700',
              }}
            >
            Privacy Policy
          </h1>
            <div className="flex items-center gap-3">
              <p 
                className="text-neutral-600"
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  letterSpacing: '-0.01em',
                }}
              >
            Last updated: {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
              <span className="text-neutral-300">•</span>
              <div className="flex items-center gap-2 bg-primary-100 px-3 py-1 rounded-full">
                <svg
                  style={{ width: '14px', height: '14px' }}
                  className='text-primary-600'
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
                <span className="text-primary-700 font-semibold" style={{ fontSize: '12px', fontWeight: '600' }}>HIPAA & GDPR Compliant</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 md:p-12">
            <section className="mb-10">
              <h2 
                className="text-neutral-900 mb-4"
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                1. Introduction
              </h2>
              <p 
                className="text-neutral-700 mb-4"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                Welcome to Doctor&apos;s Clinic (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to
                protecting your privacy and ensuring the security of your
                personal information and Protected Health Information (PHI). This
                Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you use our clinic management
                system.
              </p>
              <p 
                className="text-neutral-700"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                By using Doctor&apos;s Clinic, you agree to the collection and use of
                information in accordance with this policy. We comply with
                applicable data protection laws, including HIPAA (Health Insurance
                Portability and Accountability Act) in the United States and GDPR
                (General Data Protection Regulation) in the European Union.
              </p>
            </section>

            <section className="mb-10">
              <h2 
                className="text-neutral-900 mb-4"
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                2. Information We Collect
              </h2>
              <h3 
                className="text-neutral-900 mb-3"
                style={{
                  fontSize: '20px',
                  lineHeight: '28px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                2.1 Personal Information
              </h3>
              <p 
                className="text-neutral-700 mb-4"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4 space-y-2" style={{ fontSize: '16px', lineHeight: '26px' }}>
                <li>Name, email address, phone number, and contact information</li>
                <li>Account credentials and authentication information</li>
                <li>Clinic and practice information</li>
                <li>Billing and payment information</li>
              </ul>

              <h3 
                className="text-neutral-900 mb-3"
                style={{
                  fontSize: '20px',
                  lineHeight: '28px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                2.2 Protected Health Information (PHI)
              </h3>
              <p 
                className="text-neutral-700 mb-4"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                As a healthcare management platform, we process PHI on behalf of
                healthcare providers. This includes:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4 space-y-2" style={{ fontSize: '16px', lineHeight: '26px' }}>
                <li>Patient medical records and history</li>
                <li>Clinical notes and diagnoses</li>
                <li>Prescription information</li>
                <li>Appointment and treatment records</li>
                <li>Insurance and billing information</li>
              </ul>
              <p 
                className="text-neutral-700"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                We act as a Business Associate under HIPAA and process PHI
                strictly in accordance with our Business Associate Agreement and
                applicable regulations.
              </p>
            </section>

            <section className="mb-10">
              <h2 
                className="text-neutral-900 mb-4"
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                3. How We Use Your Information
              </h2>
              <p 
                className="text-neutral-700 mb-4"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                We use collected information to:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4 space-y-2" style={{ fontSize: '16px', lineHeight: '26px' }}>
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and manage billing</li>
                <li>Send appointment reminders and notifications (with your consent)</li>
                <li>Comply with legal obligations and regulatory requirements</li>
                <li>Detect and prevent fraud, abuse, and security threats</li>
                <li>Respond to your inquiries and provide customer support</li>
              </ul>
              <p 
                className="text-neutral-700"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                We do not use PHI for marketing purposes or share it with third
                parties except as described in this policy or as required by law.
              </p>
            </section>

            <section className="mb-10">
              <h2 
                className="text-neutral-900 mb-4"
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                4. Data Security
              </h2>
              <p 
                className="text-neutral-700 mb-4"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                We implement industry-standard security measures to protect your
                information:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4 space-y-2" style={{ fontSize: '16px', lineHeight: '26px' }}>
                <li>
                  <strong className="text-neutral-900">Encryption:</strong> AES-256-GCM encryption for PHI
                  fields at rest and in transit
                </li>
                <li>
                  <strong className="text-neutral-900">Access Controls:</strong> Role-based access control
                  (RBAC) and multi-factor authentication
                </li>
                <li>
                  <strong className="text-neutral-900">Audit Logging:</strong> Comprehensive audit trails for
                  all data access and modifications
                </li>
                <li>
                  <strong className="text-neutral-900">Network Security:</strong> Secure connections using
                  TLS/SSL protocols
                </li>
                <li>
                  <strong className="text-neutral-900">Regular Security Audits:</strong> Ongoing security
                  assessments and vulnerability testing
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 
                className="text-neutral-900 mb-4"
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                5. Data Sharing and Disclosure
              </h2>
              <p 
                className="text-neutral-700 mb-4"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                We do not sell, trade, or rent your personal information or PHI.
                We may share information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4 space-y-2" style={{ fontSize: '16px', lineHeight: '26px' }}>
                <li>
                  <strong className="text-neutral-900">Service Providers:</strong> With trusted third-party
                  service providers who assist in operating our platform (under
                  strict confidentiality agreements)
                </li>
                <li>
                  <strong className="text-neutral-900">Legal Requirements:</strong> When required by law,
                  court order, or government regulation
                </li>
                <li>
                  <strong className="text-neutral-900">Business Transfers:</strong> In connection with a
                  merger, acquisition, or sale of assets (with prior notice)
                </li>
                <li>
                  <strong className="text-neutral-900">With Your Consent:</strong> When you explicitly
                  authorize us to share information
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 
                className="text-neutral-900 mb-4"
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                6. Your Rights (GDPR)
              </h2>
              <p 
                className="text-neutral-700 mb-4"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                If you are located in the European Economic Area (EEA), you have
                the following rights:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4 space-y-2" style={{ fontSize: '16px', lineHeight: '26px' }}>
                <li>
                  <strong className="text-neutral-900">Right to Access:</strong> Request a copy of your
                  personal data
                </li>
                <li>
                  <strong className="text-neutral-900">Right to Rectification:</strong> Request correction of
                  inaccurate data
                </li>
                <li>
                  <strong className="text-neutral-900">Right to Erasure:</strong> Request deletion of your
                  data (subject to legal requirements)
                </li>
                <li>
                  <strong className="text-neutral-900">Right to Restrict Processing:</strong> Request
                  limitation of data processing
                </li>
                <li>
                  <strong className="text-neutral-900">Right to Data Portability:</strong> Receive your data
                  in a structured, machine-readable format
                </li>
                <li>
                  <strong className="text-neutral-900">Right to Object:</strong> Object to processing of
                  your data for certain purposes
                </li>
              </ul>
              <p 
                className="text-neutral-700"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                To exercise these rights, please contact us at{' '}
                <a
                  href="mailto:privacy@clinichub.com"
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                >
                  privacy@clinichub.com
                </a>
                .
              </p>
            </section>

            <section className="mb-10">
              <h2 
                className="text-neutral-900 mb-4"
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                7. HIPAA Compliance
              </h2>
              <p 
                className="text-neutral-700 mb-4"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                As a Business Associate, we:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4 space-y-2" style={{ fontSize: '16px', lineHeight: '26px' }}>
                <li>Maintain appropriate administrative, physical, and technical safeguards</li>
                <li>Report any security incidents or breaches as required by law</li>
                <li>Ensure workforce members are trained on HIPAA requirements</li>
                <li>Execute Business Associate Agreements with covered entities</li>
                <li>Conduct regular risk assessments and security audits</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 
                className="text-neutral-900 mb-4"
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                8. Data Retention
              </h2>
              <p 
                className="text-neutral-700 mb-4"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                We retain your information for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4 space-y-2" style={{ fontSize: '16px', lineHeight: '26px' }}>
                <li>Provide our services to you</li>
                <li>Comply with legal and regulatory obligations</li>
                <li>Resolve disputes and enforce agreements</li>
              </ul>
              <p 
                className="text-neutral-700"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                PHI is retained in accordance with applicable healthcare
                regulations, which may require retention for extended periods.
                Upon account termination, we will securely delete or anonymize
                data in accordance with our retention policies and legal
                requirements.
              </p>
            </section>

            <section className="mb-10">
              <h2 
                className="text-neutral-900 mb-4"
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                9. International Data Transfers
              </h2>
              <p 
                className="text-neutral-700 mb-4"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                Your information may be transferred to and processed in countries
                other than your country of residence. We ensure appropriate
                safeguards are in place, including:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4 space-y-2" style={{ fontSize: '16px', lineHeight: '26px' }}>
                <li>Standard Contractual Clauses (SCCs) for GDPR compliance</li>
                <li>Data processing agreements with service providers</li>
                <li>Compliance with applicable data protection laws</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 
                className="text-neutral-900 mb-4"
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                10. Children&apos;s Privacy
              </h2>
              <p 
                className="text-neutral-700"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                Our services are not intended for individuals under the age of
                18. We do not knowingly collect personal information from
                children. If you believe we have collected information from a
                child, please contact us immediately.
              </p>
            </section>

            <section className="mb-10">
              <h2 
                className="text-neutral-900 mb-4"
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                11. Changes to This Privacy Policy
              </h2>
              <p 
                className="text-neutral-700"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by posting the new policy on
                this page and updating the &quot;Last updated&quot; date. For significant
                changes, we may also notify you via email or through our platform.
              </p>
            </section>

            <section className="mb-10">
              <h2 
                className="text-neutral-900 mb-4"
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                12. Contact Us
              </h2>
              <p 
                className="text-neutral-700 mb-4"
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '-0.01em',
                }}
              >
                If you have questions or concerns about this Privacy Policy or
                our data practices, please contact us:
              </p>
              <div className="bg-neutral-100 border border-neutral-200 p-6 rounded-xl">
                <p 
                  className="text-neutral-700 mb-3"
                  style={{
                    fontSize: '16px',
                    lineHeight: '24px',
                  }}
                >
                  <strong className="text-neutral-900">Email:</strong>{' '}
                  <a
                    href="mailto:privacy@clinichub.com"
                    className="text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    privacy@clinichub.com
                  </a>
                </p>
                <p 
                  className="text-neutral-700 mb-3"
                  style={{
                    fontSize: '16px',
                    lineHeight: '24px',
                  }}
                >
                  <strong className="text-neutral-900">Data Protection Officer:</strong>{' '}
                  <a
                    href="mailto:dpo@clinichub.com"
                    className="text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    dpo@clinichub.com
                  </a>
                </p>
                <p 
                  className="text-neutral-700"
                  style={{
                    fontSize: '16px',
                    lineHeight: '24px',
                  }}
                >
                  <strong className="text-neutral-900">Support:</strong>{' '}
                  <Link
                    href="/support/contact"
                    className="text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    Contact Support
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

