# CursorMD/New – Point-by-Point Checklist

Every item from the four CursorMD/New files is listed here. Implementation must satisfy each point.

---

## 1. clinic-complete-specification.md

### 1.1 Permission Matrix (each row enforced)

| #   | Feature/Module                                     | Super Admin | Doctor     | Admin         | Manager                | Implementation                                                                                    |
| --- | -------------------------------------------------- | ----------- | ---------- | ------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | View all clinics                                   | ✅          | ❌         | ❌            | ❌                     | `canViewAllClinics(role)` in `lib/permissions/cursor-md-matrix.js`                                |
| 2   | View own clinic stats                              | ✅          | ✅         | ✅            | ✅                     | `canViewOwnClinicStats(role)`; dashboard for all                                                  |
| 3   | Real-time analytics                                | ✅          | ✅         | ✅            | 📊 View Only           | `canViewRealtimeAnalytics(role)`                                                                  |
| 4   | Export reports                                     | ✅          | ✅         | ✅            | ❌                     | `canExportReports(role)` / `canExportData(role)`                                                  |
| 5   | Add patient                                        | ✅          | ✅         | ✅            | ✅                     | `canAddPatient(role)` + RESOURCES.PATIENT                                                         |
| 6   | Edit patient                                       | ✅          | ✅         | ✅            | ✅                     | `canEditPatient(role)`                                                                            |
| 7   | Delete patient                                     | ✅          | ✅         | ✅            | ❌                     | `canDeletePatient(role)`                                                                          |
| 8   | View medical history                               | ✅          | ✅         | ✅            | ⚠️ Basic Only          | Permission + optional scope in API                                                                |
| 9   | Upload documents                                   | ✅          | ✅         | ✅            | ✅                     | RESOURCES.PATIENT + upload                                                                        |
| 10  | Access sensitive data                              | ✅          | ✅         | ✅            | ❌                     | `canAccessPHI(user)` – Manager excluded                                                           |
| 11  | Create/Edit/Cancel appointment                     | ✅          | ✅         | ✅            | ✅ (cancel ⚠️ own)     | RESOURCES.APPOINTMENT; cancel-own in API                                                          |
| 12  | View calendar                                      | ✅          | ✅         | ✅            | ✅                     | Appointment list/calendar                                                                         |
| 13  | Manage schedules                                   | ✅          | ✅         | ✅            | ❌                     | `canManageSchedules(role)`                                                                        |
| 14  | Send reminders                                     | ✅          | ✅         | ✅            | ✅                     | Notification/reminder APIs                                                                        |
| 15  | Create invoice / Process payment                   | ✅          | ✅         | ✅            | ✅                     | RESOURCES.INVOICE, PAYMENT                                                                        |
| 16  | Issue refund                                       | ✅          | ✅         | ✅            | ❌                     | `canIssueRefund(role)`                                                                            |
| 17  | View revenue reports                               | ✅          | ✅         | ✅            | ❌                     | `canViewRevenueReports(role)`                                                                     |
| 18  | Manage pricing                                     | ✅          | ✅         | ✅            | ❌                     | `canManagePricing(role)`                                                                          |
| 19  | Insurance claims                                   | ✅          | ✅         | ✅            | ❌                     | `canAccessInsuranceClaims(role)`                                                                  |
| 20  | Create prescription                                | ✅          | ✅         | ⚠️ View Only  | ❌                     | `canCreatePrescription(role)`; Admin READ only                                                    |
| 21  | Add diagnosis                                      | ✅          | ✅         | ❌            | ❌                     | `canAddDiagnosis(role)`                                                                           |
| 22  | Treatment plans                                    | ✅          | ✅         | ⚠️ View Only  | ❌                     | `canCreateTreatmentPlan(role)`                                                                    |
| 23  | Medical notes                                      | ✅          | ✅         | ❌            | ❌                     | `canAddMedicalNotes(role)`                                                                        |
| 24  | Upload lab reports                                 | ✅          | ✅         | ✅            | ✅                     | LAB_RESULT                                                                                        |
| 25  | Add medicine/item                                  | ✅          | ✅         | ✅            | ❌                     | `canAddMedicineItem(role)`                                                                        |
| 26  | Update stock                                       | ✅          | ✅         | ✅            | ⚠️ View Only           | `canUpdateStock(role)`                                                                            |
| 27  | Set stock alerts                                   | ✅          | ✅         | ✅            | ❌                     | Inventory permissions                                                                             |
| 28  | Manage suppliers                                   | ✅          | ✅         | ✅            | ❌                     | `canManageSuppliers(role)`                                                                        |
| 29  | Track usage                                        | ✅          | ✅         | ✅            | ⚠️ View Only           | INVENTORY.READ                                                                                    |
| 30  | Add/Edit/Delete staff                              | ✅          | ✅         | ✅/⚠️ Limited | ❌                     | `canAddStaff`, `canDeleteStaff(role)`                                                             |
| 31  | Assign admin/manager                               | ✅          | ✅         | ❌            | ❌                     | `canAssignAdminManager(role)` – enforce in user API                                               |
| 32  | Manage schedules (staff)                           | ✅          | ✅         | ✅            | ❌                     | `canManageSchedulesStaff(role)`                                                                   |
| 33  | Track attendance                                   | ✅          | ✅         | ✅            | ⚠️ View Only           | REPORT.READ                                                                                       |
| 34  | Daily/Monthly/Revenue/Patient/Treatment analytics  | Per matrix  | Per matrix | Per matrix    | View only / Basic / ❌ | `canViewDailyReports`, `canViewMonthlyReports`, `canViewRevenueAnalytics`, `canExportData`        |
| 35  | Send SMS/Email, Bulk messaging, Reminders          | ✅          | ✅         | ✅            | ✅/❌                  | Notification APIs                                                                                 |
| 36  | Marketing campaigns                                | ✅          | ✅         | ⚠️ Limited    | ❌                     | Optional feature flag                                                                             |
| 37  | Clinic settings                                    | ✅          | ✅         | ⚠️ Limited    | ❌                     | `canEditClinicSettings(role)`                                                                     |
| 38  | User permissions                                   | ✅          | ✅         | ❌            | ❌                     | `canEditUserPermissions(role)`                                                                    |
| 39  | Billing/Integration settings, Backup               | ✅          | ✅         | ❌            | ❌                     | `canEditBillingSettings`, `canEditIntegrationSettings`, `canBackupRestore`                        |
| 40  | Manage subscriptions, System logs, DB, All clinics | ✅          | ❌         | ❌            | ❌                     | `canManageSubscriptions`, `canAccessSystemLogs`, `canManageDatabase`, `canViewAllClinicsOverview` |
| 41  | Support tickets                                    | ✅          | ⚠️ Own     | ⚠️ Own        | ⚠️ Own                 | Scope by user in API                                                                              |

