# Implementation Plan — Clinic Management System

## 206 Pending Items → Full Completion Roadmap

---

## HOW TO READ THIS DOCUMENT

- Each phase is self-contained and deployable
- Items are ordered: **security first → clinical core → billing → UX → integrations**
- Every item lists the exact files to create or modify
- `[NEW]` = create new file, `[MOD]` = modify existing file

---

## PHASE 1 — SECURITY & AUTH HARDENING

> Critical gaps that affect production safety. Do these first.

---

### 1.1 Input Validation on All Forms (8.2)

**Files to modify:**

- `[MOD]` `apps/clinic/lib/utils/validation.js` — add Zod/Yup schemas per resource
- `[MOD]` `apps/clinic/app/api/appointments/route.js` — validate body on POST
- `[MOD]` `apps/clinic/app/api/patients/route.js` — validate name, dob, phone
- `[MOD]` `apps/clinic/app/api/invoices/route.js` — validate amounts, patient ID
- `[MOD]` `apps/clinic/app/api/prescriptions/route.js` — validate medicines array
- All other `route.js` POST/PUT handlers

**Technical approach:**

```js
// lib/utils/validation.js
import { z } from 'zod';
export const patientSchema = z.object({
  name: z.string().min(2).max(100),
  dateOfBirth: z.string().datetime(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/),
  gender: z.enum(['male', 'female', 'other']),
});
// In route.js:
const parsed = patientSchema.safeParse(body);
if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
```

**Dependencies:** `npm install zod`

---

### 1.2 XSS Prevention (8.3)

**Files to modify:**

- `[MOD]` `apps/clinic/middleware/error-handler.js` — add sanitize middleware
- `[NEW]` `apps/clinic/lib/utils/sanitize.js` — DOMPurify server-side wrapper
- All rich text fields (clinical notes, prescription notes, blog content)

**Technical approach:**

```js
// lib/utils/sanitize.js
import DOMPurify from 'isomorphic-dompurify';
export const sanitizeHtml = (dirty) =>
  DOMPurify.sanitize(dirty, { ALLOWED_TAGS: ['b', 'i', 'ul', 'li', 'p'] });
export const sanitizeText = (str) => str?.replace(/<[^>]*>/g, '').trim();
```

**Dependencies:** `npm install isomorphic-dompurify`

---

### 1.3 CSRF Tokens (8.4)

**Files to modify:**

- `[NEW]` `apps/clinic/lib/utils/csrf.js` — token generation + verification
- `[MOD]` `apps/clinic/middleware.js` — validate CSRF on all mutating requests
- `[MOD]` `apps/clinic/lib/api/client.js` — attach CSRF header on every request
- `[NEW]` `apps/clinic/app/api/auth/csrf/route.js` — GET endpoint to issue token

**Technical approach:**

```js
// Per-session CSRF token stored in httpOnly cookie, sent back as X-CSRF-Token header
// Client reads from meta tag injected in layout, sends as header on POST/PUT/DELETE
```

---

### 1.4 Secure Password Requirements (8.7 + 21.2.6)

**Files to modify:**

- `[MOD]` `apps/clinic/services/auth.service.js` — enforce regex on registration + change-password
- `[MOD]` `apps/clinic/app/api/auth/register/route.js` — validate password strength
- `[MOD]` `apps/clinic/app/api/auth/change-password/route.js` — validate strength
- `[MOD]` `apps/clinic/app/change-password/page.jsx` — add strength meter UI
- `[MOD]` `apps/clinic/app/register/page.jsx` — add strength meter UI
- `[NEW]` `apps/clinic/components/ui/PasswordStrengthMeter.jsx`

**Technical approach:**

```js
// Minimum: 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```

---

### 1.5 2FA Toggle in Profile Settings UI (21.3.8)

**Files to modify:**

- `[MOD]` `apps/clinic/components/settings/ProfileTab.jsx` — add 2FA enable/disable toggle
- `[NEW]` `apps/clinic/components/settings/TwoFactorSetup.jsx` — QR code modal + verify code step
- Uses existing APIs: `/api/auth/2fa/setup`, `/api/auth/2fa/verify`, `/api/auth/2fa/disable`

---

### 1.6 2FA Backup / Recovery Codes (21.3.6)

**Files to modify:**

- `[MOD]` `apps/clinic/app/api/auth/2fa/setup/route.js` — return 8 recovery codes on setup
- `[NEW]` `apps/clinic/app/api/auth/2fa/recovery/route.js` — POST to consume a recovery code
- `[MOD]` `apps/clinic/components/settings/TwoFactorSetup.jsx` — show + download recovery codes

---

### 1.7 Session Revocation on Password Change (21.5.5)

**Files to modify:**

- `[MOD]` `apps/clinic/services/auth.service.js` — invalidate all refresh tokens for user on password change
- `[MOD]` `apps/clinic/app/api/auth/change-password/route.js` — call revoke-all-sessions after change

---

### 1.8 OAuth Account Linking & Profile Sync (21.4.4, 21.4.5)

**Files to modify:**

