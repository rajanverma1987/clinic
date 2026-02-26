/**
 * Subscription spec per CursorMD/Subscriptions.md.
 * No free plan: all plans are paid with 14-day free trial, then billing starts.
 * Comparison table, add-ons, which plan, payment terms, offers, get started, FAQ.
 * ESM for use in client components.
 */

/** Plan structure: Core / Pro / Enterprise. Currency: USD only. */
export const PLAN_SLUGS = ['FREE', 'Core', 'Pro', 'Enterprise'];

/** Plans shown in comparison table; all have 14-day trial */
export const COMPARISON_TABLE_PLAN_SLUGS = ['Core', 'Pro', 'Enterprise'];

/** Plan names for admin and subscription page */
export const AVAILABLE_PLAN_NAMES_FOR_ASSIGNMENT = [
  'FREE',
  'Free Trial',
  'Core',
  'Pro',
  'Enterprise',
];

/** Display names (legacy → current) */
export const PLAN_DISPLAY_NAMES = {
  FREE: 'Free',
  SOLO: 'Core',
  CLINIC: 'Pro',
  ENTERPRISE: 'Enterprise',
  Starter: 'Core',
  Growth: 'Pro',
  'Smart Clinic': 'Pro',
  Core: 'Core',
  Pro: 'Pro',
  Enterprise: 'Enterprise',
};

/** Monthly prices in USD cents (DB stores cents). $24.99 / $59.99 / $129.99 */
export const FIX_PLAN_PRICES_USD_CENTS = {
  Core: 2499,
  Pro: 5999,
  Enterprise: 12999,
};

/** Annual 2 months free: yearly = 10 × monthly (USD cents). */
export const YEARLY_SAVE_USD_CENTS = {
  Core: 4998,
  Pro: 11998,
  Enterprise: 25998,
};

/** Yearly save amount in major units (dollars) for SubscriptionCard "Save $X per year". */
export const YEARLY_SAVE = {
  Core: 49.98,
  Pro: 119.98,
  Enterprise: 259.98,
};

/** Feature flags for add-ons (A1, A2): gate CDS/AI and advanced automation */
export const ADDON_FEATURE_FLAGS = {
  AI_ASSISTANCE: 'ai_assistance',
  ADVANCED_AUTOMATION: 'advanced_automation',
};

/** Quick Feature Comparison – Core | Pro | Enterprise (3 columns) */
export const COMPARISON_TABLE_ROWS = [
  ['subscriptionSpec.teamMembers', '3', '10', 'Unlimited'],
  ['subscriptionSpec.patientRecords', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['subscriptionSpec.documentStorage', '10GB', '50GB', 'Unlimited'],
  ['subscriptionSpec.soapNotes', '✓', '✓', '✓ Advanced'],
  ['subscriptionSpec.prescriptions', '✓', '✓ + Pharmacy', '✓ + Advanced'],
  ['subscriptionSpec.billing', 'Basic', 'Advanced', 'Enterprise'],
  ['subscriptionSpec.backups', 'Daily', 'Daily', 'Daily'],
  ['subscriptionSpec.support', 'Email', 'Phone + Chat', '24/7 Dedicated'],
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
  { plan: 'Core', outcomeKey: 'subscriptionSpec.outcomeCore' },
  { plan: 'Pro', outcomeKey: 'subscriptionSpec.outcomePro' },
  { plan: 'Enterprise', outcomeKey: 'subscriptionSpec.outcomeEnterprise' },
];

/** Which plan: planSlug, titleKey, bulletsKey, bestForKey */
export const WHICH_PLAN = [
  { planSlug: 'FREE', titleKey: 'subscriptionSpec.chooseFree', bulletsKey: 'subscriptionSpec.chooseFreeBullets', bestForKey: 'subscriptionSpec.bestForFree' },
  { planSlug: 'Core', titleKey: 'subscriptionSpec.chooseCore', bulletsKey: 'subscriptionSpec.chooseCoreBullets', bestForKey: 'subscriptionSpec.bestForCore' },
  { planSlug: 'Pro', titleKey: 'subscriptionSpec.choosePro', bulletsKey: 'subscriptionSpec.chooseProBullets', bestForKey: 'subscriptionSpec.bestForPro' },
  { planSlug: 'Enterprise', titleKey: 'subscriptionSpec.chooseEnterprise', bulletsKey: 'subscriptionSpec.chooseEnterpriseBullets', bestForKey: 'subscriptionSpec.bestForEnterprise' },
];

/** Yearly price (USD cents): 10 × monthly (2 months free). */
export function getYearlyPriceCents(monthlyCents) {
  return Math.round(monthlyCents * 10);
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