### 1.2 Super Admin Dashboard (Section A)

| #   | Point                                      | Status                    |
| --- | ------------------------------------------ | ------------------------- |
| 1   | Total clinics registered (active/inactive) | Widget on admin dashboard |
| 2   | Total revenue across all clinics           | Widget                    |
| 3   | New registrations this month               | Widget                    |
| 4   | Active subscriptions vs expired            | Widget                    |
| 5   | System health metrics                      | Widget / API              |
| 6   | Support ticket status                      | Widget                    |
| 7   | Top performing clinics                     | Widget                    |
| 8   | Geographic distribution map                | Widget (if implemented)   |
| 9   | Multi-clinic management panel              | `/admin` routes           |
| 10  | Subscription billing automation            | Subscription services     |
| 11  | Usage analytics per clinic                 | Reports                   |
| 12  | System-wide announcements                  | Notifications             |
| 13  | Backup schedule management                 | Settings/scripts          |
| 14  | User audit logs                            | Activity logs             |
| 15  | Revenue tracking & commission              | Financial reports         |
| 16  | Feature flag management                    | Settings/features         |

### 1.3 Doctor Dashboard (Section B)

| #       | Point                                                                                                                                                  | Status                             |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| 1       | Today's appointments count                                                                                                                             | Dashboard stats                    |
| 2       | Patients checked in/waiting                                                                                                                            | Dashboard / queue                  |
| 3       | Today's revenue                                                                                                                                        | Dashboard                          |
| 4       | Pending payments                                                                                                                                       | Dashboard                          |
| 5       | Stock alerts                                                                                                                                           | Dashboard                          |
| 6       | Upcoming appointments (next 3 hours)                                                                                                                   | Dashboard                          |
| 7       | Weekly revenue trend chart                                                                                                                             | Charts                             |
| 8       | Popular treatments this month                                                                                                                          | Charts                             |
| 9       | Staff on duty status                                                                                                                                   | Dashboard                          |
| 10      | Quick actions (Add Patient, New Appointment, New Prescription)                                                                                         | QuickActions component             |
| 11–20   | Appointments module (calendar, drag-drop, color-coded, search, recurring, waitlist, reminders, no-show, history)                                       | Appointments pages/API             |
| 21–33   | Patient management (directory, search, profiles, family, portal, consent)                                                                              | Patients pages/API                 |
| 34–45   | Medical records (prescriptions, diagnosis ICD, treatment plan, notes, lab, certificates, referral, export)                                             | Prescriptions, clinical notes, lab |
| 46–59   | Billing & payments (invoice, payment methods, partial, outstanding, reminders, discount, packages, insurance, receipt, refund, reports, GST, expense)  | Invoices, payments, reports        |
| 60–70   | Inventory (medicine, equipment, stock, expiry, batch, suppliers, PO, logs, valuation, reorder, barcode)                                                | Inventory pages/API                |
| 71–80   | Staff management (profiles, directory, role assignment, schedule, attendance, leave, performance, salary, commission, activity logs)                   | Users, doctors, schedule           |
| 81–93   | Reports & analytics (footfall, revenue, treatment-wise, doctor-wise, collection, outstanding, inventory, usage, appointments, retention, peak, export) | Reports API/pages                  |
| 94–103  | Communication (SMS, email, WhatsApp, templates, bulk, feedback)                                                                                        | Notifications, templates           |
| 104–113 | Settings (clinic profile, hours, services, pricing, staff permissions, integration, backup, notifications, templates, tax)                             | Settings pages                     |

