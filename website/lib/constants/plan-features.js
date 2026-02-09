/**
 * Plan feature bullets for pricing cards – match clinic CARD_FEATURES_BY_PLAN.
 */

export const CARD_FEATURES_BY_PLAN = {
  SOLO: [
    '1 doctor + 2 staff (3 team members)',
    'Unlimited patients & appointments',
    'First 14 days free with card, then $49/mo',
    'SOAP notes & vital signs tracking',
    'Digital prescriptions & print',
    '5GB document storage',
    'Simple invoicing & payment recording',
    'Email support (24-hour response)',
  ],
  CLINIC: [
    '5 doctors + 5 staff (10 team members)',
    'Unlimited patients & appointments',
    'Multi-doctor calendar & SMS reminders (200/mo)',
    'Custom SOAP templates & prescription library',
    '50GB storage, advanced invoicing & tax',
    'Reports & analytics, 2 locations',
    'Daily backups, priority support',
    'Phone & live chat support',
  ],
  ENTERPRISE: [
    'Unlimited doctors, staff & locations',
    'Unlimited SMS & storage',
    'Department management & lab integration',
    'Advanced billing, pharmacy & inventory',
    'Custom reports, API & integrations',
    'HIPAA tools, 2FA, IP whitelisting',
    '24/7 dedicated support, SLA',
    'White-label & custom workflows',
  ],
};

/** Yearly save (USD) when switching to yearly – 5% off */
export const YEARLY_SAVE = { SOLO: 29, CLINIC: 89, ENTERPRISE: 299 };
