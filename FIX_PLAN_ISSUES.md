# Fix Plan – Issues & Line-Wise Resolution

> **Status:** Complete (all 30 items resolved)  
> **Created:** 2025-02-12  
> **Scope:** Website, Dashboard, Super Admin Dashboard

---

## 1. WEBSITE

### 1.1 Website language – last language not enabled properly

- **Issue:** Three languages exist but the third is not enabled correctly
- **Fix plan:**
  1. Identify the third language in `apps/website` i18n/locale config
  2. Check `next.config.js` or locale middleware for enabled locales
  3. Add the third locale to the active locales array
  4. Ensure language switcher includes and switches to it

### 1.2 Pricing section – unable to load pricing

- **Issue:** Pricing section shows "unable to load pricing"
- **Fix plan:**
  1. Find pricing API call in `apps/website` (e.g. `/api/subscription-plans` or similar)
  2. Add error handling and loading states
  3. Ensure API route exists and returns data for public/unauthenticated access
  4. Add fallback UI when API fails

### 1.3 Support option missing in navigation

- **Issue:** No Support link in nav; Support only reachable via Home/Support/Contact
- **Fix plan:**
  1. Locate website nav component (header/navbar)
  2. Add "Support" as a direct nav item linking to `/support`
  3. Ensure Contact lives under Support (e.g. `/support/contact`) or both are clearly accessible

---

## 2. DASHBOARD (Clinic)

### 2.1 Runtime error – `Cannot read properties of undefined (reading 'call')`

- **Issue:** Error on Dashboard, Appointments, Prescriptions
- **Fix plan:**
  1. Search for `.call` usage in dashboard/appointments/prescriptions pages and related components
  2. Likely Webpack/dynamic import or function reference – ensure call target exists before invoking
  3. Add null/undefined checks around dynamic imports and event handlers

### 2.2 Patient tab – Edit button leads to 404

- **Issue:** Edit in patient table actions throws error / "no page found", redirects to dashboard
- **Fix plan:**
  1. Check patient edit route (e.g. `/patients/[id]/edit` or `/patients/[id]`)
  2. Ensure ActionMenu edit action navigates to correct URL with valid patient ID
  3. Confirm route exists under `apps/clinic/app/patients/`

### 2.3 Reports – Generate Report not working, Print button CSS broken

- **Issue:** Generate Report does nothing; Print preview layout broken
- **Fix plan:**
  1. Reports page: verify `fetchRevenueReport` / `fetchPatientReport` etc. on Generate click
  2. Ensure date range and API params are passed correctly
  3. Print: add `@media print` rules to hide sidebar/nav; use `printLayout` or `no-print` classes
  4. Wrap report content in a print-only container that excludes layout chrome

### 2.4 Consultation summary print – sidebar visible in print

- **Issue:** Left sidebar appears in printed consultation summary
- **Fix plan:**
  1. Find consultation summary print component/template
  2. Add `@media print { .sidebar, nav, header { display: none; } }` or equivalent
  3. Use `PRINT_LAYOUT` pattern (no nav) for print view

### 2.5 Settings – Edit Profile button not working

- **Issue:** Edit Profile in Settings profile section does nothing
- **Fix plan:**
  1. Locate ProfileTab or settings profile section
  2. Wire Edit Profile button to open edit form/modal or navigate to edit route
  3. Ensure onClick handler is attached and not overridden

### 2.6 Email input – "g" key opens appointment or doesn’t type

- **Issue:** In email field, pressing "g" after certain length opens appointment page or blocks input
- **Fix plan:**
  1. Check for global keyboard shortcut (e.g. `g` for appointments)
  2. Add guard: only trigger shortcut when focus is not inside input/textarea
  3. In `useAppKeyboardShortcuts` or similar: `if (document.activeElement?.tagName === 'INPUT' || 'TEXTAREA') return`

### 2.7 Settings – Location section – failed to fetch

- **Issue:** Submitting location form throws "failed to fetch"
- **Fix plan:**
  1. Verify API route for locations (e.g. `PUT /api/settings` with locations in body)
  2. Check CORS, auth headers, and request payload shape
  3. Ensure Tenant model and API accept `settings.locations`

### 2.8 Create Prescription – Patient input hidden/blocked

- **Issue:** Patient selector is hidden or blocked when creating prescription
- **Fix plan:**
  1. Inspect PrescriptionForm or new prescription page layout
  2. Fix z-index, overflow, or modal stacking so patient selector is visible
  3. Ensure PatientSelector is not inside a collapsed or obscured container

