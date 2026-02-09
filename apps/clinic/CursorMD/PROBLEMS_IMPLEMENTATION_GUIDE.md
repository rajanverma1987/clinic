# PROBLEMS.md – Implementation and Fix Guide

This document provides **line-by-line** implementation and fix steps for every item in `PROBLEMS.md`. Use it to resolve pending bugs, UI issues, and functionality problems. Do not skip any item.

---

## How to use this guide

- **ID**: Matches the order/area in PROBLEMS.md.
- **Status**: Pending / Done / Need confirmation.
- **Root cause**: Where the bug likely is or what causes it.
- **Files to change**: Exact paths in the repo.
- **Steps**: Numbered implementation/fix steps.
- **Verification**: How to confirm the fix.

### Where to find suggestions and code fixes

| What you need                       | Where it is                                                                                                                                                                                                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Suggestions (what to do)**        | Each **Line X** section: **Steps** (numbered list) and **Root cause** / **Files to change**. Product-level options: **ITEMS REQUIRING CLIENT CONFIRMATION** (e.g. View Docs, loaders, Queue).                                                                                |
| **How to fix with code (Claude)**   | **Code snippets and how to fix (Claude suggestions)** – copy-paste examples: hydration, API errors, ctaLabel, overlay, alert→dialog, toasts, form submit, report download, debounce, tabs, patient click, day names, dropdown, date filter. All JavaScript, project-aligned. |
| **Per-issue code hints**            | Same **Line X** sections: **Steps** include exact lines (e.g. `const { t } = useI18n();`, `useAuth()`, `useConfirmation()`).                                                                                                                                                 |
| **One-line code fix by error type** | **Quick reference by error type** table (later in doc): maps errors like `'t is not defined'`, `'user is not defined'` to the code fix and PROBLEMS.md line numbers.                                                                                                         |
| **Which file to edit**              | **Files to change** in each Line X section; also **FILE STRUCTURE TO CHECK** at the end.                                                                                                                                                                                     |

---

## Overview section (PROBLEMS.md lines 1–8)

### Line 9 – Language change button overlay CSS on starting page (not inside dashboard)

- **Status**: Pending
- **Root cause**: `LanguageSwitcher` or its dropdown has z-index/position that causes overlay to appear on landing/marketing pages (e.g. `/`, `/pricing`, `/login`).
- **Files to change**: `components/ui/LanguageSwitcher.jsx`, `components/ui/LanguageSwitcher.css`, `components/marketing/Header.jsx` (if used there).
- **Steps**:
  1. Open `LanguageSwitcher.jsx` and `LanguageSwitcher.css`.
  2. Ensure the dropdown container has a high `z-index` (e.g. `z-index: 10060` or above) and `position: absolute` / `relative` so it stacks above page content.
  3. On marketing/landing layout, ensure the header wrapper has `position: relative` and `overflow: visible` (or a stacking context) so the dropdown is not clipped.
  4. Add a class for “marketing” context if needed (e.g. `language-switcher--marketing`) and set dropdown `left/right` so it doesn’t overflow oddly.
- **Verification**: Visit `/`, `/pricing`, `/login`; open language switcher; confirm no full-page overlay and dropdown is visible and clickable.

---

### Line 10 – Spinner and loading have no gap

- **Status**: Done (per PROBLEMS.md).
- **Verification**: Confirm loader/spinner and “Loading…” text have visible gap in `components/ui/Loader.jsx` and `app/globals.css`.

---

### Line 11 – “See it in Action” content buttons not working

- **Status**: Pending
- **Root cause**: Marketing/landing section “See it in Action” has buttons (e.g. CTA) that do not navigate or have broken `onClick`/`href`.
- **Files to change**: Search for “See it in Action” or “see it in action” in `app/page.jsx`, `components/marketing/*.jsx`.
- **Steps**:
  1. `grep -r "See it in Action\|see it in action" app components --include="*.jsx"`.
  2. For each button, set `href` to the correct route (e.g. `/register`, `/dashboard`) or `onClick` that calls `router.push(...)`.
  3. Ensure buttons are `<Link>` or `<Button>` with proper handlers; remove `href="#"` or empty handlers.
- **Verification**: Click each button; confirm navigation or expected action.

---

### Line 12 – Support center: “Still Need help?” header not visible at end of page

- **Status**: Pending
- **Root cause**: Section at end of `app/support/page.jsx` (lines ~563–634) may have contrast or layout issue (e.g. white text on light background, or section pushed off-screen).
- **Files to change**: `app/support/page.jsx`.
- **Steps**:
  1. Open the “Still Need Help?” section (gradient `from-primary-600 via-primary-700 to-primary-800`).
  2. Ensure heading has explicit `color` and sufficient contrast (e.g. `text-white` or `#ffffff`).
  3. Check that the section is not `display: none` or `height: 0`; ensure parent has `min-height` or content is not collapsed.
  4. On small viewports, ensure section is not cut off (check padding/margin and that there’s no `overflow: hidden` clipping it).
- **Verification**: Scroll to bottom of `/support`; “Still Need Help?” and “Contact Support” button must be visible and readable.

---

### Line 13 – Support center: Documentation card “View docs” not working

- **Status**: Need to be asked first (per PROBLEMS.md).
- **Steps**: Confirm with product: should “View docs” open external URL, internal route, or modal? Then add `href` or `onClick` accordingly in the support page component that renders the Documentation card.

---

### Line 14 – Pricing: clicking price tag throws “ctaLabel is not defined”

- **Status**: Pending
- **Root cause**: Some code path references `ctaLabel` while `SubscriptionCard` only accepts `ctaText`. May be typo or leftover prop.
- **Files to change**: `components/ui/SubscriptionCard.jsx`, `app/pricing/page.jsx`, `app/subscription/page.jsx`.
- **Steps**:
  1. In `SubscriptionCard.jsx`: ensure only `ctaText` is used (destructuring and render). If anything uses `ctaLabel`, replace with `ctaText` or add `ctaLabel` as alias: `ctaText: ctaText ?? ctaLabel`.
  2. In `app/pricing/page.jsx` and `app/subscription/page.jsx`: ensure every `<SubscriptionCard>` passes `ctaText={...}` and never `ctaLabel`.
  3. Search repo: `grep -r "ctaLabel" --include="*.jsx" --include="*.js" .` and fix or remove.
- **Verification**: Open `/pricing`, click a plan CTA (e.g. Get Started / Subscribe); no runtime error.

---

### Line 15 – Hydration error after hard refresh (initial UI does not match server)

- **Status**: Pending
- **Root cause**: Server-rendered HTML differs from first client render (e.g. theme class on `<html>`, date/time, `localStorage`, conditional render based on `window`).
- **Files to change**: Usually `app/layout.jsx`, theme script, or components that use `localStorage`/`window`/`Date` without guarding or `suppressHydrationWarning`.
- **Steps**:
  1. Keep theme init in `public/theme-init.js` (no inline script) so server and client can align; ensure root layout has `suppressHydrationWarning` on `<html>` and `<body>` where needed.
  2. Avoid rendering different content on server vs client for the same tree (e.g. do not render “Logged in as X” on server and “Loading” on client in same place without a wrapper).
  3. For date/time, use a component that renders the same on server and client (e.g. same placeholder) then updates in `useEffect`.
  4. For `localStorage`/`window`, only use in `useEffect` or after a “mounted” state so first paint matches server.
- **Verification**: Hard refresh on dashboard and login; no hydration error in console.

---

## Inside Admin Dashboard (PROBLEMS.md lines 18–47)

### Line 20 – Refresh button for “updates available”: disappears after click; should show toast

- **Status**: Pending
- **Root cause**: After manual refresh/revalidate, the “Updates available” banner is hidden but no success feedback is shown.
- **Files to change**: `app/dashboard/page.jsx`, `components/UpdatesAvailableBanner.jsx` (or equivalent).
- **Steps**:
  1. In the handler that runs when user clicks “Refresh” on the updates banner, after triggering revalidation (e.g. `mutate()` or refetch), call `showSuccess(t('common.refreshed'))` (or similar) from `@/lib/utils/toast`.
  2. Ensure toast is imported and used; then hide or remove the banner so it doesn’t “disappear” without feedback.
- **Verification**: Trigger “Updates available”, click Refresh; a success toast appears and data refreshes.

---

### Line 21 – Navbar search: after third letter, error “t is not defined”

