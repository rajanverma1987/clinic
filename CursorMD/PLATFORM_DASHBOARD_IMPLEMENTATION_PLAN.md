# Dashboard Implementation Plan — Line-by-Line from PLATFORM_POINT_TO_POINT_REPORT.md

This document turns every section of `PLATFORM_POINT_TO_POINT_REPORT.md` into actionable implementation items with checkboxes, file paths, and verification steps. Execute in order.

**100% implementation complete.** (1) Trends are in `/api/dashboard/all` (TrendsSection uses props, no extra request). (2) `stats.failed_transactions` is in `/api/dashboard/all` (from ClinicDashboardMetrics) so ActionsSection “Retry failed payments” shows the correct count. Only Phase 4 manual verification (4.1, 4.3, 4.4) remains—run in your browser.

---

## Phase 0 — Prerequisites (align with report root causes)

- [x] **0.1** Confirm current behaviour: dashboard mount fires 9 requests (1 summary + 8 lists). Document endpoints: `useDashboardStats` → `/dashboard/summary` (or `/reports/dashboard`); `useDashboardLists` → 8 endpoints via `Promise.allSettled`.  
       _Ref: Report "Problem 1 — 9 HTTP requests"_

- [x] **0.2** Confirm `/api/batch` is not used for dashboard (or remove it from dashboard flow). Report says batch route is slower than direct DB.  
       _Ref: Report "Problem 2"_

- [x] **0.3** Confirm `useDashboardStats` has no caching and `useDashboardLists` uses `dashboardCache`.  
       _Ref: Report "Problem 3", "Problem 4"_

- [x] **0.4** Confirm `DashboardLayout` calls `preloadCriticalData` and dashboard page hooks also fetch → risk of duplicate requests.  
       _Ref: Report "Problem 5"_

- [x] **0.5** Confirm SWR global config has `revalidateOnFocus: true` in `Providers.jsx`.  
       _Ref: Report "Problem 6"_

- [x] **0.6** Confirm lists fetch 8 endpoints with no aggregation.  
       _Ref: Report "Problem 7"_

---

## Phase 1 — Backend: Single aggregated API (Day 1)

**Goal:** One endpoint `/api/dashboard/all` returns stats + lists + charts in one response; all DB work in parallel on the server.

### FIX 1 — Create `/api/dashboard/all` route

- [x] **1.1** Create directory: `apps/clinic/app/api/dashboard/all/`.

- [x] **1.2** Create file: `apps/clinic/app/api/dashboard/all/route.js`.

- [x] **1.3** Use existing auth/middleware pattern (same as other dashboard routes):
  - Import: `withAuth` from `@/middleware/auth`, `withErrorHandler` from `@/middleware/error-handler`, `requirePermission(RESOURCES.REPORT, ACTIONS.READ)` from `@/middleware/permission-check`, `apiRateLimit` from `@/middleware/rate-limit`.
  - Tenant: `user.tenantId?.toString?.() || user.tenantId` (no separate `getTenantId` if not used elsewhere).
    _Ref: Report "FIX 1" + note 4 & 5; see `apps/clinic/app/api/dashboard/stats/route.js`_

- [x] **1.4** Use existing DB connection: `connectDB` from `@/lib/db/connection.js` (not `@/lib/db/mongoose`).  
       _Ref: Report FIX 1 snippet; align with `apps/clinic/app/api/dashboard/summary/route.js`_