- `[MOD]` `apps/clinic/app/api/auth/oauth/callback/route.js` — detect existing email, link account
- `[MOD]` `apps/clinic/services/auth.service.js` — `linkOAuthAccount(userId, provider, providerAccountId)`
- Store `avatar` and `displayName` from OAuth provider on first login

---

## PHASE 2 — PATIENT CLINICAL DATA (CORE FEATURE)

> The patient detail page needs full tab coverage for Lab, Imaging, Insurance.

---

### 2.1 Patient Detail — Lab Results Tab (14.3.7)

**Files to modify:**

- `[MOD]` `apps/clinic/app/patients/[id]/page.jsx` — add `lab-results` to tabs array
- `[NEW]` `apps/clinic/app/patients/[id]/_tabs/LabResultsTab.jsx`
  - Fetches `GET /api/lab-orders?patientId=[id]`
  - Lists orders → expand to see results
  - "Order New Lab Test" button (APPOINTMENT:CREATE permission)
  - Color-code abnormal values (14.3.6)
  - Print button (14.3.8) → window.print() or PDF generation

**Lab order form:**

- `[NEW]` `apps/clinic/components/lab/NewLabOrderModal.jsx`
  - Patient pre-filled, select test from `/api/lab-tests`, add notes

---

### 2.2 Patient Detail — Imaging Tab (16.1.7)

**Files to modify:**

- `[MOD]` `apps/clinic/app/patients/[id]/page.jsx` — add `imaging` tab
- `[NEW]` `apps/clinic/app/patients/[id]/_tabs/ImagingTab.jsx`
  - Lists `GET /api/imaging?patientId=[id]`
  - "Request Imaging" button → `POST /api/imaging`
  - Upload image file (16.1.9) → multipart upload to `/api/upload`
  - View report per imaging record

**Image upload:**

- `[NEW]` `apps/clinic/app/api/upload/route.js` — handle multipart, save to cloud storage (S3/Cloudinary)
- `[MOD]` `apps/clinic/lib/utils/storage.js` — upload helper

---

### 2.3 Patient Detail — Insurance Tab (17.1.9)

**Files to modify:**

- `[MOD]` `apps/clinic/app/patients/[id]/page.jsx` — add `insurance` tab
- `[NEW]` `apps/clinic/app/patients/[id]/_tabs/InsuranceTab.jsx`
  - List claims `GET /api/insurance/claims?patientId=[id]`
  - Verify coverage button → `POST /api/insurance/verify`
  - Submit claim → `POST /api/insurance/claims/[id]/submit`
  - Status timeline (17.1.10): Pending → Submitted → Approved/Rejected

---

### 2.4 Patient Allergies & Chronic Conditions (2.3.12, 2.3.13)

**Files to modify:**

- `[MOD]` `apps/clinic/app/api/patients/[id]/route.js` — ensure `allergies[]` and `chronicConditions[]` fields saved
- `[MOD]` `apps/clinic/app/patients/[id]/page.jsx` — add allergies/conditions to Overview tab
- `[NEW]` `apps/clinic/components/patients/AllergiesEditor.jsx` — tag-input component
- `[NEW]` `apps/clinic/components/patients/ChronicConditionsEditor.jsx` — tag-input with ICD codes

---

### 2.5 Patient Document Upload (2.3.11)

**Files to modify:**

- `[MOD]` `apps/clinic/app/patients/[id]/page.jsx` — add Documents tab or section
- `[NEW]` `apps/clinic/app/patients/[id]/_tabs/DocumentsTab.jsx`
  - Upload PDF/image via `/api/upload`
  - List uploaded documents with download link
  - Delete document
- `[MOD]` `apps/clinic/app/api/patients/[id]/route.js` — add `documents[]` field

---

### 2.6 Previous Visit Records (2.3.10)

**Files to modify:**

- `[MOD]` `apps/clinic/app/patients/[id]/page.jsx` — add Visit History tab
- `[NEW]` `apps/clinic/app/patients/[id]/_tabs/VisitHistoryTab.jsx`
  - Fetches `GET /api/appointments?patientId=[id]&status=completed`
  - Timeline view: date, doctor, diagnosis, prescription linked
  - Click → navigate to appointment detail

---

### 2.7 Clinical Notes Template Selection UI (15.2.6)

**Files to modify:**

- `[MOD]` `apps/clinic/app/patients/[id]/_tabs/ClinicalNotesTab.jsx` (or wherever notes form is)
- Add "Use Template" button → dropdown of `GET /api/note-templates`
- On select: `POST /api/note-templates/[id]/apply` → prefills form

---

### 2.8 Emergency Contact Details (2.3.14)

**Files to modify:**

- `[MOD]` Patient create/edit form — add emergency contact section (name, relationship, phone)
- `[MOD]` `apps/clinic/app/api/patients/route.js` + `[id]/route.js` — persist `emergencyContact{}`

---

## PHASE 3 — APPOINTMENTS ENHANCEMENTS

---

### 3.1 Cancel Appointment with Reason (2.2.11)

**Files to modify:**

- `[MOD]` `apps/clinic/app/appointments/[id]/page.jsx` — Cancel button opens modal
- `[NEW]` `apps/clinic/components/appointments/CancelAppointmentModal.jsx`
  - Textarea for reason (required)
  - Calls `PATCH /api/appointments/[id]/status` with `{ status: 'cancelled', cancellationReason }`
