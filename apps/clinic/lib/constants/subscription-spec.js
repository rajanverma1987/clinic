/**
 * Subscription spec per CursorMD/Subscriptions.md.
 * No free plan: all plans are paid with 14-day free trial, then billing starts.
 * Comparison table, add-ons, which plan, payment terms, offers, get started, FAQ.
 * ESM for use in client components.
 */

export const PLAN_SLUGS = ['FREE', 'SOLO', 'CLINIC', 'ENTERPRISE'];

/** Plans shown in comparison table (SOLO, CLINIC, ENTERPRISE only; all have 14-day trial) */
export const COMPARISON_TABLE_PLAN_SLUGS = ['SOLO', 'CLINIC', 'ENTERPRISE'];

/** Plan names allowed in admin "Update Subscription" dropdown (canonical product plans only) */
export const AVAILABLE_PLAN_NAMES_FOR_ASSIGNMENT = [
  'FREE',
  'Free Trial',
  'SOLO',
  'CLINIC',
  'ENTERPRISE',
];

/** Quick Feature Comparison – 14 rows, SOLO | CLINIC | ENTERPRISE only (no FREE column) */
export const COMPARISON_TABLE_ROWS = [
  ['subscriptionSpec.doctorAccounts', '1', '5', 'Unlimited'],
  ['subscriptionSpec.staffAccounts', '2', '5', 'Unlimited'],
  ['subscriptionSpec.patientRecords', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['subscriptionSpec.appointmentsPerMonth', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['subscriptionSpec.soapNotes', '✓', '✓ Templates', '✓ Advanced'],
  ['subscriptionSpec.prescriptions', '✓', '✓ + Templates', '✓ + Advanced'],
  ['subscriptionSpec.smsReminders', '❌', '200/mo', 'Unlimited'],
  ['subscriptionSpec.documentStorage', '5GB', '50GB', 'Unlimited'],
  ['subscriptionSpec.billing', 'Basic', 'Advanced', 'Enterprise'],
  ['subscriptionSpec.inventory', '❌', 'Basic', 'Full Pharmacy'],
  ['subscriptionSpec.reports', 'Basic', 'Advanced', 'Custom'],
  ['subscriptionSpec.locations', '1', '2', 'Unlimited'],
  ['subscriptionSpec.backups', 'Daily', 'Daily', 'Hourly'],
  ['subscriptionSpec.support', 'Email 24h', 'Phone + Chat', '24/7 Dedicated'],
];

/** Add-ons per Subscriptions.md: key, labelKey, descriptionKey, price (exact doc wording), noteKey */
export const ADDONS = [
  {
    key: 'extraDoctor',
    labelKey: 'subscriptionSpec.extraDoctor',
    descriptionKey: 'subscriptionSpec.extraDoctorDesc',
    price: '$10/month',
    noteKey: 'subscriptionSpec.addonUnlimitedEnterprise',
  },
  {
    key: 'extraStaff',
    labelKey: 'subscriptionSpec.extraStaff',
    descriptionKey: 'subscriptionSpec.extraStaffDesc',
    price: '$5/month',
    noteKey: 'subscriptionSpec.addonUnlimitedEnterprise',
  },
  {
    key: 'extraSms',
    labelKey: 'subscriptionSpec.extraSms',
    descriptionKey: 'subscriptionSpec.extraSmsDesc',
    price: '100 SMS - $5, 500 SMS - $20, 1000 SMS - $35',
    noteKey: 'subscriptionSpec.addonUnlimitedEnterprise',
  },
  {
    key: 'additionalStorage',
    labelKey: 'subscriptionSpec.additionalStorage',
    descriptionKey: 'subscriptionSpec.additionalStorageDesc',
    price: '25GB - $10/month, 100GB - $30/month',
    noteKey: 'subscriptionSpec.addonUnlimitedEnterprise',
  },
  {
    key: 'whatsApp',
    labelKey: 'subscriptionSpec.whatsApp',
    descriptionKey: 'subscriptionSpec.whatsAppDesc',
    price: '$20/month (includes 500 messages)',
    noteKey: 'subscriptionSpec.addonBuiltInEnterprise',
  },
  {
    key: 'advancedReports',
    labelKey: 'subscriptionSpec.advancedReports',
    descriptionKey: 'subscriptionSpec.advancedReportsDesc',
    price: '$15/month (custom dashboards)',
    noteKey: 'subscriptionSpec.addonBuiltInEnterprise',
  },
];

/** Which plan: planSlug, titleKey, bulletsKey (array of keys), bestForKey */
export const WHICH_PLAN = [
  {
    planSlug: 'FREE',
    titleKey: 'subscriptionSpec.chooseFree',
    bulletsKey: 'subscriptionSpec.chooseFreeBullets',
    bestForKey: 'subscriptionSpec.bestForFree',
  },
  {
    planSlug: 'SOLO',
    titleKey: 'subscriptionSpec.chooseSolo',
    bulletsKey: 'subscriptionSpec.chooseSoloBullets',
    bestForKey: 'subscriptionSpec.bestForSolo',
  },
  {
    planSlug: 'CLINIC',
    titleKey: 'subscriptionSpec.chooseClinic',
    bulletsKey: 'subscriptionSpec.chooseClinicBullets',
    bestForKey: 'subscriptionSpec.bestForClinic',
  },
  {
    planSlug: 'ENTERPRISE',
    titleKey: 'subscriptionSpec.chooseEnterprise',
    bulletsKey: 'subscriptionSpec.chooseEnterpriseBullets',
    bestForKey: 'subscriptionSpec.bestForEnterprise',
  },
];

/** Annual 5% off: yearly save (USD) per plan = monthly * 12 * 0.05 */
export const YEARLY_SAVE = { SOLO: 29, CLINIC: 59, ENTERPRISE: 299 };

/** Yearly price cents = monthly * 12 * 0.95 (5% off) */
export function getYearlyPriceCents(monthlyCents) {
  return Math.round(monthlyCents * 12 * 0.95);
}

/** FAQ: questionKey, answerKey */
export const FAQ_ITEMS = [
  { questionKey: 'subscriptionSpec.faqUpgrade', answerKey: 'subscriptionSpec.faqUpgradeA' },
  { questionKey: 'subscriptionSpec.faqSecure', answerKey: 'subscriptionSpec.faqSecureA' },
  { questionKey: 'subscriptionSpec.faqExport', answerKey: 'subscriptionSpec.faqExportA' },
  { questionKey: 'subscriptionSpec.faqTraining', answerKey: 'subscriptionSpec.faqTrainingA' },
  { questionKey: 'subscriptionSpec.faqSmsLimit', answerKey: 'subscriptionSpec.faqSmsLimitA' },
  { questionKey: 'subscriptionSpec.faqSetupFee', answerKey: 'subscriptionSpec.faqSetupFeeA' },
];