- **Status**: Pending
- **Root cause**: Search component (e.g. `GlobalSearch`) or a child uses translation `t(...)` but `useI18n()` was not called in that component (or `t` is out of scope).
- **Files to change**: `components/search/GlobalSearch.jsx` and any subcomponents that use `t`.
- **Steps**:
  1. Open `GlobalSearch.jsx`; ensure at top level: `const { t } = useI18n();`.
  2. Any component that renders search results or suggestions and uses `t` must either get `t` from props or call `useI18n()` itself.
  3. Search for `t(` inside the search UI; ensure each is in a component that has access to `t`.
- **Verification**: Open global search, type at least three characters; no “t is not defined” error.

---

### Line 22 – Notification tab: overlay blurs entire screen

- **Status**: Pending
- **Root cause**: Notification dropdown or modal uses a full-screen overlay with blur, making background content hard to see or interact with.
- **Files to change**: `components/ui/NotificationDropdown.jsx`, `NotificationDropdown.css`, or notification panel component.
- **Steps**:
  1. Reduce overlay coverage: e.g. limit to a card below the trigger instead of full viewport, or use a smaller blurred backdrop.
  2. Or remove blur from the overlay and use a light semi-transparent background; or make overlay non-blocking (e.g. click-outside to close but no full-screen div).
  3. Adjust z-index so it’s above header but not above modals if needed.
- **Verification**: Open notification dropdown; content behind is still readable or overlay is clearly scoped.

---

### Line 23 – Show loader when clicking anything inside dashboard

- **Status**: Need to be confirm first (per PROBLEMS.md).
- **Steps**: Confirm with product whether every navigation/list click should show a full-page or inline loader; then add loading state and `<Loader />` in the appropriate layout or list components.

---

### Line 24 – Appointments tab: availability calendar, clicking timing slot throws “t is not defined”

- **Status**: Pending
- **Root cause**: Component that renders availability slots (e.g. in admin appointments or availability calendar) uses `t(...)` without `useI18n()`.
- **Files to change**: Admin appointments page or availability calendar component (e.g. under `app/admin/appointments/` or shared calendar).
- **Steps**:
  1. Locate the component that renders the clickable time slots.
  2. Add `const { t } = useI18n();` at the top of that component (if it’s a function component).
  3. Replace any hardcoded string that should be translated with `t('key')` and add keys to `lib/i18n/locales/en.json` (and others if needed).
- **Verification**: Go to Admin → Appointments → availability calendar; click a slot; no “t is not defined”.

---

### Line 25 – Queue empty; needs checking

- **Status**: Need to be confirm first (per PROBLEMS.md).
- **Steps**: Confirm expected behavior when queue is empty (message, CTA, or data setup); then implement empty state in `app/queue/page.jsx` if needed.

---

### Line 26 – Patients tab: “Book appointment” button throws “t is not defined”

- **Status**: Pending
- **Root cause**: Button or its parent in admin/patients uses `t(...)` without `useI18n()`.
- **Files to change**: `app/admin/patients/page.jsx` or patient list/card component that contains “Book appointment”.
- **Steps**:
  1. In the component that renders the “Book appointment” button, add `const { t } = useI18n();`.
  2. Ensure the button label uses `t('...')` and the key exists in locales.
- **Verification**: Admin → Patients → click “Book appointment”; no “t is not defined”.

---

### Line 27 – Staff tab: role tab CSS problem, role not shown properly

- **Status**: Pending
- **Root cause**: Role selector or role display in Staff tab has overflow, truncation, or wrong layout.
- **Files to change**: `app/staff/page.jsx` and any Staff-specific styles.
- **Steps**:
  1. Inspect the role dropdown or role column (HTML/CSS).
  2. Fix width/min-width, overflow (e.g. `text-overflow: ellipsis` or allow wrap), and alignment so role names are fully visible.
  3. If it’s a tab control (role tab), ensure active state and labels are visible (contrast, padding).
- **Verification**: Staff tab; all roles visible and selectable; layout correct.

---

### Line 28 – Invoice: “Mark paid” shows default alert; use dialogue component

- **Status**: Pending
- **Root cause**: Code uses `window.confirm` or `alert` for mark paid.
- **Files to change**: `app/invoices/page.jsx` or invoice row action.
- **Steps**:
  1. Replace `confirm()` for “Mark paid” with `useConfirmation()` from `@/contexts/ConfirmationContext`: open a confirmation modal with title/message and onConfirm calling the mark-paid API.
  2. Replace any `alert()` for result with `showSuccess` / `showError` from `@/lib/utils/toast`.
  3. Ensure app is wrapped with `ConfirmationProvider` (e.g. in `Providers` or layout).
- **Verification**: Click “Mark paid”; custom confirmation modal appears; after confirm, toast shows and list updates.

---

### Line 29 – Invoice: Edit button throws “user is not defined”

- **Status**: Pending
- **Root cause**: Invoice edit page or redirect logic uses `user` (e.g. from auth) but it’s not in scope (e.g. missing `useAuth()` or wrong variable name).
- **Files to change**: `app/invoices/[id]/edit/page.jsx` and any shared invoice component that uses `user`.
- **Steps**:
  1. In the component that handles edit (page or modal), add `const { user } = useAuth();` (or get `user` from the same source as other pages).
  2. Guard any use of `user` (e.g. `user?.id`, `user?.tenantId`) with optional chaining; if `!user`, show loader or redirect to login.
- **Verification**: Invoices → Edit; no “user is not defined”; edit form loads.

---

### Line 30 – Invoice: Delete button shows default alert; use dialogue component

- **Status**: Pending
- **Root cause**: Delete uses `window.confirm` / `alert`.
- **Files to change**: `app/invoices/page.jsx`.
- **Steps**:
  1. Replace `confirm()` for delete with `useConfirmation().open({ title, message, onConfirm: () => deleteInvoice(...), variant: 'danger' })`.
  2. Replace success/error alerts with toast.
- **Verification**: Click Delete; confirmation modal; after confirm, toast and list update.

---

### Line 31 – Inventory: Batch no, expiry date, supplier not updated/stored in edit; lots table supplier not updated

- **Status**: Pending
- **Root cause**: Inventory item edit form or API does not send/accept batch number, expiry date, supplier; or lots table doesn’t read supplier from the right field.
- **Files to change**: `app/inventory/items/[id]/page.jsx`, inventory item API (e.g. `app/api/inventory/` or items route), `app/inventory/lots/page.jsx`, and inventory/lot models or services.
- **Steps**:
  1. In item edit form, ensure fields for batch number, expiry date, and supplier are controlled inputs and included in the submit payload.
  2. In API that updates item, read and persist `batchNumber`, `expiryDate`, `supplier` (or equivalent schema fields).
  3. In lots table, ensure supplier column displays data from the same source (e.g. lot or linked item) and refetch after edit.
  4. If lots are a separate collection, ensure updating an item or lot updates the supplier for the lot.
- **Verification**: Edit an item with batch/expiry/supplier; save; view in list and in lots table; all fields updated.

---

### Line 32 – Reports: “Generate report” button not working

- **Status**: Pending
- **Root cause**: Button click handler missing, wrong API, or error not surfaced.
- **Files to change**: `app/reports/page.jsx`.
- **Steps**:
  1. Find the “Generate report” button and its `onClick` or handler.
  2. Ensure handler calls the correct report API (e.g. by report type and date range) and handles loading/error.
  3. On success, show report data or download; on error, show toast or inline error.
- **Verification**: Select report type and range, click Generate report; report loads or file downloads.

---

### Line 33 – Telemedicine: “Book Appointment” throws “t is not defined”

- **Status**: Pending
- **Root cause**: Telemedicine page or modal uses `t(...)` without `useI18n()`.
- **Files to change**: `app/telemedicine/page.jsx` or `app/telemedicine/[id]/page.jsx`.
- **Steps**:
  1. In the component that renders “Book Appointment”, add `const { t } = useI18n();`.
  2. Use `t('...')` for the button label and any related text; add i18n keys.
- **Verification**: Telemedicine → Book Appointment; no “t is not defined”.

---

### Line 34 – Telemedicine: “Book Video Consultation” throws “t is not defined”

- **Status**: Pending
- **Root cause**: Same as above; component using `t` without `useI18n()`.
- **Files to change**: Same as line 33.
- **Steps**: Same pattern; ensure both buttons and any related copy use `t` from `useI18n()`.
- **Verification**: Click “Book Video Consultation”; no error.

---

### Line 35 – Settings → Profile tab: Edit button opens new password tab / not working

