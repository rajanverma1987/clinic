# Clinic Management Dashboard — Architecture (Source of Truth)

This document is the **single correct architecture reference** for the project. It aligns with the codebase and with the other CursorMD/New specs. Any conflict with other docs: this file and CursorMD/New win.

**Last updated:** 2025-02-09

---

## 1. Scope & Purpose

- **Product scope:** Clinic-only. No public or patient self-service in scope. Users are clinic staff: Super Admin, Doctor, Clinic Admin, Admin, Manager, Nurse, Receptionist, Accountant, Pharmacist.
- **Purpose of this doc:** Describe stack, roles, app structure, backend (API, WebSocket, cache, DB), real-time behaviour, and security so implementation and onboarding stay consistent.

---

## 2. Tech Stack (Actual)

| Layer            | Technology                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| **Frontend**     | Next.js 14+ (App Router), React                                                                                 |
| **API**          | Next.js Route Handlers (`app/api/**/route.js`)                                                                  |
| **Database**     | MongoDB; ODM: Mongoose                                                                                          |
| **Real-time**    | Socket.IO (custom server in `server.js`)                                                                        |
| **Cache**        | Redis (optional). Graceful degradation when Redis is disabled or unavailable.                                   |
| **Telemedicine** | WebRTC (SimplePeer, TURN optional)                                                                              |
| **Auth**         | JWT (access + refresh), optional 2FA, OAuth (Google), magic link                                                |
| **i18n**         | Context-based; locale/currency/timezone from tenantSettings; UI strings via `lib/i18n/locales` (en, ar, es, fr) |

**Note:** The project does **not** use PostgreSQL. All persistence is MongoDB. References to PostgreSQL in other CursorMD files are legacy; treat MongoDB as correct.

---

## 3. Roles (Canonical)

Nine roles. Permission matrix and feature access are defined in `clinic-complete-specification.md`.

| Role             | Description                                                                                                                                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **super_admin**  | Platform owner. Full access to `/admin`: all clinics, subscriptions, users, financial, content, settings, activity logs. No tenantId scope.                                                                                                                             |
| **doctor**       | Clinic owner/primary. Full clinic access; can create Admin/Manager; manage staff and settings. Gated by subscription features.                                                                                                                                          |
| **clinic_admin** | Alias for admin in permissions. Full clinic access except cannot assign Admin/Manager; no billing config.                                                                                                                                                               |
| **admin**        | Full clinic access within tenant. Cannot create Admin/Manager. Settings read; limited audit.                                                                                                                                                                            |
| **manager**      | Limited: view-only reports; add/edit patients; book/cancel appointments; create invoices (no pricing); no medical records, no inventory manage, no staff, no settings. Nav restrictions: no `/staff`, `/settings`, `/reports`, `/prescriptions/new`, `/inventory/lots`. |
| **nurse**        | Clinical support. Patients, appointments, prescriptions (read), lab orders/results, clinical notes, inventory read, queue read/update, telemedicine read.                                                                                                               |
| **receptionist** | Front desk. Patients CRUD; appointments CRUD/cancel; invoices/payments; queue CRUD; prescriptions/inventory read.                                                                                                                                                       |
| **accountant**   | Financial. Invoices/payments full; reports read/export; patients/appointments read; no clinical, no telemedicine.                                                                                                                                                       |
| **pharmacist**   | Prescriptions dispense; inventory CRUD; patients/appointments read.                                                                                                                                                                                                     |

---

## 4. Application Structure (Repository)

**Monorepo layout.** Root contains workspaces; the clinic app lives under `apps/clinic/`. Run from repo root: `npm run dev` (clinic), `npm run dev:website` (marketing), `npm run build` (clinic).

```
<repo-root>/
├── package.json            # Workspaces: apps/*, packages/*
├── apps/
│   ├── website/            # Marketing (e.g. doctorsclinic.services): home, pricing, blog, about, contact, legal
│   │   ├── app/
│   │   ├── components/
│   │   └── package.json     # @clinic-saas/website
│   │
│   └── clinic/             # Clinic app (e.g. account.doctorsclinic.services): auth, dashboard, admin, API
│       ├── app/             # Next.js App Router (see below)
│       ├── components/, lib/, models/, middleware/, services/, ...
│       ├── server.js       # Next.js + Socket.IO
│       └── package.json    # @clinic-saas/clinic
│
└── packages/                # Shared code
    ├── ui/                  # @clinic-saas/ui
    ├── utils/               # @clinic-saas/utils
    └── shared-config/       # @clinic-saas/shared-config
```

