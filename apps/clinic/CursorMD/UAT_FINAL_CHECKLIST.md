# UAT Final Checklist (Phase 7.7)

Use this checklist for **User Acceptance Testing** before launch. Tick each item as you verify it.

Reference: `PHASE_7_POLISH.md` §7.7, `CLINIC_DASHBOARD_IMPLEMENTATION_PLAN.md` Phase 7.

---

## 1. Authentication

| # | Check | Pass |
|---|--------|------|
| 1.1 | Login as Doctor → redirects to `/dashboard` | ☐ |
| 1.2 | Login as Admin (clinic) → correct dashboard / no super-admin routes | ☐ |
| 1.3 | Login as Super Admin → access to `/admin` and admin sub-routes | ☐ |
| 1.4 | Invalid credentials → error message, no crash | ☐ |
| 1.5 | Failed login attempt → audit log entry (check audit logs) | ☐ |
| 1.6 | Logout → session cleared, redirect to login | ☐ |

---

## 2. Doctor Dashboard

| # | Check | Pass |
|---|--------|------|
| 2.1 | Dashboard loads with KPI cards and today’s schedule | ☐ |
| 2.2 | Patient list: search, filters, sort, “X total, showing N” | ☐ |
| 2.3 | Patient detail (EHR): tabs, timeline, vitals, prescriptions | ☐ |
| 2.4 | Prescription creator: drug interaction / allergy alerts, e-sign flow | ☐ |
| 2.5 | Appointments: list/calendar, create/edit/cancel | ☐ |
| 2.6 | Schedule: legend (Booked/Available/Blocked), availability settings | ☐ |
| 2.7 | Staff list and Add staff (invite) work | ☐ |

---

## 3. Admin (Super Admin) Flows

| # | Check | Pass |
|---|--------|------|
| 3.1 | Admin home: 8 KPIs, charts, pending actions, system health widget | ☐ |
| 3.2 | Doctor verification: filters, checklist, Request More Info, Approve/Reject | ☐ |
| 3.3 | Admin patients: filters, sort, Activity Log, Flag/Unflag | ☐ |
| 3.4 | Admin appointments: type filter, stats bar, View Details, Download Report | ☐ |
| 3.5 | Financial → Revenue: date range, KPIs, trend chart, top doctors | ☐ |
| 3.6 | Financial → Disputes: list, status filter, Issue Refund / Resolve | ☐ |
| 3.7 | Analytics: date range, stats, charts, Export CSV | ☐ |
| 3.8 | Settings → General: save platform name, support, hours, timezone, formats | ☐ |
| 3.9 | Settings → Security: save session, password, lockout, audit retention | ☐ |

---

## 4. Responsive & UX

| # | Check | Pass |
|---|--------|------|
| 4.1 | Small viewport: hamburger opens sidebar, backdrop closes it | ☐ |
| 4.2 | Sidebar nav links have adequate touch targets (min 44px) | ☐ |
| 4.3 | Escape key closes mobile sidebar | ☐ |
| 4.4 | Key list pages (patients, appointments, doctors) show loading state then data | ☐ |
| 4.5 | API errors show toast/alert with message (no raw error dump) | ☐ |
| 4.6 | Forms (e.g. admin security) validate and clamp numbers before submit | ☐ |

---

## 5. Audit & Security

| # | Check | Pass |
|---|--------|------|
| 5.1 | View a patient record → audit log shows PHI access | ☐ |
| 5.2 | Failed login → audit log shows failed attempt with IP/user agent (or reason) | ☐ |
| 5.3 | Prescription create/sign or financial action → logged as expected | ☐ |
| 5.4 | Role restrictions: Manager cannot access admin-only routes | ☐ |
| 5.5 | Clinic Admin cannot access Super Admin-only routes | ☐ |

---

## 6. Performance & Data

| # | Check | Pass |
|---|--------|------|
| 6.1 | Patient/appointment lists paginate (page/limit), no full dump | ☐ |
| 6.2 | Dashboard and heavy reads use cache where configured (no obvious regression) | ☐ |
| 6.3 | No N+1 or excessive API calls on list/dashboard pages | ☐ |

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| Tester | | |
| Product | | |

**Notes:**  
_Use this section to record any bugs or follow-ups found during UAT._