- `[MOD]` `apps/clinic/app/api/appointments/[id]/status/route.js` — persist `cancellationReason`

---

### 3.2 Appointment Notes (2.2.13)

**Files to modify:**

- `[MOD]` `apps/clinic/app/appointments/[id]/page.jsx` — add Notes section (textarea + save)
- `[MOD]` `apps/clinic/app/api/appointments/[id]/route.js` — persist `notes` field on PATCH

---

### 3.3 Send Appointment Reminder (2.2.14)

**Files to modify:**

- `[NEW]` `apps/clinic/app/api/appointments/[id]/remind/route.js` — POST triggers email/SMS
- `[MOD]` `apps/clinic/app/appointments/[id]/page.jsx` — "Send Reminder" button
- `[MOD]` `apps/clinic/services/notification.service.js` — `sendAppointmentReminder(appointmentId)`

---

### 3.4 Print Appointment Details (2.2.20)

**Files to modify:**

- `[MOD]` `apps/clinic/app/appointments/[id]/page.jsx` — "Print" button → `window.print()`
- `[NEW]` `apps/clinic/app/appointments/[id]/print/page.jsx` — print-optimized layout (no sidebar)
- Add `@media print` styles in globals.css hiding nav/sidebar

---

### 3.5 Queue — Real-Time Updates & Position (12.1.5, 12.1.6)

**Files to modify:**

- `[MOD]` `apps/clinic/app/queue/page.jsx` — poll `GET /api/queue` every 10s via SWR `refreshInterval`
- `[MOD]` `apps/clinic/app/api/queue/route.js` — return `position` (index in queue) and `estimatedWait` (position × avg visit time)
- Optional: WebSocket via `[NEW]` `apps/clinic/app/api/queue/subscribe/route.js` (SSE)

---

## PHASE 4 — BILLING & INVOICES

---

### 4.1 Discount & Tax on Invoices (2.4.4, 2.4.5)

**Files to modify:**

- `[MOD]` `apps/clinic/app/invoices/new/page.jsx` — add discount (% or fixed) and tax rate fields
- `[MOD]` `apps/clinic/app/invoices/[id]/edit/page.jsx` — same
- `[MOD]` `apps/clinic/app/api/invoices/route.js` — persist `discountType`, `discountValue`, `taxRate`, auto-calculate `total`
- Auto-calculate: `subtotal - discount + tax = total`

---

### 4.2 Print & Email Invoice (2.4.8, 2.4.9)

**Files to modify:**

- `[NEW]` `apps/clinic/app/invoices/[id]/print/page.jsx` — print layout with clinic branding
- `[MOD]` `apps/clinic/app/invoices/[id]/page.jsx` — Print button + Email button
- `[NEW]` `apps/clinic/app/api/invoices/[id]/email/route.js` — POST sends invoice email via SMTP
- `[MOD]` `apps/clinic/services/email.service.js` — `sendInvoiceEmail(invoiceId, recipientEmail)`

---

### 4.3 Partial Payment (2.4.7)

**Files to modify:**

- `[MOD]` Invoice schema — add `amountPaid`, `status: 'partial'`
- `[MOD]` `apps/clinic/app/api/invoices/[id]/route.js` — PATCH to record partial payment
- `[MOD]` `apps/clinic/app/invoices/[id]/page.jsx` — "Record Payment" modal with amount field

---

### 4.4 Payment Mode Breakdown (2.4.16)

**Files to modify:**

- `[MOD]` `apps/clinic/app/reports/page.jsx` — add payment mode chart (cash/card/insurance/online)
- `[NEW]` `apps/clinic/app/api/reports/payment-modes/route.js` — aggregate by `paymentMethod`

---

### 4.5 Filter Invoices by Status (2.4.11)

**Files to modify:**

- `[MOD]` `apps/clinic/app/invoices/page.jsx` — add status filter tabs (All / Paid / Unpaid / Partial / Overdue)
- `[MOD]` `apps/clinic/app/api/invoices/route.js` — accept `?status=` query param

---

### 4.6 Download Invoice PDF (22.1.4)

**Files to modify:**

- `[NEW]` `apps/clinic/app/api/invoices/[id]/pdf/route.js` — generate PDF using `@react-pdf/renderer`
- `[MOD]` `apps/clinic/app/invoices/[id]/page.jsx` — "Download PDF" button
- `[NEW]` `apps/clinic/components/pdf/InvoicePDF.jsx` — PDF template

**Dependencies:** `npm install @react-pdf/renderer`

---

## PHASE 5 — INVENTORY ENHANCEMENTS

---

### 5.1 Expired Items Alert (2.5.8)

**Files to modify:**

- `[MOD]` `apps/clinic/app/inventory/lots/page.jsx` — highlight rows where `expiryDate < today + 30 days`
- `[MOD]` `apps/clinic/app/dashboard/page.jsx` — add "Expiring Soon" alert card alongside low stock
- `[MOD]` `apps/clinic/app/api/inventory/lots/route.js` — add `?expiringSoon=true` filter

---

