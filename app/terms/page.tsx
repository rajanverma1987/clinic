import { Metadata } from 'next';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | ClinicHub',
  description: 'Terms of Service for ClinicHub - Clinic Management System',
};

export default function TermsPage() {
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
            Terms of Service
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
                1. Agreement to Terms
              </h2>
              <p className="text-gray-700 mb-4">
                By accessing or using ClinicHub (&quot;Service&quot;), you agree to be
                bound by these Terms of Service (&quot;Terms&quot;). If you disagree with
                any part of these terms, you may not access the Service.
              </p>
              <p className="text-gray-700">
                These Terms apply to all users of the Service, including without
                limitation users who are browsers, vendors, customers, merchants,
                and contributors of content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Description of Service
              </h2>
              <p className="text-gray-700 mb-4">
                ClinicHub is a cloud-based clinic management system that provides:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Patient management and medical records</li>
                <li>Appointment scheduling and queue management</li>
                <li>Clinical notes and documentation</li>
                <li>Prescription management</li>
                <li>Billing and invoicing</li>
                <li>Inventory management</li>
                <li>Reporting and analytics</li>
              </ul>
              <p className="text-gray-700">
                We reserve the right to modify, suspend, or discontinue any part
                of the Service at any time with or without notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Account Registration
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.1 Account Requirements
              </h3>
              <p className="text-gray-700 mb-4">
                To use the Service, you must:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information as necessary</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.2 Account Security
              </h3>
              <p className="text-gray-700">
                You are responsible for maintaining the confidentiality of your
                account password and for all activities that occur under your
                account. You agree to notify us immediately of any unauthorized
                use of your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Acceptable Use
              </h2>
              <p className="text-gray-700 mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Violate any applicable healthcare regulations (HIPAA, GDPR, etc.)</li>
                <li>Transmit any malicious code, viruses, or harmful data</li>
                <li>Attempt to gain unauthorized access to the Service or related systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Share your account credentials with unauthorized parties</li>
                <li>Use the Service to store or process data in violation of patient privacy rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Healthcare Compliance
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                5.1 HIPAA Compliance
              </h3>
              <p className="text-gray-700 mb-4">
                As a healthcare provider using ClinicHub, you are responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Complying with all applicable HIPAA regulations</li>
                <li>Obtaining necessary patient consents and authorizations</li>
                <li>Implementing appropriate administrative, physical, and technical safeguards</li>
                <li>Reporting any security incidents or breaches as required by law</li>
                <li>Executing a Business Associate Agreement with us</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                5.2 GDPR Compliance
              </h3>
              <p className="text-gray-700">
                If you process personal data of individuals in the European
                Economic Area (EEA), you are responsible for complying with GDPR
                requirements, including obtaining appropriate consents and
                implementing data protection measures.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Intellectual Property
              </h2>
              <p className="text-gray-700 mb-4">
                The Service and its original content, features, and functionality
                are owned by ClinicHub and are protected by international
                copyright, trademark, patent, trade secret, and other intellectual
                property laws.
              </p>
              <p className="text-gray-700 mb-4">
                You retain ownership of any data you submit to the Service.
                However, by using the Service, you grant us a license to use,
                store, and process your data solely for the purpose of providing
                the Service.
              </p>
              <p className="text-gray-700">
                You may not copy, modify, distribute, sell, or lease any part of
                the Service without our prior written consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Payment Terms
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                7.1 Subscription Fees
              </h3>
              <p className="text-gray-700 mb-4">
                Access to the Service may require payment of subscription fees.
                Fees are billed in advance on a monthly or annual basis, as
                selected during registration.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                7.2 Payment Processing
              </h3>
              <p className="text-gray-700 mb-4">
                Payments are processed through secure third-party payment
                processors. You agree to provide current, complete, and accurate
                payment information.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                7.3 Refunds
              </h3>
              <p className="text-gray-700">
                Subscription fees are generally non-refundable. Refunds may be
                considered on a case-by-case basis for extenuating circumstances.
                Please contact us for refund requests.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Service Availability
              </h2>
              <p className="text-gray-700 mb-4">
                We strive to maintain high availability of the Service but do not
                guarantee uninterrupted or error-free operation. The Service may
                be temporarily unavailable due to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Scheduled maintenance</li>
                <li>System updates or upgrades</li>
                <li>Technical issues or failures</li>
                <li>Force majeure events</li>
              </ul>
              <p className="text-gray-700">
                We will make reasonable efforts to notify you of planned
                maintenance and minimize service disruptions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Data Backup and Recovery
              </h2>
              <p className="text-gray-700 mb-4">
                We implement regular data backups and disaster recovery
                procedures. However, you are responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Maintaining your own backups of critical data</li>
                <li>Ensuring data accuracy and completeness</li>
                <li>Implementing appropriate data retention policies</li>
              </ul>
              <p className="text-gray-700">
                We are not liable for any data loss resulting from your failure
                to maintain backups or from circumstances beyond our reasonable
                control.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Limitation of Liability
              </h2>
              <p className="text-gray-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLINICHUB SHALL NOT BE
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS,
                DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p className="text-gray-700 mb-4">
                Our total liability for any claims arising from or related to the
                Service shall not exceed the amount you paid us in the twelve (12)
                months preceding the claim.
              </p>
              <p className="text-gray-700">
                Some jurisdictions do not allow the exclusion or limitation of
                certain damages, so some of the above limitations may not apply
                to you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Indemnification
              </h2>
              <p className="text-gray-700">
                You agree to indemnify, defend, and hold harmless ClinicHub and
                its officers, directors, employees, and agents from and against
                any claims, liabilities, damages, losses, and expenses,
                including reasonable attorneys&apos; fees, arising out of or in any
                way connected with your use of the Service, violation of these
                Terms, or violation of any applicable laws or regulations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Termination
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                12.1 Termination by You
              </h3>
              <p className="text-gray-700 mb-4">
                You may terminate your account at any time by contacting us or
                using the account termination feature in the Service.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                12.2 Termination by Us
              </h3>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account immediately, without
                prior notice, if you:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Violate these Terms</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Fail to pay subscription fees</li>
                <li>Violate healthcare regulations or privacy laws</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                12.3 Effect of Termination
              </h3>
              <p className="text-gray-700">
                Upon termination, your right to use the Service will immediately
                cease. We will retain your data for a reasonable period as
                required by law or our data retention policies. You may request
                data export before termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                13. Dispute Resolution
              </h2>
              <p className="text-gray-700 mb-4">
                Any disputes arising from or relating to these Terms or the
                Service shall be resolved through binding arbitration in
                accordance with the rules of the American Arbitration Association,
                except where prohibited by law.
              </p>
              <p className="text-gray-700">
                You agree to waive any right to a jury trial and to participate
                in class action lawsuits.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                14. Changes to Terms
              </h2>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. We will
                notify you of material changes by posting the updated Terms on
                this page and updating the &quot;Last updated&quot; date. Your continued
                use of the Service after such changes constitutes acceptance of
                the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                15. Contact Information
              </h2>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:legal@clinichub.com"
                    className="text-blue-600 hover:underline"
                  >
                    legal@clinichub.com
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

