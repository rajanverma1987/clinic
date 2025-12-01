import { Metadata } from 'next';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | ClinicHub',
  description: 'Privacy Policy for ClinicHub - Clinic Management System',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-700 mb-4">
                Welcome to ClinicHub (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to
                protecting your privacy and ensuring the security of your
                personal information and Protected Health Information (PHI). This
                Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you use our clinic management
                system.
              </p>
              <p className="text-gray-700">
                By using ClinicHub, you agree to the collection and use of
                information in accordance with this policy. We comply with
                applicable data protection laws, including HIPAA (Health Insurance
                Portability and Accountability Act) in the United States and GDPR
                (General Data Protection Regulation) in the European Union.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Information We Collect
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2.1 Personal Information
              </h3>
              <p className="text-gray-700 mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Name, email address, phone number, and contact information</li>
                <li>Account credentials and authentication information</li>
                <li>Clinic and practice information</li>
                <li>Billing and payment information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2.2 Protected Health Information (PHI)
              </h3>
              <p className="text-gray-700 mb-4">
                As a healthcare management platform, we process PHI on behalf of
                healthcare providers. This includes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Patient medical records and history</li>
                <li>Clinical notes and diagnoses</li>
                <li>Prescription information</li>
                <li>Appointment and treatment records</li>
                <li>Insurance and billing information</li>
              </ul>
              <p className="text-gray-700">
                We act as a Business Associate under HIPAA and process PHI
                strictly in accordance with our Business Associate Agreement and
                applicable regulations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-gray-700 mb-4">We use collected information to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and manage billing</li>
                <li>Send appointment reminders and notifications (with your consent)</li>
                <li>Comply with legal obligations and regulatory requirements</li>
                <li>Detect and prevent fraud, abuse, and security threats</li>
                <li>Respond to your inquiries and provide customer support</li>
              </ul>
              <p className="text-gray-700">
                We do not use PHI for marketing purposes or share it with third
                parties except as described in this policy or as required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Data Security
              </h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures to protect your
                information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>
                  <strong>Encryption:</strong> AES-256-GCM encryption for PHI
                  fields at rest and in transit
                </li>
                <li>
                  <strong>Access Controls:</strong> Role-based access control
                  (RBAC) and multi-factor authentication
                </li>
                <li>
                  <strong>Audit Logging:</strong> Comprehensive audit trails for
                  all data access and modifications
                </li>
                <li>
                  <strong>Network Security:</strong> Secure connections using
                  TLS/SSL protocols
                </li>
                <li>
                  <strong>Regular Security Audits:</strong> Ongoing security
                  assessments and vulnerability testing
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Data Sharing and Disclosure
              </h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information or PHI.
                We may share information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>
                  <strong>Service Providers:</strong> With trusted third-party
                  service providers who assist in operating our platform (under
                  strict confidentiality agreements)
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law,
                  court order, or government regulation
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a
                  merger, acquisition, or sale of assets (with prior notice)
                </li>
                <li>
                  <strong>With Your Consent:</strong> When you explicitly
                  authorize us to share information
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Your Rights (GDPR)
              </h2>
              <p className="text-gray-700 mb-4">
                If you are located in the European Economic Area (EEA), you have
                the following rights:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>
                  <strong>Right to Access:</strong> Request a copy of your
                  personal data
                </li>
                <li>
                  <strong>Right to Rectification:</strong> Request correction of
                  inaccurate data
                </li>
                <li>
                  <strong>Right to Erasure:</strong> Request deletion of your
                  data (subject to legal requirements)
                </li>
                <li>
                  <strong>Right to Restrict Processing:</strong> Request
                  limitation of data processing
                </li>
                <li>
                  <strong>Right to Data Portability:</strong> Receive your data
                  in a structured, machine-readable format
                </li>
                <li>
                  <strong>Right to Object:</strong> Object to processing of
                  your data for certain purposes
                </li>
              </ul>
              <p className="text-gray-700">
                To exercise these rights, please contact us at{' '}
                <a
                  href="mailto:privacy@clinichub.com"
                  className="text-blue-600 hover:underline"
                >
                  privacy@clinichub.com
                </a>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. HIPAA Compliance
              </h2>
              <p className="text-gray-700 mb-4">
                As a Business Associate, we:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Maintain appropriate administrative, physical, and technical safeguards</li>
                <li>Report any security incidents or breaches as required by law</li>
                <li>Ensure workforce members are trained on HIPAA requirements</li>
                <li>Execute Business Associate Agreements with covered entities</li>
                <li>Conduct regular risk assessments and security audits</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Data Retention
              </h2>
              <p className="text-gray-700 mb-4">
                We retain your information for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Provide our services to you</li>
                <li>Comply with legal and regulatory obligations</li>
                <li>Resolve disputes and enforce agreements</li>
              </ul>
              <p className="text-gray-700">
                PHI is retained in accordance with applicable healthcare
                regulations, which may require retention for extended periods.
                Upon account termination, we will securely delete or anonymize
                data in accordance with our retention policies and legal
                requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. International Data Transfers
              </h2>
              <p className="text-gray-700 mb-4">
                Your information may be transferred to and processed in countries
                other than your country of residence. We ensure appropriate
                safeguards are in place, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Standard Contractual Clauses (SCCs) for GDPR compliance</li>
                <li>Data processing agreements with service providers</li>
                <li>Compliance with applicable data protection laws</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Children&apos;s Privacy
              </h2>
              <p className="text-gray-700">
                Our services are not intended for individuals under the age of
                18. We do not knowingly collect personal information from
                children. If you believe we have collected information from a
                child, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by posting the new policy on
                this page and updating the &quot;Last updated&quot; date. For significant
                changes, we may also notify you via email or through our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Contact Us
              </h2>
              <p className="text-gray-700 mb-4">
                If you have questions or concerns about this Privacy Policy or
                our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:privacy@clinichub.com"
                    className="text-blue-600 hover:underline"
                  >
                    privacy@clinichub.com
                  </a>
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Data Protection Officer:</strong>{' '}
                  <a
                    href="mailto:dpo@clinichub.com"
                    className="text-blue-600 hover:underline"
                  >
                    dpo@clinichub.com
                  </a>
                </p>
                <p className="text-gray-700">
                  <strong>Support:</strong>{' '}
                  <Link
                    href="/support/contact"
                    className="text-blue-600 hover:underline"
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