### 5.2 Add / Reduce Stock (2.5.11, 2.5.12)

**Files to modify:**

- `[MOD]` `apps/clinic/app/inventory/items/[id]/page.jsx` — "Adjust Stock" button
- `[NEW]` `apps/clinic/components/inventory/AdjustStockModal.jsx` — type: add/reduce, qty, reason
- Uses existing `POST /api/inventory/transactions` + `PUT /api/inventory/batches/[id]/quantity`

---

### 5.3 Supplier Management (2.5.13)

**Files to modify:**

- `[NEW]` `apps/clinic/app/inventory/suppliers/page.jsx` — list, create, edit, delete suppliers
- Uses existing `GET/POST /api/inventory/suppliers`
- `[MOD]` `apps/clinic/components/layout/Sidebar.jsx` — add Suppliers link under Inventory

---

### 5.4 Stock Value Calculation (2.5.15)

**Files to modify:**

- `[MOD]` `apps/clinic/app/inventory/page.jsx` — add "Total Stock Value" summary card
- `[MOD]` `apps/clinic/app/api/inventory/items/route.js` — return aggregate `totalValue = sum(qty × unitCost)`

---

## PHASE 6 — CLINIC SETTINGS COMPLETIONS

---

### 6.1 Contact Details in Settings (2.9.3)

**Files to modify:**

- `[MOD]` `apps/clinic/app/settings/[tab]/page.jsx` — add contact fields to General tab
- Fields: clinic phone, clinic email, full address, website URL
- `[MOD]` corresponding settings API to persist

---

### 6.2 Services Offered (2.9.5) & Consultation Fees (2.9.6)

**Files to modify:**

- `[NEW]` `apps/clinic/app/settings/services/page.jsx` — CRUD for services list
- `[NEW]` `apps/clinic/app/api/settings/services/route.js`
- Each service: name, description, defaultDuration, defaultFee
- Used in appointment booking form for service/treatment selection (2.2.7)

---

### 6.3 Timezone & Language Preference (2.9.13, 2.9.14)

**Files to modify:**

- `[MOD]` `apps/clinic/app/settings/[tab]/page.jsx` — add timezone select and language select to General tab
- `[MOD]` `apps/clinic/contexts/I18nContext.jsx` — read language from user settings, apply on mount
- Use `Intl.supportedValuesOf('timeZone')` for timezone list

---

### 6.4 Branding — Favicon & Preview (20.2.3, 20.2.4)

**Files to modify:**

- `[MOD]` `apps/clinic/app/settings/branding/page.jsx` — add favicon upload input
- `[MOD]` `apps/clinic/app/layout.jsx` — dynamically set favicon from tenant branding config
- Add live preview panel showing logo + colors applied to mock sidebar/header

---

### 6.5 Locations — Primary Location & Map (20.4.4, 20.4.5)

**Files to modify:**

- `[MOD]` `apps/clinic/app/settings/locations/page.jsx` — "Set as Primary" button, embed Google Maps / Leaflet iframe
- `[MOD]` location API — add `isPrimary` boolean, ensure only one primary per tenant

---

### 6.6 Manager Limit Enforcement (20.5.3)

**Files to modify:**

- `[MOD]` `apps/clinic/app/settings/create-manager/page.jsx` — check current manager count vs plan limit before showing form
- `[MOD]` `apps/clinic/app/api/users/route.js` — on POST with manager role, check `managerCount < plan.maxManagers`
- Show upgrade prompt if limit reached (link to `/subscription`)

---

## PHASE 7 — NOTIFICATIONS & REAL-TIME

---

### 7.1 Real-Time Notifications (27.1.5)

**Files to modify:**

- `[NEW]` `apps/clinic/app/api/notifications/stream/route.js` — Server-Sent Events (SSE) endpoint
- `[MOD]` `apps/clinic/components/notifications/NotificationCenter.jsx` — connect to SSE stream + fallback to polling every 30s
- On new notification server-side, push to SSE connected clients

**Technical approach:**

```js
// SSE endpoint
export async function GET(req) {
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(async () => {
        const newNotifs = await getUndeliveredNotifications(userId);
        if (newNotifs.length) controller.enqueue(`data: ${JSON.stringify(newNotifs)}\n\n`);
      }, 5000);
      req.signal.addEventListener('abort', () => clearInterval(interval));
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}
```

---

### 7.2 Notification Types & Icons (27.1.6)

**Files to modify:**

- `[MOD]` `apps/clinic/components/ui/NotificationDropdown.jsx` — map `type` to icon + color
- Types: `info` (blue), `warning` (yellow), `success` (green), `error` (red), `appointment` (purple)
- `[MOD]` notification model — ensure `type` field is populated on creation

---

### 7.3 Email / SMS Dispatch (27.1.7)

**Files to modify:**

- `[NEW]` `apps/clinic/services/email.service.js` — `sendEmail(to, templateId, variables)` via SMTP/SendGrid
- `[NEW]` `apps/clinic/services/sms.service.js` — `sendSMS(to, message)` via Twilio
- `[NEW]` `apps/clinic/lib/utils/notification-dispatch.js` — route to email/SMS based on user preferences
- `[MOD]` `apps/clinic/app/api/notifications/route.js` — after DB insert, call dispatch