- **Status**: Pending
- **Root cause**: Profile “Edit” is wired to wrong tab or to password section.
- **Files to change**: `app/settings/page.jsx`, `components/settings/ProfileTab.jsx`.
- **Steps**:
  1. Find the Profile tab “Edit” button; ensure its handler sets the correct tab/state for editing profile (not password).
  2. If “Edit” should toggle inline edit mode, set a state like `isEditingProfile` and show editable fields; Save should call profile update API.
  3. Separate “Change password” into its own control that switches to password tab or opens change-password flow.
- **Verification**: Settings → Profile → Edit; profile fields become editable; Save updates profile; password unchanged unless user goes to password section.

---

### Line 36 – Settings → Profile → Create manager: “Create manager account” throws “Unexpected token '<', "<!DOCTYPE "... is not valid JSON”

- **Status**: Pending
- **Root cause**: API for create manager returns HTML (e.g. 404/500 page) instead of JSON; front-end expects JSON. Often wrong URL or server error.
- **Files to change**: `app/settings/create-manager/page.jsx`, API route for creating manager (e.g. `app/api/users/register-staff/route.js` or similar).
- **Steps**:
  1. In create-manager page, ensure `fetch`/`apiClient` points to the correct API route (e.g. `POST /api/users/register-staff` or `/api/settings/create-manager`).
  2. Check API route exists and returns `NextResponse.json(...)` on both success and error (never raw HTML).
  3. On 404/500, server might be returning HTML error page; fix route or proxy so API returns JSON and client handles `response.ok` and `response.json()`.
- **Verification**: Fill create manager form, submit; either success toast and list update or JSON error message in toast.

---

### Line 37 – Settings → Holidays: No “Add New Holiday” button after first holiday added

- **Status**: Pending
- **Root cause**: “Add New Holiday” is only shown when `holidays.length === 0` or when a flag is true only on first load; after adding one, the button is hidden.
- **Files to change**: `components/settings/HolidayManagementTab.jsx`, and possibly `app/settings/page.jsx` if it controls the visibility.
- **Steps**:
  1. In `HolidayManagementTab.jsx`, ensure “Add New Holiday” (or “Add holiday”) is always visible (e.g. not conditioned on `holidays.length === 0`). Use `showAddForm` state only to toggle the form visibility, not the button.
  2. Keep a persistent “Add New Holiday” button that sets `setShowAddForm(true)`; when form is open, optionally hide the button or show “Cancel” instead.
- **Verification**: Add one holiday, save; “Add New Holiday” button still visible; can add more.

---

### Line 38 – Subscription: Cancel subscription shows inbuilt alert; use custom dialogue

- **Status**: Pending
- **Root cause**: Cancel flow uses `window.confirm` / `alert`.
- **Files to change**: `app/subscription/page.jsx` or `app/subscription/cancel/page.jsx`.
- **Steps**:
  1. Replace `confirm()` for cancel with `useConfirmation().open({ title, message, onConfirm: () => cancelSubscription(), variant: 'danger' })`.
  2. Replace any `alert()` with toast.
- **Verification**: Cancel subscription; confirmation modal; then toast.

---

### Line 39 – Subscription: All inbuilt alert boxes to be replaced with dialogue/toast

- **Status**: Pending
- **Root cause**: Multiple `alert()` and `confirm()` in subscription flow.
- **Files to change**: `app/subscription/page.jsx`, `app/subscription/cancel/page.jsx`.
- **Steps**:
  1. List all `alert(...)` and `confirm(...)` in subscription pages.
  2. Replace each `confirm` with `useConfirmation().open(...)`.
  3. Replace each `alert` with `showSuccess` / `showError` from `@/lib/utils/toast`.
- **Verification**: Go through add-on, remove add-on, cancel, update plan; only modals and toasts, no browser alerts.

---

### Line 40 – Add New Patient popup: country code not selected

- **Status**: Pending
- **Root cause**: Country code dropdown in patient form doesn’t retain or show selected value (e.g. wrong controlled value or options).
- **Files to change**: Component that renders “Add New Patient” modal/form (e.g. in patients page or shared patient form); ensure country code field uses correct state and options.
- **Steps**:
  1. Find the country code field (e.g. phone country code); ensure it’s a controlled component with `value={formData.countryCode}` and `onChange` updating `formData`.
  2. Ensure initial state includes a default `countryCode` (e.g. `+1` or `+91`) and that options array includes that value.
  3. If using a Select, ensure option values match `formData.countryCode` and the Select receives `value={formData.countryCode}`.
- **Verification**: Open Add New Patient; select a country code; submit; saved patient has correct country code.

---

### Line 41 – Locations tab: Edit button not working; after adding location and hard refresh, new location disappears

- **Status**: Pending
- **Root cause**: (1) Edit button doesn’t open edit form or doesn’t call update API. (2) New location not persisted or not loaded after refresh (API or state).
- **Files to change**: `app/settings/locations/page.jsx`, API for settings/locations (e.g. `PUT /api/settings` or locations endpoint).
- **Steps**:
  1. Wire Edit to open edit mode for the selected location and populate form; on Save call update API with location id and new data.
  2. After adding location, ensure API returns updated list and front-end stores it (or refetches settings). Ensure the API that saves settings actually persists `locations` (or equivalent) and that GET settings returns it after refresh.
- **Verification**: Add location, save; hard refresh; location still in list. Edit location, save; changes persist.

---

### Line 42 – API Documentation: Generate API key → Copy shows inbuilt alert; use custom dialogue

- **Status**: Pending
- **Root cause**: Copy-to-clipboard success/error uses `alert()`.
- **Files to change**: `app/api-docs/page.jsx`.
- **Steps**:
  1. Replace `alert('API key copied...')` (or similar) with `showSuccess(t('apiDocs.copied'))` from toast.
  2. Add i18n key if needed.
- **Verification**: Generate API key, Copy; toast appears, no alert.

---

### Line 43 – Branding tab: After save, inbuilt alert; use custom toast or dialogue

- **Status**: Pending (and confirm with product per PROBLEMS.md).
- **Files to change**: `app/settings/branding/page.jsx`.
- **Steps**:
  1. Replace `alert('Branding settings saved successfully!')` and error alerts with `showSuccess` / `showError` from `@/lib/utils/toast`.
- **Verification**: Save branding; toast only.

---

### Line 44 – White label tab: Same as branding (inbuilt alert on save)

- **Status**: Pending (and confirm per PROBLEMS.md).
- **Files to change**: `app/settings/white-label/page.jsx`.
- **Steps**: Same as line 43; replace alerts with toast.
- **Verification**: Save white label; toast only.

---

### Line 45 – Prescription: Create Prescription → Primary Diagnosis dropdown CSS and functionality; options not selectable, dropdown closes immediately

- **Status**: Pending
- **Root cause**: Primary Diagnosis Select has wrong props (e.g. `onChange` not updating state, or dropdown closing on click due to event handling/z-index).
- **Files to change**: `app/prescriptions/new/page.jsx` or component that renders Primary Diagnosis dropdown; prescription form CSS.
- **Steps**:
  1. Ensure the Select is controlled: `value={primaryDiagnosis}` and `onChange` updates state; options from ICD or list.
  2. If dropdown is inside a table or scrollable area, ensure overflow/z-index so the options list is not clipped or closed by parent click (e.g. use a portal for the options list or adjust overflow).
  3. Fix any `onClick` on option that doesn’t call `onChange` or that triggers parent’s close.
- **Verification**: Open Create Prescription; Primary Diagnosis; open dropdown, click option; selection stays and is visible.

---

### Line 46 – Prescription: Advice/precautions section, after ~10–15 words throws “t is not defined”

- **Status**: Pending
- **Root cause**: Component that renders advice/precautions (or a character-count/validation) uses `t(...)` without `useI18n()`.
- **Files to change**: `app/prescriptions/new/page.jsx`.
- **Steps**:
  1. In the component that contains the Advice/precautions field (or its parent), add `const { t } = useI18n();`.
  2. Ensure any validation message or label uses `t('...')` and key exists.
- **Verification**: Type 10–15 words in Advice/precautions; no “t is not defined”.

---

### Line 47 – Prescription: Prescription items – when type is Drug and selecting item name, dropdown hidden under table (last row)

- **Status**: Pending
- **Root cause**: Item-name dropdown for the last row is rendered inside a table with `overflow: hidden` or low z-index, so it’s clipped below the table.
- **Files to change**: `app/prescriptions/new/page.jsx`, `components/prescriptions/PrescriptionItemsTable.jsx` or similar, and prescription-form CSS.
- **Steps**:
  1. Render the item-name dropdown in a React portal (e.g. `createPortal`) so it’s under `document.body` and not clipped by table overflow.
  2. Or set overflow on the table container to `visible` for that column and give the dropdown a high z-index; ensure table layout allows dropdown to extend below.
  3. Alternatively, show the dropdown above the row when it’s the last row (e.g. `placement="top"`).
