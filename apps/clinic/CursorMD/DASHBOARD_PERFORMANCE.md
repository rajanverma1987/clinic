# Dashboard Performance (Global-Market, Lightning-Fast)

## Goals

- **First paint:** Dashboard shell (header, layout, section skeletons) appears immediately after auth, not after all data loads.
- **Data load:** All list and chart requests run in **parallel** (one network round-trip per hook), not sequentially.
- **No full-page blocker:** Sections show their own skeletons until data arrives; no single full-screen skeleton that waits for everything.

## Architecture

### 1. Immediate shell (no full-page skeleton)

- After auth, the page renders the full dashboard layout right away.
- Stats, lists, and charts each receive `loading` from their hooks and show inline skeletons (StatsCard, DashboardListCard, ChartCard all support `loading`).
- No `isInitialLoading` gate that blocks the whole page until stats + lists + charts all finish.

### 2. Parallel fetches (one round-trip per hook)

| Hook | Before | After |
|------|--------|--------|
| **useDashboardLists** | 8 sequential API calls (appointments → patients → invoices → inventory → prescriptions → queue → lots → requests) | 1 parallel batch: `Promise.allSettled([...8 requests])` |
| **useDashboardCharts** | 3 sequential calls (revenue → appointments → patients) | 1 parallel batch: `Promise.allSettled([revenue, appointments, patients])` |
| **useDoctorDashboardLists** | 1 (doctorId) + 5 sequential list calls | 1 (doctorId) + 1 parallel batch: `Promise.allSettled([today, upcoming, patients, reviews, requests])` |
| **useDashboardStats** | 1 call (already optimal) | Unchanged; uses `/reports/dashboard` (cached server-side when Redis available) |

### 3. Page-level fetch strategy

- On mount (once user is ready), the page calls in parallel:
  - `fetchStats()`
  - `fetchChartData()` (non-doctor only)
  - `fetchDashboardLists()`
- So total time is **max(stats, lists, charts)** instead of **stats + lists + charts**.
- Combined with parallel work inside lists and charts, the dashboard reaches “data ready” in roughly one round-trip for stats and one for lists (and one for charts for non-doctor).

### 4. Auto-refresh

- Uses `DASHBOARD_AUTO_REFRESH_MS` from `lib/constants/dashboard` (e.g. 60s).
- Pauses when tab is hidden; resumes when visible.
- Refetch on window focus so returning users see fresh data without a full reload.

### 5. Enterprise loading: cache-first when switching “tabs” (routes)

- **Problem:** Navigating away from Dashboard (e.g. to Appointments) and back remounts the page; hooks re-run with `loading: true` and empty data, so the user sees loading spinners again every time they switch back.
- **Solution:** Client-side cache backed by **localStorage** (`lib/cache/dashboard-cache.js`) so data persists across tab switches and refresh, plus **stale-while-revalidate** and **auto-refresh**:
  1. **First login / first load:** No cache → fetch as usual, show loading until data arrives, then store in **memory + localStorage**.
  2. **Switch tab or refresh:** Cache has data (from localStorage) → **show it instantly** (no loading). Trigger a **background** revalidate; when the request completes, update UI and write to localStorage so the next view is instant with fresh data.
  3. **Auto-refresh (e.g. 60s):** Silent refetch runs; when new data arrives, hooks update state (instant UI update) and call `set()` so localStorage is updated. Data stays fresh and the next open/refresh shows the latest.
  4. **Logout:** `dashboardCache.clear()` is called in AuthContext (logout and idle timeout); all dashboard cache keys are removed from localStorage so the next user does not see previous data.
- **Implementation:**
  - Cache: in-memory Map + localStorage with prefix `dashboard_cache:`; keys `stats:tenantId`, `lists:tenantId`, `charts:tenantId` (clinic); `doctorStats:userId`, `doctorLists:userId` (doctor). TTL: `DASHBOARD_CACHE_TTL_MS` (e.g. 5 min).
  - **No hydration mismatch:** Initial state is always empty/loading (never read from localStorage in `useState`). **Hydrate in `useLayoutEffect`** (runs before paint, client-only): read from cache and set state + `loading: false` so the first paint shows cached data with no flash and no server/client mismatch.
  - On fetch: if cache exists (background revalidate), do **not** set `loading: true`; only set it when there is no cache (first load). After every successful fetch, `set()` writes to memory + localStorage so updates are persisted and instant on next view.
