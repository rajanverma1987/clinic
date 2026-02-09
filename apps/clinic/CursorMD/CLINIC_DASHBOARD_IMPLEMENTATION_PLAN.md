# Clinic Dashboard – Implementation Plan

**Source:** CLINIC_DASHBOARD_DEEP_VISIT_REPORT.md (Doctor + Admin only, internal clinic management)

**Scope:** Two portals – **Doctor Dashboard** and **Admin Dashboard**. No public/patient portal.

---

## Phase 1: Foundation (Week 1)

| #   | Task                                                                                              | Owner | Status |
| --- | ------------------------------------------------------------------------------------------------- | ----- | ------ |
| 1.1 | Project structure: shared components (Button, Card, Input, Modal, Table, Sidebar, Header, Loader) |       | ✅     |
| 1.2 | Auth: Login for Doctor, Staff, Admin; role-based redirect                                         |       | ✅     |
| 1.3 | Auth: RBAC middleware; password reset flow                                                        |       | ✅     |
| 1.4 | Base layout: Sidebar + Header for Doctor and Admin                                                |       | ✅     |
| 1.5 | Routing: `/dashboard` (doctor), `/admin` (super admin), protected routes                          |       | ✅     |
| 1.6 | API client: base URL, auth token, 401 → logout                                                    |       | ✅     |

**Exit criteria:** User can log in as doctor or admin and see the correct dashboard shell. **DONE**

---

## Phase 2: Doctor Dashboard – Core (Weeks 2–3)

| #    | Task                                                                                                                                                                                            | Owner | Status |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------ |
| 2.1  | **Doctor Dashboard Home:** Welcome banner, current date                                                                                                                                         |       | ✅     |
| 2.2  | **8 KPI cards:** Today’s / Week’s / Month’s appointments, Monthly earnings, Avg rating, Total patients, Video calls this month, Queue count                                                     |       | ✅     |
| 2.3  | **Today’s Schedule:** Chronological list; highlight current; per card: time, patient, contact, visit type, chief complaint, [View History] [Start] [Reschedule] [Cancel]; timer for in-progress |       | ✅     |
| 2.4  | **Pending Actions widget:** Lab reports to review, New messages, Prescriptions to approve, [View All]                                                                                           |       | ✅     |
| 2.5  | **Recent Activity feed:** Last 5 actions with timestamps                                                                                                                                        |       | ✅     |
| 2.6  | **Patient list:** Search, filters (All/Active/New/Inactive), sort (Last visit, Name, Date added), [+ Add Patient], “X total, showing N”                                                         |       | ✅     |
| 2.7  | **Patient card:** Demographics, last visit, total visits, conditions, active Rx, allergies, last lab, [View Record] [Book] [Message] [Add Notes]                                                |       | ✅     |
| 2.8  | **Patient detail (EHR):** Tabs – Timeline, Vitals, Prescriptions, Lab Results, Imaging, Allergies, Conditions, Notes; Demographics section                                                      |       | ✅     |
| 2.9  | **Timeline view:** Chronological entries (consultation, lab, prescription, etc.) with actions [View Full] [Edit] where applicable                                                               |       | ✅     |
| 2.10 | Basic **Schedule/Calendar:** Week view, today/week/month, clinic selector; daily detail list; [+ Add Emergency Slot]                                                                            |       | ✅     |

**Exit criteria:** Doctor can see home KPIs, today’s schedule, patient list, and basic patient EHR with timeline.

---

## Phase 3: Prescription System (Week 4)

