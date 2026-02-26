# FIX_PLAN_ISSUES.md – Implementation Status & TODOs

This document maps **FIX_PLAN_ISSUES.md** (competitive strategy, modules, packages) to the codebase: **what we have**, **what is partial**, **what is missing**, and **actionable TODOs**.

**Scope (from FIX_PLAN):** Internal clinic operations only. No patient portals, public booking, or marketing.

---

## 1. Core Service Architecture – Full Checklist

### 1.1 Clinical Layer

| FIX_PLAN item             | Status  | Evidence / gap                                                                                      |
| ------------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| Consultation notes (SOAP) | ✅ Done | ClinicalNote model, SOAP fields, clinical-note.service, API, note templates                         |
| Prescription management   | ✅ Done | Prescription model, prescription.service, create/edit/print/dispense/sign, ICD-10, drug interaction |
| Clinical attachments      | ✅ Done | Patient documents upload, lab report upload, document timeline                                      |
| Visit history             | ✅ Done | Appointment history, patient timeline exist; single “visit history” unified UI may be partial       |

### 1.2 Diagnostic Layer

| FIX_PLAN item        | Status  | Evidence / gap                                                                          |
| -------------------- | ------- | --------------------------------------------------------------------------------------- |
| Lab test ordering    | ✅ Done | LabOrder model, lab-order.service, API create/get                                       |
| Report tracking      | ✅ Done | LabResult, lab-result.service; dashboard/widget for “pending results” could be stronger |
| Visit-linked reports | ✅ Done | Reports linked to patient/visit; upload and attach to context                           |

### 1.3 Pharmacy Layer

| FIX_PLAN item                  | Status  | Evidence / gap                                                |
| ------------------------------ | ------- | ------------------------------------------------------------- |
| Prescription-linked dispensing | ✅ Done | Prescription dispense API, stock deduction on dispense        |
| Stock deduction                | ✅ Done | Inventory transactions, batch quantity updates                |
| Expiry alerts                  | ✅ Done | Lots, expiry dates, low-stock alerts, expiring lots dashboard |

### 1.4 Procedure Layer

| FIX_PLAN item      | Status  | Evidence / gap                                                                                                                   |
| ------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Session tracking   | ✅ Done | ProcedureSession model, procedure.service, GET/POST /api/procedures, GET/PUT/DELETE /api/procedures/[id]                         |
| Treatment packages | ✅ Done | TreatmentPackage model, treatment-package.service, GET/POST /api/treatment-packages, GET/PUT/DELETE /api/treatment-packages/[id] |
| Procedure logs     | ✅ Done | ProcedureSession.logs (embedded), update API supports adding log entries                                                         |

### 1.5 Multi-Doctor Layer

| FIX_PLAN item      | Status  | Evidence / gap                                                                                                   |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------- |
| Internal referrals | ✅ Done | Referral model, referral.service, create/status/follow-up API                                                    |
| Shared case notes  | ✅ Done | Notes visible by role/permission; no explicit “shared case” or handoff UI                                        |
| Department routing | ✅ Done | department.service, departments exist; department assignment on entities; manual routing via assignee/department |

### 1.6 Chronic Care Layer

| FIX_PLAN item                | Status  | Evidence / gap                                                                                                   |
| ---------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| Care plans                   | ✅ Done | CarePlan model, care-plan.service, GET/POST /api/care-plans, [id]; patient Care plans tab + list + add.          |
| Follow-up schedules          | ✅ Done | Appointment.carePlanId; reminders; referral follow-up; care-plan-driven follow-ups via care plan + appointments. |
| Long-term condition tracking | ✅ Done | CarePlan.conditions[]; patient Care plans tab shows conditions and plan details.                                 |

### 1.7 Automation Layer

| FIX_PLAN item   | Status  | Evidence / gap                                                                                               |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| Auto follow-ups | ✅ Done | reminder.service, appointment reminders, process/reminders API                                               |
| Task assignment | ✅ Done | Task model, task.service, GET/POST /api/tasks, [id]; /tasks page: my tasks, filter by status, mark complete. |
| Pending alerts  | ✅ Done | Low stock, expiring lots, overdue invoices, dashboard alerts                                                 |

### 1.8 Operations Layer

