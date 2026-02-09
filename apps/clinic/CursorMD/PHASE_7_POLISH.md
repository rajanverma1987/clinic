# Phase 7: Polish & Launch

Implementation summary for Phase 7 (Polish) per `CLINIC_DASHBOARD_IMPLEMENTATION_PLAN.md`.

## 7.1 Mobile Responsive

- **Layout:** Mobile hamburger button (visible on `md:hidden`) in the top bar to open sidebar; touch target min 44px.
- **Sidebar:** Accepts `isMobileOpen` and `onMobileClose`. On viewport `max-md`:
  - Sidebar is `fixed`, full height, left; when closed (`!isMobileOpen`) uses `max-md:-translate-x-full`; when open uses `max-md:translate-x-0`.
  - Backdrop overlay (black/50) when open; click to close.
  - Close button inside sidebar (min 44px) for mobile.
- **Touch targets:** All sidebar nav links use `min-h-[44px]` for accessibility (44px minimum touch target).
- **Escape:** Layout closes mobile sidebar on Escape key.

## 7.2 Loading States

- **Loader:** Full-screen and inline `Loader` used across data views (admin patients, appointments, revenue, analytics, settings).
- **ChartCard:** Already has skeleton when `loading` or no data.
- **TableSkeleton:** New `components/ui/TableSkeleton.jsx` for table loading placeholder (rows/cols, shimmer). Use where table data is loading.

## 7.3 Error Handling

- **Toast:** `showError` / `showSuccess` from `@/lib/utils/toast` used on API errors and success across admin and dashboard pages.
- **API:** Responses follow `{ success, data, error }`; front-end shows error message from `response.error?.message` or generic message.

## 7.4 Form Validation

- **Client:** Admin settings security form clamps numeric fields (sessionTimeout 5–1440, passwordMinLength 6–32, failedLoginMaxAttempts 3–20, failedLoginLockoutMinutes 5–1440, auditLogRetentionDays 30–3650) before submit.
- **Server:** APIs use validators (e.g. patient, auth, appointment); admin settings general/security validate types and merge with existing.

## 7.5 Audit Logging

- **Patient record access:** `patient.service.js` `getPatientById` already calls `logPHIAccess` (patient, resourceId, userId, tenantId, ipAddress, userAgent).
- **Failed logins:** `app/api/auth/login/route.js` on catch calls `logFailedLogin(emailAttempted, ipAddress, userAgent, { reason })`. `lib/audit/audit-logger.js` adds `logFailedLogin()` using system placeholder userId for schema compliance.
- **Prescription / financial:** Services (e.g. prescription.service, billing.service) use audit logger where implemented; extend as needed for create/update/delete and export.

## 7.6 Performance

- **Pagination:** List APIs (admin patients, appointments, doctors, etc.) use `page` and `limit` (capped).
- **Cache:** Redis/cache used for dashboard and heavy reads; TTL and invalidation per `lib/cache` and `lib/constants/cache-ttl.js`.
- **Lean:** MongoDB queries use `.lean()` where appropriate.

## 7.7 Final Checklist

- Run through UAT: auth, dashboard, patients, appointments, admin flows, settings.
- Verify responsive behavior on small viewport (hamburger, overlay, touch targets).
- Verify loading and error states on key pages.
- Verify audit logs for login (success/failed), patient read, and other sensitive actions.

**Runnable checklist:** See `CursorMD/UAT_FINAL_CHECKLIST.md` for a tick-box UAT checklist you can use for sign-off.

## Files Touched

- `components/layout/Layout.jsx` – mobile sidebar state, hamburger bar, Escape
- `components/layout/Sidebar.jsx` – isMobileOpen, onMobileClose, backdrop, close button, max-md fixed/translate, min-h-[44px] nav links
- `lib/audit/audit-logger.js` – logFailedLogin()
- `app/api/auth/login/route.js` – failed login audit on catch
- `components/ui/TableSkeleton.jsx` – new
- `app/admin/settings/security/page.jsx` – client-side numeric validation/clamp