- **Verification**: Add item, set type Drug, open item name dropdown on last row; dropdown fully visible and selectable.

---

### Line 48 – Patients tab: Clicking patient row throws compile/runtime error

- **Status**: Pending
- **Root cause**: Row click handler or link to patient detail uses wrong route/param or a variable that’s undefined (e.g. `user` or missing id).
- **Files to change**: `app/admin/patients/page.jsx` or `app/patients/page.jsx` (and patient list component).
- **Steps**:
  1. Find the patient row click handler (or `<Link>`). Ensure it uses the correct patient id (e.g. `patient._id`) and route (e.g. `/patients/[id]` or `/admin/patients/[id]`).
  2. Remove any reference to undefined variables (e.g. `user`); use `useAuth()` if user is needed.
  3. Fix any typo or missing import that causes compile error.
- **Verification**: Click a patient row; navigates to detail page without error.

---

## Inside Doctor Dashboard (PROBLEMS.md lines 49–68)

### Line 51 – Dashboard: Pending tasks box CSS needs adjustment

- **Status**: Pending
- **Root cause**: Pending tasks card on doctor dashboard has layout/overflow/alignment issues.
- **Files to change**: `app/dashboard/page.jsx`, `app/dashboard/components/*.jsx` that render pending tasks, `app/dashboard/styles/dashboard.css`.
- **Steps**:
  1. Locate the Pending tasks box in the dashboard; adjust padding, min-height, overflow, or grid so content is readable and aligned.
- **Verification**: Doctor dashboard; Pending tasks box looks correct on desktop and mobile.

---

### Line 52 – Quick action “Appointment” throws “t is not defined”

- **Status**: Pending
- **Root cause**: `QuickActions` or the handler that navigates for “Appointment” uses `t` without `useI18n()`.
- **Files to change**: `app/dashboard/components/QuickActions.jsx`.
- **Steps**:
  1. In `QuickActions.jsx`, ensure `const { t } = useI18n();` is present and all labels use `t(labelKey)` (e.g. `t('dashboard.newAppointment')`). Labels are already using `t(labelKey)`; ensure the component has `useI18n()` and is not in a context where `t` is missing.
- **Verification**: Navbar → Quick Actions → Appointment; no “t is not defined”.

---

### Line 53 – Profile → Profile tab: Save profile button doesn’t work

- **Status**: Pending
- **Root cause**: Save handler not calling API or form state not sent; or API returns error not shown.
- **Files to change**: `app/doctors/profile/page.jsx`.
- **Steps**:
  1. Find “Save profile” handler; ensure it calls the doctor update API (e.g. `PUT /api/doctors/:id` or profile endpoint) with form state (bio, specializations, etc.).
  2. Ensure loading/error/success handling; show toast on success/error.
  3. If validation blocks submit, show which field failed.
- **Verification**: Change profile fields, click Save profile; success toast and data persisted.

---

### Line 54 – Profile → Clinic details: Add clinic location and Save clinic details not working

- **Status**: Pending
- **Root cause**: Handlers for “Add clinic location” and “Save clinic details” not wired or API not called.
- **Files to change**: `app/doctors/profile/page.jsx` (clinic tab section).
- **Steps**:
  1. “Add clinic location” should add a new empty clinic to state and show form row; “Save clinic details” should submit all clinics to API (e.g. doctor update with `clinics` array).
  2. Ensure API accepts and persists `clinics`; then refetch or update local state.
- **Verification**: Add clinic location, fill, Save clinic details; data saved and visible after refresh.

---

### Line 55 – Profile → Fees and insurance: Save fees doesn’t work

- **Status**: Pending
- **Root cause**: Save fees handler not calling API or payload wrong.
- **Files to change**: `app/doctors/profile/page.jsx` (fees tab).
- **Steps**:
  1. Collect consultation fee, video fee, follow-up, procedure fees, insurance; call doctor update API with these fields; show toast on success/error.
- **Verification**: Fill fees, Save fees; success and data persisted.

---

### Line 56 – Schedule: Weekly schedule day names not shown correctly

- **Status**: Pending
- **Root cause**: Day names (Monday, Tuesday, …) wrong locale, wrong order, or wrong mapping.
- **Files to change**: `app/doctors/schedule/page.jsx` (and any shared schedule component).
- **Steps**:
  1. Use a consistent source for day names (e.g. `t('schedule.monday')` or `date-fns`/`Intl` with current locale) and ensure array order matches the week layout (e.g. Monday first).
- **Verification**: Schedule page; day names correct and in order.

---

### Line 57 – Schedule: Save schedule doesn’t work

- **Status**: Pending
- **Root cause**: Save handler not calling schedule API or API error not handled.
- **Files to change**: `app/doctors/schedule/page.jsx`.
- **Steps**:
  1. On Save, call `PUT /api/doctors/:id/schedule` (or equivalent) with schedule, breaks, slot duration, etc.; handle success/error with toast.
- **Verification**: Change schedule, Save; success toast and data persisted.

---

### Line 58 – Schedule: “Manage leaves” throws 404 (page not found)

- **Status**: Pending
- **Root cause**: Link or route for “Manage leaves” points to a non-existent path.
- **Files to change**: `app/doctors/schedule/page.jsx` (link/button), and create `app/doctors/schedule/leaves/page.jsx` (or correct route) if needed.
- **Steps**:
  1. Create the leaves page at the route the button targets (e.g. `/doctors/schedule/leaves`) or change the button to the correct existing route.
  2. Implement leaves list/add/remove and API if not present.
- **Verification**: Click Manage leaves; page loads, no 404.

---

### Line 59 – Emergency slot and block time slot disappear after refresh

- **Status**: Pending
- **Root cause**: Emergency/block slots not persisted to API or not loaded on mount.
- **Files to change**: `app/doctors/schedule/page.jsx`, schedule API (e.g. `GET/PUT /api/doctors/:id/schedule`).
- **Steps**:
  1. Ensure schedule API schema includes `emergencySlots` and `blockedSlots`; save and load them in the schedule page state.
  2. On Save schedule, include these arrays in the payload; on load, set state from response.
- **Verification**: Add emergency and block slots, Save; refresh; slots still there.

---

### Line 60 – Appointments calendar: Month button doesn’t work

- **Status**: Pending
- **Root cause**: Month view or month navigation button handler missing or wrong state update.
- **Files to change**: `app/doctors/appointments/page.jsx` (or appointments calendar component).
- **Steps**:
  1. Find the Month button and its handler; ensure it sets view mode to `'month'` and that the calendar re-renders with month view and correct date range.
- **Verification**: Click Month; calendar shows month view and navigates correctly.

---

### Line 61 – Appointments calendar: New appointment button throws “t is not defined”

- **Status**: Pending
- **Root cause**: Same as other “t is not defined”; component missing `useI18n()`.
- **Files to change**: `app/doctors/appointments/page.jsx`.
- **Steps**:
  1. Add `const { t } = useI18n();` and use `t(...)` for the New appointment button and any other strings.
- **Verification**: Click New appointment; no “t is not defined”.

---

### Line 62 – Doctor Patients tab: Add new patient, fill form, no patient created

- **Status**: Pending
- **Root cause**: Submit handler not calling create patient API, or API error, or redirect after success not happening.
- **Files to change**: `app/doctors/patients/page.jsx` or the add-patient modal/form.
- **Steps**:
  1. Ensure form submit calls `POST /api/patients` (or correct endpoint) with tenant/doctor context; handle validation and API errors; on success, close modal, show toast, refetch list.
- **Verification**: Add new patient, submit; patient appears in list.

---

### Line 63 – Doctor Invoice tab: Edit button throws “user is not defined”

- **Status**: Pending
- **Root cause**: Same as line 29; invoice edit uses `user` without `useAuth()`.
- **Files to change**: Invoice edit page or component used in doctor invoice section (e.g. `app/invoices/[id]/edit/page.jsx`).
- **Steps**: Same as line 29; ensure `user` from `useAuth()` and guarded.
- **Verification**: Doctor → Invoices → Edit; no “user is not defined”.

---

### Line 64 – Doctor Settings: Clicking Clinic info / Compliance / etc. switches back to Profile tab