| #    | Task                                                                                                                                            | Owner | Status |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------ |
| 3.1  | **Prescription creator – UI:** Patient header (name, age, allergies, current meds)                                                              |       | ✅     |
| 3.2  | **Diagnosis:** Primary diagnosis (ICD-10 search/autocomplete), Chief complaint                                                                  |       | ✅     |
| 3.3  | **Medications:** Repeatable block – name autocomplete, dosage, frequency, route, duration, quantity, instructions, refills; custom instructions |       | ✅     |
| 3.4  | **Drug interaction checking** (real-time); **allergy conflict** detection                                                                       |       | ✅     |
| 3.5  | **Clinical decision support:** Alerts (e.g. K+ with ACE inhibitors, preventive care) with optional [Order test] / [Referral]                    |       | ✅     |
| 3.6  | **Lab tests / investigations:** Checkbox list, lab selector, priority                                                                           |       | ✅     |
| 3.7  | **Advice / precautions:** Text area                                                                                                             |       | ✅     |
| 3.8  | **Follow-up:** Schedule (e.g. 2 weeks), type (in-person/video/phone), optional auto-schedule                                                    |       | ✅     |
| 3.9  | **Digital signature:** Doctor name, title, license #, date; [Sign & Send]                                                                       |       | ✅     |
| 3.10 | [Save as Draft] [Cancel] [Sign & Send to Patient]                                                                                               |       | ✅     |

**Exit criteria:** Doctor can create a prescription with interaction/allergy checks and e-sign.

---

## Phase 4: Doctor – Schedule & Staff (Week 5)

| #   | Task                                                                                                                                                       | Owner | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------ |
| 4.1 | **Weekly calendar:** Mon–Sun grid, clinic selector, legend (Booked / Available / Blocked)                                                                  |       | ✅     |
| 4.2 | **Availability settings:** Working hours per day, appointment duration, buffer, lunch break; video slots; emergency slots; advance booking min/max         |       | ✅     |
| 4.3 | **Block time / Set unavailable**                                                                                                                           |       | ✅     |
| 4.4 | **Staff management:** List staff; role; permissions (view records, schedule, vitals, prescriptions, financial, manage staff); [Edit] [Deactivate] [Remove] |       | ✅     |
| 4.5 | **Add staff:** Full name, email, phone, role; permission checkboxes; [Send Invitation]                                                                     |       | ✅     |

**Exit criteria:** Doctor can manage schedule and staff.

---

## Phase 5: Admin Dashboard – Core (Weeks 5–6)