**Dependencies:** `npm install nodemailer @sendgrid/mail twilio`

---

### 7.4 Notification Template Variables (27.2.6)

**Files to modify:**

- `[MOD]` `apps/clinic/app/api/notification-templates/[id]/apply/route.js`
  - Accept `variables: { patientName, doctorName, appointmentDate, ... }`
  - Replace `{{patientName}}` placeholders in template body
- `[NEW]` `apps/clinic/components/notifications/TemplateVariablesGuide.jsx` — show available variables

---

## PHASE 8 — DOCTOR PORTAL COMPLETIONS

---

### 8.1 Leave Approval Workflow (19.2.8)

**Files to modify:**

- `[MOD]` `apps/clinic/app/api/doctors/[id]/leaves/route.js` — add `status: pending|approved|rejected` + `approvedBy`
- `[NEW]` `apps/clinic/app/api/doctors/[id]/leaves/[leaveId]/approve/route.js` — PATCH by admin/clinic_admin
- `[NEW]` `apps/clinic/app/staff/page.jsx` or settings page — "Pending Leaves" section for admin
- `[MOD]` `apps/clinic/app/doctors/[id]/leaves/page.jsx` — show approval status badge
- On approval → block time slots in scheduler

---

### 8.2 Profile Photo Upload (19.1.5)

**Files to modify:**

- `[MOD]` `apps/clinic/app/doctors/profile/page.jsx` — avatar upload input
- `[MOD]` `apps/clinic/components/settings/ProfileTab.jsx` — profile picture for all users
- On upload → `POST /api/upload` → store URL in user.avatar
- Display avatar in Sidebar, ProfileMenu

---

### 8.3 Reply to Reviews (19.6.4)

**Files to modify:**

- `[MOD]` `apps/clinic/app/doctors/reviews/page.jsx` — "Reply" button per review
- `[MOD]` `apps/clinic/app/api/doctors/[id]/reviews/route.js` — PATCH `{ reply: string }`
- Display reply below review in public-facing doctor profile

---

### 8.4 Doctor Message Threading (19.5.5)

**Files to modify:**

- `[MOD]` `apps/clinic/app/doctors/messages/page.jsx` — show conversations grouped by thread (by `threadId`)
- `[MOD]` `apps/clinic/app/api/messages/route.js` — add `threadId` grouping, mark thread as read
- `[NEW]` `apps/clinic/components/messages/MessageThread.jsx` — chronological thread view

---

### 8.5 Blocked Calendar Slots for Approved Leaves (19.2.9)

**Files to modify:**

- `[MOD]` `apps/clinic/app/api/appointments/slots/route.js` — exclude times within approved leave dates
- `[MOD]` Appointment booking form — slots during leave shown as unavailable / greyed out

---

## PHASE 9 — REPORTS ENHANCEMENTS

---

### 9.1 Service-wise Revenue (2.7.6)

**Files to modify:**

- `[NEW]` `apps/clinic/app/api/reports/service-revenue/route.js` — aggregate invoices by service
- `[MOD]` `apps/clinic/app/reports/page.jsx` — add Service Revenue tab with bar chart

---

### 9.2 Daily Collection Summary (2.7.9)

**Files to modify:**

- `[NEW]` `apps/clinic/app/api/reports/daily-collection/route.js` — group by day, return cash/card/total
- `[MOD]` `apps/clinic/app/reports/page.jsx` — add Daily Collection tab with data table

---

### 9.3 Monthly Comparison Chart (2.7.10)

**Files to modify:**

- `[MOD]` `apps/clinic/app/api/reports/revenue/route.js` — return current month vs previous month
- `[MOD]` `apps/clinic/app/reports/page.jsx` — dual-line chart comparing months

---

### 9.4 Export All Reports to PDF (2.7.11)

**Files to modify:**

- `[MOD]` `apps/clinic/app/reports/page.jsx` — "Export PDF" button triggers `window.print()` on report section
- Add print-specific CSS: `@media print { .no-print { display: none } }`
- Or: `[NEW]` `apps/clinic/app/api/reports/export-pdf/route.js` using `puppeteer`

---

## PHASE 10 — i18n & ACCESSIBILITY

---

### 10.1 Language Switcher UI (26.6)

**Files to modify:**

- `[MOD]` `apps/clinic/contexts/I18nContext.jsx` — expose `setLocale(lang)` function, persist to localStorage
- `[MOD]` `apps/clinic/app/settings/[tab]/page.jsx` — add language dropdown in General tab
- `[MOD]` `apps/clinic/components/layout/Sidebar.jsx` or Header — language switcher icon

---

### 10.2 RTL Support for Arabic (26.7)

**Files to modify:**

- `[MOD]` `apps/clinic/app/layout.jsx` — set `dir="rtl"` when locale is `ar`
- `[MOD]` `apps/clinic/app/globals.css` — add RTL utility classes
- `[MOD]` `apps/clinic/components/layout/Sidebar.jsx` — flip icons/padding for RTL

---

### 10.3 Date/Number Locale Formatting (26.8)

**Files to modify:**