- **Status**: Pending
- **Root cause**: Tab state is not persisted or is reset (e.g. URL vs local state); or tab change triggers a re-render that resets to default tab.
- **Files to change**: `app/settings/page.jsx` (and possibly doctor-specific settings if different). May also be `app/doctors/profile/page.jsx` if “Settings” for doctor is under profile.
- **Steps**:
  1. Persist active tab in URL (e.g. `?tab=general`) or in state that isn’t reset when navigating to the same page.
  2. On mount, read tab from URL or state and set initial tab; when user clicks another tab, update URL/state.
  3. Ensure no effect or parent re-render sets tab back to `'profile'` unless intended.
- **Verification**: Click Clinic info (or Compliance, etc.); that tab stays active.

---

### Line 65 – Earnings tab: Keeps showing loading

- **Status**: Pending
- **Root cause**: Data never loads (API error, wrong endpoint, or loading state never set to false).
- **Files to change**: `app/doctors/earnings/page.jsx` and earnings API.
- **Steps**:
  1. Check API call (e.g. doctor earnings or dashboard); ensure success sets data and `setLoading(false)`; on error set error state and `setLoading(false)`.
  2. If API returns 404/403, handle and show empty or error message instead of infinite loader.
- **Verification**: Open Earnings; data appears or error message; loader stops.

---

### Line 66 – Reviews tab: Keeps showing loading

- **Status**: Pending
- **Root cause**: Same pattern as Earnings.
- **Files to change**: `app/doctors/reviews/page.jsx`.
- **Steps**: Same as line 65; ensure fetch completes and loading is cleared.
- **Verification**: Open Reviews; data or error; no infinite loader.

---

### Line 67 – Doctor Settings → Holidays: No “Add new holidays” after creating one

- **Status**: Pending
- **Root cause**: Same as line 37; Add button hidden when holidays exist.
- **Files to change**: `components/settings/HolidayManagementTab.jsx` (and settings page if it controls visibility).
- **Steps**: Same as line 37; always show “Add New Holiday” button.
- **Verification**: Add one holiday; “Add New Holiday” still visible.

---

## Inside Manager Dashboard (PROBLEMS.md lines 70–73)

### Line 72 – Manager Patients: Add patient, fill form, Create button doesn’t create user

- **Status**: Pending
- **Root cause**: Same as line 62; create patient API not called or not successful for manager context.
- **Files to change**: Manager patients page or shared patient form (e.g. under `app/patients/` or role-specific).
- **Steps**: Ensure create patient is called with correct role/tenant; handle response and refetch.
- **Verification**: Manager → Patients → Add patient → Create; patient created.

---

### Line 73 – Manager Patients: Click patient row throws compile/runtime error

- **Status**: Pending
- **Root cause**: Same as line 48; row click uses wrong route or undefined variable.
- **Files to change**: Manager patients list component.
- **Steps**: Same as line 48; fix route and variables.
- **Verification**: Click patient row; detail page loads.

---

## Inside Super Admin Dashboard (PROBLEMS.md lines 75–104)

### Line 77 – Pending actions: “View all” throws “t is not defined”

- **Status**: Pending
- **Files to change**: `app/admin/page.jsx` (dashboard).
- **Steps**: Add `useI18n()` and use `t` for “View all” and related strings.
- **Verification**: Click View all; no “t is not defined”.

---

### Line 78 – Pending actions: Doctor verification box click throws “t is not defined”

- **Status**: Pending
- **Files to change**: `app/admin/page.jsx`.
- **Steps**: Same; ensure all dashboard strings use `t` and component has `useI18n()`.
- **Verification**: Click doctor verification; no “t is not defined”.

---

### Line 79 – System management: Database tool / View logs open inbuilt alert; use custom dialogue

- **Status**: Pending
- **Files to change**: `app/admin/page.jsx`.
- **Steps**: Replace `alert(...)` with `useConfirmation()` or toast as appropriate.
- **Verification**: Database tool / View logs; custom modal or toast.

---

### Line 80 – Clients: Update subscription (e.g. free trial) → Update button shows inbuilt alert

- **Status**: Pending
- **Files to change**: `app/admin/clients/page.jsx`.
- **Steps**: Replace `alert` with toast; use confirmation modal for destructive actions.
- **Verification**: Update subscription; toast/modal only.

---

### Line 81 – Clients: Remove access button shows inbuilt alert

- **Status**: Pending
- **Files to change**: `app/admin/clients/page.jsx`.
- **Steps**: Replace `confirm` with `useConfirmation().open(...)`; replace `alert` with toast.
- **Verification**: Remove access; confirmation modal then toast.

---

### Line 82 – Subscription plans: Create PayPal plan shows inbuilt alert

- **Status**: Pending
- **Files to change**: `app/admin/subscriptions/page.jsx`.
- **Steps**: Replace alerts with toast and confirmation modal where appropriate.
- **Verification**: Create PayPal plan; no browser alert.

---

### Line 83 – Subscription plans: Copy ID shows inbuilt alert

- **Status**: Pending
- **Files to change**: `app/admin/subscriptions/page.jsx`.
- **Steps**: Replace `alert('Plan ID copied...')` with `showSuccess(t('...'))`.
- **Verification**: Copy ID; toast only.

---

### Line 84 – Users: Activity logs button throws “t is not defined”

- **Status**: Pending
- **Files to change**: `app/admin/users/page.jsx` or activity logs link component.
- **Steps**: Add `useI18n()` and `t` for Activity logs and related labels.
- **Verification**: Click Activity logs; no “t is not defined”.

---

### Line 85 – Admin Patients → actions: View button throws “t is not defined”

- **Status**: Pending
- **Files to change**: `app/admin/patients/page.jsx`.
- **Steps**: Add `useI18n()` in the component that renders the actions (View, etc.).
- **Verification**: Click View; no “t is not defined”.

---

### Line 86 – Admin Patients → actions: Activity log button throws “t is not defined”

- **Status**: Pending
- **Files to change**: `app/admin/patients/page.jsx`.
- **Steps**: Same as above.
- **Verification**: Click Activity log; no “t is not defined”.

---

### Line 87 – Admin Patients → Unflag shows inbuilt alert; use dialogue

- **Status**: Pending
- **Files to change**: `app/admin/patients/page.jsx`.
- **Steps**: Replace `confirm`/`alert` with `useConfirmation()` and toast.
- **Verification**: Unflag; confirmation modal and toast.

---

### Line 88 – Admin Patients → Delete shows inbuilt alert; use dialogue

- **Status**: Pending
- **Files to change**: `app/admin/patients/page.jsx`.
- **Steps**: Same; use confirmation modal for delete.
- **Verification**: Delete; confirmation modal then toast.

---

### Line 89 – Admin Patients → Patient Management search: typing in Tenant ID refreshes on each character

- **Status**: Pending
- **Root cause**: Search input is uncontrolled and form submit or effect runs on every keystroke; or search triggers full page reload.
- **Files to change**: `app/admin/patients/page.jsx` (search/filter section).
- **Steps**:
  1. Use controlled input for Tenant ID; debounce the search (e.g. 300–400 ms) so API is called after user stops typing, not on every key.
  2. Do not submit form or reload on each change; only trigger filter/search via debounced callback.
- **Verification**: Type in Tenant ID; no refresh; results update after a short delay.

---

### Line 90 – Admin Patients → Search: Exact name from table still shows “No patients found”

- **Status**: Pending
- **Root cause**: Search API or front-end filter is case-sensitive, or searches different field (e.g. ID instead of name), or backend doesn’t match full name.
- **Files to change**: `app/admin/patients/page.jsx`, API for admin patients list (e.g. search query param).
- **Steps**:
  1. Ensure search param is sent to API and API searches name (and optionally ID) with case-insensitive match; or implement client-side filter that matches name (trim, case-insensitive).
  2. If backend search exists, verify it includes `firstName`, `lastName`, and proper indexing.
- **Verification**: Copy exact name from table, paste in search; that patient appears.

---

### Line 91 – Admin Appointments: Analytics button throws “t is not defined”

- **Status**: Pending
- **Files to change**: `app/admin/appointments/page.jsx` or analytics link.
- **Steps**: Add `useI18n()` and use `t` for Analytics and related strings.
- **Verification**: Click Analytics; no “t is not defined”.

---

### Line 92 – Admin Appointments: Download report shows “failed to download” toast