**Clinic app** (apps/clinic/) structure:

```
apps/clinic/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (Route Handlers)
│   ├── admin/              # Super Admin dashboard (all child routes)
│   ├── dashboard/          # Clinic dashboard
│   ├── appointments/       # Clinic: appointments
│   ├── queue/               # Clinic: queue
│   ├── patients/            # Clinic: patients
│   ├── staff/               # Clinic: staff (Doctor/Clinic Admin only)
│   ├── prescriptions/      # Clinic: prescriptions
│   ├── invoices/           # Clinic: billing
│   ├── inventory/          # Clinic: inventory
│   ├── reports/            # Clinic: reports
│   ├── telemedicine/       # Clinic: telemedicine
│   ├── settings/           # Clinic: settings
│   ├── subscription/       # Clinic: subscription
│   ├── doctors/            # Doctor-area: profile, schedule, earnings, reviews, etc.
│   ├── login/, forgot-password/, change-password/, register/
│   ├── support/
│   └── (marketing: blog, legal, privacy, terms, pricing)
├── components/              # Shared UI components
├── contexts/               # React contexts (e.g. Auth)
├── hooks/                  # React hooks
├── lib/                    # Shared libraries
│   ├── api/                # API client, offline queue
│   ├── audit/               # Audit logging
│   ├── auth/                # JWT, magic link, OAuth
│   ├── cache/               # Redis client, cache config, WebSocket→cache sync
│   ├── constants/           # dashboard-structure, permissions, cache TTL, etc.
│   ├── db/                  # MongoDB connection, indexes
│   ├── encryption/          # PHI encryption, E2EE helpers
│   ├── permissions/         # RBAC constants and matrix
│   ├── realtime/            # Realtime manager, client, dashboard hooks
│   ├── socket/              # Socket.IO server (telemedicine/chat)
│   ├── services/            # Base service, decorators
│   ├── validations/         # Input validators
│   ├── webrtc/              # WebRTC / telemedicine
│   └── utils/, i18n/, etc.
├── models/                 # Mongoose models (User, Tenant, Patient, Appointment, etc.)
├── middleware/             # Next.js middleware (auth, rate limit, etc.)
├── services/               # Business logic services (queue, notifications, etc.)
├── server.js               # Custom server: Next.js + Socket.IO
└── CursorMD/New/           # Specs: architecture, schema, realtime, checklist
```

- **API:** All HTTP APIs live under `apps/clinic/app/api/`. No separate Express/Fastify server; Next.js Route Handlers only.
- **WebSocket:** Socket.IO is mounted on the same Node server as Next.js (`server.js`). Optional Redis pub/sub for multi-instance scaling (see `realtime-caching-strategy.md`).
- **Database:** MongoDB. Connection and indexes: `lib/db/connection.js`, `lib/db/indexes.js`. All collections are multi-tenant via `tenantId`.

---

## 5. Dashboards & Route Groups

- **Clinic dashboard:** `/dashboard`. Sidebar routes: dashboard, appointments, queue, patients, staff, prescriptions, invoices, inventory, reports, telemedicine, settings, subscription. Visibility is gated by role, subscription features, and permissions (see `lib/constants/dashboard-structure.js`: `ROUTES`, `getNavItemsForRole`). Manager is excluded from staff, settings, reports, prescriptions/new, inventory/lots (see `MANAGER_FORBIDDEN_PATHS_NAV`).
- **Doctor area:** `/doctors/*` (profile, schedule, earnings, reviews, analytics, messages, register, leaves). Appointments and patient detail are under `/appointments` and `/patients/[id]` with role-based tabs.
- **Super Admin:** `/admin` and all children (clients, subscriptions, users, patients, appointments, doctors, content, financial, reports, analytics, activity-logs, settings, reviews, create-admin). Only `super_admin` role.

---

## 6. Backend Architecture

### 6.1 Request Flow

```
Client (Browser)
  → Next.js (App Router / API Route)
  → Middleware (auth, rate limit)
  → Route Handler (app/api/**/route.js)
  → Services / Models
  → MongoDB
  → Response { success, data, error }
```

- All API responses use a consistent shape: `{ success, data, error }`. No raw MongoDB errors to the client.
- Sensitive routes enforce auth and role/resource checks (RBAC). All queries are scoped by `tenantId` where applicable.

### 6.2 API Layer

- **Location:** `app/api/`.
- **Pattern:** One `route.js` per route; thin handlers; business logic in `services/` or `lib/`.
- **Auth:** JWT in header or cookie; validated in middleware or route. Optional 2FA, OAuth, magic link (see `lib/auth/`).
- **Validation:** Input validated via `lib/validations/` (or equivalent); no business logic in UI.