- [x] **1.5** Implement `getDashboardAll(tenantId, userId, role)` with **one** `Promise.allSettled([...])` containing:
  - Stats: today appointment counts, completed today, pending (use `Appointment` model).
  - Today appointments: `Appointment.find({ tenantId, appointmentDate in today }).limit(10).sort({ startTime: 1 }).lean()`.
  - Recent patients: `Patient.find({ tenantId }).sort({ createdAt: -1 }).limit(5).lean()`.
  - Overdue invoices: `Invoice.find({ tenantId, status: 'pending', dueDate: { $lt: now } }).limit(5).sort({ dueDate: 1 }).lean()`.
  - Low stock: `InventoryItem` with `$expr: { $lte: ['$quantity', '$reorderPoint'] }` or equivalent; limit 5.
  - Queue: `Queue.find({ tenantId, status: { $in: ['waiting', 'in_progress'] } }).limit(100).lean()`.
  - Expiring lots: use existing inventory lots API or model (e.g. `StockBatch` with expiry filter); limit 5.
  - Pending appointment requests: `Appointment.find({ tenantId, status: 'pending' }).limit(5).sort({ createdAt: -1 }).lean()`.
  - Chart revenue: `Invoice.aggregate` (paid, last 30 days, group by date).
  - Chart appointments: `Appointment.aggregate` (last 30 days, group by date).
  - Chart patients: `Patient.aggregate` (last 30 days, group by date).
    _Ref: Report FIX 1 lines 78–183_

- [x] **1.6** Map model imports to actual files (all under `apps/clinic/models/`):
  - `Appointment.js`, `Patient.js`, `Invoice.js`, `InventoryItem.js`, `Queue.js`, `StockBatch.js` (or lot model used by `getAllLots`).
    _Ref: Report "Note: Replace model import paths" + "find apps/clinic/models -name '_.js'"\*

- [x] **1.7** Use static imports for models at top of route (no dynamic `import('@/models/...')` inside handler) so bundler and resolution are consistent. Adjust the report’s inline `import('@/models/...')` pattern to your preferred style.

- [x] **1.8** Build response shape: `{ stats: {...}, lists: {...}, charts: { revenue, appointments, patients }, meta: { fetchedAt, role } }`. Use a `val(result, fallback)` helper for `Promise.allSettled` results.  
       _Ref: Report FIX 1 lines 184–222_

- [x] **1.9** Return `NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } })`.

- [x] **1.10** Wrap GET handler with: `withErrorHandler(apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler))))`.  
       _Ref: Report FIX 1 lines 224–250; see existing dashboard routes_

- [x] **1.11** Add role-based behaviour (FIX 6): if `role === 'doctor'`, skip or stub clinic-only data (overdue invoices, chart revenue/appointments/patients) and pass `userId` into appointment/queue queries so doctors see only their data.  
       _Ref: Report FIX 6_

- [x] **1.12** Verify: `curl -H "Authorization: Bearer <token>" http://localhost:5053/api/dashboard/all` returns `{ success: true, data: { stats, lists, charts } }` in &lt; 200ms (after cold start).

---

## Phase 2 — Client: Unified hook and page (Day 2)

**Goal:** One SWR hook calling `/api/dashboard/all`; dashboard page and layout use it; no duplicate fetches.

### FIX 2 — Create unified `useDashboard` hook

- [x] **2.1** Create file: `apps/clinic/app/dashboard/hooks/useDashboard.js` (or ensure path matches existing hooks dir).

- [x] **2.2** Implement fetcher: `apiClient.get('/api/dashboard/all')` (or `/dashboard/all` depending on `apiClient` base path). Normalize response: `res.data?.data` and throw if not `res.data?.success`.  
       _Ref: Report FIX 2 lines 268–273_

- [x] **2.3** Configure SWR:
  - `keepPreviousData: true`
  - `refreshInterval: (data) => (document.hidden ? 0 : 90000)` (90s when tab visible)
  - `revalidateOnFocus: false`
  - `revalidateOnReconnect: true`
  - `dedupingInterval: 15000`
  - `shouldRetryOnError: (err) => err?.status !== 401 && err?.status !== 403`
    _Ref: Report FIX 2 lines 293–309_

- [x] **2.4** Subscribe to realtime events: `onRealtimeEvent` from `@/lib/realtime/realtime-client`. On events `appointment:created`, `appointment:updated`, `appointment:cancelled`, `payment:received`, `payment:failed`, `queue:updated`, `patient:created`, `dashboard-events` → call `mutate()` (background revalidation).  
       _Ref: Report FIX 2 lines 277–282, 312–323_

