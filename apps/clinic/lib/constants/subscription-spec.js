/**
 * Subscription spec – 3-tier USD pricing (Basic / Smart Clinic / Enterprise).
 * Basic: 6-month free trial. Smart Clinic & Enterprise: 3-month free trial. No card required.
 * Payment method: PayPal only. Currency: USD only.
 * ESM for use in client components.
 */

/** Plan slugs – matches DB plan names exactly. */
export const PLAN_SLUGS = ['Starter', 'Basic', 'Smart Clinic', 'Enterprise'];

/** Plans shown in comparison table. Basic: 6-month free trial; Smart Clinic & Enterprise: 3-month free trial. */
export const COMPARISON_TABLE_PLAN_SLUGS = ['Basic', 'Smart Clinic', 'Enterprise'];

/** Free trial duration in days per plan. Used by both backend and frontend. */
export const PLAN_TRIAL_DAYS = {
  Basic: 180,          // 6 months
  'Smart Clinic': 90,  // 3 months
  Enterprise: 90,      // 3 months
  Starter: 0,          // always-free tier, no countdown
  'Free Trial': 0,     // legacy name for Starter
  FREE: 0,             // legacy DB value → treated as Starter
  SOLO: 180,           // legacy Basic
  Core: 180,           // legacy Basic
  CLINIC: 90,          // legacy Smart Clinic
  ENTERPRISE: 90,      // legacy Enterprise
  Pro: 90,             // legacy Smart Clinic
  Growth: 90,          // legacy Smart Clinic
};

/** Plan names for admin and subscription page */
export const AVAILABLE_PLAN_NAMES_FOR_ASSIGNMENT = [
  'Starter',
  'Basic',
  'Smart Clinic',
  'Enterprise',
];

/** Display names (legacy → current) */
export const PLAN_DISPLAY_NAMES = {
  FREE: 'Starter',      // legacy DB value → Starter
  Starter: 'Starter',
  'Free Trial': 'Starter',
  Basic: 'Basic',
  'Smart Clinic': 'Smart Clinic',
  Enterprise: 'Enterprise',
  // Legacy mappings
  Core: 'Basic',
  Pro: 'Smart Clinic',
  Growth: 'Smart Clinic',
  SOLO: 'Basic',
  CLINIC: 'Smart Clinic',
  ENTERPRISE: 'Enterprise',
};

/** Monthly prices in USD cents. */
export const FIX_PLAN_PRICES_USD_CENTS = {
  Basic: 2499,           // $24.99
  'Smart Clinic': 19900, // $199
  Enterprise: 49900,     // $499
};

/** Annual 20% off: save = monthly × 12 × 0.20 (USD major units). */
export const YEARLY_SAVE_USD = {
  Basic: 59.98,         // $24.99 × 12 × 20%
  'Smart Clinic': 477.6, // $199 × 12 × 20%
  Enterprise: 1197.6,   // $499 × 12 × 20%
};

/** Yearly save amount in USD (major units) for SubscriptionCard "Save $X per year". */
export const YEARLY_SAVE = {
  Basic: 59.98,
  'Smart Clinic': 477.6,
  Enterprise: 1197.6,
};

/** Feature flags for add-ons (A1, A2): gate CDS/AI and advanced automation */
export const ADDON_FEATURE_FLAGS = {
  AI_ASSISTANCE: 'ai_assistance',
  ADVANCED_AUTOMATION: 'advanced_automation',
};

