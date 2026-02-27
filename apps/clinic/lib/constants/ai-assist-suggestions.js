/**
 * AI Assistance – rule-based suggestions for smart documentation,
 * auto-suggestions, and clinical decision support (CDS).
 * Used when tenant has the aiAssist add-on. No PHI in suggestions.
 */

/** SOAP section suggestions – common clinical phrasing for documentation */
export const SOAP_SUGGESTIONS = {
  subjective: [
    'Patient reports onset of symptoms 2–3 days ago.',
    'No known drug allergies (NKDA).',
    'Patient denies fever, chills, or recent travel.',
    'Pain described as dull/aching, 4/10 severity.',
    'Symptoms improve with rest and OTC analgesics.',
    'Patient reports compliance with current medications.',
    'No recent trauma or change in activity.',
    'Family history reviewed; no significant updates.',
  ],
  objective: [
    'Vital signs within normal limits (WNL).',
    'Alert and oriented x4. No acute distress.',
    'HEENT: Normocephalic, atraumatic. PERRLA.',
    'Cardiovascular: Regular rate and rhythm, no murmurs.',
    'Respiratory: Clear to auscultation bilaterally.',
    'Abdomen: Soft, non-tender, non-distended.',
    'Extremities: No edema. Full range of motion.',
    'Skin: No rashes or lesions noted.',
  ],
  assessment: [
    'Likely viral upper respiratory infection. No red flags.',
    'Diagnosis consistent with presentation. Plan as below.',
    'Consider differential: [add as clinically indicated].',
    'Stable. Continue current management.',
    'Improved from previous visit. Goals met.',
    'Patient educated on warning signs and when to return.',
  ],
  plan: [
    'Continue current medications. Follow up in 2 weeks or PRN.',
    'Labs/imaging as ordered. Review results at next visit.',
    'Lifestyle: rest, fluids, OTC as needed. Avoid triggers.',
    'Referral to specialist if no improvement in 1–2 weeks.',
    'Patient to return for recheck if symptoms worsen.',
    'Vaccination status reviewed; flu shot offered/declined.',
  ],
};

/** Common diagnosis suggestions (short labels for quick pick) */
export const DIAGNOSIS_SUGGESTIONS = [
  'Acute upper respiratory infection',
  'Hypertension',
  'Type 2 diabetes mellitus',
  'Generalized anxiety disorder',
  'Low back pain',
  'Migraine',
  'Allergic rhinitis',
  'GERD',
  'Anemia',
  'Asthma',
  'COPD',
  'Depression',
  'Osteoarthritis',
  'UTI',
  'Well visit / preventive',
];

/** Clinical decision support hints – short reminders (no PHI) */
export const CDS_HINTS = [
  'Consider recording vital signs if not yet documented.',
  'Check for drug–drug interactions if adding new medication.',
  'Review allergy list before prescribing.',
  'Consider age-appropriate dosing for pediatric patients.',
  'Document informed consent if procedure performed.',
  'Follow-up date: consider 1–2 weeks for acute issues.',
];

/**
 * Get suggestions for a given context.
 * @param {string} context - One of: soap_subjective, soap_objective, soap_assessment, soap_plan, diagnosis, cds
 * @param {string} [currentText] - Optional current text; can be used later for filtering/ranking
 * @returns {{ suggestions: string[], cdsHints?: string[] }}
 */
export function getSuggestions(context, currentText = '') {
  switch (context) {
    case 'soap_subjective':
      return { suggestions: [...SOAP_SUGGESTIONS.subjective] };
    case 'soap_objective':
      return { suggestions: [...SOAP_SUGGESTIONS.objective] };
    case 'soap_assessment':
      return { suggestions: [...SOAP_SUGGESTIONS.assessment] };
    case 'soap_plan':
      return { suggestions: [...SOAP_SUGGESTIONS.plan] };
    case 'diagnosis':
      return { suggestions: [...DIAGNOSIS_SUGGESTIONS] };
    case 'clinical_notes':
      return {
        suggestions: [
          ...SOAP_SUGGESTIONS.subjective.slice(0, 4),
          ...SOAP_SUGGESTIONS.objective.slice(0, 4),
        ],
        cdsHints: CDS_HINTS.slice(0, 2),
      };
    case 'cds':
      return { suggestions: [], cdsHints: [...CDS_HINTS] };
    default:
      return { suggestions: [], cdsHints: [] };
  }
}