- **Result:** After first load, dashboard data shows **instantly** on tab switch or refresh (from localStorage); auto-refresh keeps it fresh and every update is written to localStorage so it stays instant when something is updated. Cleared on logout. Same pattern (useLayoutEffect hydrate) used for all list tabs (Appointments, Patients, Invoices, Inventory, Queue, Prescriptions).

## Files

- **Hooks:** `app/dashboard/hooks/useDashboardLists.js`, `useDashboardCharts.js`, `useDoctorDashboardStats.js`, `useDoctorDashboardLists.js`, `useDashboardStats.js` – parallel requests + cache-first (stale-while-revalidate) when returning to Dashboard.
- **Cache:** `lib/cache/dashboard-cache.js` – in-memory + **localStorage** get/set keyed by tenantId (clinic) or userId (doctor); cleared on logout in AuthContext.
- **Page:** `app/dashboard/page.jsx` – no full-page skeleton block; renders shell immediately and passes per-section `loading` to StatsCard, DashboardListCard, ChartCard.
- **Constants:** `lib/constants/dashboard.js` – `DASHBOARD_AUTO_REFRESH_MS`, `DASHBOARD_CACHE_TTL_MS`.

## Backend

- `/api/reports/dashboard` is cached per tenant (Redis when available) for fast repeat loads.
- List and chart endpoints should stay lightweight (indexed queries, small limits) so parallel calls complete quickly even with no or little data.

## Result

- **Empty or small datasets:** Dashboard shell appears immediately; stats/lists/charts fill in as each response arrives (typically one round-trip per hook).
- **Global users:** Single round-trip per hook keeps latency close to network RTT instead of 8× or 3× RTT.
- **Professional UX:** Section-level loading states and no full-page blocking skeleton.

## 100% checklist

| Item | Status |
|------|--------|
| Full-page skeleton removed; shell renders immediately after auth | Done |
| useDashboardLists: 8 requests in one parallel batch (Promise.allSettled) | Done |
| useDashboardCharts: 3 requests in one parallel batch (Promise.allSettled) | Done |
| useDoctorDashboardLists: doctorId + 5 list requests in one parallel batch | Done |
| Page calls fetchStats, fetchChartData, fetchDashboardLists in parallel on mount | Done |
| Section-level loading (StatsCard, DashboardListCard, ChartCard receive `loading`) | Done |
| criticalAlerts defensively defaulted to `[]` so notifications never crash | Done |
| Auto-refresh uses DASHBOARD_AUTO_REFRESH_MS; pauses when tab hidden | Done |
| No unused state/imports (DashboardSkeleton, hasRenderedOnce, forceRender removed) | Done |
| Cache-first: dashboard data cached; return to Dashboard shows last data immediately (no loading) | Done |
| Background revalidate when returning to Dashboard (stale-while-revalidate) | Done |
| DASHBOARD_CACHE_TTL_MS and dashboard-cache.js for client-side cache | Done |
| localStorage persistence so data shows instant on tab switch and page refresh | Done |
| Auto-refresh writes updated data to localStorage so next view is instant when something updated | Done |
| dashboardCache.clear() on logout (and idle timeout) so next user does not see previous data | Done |

### 6. All tabs: same pattern (localStorage + instant + revalidate)

The same cache (same module `lib/cache/dashboard-cache.js`, cleared on logout) is used for **all main list tabs** so switching to any tab shows last data instantly from localStorage, then revalidates in background.

| Tab | Cache scope | Cache id | Cached shape |
|-----|--------------|-----------|--------------|
| Dashboard | stats, lists, charts, doctorStats, doctorLists | tenantId / userId | (existing) |
| Appointments | route_appointments | tenantId | { appointments, currentPage, totalPages } |
| Patients | route_patients | tenantId | { patients, totalPages, currentPage } |
| Invoices | route_invoices | tenantId | { invoices } |
| Inventory | route_inventory | tenantId | { items } (full list; low-stock filter applied in UI) |
| Queue | route_queue | userId (doctor) | { queueEntries } |
| Prescriptions | route_prescriptions | tenantId | { prescriptions } |

Each list page: on mount reads from cache (if any), sets state and `loading: false`; then calls fetch. Fetch does not set `loading: true` when cache exists (silent revalidate). After success, writes to cache so next open/refresh is instant. Logout clears all keys (dashboard + route_*).