/** Quick Feature Comparison – Basic | Smart Clinic | Enterprise (3 columns) */
export const COMPARISON_TABLE_ROWS = [
  // Team & Accounts
  ['subscriptionSpec.doctorAccounts',    '1',           '5',                     'Unlimited'],
  ['subscriptionSpec.staffAccounts',     '2',           '10',                    'Unlimited'],
  ['subscriptionSpec.teamMembers',       '3 total',     '15 total',              'Unlimited'],
  // Patients & Records
  ['subscriptionSpec.patientRecords',    'Unlimited',   'Unlimited',             'Unlimited'],
  ['subscriptionSpec.appointmentsPerMonth', 'Unlimited', 'Unlimited',            'Unlimited'],
  // Clinical
  ['subscriptionSpec.soapNotes',         '10 templates', 'Unlimited templates',  'Unlimited templates'],
  ['subscriptionSpec.prescriptions',     '✓',           '✓ + Drug alerts',       '✓ + Advanced'],
  ['subscriptionSpec.labTests',          '—',           '✓',                     '✓ + In-house lab'],
  // Billing & Inventory
  ['subscriptionSpec.billing',           'Basic',       'Advanced + Tax',        'Enterprise + Claims'],
  ['subscriptionSpec.inventory',         'Basic',       'Medicine tracking',     'Full pharmacy'],
  // Communication
  ['subscriptionSpec.smsReminders',      '—',           '200 / month',           'Unlimited'],
  // Storage & Locations
  ['subscriptionSpec.documentStorage',   '5 GB',        '100 GB',                'Unlimited'],
  ['subscriptionSpec.locations',         '1',           'Up to 2',               'Unlimited'],
  // Reports
  ['subscriptionSpec.reports',           'Basic',       'Advanced + Export',     'Custom builder'],
  // Access & Security
  ['subscriptionSpec.apiAccess',         '—',           '—',                     '✓'],
  // Backup & Support
  ['subscriptionSpec.backups',           'Daily',       'Daily',                 'Hourly'],
  ['subscriptionSpec.support',           'Email 24 hr', 'Priority + Phone',      '24/7 Dedicated'],
];

/** Add-ons (optional): key, labelKey, descriptionKey, price display, noteKey */
export const ADDONS = [
  {
    key: 'aiAssist',
    labelKey: 'subscriptionSpec.aiAssist',
    descriptionKey: 'subscriptionSpec.aiAssistDesc',
    price: '',
    noteKey: null,
  },
  {
    key: 'advancedAnalytics',
    labelKey: 'subscriptionSpec.advancedAnalytics',
    descriptionKey: 'subscriptionSpec.advancedAnalyticsDesc',
    price: '',
    noteKey: null,
  },
  {
    key: 'automationPro',
    labelKey: 'subscriptionSpec.automationPro',
    descriptionKey: 'subscriptionSpec.automationProDesc',
    price: '',
    noteKey: null,
  },
  {
    key: 'apiIntegration',
    labelKey: 'subscriptionSpec.apiIntegration',
    descriptionKey: 'subscriptionSpec.apiIntegrationDesc',
    price: '',
    noteKey: null,
  },
];

/** Bullets for "All plans include" (i18n keys). */
export const ALL_PLANS_INCLUDED_KEYS = [
  'subscriptionSpec.includedInAllPlans1',
  'subscriptionSpec.includedInAllPlans2',
  'subscriptionSpec.includedInAllPlans3',
  'subscriptionSpec.includedInAllPlans4',
  'subscriptionSpec.includedInAllPlans5',
  'subscriptionSpec.includedInAllPlans6',
];

/** Positioning: plan → operational outcome (i18n key). */
export const OUTCOME_POSITIONING = [
  { plan: 'Basic', outcomeKey: 'subscriptionSpec.outcomeBasic' },
  { plan: 'Smart Clinic', outcomeKey: 'subscriptionSpec.outcomeSmartClinic' },
  { plan: 'Enterprise', outcomeKey: 'subscriptionSpec.outcomeEnterprise' },
];

/** Which plan: planSlug, titleKey, bulletsKey, bestForKey */
export const WHICH_PLAN = [
  { planSlug: 'Basic',       titleKey: 'subscriptionSpec.chooseBasic',       bulletsKey: 'subscriptionSpec.chooseBasicBullets',       bestForKey: 'subscriptionSpec.bestForBasic' },
  { planSlug: 'Smart Clinic',titleKey: 'subscriptionSpec.chooseSmartClinic', bulletsKey: 'subscriptionSpec.chooseSmartClinicBullets', bestForKey: 'subscriptionSpec.bestForSmartClinic' },
  { planSlug: 'Enterprise',  titleKey: 'subscriptionSpec.chooseEnterprise',  bulletsKey: 'subscriptionSpec.chooseEnterpriseBullets',  bestForKey: 'subscriptionSpec.bestForEnterprise' },
];

/** Yearly price (USD cents): monthly × 12 × 0.80 (20% off). */
export function getYearlyPriceCents(monthlyCents) {
  return Math.round(monthlyCents * 12 * 0.8);
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