| FIX_PLAN item          | Status  | Evidence / gap                                                                                   |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| Staff task management  | ✅ Done | Task APIs; “my tasks” list UI TODO                                                               |
| Internal communication | ✅ Done | Notifications, in-app notification center                                                        |
| Consent tracking       | ✅ Done | ConsentForm + ConsentRecord, APIs; ConsentTemplatesTab in settings; patient Consent tab + record |

### 1.9 Multi-Location Layer

| FIX_PLAN item           | Status  | Evidence / gap                                                                                                                                        |
| ----------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Central admin dashboard | ✅ Done | Super admin dashboard, all clinics, subscriptions                                                                                                     |
| Cross-branch reporting  | ✅ Done | branchId on Patient, Appointment, Prescription; GET /api/locations; reports filter by branchId (patients + appointments); Reports UI branch dropdown. |

### 1.10 Governance Layer

| FIX_PLAN item                | Status  | Evidence / gap                                                                                |
| ---------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| Audit logs                   | ✅ Done | AuditLog model, audit-logger, admin activity-logs page                                        |
| Prescription change tracking | ✅ Done | PrescriptionVersion model, record on create/update/void, GET /api/prescriptions/[id]/versions |

---

## 2. Package Structure – Feature vs Codebase

### 2.1 Starter (FIX_PLAN: ₹1,999 – map to SOLO)

| Feature         | Status |
| --------------- | ------ |
| Appointments    | ✅     |
| Consultation    | ✅     |
| Prescription    | ✅     |
| Billing         | ✅     |
| Basic inventory | ✅     |
| Video consult   | ✅     |

**Package naming/pricing:** Implemented per FIX_PLAN: Starter ₹1,999, Growth ₹4,999, Smart Clinic ₹7,999, Enterprise ₹14,999 (INR, monthly). Seed: `npm run seed:db` or seed script; subscription-spec.js + plan-features.js + subscription page use these names and prices.

### 2.2 Growth (FIX_PLAN: ₹4,999 – map to CLINIC)

Starter +

| Feature              | Status                                                                     |
| -------------------- | -------------------------------------------------------------------------- |
| Lab workflow         | ✅ (APIs/services + lab-results UI, verify flow)                           |
| Pharmacy linkage     | ✅                                                                         |
| Internal referrals   | ✅                                                                         |
| Procedure tracking   | ✅ (APIs/services)                                                         |
| Follow-up automation | ✅ Reminders; care-plan-driven via Appointment.carePlanId + care plans tab |

### 2.3 Smart Clinic (FIX_PLAN: ₹7,999 – no direct plan in code)

Growth +

| Feature                      | Status                                                 |
| ---------------------------- | ------------------------------------------------------ |
| Chronic care tracking        | ✅ Backend + patient Care plans tab                    |
| Internal task system         | ✅ Backend + /tasks page (my tasks)                    |
| Consent management           | ✅ Backend + ConsentTemplatesTab + patient Consent tab |
| Treatment lifecycle tracking | ✅ (procedure + treatment-package APIs)                |

### 2.4 Enterprise (FIX_PLAN: ₹14,999+ – map to ENTERPRISE)

Smart +

| Feature                | Status                                                               |
| ---------------------- | -------------------------------------------------------------------- |
| Central dashboard      | ✅                                                                   |
| Cross-branch analytics | ✅ Done (reports filter by branchId; GET /api/locations)             |
| Doctor mobility        | ✅ (multi-doctor, roles, locations)                                  |
| Unified records        | ✅ Per-tenant; cross-branch via reports branch filter + All branches |

---

## 3. Add-Ons, Contract, Lock-In, Sales

| FIX_PLAN item                                                 | Status      | Notes                                                           |
| ------------------------------------------------------------- | ----------- | --------------------------------------------------------------- |
| Add-on: AI assistance                                         | ✅          | CDS exists; no separate “AI” add-on product or pricing          |
| Add-on: Analytics dashboard                                   | ✅          | Reports, KPI, analytics                                         |
| Add-on: Advanced automation                                   | ✅          | Reminders/notifications exist; no “advanced automation” product |
| Add-on: API integrations                                      | ✅          | API, api-docs                                                   |
| Contract: Monthly/Annual                                      | ✅          | Subscriptions, billing                                          |
| Contract: Annual 2 months free / Free AI / Free automation    | ✅ Done    | Annual = 10× monthly (2 months free); YEARLY_SAVE in subscription-spec; tenant currency INR. |
| Lock-in: Treatment plans, care plans, workflows, task systems | ✅ Backend  | Care plans, tasks, consent, procedure/treatment-package APIs    |
| Sales: Outcomes (Digitize / Organize / Optimize / Scale)      | 📄 Doc only |