### 1.4 Admin Dashboard (Section C)

| #   | Point                                                                                             | Status                                    |
| --- | ------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1   | Same widgets as doctor but cannot modify clinic settings                                          | Dashboard + `canEditClinicSettings(role)` |
| 2   | Cannot assign/remove Admin or Manager                                                             | `canAssignAdminManager(role)` in user API |
| 3   | Cannot access billing configuration                                                               | `canEditBillingSettings(role)`            |
| 4   | Cannot modify clinic profile                                                                      | `canEditClinicSettings(role)`             |
| 5   | Cannot delete critical data                                                                       | DELETE checks per resource                |
| 6   | Cannot access system-level settings                                                               | Super Admin only routes                   |
| 7   | Full access: patients, appointments, billing, inventory, staff scheduling, reports, communication | PERMISSIONS.admin                         |

### 1.5 Manager Dashboard (Section D)

| #   | Point                                                                                         | Status                                                                       |
| --- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | Today's appointments, Patients waiting, Today's billing summary, Quick actions (limited)      | Dashboard with Manager role                                                  |
| 2   | View-only reports, Add/edit patients (basic), Book appointments, Create invoices (no pricing) | PERMISSIONS.manager                                                          |
| 3   | No medical records, No inventory manage, No staff, No settings                                | PERMISSIONS.manager (prescription, clinical_note, inventory, user, settings) |

### 1.6 Backend Folder Structure (Section 3)

Spec shows `clinic-backend/src/api/v1/...`. Project uses Next.js `app/api/`. Mapping:

| Spec                        | Project                                              |
| --------------------------- | ---------------------------------------------------- |
| auth/\*.controller.js       | app/api/auth/\*                                      |
| superadmin/\*.controller.js | app/api/admin/\*                                     |
| doctor/\*.controller.js     | app/api/\* (dashboard, appointments, patients, etc.) |
| admin/\* (filtered)         | Same routes with role check                          |
| manager/\* (limited)        | Same routes with permission check                    |
| shared/\*                   | app/api/notifications, file-upload, search           |
| models/\*.model.js          | models/\*.js                                         |
| services/\*.service.js      | services/\*.js                                       |
| middlewares/\*              | middleware/\*.js                                     |
| validators/\*               | lib/validations/\*.js                                |
| jobs/\*                     | scripts/, cron, or queue                             |
| websocket/\*                | lib/realtime/, lib/socket/                           |

### 1.7 Technical Recommendations (Section 5)

| #   | Point                                                | Implementation                         |
| --- | ---------------------------------------------------- | -------------------------------------- |
| 1   | Caching: Redis, cache invalidation, TTL              | lib/cache/, lib/constants/cache-ttl.js |
| 2   | DB: indexing, pagination                             | Models indexes; API pagination         |
| 3   | API: pagination, lazy load                           | List endpoints paginated               |
| 4   | Real-time: WebSocket, SSE, optimistic UI             | lib/realtime/, realtime-client         |
| 5   | Auth: JWT refresh, 2FA, 30 min timeout, IP whitelist | Auth routes, middleware                |
| 6   | RBAC, rate limit, validation                         | middleware/, lib/validations/          |

---

## 2. clinic-dashboard-architecture.mermaid

| #   | Point                                      | Status                                                                                                                         |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Roles: Super Admin, Doctor, Admin, Manager | User.role; resolveRole(clinic_admin)=admin                                                                                     |
| 2   | Super Admin Dashboard: SA1–SA8             | /admin: analytics, clinics, users, billing, logs, revenue, support, backup                                                     |
| 3   | Doctor Dashboard: D1–D11                   | /dashboard, appointments, patients, medical, prescriptions, billing, staff, inventory, reports, settings, assign admin/manager |
| 4   | Admin Dashboard: A1–A8                     | Same routes as doctor; restrictions via canAssignAdminManager, canEditClinicSettings, etc.                                     |
| 5   | Manager Dashboard: M1–M6                   | View appointments, Add/edit patients, Book, Basic billing, View reports, Reception                                             |
| 6   | Core modules MOD1–MOD8                     | Patient, Appointment, Billing, Medical Records, Inventory, Staff, Reports, Communication                                       |
| 7   | Real-time: RT1–RT5                         | Live appointments, Queue status, Notifications, Booking widget, Payment confirmations                                          |
| 8   | Backend: API, WS, CACHE, DB, STORAGE       | app/api, lib/realtime, lib/cache, MongoDB, uploads                                                                             |

---

## 3. database-schema.mermaid

