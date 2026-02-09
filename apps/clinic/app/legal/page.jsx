'use client';

import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Disclaimer } from '@/components/ui/Disclaimer';
import Link from 'next/link';
import { useEffect } from 'react';

export default function LegalPage() {
  useEffect(() => {
    document.title = 'Legal Information & Disclaimers | Clinic Management System';
  }, []);
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      <main className="flex-1 pb-24 px-4 sm:px-6 lg:px-8" style={{ paddingTop: '120px' }}>
        <div className="max-w-5xl mx-auto">
          {/* Back Link */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium group"
              style={{ fontSize: '15px', lineHeight: '24px' }}
            >
              <svg
                style={{ width: '18px', height: '18px', marginRight: '8px' }}
                className='group-hover:-translate-x-1 transition-transform'
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
                fontSize: '32px',
                lineHeight: '40px',
                letterSpacing: '-0.02em',
                fontWeight: '700',
              }}
            >
              Legal Information & Disclaimers
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
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
                <span className="text-primary-700 font-semibold" style={{ fontSize: '12px', fontWeight: '600' }}>
                  HIPAA & GDPR Compliant
                </span>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mb-8">
            <h2 className="text-h3 text-neutral-900 mb-4">Quick Navigation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="#disclaimers"
                className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-body-md text-neutral-700">Disclaimers</span>
              </Link>
              <Link
                href="/privacy"
                className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-body-md text-neutral-700">Privacy Policy</span>
              </Link>
              <Link
                href="/terms"
                className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-body-md text-neutral-700">Terms of Service</span>
              </Link>
              <Link
                href="/support/contact"
                className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-body-md text-neutral-700">Contact Support</span>
              </Link>
            </div>
          </div>

          {/* All Disclaimers Section */}
          <div id="disclaimers" className="space-y-8 mb-12">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8">
              <h2 
                className="text-neutral-900 mb-6"
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                Important Disclaimers
              </h2>
              <p
                className="text-neutral-700 mb-6"
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: '400',
                }}
              >
                The following disclaimers apply to all users of this clinic management system. Please read them carefully.
              </p>

              {/* HIPAA Compliance Disclaimer */}
              <div className="mb-6">
                <Disclaimer type="general" />
              </div>

              {/* Medical Disclaimer */}
              <div className="mb-6">
                <Disclaimer type="medical" />
              </div>

              {/* Prescription Disclaimer */}
              <div className="mb-6">
                <Disclaimer type="prescription" />
              </div>

              {/* Telemedicine Disclaimer */}
              <div className="mb-6">
                <Disclaimer type="telemedicine" />
              </div>

              {/* Data Protection Disclaimer */}
              <div>
                <Disclaimer type="data" />
              </div>
            </div>
          </div>

          {/* Terms of Service Summary */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 mb-8">
            <h2 
              className="text-neutral-900 mb-4"
              style={{
                fontSize: '24px',
                lineHeight: '32px',
                letterSpacing: '-0.01em',
                fontWeight: '600',
              }}
            >
              Terms of Service
            </h2>
            <p 
              className="text-neutral-700 mb-4"
              style={{
                fontSize: '16px',
                lineHeight: '26px',
              }}
            >
              By using this clinic management system, you agree to our Terms of Service. Key points include:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 mb-4 space-y-2" style={{ fontSize: '16px', lineHeight: '26px' }}>
              <li>You must be at least 18 years old to use this service</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must comply with all applicable healthcare regulations (HIPAA, GDPR, etc.)</li>
              <li>You agree not to use the service for illegal purposes</li>
              <li>We reserve the right to terminate accounts that violate these terms</li>
            </ul>
            <Link
              href="/terms"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              style={{ fontSize: '16px' }}
            >
              Read Full Terms of Service
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Privacy Policy Summary */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 mb-8">
            <h2 
              className="text-neutral-900 mb-4"
              style={{
                fontSize: '24px',
                lineHeight: '32px',
                letterSpacing: '-0.01em',
                fontWeight: '600',
              }}
            >
              Privacy Policy
            </h2>
            <p 
              className="text-neutral-700 mb-4"
              style={{
                fontSize: '16px',
                lineHeight: '26px',
              }}
            >
              We are committed to protecting your privacy and the security of Protected Health Information (PHI). Our privacy practices include:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 mb-4 space-y-2" style={{ fontSize: '16px', lineHeight: '26px' }}>
              <li>AES-256-GCM encryption for all PHI at rest and in transit</li>
              <li>Role-based access control and multi-factor authentication</li>
              <li>Comprehensive audit logging for all data access</li>
              <li>Compliance with HIPAA and GDPR regulations</li>
              <li>No sale or sharing of PHI for marketing purposes</li>
              <li>Your rights to access, correct, and delete your data (GDPR)</li>
            </ul>
            <Link
              href="/privacy"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              style={{ fontSize: '16px' }}
            >
              Read Full Privacy Policy
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Compliance Information */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 mb-8">
            <h2 
              className="text-neutral-900 mb-4"
              style={{
                fontSize: '24px',
                lineHeight: '32px',
                letterSpacing: '-0.01em',
                fontWeight: '600',
              }}
            >
              Compliance & Regulations
            </h2>
            <div className="space-y-6">
              <div>
                <h3 
                  className="text-neutral-900 mb-3"
                  style={{
                    fontSize: '20px',
                    lineHeight: '28px',
                    fontWeight: '600',
                  }}
                >
                  HIPAA Compliance (United States)
                </h3>
                <p 
                  className="text-neutral-700 mb-3"
                  style={{
                    fontSize: '16px',
                    lineHeight: '26px',
                  }}
                >
                  We comply with the Health Insurance Portability and Accountability Act (HIPAA) and act as a Business Associate. We maintain:
                </p>
                <ul className="list-disc pl-6 text-neutral-700 space-y-2" style={{ fontSize: '16px', lineHeight: '26px' }}>
                  <li>Administrative, physical, and technical safeguards</li>
                  <li>Business Associate Agreements with covered entities</li>
                  <li>Regular security audits and risk assessments</li>
                  <li>Incident reporting procedures as required by law</li>
                </ul>
              </div>

              <div>
                <h3 
                  className="text-neutral-900 mb-3"
                  style={{
                    fontSize: '20px',
                    lineHeight: '28px',
                    fontWeight: '600',
                  }}
                >
                  GDPR Compliance (European Union)
                </h3>
                <p 
                  className="text-neutral-700 mb-3"
                  style={{
                    fontSize: '16px',
                    lineHeight: '26px',
                  }}
                >
                  For users in the European Economic Area (EEA), we comply with the General Data Protection Regulation (GDPR). You have the right to:
                </p>
                <ul className="list-disc pl-6 text-neutral-700 space-y-2" style={{ fontSize: '16px', lineHeight: '26px' }}>
                  <li>Access your personal data</li>
                  <li>Rectify inaccurate data</li>
                  <li>Request erasure of your data</li>
                  <li>Restrict processing of your data</li>
                  <li>Data portability</li>
                  <li>Object to processing</li>
                </ul>
              </div>

              <div>
                <h3 
                  className="text-neutral-900 mb-3"
                  style={{
                    fontSize: '20px',
                    lineHeight: '28px',
                    fontWeight: '600',
                  }}
                >
                  Global Compliance
                </h3>
                <p 
                  className="text-neutral-700"
                  style={{
                    fontSize: '16px',
                    lineHeight: '26px',
                  }}
                >
                  We strive to comply with applicable data protection laws in all jurisdictions where we operate, including but not limited to:
                </p>
                <ul className="list-disc pl-6 text-neutral-700 mt-3 space-y-2" style={{ fontSize: '16px', lineHeight: '26px' }}>
                  <li>HIPAA (United States)</li>
                  <li>GDPR (European Union)</li>
                  <li>PIPEDA (Canada)</li>
                  <li>PDPA (Singapore)</li>
                  <li>Other applicable regional data protection regulations</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-primary-50 rounded-xl border border-primary-200 p-8">
            <h2 
              className="text-neutral-900 mb-4"
              style={{
                fontSize: '24px',
                lineHeight: '32px',
                letterSpacing: '-0.01em',
                fontWeight: '600',
              }}
            >
              Questions or Concerns?
            </h2>
            <p 
              className="text-neutral-700 mb-6"
              style={{
                fontSize: '16px',
                lineHeight: '26px',
              }}
            >
              If you have questions about our legal policies, disclaimers, or compliance practices, please contact us:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <h3 className="text-neutral-900 font-semibold mb-2" style={{ fontSize: '16px' }}>Privacy & Data Protection</h3>
                <a
                  href="mailto:privacy@clinichub.com"
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                  style={{ fontSize: '14px' }}
                >
                  privacy@clinichub.com
                </a>
              </div>
              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <h3 className="text-neutral-900 font-semibold mb-2" style={{ fontSize: '16px' }}>Legal & Terms</h3>
                <a
                  href="mailto:legal@clinichub.com"
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                  style={{ fontSize: '14px' }}
                >
                  legal@clinichub.com
                </a>
              </div>
              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <h3 className="text-neutral-900 font-semibold mb-2" style={{ fontSize: '16px' }}>Data Protection Officer (GDPR)</h3>
                <a
                  href="mailto:dpo@clinichub.com"
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                  style={{ fontSize: '14px' }}
                >
                  dpo@clinichub.com
                </a>
              </div>
              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <h3 className="text-neutral-900 font-semibold mb-2" style={{ fontSize: '16px' }}>General Support</h3>
                <Link
                  href="/support/contact"
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                  style={{ fontSize: '14px' }}
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

