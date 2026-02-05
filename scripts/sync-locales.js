/**
 * Sync locale files for 100% key parity with en.json.
 * For any key missing in es.json or ar.json, copies the English value.
 * Preserves existing translations in es/ar (so Arabic/Spanish content is not overwritten).
 * For Arabic to show when user selects Arabic, ar.json must contain Arabic translations;
 * this script only fills missing keys with English.
 * Run: node scripts/sync-locales.js
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../lib/i18n/locales');
const EN_PATH = path.join(LOCALES_DIR, 'en.json');
const ES_PATH = path.join(LOCALES_DIR, 'es.json');
const FR_PATH = path.join(LOCALES_DIR, 'fr.json');
const AR_PATH = path.join(LOCALES_DIR, 'ar.json');

function deepMergeKeys(base, source) {
  if (base === null || typeof base !== 'object' || Array.isArray(base)) {
    return source !== undefined ? source : base;
  }
  const out = {};
  for (const key of Object.keys(base)) {
    const baseVal = base[key];
    const srcVal = source && typeof source === 'object' && key in source ? source[key] : undefined;
    if (typeof baseVal === 'object' && baseVal !== null && !Array.isArray(baseVal)) {
      out[key] = deepMergeKeys(baseVal, srcVal);
    } else {
      out[key] = srcVal !== undefined && typeof srcVal === 'string' ? srcVal : baseVal;
    }
  }
  return out;
}

function run() {
  const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
  const es = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));
  const fr = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));
  const ar = JSON.parse(fs.readFileSync(AR_PATH, 'utf8'));

  const esMerged = deepMergeKeys(en, es);
  const frMerged = deepMergeKeys(en, fr);
  const arMerged = deepMergeKeys(en, ar);

  fs.writeFileSync(ES_PATH, JSON.stringify(esMerged, null, 2) + '\n', 'utf8');
  fs.writeFileSync(FR_PATH, JSON.stringify(frMerged, null, 2) + '\n', 'utf8');
  fs.writeFileSync(AR_PATH, JSON.stringify(arMerged, null, 2) + '\n', 'utf8');

  console.log('Locale sync complete: es.json, fr.json and ar.json now have 100% key parity with en.json.');
}

run();