### 2.9 Prescription – Print/Download PDF same as print preview; Save draft validation errors

- **Issue:** Print and Download PDF both open print preview; Save draft fails with drugId and date validation
- **Fix plan:**
  1. Differentiate Print (window.print) vs Download PDF (generate PDF, trigger download)
  2. Implement proper PDF generation for download
  3. Save draft: ensure `items[0].drugId` is set and `followUpDate` is valid before submit; fix validation schema

### 2.10 Invoices – Unit price disabled when creating new invoice

- **Issue:** Unit price field is disabled in new invoice form
- **Fix plan:**
  1. Find invoice form (new invoice page or modal)
  2. Remove disabled prop from unit price input where appropriate
  3. Ensure unit price is editable for new line items

---

## 3. SUPER ADMIN DASHBOARD

### 3.1 Platform KPIs – Commission box cuts off, no scroll

- **Issue:** Commission box has CSS overflow; content cuts off, no scroll
- **Fix plan:**
  1. Locate Platform KPIs / commission card in admin dashboard
  2. Add `overflow-y: auto` or `overflow: visible` and `min-height` as needed
  3. Adjust grid/flex to prevent clipping

### 3.2 Appointments – Action column; only Cancel works

- **Issue:** Most actions in appointments table fail; only Cancel works
- **Fix plan:**
  1. Check ActionsMenu items and their onClick handlers
  2. Ensure each action (View, Edit, Reschedule, etc.) has correct handler and route
  3. Verify API routes exist for each action

### 3.3 Activity logs – Email and Export CSV buttons have no icons

- **Issue:** Email and Export CSV buttons lack icons and are hard to see
- **Fix plan:**
  1. Add MailIcon and FileDownIcon (or similar) to these buttons
  2. Align styling with other action buttons

### 3.4 Settings – Changes don’t reflect until hard refresh

- **Issue:** Admin settings changes require hard refresh to appear
- **Fix plan:**
  1. After successful PUT/PATCH, call `refreshFeatures` or refetch settings
  2. Invalidate React Query cache or trigger revalidate for settings
  3. Ensure success handler updates local state or refetches

### 3.5 Search bar – doesn’t search properly

- **Issue:** Search behaves incorrectly
- **Fix plan:**
  1. Verify search term is passed to API (e.g. `?search=...`)
  2. Check backend search logic (regex, field coverage)
  3. Add debounce if missing; ensure onSearch triggers with correct params

### 3.6 Profile – Edit Profile not working; Sign out no confirmation

- **Issue:** Edit Profile not clickable; Sign out works but no "Are you sure?" dialog
- **Fix plan:**
  1. Same as 2.5: wire Edit Profile button correctly
  2. Add confirmation modal/dialog before sign out: "Are you sure you want to sign out?"

### 3.7 Plan update – No confirmation; needs hard refresh

- **Issue:** Updating plan doesn’t ask "Are you sure?"; changes need hard refresh
- **Fix plan:**
  1. Add confirmation modal before plan update submit
  2. On success, refetch subscription/plans and update UI without full reload

### 3.8 New plan – No success toast

- **Issue:** Creating new plan shows no success toast
- **Fix plan:**
  1. After successful plan creation, call `showSuccess(t('admin.planCreated')` or equivalent)
  2. Ensure toast is imported and invoked in success handler

### 3.9 Create Admin – "Tenant ID is required" error

- **Issue:** Create admin fails with "Tenant ID is required when creating clinic admin"; no tenant field in form
- **Fix plan:**
  1. For Super Admin creating clinic admin: either pre-select tenant or add tenant selector
  2. Ensure API accepts tenantId from context (e.g. impersonation) or from form
  3. Add tenant dropdown if creating admin for a specific clinic

### 3.10 No "Create Manager Account" in Super Admin dashboard

- **Issue:** Super Admin cannot create manager account
- **Fix plan:**
  1. Add nav item and route for Create Manager (e.g. `/admin/users/create-manager`)
  2. Reuse or adapt clinic create-manager flow for Super Admin with tenant selector

### 3.11 Create Admin – "g" key opens appointment

- **Issue:** Same as 2.6: pressing "g" in email input opens appointment
- **Fix plan:** Same as 2.6 – exclude inputs from global "g" shortcut.

### 3.12 Dashboard – Users option – `filteredUsers` before initialization

