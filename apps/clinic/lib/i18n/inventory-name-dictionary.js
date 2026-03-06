/**
 * Inventory item names: translate English → Arabic and Spanish (word-by-word).
 * Used for DB-fetched data in the inventory tab so clinic accounts see names in ar/es.
 * Keys are lowercase for lookup. Unknown words (numbers, codes) are kept as-is.
 */

const TO_ARABIC = {
  paracetamol: 'باراسيتامول',
  acetaminophen: 'أسيتامينوفين',
  ibuprofen: 'آيبوبروفين',
  amoxicillin: 'أموكسيسيلين',
  aspirin: 'أسبرين',
  metformin: 'ميتفورمين',
  omeprazole: 'أوميبرازول',
  losartan: 'لوسارتان',
  amlodipine: 'أملوديبين',
  insulin: 'الأنسولين',
  bandage: 'ضمادة',
  gauze: 'شاش',
  syringe: 'محقنة',
  syringes: 'محقنات',
  gloves: 'قفازات',
  mask: 'قناع',
  masks: 'أقنعة',
  thermometer: 'ميزان حرارة',
  cotton: 'قطن',
  alcohol: 'كحول',
  saline: 'محلول ملحي',
  medicine: 'دواء',
  medicines: 'أدوية',
  tablet: 'قرص',
  tablets: 'أقراص',
  capsule: 'كبسولة',
  capsules: 'كبسولات',
  injection: 'حقنة',
  injections: 'حقن',
  cream: 'كريم',
  drops: 'قطرات',
  solution: 'محلول',
  solutions: 'محاليل',
  suspension: 'معلق',
  ointment: 'مرهم',
  gel: 'جل',
  spray: 'بخاخ',
  supplement: 'مكمل',
  supplements: 'مكملات',
  vitamin: 'فيتامين',
  vitamins: 'فيتامينات',
  antibiotic: 'مضاد حيوي',
  antibiotics: 'مضادات حيوية',
  analgesic: 'مسكن',
  analgesics: 'مسكنات',
  antiseptic: 'مطهر',
  disinfectant: 'مطهر',
  surgical: 'جراحي',
  medical: 'طبي',
  equipment: 'معدات',
  consumable: 'مستهلك',
  consumables: 'مستهلكات',
  supply: 'مستلزمات',
  supplies: 'مستلزمات',
  other: 'أخرى',
  strip: 'شريط',
  strips: 'شرائط',
  bottle: 'زجاجة',
  bottles: 'زجاجات',
  box: 'علبة',
  pack: 'عبوة',
  unit: 'وحدة',
  units: 'وحدات',
  ml: 'مل',
  mg: 'ملغ',
  gm: 'غ',
  g: 'غ',
  kg: 'كغ',
  strength: 'تركيز',
  oral: 'فموي',
  topical: 'موضعي',
  sterile: 'معقم',
  disposable: 'للاستخدام الواحد',
  examination: 'فحص',
  // ICD-10 / diagnosis terms
  allergic: 'تحسسي',
  rhinitis: 'التهاب الأنف',
  unspecified: 'غير محدد',
  chronic: 'مزمن',
  acute: 'حاد',
  upper: 'علوي',
  respiratory: 'تنفسي',
  infection: 'عدوى',
  essential: 'أساسي',
  primary: 'أولي',
  hypertension: 'ارتفاع ضغط الدم',
  type: 'نوع',
  diabetes: 'السكري',
  mellitus: 'سكري',
  without: 'بدون',
  complications: 'مضاعفات',
  nasopharyngitis: 'التهاب البلعوم الأنفي',
  common: 'شائع',
  cold: 'برد',
  pharyngitis: 'التهاب البلعوم',
  tonsillitis: 'التهاب اللوزتين',
  fever: 'حمى',
  headache: 'صداع',
  cough: 'سعال',
  abdominal: 'بطني',
  pain: 'ألم',
  'gastro-esophageal': 'معدي مريئي',
  reflux: 'ارتجاع',
  disease: 'مرض',
  esophagitis: 'التهاب المريء',
  low: 'أسفل',
  back: 'الظهر',
  right: 'أيمن',
  shoulder: 'كتف',
  generalized: 'معمم',
  anxiety: 'قلق',
  disorder: 'اضطراب',
  major: 'اكتئابي',
  depressive: 'اكتئاب',
  single: 'حادثة',
  episode: 'نوبة',
  contact: 'تماس',
  dermatitis: 'التهاب الجلد',
  cause: 'سبب',
  gastritis: 'التهاب المعدة',
  bleeding: 'نزيف',
  urinary: 'بولية',
  tract: 'مسالك',
  site: 'موقع',
  specified: 'محدد',
  migraine: 'صداع نصفي',
  intractable: 'مستعصي',
  nausea: 'غثيان',
  vomiting: 'قيء',
  malaise: 'توعك',
  fatigue: 'إرهاق',
  dizziness: 'دوار',
  giddiness: 'دوار',
  hyperlipidemia: 'فرط شحوم الدم',
  obesity: 'سمنة',
  swelling: 'تورم',
  mass: 'كتلة',
  lump: 'ورم',
  encounter: 'زيارة',
  general: 'عام',
  adult: 'بالغ',
  abnormal: 'شاذ',
  findings: 'نتائج',
};

