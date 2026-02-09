# CursorMD/New – Scope Boundary: What Is Outside, What to Remove, What to Keep

This document lists everything in the codebase that is **outside** the four canonical CursorMD/New files, and classifies each as:

- **KEEP & USE** – Outside the spec but required or recommended; use in the project.
- **KEEP & ALIGN** – Keep in code; optionally add to CursorMD/New so it becomes “in scope.”
- **SAFELY REMOVABLE** – Can be removed or simplified without breaking core behavior (with conditions).

Canonical files: `clinic-complete-specification.md`, `clinic-dashboard-architecture.mermaid`, `database-schema.mermaid`, `realtime-caching-strategy.md`.

---

## Does CursorMD/New Cover 100% of Clinic-Only Functionality?

**No.** CursorMD/New does **not** cover 100% of clinic-only functionality.

- **“Clinic only”** = what Doctor, Admin, and Manager need (excluding Super Admin / platform).
- **Sections 1–3** of `clinic-complete-specification.md` define the **core** clinic spec: permission matrix (Doctor, Admin, Manager), dashboards, 8 core modules, backend structure.
- **Section 4** is titled **“MISSING FEATURES TO ADD (RECOMMENDATIONS)”** — so Patient Portal, WhatsApp, Telemedicine, Mobile, Queue Management System, Lab Integration, etc. are **recommended**, not part of the “complete specification.”

Summary:

| Area                                        | In CursorMD/New (Sections 1–3)                                                            | Not in core spec (Section 4 = recommendations or implied only)                      |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Roles**                                   | Doctor, Admin, Manager only in permission matrix                                          | Patient, nurse, receptionist, accountant, pharmacist (used in app; not in matrix).  |
| **Dashboards**                              | Doctor, Admin, Manager dashboards and widgets                                             | —                                                                                   |
| **Core modules**                            | Patient, Appointments, Billing, Medical Records, Inventory, Staff, Reports, Communication | Queue (real-time “queue status” only; full Queue module is in Section 4).           |
| **Patient Portal**                          | —                                                                                         | Section 4 recommendation #1. App has it.                                            |
| **WhatsApp**                                | Mentioned in Communication (share via WhatsApp)                                           | Full integration in Section 4 #2. App has it.                                       |
| **Telemedicine**                            | —                                                                                         | Section 4 #3. App has it.                                                           |
| **Queue (full module)**                     | —                                                                                         | Section 4 #11 (token, display board, wait time, SMS). App has /queue.               |
| **Lab orders / Lab tests**                  | “Lab order management”, “Report upload” in narrative                                      | No separate Lab module in backend list. App has lab-orders, lab-results, lab-tests. |
| **Prescription e-sign / drug interactions** | —                                                                                         | Not in spec. App has it.                                                            |
| **GDPR (export, delete, anonymize)**        | —                                                                                         | Not in spec. App has it.                                                            |
| **2FA, magic link, OAuth**                  | Auth in backend structure                                                                 | Not detailed in spec. App has it.                                                   |
| **Subscription (clinic view)**              | Doctor ❌ “Manage subscriptions” (platform)                                               | Clinic sees own subscription / upgrade; covered by “view” behavior.                 |

So:

- **Fully specified for clinic:** Permission matrix, Doctor/Admin/Manager dashboards, 8 core modules (at a high level), real-time (appointments, queue status, notifications, booking, payments).
- **Not fully specified (recommendations or missing):** Patient Portal, WhatsApp integration, Telemedicine, full Queue module, Lab as a first-class module, prescription e-sign/drug check, GDPR, 2FA/OAuth, staff roles (nurse, receptionist, etc.) in the matrix.

To get **100% clinic-only coverage in the spec**, you would: (1) move the needed Section 4 items into the main specification (e.g. “Patient Portal”, “Queue module”, “Telemedicine”, “WhatsApp”), and (2) add staff roles and any missing features (e.g. prescription e-sign, GDPR, lab module) to the permission matrix and backend/module list.

---

## 1. Roles (Permission Matrix)