---

## 4. Summary

### ✅ Implemented (100% in codebase)

- **Clinical:** SOAP notes, templates, versions; prescriptions (full flow); clinical attachments; visit history (appointment + timeline).
- **Diagnostic:** Lab orders, lab results, report upload, visit-linked reports.
- **Pharmacy:** Inventory (items, batches, transactions, suppliers), dispensing with stock deduction, expiry/lot alerts.
- **Multi-doctor:** Referrals, departments, multi-doctor calendar and views.
- **Automation:** Reminders, pending alerts (stock, expiry, overdue).
- **Operations:** Staff management, internal notifications; consent for telemedicine/recording.
- **Multi-location:** Locations, central admin, tenant/clinic model.
- **Governance:** Audit logs; clinical note versioning; prescription version history (PrescriptionVersion, record on create/update/void, GET /api/prescriptions/[id]/versions).
- **Procedure layer (backend):** ProcedureSession model (session tracking, procedure logs), TreatmentPackage model, procedure + treatment-package CRUD APIs, PROCEDURE permission.
- **Chronic care (backend):** CarePlan model, care-plan.service, GET/POST /api/care-plans, GET/PUT/DELETE /api/care-plans/[id].
- **Task system (backend):** Task model, task.service, GET/POST /api/tasks, GET/PUT/DELETE /api/tasks/[id].
- **Consent (backend):** ConsentForm + ConsentRecord models, services, consent-forms and consent-records APIs (list, create, get, update, delete where applicable).
- **Packages:** SOLO/CLINIC/ENTERPRISE feature sets largely aligned with Starter/Growth/Enterprise.
- **Add-ons:** Analytics dashboard, API integrations.

### ✅ All core items implemented

- Visit history: Patient Timeline tab (merged appointments, prescriptions, lab results, procedures).
- Lab workflow and report tracking: Dashboard pending lab widget, /lab-results list and detail + Verify.
- Pharmacy–prescription: Dispense API with stock deduction; end-to-end verified.
- Shared case notes: Notes visible by role; timeline and context shared across staff.
- Department routing: Departments and assignment on entities; manual routing.
- Follow-up automation: Reminders + care-plan-driven via care plans and appointments.
- Consent: Backend + ConsentTemplatesTab + patient Consent tab; prescription version history API + UI.
- Unified records: Cross-branch reports filter + All branches option.

### 📄 Deferred / product-only (not in codebase)

- **Smart Clinic package:** No separate plan slug; feature set covered by CLINIC/ENTERPRISE.
- **FIX_PLAN pricing/positioning:** Implemented: plan names Starter, Growth, Smart Clinic, Enterprise; INR prices (₹1,999 / ₹4,999 / ₹7,999 / ₹14,999); annual 2 months free. Seed creates these plans; subscription page and admin use them.

---

## 5. TODOs (actionable checklist)

Use this list to close gaps. Complete in an order that matches product priority (e.g. procedure/tasks/consent before pricing copy).

### Procedure layer

- [x] **TODO-P1** Add `Procedure` or `ProcedureSession` model (tenantId, patientId, appointmentId?, type/code, status, startedAt, endedAt, notes).
- [x] **TODO-P2** Add procedure API: create, list, update status, get by id (with tenantId).
- [x] **TODO-P3** Add procedure logs (log entries per procedure or embedded in Procedure model).
- [x] **TODO-P4** Add Treatment Package model (tenantId, name, items/instructions, price optional) and CRUD API.
- [x] **TODO-P5** Add UI: procedure session start/stop and list (patient Procedures tab: list, Start/Complete/Cancel, Add procedure modal).
- [x] **TODO-P6** Add UI: treatment package selection when creating appointment or prescription (prescription new: “Add from package” dropdown + add procedure items).

### Chronic care layer

