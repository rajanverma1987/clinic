You are working inside an existing Turborepo-style Next.js monorepo that contains:

apps/

- clinic (operational dashboard)
- website (marketing + auth entry)

packages/

- ui
- db
- config

Your task is to transform the clinic dashboard into a high-performance, decision-first system by introducing a dashboard engine layer, aggregation system, and optimized rendering flow.

Follow the instructions strictly.

---

GOAL

Make the clinic dashboard:

- Instant loading
- Aggregation-driven
- Modular
- Cache-aware
- Real-time only where required

The dashboard must stop querying live transactional tables.

---

STEP 1 — CREATE DASHBOARD ENGINE PACKAGE

Create:

packages/dashboard-engine/

Structure:

packages/dashboard-engine/
├─ metrics/
│ ├─ getClinicSummary.ts
│ ├─ getTodayStats.ts
│ └─ getAlerts.ts
│
├─ trends/
│ ├─ getRevenueTrend.ts
│ └─ getPatientFlow.ts
│
├─ actions/
│ ├─ assignStaff.ts
│ └─ retryPayment.ts
│
└─ index.ts

Rules:

- No UI imports
- No direct React usage
- Only business logic + data access
- Must use packages/db

All dashboard reads must go through this package.

---

STEP 2 — ADD AGGREGATED METRICS TABLE

Create DB table:

clinic_dashboard_metrics

Schema:

clinic_id (string)
today_patients (int)
revenue_today (float)
failed_transactions (int)
pending_appointments (int)
active_staff (int)
updated_at (timestamp)

Create:

packages/dashboard-engine/metrics/getClinicSummary.ts

This should ONLY read from this table.

Never compute from raw tables.

---

STEP 3 — ADD BACKGROUND AGGREGATOR

Create:

packages/dashboard-engine/metrics/updateDashboardMetrics.ts

Logic:

- Pull from raw tables
- Calculate daily stats
- Update clinic_dashboard_metrics

Add:

scripts/update-dashboard-metrics.ts

This will run via cron every 1 minute.

---

STEP 4 — CREATE DASHBOARD APIs

Inside:

apps/clinic/app/api/dashboard/

Create:

summary/route.ts
trends/route.ts
actions/route.ts

Each route must call dashboard-engine.

Example:

summary → getClinicSummary
trends → getRevenueTrend
actions → assignStaff / retryPayment

Never query DB directly from API.

---

STEP 5 — RESTRUCTURE DASHBOARD UI

Inside:

apps/clinic/app/dashboard/

Refactor into:

layout.tsx
page.tsx

sections/
├─ KPISection/
├─ AlertsSection/
├─ TrendsSection/
├─ TablesSection/
└─ ActionsSection/

Rules:

KPISection → Server Component
AlertsSection → Server Component
TrendsSection → Client Component
TablesSection → Client Component
ActionsSection → Client Component

---

STEP 6 — DATA LOADING STRATEGY

KPISection:

- Load via server component
- Fetch from /api/dashboard/summary

TrendsSection:

- Use SWR

TablesSection:

- Lazy load on scroll

---

STEP 7 — CACHE LAYER

Create:

packages/config/cache.ts

Implement:

getCache(key)
setCache(key, value, ttl)

Cache Rules:

summary → 60s
alerts → 30s
trends → 300s

Dashboard-engine must check cache before DB.

---

STEP 8 — REAL-TIME EVENTS

Create websocket channel:

dashboard-events

Emit only:

- new appointment
- payment failure
- staff assignment

Do NOT stream analytics.

---

STEP 9 — FINAL DASHBOARD FLOW

When dashboard loads:

1. KPI loads instantly from aggregated table
2. Alerts load next
3. Trends load async
4. Tables load on interaction

No blocking UI allowed.

---

STEP 10 — PERFORMANCE TARGETS

Ensure:

First Paint < 500ms
Summary API < 200ms
Trend API < 600ms

---

OUTPUT EXPECTATION

After implementation:

- No dashboard queries run COUNT or SUM on live tables
- All metrics come from clinic_dashboard_metrics
- UI loads KPI instantly

Implement all files and folder structure required.

Do not modify website app.

---