**In CursorMD/New:** Permission matrix and architecture define **4 roles only:** Super Admin, Doctor, Admin, Manager.

**In code:** `lib/permissions/constants.js` defines **10 roles:**
`super_admin`, `admin`, `clinic_admin`, `doctor`, `nurse`, `receptionist`, `accountant`, `pharmacist`, `patient`, `manager`.

| Role in code     | In spec?                               | Classification | Action                                                                                                                                                    |
| ---------------- | -------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| super_admin      | Yes                                    | KEEP & USE     | Core.                                                                                                                                                     |
| admin            | Yes                                    | KEEP & USE     | Core.                                                                                                                                                     |
| clinic_admin     | Yes (as Admin)                         | KEEP & USE     | Alias for admin; `resolveRole()` maps it.                                                                                                                 |
| doctor           | Yes                                    | KEEP & USE     | Core.                                                                                                                                                     |
| manager          | Yes                                    | KEEP & USE     | Core.                                                                                                                                                     |
| **patient**      | No (matrix)                            | **KEEP & USE** | Required for Patient Portal (spec Section 4 recommends). Used in patient-portal auth and UI. **Do not remove.**                                           |
| **nurse**        | No (matrix); STAFF in schema has nurse | **KEEP & USE** | Used in Staff/Doctors tab, login, staff page, User model. Removing would break staff assignment. Keep; treat as staff role with existing PERMISSIONS row. |
| **receptionist** | No (matrix); STAFF has receptionist    | **KEEP & USE** | Same as nurse.                                                                                                                                            |
| **accountant**   | No                                     | **KEEP & USE** | Used in settings, staff, login, User. Keep for real-world clinics.                                                                                        |
| **pharmacist**   | No                                     | **KEEP & USE** | Used in settings, staff, login, User. Keep for real-world clinics.                                                                                        |

**Summary – Roles:**

- **Do not remove** any of the 10 roles; they are in active use (login, staff, settings, patient portal).
- **Safely removable:** None. Removing nurse/receptionist/accountant/pharmacist/patient would break staff creation and patient portal.
- **Optional:** Add nurse, receptionist, accountant, pharmacist, patient to CursorMD/New (e.g. “Supported staff/portal roles”) so they are explicitly in scope.

---

## 2. Database / Models (Entities)

**In CursorMD/New:** `database-schema.mermaid` lists: USERS, CLINICS, PATIENTS, APPOINTMENTS, MEDICAL_RECORDS, PRESCRIPTIONS, PRESCRIPTION_ITEMS, MEDICINES, INVOICES, INVOICE_ITEMS, PAYMENTS, INVENTORY, STOCK_MOVEMENTS, STAFF, SCHEDULES, NOTIFICATIONS, LAB_REPORTS, AUDIT_LOGS, SUBSCRIPTIONS, PERMISSIONS.

**In code (models/):** Many models map 1:1; some names differ; some entities are not in the schema.