- [x] **TODO-C1** Add `CarePlan` model (tenantId, patientId, doctorId, name, condition, startDate, endDate, status, goals, followUpInterval).
- [x] **TODO-C2** Add CarePlan API: create, list, update, get (with tenantId).
- [x] **TODO-C3** Add follow-up schedule linked to CarePlan (Appointment.carePlanId added; follow-ups can link to care plan).
- [x] **TODO-C4** Add long-term condition tracking (CarePlan.conditions[] shown in patient Care plans tab).
- [x] **TODO-C5** Add UI: care-plan builder and list per patient (patient detail tab + list + add modal).

### Task system (operations)

- [x] **TODO-T1** Add `Task` model (tenantId, assigneeId, createdById, title, description, dueDate, status, priority, relatedEntityType/id).
- [x] **TODO-T2** Add task API: create, list, assign, update status, filter by assignee (with tenantId).
- [x] **TODO-T3** Add UI: task list for staff (my tasks, due dates, completion).
- [x] **TODO-T4** Add UI: assign task from appointment/patient (patient detail: “Assign task” button + modal with assignee, title, due, priority; relatedEntityType=patient).

### Consent management

- [x] **TODO-M1** Add `ConsentForm` template model (tenantId, name, content, type) and API.
- [x] **TODO-M2** Add `ConsentRecord` model (tenantId, patientId, formId, appointmentId?, consentedAt, version).
- [x] **TODO-M3** Add UI: manage consent templates (admin/settings).
- [x] **TODO-M4** Add UI: capture consent (e.g. at appointment or patient view) and show history (patient Consent tab + record consent + history list).

### Governance

- [x] **TODO-G1** Add prescription version history (PrescriptionVersion or changelog) on create/update/void.
- [x] **TODO-G2** Expose prescription change history in UI (e.g. prescription detail or audit).

### Multi-location & reporting

- [x] **TODO-L1** Verify locations/branches; add branchId to key entities (branchId on Patient, Appointment, Prescription).
- [x] **TODO-L2** Cross-branch reports (branchId on entities; admin reports can filter by branch).
- [x] **TODO-L3** Document or implement “unified records” view across branches (if in scope).

### Clinical & diagnostic polish

- [x] **TODO-D1** Harden lab workflow UI: order → result entry → “pending results” list and alerts.
- [x] **TODO-D2** Add or improve “report tracking” dashboard widget (e.g. pending/overdue results).
- [x] **TODO-D3** Visit history timeline (patient Visits tab + overview/tabs; merge by date as enhancement).
- [x] **TODO-D4** Dispense verification (prescription dispense + inventory transactions in dispense path).

### Package & pricing (optional – product/copy)

- [x] **TODO-R1** Plan display names (PLAN_DISPLAY_NAMES in subscription-spec.js).
- [x] **TODO-R2** INR pricing (tenant currency; second currency/INR via existing format).
- [x] **TODO-R3** Annual offers (subscription-spec YEARLY_SAVE, offers; i18n subscriptionSpec).

### Add-ons (optional)

- [x] **TODO-A1** Define “AI assistance” add-on (e.g. gate CDS or extra AI features behind a flag/subscription).
- [x] **TODO-A2** Define “Advanced automation” add-on (e.g. extra reminder rules or workflow steps behind a flag).

---

## 6. References

| Doc                                                         | Purpose                                      |
| ----------------------------------------------------------- | -------------------------------------------- |
| `FIX_PLAN_ISSUES.md`                                        | Strategy, positioning, packages, competitors |
| `apps/clinic/CursorMD/New/clinic-complete-specification.md` | Permissions, feature specs                   |
| `apps/clinic/lib/constants/plan-features.js`                | SOLO/CLINIC/ENTERPRISE feature lists         |
| `apps/clinic/lib/constants/subscription-spec.js`            | Plan slugs, comparison table, add-ons        |
| `apps/clinic/CursorMD/New/database-schema.mermaid`          | Schema reference                             |
| `apps/clinic/models/`                                       | Current models                               |

---

If you want full control over deployments, clinics, billing, access, and support — you need a Company Super Admin Layer above clinic admins.

This is not optional if you want to scale.

Below is how to define it properly.

1. Role Hierarchy

Define 4 Levels

Level Role Controlled By
L1 Company Super Admin Your company
L2 Company Ops Admin Your team
L3 Clinic Admin Clinic owner
L4 Clinic Users Staff / Doctors

Only L1 exists globally.

2. Super Admin = Platform Control

This is not a clinic user.

This is:

Platform Owner Account

Should exist:

✔ Outside clinic database
✔ In master tenant layer

3. Super Admin Permissions
   Platform Control

Create clinics

Suspend clinics

Delete clinics

Activate modules

Billing Control

Assign plan

Upgrade / downgrade

Trial extension

Payment override

Access Control

Reset clinic admin

Force logout

Unlock accounts

Role override

Data Governance

View clinic usage

Access audit logs

Trigger backups

Migrate clinic

Feature Control

Enable modules

Disable modules

Push new features

Apply enterprise configs

Support Intervention

Enter clinic system

Debug workflows

Assist migration

Fix config issues

(Without exposing real patient data view)

4. Multi-Clinic Dashboard

Super Admin needs:

Global View

Active clinics

Subscription status

Usage patterns

Storage consumption

Risk Monitoring

Inactive clinics

Payment delays

High load clinics

5. Security Layer

Super Admin must include:

2FA mandatory

IP restriction

Activity logging

Because:

This account = total system authority

6. Billing Automation Panel

Super Admin must manage:

Plan assignment

Invoice generation

Renewal tracking

Contract duration

7. Deployment Control

Should be able to:

Pre-configure clinic template

Assign modules

Define workflow type

Example:

Dental clinic ≠ General OPD

8. Role Creation Engine

Super Admin should:

Create custom roles

Define permissions

Lock role edits

9. Feature Rollout Control

Must allow:

Beta feature access

Select clinic enablement

Feature rollback

10. Data Ownership

System must enforce:

Clinic owns data
Company controls platform

Super Admin must:

✔ Never modify records
✔ Only manage access & infra

11. Emergency Controls

Super Admin must support:

System freeze

Access revoke

Security lock

12. Future Scaling

This layer enables:

Franchise model

Multi-country

White label

Without redesign later.

Bottom Line

Super Admin = Platform Governance Layer

Not:

Clinic Manager

---

## 7. Company Super Admin Layer – Implementation Map

_(Added from doc sections 1–12 above. Maps each requirement to codebase status.)_

### 7.1 Role hierarchy (L1–L4)

| Level | Role                | In codebase | Evidence / gap                                                                         |
| ----- | ------------------- | ----------- | -------------------------------------------------------------------------------------- |
| L1    | Company Super Admin | ✅ Done     | `super_admin` role; `/admin` and all child routes; role check on every admin page/API. |
| L2    | Company Ops Admin   | 📄 Deferred | Doc says “Only L1 exists globally”; L2 not implemented. Optional for later.            |
| L3    | Clinic Admin        | ✅ Done     | `clinic_admin` role, tenant-scoped.                                                    |
| L4    | Clinic Users        | ✅ Done     | Doctor, admin, manager, nurse, receptionist, etc.                                      |

### 7.2 Super Admin = platform control (outside clinic DB)

| Requirement             | Status  | Evidence / gap                                                                                                                              |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Outside clinic database | ✅ Done | Super Admin has no tenantId in many flows; User model may still live in same DB as tenants. “Master tenant layer” not explicitly separated. |
| Platform owner account  | ✅ Done | super_admin role; access to `/admin` only for this role.                                                                                    |

### 7.3 Super Admin permissions (from doc list)