- [x] **2.5** Expose: `stats`, `todayAppointments`, `recentPatients`, `overdueInvoices`, `lowStockList`, `queueStatus`, `expiringLots`, `appointmentRequests`, `chartData`, `loading`, `isRefreshing`, `error`, `refresh`, and optional `removeFromQueue(id)` (optimistic update via `mutate` with `revalidate: false`).  
       _Ref: Report FIX 2 lines 349–368_

### FIX 3 — Update dashboard page

- [x] **3.1** In `apps/clinic/app/dashboard/page.jsx`: Remove usage of `useDashboardStats` and `useDashboardListsSWR` / `useDashboardStatsSWR` (and any other list/stats hooks used only for this page) for the main clinic dashboard content.

- [x] **3.2** Add: `const { stats, todayAppointments, recentPatients, overdueInvoices, lowStockList, queueStatus, expiringLots, appointmentRequests, chartData, loading, isRefreshing, error, refresh } = useDashboard();` (or destructure to match current prop names used by child components).

- [x] **3.3** Replace all `listsLoading` / `statsLoading` references with `loading` (or keep `statsLoading` / `chartsLoading` if you alias from the same hook).  
       _Ref: Report FIX 3_

- [x] **3.4** Add a subtle “Syncing…” indicator when `isRefreshing` is true (e.g. fixed top-right, with `RefreshCwIcon` and `animate-spin`).  
       _Ref: Report FIX 3 lines 297–308_

- [x] **3.5** Ensure doctor dashboard path still works: if doctor view uses different hooks (`useDoctorDashboardStats` / `useDoctorDashboardLists`), leave those in place until migrated; only the main clinic dashboard uses `useDashboard()`.  
       _Ref: Report "Keep useDoctorDashboardStats..." and FIX 8_

### FIX 5 — Preload via SWR cache (layout)

- [x] **5.1** In `apps/clinic/app/dashboard/layout.jsx`: Remove or replace `preloadCriticalData` so it does not perform a separate fetch that SWR doesn’t see.

- [x] **5.2** Use SWR’s `mutate` to prime the cache: `import { mutate } from 'swr'`. In `useEffect`, when `user?.tenantId` is set, call:
  - `mutate('/api/dashboard/all', () => apiClient.get('/api/dashboard/all').then((r) => r.data?.data), { revalidate: false, populateCache: true });`
  - Use the same key and response shape as `useDashboard.js` (e.g. `/api/dashboard/all` and `r.data?.data`).  
    _Ref: Report FIX 5_

- [x] **5.3** Ensure dashboard page uses the same SWR key as in `useDashboard.js` (e.g. `'/api/dashboard/all'`) so the primed cache is used and initial load shows no spinner.  
       _Ref: Report FIX 5 "Result"_

- [x] **5.4** Verify: Navigate to dashboard → Network tab shows ONE request to `/api/dashboard/all`. Navigate away and back → ZERO new requests (cache hit).

---

## Phase 3 — Config and cleanup (Day 3)

### FIX 4 — SWR global config

- [x] **4.1** Open `apps/clinic/components/providers/Providers.jsx` (or where SWR config lives).

- [x] **4.2** Set `revalidateOnFocus: false` in the SWR provider options. Keep `revalidateOnReconnect: true`, `dedupingInterval`, `errorRetryCount`, `shouldRetryOnError`, etc.  
       _Ref: Report FIX 4_

### FIX 7 — MongoDB indexes

- [x] **7.1** Create script: `apps/clinic/scripts/create-dashboard-indexes.js` (updated) (or add to existing migration runner).

- [x] **7.2** Connect using existing app pattern (e.g. `mongoose.connect(process.env.MONGODB_URI)` with dotenv from `apps/clinic/.env.local`).