- **Status**: Pending
- **Root cause**: Download endpoint returns error or wrong format; or front-end doesn’t handle blob/response correctly.
- **Files to change**: `app/admin/appointments/page.jsx` (download handler), API that generates report (e.g. CSV/Excel).
- **Steps**:
  1. Ensure API returns file with correct `Content-Disposition` and body; front-end uses `response.blob()` and creates object URL for download.
  2. Handle API errors and show toast with server message if available.
- **Verification**: Click Download report; file downloads or clear error toast.

---

### Line 93 – Admin Appointments: First box (Booking ID, status, type, Apply) has CSS problem

- **Status**: Pending
- **Files to change**: `app/admin/appointments/page.jsx` and related CSS.
- **Steps**: Inspect filter box layout; fix flex/grid, padding, alignment so labels and Apply button display correctly.
- **Verification**: Filter box looks correct on desktop and mobile.

---

### Line 94 – Admin Appointments: From/To date – changing month auto-applies filter; should apply only after date selected

- **Status**: Pending
- **Root cause**: Date picker or change handler triggers filter on month change instead of only on date selection.
- **Files to change**: `app/admin/appointments/page.jsx` (date inputs and filter logic).
- **Steps**:
  1. Use date inputs that emit change only when user selects a day (not when navigating months); or ignore intermediate state when only month changed.
  2. Apply filter only when both From and To have valid dates and user has committed (e.g. blur or Apply click).
- **Verification**: Change month in From/To; filter does not run until a date is selected (and optionally Apply clicked).

---

### Line 95 – Admin Appointments: Cancel button shows inbuilt alert; use custom dialogue

- **Status**: Pending
- **Files to change**: `app/admin/appointments/page.jsx`.
- **Steps**: Replace `confirm` with `useConfirmation().open(...)` for cancel appointment.
- **Verification**: Cancel; confirmation modal and toast.

---

### Line 96 – Admin Doctors: First box (Search, verification status, Apply) has CSS problem

- **Status**: Pending
- **Files to change**: `app/admin/doctors/page.jsx` and CSS.
- **Steps**: Same approach as line 93; fix layout of filter box.
- **Verification**: Filter box displays correctly.

---

### Line 97 – Create Admin Account: After filling and clicking Create, “Unexpected token '<', "<!DOCTYPE "... is not valid JSON”

- **Status**: Pending
- **Root cause**: Same as line 36; API returns HTML instead of JSON (wrong URL or server error).
- **Files to change**: `app/admin/create-admin/page.jsx`, API route for creating admin (e.g. `POST /api/users` or create-admin).
- **Steps**:
  1. Ensure form posts to correct API; API returns `NextResponse.json(...)`; handle 4xx/5xx with JSON body or show generic error from response.
- **Verification**: Create admin; success or JSON error in toast.

---

### Line 98 – Content → Specialty Management: Manage button throws “t is not defined”

- **Status**: Pending
- **Files to change**: `app/admin/content/specialties/page.jsx`.
- **Steps**: Add `useI18n()` and use `t` for Manage and related strings.
- **Verification**: Click Manage; no “t is not defined”.

---

### Line 99 – Financial: Revenue dashboard / Payment disputes “Open” throws “t is not defined”

- **Status**: Pending
- **Files to change**: `app/admin/financial/revenue/page.jsx`, `app/admin/financial/disputes/page.jsx`, or dashboard links.
- **Steps**: Add `useI18n()` and `t` where needed.
- **Verification**: Click Open; no “t is not defined”.

---

### Line 100 – Sidebar: Analytics tab throws “t is not defined”

- **Status**: Pending
- **Files to change**: `components/layout/Sidebar.jsx` or admin layout that renders Analytics link.
- **Steps**: Ensure sidebar has access to `t` (e.g. `useI18n()` in Sidebar or parent) and all nav labels use `t('...')`.
- **Verification**: Click Analytics in sidebar; no “t is not defined”.

---

### Line 101 – Sidebar: Activity logs tab throws “t is not defined”

- **Status**: Pending
- **Files to change**: Same as line 100.
- **Steps**: Same; ensure Activity logs label uses `t` from a component that has `useI18n()`.
- **Verification**: Click Activity logs; no “t is not defined”.

---

### Line 102 – Settings & configuration: General setting / Security setting “Configure” throws “t is not defined”

- **Status**: Pending
- **Files to change**: Admin settings or configuration page that renders these boxes.
- **Steps**: Add `useI18n()` and use `t` for Configure and related strings.
- **Verification**: Click Configure; no “t is not defined”.

---

### Line 103 – Left panel → Account → Settings: Profile tab default; clicking Clinic info (or Compliance, etc.) switches back to Profile

- **Status**: Pending
- **Root cause**: Same as line 64; tab state not persisted or gets reset.
- **Files to change**: Settings page (and any wrapper that might re-mount or reset state).
- **Steps**: Same as line 64; persist tab in URL or stable state; avoid resetting to profile on tab click.
- **Verification**: Click Clinic info (or Compliance, etc.); that tab stays active.

---

## Summary checklist

- **“t is not defined”**: Add `const { t } = useI18n();` in the component that uses `t(...)` (or pass `t` via props). Ensure that component is under `I18nProvider`.
- **“user is not defined”**: Add `const { user } = useAuth();` and guard with `user?.` where needed.
- **Unexpected token '<', "<!DOCTYPE "...**: API returning HTML; fix route and ensure API returns `NextResponse.json(...)`.
- **Inbuilt alert/confirm**: Replace with `useConfirmation().open(...)` and `showSuccess` / `showError` from `@/lib/utils/toast`; ensure `ConfirmationProvider` and toast provider are in the app tree.
- **Add New X button missing after first add**: Show “Add New” button whenever the list is shown; use state only to show/hide the form.

Use this guide together with `PROBLEMS.md`; tick off items in PROBLEMS.md as you implement each fix and verify per the steps above.

---

## Coverage index (PROBLEMS.md line → Guide section)

Every actionable line in PROBLEMS.md is covered exactly once:

| PROBLEMS.md line | Section in this guide | Topic                                    |
| ---------------- | --------------------- | ---------------------------------------- |
| 9                | Line 9                | Language switcher overlay CSS            |
| 10               | Line 10               | Spinner/loading gap (Done)               |
| 11               | Line 11               | See it in Action buttons                 |
| 12               | Line 12               | Support "Still Need help?" visible       |
| 13               | Line 13               | Documentation View docs (ask first)      |
| 14               | Line 14               | Pricing ctaLabel error                   |
| 15               | Line 15               | Hydration error                          |
| 20               | Line 20               | Updates available → toast                |
| 21               | Line 21               | Navbar search "t is not defined"         |
| 22               | Line 22               | Notification overlay blur                |
| 23               | Line 23               | Dashboard loader (confirm first)         |
| 24               | Line 24               | Appointments availability "t"            |
| 25               | Line 25               | Queue empty (confirm first)              |
| 26               | Line 26               | Patients Book appointment "t"            |
| 27               | Line 27               | Staff role CSS                           |
| 28               | Line 28               | Invoice Mark paid → dialogue             |
| 29               | Line 29               | Invoice Edit "user"                      |
| 30               | Line 30               | Invoice Delete → dialogue                |
| 31               | Line 31               | Inventory batch/expiry/supplier          |
| 32               | Line 32               | Reports Generate report                  |
| 33               | Line 33               | Telemedicine Book Appointment "t"        |
| 34               | Line 34               | Telemedicine Book Video "t"              |
| 35               | Line 35               | Settings Profile edit button             |
| 36               | Line 36               | Create manager JSON error                |
| 37               | Line 37               | Holidays Add New button                  |
| 38               | Line 38               | Subscription cancel → dialogue           |
| 39               | Line 39               | Subscription all alerts → dialogue/toast |
| 40               | Line 40               | Add patient country code                 |
| 41               | Line 41               | Locations edit + refresh persist         |
| 42               | Line 42               | API docs Copy → toast                    |
| 43               | Line 43               | Branding save → toast                    |
| 44               | Line 44               | White label save → toast                 |
| 45               | Line 45               | Prescription Primary Diagnosis dropdown  |
| 46               | Line 46               | Prescription Advice "t"                  |
| 47               | Line 47               | Prescription item dropdown under table   |
| 48               | Line 48               | Patients row click error                 |
| 51               | Line 51               | Doctor Pending tasks CSS                 |
| 52               | Line 52               | Quick action Appointment "t"             |
| 53               | Line 53               | Profile Save profile                     |
| 54               | Line 54               | Clinic details Add/Save                  |
| 55               | Line 55               | Fees Save fees                           |
| 56               | Line 56               | Schedule day names                       |
| 57               | Line 57               | Schedule Save schedule                   |
| 58               | Line 58               | Manage leaves 404                        |
| 59               | Line 59               | Emergency/block slots persist            |
| 60               | Line 60               | Appointments Month button                |
| 61               | Line 61               | Appointments New appointment "t"         |
| 62               | Line 62               | Doctor add patient not created           |
| 63               | Line 63               | Doctor invoice Edit "user"               |
| 64               | Line 64               | Doctor Settings tab switch               |
| 65               | Line 65               | Earnings loading                         |
| 66               | Line 66               | Reviews loading                          |
| 67               | Line 67               | Doctor Holidays Add New                  |
| 72               | Line 72               | Manager add patient not created          |
| 73               | Line 73               | Manager patient row click                |
| 77               | Line 77               | Super admin View all "t"                 |
| 78               | Line 78               | Doctor verification "t"                  |
| 79               | Line 79               | Database/View logs → dialogue            |
| 80               | Line 80               | Clients update subscription → dialogue   |
| 81               | Line 81               | Clients Remove access → dialogue         |
| 82               | Line 82               | Create PayPal plan → dialogue            |
| 83               | Line 83               | Copy ID → toast                          |
| 84               | Line 84               | Users Activity logs "t"                  |
| 85               | Line 85               | Patients View "t"                        |
| 86               | Line 86               | Patients Activity log "t"                |
| 87               | Line 87               | Patients Unflag → dialogue               |
| 88               | Line 88               | Patients Delete → dialogue               |
| 89               | Line 89               | Search Tenant ID refresh on each char    |
| 90               | Line 90               | Search exact name no results             |
| 91               | Line 91               | Appointments Analytics "t"               |
| 92               | Line 92               | Download report failed                   |
| 93               | Line 93               | Appointments filter box CSS              |
| 94               | Line 94               | From/To date month change filter         |
| 95               | Line 95               | Appointments Cancel → dialogue           |
| 96               | Line 96               | Doctors filter box CSS                   |
| 97               | Line 97               | Create admin JSON error                  |
| 98               | Line 98               | Content Manage "t"                       |
| 99               | Line 99               | Financial Open "t"                       |
| 100              | Line 100              | Sidebar Analytics "t"                    |
| 101              | Line 101              | Sidebar Activity logs "t"                |
| 102              | Line 102              | Settings Configure "t"                   |
| 103              | Line 103              | Account Settings tab switch              |