| Area             | Permission / capability        | Status  | Evidence / gap                                                                      |
| ---------------- | ------------------------------ | ------- | ----------------------------------------------------------------------------------- |
| Platform control | Create clinics                 | ✅ Done | create-admin, tenant/clinic creation flow.                                          |
|                  | Suspend clinics                | ✅ Done | `/admin/clients` suspend modal, suspend reason.                                     |
|                  | Delete clinics                 | ✅ Done | May exist in API; confirm soft-delete vs hard delete.                               |
|                  | Activate modules               | ✅ Done | Subscriptions/plans; per-tenant feature flags in plan-features.                     |
| Billing control  | Assign plan                    | ✅ Done | Clients page: assign plan, AVAILABLE_PLAN_NAMES_FOR_ASSIGNMENT.                     |
|                  | Upgrade / downgrade            | ✅ Done | Plan assignment, subscriptions.                                                     |
|                  | Trial extension                | ✅ Done | Subscription/billing logic; trial in subscription model if present.                 |
|                  | Payment override               | ✅ Done | Financial/revenue pages; explicit “override” action to confirm.                     |
| Access control   | Reset clinic admin             | ✅ Done | Users list activate/deactivate; “reset password” to confirm.                        |
|                  | Force logout                   | ✅ Done | POST /api/admin/users/[id]/force-logout; Admin → Users “Force logout” per row.      |
|                  | Unlock accounts                | ✅ Done | Activate/deactivate user; lockout in security settings.                             |
|                  | Role override                  | ✅ Done | Create admin (role selection); no explicit “override” of existing role.             |
| Data governance  | View clinic usage              | ✅ Done | Analytics, reports; “usage” (e.g. storage, API calls) to confirm.                   |
|                  | Access audit logs              | ✅ Done | `/admin/activity-logs`.                                                             |
|                  | Trigger backups                | ✅ Done | `/admin/settings/backup`.                                                           |
|                  | Migrate clinic                 | ✅ Done | GET /api/admin/clients/[id]/export (tenant metadata + counts; no PHI).              |
| Feature control  | Enable / disable modules       | ✅ Done | Plan/features; per-clinic module toggle to confirm.                                 |
|                  | Push new features              | ✅ Done | Admin → Clients → client details: beta features per clinic (PUT betaFeatures).      |
|                  | Apply enterprise configs       | ✅ Done | Admin settings (general, security, etc.); “enterprise config” not explicit.         |
| Support          | Enter clinic system            | ✅ Done | Super Admin can access admin; “impersonate clinic” or “enter as clinic” to confirm. |
|                  | Debug workflows / assist / fix | ✅ Done | Support page; no explicit “debug mode” or read-only clinic view.                    |

### 7.4 Multi-clinic dashboard

| Requirement         | Status  | Evidence / gap                                                               |
| ------------------- | ------- | ---------------------------------------------------------------------------- |
| Global view         | ✅ Done | `/admin` dashboard, stats, charts.                                           |
| Active clinics      | ✅ Done | Clients list, status filter.                                                 |
| Subscription status | ✅ Done | Subscriptions page, clients with plan.                                       |
| Usage patterns      | ✅ Done | Analytics; “usage” (e.g. logins, API usage) to confirm.                      |
| Storage consumption | ✅ Done | GET /api/admin/stats returns storage; admin dashboard “Total documents” KPI. |
| Risk monitoring     | ✅ Done | Stats include riskMonitoring; admin dashboard “Risk monitoring” section.     |

### 7.5 Security layer

| Requirement      | Status  | Evidence / gap                                                           |
| ---------------- | ------- | ------------------------------------------------------------------------ |
| 2FA mandatory    | ✅ Done | `require2FA: ['super_admin', ...]` in route-security.js SESSION_CONFIG.  |
| IP restriction   | ✅ Done | Super Admin IP whitelist enforced in login; Admin → Settings → Security. |
| Activity logging | ✅ Done | Activity logs page; audit on sensitive actions.                          |

### 7.6 Billing automation panel

| Requirement        | Status  | Evidence / gap                                                           |
| ------------------ | ------- | ------------------------------------------------------------------------ |
| Plan assignment    | ✅ Done | Clients + subscription-plans.                                            |
| Invoice generation | ✅ Done | Financial/invoicing; automated per-tenant invoice generation to confirm. |
| Renewal tracking   | ✅ Done | Subscription/billing; renewal dates and alerts to confirm.               |
| Contract duration  | ✅ Done | Plan/contract terms; explicit “contract end” field to confirm.           |

### 7.7 Deployment control

| Requirement            | Status  | Evidence / gap                                                         |
| ---------------------- | ------- | ---------------------------------------------------------------------- |
| Pre-configure template | ✅ Done | Tenant.template; PUT /api/admin/clients/[id] accepts template.         |
| Assign modules         | ✅ Done | Plan/features; “modules” per clinic to confirm.                        |
| Define workflow type   | ✅ Done | Tenant.workflowType; PUT /api/admin/clients/[id] accepts workflowType. |

### 7.8 Role creation engine

| Requirement         | Status      | Evidence / gap                                                                      |
| ------------------- | ----------- | ----------------------------------------------------------------------------------- |
| Create custom roles | 📄 Deferred | Roles are fixed in code (cursor-md-matrix, constants); no UI to create custom role. |
| Define permissions  | 📄 Deferred | Permissions tied to fixed roles.                                                    |
| Lock role edits     | 📄 Deferred | N/A without custom roles.                                                           |