const TO_SPANISH = {
  paracetamol: 'Paracetamol',
  acetaminophen: 'Paracetamol',
  ibuprofen: 'Ibuprofeno',
  amoxicillin: 'Amoxicilina',
  aspirin: 'Aspirina',
  metformin: 'Metformina',
  omeprazole: 'Omeprazol',
  losartan: 'Losartán',
  amlodipine: 'Amlodipino',
  insulin: 'Insulina',
  bandage: 'Vendaje',
  bandages: 'Vendajes',
  gauze: 'Gasa',
  syringe: 'Jeringa',
  syringes: 'Jeringas',
  gloves: 'Guantes',
  mask: 'Mascarilla',
  masks: 'Mascarillas',
  thermometer: 'Termómetro',
  cotton: 'Algodón',
  alcohol: 'Alcohol',
  saline: 'Suero salino',
  medicine: 'Medicamento',
  medicines: 'Medicamentos',
  tablet: 'Tableta',
  tablets: 'Tabletas',
  capsule: 'Cápsula',
  capsules: 'Cápsulas',
  injection: 'Inyección',
  injections: 'Inyecciones',
  cream: 'Crema',
  drops: 'Gotas',
  solution: 'Solución',
  solutions: 'Soluciones',
  suspension: 'Suspensión',
  ointment: 'Pomada',
  gel: 'Gel',
  spray: 'Spray',
  supplement: 'Suplemento',
  supplements: 'Suplementos',
  vitamin: 'Vitamina',
  vitamins: 'Vitaminas',
  antibiotic: 'Antibiótico',
  antibiotics: 'Antibióticos',
  analgesic: 'Analgésico',
  analgesics: 'Analgésicos',
  antiseptic: 'Antiséptico',
  disinfectant: 'Desinfectante',
  surgical: 'Quirúrgico',
  medical: 'Médico',
  equipment: 'Equipo',
  consumable: 'Consumible',
  consumables: 'Consumibles',
  supply: 'Suministro',
  supplies: 'Suministros',
  other: 'Otro',
  strip: 'Tira',
  strips: 'Tiras',
  bottle: 'Frasco',
  bottles: 'Frasco',
  box: 'Caja',
  pack: 'Paquete',
  unit: 'Unidad',
  units: 'Unidades',
  ml: 'ml',
  mg: 'mg',
  gm: 'g',
  g: 'g',
  kg: 'kg',
  strength: 'Concentración',
  oral: 'Oral',
  topical: 'Tópico',
  sterile: 'Estéril',
  disposable: 'Desechable',
  examination: 'Exploración',
  // ICD-10 / diagnosis terms
  allergic: 'Alérgico',
  rhinitis: 'Rinitis',
  unspecified: 'No especificado',
  chronic: 'Crónico',
  acute: 'Agudo',
  upper: 'Superior',
  respiratory: 'Respiratorio',
  infection: 'Infección',
  essential: 'Esencial',
  primary: 'Primario',
  hypertension: 'Hipertensión',
  type: 'Tipo',
  diabetes: 'Diabetes',
  mellitus: 'Mellitus',
  without: 'Sin',
  complications: 'Complicaciones',
  nasopharyngitis: 'Nasofaringitis',
  common: 'Común',
  cold: 'Resfriado',
  pharyngitis: 'Faringitis',
  tonsillitis: 'Amigdalitis',
  fever: 'Fiebre',
  headache: 'Cefalea',
  cough: 'Tos',
  abdominal: 'Abdominal',
  pain: 'Dolor',
  'gastro-esophageal': 'Gastroesofágico',
  reflux: 'Reflujo',
  disease: 'Enfermedad',
  esophagitis: 'Esofagitis',
  low: 'Bajo',
  back: 'Espalda',
  right: 'Derecho',
  shoulder: 'Hombro',
  generalized: 'Generalizado',
  anxiety: 'Ansiedad',
  disorder: 'Trastorno',
  major: 'Mayor',
  depressive: 'Depresivo',
  single: 'Único',
  episode: 'Episodio',
  contact: 'Contacto',
  dermatitis: 'Dermatitis',
  cause: 'Causa',
  gastritis: 'Gastritis',
  bleeding: 'Hemorragia',
  urinary: 'Urinario',
  tract: 'Tracto',
  site: 'Sitio',
  specified: 'Especificado',
  migraine: 'Migraña',
  intractable: 'Intratable',
  nausea: 'Náuseas',
  vomiting: 'Vómito',
  malaise: 'Malestar',
  fatigue: 'Fatiga',
  dizziness: 'Mareo',
  giddiness: 'Vértigo',
  hyperlipidemia: 'Hiperlipidemia',
  obesity: 'Obesidad',
  swelling: 'Hinchazón',
  mass: 'Masa',
  lump: 'Bulto',
  encounter: 'Encuentro',
  general: 'General',
  adult: 'Adulto',
  abnormal: 'Anormal',
  findings: 'Hallazgos',
};