| Model in code                                                                                            | In schema?                                                                | Classification | Action                                                                       |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------- |
| User, Tenant, Patient, Appointment, Prescription, Invoice, Payment, Notification, AuditLog, Subscription | Yes (as USERS, CLINICS, etc.)                                             | KEEP & USE     | Core.                                                                        |
| ClinicalNote, LabResult, Drug, InventoryItem, StockBatch, StockTransaction                               | Yes (MEDICAL_RECORDS, LAB_REPORTS, MEDICINES, INVENTORY, STOCK_MOVEMENTS) | KEEP & USE     | Core.                                                                        |
| Doctor                                                                                                   | Yes (STAFF)                                                               | KEEP & USE     | Staff/doctor profile and schedule.                                           |
| **Queue**                                                                                                | No                                                                        | **KEEP & USE** | Queue Management is in spec (core module). Used by queue API and UI.         |
| **TelemedicineSession**                                                                                  | No                                                                        | **KEEP & USE** | Telemedicine recommended in spec Section 4. Used by telemedicine API and UI. |
| **WhatsAppMessage**                                                                                      | No                                                                        | **KEEP & USE** | WhatsApp recommended in spec Section 4.                                      |
| **Message**                                                                                              | No                                                                        | **KEEP & USE** | In-app messaging; supports “Chat with clinic” (Patient Portal).              |
| **Device**                                                                                               | No                                                                        | **KEEP & USE** | Device/session tracking; used by auth and 2FA.                               |
| **Department, Specialty**                                                                                | No                                                                        | **KEEP & USE** | Supports “Services/treatments”, “Doctor profiles”, admin content.            |
| **NoteTemplate, NotificationTemplate**                                                                   | No                                                                        | **KEEP & USE** | Spec: “Template customization”, “Notification templates”.                    |
| **PasswordReset**                                                                                        | No                                                                        | **KEEP & USE** | Auth flow.                                                                   |
| **PaymentDispute**                                                                                       | No                                                                        | **KEEP & USE** | Spec: “Payment disputes” (Super Admin).                                      |
| **Review**                                                                                               | No                                                                        | **KEEP & USE** | Doctor reviews in spec.                                                      |
| **Session**                                                                                              | No                                                                        | **KEEP & USE** | Auth/session management.                                                     |
| **SubscriptionPayment, SubscriptionPlan**                                                                | No                                                                        | **KEEP & USE** | Billing and plan features.                                                   |
| **Supplier**                                                                                             | No                                                                        | **KEEP & USE** | Spec: “Supplier management” (inventory).                                     |
| **SystemSettings**                                                                                       | No                                                                        | **KEEP & USE** | Settings and config.                                                         |
| **IpWhitelist**                                                                                          | No                                                                        | **KEEP & USE** | Security; used by admin.                                                     |
| **InsuranceClaim**                                                                                       | No                                                                        | **KEEP & USE** | Spec: “Insurance claims”.                                                    |
| **LabOrder, LabTest**                                                                                    | No                                                                        | **KEEP & USE** | Lab orders and tests (medical records / lab workflow).                       |

**Summary – Models:**

- **Keep & use** all listed models; they implement or extend spec features.
- **Safely removable:** None of the above; each is referenced by API, UI, or auth.
- **Optional:** Add Queue, TelemedicineSession, WhatsAppMessage, Message, Device, Department, Specialty, NoteTemplate, NotificationTemplate, PasswordReset, PaymentDispute, Review, Session, SubscriptionPayment, SubscriptionPlan, Supplier, SystemSettings, IpWhitelist, InsuranceClaim, LabOrder, LabTest to `database-schema.mermaid` (or an “Extended entities” section) so they are in scope.

---

## 3. Realtime Events

**In CursorMD/New:** `realtime-caching-strategy.md` defines events with **colon** names only (e.g. `appointment:created`, `patient:updated`, `payment:received`, `notification:new`, `dashboard:refresh`, `stats:updated`).

**In code:** `lib/realtime/realtime-manager.js` emits both **colon** (spec) and **dot** (e.g. `appointment.created`, `patient.updated`).

| Emission in code                                                                                                                                            | In spec?               | Classification                  | Action                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| appointment:created, patient:queue_status, payment:received, notification:new, stock:low, stock:updated, medicine:expired                                   | Yes                    | KEEP & USE                      | Use these as primary events.                                                                                                                                |
| appointment.created, appointment.statusChanged, patient.checkedIn, patient.updated, queue.updated, payment.received, notification.new, notification.updated | No (dot / extra names) | **SAFELY REMOVABLE** (optional) | If all clients subscribe only to colon events, dot emissions are redundant. You can **remove dot emissions** and keep only colon events to align with spec. |
| prescription.ready, labResult.ready, doctor.statusChanged                                                                                                   | No                     | **KEEP & USE**                  | Useful for UI; keep. Optionally add to realtime-caching-strategy.md.                                                                                        |

**Summary – Realtime:**

