# Clinic-Only Scope: Doctors & Clinics Only

**Status:** Active  
**Product:** Clinic management web tool for **doctors and clinic staff only**. Not for the public or for patients to use directly.

---

## 1. Product Scope

- **In scope:** Clinic staff (clinic_admin, receptionist, nurse, etc.), doctors, and super admin. Login, dashboard, patients, appointments, prescriptions, billing, inventory, telemedicine (doctor/clinic starts the call and sends join link to patient).
- **Out of scope:** Public “find & book” website, patient login, patient dashboard, patient self-booking. Patients are **managed by the clinic**; when they need a video call, the **clinic/doctor sends a join link** (SMS/email) and the patient opens it in a browser (no login).

---

## 2. Current Implementation

### 2.1 Routing & Access

| What | How |
|------|-----|
| **Patient portal** | All `/patient-portal` and `/patient-portal/*` are redirected to `/login?reason=clinic_only` via `middleware.js`. |
| **Patient portal layout** | `app/patient-portal/layout.jsx` redirects to `/login?reason=clinic_only` as a fallback and shows a short “clinic only” message. |
| **Login** | When `?reason=clinic_only` is present, the login page shows: “This app is for clinic staff and doctors only. Patients receive video call links from their clinic when needed.” |

### 2.2 Copy & Messaging

- **Homepage (i18n):** Hero and CTA stress “Clinic Management – For Doctors & Clinic Staff Only” and “Start a video call when a patient needs it; they join via a link you send.” (See `lib/i18n/locales/en.json` under `homepage`.)
- **Doctor registration:** “Back” link goes to `/` (home), not patient portal.
- **“For Doctors” entry points:** Header shows Login | For Doctors | Get Started when not logged in; “For Doctors” links to `/doctors/register`. Hero section has an “I'm a Doctor” button linking to `/doctors/register`. i18n keys: `navigation.forDoctors`, `homepage.forDoctors` (en/fr/es).
- **Clinic-only login notice:** `auth.clinicOnlyNotice` in en/fr/es; shown on login when `?reason=clinic_only`.

### 2.3 Flows

- **Forgot password:** Email-only reset using `/auth/forgot-password` and `/auth/reset-password`. No Phone/OTP (patient-portal) option; UI and handlers use email only.
- **Telemedicine “Book follow-up”:** From the post-call summary, the button goes to `/appointments/new` (clinic-side booking), not patient-portal booking.
- **Video consultation:** Doctor/clinic starts the session from the app and sends the join link to the patient; the patient opens the link in a browser (no login).

### 2.4 Referenced Docs

- **CursorMD/Doctor_Dashboard.md** – Product spec updated with clinic-only scope, “Part 1: Patient Portal – Out of scope (disabled),” and “Current implementation (clinic-only rollout).”

---

## 3. Files Touched for Clinic-Only

| File | Change |
|------|--------|
| `middleware.js` | Redirect `/patient-portal` and `/patient-portal/*` to `/login?reason=clinic_only`. |
| `app/patient-portal/layout.jsx` | Redirect + short “clinic only” message. |
| `app/login/page.jsx` | Notice when `reason=clinic_only`; useSearchParams for `reason`. |
| `app/page.jsx` | No change (already redirects authenticated users to dashboard). |
| `lib/i18n/locales/en.json` | `homepage.heroTitle/heroSubtitle/heroDescription`, `featuresTitle/featuresDescription`, `ctaTitle/ctaDescription` set to clinic/doctor-only messaging. |
| `app/doctors/register/page.jsx` | “Back” link from `/patient-portal` to `/`. |
| `app/telemedicine/[id]/summary/page.jsx` | “Book follow-up” from patient-portal booking URLs to `/appointments/new`. |
| `app/forgot-password/page.jsx` | Email-only reset; endpoints always `/auth/forgot-password` and `/auth/reset-password`; Phone/OTP UI removed; payloads always use `email`. |
| `CursorMD/Doctor_Dashboard.md` | Clinic-only scope, architecture, “Part 1 out of scope,” video-call note, success-metrics note. |
| `lib/i18n/locales/fr.json`, `es.json` | `auth.clinicOnlyNotice`; `homepage.forDoctors`, `navigation.forDoctors`. |
| `lib/i18n/locales/en.json` | `homepage.forDoctors`, `navigation.forDoctors`. |
| `components/marketing/Header.jsx` | “For Doctors” link to `/doctors/register` (desktop and mobile when not logged in). |
| `components/marketing/HeroSection.jsx` | “I'm a Doctor” button to `/doctors/register` next to Start Free Trial and Schedule Demo. |

---

## 4. Patient-Portal Code Left in Place

- **Frontend:** `app/patient-portal/*` – All routes are redirected by middleware; content is unused but kept for possible future use.
- **API:** `app/api/patient-portal/*` – Not called from the clinic-only app; can be removed later or retained for reference.

---

## 5. Video Call Flow (Clinic-Only)

1. Doctor/clinic starts a session from the app (e.g. `/telemedicine` or from an appointment).
2. System generates a join link (e.g. `/telemedicine/[id]` or a public session URL).
3. Doctor/clinic sends that link to the patient (SMS, email, etc.).
4. Patient opens the link in a browser and joins the call **without logging in**.
5. No patient portal or patient account is required.