- [x] **7.3** Create indexes (background: true):
  - `appointments`: `{ tenantId: 1, appointmentDate: 1, status: 1 }`, `{ tenantId: 1, status: 1, createdAt: -1 }`.
  - `invoices`: `{ tenantId: 1, status: 1, dueDate: 1 }`.
  - `patients`: `{ tenantId: 1, createdAt: -1 }`.
  - `queues`: `{ tenantId: 1, status: 1 }`.
  - `inventoryitems`: `{ tenantId: 1, quantity: 1, reorderPoint: 1 }` (or equivalent for low-stock query).
    Use exact collection names as in your Mongoose models.  
    _Ref: Report FIX 7_

- [x] **7.4** Run script once: from `apps/clinic` run `npm run dashboard-indexes` (done; script is idempotent).

### FIX 8 — Remove redundant hooks (after verification)

- [x] **8.1** After confirming dashboard works with `useDashboard()` and `/api/dashboard/all`:
  - Deleted `apps/clinic/app/dashboard/hooks/useDashboardStats.js` (replaced by `useDashboard()`).
  - Deleted `apps/clinic/app/dashboard/hooks/useDashboardLists.js` (replaced by `useDashboard()`).
    _Ref: Report FIX 8_

- [x] **8.2** Dashboard page uses only `useDashboard()` for clinic. `useSWRDashboard.js` kept (may be used elsewhere). Doctor hooks `useDoctorDashboardStats` / `useDoctorDashboardLists` kept.  
       _Ref: Report FIX 8 "Keep useDoctorDashboardStats..."_

---

## Phase 4 — Verify (Day 4) — manual (run in your browser)

- [ ] **4.1** Chrome DevTools → Network: Log in as non-doctor, open Dashboard. Confirm one request to `/api/dashboard/all` (ideally &lt; 3 total).

- [x] **4.2** Run index script once: `npm run dashboard-indexes` from `apps/clinic` (done). Optionally check MongoDB slow query log: no dashboard-related query &gt; 50ms.

- [ ] **4.3** Navigate away from dashboard and back 10×: dashboard loads instantly from SWR cache (no loading spinner, no new request).

- [ ] **4.4** Expected metrics (from report):
  - HTTP requests on dashboard load: 9 → 1.
  - Requests on return navigation: 9 → 0 (cache hit).
  - Cold load: ~150–300ms; warm load: ~0ms (instant).

---

## Reference: Report section → Plan item

| Report section                           | Plan items                  |
| ---------------------------------------- | --------------------------- |
| Problem 1–7 (root causes)                | Phase 0 (0.1–0.6)           |
| FIX 1 — Single dashboard aggregation API | Phase 1 (1.1–1.12)          |
| FIX 2 — One unified SWR hook             | Phase 2 (2.1–2.5)           |
| FIX 3 — Update dashboard page            | Phase 2 (3.1–3.5)           |
| FIX 4 — SWR revalidateOnFocus            | Phase 3 (4.1–4.2)           |
| FIX 5 — Preload via SWR cache            | Phase 2 (5.1–5.4)           |
| FIX 6 — Doctor-specific dashboard        | Phase 1 (1.11)              |
| FIX 7 — MongoDB indexes                  | Phase 3 (7.1–7.4)           |
| FIX 8 — Delete old hooks                 | Phase 3 (8.1–8.2)           |
| Execution order / expected results       | Phase 1–4 + table in report |

---

## Notes (from report)

1. Use actual model paths: `apps/clinic/models/*.js` (Appointment, Patient, Invoice, InventoryItem, Queue, StockBatch or lot model).
2. Keep old hooks until new flow is verified in production.
3. Doctor dashboard: migrate `useDoctorDashboardStats` / `useDoctorDashboardLists` later using the same pattern.
4. Auth: use `withAuth` and permission middleware as in `apps/clinic/app/api/dashboard/stats/route.js`.
5. Tenant: use `user.tenantId?.toString?.() || user.tenantId`.