| Entity                | Project model                     | Notes                                                                                                                           |
| --------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------- | ---------------------------------- | --------- | ----------------------- |
| USERS                 | User                              | role enum includes super_admin, admin, doctor, manager; tenantId = clinic_id                                                    |
| CLINICS               | Tenant                            | Same semantics                                                                                                                  |
| PATIENTS              | Patient                           | tenantId, patientId, name, phone, email, dob, gender, address, emergency_contact, insurance_details, allergies, medical_history |
| APPOINTMENTS          | Appointment                       | tenantId, patientId, doctorId, appointmentDate/Time, duration, status (scheduled                                                | confirmed | arrived                                   | ...                                | cancelled | no_show), reason, notes |
| MEDICAL_RECORDS       | ClinicalNote + Prescription + Lab | diagnosis, symptoms, examination_notes, vital_signs, treatment_plan                                                             |
| PRESCRIPTIONS         | Prescription                      | medical_record_id, patient_id, doctor_id, prescribed_date, notes, is_digital_signature                                          |
| PRESCRIPTION_ITEMS    | Prescription items                | medicine_id, medicine_name, dosage, frequency, duration_days, instructions                                                      |
| INVOICES              | Invoice                           | invoice_number, total_amount, discount, tax, final_amount, status (pending                                                      | partial   | paid                                      | cancelled), due_date               |
| INVOICE_ITEMS         | Invoice line items                | item_name, description, quantity, unit_price, total                                                                             |
| PAYMENTS              | Payment                           | amount, method (cash                                                                                                            | card      | upi                                       | insurance), transaction_id, status |
| INVENTORY / MEDICINES | InventoryItem, StockBatch, Drug   | category, stock, reorder, expiry, batch, etc.                                                                                   |
| STAFF                 | Doctor, User (staff roles)        | working_hours, role (doctor                                                                                                     | nurse     | receptionist                              | other)                             |
| SCHEDULES             | Doctor schedule APIs              | schedule_date, start_time, end_time, is_available                                                                               |
| NOTIFICATIONS         | Notification                      | type, channel, is_read, metadata                                                                                                |
| LAB_REPORTS           | LabResult                         | test_name, test_results, file_url, report_date                                                                                  |
| AUDIT_LOGS            | AuditLog                          | action, entity_type, entity_id, old_value, new_value, ip_address                                                                |
| SUBSCRIPTIONS         | Subscription                      | plan (basic                                                                                                                     | pro       | enterprise), start_date, end_date, status |
| PERMISSIONS           | lib/permissions/constants.js      | role, module, permissions                                                                                                       |

---

## 4. realtime-caching-strategy.md

| #   | Point                                                                                             | Status                                                                      |
| --- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | Events: appointment:created, updated, cancelled, checkin, completed, reminder                     | realtime-manager emits; client subscribes                                   |
| 2   | Events: patient:registered, updated, queue_status                                                 | emitPatientUpdated, emitQueueUpdate; patient:queue_status                   |
| 3   | Events: payment:received, invoice:generated, payment:pending                                      | emitPaymentReceived; others as needed                                       |
| 4   | Events: stock:low, stock:updated, medicine:expired                                                | inventory.service createStockTransaction → notifyStockUpdated/Low/Expired   |
| 5   | Events: notification:new, notification:broadcast                                                  | emitNotification                                                            |
| 6   | Events: dashboard:refresh, stats:updated                                                          | Client subscribes; server can emit                                          |
| 7   | WebSocket: auth token, join clinic room, join role room                                           | realtime: join-tenant(tenantId); auth can be added                          |
| 8   | subscribe:appointments                                                                            | Server: socket.on('subscribe:appointments'); Client: emit after join-tenant |
| 9   | publishEvent(clinicId, event, payload)                                                            | realtime-manager.publishEvent(tenantId, event, payload)                     |
| 10  | Redis TTL: APPOINTMENTS 60, PATIENTS 300, DOCTORS 3600, SETTINGS 86400, STATS 300, MEDICINES 1800 | lib/constants/cache-ttl.js                                                  |
| 11  | React Query / SWR: staleTime, cacheTime per data type                                             | lib/cache/cache-config.js                                                   |
| 12  | Cache invalidation rules                                                                          | On event: invalidate related keys (see realtime-caching-strategy.md)        |

---

## Usage

- **API routes:** Use `canAssignAdminManager(user.role)`, `canEditClinicSettings(user.role)`, etc. from `lib/permissions/cursor-md-matrix.js` where the spec restricts by role.
- **UI:** Use same helpers to show/hide sections (e.g. Export reports, Assign admin/manager, Settings).
- **Realtime:** Use `publishEvent(tenantId, 'appointment:created', payload)` from realtime-manager when creating appointments; client already listens for colon events and `subscribe:appointments`.

When adding a new feature, add the corresponding matrix row and checklist point so every CursorMD/New point remains implemented.

---

## Related

- **Scope boundary:** See **SCOPE_BOUNDARY_AND_USAGE.md** in this folder for what is outside CursorMD/New, what can be safely removed, and what to keep and use in the project.