| #    | Task                                                                                                                                                                                                                            | Owner | Status |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------ |
| 5.1  | **Admin Dashboard Home:** 8 platform KPI cards (Total/Verified doctors, Total/Active patients, Today's appts, This month appts, Revenue, Commission)                                                                            |       | ✅     |
| 5.2  | **Charts:** User growth (line); Revenue trend (line)                                                                                                                                                                            |       | ✅     |
| 5.3  | **Pending actions alert box:** Doctor verifications, Flagged reviews, Payment disputes, Patient complaints, Content updates; [View All]                                                                                         |       | ✅     |
| 5.4  | **Side widgets:** Popular specialties; System health (API, DB, Payment, Video, Email)                                                                                                                                           |       | ✅     |
| 5.5  | **Doctor verification list:** Filters (Pending/Verified/Rejected), sort, search                                                                                                                                                 |       | ✅     |
| 5.6  | **Verification card (per doctor):** Checklist (personal info, license, NPI, degree, background, bank); submitted documents with [View] [Download]; NPI verification result; Admin notes; [Approve] [Reject] [Request More Info] |       | ✅     |
| 5.7  | **Request More Info modal:** Select items, message, deadline, email/SMS; [Send Request]                                                                                                                                         |       | ✅     |
| 5.8  | **Approval flow:** Full vs conditional; initial permissions; welcome email template; admin notes; [Confirm & Approve]                                                                                                           |       | ✅     |
| 5.9  | **Patient management (admin):** List with filters (date, doctor, status, has appts); sort; [Export CSV] [Generate Report]; patient card with activity summary, [View] [Activity Log] [Flag] [Deactivate]                        |       | ✅     |
| 5.10 | **Appointments management:** Filters (date, status, doctor, type); stats; appointment card; [View Details] [Download Report]                                                                                                    |       | ✅     |

**Exit criteria:** Admin can see platform KPIs, verify doctors (with docs + NPI + approve/reject/request info), and manage patients and appointments.

---

## Phase 6: Admin – Finance, Analytics, Settings (Week 7)

| #   | Task                                                                                                                                                                                    | Owner | Status |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------ |
| 6.1 | **Financial dashboard:** Revenue overview (Total, Collected, Pending, Refunded); revenue breakdown (consultations, lab, prescriptions, other); revenue trend chart; top earning doctors |       | ✅     |
| 6.2 | **Payment disputes:** List; dispute card (patient, doctor, amount, reason, evidence); admin review; [Issue Refund] [Contact] [Escalate] [Mark Resolved]                                 |       | ✅     |
| 6.3 | **Analytics:** Date range; platform growth chart; appointment stats (completed/cancel/no-show); specialty distribution; peak hours (heatmap); [Export] [Schedule report email]          |       | ✅     |
| 6.4 | **System settings – General:** Platform name, support email/phone, business hours, timezone, date/currency format                                                                       |       | ✅     |
| 6.5 | **System settings – Security:** Session timeout, password policy, 2FA (required for admin), failed login lockout, IP whitelist, audit log retention                                     |       | ✅     |

**Exit criteria:** Admin can view finance, disputes, analytics, and change general and security settings.

---

## Phase 7: Polish & Launch (Week 8)

| #   | Task                                                                                             | Owner | Status |
| --- | ------------------------------------------------------------------------------------------------ | ----- | ------ |
| 7.1 | Mobile responsive: breakpoints, touch targets, bottom nav / hamburger, card view for tables      |       | ✅     |
| 7.2 | Loading states (skeletons/spinners) on all data views                                            |       | ✅     |
| 7.3 | Error handling and user-facing messages (toast/alerts)                                           |       | ✅     |
| 7.4 | Form validation (client + server) on all forms                                                   |       | ✅     |
| 7.5 | Audit logging: patient record access, prescription create/edit, financial actions, failed logins |       | ✅     |
| 7.6 | Performance: lazy load lists, cache where appropriate, optimize assets                           |       | ✅     |
| 7.7 | Run through **Final Checklist** (see report)                                                     |       | ⬜     |

**7.7 note:** Use the runnable checklist in `CursorMD/UAT_FINAL_CHECKLIST.md` for sign-off. Mark 7.7 ✅ after UAT is complete.

**Exit criteria:** App is responsive, robust, audited, and ready for UAT.

---

## Critical Path (Must Have for MVP)

1. **Auth + RBAC** (Phase 1)
2. **Doctor Dashboard Home + Today’s Schedule** (Phase 2.1–2.5)
3. **Patient List + Patient Detail (EHR) + Timeline** (Phase 2.6–2.9)
4. **Prescription Creator + drug interaction + allergy check + e-sign** (Phase 3)
5. **Admin Dashboard Home + Doctor Verification (full workflow)** (Phase 5.1–5.8)
6. **Admin Patient + Appointment management** (Phase 5.9–5.10)

---

## Success Criteria (from report)

- **Doctor:** View/search patients, full EHR with timeline, create prescriptions with safety checks, manage schedule, manage staff; all actions in audit trail.
- **Admin:** Platform analytics and KPIs, full doctor verification (doc review, NPI, approve/reject/request info), manage patients and appointments, financial reports and disputes, system settings; full audit logging.
- **Performance:** Page load &lt; 2s, TTI &lt; 3s, Lighthouse ≥ 90; responsive.
- **Security:** Authenticated APIs, RBAC on all routes, PHI encrypted, 30-min session timeout, audit logs.

---

## Reference

- **Full spec:** `CursorMD/CLINIC_DASHBOARD_DEEP_VISIT_REPORT.md`
- **Tech stack (from report):** React 18, React Router, Lucide, Recharts, react-hook-form, Zod, Zustand, React Query, Tailwind, TanStack Table, react-hot-toast
- **Start order (report):** Project structure → Auth → Base layout → Doctor Dashboard Home → Patient List → Patient Detail → Prescription Creator → Admin Dashboard → **Doctor Verification** → Analytics → Polish

Use this plan to track progress; update the **Status** column (e.g. ⬜ → ✅) as tasks are completed.