- **Issue:** Clicking Users in Quick/Management throws `ReferenceError: Cannot access 'filteredUsers' before initialization`
- **Fix plan:**
  1. Find dashboard Users link and target component
  2. Declare `filteredUsers` before use (move declaration above usage)
  3. Ensure no circular dependency or use-before-definition

### 3.13 Fallback UI – "Go to Dashboard" wrong redirect for Super Admin

- **Issue:** When Super Admin clicks "Go to Dashboard", redirects to Clinic dashboard instead of Admin
- **Fix plan:**
  1. Find fallback/error UI with "Go to Dashboard" button
  2. Check user role: if `super_admin` → `/admin`, else → `/dashboard`

### 3.14 Content – Blog/Article – update/delete error `reading 'id'`

- **Issue:** Update/delete fails with `Cannot read properties of undefined (reading 'id')`
- **Fix plan:**
  1. Ensure row/item passed to update/delete has `id` or `_id`
  2. Use `item?.id ?? item?._id` in handler
  3. Fix API to accept correct identifier

### 3.15 FAQ – update/delete error `reading 'id'`

- **Issue:** Same as 3.14 for FAQ
- **Fix plan:** Same pattern – ensure item has `id`/`_id` before calling update/delete.

### 3.16 Banner Management – update/delete error `reading 'id'`

- **Issue:** Same as 3.14 for Banners
- **Fix plan:** Same pattern – ensure item has `id`/`_id` before calling update/delete.

### 3.17 Analytics – Export fails

- **Issue:** Export icon throws "Failed to export"
- **Fix plan:**
  1. Check analytics export API (CSV/PDF)
  2. Ensure route exists and returns correct content-type and filename
  3. Add proper error handling and user feedback

---

## Summary Table

| #    | Area       | Issue                              | Priority |
| ---- | ---------- | ---------------------------------- | -------- |
| 1.1  | Website    | Third language not enabled         | Medium   |
| 1.2  | Website    | Pricing unable to load             | High     |
| 1.3  | Website    | No Support in nav                  | Medium   |
| 2.1  | Dashboard  | Runtime error (reading 'call')     | Critical |
| 2.2  | Dashboard  | Patient Edit 404                   | High     |
| 2.3  | Dashboard  | Reports Generate/Print             | High     |
| 2.4  | Dashboard  | Consultation print shows sidebar   | Medium   |
| 2.5  | Dashboard  | Edit Profile not working           | High     |
| 2.6  | Dashboard  | "g" key in email input             | Medium   |
| 2.7  | Dashboard  | Location failed to fetch           | High     |
| 2.8  | Dashboard  | Prescription patient input blocked | High     |
| 2.9  | Dashboard  | Prescription Print/PDF/Save draft  | High     |
| 2.10 | Dashboard  | Invoice unit price disabled        | High     |
| 3.1  | SuperAdmin | KPIs commission CSS                | Low      |
| 3.2  | SuperAdmin | Appointments actions               | High     |
| 3.3  | SuperAdmin | Activity logs button icons         | Low      |
| 3.4  | SuperAdmin | Settings need hard refresh         | Medium   |
| 3.5  | SuperAdmin | Search incorrect                   | Medium   |
| 3.6  | SuperAdmin | Profile edit + signout confirm     | Medium   |
| 3.7  | SuperAdmin | Plan update confirm + refresh      | Medium   |
| 3.8  | SuperAdmin | New plan no toast                  | Low      |
| 3.9  | SuperAdmin | Create Admin tenant error          | High     |
| 3.10 | SuperAdmin | No Create Manager                  | Medium   |
| 3.11 | SuperAdmin | "g" key in create admin            | Medium   |
| 3.12 | SuperAdmin | filteredUsers init error           | Critical |
| 3.13 | SuperAdmin | Fallback Dashboard redirect        | Medium   |
| 3.14 | SuperAdmin | Blog update/delete id              | High     |
| 3.15 | SuperAdmin | FAQ update/delete id               | High     |
| 3.16 | SuperAdmin | Banner update/delete id            | High     |
| 3.17 | SuperAdmin | Analytics export fails             | Medium   |

---

## Recommended Fix Order

1. **Critical:** 2.1 (runtime error), 3.12 (filteredUsers)
2. **High:** 1.2, 2.2, 2.3, 2.5, 2.7, 2.8, 2.9, 2.10, 3.2, 3.9, 3.14, 3.15, 3.16
3. **Medium:** 1.1, 1.3, 2.4, 2.6, 3.4, 3.5, 3.6, 3.7, 3.10, 3.11, 3.13, 3.17
4. **Low:** 3.1, 3.3, 3.8
