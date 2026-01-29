# Phase 6: Admin – Finance, Analytics, System Settings

Implementation summary for Phase 6 (Finance, Analytics, System settings) per `CLINIC_DASHBOARD_IMPLEMENTATION_PLAN.md`.

## 6.1 Financial Dashboard

- **API:** `GET /api/admin/financial/revenue?startDate=&endDate=`
  - Returns: `overview` (total, collected, pending, refunded), `breakdown` (consultation, lab_test, medication, procedure, other), `revenueTrend` (last 12 months), `topDoctors` (top 10 by revenue via appointments).
- **Page:** `/admin/financial/revenue`
  - Date range filter, KPI cards (Total, Collected, Pending, Refunded), Revenue trend chart (ChartCard), Breakdown by type, Top earning doctors table.
- **Data:** Invoice status and items; top doctors derived from Invoice → Appointment → Doctor.

## 6.2 Payment Disputes

- **Model:** `PaymentDispute` (tenantId, invoiceId?, paymentId?, patientId, amount, currency, reason, evidence, status: open|contacted|escalated|resolved|refund_issued, adminNotes, resolvedAt, resolvedBy).
- **API:** `GET /api/admin/financial/disputes?status=&page=&limit=` (list); `POST` (create, admin only); `GET/PUT /api/admin/financial/disputes/:id` (get one, update status or issue refund).
- **PUT body:** `status` (contacted|escalated|resolved|refund_issued), `adminNotes`, `issueRefund: true` (calls billing.service processRefund when paymentId present).
- **Page:** `/admin/financial/disputes` – status filter, dispute cards (patient, tenant, invoice, amount, reason, evidence, admin notes), actions: Contact, Escalate, Issue Refund, Mark Resolved (with optional admin notes modal).
- **Financial hub:** Link "Payment Disputes" added to `/admin/financial`.

## 6.3 Analytics

- **API:** `GET /api/admin/analytics?startDate=&endDate=`
  - Optional date range; returns `userGrowth`, `revenueTrends`, `appointmentTrends`, `popularSpecialties`, `peakHours`, `appointmentStats` (total, completed, cancelled, no_show for period).
- **Export:** `GET /api/admin/analytics/export?startDate=&endDate=` returns CSV (same data).
- **Page:** `/admin/analytics`
  - Date range, appointment stats cards, User growth and Revenue trend charts, Popular specialties list, Peak hours (top 12), Export CSV, “Schedule report email” (placeholder).
- **Sidebar:** “Analytics” link for super_admin to `/admin/analytics`.

## 6.4 System Settings – General

- **Model:** `SystemSettings` (slug: `platform`), section `general`.
  - Fields: platformName, supportEmail, supportPhone, businessHours, timezone, dateFormat, currencyFormat.
- **API:** `GET /api/admin/settings/general`, `PUT /api/admin/settings/general` (body: general fields).
- **Page:** `/admin/settings/general`
  - Form to edit and save general settings (Super Admin only).

## 6.5 System Settings – Security

- **Model:** `SystemSettings`, section `security`.
  - Fields: sessionTimeoutMinutes, passwordMinLength, passwordRequireSpecial, require2FAForAdmin, failedLoginMaxAttempts, failedLoginLockoutMinutes, ipWhitelistEnabled, auditLogRetentionDays.
- **API:** `GET /api/admin/settings/security`, `PUT /api/admin/settings/security` (body: security fields).
- **Page:** `/admin/settings/security`
  - Form to edit and save security settings (Super Admin only).

## Files Touched

- `models/SystemSettings.js` (new)
- `app/api/admin/financial/revenue/route.js` (new)
- `app/api/admin/analytics/route.js` (date params, appointmentStats)
- `app/api/admin/analytics/export/route.js` (new)
- `app/api/admin/settings/general/route.js` (new)
- `app/api/admin/settings/security/route.js` (new)
- `app/admin/financial/revenue/page.jsx` (full dashboard)
- `app/admin/analytics/page.jsx` (new)
- `app/admin/settings/general/page.jsx` (form)
- `app/admin/settings/security/page.jsx` (form)
- `components/layout/Sidebar.jsx` (Analytics link)
- `lib/i18n/locales/en.json`, `es.json`, `fr.json` (admin.analytics)

## Exit Criteria (Phase 6)

- Admin can view financial dashboard (revenue overview, breakdown, trend, top doctors).
- Admin can view platform analytics (date range, growth, appointment stats, specialty, peak hours) and export CSV.
- Admin can change general settings (platform name, support, hours, timezone, date/currency format).
- Admin can change security settings (session, password policy, 2FA, lockout, IP whitelist, audit retention).
