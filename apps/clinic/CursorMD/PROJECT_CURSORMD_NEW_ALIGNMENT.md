# Project Alignment with CursorMD/New

This document records how the **codebase maps to CursorMD/New** so implementation stays within the spec. All changes must follow the four files in `CursorMD/New`.

---

## 1. Roles (clinic-complete-specification.md, database-schema.mermaid)

| CursorMD/New | Project (User.role) | Notes |
|--------------|---------------------|--------|
| Super Admin | `super_admin` | Same. |
| Doctor | `doctor` | Same. |
| Admin | `admin` or `clinic_admin` | Spec says "Admin"; DB uses `clinic_admin` for backward compat. Permissions treat both as Admin (`lib/permissions/constants.js`: `resolveRole('clinic_admin') === 'admin'`). |
| Manager | `manager` | Same. |
| (Patient portal) | `patient` | For patient portal only; not in dashboard matrix. |

**Other roles in User model** (nurse, receptionist, accountant, pharmacist, lab_tech): Used for staff types; permission matrix in CursorMD/New defines only Super Admin, Doctor, Admin, Manager for dashboard. These map to Manager-level or custom logic where needed.

---

## 2. Data Model (database-schema.mermaid)

| CursorMD/New entity | Project | Notes |
|---------------------|---------|--------|
| CLINICS | **Tenant** | Tenant = Clinic. All queries use `tenantId` (maps to `clinic_id` in spec). |
| USERS | **User** | `tenantId` = clinic_id; `role` enum includes admin, clinic_admin, etc. |
| PATIENTS | **Patient** | `tenantId` on all. |
| APPOINTMENTS | **Appointment** | Status values: scheduled, confirmed, arrived, in_queue, in_progress, completed, cancelled, no_show. Spec says "checked-in" → we use `arrived` / `in_progress`. |
| MEDICAL_RECORDS | **ClinicalNote** + prescriptions, lab | Split across ClinicalNote, Prescription, LabOrder, LabResult. |
| PRESCRIPTIONS | **Prescription** | Aligned. |
| INVOICES / PAYMENTS | **Invoice**, **Payment** | Aligned. |
| INVENTORY / MEDICINES | **InventoryItem**, **StockBatch**, **Drug** | Schema differs slightly; semantics aligned. |
| STAFF / SCHEDULES | **Doctor**, **User** (staff roles), schedule APIs | Staff = Users with clinic roles + Doctor model. |
| NOTIFICATIONS | **Notification** | Aligned. |
| AUDIT_LOGS | **AuditLog** | Aligned. |
| SUBSCRIPTIONS | **Subscription** | Aligned. |

**Database:** Spec mentions PostgreSQL; project uses **MongoDB**. Field names and relationships follow the schema; storage engine differs.

---

## 3. Real-Time Events (realtime-caching-strategy.md)

**Event names use colon format** from CursorMD/New. Server emits both spec events (e.g. `appointment:created`) and legacy dot events (e.g. `appointment.created`) for backward compatibility. Client listens for both.

| Spec event | Purpose |
|------------|--------|
| `appointment:created` | New appointment booked |
| `appointment:updated` | Rescheduled/modified |
| `appointment:cancelled` | Cancelled |
| `appointment:checkin` | Patient checked in (we emit on arrived / in_queue / in_progress) |
| `appointment:completed` | Consultation completed |
| `patient:updated` | Patient info modified |
| `patient:queue_status` | Queue position updated |
| `payment:received` | Payment completed |
| `notification:new` | New notification |

**Implementation:** `lib/realtime/realtime-manager.js` (emit), `lib/realtime/realtime-client.js` (subscribe).

---

## 4. Caching (realtime-caching-strategy.md)

- **Frontend (SWR):** `lib/cache/cache-config.js` – staleTime/cacheTime in ms; aligned with spec intent.
- **Backend (Redis):** TTLs in seconds in `lib/constants/cache-ttl.js`: APPOINTMENTS 60, PATIENTS 300, DOCTORS 3600, SETTINGS 86400, STATS 300, MEDICINES 1800.

---

## 5. Permissions (clinic-complete-specification.md)

Permission matrix (Super Admin, Doctor, Admin, Manager) is implemented in `lib/permissions/constants.js`. Admin has same clinic-level access as Doctor with restrictions enforced in API/UI (e.g. cannot assign Admin/Manager, no billing config). `hasPermission(role, resource, action)` uses `resolveRole(role)` so `clinic_admin` is treated as `admin`.

---

## 6. Dashboards (clinic-dashboard-architecture.mermaid)

- **Super Admin:** `/admin` – platform-wide; only `super_admin` role.
- **Doctor:** `/dashboard`, `/doctors/*`, `/patients/*`, etc. – clinic owner; `doctor` or `clinic_admin`.
- **Admin:** Same routes as Doctor; role `clinic_admin` or `admin`; restrictions in API.
- **Manager:** Limited access; `manager` role; reception-style tasks.

Sidebar and route guards use `user.role === 'super_admin'` for admin, and `user.role === 'clinic_admin'` (or `admin`) for clinic Admin.

---

When adding or changing features, update the relevant CursorMD/New file first, then implement. Use this doc to keep project semantics aligned with CursorMD/New.