### 6.3 Database

- **Engine:** MongoDB.
- **ODM:** Mongoose. Models in `models/` (User, Tenant, Patient, Appointment, Invoice, Prescription, Queue, etc.).
- **Multi-tenancy:** Every tenant-scoped collection has `tenantId`. All queries filter by `tenantId` unless the context is Super Admin system-wide.
- **Timestamps:** Stored in UTC. Mongoose `timestamps: true` where applicable.
- **Indexes:** Defined in `lib/db/indexes.js` for heavy read paths (appointments, billing, inventory).

### 6.4 Cache

- **Server:** Redis via `lib/cache/redis-client.js`. Optional: app runs without Redis; cache read/write failures are handled.
- **TTLs:** Defined in `lib/constants/cache-ttl.js` (e.g. appointments, patients, settings, stats). See also `realtime-caching-strategy.md`.
- **Invalidation:** On write, cache is invalidated by pattern or key. WebSocket events can trigger client-side revalidation (see `lib/cache/websocket-sync.js`, `WEBSOCKET_TO_CACHE_EVENT_MAP` in `lib/cache/websocket-cache-events.js`).

### 6.5 Real-Time (WebSocket)

- **Server:** Socket.IO in `server.js` (same process as Next.js). Optional Redis adapter for pub/sub across instances.
- **Client:** `lib/realtime/realtime-manager.js`, `lib/realtime/realtime-client.js`. Hooks: `useDashboardRealtime` (`lib/realtime/useDashboardRealtime.js`), `useRealtime` (`hooks/useRealtime.js` and `contexts/RealtimeContext.jsx`).
- **Events (canonical):** See `lib/cache/websocket-cache-events.js` for WebSocket event names and their cache-invalidation mapping. Examples: `appointment:created`, `appointment:updated`, `queue:updated`, `invoice:paid`, `patient:registered`, `stock:low`, `dashboard:refresh`, etc. Full list and behaviour in `realtime-caching-strategy.md`.

---

## 7. Security & Compliance

- **Tenant isolation:** All tenant data filtered by `tenantId`. Super Admin is the only role that can see cross-tenant data (and only where designed).
- **RBAC:** Permissions in `lib/permissions/constants.js` (RESOURCES, ACTIONS). Nav from `lib/constants/dashboard-structure.js` (ROUTES, getNavItemsForRole, MANAGER_FORBIDDEN_PATHS_NAV). Route security, manager path rules, session, audit, rate limits, feature flags: `lib/constants/route-security.js`; manager access options and path allowlist: `lib/constants/manager-access.js`.
- **PHI:** No PHI in logs, URL params, or notifications. PHI encryption helpers in `lib/encryption/phi-encryption.js`. Audit logs for sensitive create/update/delete (and sensitive read where required).
- **Input:** Sanitization and validation on all inputs; no raw user input in queries.

---

## 8. Related CursorMD/New Files

| File                                      | Purpose                                                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **architecture.md** (this file)           | Single correct architecture reference: stack, roles, app structure, backend, security.                                     |
| **clinic-complete-specification.md**      | Permission matrix, feature specs per role, dashboard widgets, backend folder recommendations.                              |
| **clinic-dashboard-architecture.mermaid** | Diagram: roles, dashboards, core modules, real-time, backend (MongoDB).                                                    |
| **database-schema.mermaid**               | Entities, relationships, field names. Implement with Mongoose in `models/`; all tenant-scoped collections have `tenantId`. |
| **realtime-caching-strategy.md**          | WebSocket events, Redis pub/sub, cache layers, TTLs, invalidation, client socket usage.                                    |
| **CURSORMD_NEW_CHECKLIST.md**             | Checklist of implementation items from the above.                                                                          |

---

## 9. Diagram Reference

- **Roles & dashboards:** See `clinic-dashboard-architecture.mermaid`. Diagram uses **MongoDB** (not PostgreSQL) and reflects the four primary roles plus core modules and real-time; staff roles (nurse, receptionist, accountant, pharmacist) and clinic_admin are in the permission matrix in `clinic-complete-specification.md`.
- **Data model:** See `database-schema.mermaid`. Implement with MongoDB/Mongoose; IDs and types may be adapted (e.g. ObjectId), but relationships and tenantId are as specified.

This architecture document is the single correct reference for the project. When in doubt, align implementation with this file and the other CursorMD/New specs.