**Total: 82 actionable items** (lines 1–8 and section headers in PROBLEMS.md are not actionable). All 82 are covered in this guide. No need to check again for coverage.

---

## Part 2: Consolidated reference (from Claude AI suggestions)

### Project context

Medical clinic management system with multiple user roles (Admin, Doctor, Manager, SuperAdmin). Next.js (App Router), JavaScript (no TypeScript). Use `useI18n()` from `@/contexts/I18nContext` for `t`, `useAuth()` from `@/contexts/AuthContext` for `user`, and `useConfirmation()` from `@/contexts/ConfirmationContext` for dialogs. Toasts: `showSuccess` / `showError` from `@/lib/utils/toast`.

### Quick reference by error type

Use the **line-by-line sections above** for full steps. This table maps error types to PROBLEMS.md lines:

| Error / issue                             | Fix pattern                                                                              | Lines in this guide                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **'t' is not defined**                    | Add `const { t } = useI18n();` in the component that uses `t(...)`.                      | 21, 24, 26, 33, 34, 46, 52, 61, 77, 78, 84, 85, 86, 91, 98, 99, 100, 101, 102 |
| **'user' is not defined**                 | Add `const { user } = useAuth();` and guard with `user?.`.                               | 29, 63                                                                        |
| **Unexpected token '<', "<!DOCTYPE "...** | API returning HTML; fix route and ensure API returns `NextResponse.json(...)`.           | 36, 97                                                                        |
| **ctaLabel is not defined**               | Use `ctaText` only in `SubscriptionCard`; pass `ctaText={...}` from pages.               | 14                                                                            |
| **Hydration error**                       | Align server/client render; use `suppressHydrationWarning` or mount-only client content. | 15                                                                            |
| **alert() / confirm()**                   | Replace with `useConfirmation().open({ title, message, onConfirm })` and toast.          | 28, 30, 38, 39, 42, 43, 44, 79, 80, 81, 82, 83, 87, 88, 95                    |
| **Tab switches back to Profile**          | Persist active tab in URL or state; avoid reset on click.                                | 64, 103                                                                       |
| **Add New X button missing**              | Always show “Add New” button; use state only to show/hide form.                          | 37, 67                                                                        |
| **Data not persisting**                   | Ensure API accepts and returns fields; refetch or update state after save.               | 31, 41, 59, 53, 54, 55, 57                                                    |
| **Search/filter issues**                  | Debounce search; apply date filter only on date select (not month change).               | 89, 90, 94                                                                    |

---

## CRITICAL ERRORS (Fix First) – see line-by-line sections above for steps

**How to fix:** For each error type, use the **Quick reference by error type** table and the **line-by-line sections** in Part 1. This project uses **JavaScript** (no TypeScript), `useI18n()` from `@/contexts/I18nContext` (not next-i18next), `useAuth()` from `@/contexts/AuthContext` (not useUser/next-auth), and `useConfirmation()` from `@/contexts/ConfirmationContext` for dialogs. API routes live under `app/api/`.

---

## Code snippets and how to fix (Claude suggestions)

Below are **concrete code examples** for common fixes. Use with the **line-by-line sections** and **Files to change** in Part 1. All snippets are **JavaScript** and aligned with this project (e.g. `useConfirmation`, `showSuccess`/`showError` from `@/lib/utils/toast`).

### 1. Hydration error (server/client mismatch)

**When:** After hard refresh, console shows "Hydration failed because initial UI does not match server".

```javascript
// Option A: Client-only render after mount
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
// ... render client-only content

// Option B: Suppress where content legitimately differs
<div suppressHydrationWarning>{clientOnlyContent}</div>;
```

---

### 2. API returns HTML instead of JSON ("Unexpected token '<', '<!DOCTYPE'...")

**When:** Create Manager/Admin or other API call gets 404/500 HTML page.

```javascript
const response = await fetch('/api/managers/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

if (!response.ok) {
  const text = await response.text();
  console.error('API Error:', text);
  throw new Error('Failed to create manager');
}
const data = await response.json();
```

---

### 3. ctaLabel is not defined (pricing/subscription)

**When:** Clicking price tag or subscription CTA.

```javascript
// In SubscriptionCard.jsx – use ctaText only; support ctaLabel as fallback
const { ctaText = ctaLabel ?? 'Get Started', ...rest } = props;

// In pricing/subscription pages – always pass ctaText
<SubscriptionCard ctaText={t('pricing.getStarted')} ... />
```

---

### 4. Language switcher / notification overlay (z-index, blur, escape)

**Language overlay:** Ensure dropdown has high `z-index` (e.g. 10060) and parent has `overflow: visible`.

**Notification overlay (blur, escape, scroll):**

```javascript
// Close on Escape
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeNotification();
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [closeNotification]);

// Prevent body scroll when open
useEffect(() => {
  if (notificationOpen) {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }
}, [notificationOpen]);
```

---

### 5. Replace alert() / confirm() with custom dialog

**Use:** `useConfirmation()` from `@/contexts/ConfirmationContext` and toasts from `@/lib/utils/toast`.

```javascript
// In component
const { confirm } = useConfirmation();
const { showSuccess, showError } = require('@/lib/utils/toast'); // or your toast helper

// Before: if (confirm('Are you sure?')) deleteItem();
// After:
const handleDelete = async () => {
  const ok = await confirm({
    title: t('common.confirmDelete'),
    message: t('common.cannotUndo'),
  });
  if (!ok) return;
  try {
    await deleteItem();
    showSuccess(t('common.deleted'));
  } catch (e) {
    showError(e.message || t('common.error'));
  }
};
```

---

### 6. Toast for success/error (no built-in alert)

```javascript
import { showSuccess, showError } from '@/lib/utils/toast';

showSuccess(t('common.saved'));
showError(t('common.saveFailed'));

// After refresh/revalidate (e.g. Updates available → Refresh)
mutate();
showSuccess(t('common.refreshed'));
```

---

### 7. Form submit – save profile / create patient

**Save profile (e.g. Doctor/Manager):**

