# Enterprise Loader Usage – Dashboard & App

Which loader type to use where. Use this so loading states are consistent across the app.

---

## Loader types (enterprise standard)

| Type      | Use for                         | Component / pattern                    | Message below logo |
|-----------|----------------------------------|----------------------------------------|--------------------|
| **page**  | Auth, initial route, redirects   | `<Loader type="page" text={t('common.loading')} />` | Yes (recommended) |
| **section** | Tab content, modal body, data block | `.tab-content-loading` + `<Loader type="section" text={} />` | Yes (recommended) |
| **inline**  | Card body, single widget       | `<Loader type="inline" />`             | Optional           |
| **button**  | Buttons (submit, action)       | `<CompactLoader />` inside button     | No                 |
| **skeleton** | Tables, card grids, list rows | `<TableSkeleton />`, `.skeleton`, `.skeleton-card` | N/A (no logo) |

---

## When to use which

### 1. Page loader (`type="page"`)

- **Where:** Full-screen while auth is resolving, or initial route load, or redirect (e.g. to login).
- **Props:** `fullScreen size="lg"` (or use `type="page"`). Always pass `text` (e.g. "Loading...", "Redirecting to login").
- **Example:**  
  `<Loader type="page" text={t('auth.redirectingToLogin')} />`  
  `<Loader fullScreen size="lg" text={t('common.loading')} />`

### 2. Section loader (`type="section"`)

- **Where:** Content area below tabs, inside a modal, or a single data block (e.g. report, list).
- **Props:** Inline, `size="md"`. Wrap in `.tab-content-loading` for min-height and centering.
- **Example:**  
  `<div className="tab-content-loading"><Loader type="section" text={t('reports.loadingReportData')} /></div>`

### 3. Inline loader (`type="inline"`)

- **Where:** Inside a card or a single widget (e.g. one dashboard card loading).
- **Props:** Inline, `size="sm"`. Optional `text`.

### 4. Button loader

- **Where:** Submit buttons, primary actions (save, submit, confirm).
- **Component:** `CompactLoader` from `@/components/ui/Loader` (no logo, small spinner).
- **Example:** Button shows `<CompactLoader size="sm" />` when `isLoading`.

### 5. Skeleton

- **Where:** Tables, card grids, list rows – when you want placeholder layout instead of a spinner.
- **Components / classes:**
  - Tables: `<TableSkeleton rows={5} cols={5} />`
  - Cards/lists: `.skeleton`, `.skeleton-card`, `.skeleton-list-item` (see dashboard.css / globals).
- **No logo;** use for perceived performance (layout stays stable).

---

## Shared CSS

- **`.tab-content-loading`** – Section loader wrapper: min-height, centered, padding (globals.css).
- **`.skeleton`**, **`.skeleton-card`** – Dashboard and list skeletons (dashboard.css / globals).

---

## Constants

- **`lib/constants/loader-usage.js`** – `LOADER_PRESETS`, `LOADER_MESSAGES`, `LOADER_USAGE_GUIDE`.
- Use `type` prop so presets stay consistent: `<Loader type="page" text={...} />`.

---

## Rules

1. **Page / auth / redirect:** Always use `type="page"` with i18n `text` (e.g. `t('common.loading')`, `t('auth.redirectingToLogin')`).
2. **Tab or modal content:** Use `type="section"` inside `.tab-content-loading` with optional i18n `text`.
3. **Buttons:** Use `CompactLoader` only (no full Loader with logo).
4. **Tables / grids / lists:** Prefer skeleton (TableSkeleton or skeleton classes) over spinner where it fits.
5. **One standard per context:** Don’t mix full-screen and inline for the same context (e.g. tab change always section, not full-screen).

---

## Accessibility (enterprise standard)

- **Loader:** All loaders expose `role="status"`, `aria-busy="true"`, `aria-live="polite"`. When `text` or `aria-label` is provided, it is used as `aria-label` for screen readers. The decorative spinner has `aria-hidden="true"`.
- **CompactLoader:** Has `role="status"`, `aria-label` (default `"Loading"`; pass `aria-label={t('common.loading')}` from Button for i18n), and `aria-busy="true"`. Button passes `aria-label={t('common.loading')}` to CompactLoader.
- **Section wrappers:** `.tab-content-loading` divs use `aria-busy="true"` and `aria-label` with the same message as the Loader inside.

## Implementation (project-wide, 100%)

- **App pages:** All full-screen loaders use `<Loader type="page" text={t('...')} />`. Section loaders (reports, inventory/lots, admin tables, telemedicine overlays) use `type="section"` with i18n where appropriate.
- **Layout / auth:** Layout, RequireAuth, ProtectedRoute use `type="page"` and i18n text.
- **Components:** PatientDetailsPanel, InvoicePrintPreview, CalendarPopup, FeatureGuard, HolidayManagementTab, GlobalSearch, NotificationCenter, PrescriptionPrintPreview, EnhancedCalendarView use `type="inline"` or `type="section"` with i18n text (no hardcoded strings).
- **Suspense fallbacks:** change-password, prescriptions/new, appointments/new, admin/doctors/verify use `<Loader type="page" text={t('common.loading')} />` (or a small wrapper that provides `t`).
- **Telemedicine:** Video call overlays (connecting, waiting room) use `<Loader type="section" variant="primary" />` (no raw `size`/`inline`).
- **i18n:** Loader messages use keys from `common.loading`, `common.loadingDetails`, `common.searching`, `common.creating`, `dashboard.loading`, `auth.redirectingToLogin`, `reports.loadingReportData`, `prescriptions.loadingPatientDetails`, `invoices.loadingInvoice`, `appointments.loadingAppointments`, `appointments.loadingSlots`, `appointments.loadingDoctors`, `telemedicine.connecting`, `telemedicine.establishingConnection`, `telemedicine.mayTakeFewSeconds`, `telemedicine.waitingFor*`, `telemedicine.waitingRoom`, `telemedicine.waitingRoomDescription`, `telemedicine.pleaseWait`, etc. No hardcoded fallbacks (e.g. no `|| 'Loading...'`). All keys present in en, ar, es, fr.
- **CompactLoader standalone:** When used outside Button (e.g. patients search, queue refresh), pass `aria-label={t('common.loading')}` or `aria-label={t('common.searching')}`.
- **Loader type="button":** When using `<Loader type="button" />`, `aria-label` is forwarded to CompactLoader.
