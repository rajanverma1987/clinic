# 100% Language (i18n) Implementation

## Overview

The clinic app implements full internationalization so all user-facing strings are translatable. English (en), Spanish (es), and French (fr) have **100% key parity** with the source `en.json` locale.

## Implementation Summary

### 1. Locale files

- **`lib/i18n/locales/en.json`** – Source of truth; all keys used in the app.
- **`lib/i18n/locales/es.json`** – Same keys as en; Spanish where provided, English fallback otherwise.
- **`lib/i18n/locales/fr.json`** – Same keys as en; French where provided, English fallback otherwise.

### 2. Key parity

- **`scripts/sync-locales.js`** keeps `es.json` and `fr.json` in sync with `en.json`.
- Run after adding or changing keys in `en.json`:
  ```bash
  node scripts/sync-locales.js
  ```
- For any key missing in `es`/`fr`, the script copies the value from `en`, so the app never shows a raw key.

### 3. New / updated keys (settings)

Added under `settings` (and wired in settings UI):

- `saveChanges` – “Save Changes” (header bar)
- `saveHours` – “Save Hours”
- `addHoliday` – “Add Holiday”
- `addUser` – “Add User”
- `editProfile`, `managerAccounts`, `managerAccountsDesc`, `createManagerButton`, `managerAccountsNotice`
- `accountStatus`, `toggleStatus`, `addNewUser`, `addNewHoliday`, `staffMembers`, `holidaysClosures`
- `noHolidaysConfigured`, `accessRestricted`, `onlyClinicAdminManage`, `onlyClinicAdminDoctors`, `onlyClinicAdminCompliance`
- `basicInformation`, `availabilitySettings`, `security`, `changePasswordLabel`, `changePasswordHint`

`common.cancel` is used for Cancel buttons (already present in `common`).

### 4. Components using i18n

These components use `useI18n()` and `t()` for all visible copy:

- **Settings**: `app/settings/page.jsx` – tab actions, Manager card, layout title/subtitle.
- **Settings tabs**: `ProfileTab`, `SettingsTabs`, `GeneralSettingsTab`, `ComplianceTab`, `DoctorsTab`, `HolidayManagementTab` – labels, headings, access-restricted messages, buttons.
- Other screens (login, dashboard, patients, appointments, etc.) already use `t()` where wired in the codebase.

### 5. Usage in code

- Use the I18n context:
  ```js
  import { useI18n } from '@/contexts/I18nContext';
  const { t } = useI18n();
  ```
- Translate strings:
  ```js
  t('settings.saveChanges')           // "Save Changes" / "Guardar cambios" / "Enregistrer les modifications"
  t('common.cancel')                  // "Cancel" / "Cancelar" / "Annuler"
  t('settings.addHoliday')            // "Add Holiday" / "Agregar festivo" / "Ajouter un jour férié"
  ```
- For placeholders, use `{{param}}` in the locale string and pass a second argument:
  ```js
  t('auth.stepOf', { step: 1, total: 3 })
  ```

### 6. Adding a new translatable string

1. Add the key and English value in `lib/i18n/locales/en.json` (under the right section, e.g. `settings`, `common`, `auth`).
2. Run `node scripts/sync-locales.js` so `es` and `fr` get the key (with en value as fallback).
3. Optionally add Spanish and French in `es.json` and `fr.json` for that key.
4. In the component, use `t('section.key')` (and remove any hardcoded string).

### 7. Language switching

- **LanguageSwitcher** (and tenant/locale logic) is described in `GLOBAL_LANGUAGE_SUPPORT.md`.
- Locale is stored in tenant settings and/or `localStorage` and applied via `I18nProvider` and `getTranslation(key, locale)` in `lib/i18n/index.js`.

### 8. Translated sections (en / es / fr)

All of these namespaces have full key coverage in en, es, and fr (with es/fr using en fallback where a translation is missing):

- `admin`, `common`, `auth`, `dashboard`, `patients`, `appointments`, `invoices`, `prescriptions`, `queue`, `inventory`, `reports`, `settings`, `homepage`, `navigation`, `blog`, `subscription`, `pricing`, `footer`, `telemedicine`, `errors`

## Files touched for 100% i18n

- `lib/i18n/locales/en.json` – New keys under `settings` (and `onlyClinicAdminCompliance`).
- `lib/i18n/locales/es.json` – Synced from en; Spanish for settings actions and profile/manager/access strings.
- `lib/i18n/locales/fr.json` – Synced from en; French for the same strings.
- `scripts/sync-locales.js` – New script for key parity.
- `app/settings/page.jsx` – Manager card and tab actions use `t()`.
- `components/settings/ProfileTab.jsx` – Account status, toggle, edit profile, logout, personal info, security, change password, availability.
- `components/settings/GeneralSettingsTab.jsx` – Access restricted, onlyClinicAdminManage, basicInformation.
- `components/settings/ComplianceTab.jsx` – `useI18n`, access restricted, onlyClinicAdminCompliance.
- `components/settings/DoctorsTab.jsx` – `useI18n`, access restricted, onlyClinicAdminDoctors, addNewUser, staffMembers.
- `components/settings/HolidayManagementTab.jsx` – addNewHoliday, holidaysClosures, noHolidaysConfigured, add/cancel when not in header (already using `t()` where applicable).

## Running the sync script

From the project root:

```bash
node scripts/sync-locales.js
```

Output: `Locale sync complete: es.json and fr.json now have 100% key parity with en.json.`