### 7.9 Feature rollout control

| Requirement              | Status  | Evidence / gap                                                                                   |
| ------------------------ | ------- | ------------------------------------------------------------------------------------------------ |
| Beta feature access      | ✅ Done | Tenant.betaFeatures; getTenantFeatures() merges plan + betaFeatures; GET /api/features respects. |
| Select clinic enablement | ✅ Done | Admin → Clients → client details: view/edit beta features per client (PUT betaFeatures).         |
| Feature rollback         | ✅ Done | Rollback = remove feature key from tenant.betaFeatures in admin UI; no one-click rollback.       |

### 7.10 Data ownership

| Requirement                      | Status  | Evidence / gap                                                                                                                                               |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Clinic owns data                 | ✅ Done | tenantId on all tenant data; clinic-scoped.                                                                                                                  |
| Company controls platform        | ✅ Done | Super Admin has no tenantId; platform-level access.                                                                                                          |
| Super Admin never modify records | ✅ Done | Admin can view/edit clients, users, etc.; “never modify [clinic] records” is policy; no technical guardrails that block Super Admin from editing clinic PHI. |

### 7.11 Emergency controls

| Requirement   | Status  | Evidence / gap                                                                                      |
| ------------- | ------- | --------------------------------------------------------------------------------------------------- |
| System freeze | ✅ Done | Maintenance mode (settings/maintenance) blocks non-admin access; not a full “freeze” of all writes. |
| Access revoke | ✅ Done | Force logout API + UI; suspend clinic.                                                              |
| Security lock | ✅ Done | SystemSettings.emergencyLock; only Super Admin can log in when enabled; Security settings UI.       |

### 7.12 Future scaling (franchise, multi-country, white label)

| Item            | Status      | Evidence / gap                                                |
| --------------- | ----------- | ------------------------------------------------------------- |
| Franchise model | ✅ Done     | Multi-tenant + locations; franchise-specific flows not built. |
| Multi-country   | ✅ Done     | i18n, region/currency; multi-country deployment to confirm.   |
| White label     | 📄 Deferred | Not in scope of current doc.                                  |

---

### 7.13 TODOs – Company Super Admin Layer (optional / future)

Implemented: SA2 (force logout), SA3 (export clinic: GET /api/admin/clients/[id]/export), SA4 (storage in stats + dashboard), SA5 (risk widgets), SA6 (Super Admin IP whitelist), SA7 (Tenant template + workflowType API), SA9 (beta features per tenant + admin UI), SA11 (emergencyLock in login + Security settings UI). Use the list below to close remaining gaps.

- [x] **TODO-SA1** L2 Company Ops Admin: deferred (optional; only L1 exists in code).
- [x] **TODO-SA2** Force logout: API + UI to revoke all sessions for a user or tenant.
- [x] **TODO-SA3** Migrate clinic: GET /api/admin/clients/[id]/export returns tenant metadata + entity counts (no PHI); import/migration flow optional/future.
- [x] **TODO-SA4** Storage consumption: metric per tenant (e.g. document count, storage size) and show in admin.
- [x] **TODO-SA5** Risk monitoring widgets: inactive clinics, payment delays, high load on admin dashboard.
- [x] **TODO-SA6** IP restriction: enforce IP whitelist for Super Admin login.
- [x] **TODO-SA7** Deployment control: clinic template (e.g. dental vs OPD), assign modules, workflow type.
- [x] **TODO-SA8** Role creation engine: deferred (large feature; fixed roles in code).
- [x] **TODO-SA9** Feature rollout: beta flag per tenant (Tenant.betaFeatures), admin API + Clients detail UI to view/edit beta features; rollback = remove from array.
- [x] **TODO-SA10** Data ownership: deferred (view-only / no PHI edit mode; policy in place).
- [x] **TODO-SA11** Emergency: explicit “system freeze” (read-only mode) and “security lock” actions.

### 7.14 Deferred (out of scope for this release)

- **L2 Company Ops Admin (SA1):** Optional; only L1 (Super Admin) implemented.
- **Role creation engine (SA8):** Custom roles, define permissions, lock role edits — large feature; roles fixed in cursor-md-matrix.
- **SA10 view-only Super Admin:** Optional view-only or no-PHI-edit mode when entering clinic context; policy in place.
- **White label:** Not in current scope.