/**
 * Translate a single word/token to Arabic (lowercase key lookup).
 * @param {string} word - One word
 * @returns {string|null} Arabic translation or null
 */
function translateWordToArabic(word) {
  if (word == null || typeof word !== 'string') return null;
  const key = word.trim().toLowerCase();
  if (!key) return null;
  return TO_ARABIC[key] ?? null;
}

/**
 * Translate a single word/token to Spanish (lowercase key lookup).
 * @param {string} word - One word
 * @returns {string|null} Spanish translation or null
 */
function translateWordToSpanish(word) {
  if (word == null || typeof word !== 'string') return null;
  const key = word.trim().toLowerCase();
  if (!key) return null;
  return TO_SPANISH[key] ?? null;
}

/**
 * Translate full inventory name to Arabic word-by-word.
 * DB-fetched names like "Paracetamol 500mg Tablets" → "باراسيتامول 500mg أقراص".
 * Unknown words (e.g. numbers, codes) are kept as-is.
 * @param {string} name - Full item name from DB
 * @returns {string} Translated string for display (never null; falls back to name)
 */
export function getArabicDisplayName(name) {
  if (name == null || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  const words = trimmed.split(/\s+/);
  const out = words.map((w) => translateWordToArabic(w) ?? w);
  const result = out.join(' ').trim();
  return result || trimmed;
}

/**
 * Translate full inventory name to Spanish word-by-word.
 * @param {string} name - Full item name from DB
 * @returns {string} Translated string for display (never null; falls back to name)
 */
export function getSpanishDisplayName(name) {
  if (name == null || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  const words = trimmed.split(/\s+/);
  const out = words.map((w) => translateWordToSpanish(w) ?? w);
  const result = out.join(' ').trim();
  return result || trimmed;
}

/**
 * Translate diagnosis/ICD title for display (same approach as item names).
 * Normalizes punctuation so "Allergic rhinitis, unspecified" is word-split correctly.
 * @param {string} title - e.g. "Allergic rhinitis, unspecified"
 * @param {string} localeCode - 'en' | 'ar' | 'es'
 * @returns {string} Translated title for display
 */
export function getDiagnosisDisplayName(title, localeCode) {
  if (title == null || String(title).trim() === '') return '';
  const raw = String(title).trim();
  const normalized = raw.replace(/[,;[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return raw;
  const l = (localeCode || 'en').toString().slice(0, 2);
  if (l === 'ar') return getArabicDisplayName(normalized);
  if (l === 'es') return getSpanishDisplayName(normalized);
  return raw;
}

/**
 * Translate full diagnosis string for display (e.g. "J30.9 - Allergic rhinitis, unspecified").
 * Handles "CODE - Title" and multi-part strings separated by comma/semicolon.
 * @param {string} diagnosis - Full diagnosis string from prescription
 * @param {string} localeCode - 'en' | 'ar' | 'es'
 * @returns {string} Translated diagnosis for display
 */
export function getDiagnosisDisplayValue(diagnosis, localeCode) {
  if (diagnosis == null || String(diagnosis).trim() === '') return '';
  // Split only by semicolon so commas inside a title (e.g. "Allergic rhinitis, unspecified") stay in one segment
  const parts = String(diagnosis)
    .split(/\s*;\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  const l = (localeCode || 'en').toString().slice(0, 2);
  const translated = parts.map((part) => {
    // Match "CODE - Title" (allow space-hyphen-space or unicode dash)
    const dashMatch = part.match(/^(.+?)\s+[-–—]\s+(.+)$/);
    if (!dashMatch) return getDiagnosisDisplayName(part, l);
    const code = dashMatch[1].trim();
    const title = dashMatch[2].trim();
    return code ? `${code} - ${getDiagnosisDisplayName(title, l)}` : getDiagnosisDisplayName(title, l);
  });
  return translated.join('; ');
}

/**
 * Apply translations to an item when name_ar/name_es are missing.
 * Mutates the item with name_ar and name_es.
 */
export function applyInventoryNameTranslations(item) {
  if (!item || !item.name) return;
  const primary = item.name.trim();
  if (primary.length === 0) return;
  if (!item.name_ar || String(item.name_ar).trim() === '') {
    item.name_ar = getArabicDisplayName(primary);
  }
  if (!item.name_es || String(item.name_es).trim() === '') {
    item.name_es = getSpanishDisplayName(primary);
  }
}