- `[NEW]` `apps/clinic/lib/utils/format.js` — `formatDate(date, locale)`, `formatCurrency(amount, locale, currency)`
- Replace all raw `new Date().toLocaleDateString()` calls with this helper
- Use `Intl.DateTimeFormat` and `Intl.NumberFormat`

---

### 10.4 Full i18n Coverage (26.10)

**Files to modify:**

- Audit all `.jsx` files for hardcoded English strings
- Move to `t('key')` pattern
- `[MOD]` All 4 locale JSON files (`en/ar/fr/es`)
- Focus areas: error messages, toast notifications, modal titles, table headers

---

### 10.5 Keyboard Navigation & Focus (6.1, 6.4)

**Files to modify:**

- `[MOD]` `apps/clinic/components/ui/Tabs.jsx` — add arrow key navigation between tabs
- `[MOD]` `apps/clinic/components/ui/Button.jsx` — ensure `focus-visible` ring
- `[MOD]` `apps/clinic/app/globals.css` — add `:focus-visible { outline: 2px solid var(--primary) }`
- `[NEW]` `apps/clinic/components/layout/SkipToContent.jsx` — "Skip to main content" link at top

---

### 10.6 Color Contrast Compliance (6.3)

**Files to modify:**

- Audit all text/background color pairs against WCAG AA (4.5:1 ratio)
- `[MOD]` `apps/clinic/app/globals.css` — adjust grey text colors, muted text to meet contrast
- Tool: run `npx axe-cli` on key pages

---

## PHASE 11 — PWA & OFFLINE

---

### 11.1 PWA Manifest (25.5)

**Files to modify:**

- `[NEW]` `apps/clinic/public/manifest.json`

```json
{
  "name": "Clinic Management",
  "short_name": "Clinic",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0066ff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192" },
    { "src": "/icon-512.png", "sizes": "512x512" }
  ]
}
```

- `[MOD]` `apps/clinic/app/layout.jsx` — add `<link rel="manifest" href="/manifest.json" />`

---

### 11.2 Offline Fallback Page (25.8)

**Files to modify:**

- `[NEW]` `apps/clinic/public/offline.html` — static HTML shown when both page and network fail
- `[MOD]` `apps/clinic/public/sw.js` — serve offline.html on fetch failure

---

### 11.3 Cache-First Strategy (25.7)

**Files to modify:**

- `[MOD]` `apps/clinic/public/sw.js` — add `CacheFirst` strategy for static assets (JS/CSS/images)
- Add `NetworkFirst` strategy for API calls

---

### 11.4 Background Sync (25.6)

**Files to modify:**

- `[MOD]` `apps/clinic/public/sw.js` — register `sync` event for failed form submissions
- `[MOD]` `apps/clinic/components/OfflineReplay.jsx` — store failed requests in IndexedDB, replay on sync

---

## PHASE 12 — ADMIN COMPLETIONS

---

### 12.1 Suspend Clinic with Reason (1.2.5)

**Files to modify:**

- `[MOD]` `apps/clinic/app/admin/clients/page.jsx` — "Suspend" button opens confirmation modal with reason textarea
- `[MOD]` `apps/clinic/app/api/admin/clients/[id]/route.js` — PATCH `{ status: 'suspended', suspendReason }`
- Show suspension reason in clinic detail view

---

### 12.2 Login as Clinic / Impersonate (1.2.8)

**Files to modify:**

- `[NEW]` `apps/clinic/app/api/admin/impersonate/route.js` — POST with `{ tenantId }`, returns temp impersonation token
- `[MOD]` `apps/clinic/app/admin/clients/page.jsx` — "Login as Clinic" button (super_admin only)
- `[MOD]` `apps/clinic/components/layout/Layout.jsx` — show impersonation banner when active
- `[NEW]` `apps/clinic/app/api/admin/impersonate/end/route.js` — end impersonation session

---

### 12.3 Support Tickets Module (1.6.1)

**Files to modify:**

- `[NEW]` `apps/clinic/app/admin/support/page.jsx` — list all tickets
- `[NEW]` `apps/clinic/app/api/admin/support/route.js`
- `[NEW]` `apps/clinic/app/api/admin/support/[id]/route.js`
- `[NEW]` `apps/clinic/app/support/tickets/page.jsx` — clinic side: submit + view tickets
- Schema: `{ id, tenantId, subject, description, status, priority, assignedTo, messages[] }`

---

### 12.4 Email / SMS Template Editors (1.7.8, 1.7.9)

**Files to modify:**

- `[MOD]` `apps/clinic/app/admin/settings/email-sms/page.jsx` — add template editor tab
- `[NEW]` `apps/clinic/components/admin/TemplateEditor.jsx` — rich text editor (Quill/TipTap) with variable insertion
- Uses existing `/api/notification-templates` APIs

**Dependencies:** `npm install @tiptap/react @tiptap/starter-kit`

---

### 12.5 Clinic Usage Stats (1.2.7)

**Files to modify:**

- `[MOD]` `apps/clinic/app/api/admin/clients/[id]/route.js` — return `{ patientCount, managerCount, appointmentCount, storageUsedMB }`
- `[MOD]` `apps/clinic/app/admin/clients/page.jsx` — show usage bars in clinic detail modal