```javascript
const handleSaveProfile = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await fetch('/api/profile/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      showSuccess(t('common.saved'));
    } else {
      const err = await res.json().catch(() => ({}));
      showError(err.message || t('common.saveFailed'));
    }
  } catch (err) {
    showError(err.message || t('common.saveFailed'));
  } finally {
    setLoading(false);
  }
};

<form onSubmit={handleSaveProfile}>
  {/* fields */}
  <button type='submit'>{t('common.save')}</button>
</form>;
```

**Create patient:**

```javascript
const handleCreatePatient = async (data) => {
  const res = await fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create patient');
  }
  showSuccess(t('patients.created'));
  mutate(); // or refetch list
  closeModal();
};
```

---

### 8. API error handling (always parse JSON safely)

```javascript
const res = await fetch(url, options);
const text = await res.text();
let data;
try {
  data = text ? JSON.parse(text) : null;
} catch {
  console.error('API returned non-JSON:', text);
  throw new Error(res.status === 404 ? 'Not found' : 'Request failed');
}
if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
return data;
```

---

### 9. Data persistence (inventory, locations, schedule slots)

- **Form:** Include all fields in state and in the request body (e.g. `batchNo`, `expiryDate`, `supplier`).
- **After save:** Refetch or update local state from API response so the UI shows saved data.
- **Slots/locations:** Persist via API (POST/PUT), then refetch; do not rely only on local state.

```javascript
// Example: update then refetch
const handleUpdate = async () => {
  const res = await fetch(`/api/inventory/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  if (!res.ok) throw new Error('Update failed');
  showSuccess(t('common.saved'));
  mutate(); // or refetch list/item
};
```

---

### 10. "See it in Action" / "View Docs" buttons

```javascript
// See it in Action – navigate or scroll
<Button onClick={() => router.push('/dashboard')}>See it in Action</Button>
// or scroll: document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });

// View Docs – choose one after product confirmation
<a href="https://docs.example.com" target="_blank" rel="noopener noreferrer">View Docs</a>
// or: <Link href="/documentation">View Docs</Link>
```

---

### 11. Generate report (download file)

```javascript
const handleGenerateReport = async () => {
  setLoading(true);
  try {
    const res = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters, dateRange }),
    });
    if (!res.ok) throw new Error('Failed to generate report');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${Date.now()}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
    showSuccess(t('reports.generated'));
  } catch (err) {
    showError(err.message || t('common.error'));
  } finally {
    setLoading(false);
  }
};
```

---

### 12. Debounced search (avoid request on every keystroke)

```javascript
// If you have useDebouncedValue in hooks:
const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebouncedValue(searchInput, 400);

useEffect(() => {
  if (debouncedSearch) fetchPatients({ search: debouncedSearch });
}, [debouncedSearch]);
```

---

### 13. Tab navigation (persist active tab – e.g. Settings)

```javascript
// URL-based (recommended so tab survives refresh)
const searchParams = useSearchParams();
const activeTab = searchParams.get('tab') || 'profile';

const handleTabChange = (tab) => {
  router.push(`/settings?tab=${tab}`);
};

// Ensure tab links use handleTabChange (or Link with ?tab=...) so state/URL updates correctly
```

---

### 14. Patient row click (safe navigation)

```javascript
const handlePatientClick = (patient) => {
  if (!patient?.id) return;
  try {
    router.push(`/patients/${patient.id}`);
  } catch (err) {
    console.error(err);
    showError(t('common.error'));
  }
};

// In list: onClick={() => handlePatientClick(patient)}
```

---

### 15. Weekly schedule day names

```javascript
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// or locale: new Date(0).toLocaleDateString(locale, { weekday: 'short' }) in a loop
```

---

### 16. Prescription dropdown under table (portal / popper)

- Ensure the Select/dropdown uses a **portal** (renders outside table) or **popper** with `avoidCollisions`.
- In your UI library, use something like: `position="popper"`, `side="bottom"`, `avoidCollisions={true}` so the menu flips and is not clipped by table overflow.

---

### 17. Date filter (do not apply on month change)

- Keep **temporary** date in state while user picks in calendar.
- Apply filter only on "Apply" click or explicit "Search", not on every month change.

```javascript
const [tempFrom, setTempFrom] = useState(null);
const [appliedFrom, setAppliedFrom] = useState(null);

<DatePicker value={tempFrom} onChange={setTempFrom} />
<Button onClick={() => { setAppliedFrom(tempFrom); fetchFilteredData(tempFrom, tempTo); }}>Apply</Button>
```

---

## ITEMS REQUIRING CLIENT CONFIRMATION

### 1. View Docs Button

**Question:** Where should "View Docs" in Support Center link to?
**Options:**

- External documentation site
- Internal help pages
- Downloadable PDF
- Help modal/slideout

### 2. Loading Indicators

**Question:** Should all dashboard clicks show a loader?
**Concern:** May impact UX if unnecessary
**Recommendation:** Only show loader for:

- API calls
- Navigation between routes
- Data fetching
- Not for client-side interactions (modals, tabs, etc.)

### 3. Queue Tab

**Question:** Queue is empty - is this intentional or should it have sample data?
**Action:** Review with client if this feature is implemented

### 4. Branding/White Label Save Feedback

**Question:** Toast or Dialog box for save confirmation?
**Recommendation:** Use Toast for success, Dialog only for errors

---

## TESTING CHECKLIST

### Before Deployment

- [ ] All 't is not defined' errors resolved
- [ ] All 'user is not defined' errors resolved
- [ ] Hydration errors fixed
- [ ] All alert() replaced with custom dialogs
- [ ] All forms submit correctly
- [ ] Data persistence verified (slots, locations, inventory)
- [ ] Loading states have timeout fallbacks
- [ ] Search functionality works (debounced, case-insensitive)
- [ ] Dropdowns work (especially in tables)
- [ ] Calendar/date pickers functional
- [ ] Tab navigation works correctly
- [ ] CSS issues resolved (overlays, dropdowns, filters)
- [ ] Toast notifications implemented
- [ ] Country code selection works
- [ ] API endpoints return JSON (not HTML errors)

### Test All User Roles

- [ ] Admin dashboard - all features
- [ ] Doctor dashboard - all features
- [ ] Manager dashboard - all features
- [ ] SuperAdmin dashboard - all features

### Browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile responsive

---

## PRIORITY ORDER

**P0 (Critical - Fix Immediately):**

1. 't is not defined' errors (breaks core functionality)
2. 'user is not defined' (blocks invoice editing)
3. API JSON errors (blocks account creation)
4. Form submit issues (patients, profile, schedule)
5. Hydration errors

**P1 (High - Fix Soon):**

1. Replace alert() with dialogs
2. Data persistence issues
3. Loading states
4. Search functionality
5. Tab navigation

**P2 (Medium - Fix This Sprint):**

1. CSS issues (overlays, dropdowns)
2. Missing UI elements
3. Toast notifications
4. Country code selection

**P3 (Low - Nice to Have):**

1. Add loading indicators to all clicks (if confirmed)
2. Calendar month button
3. UI polish

---

## CURSOR AI COMMANDS

Use these prompts in Cursor AI:

```
Fix all instances of 't is not defined' error by adding proper i18n imports
```

```
Replace all alert() and confirm() calls with AlertDialog component
```

```
Add proper error handling to all API calls with try-catch
```

```
Implement data persistence for schedule slots and locations
```

```
Fix hydration errors by ensuring consistent server/client rendering
```

```
Add debounced search functionality to patient search
```

```
Implement toast notifications for all form submissions
```

---

## FILE STRUCTURE TO CHECK

```
/contexts
  I18nContext.jsx             # useI18n() → t()
  AuthContext.jsx             # useAuth() → user, logout
  ConfirmationContext.jsx     # useConfirmation() → dialogs

/hooks
  (useDebouncedValue or similar)  # For search debouncing

/app/api
  /managers/create/route.js   # Check exists
  /admin/create/route.js      # Check exists (or under /api/admin)
  /patients/route.js          # Create/list patients
  /profile/update (or settings)    # Check exists
  /earnings, /reviews         # Doctor dashboard APIs
```

---

## COMPLETION CRITERIA

**Definition of Done:**

- All P0 bugs fixed and tested
- All forms submit successfully
- All alert() replaced with dialogs
- All loading states have timeouts
- No console errors on any dashboard
- Data persists after refresh
- All user roles tested
- Mobile responsive verified

---

**Document Created:** For Cursor AI Bug Fixing  
**Total Issues:** 80+  
**Estimated Time:** 2-3 weeks for full resolution  
**Priority:** Production-blocking issues exist (P0)