- **Keep & use:** All colon-named events; add prescription.ready, labResult.ready, doctor.statusChanged to doc if you want them in scope.
- **Safely removable:** Duplicate **dot** emissions (e.g. `appointment.created` alongside `appointment:created`) **only if** every client uses colon names only. Then remove dot emissions from realtime-manager.
- **Do not remove:** prescription.ready, labResult.ready, doctor.statusChanged unless you drop the features that depend on them.

---

## 4. API Routes

**In CursorMD/New:** Backend structure is high-level (auth, superadmin, doctor, admin, manager, shared). It does not list every route.

| Route / area                                                                                                                             | In spec?                 | Classification | Action                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | -------------- | --------------------------------------------------------------------------------------------------- |
| auth/_, admin/_, appointments, patients, prescriptions, invoices, payments, reports, settings, notifications, queue, subscriptions, etc. | Yes (implied by modules) | KEEP & USE     | Core.                                                                                               |
| **gdpr/**                                                                                                                                | No                       | **KEEP & USE** | Compliance (e.g. anonymize, delete, export, rectify). Required for GDPR.                            |
| **mobile/**                                                                                                                              | No                       | **KEEP & USE** | Spec Section 4 recommends “Mobile App”. Sync, devices, upcoming appointments, recent prescriptions. |
| **sse/**                                                                                                                                 | No                       | **KEEP & USE** | Alternative to WebSocket for real-time; keep if used by frontend.                                   |
| **telemedicine/**                                                                                                                        | No (explicit list)       | **KEEP & USE** | Spec Section 4 recommends Telemedicine. Sessions, signaling, waiting-room.                          |
| **whatsapp/**                                                                                                                            | No                       | **KEEP & USE** | Spec Section 4 recommends WhatsApp.                                                                 |
| **prescriptions/…/sign, check-interactions**                                                                                             | No (explicit)            | **KEEP & USE** | Prescription workflow.                                                                              |
| **subscriptions/stripe-complete, [id]/addons**                                                                                           | No                       | **KEEP & USE** | Subscription and add-ons.                                                                           |
| **admin/ip-whitelist, activity-logs, financial/disputes**                                                                                | No                       | **KEEP & USE** | Super Admin: security, audit, disputes.                                                             |
| **batch/**                                                                                                                               | No                       | **KEEP & USE** | Batch operations; keep if used.                                                                     |

**Summary – APIs:**

- **Keep & use** all listed route groups; they support spec or recommended features, or compliance.
- **Safely removable:** Only routes that are **proven unused** (no frontend or integration calls). Identify via usage search before removing.
- **Optional:** Add gdpr, mobile, sse, telemedicine, whatsapp, prescription sign/check-interactions, stripe-complete, addons, ip-whitelist, activity-logs, financial/disputes to the spec “Backend folder structure” so they are in scope.

---

## 5. Quick Reference

| Category     | Safely removable? | What to do                                                                                                                                     |
| ------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Roles**    | No                | Keep all 10 roles. Optionally add nurse, receptionist, accountant, pharmacist, patient to CursorMD/New.                                        |
| **Models**   | No                | Keep all current models. Optionally add extended entities to database-schema.mermaid.                                                          |
| **Realtime** | Yes (partial)     | Can remove **duplicate dot-named** emissions if clients use only colon events. Keep prescription.ready, labResult.ready, doctor.statusChanged. |
| **APIs**     | Only if unused    | Keep all listed APIs. Remove only routes with no references.                                                                                   |

---

## 6. Rules of Thumb

1. **Do not remove** roles, models, or APIs that are referenced by login, staff, patient portal, subscriptions, telemedicine, WhatsApp, GDPR, or admin features.
2. **Safely remove** only: (a) duplicate realtime emissions (dot vs colon) after confirming client usage, or (b) API routes that are truly unused.
3. **Keep and use** everything else; treat CursorMD/New as the minimal core and the rest as **supported extensions** until you explicitly add them to the spec.
4. When in doubt, **keep** and **document** in CursorMD/New (e.g. “Supported staff roles”, “Extended entities”, “Additional events”) so the boundary stays clear and nothing is removed by mistake.