---

### 12.6 Bulk Actions on Clinics (1.2.11)

**Files to modify:**

- `[MOD]` `apps/clinic/app/admin/clients/page.jsx` — add checkboxes, bulk action toolbar
- `[NEW]` `apps/clinic/app/api/admin/clients/bulk/route.js` — POST `{ ids[], action: 'activate'|'suspend'|'delete' }`

---

## PHASE 13 — GDPR & COMPLIANCE

---

### 13.1 Consent Management (23.6)

**Files to modify:**

- `[NEW]` `apps/clinic/components/consent/CookieBanner.jsx` — GDPR cookie consent banner on first visit
- `[NEW]` `apps/clinic/app/api/consent/route.js` — store consent record per user
- `[MOD]` `apps/clinic/app/layout.jsx` — include CookieBanner
- Store: `{ userId, consentedAt, categories: { analytics, marketing, functional } }`

---

### 13.2 Right-to-be-Forgotten (23.7)

**Files to modify:**

- `[MOD]` `apps/clinic/app/api/gdpr/delete/route.js` — full cascade delete (patient → appointments → prescriptions → invoices → notes → lab orders)
- `[NEW]` `apps/clinic/app/settings/privacy/page.jsx` — "Request Account Deletion" button for patients/users
- Add confirmation email + 30-day grace period before hard delete

---

### 13.3 GDPR Request Audit Trail (23.8)

**Files to modify:**

- `[MOD]` All `/api/gdpr/*.js` routes — log every GDPR request to audit collection
- `[MOD]` `apps/clinic/app/admin/activity-logs/page.jsx` — add GDPR filter option

---

## PHASE 14 — EXTERNAL INTEGRATIONS

---

### 14.1 Stripe / PayPal Webhooks (29.1.4)

**Files to create:**

- `[NEW]` `apps/clinic/app/api/webhooks/stripe/route.js`
  - `invoice.payment_succeeded` → mark subscription active
  - `invoice.payment_failed` → send overdue notification, set subscription to past_due
  - `customer.subscription.deleted` → set subscription to cancelled
- `[NEW]` `apps/clinic/app/api/webhooks/paypal/route.js`
  - `BILLING.SUBSCRIPTION.ACTIVATED`
  - `BILLING.SUBSCRIPTION.CANCELLED`

---

### 14.2 Twilio SMS (29.2.1)

**Files to modify:**

- `[MOD]` `apps/clinic/services/sms.service.js`

```js
import twilio from 'twilio';
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
export const sendSMS = (to, body) =>
  client.messages.create({ from: process.env.TWILIO_PHONE, to, body });
```

- `[MOD]` `.env` — add `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_PHONE`
- `[MOD]` `apps/clinic/app/admin/settings/email-sms/page.jsx` — Twilio config fields

---

### 14.3 Redis Caching (29.3.2)

**Files to create:**

- `[NEW]` `apps/clinic/lib/redis.js` — Redis client singleton (`ioredis`)
- `[MOD]` `apps/clinic/app/api/dashboard/route.js` — cache dashboard stats for 60s
- `[MOD]` `apps/clinic/app/api/reports/route.js` — cache report results for 5 min
- `[MOD]` `.env` — add `REDIS_URL`

**Dependencies:** `npm install ioredis`

---

### 14.4 Payment Failure Retry & Refunds (29.1.5, 29.1.6)

**Files to create:**

- `[NEW]` `apps/clinic/app/api/subscriptions/retry-payment/route.js` — POST to retry failed Stripe payment
- `[NEW]` `apps/clinic/app/api/invoices/[id]/refund/route.js` — POST to issue Stripe/PayPal refund
- `[MOD]` `apps/clinic/app/invoices/[id]/page.jsx` — "Refund" button (admin/doctor only)

---

## PHASE 15 — PUBLIC / MARKETING SEO

---

### 15.1 SEO Meta Tags (30.13)

**Files to modify:**

- `[MOD]` `apps/clinic/app/layout.jsx` — add default `<meta>` description, keywords, robots
- `[MOD]` Each public page (`/about`, `/pricing`, `/blog/[slug]`, etc.) — export `generateMetadata()`

```js
export const metadata = {
  title: 'About Us | Clinic Management',
  description: '...',
  openGraph: { title: '...', image: '/og-default.jpg' },
};
```

---

### 15.2 Sitemap (30.14)

**Files to create:**

- `[NEW]` `apps/clinic/app/sitemap.js` — Next.js sitemap route

```js
export default function sitemap() {
  return [
    { url: 'https://yourdomain.com/', lastModified: new Date() },
    { url: 'https://yourdomain.com/pricing', lastModified: new Date() },
    { url: 'https://yourdomain.com/about', lastModified: new Date() },
    // dynamic: blog posts from DB
  ];
}
```

---

### 15.3 Open Graph Tags (30.15)

**Files to modify:**

- `[MOD]` `apps/clinic/app/layout.jsx` — add `og:image`, `og:type`, `twitter:card`
- `[NEW]` `apps/clinic/public/og-default.jpg` — default OG image (1200×630)
- `[MOD]` `apps/clinic/app/blog/[slug]/page.jsx` — dynamic OG image per post

