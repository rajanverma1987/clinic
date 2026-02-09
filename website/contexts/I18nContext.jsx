'use client';

import { createContext, useContext, useMemo } from 'react';

const EN = {
  'footer.product': 'Product',
  'footer.features': 'Features',
  'footer.getStarted': 'Get Started',
  'footer.legal': 'Legal',
  'footer.support': 'Support',
  'navigation.pricing': 'Pricing',
  'navigation.features': 'Features',
  'navigation.blog': 'Blog',
  'navigation.support': 'Support',
  'navigation.contact': 'Contact',
  'navigation.about': 'About',
  'auth.login': 'Login',
  'auth.register': 'Register',
  'homepage.hipaaGdprCompliant': 'HIPAA & GDPR Compliant',
  'homepage.heroTitle': 'Clinic management for healthcare professionals',
  'homepage.heroSubtitle': 'One platform. Secure. Compliant.',
  'homepage.heroDescription':
    'Appointments, patients, prescriptions, billing, and more — in one secure, HIPAA-aware platform.',
  'homepage.startFreeTrial': 'Try for free',
  'homepage.tryForFree': 'Try for free',
  'homepage.forDoctors': 'Request Demo',
  'homepage.scheduleDemo': 'Request Demo',
  'homepage.noCreditCardRequired': 'No credit card required',
  'homepage.freeTrial': '14-day free trial',
  'homepage.cancelAnytime': 'Cancel anytime',
  'homepage.patientManagement': 'Patient Management',
  'homepage.patientManagementDesc': 'Digital profiles, history, documents',
  'homepage.appointmentScheduling': 'Appointment Scheduling',
  'homepage.appointmentSchedulingDesc': 'Calendar, reminders, conflict detection',
  'homepage.billingInvoicing': 'Billing & Invoicing',
  'homepage.billingInvoicingDesc': 'Invoices, payments, insurance',
  'homepage.reportsAnalytics': 'Reports & Analytics',
  'homepage.reportsAnalyticsDesc': 'Revenue, patients, exports',
  'homepage.prescriptions': 'Prescriptions',
  'homepage.prescriptionsDesc': 'E-prescriptions, pharmacy',
  'homepage.inventory': 'Inventory',
  'homepage.inventoryDesc': 'Stock, alerts, batches',
  'homepage.queueManagement': 'Queue Management',
  'homepage.queueManagementDesc': 'Real-time queue, wait times',
  'homepage.multiLanguage': 'Multi-Language',
  'homepage.multiLanguageDesc': 'i18n, region-specific',
  'homepage.telemedicine': 'Telemedicine',
  'homepage.telemedicineDesc': 'Video calls, secure',
  'homepage.automatedReminders': 'Automated Reminders',
  'homepage.automatedRemindersDesc': 'SMS, email, and in-app reminders for appointments',
  'homepage.multiLocationSupport': 'Multi-Location Support',
  'homepage.multiLocationSupportDesc': 'Manage multiple clinics from one dashboard',
  'homepage.clinicalNotes': 'Clinical Notes',
  'homepage.clinicalNotesDesc': 'Structured notes, templates, and history',
  'homepage.inventoryManagement': 'Inventory Management',
  'homepage.inventoryManagementDesc': 'Stock, alerts, batches, and expiry tracking',
  'homepage.multiLanguageSupport': 'Multi-Language Support',
  'homepage.multiLanguageSupportDesc': 'i18n, region-specific templates',
  'homepage.mobileReadyPlatform': 'Mobile-Ready Platform',
  'homepage.mobileReadyPlatformDesc': 'Responsive and fast on any device',
  'homepage.featuresTitle': 'Everything you need to run your clinic',
  'homepage.featuresDescription':
    'From scheduling to billing, prescriptions to inventory — one secure platform.',
  'homepage.viewMore': 'View more features',
  'homepage.viewLess': 'View less',
  'homepage.testimonialsTitle': 'Trusted by healthcare professionals',
  'homepage.testimonialsDescription':
    'See what doctors and clinic managers say about our platform.',
  'homepage.testimonial1':
    'We cut no-shows by 40% with automated reminders. The appointment and billing flow is exactly what we needed.',
  'homepage.testimonial2':
    'Prescriptions and patient history in one place. Our cardiology practice runs smoother than ever.',
  'homepage.testimonial3':
    'Perfect for a small pediatric clinic. Easy to use, and parents love the reminder and follow-up options.',
  'homepage.testimonial4':
    'We manage five locations from one dashboard. Reporting and multi-location support are solid.',
  'homepage.testimonial5':
    'Clean UI, fast, and compliant. Our internal medicine group switched from spreadsheets to this in weeks.',
  'homepage.testimonial6':
    'Inventory and batch tracking saved us from costly errors. Integration with prescriptions is seamless.',
  'common.loading': 'Loading',
  'pricing.title': 'Simple, Transparent Pricing',
  'pricing.description': 'Choose the plan that fits your clinic.',
  'pricing.monthly': 'Monthly',
  'pricing.yearly': 'Yearly',
  'pricing.save20': 'Save',
  'pricing.getStarted': 'Get Started',
  'pricing.subscribeNow': 'Subscribe Now',
  'pricing.perMonth': 'month',
  'pricing.perYear': 'year',
  'pricing.free': 'Free',
  'pricing.contactSales': 'Contact Sales',
  'pricing.loadingPricingPlans': 'Loading plans...',
  'pricing.noPlansAvailable': 'No plans available',
  'subscriptionSpec.mostPopular': 'Most Popular',
  'subscriptionSpec.saveAmount': 'Save ${{amount}}',
  'subscriptionSpec.perYear': 'per year',
  'subscriptionSpec.trialDaysFree': '{{days}}-day free trial',
  'subscriptionSpec.trialThenBilling': 'Then {{planName}} at {{amount}}/month. Cancel anytime.',
  'support.title': 'Support',
  'support.contact': 'Contact',
  'support.center': 'Support Center',
  'support.tagline': 'Find answers to common questions or get in touch with our support team',
  'support.support24_7': '24/7 Support Available',
  'support.contactSupport': 'Contact Support',
  'support.contactSupportDesc': 'Get help from our support team via email or contact form',
  'support.getInTouch': 'Get in touch',
  'support.faq': 'FAQ',
  'support.faqDesc': 'Browse frequently asked questions and find quick answers',
  'support.viewFaqs': 'View FAQs',
  'support.documentation': 'Documentation',
  'support.docsDesc': 'Access user guides and API documentation',
  'support.viewDocs': 'View docs',
  'support.faqHeading': 'Frequently Asked Questions',
  'support.faqSubheading': "Everything you need to know about Doctor's Clinic",
  'support.stillNeedHelp': 'Still Need Help?',
  'support.stillNeedHelpDesc':
    "Our support team is here to help you get the most out of Doctor's Clinic",
  'support.contactSupportButton': 'Contact Support',
  'about.title': 'About',
  'about.description':
    'We build software to help clinics and healthcare professionals manage appointments, patients, prescriptions, and billing — securely and in one place.',
  'contact.title': 'Contact',
  'contact.emailIntro': 'For sales or support, email us at',
  'contact.loginHint':
    'To sign in or manage your clinic, use the Login button in the header (you will be redirected to the clinic dashboard).',
  'footer.legalInfo': 'Legal Info',
  'footer.contactUs': 'Contact Us',
  'footer.termsOfService': 'Terms of Service',
  'footer.privacyPolicy': 'Privacy Policy',
  'footer.description': 'Clinic management for healthcare professionals.',
  'footer.allRightsReserved': 'All rights reserved.',
};

const I18nContext = createContext({ t: (key) => EN[key] || key });

export function I18nProvider({ children }) {
  const value = useMemo(
    () => ({
      t: (key) => EN[key] || key,
      locale: 'en',
    }),
    [],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  return ctx || { t: (key) => EN[key] || key };
}
