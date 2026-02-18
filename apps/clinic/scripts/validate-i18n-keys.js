/**
 * Validates that all t('key') keys used in the clinic app UI exist in en.json.
 * Run: node apps/clinic/scripts/validate-i18n-keys.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCALES = path.join(ROOT, 'lib/i18n/locales/en.json');

function getNestedKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...getNestedKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

function extractTKeysFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const keys = new Set();
  const regex = /t\s*\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const k = m[1];
    if (k.includes('.') && k.length >= 4 && !/^[a-z]+$/.test(k)) {
      keys.add(k);
    }
  }
  return keys;
}

function getAllTKeys(dir, keys = new Set()) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', '.next', 'scripts', 'api', 'hooks'].includes(e.name)) {
        getAllTKeys(full, keys);
      }
    } else if (e.isFile() && /\.(jsx?|tsx?)$/.test(e.name)) {
      for (const k of extractTKeysFromFile(full)) keys.add(k);
    }
  }
  return keys;
}

const en = JSON.parse(fs.readFileSync(LOCALES, 'utf-8'));
const validKeys = new Set(getNestedKeys(en));
const usedKeys = getAllTKeys(ROOT);

const missing = [...usedKeys].filter((k) => !validKeys.has(k)).sort();

if (missing.length > 0) {
  console.error('Missing i18n keys in en.json:\n');
  missing.forEach((k) => console.error('  -', k));
  process.exit(1);
}

console.log(`OK: All ${usedKeys.size} used i18n keys exist in en.json`);
process.exit(0);