---

## PHASE 16 — PROFILE & UX POLISH

---

### 16.1 Upload Profile Picture (19.1.5 / 4.4.3)

**Files to modify:**

- `[MOD]` `apps/clinic/components/settings/ProfileTab.jsx` — avatar upload with crop
- `[NEW]` `apps/clinic/components/ui/AvatarUpload.jsx` — circle crop + preview
- On upload → `POST /api/upload` → save URL to `user.avatar`
- `[MOD]` Sidebar, ProfileMenu — display user avatar

---

### 16.2 Login History (21.5.6 / 4.4.8)

**Files to modify:**

- `[MOD]` `apps/clinic/services/auth.service.js` — log `{ userId, ip, userAgent, timestamp, success }` on each login
- `[NEW]` `apps/clinic/app/api/auth/login-history/route.js` — GET last 10 logins for current user
- `[MOD]` `apps/clinic/components/settings/ProfileTab.jsx` — "Recent Login Activity" section

---

### 16.3 Usage Stats / Progress Bars on Subscription Page (2.8.3, 2.8.4)

**Files to modify:**

- `[MOD]` `apps/clinic/app/subscription/page.jsx` — fetch current usage from API
- `[NEW]` `apps/clinic/app/api/subscriptions/usage/route.js` — return `{ patientCount, managerCount, storageUsed }` vs plan limits
- Add progress bars: `<ProgressBar value={used} max={limit} label="Patients" />`

---

### 16.4 Print Patient Card (2.3.17)

**Files to modify:**

- `[NEW]` `apps/clinic/app/patients/[id]/print/page.jsx` — credit-card-style patient summary
- Fields: patient ID, name, DOB, blood group, allergies, emergency contact, QR code

---

### 16.5 Staff Activity Log (2.6.8)

**Files to modify:**

- `[NEW]` `apps/clinic/app/api/staff/[id]/activity/route.js` — GET audit logs filtered by userId
- `[MOD]` `apps/clinic/app/staff/page.jsx` — "Activity" button per staff member → modal/drawer

---

## PHASE 17 — DEPARTMENTS UI

---

### 17.1 Departments Management UI (18.1.7)

**Files to create:**

- `[NEW]` `apps/clinic/app/settings/departments/page.jsx`
  - List departments, create new, edit, delete, assign head doctor
  - Uses existing `/api/departments/*` APIs
- `[MOD]` `apps/clinic/components/layout/Sidebar.jsx` — add Departments under Settings

---

### 17.2 Department-Based Appointment Routing (18.1.8)

**Files to modify:**

- `[MOD]` Appointment booking form — add "Department" select (fetches `/api/departments`)
- `[MOD]` `apps/clinic/app/api/appointments/route.js` — filter available doctors by department
- `[MOD]` `apps/clinic/app/appointments/page.jsx` — filter appointment list by department

---

## ENVIRONMENT VARIABLES REQUIRED

Add these to `.env.local`:

```bash
# Auth
NEXTAUTH_SECRET=
JWT_SECRET=
CSRF_SECRET=

# Database
MONGODB_URI=
REDIS_URL=

# Storage
CLOUDINARY_URL=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# Communications
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SENDGRID_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Search
ELASTICSEARCH_URL=
```

---

## NPM PACKAGES TO INSTALL

```bash
# Validation
npm install zod

# Sanitization
npm install isomorphic-dompurify

# PDF Generation
npm install @react-pdf/renderer

# Rich Text Editor
npm install @tiptap/react @tiptap/starter-kit

# Communications
npm install nodemailer @sendgrid/mail twilio

# Redis
npm install ioredis

# PDF / Puppeteer (server-side)
npm install puppeteer

# Excel export
npm install xlsx
```

---

## IMPLEMENTATION ORDER SUMMARY

| Phase     | Focus                     | Items        | Priority |
| --------- | ------------------------- | ------------ | -------- |
| 1         | Security & Auth           | 8            | P0       |
| 2         | Patient Clinical Data     | 8            | P0       |
| 3         | Appointments              | 5            | P1       |
| 4         | Billing & Invoices        | 6            | P1       |
| 5         | Inventory                 | 4            | P1       |
| 6         | Clinic Settings           | 6            | P1       |
| 7         | Notifications & Real-Time | 4            | P1       |
| 8         | Doctor Portal             | 5            | P2       |
| 9         | Reports                   | 4            | P2       |
| 10        | i18n & Accessibility      | 6            | P2       |
| 11        | PWA & Offline             | 4            | P2       |
| 12        | Admin Completions         | 6            | P2       |
| 13        | GDPR & Compliance         | 3            | P2       |
| 14        | External Integrations     | 4            | P3       |
| 15        | SEO & Marketing           | 3            | P3       |
| 16        | Profile & UX Polish       | 5            | P3       |
| 17        | Departments UI            | 2            | P3       |
| **Total** |                           | **83 tasks** |          |

> Each task above may cover multiple checklist items (e.g., Phase 2.1 covers §14.2.7 + §14.3.6 + §14.3.7 + §14.3.8 together).
