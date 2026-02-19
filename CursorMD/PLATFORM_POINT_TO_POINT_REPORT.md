# Enterprise Dashboard Plan

> Based on actual code analysis. Every fix targets a confirmed real problem.

---

## WHAT'S ACTUALLY WRONG (root cause analysis)

### Problem 1 — 9 HTTP requests on every dashboard mount

Your dashboard page calls two hooks:

- `useDashboardStats` → 1 request to `/dashboard/summary`
- `useDashboardLists` → 8 requests via `Promise.allSettled`

**Total: 9 requests fired simultaneously on every mount.**
Even though `Promise.allSettled` runs them in parallel client-side, the server handles 9 separate DB queries per user per page load.

### Problem 2 — Your batch route is slower than direct calls

`/api/batch` receives a POST, then makes **HTTP fetch calls from the Next.js server back to itself** (same process). This adds: one extra HTTP parse, one extra TCP round-trip, auth header forwarding overhead. It's slower than calling DB directly.

### Problem 3 — `useDashboardStats` has zero caching

`useDashboardLists` has `dashboardCache` (cache-first on return visit). `useDashboardStats` has nothing — every mount, every tab switch, every navigation back to dashboard hits `/dashboard/summary` cold.

### Problem 4 — SWR config is wasted

`Providers.jsx` has a well-configured SWR setup with deduplication, retry backoff, etc. Neither dashboard hook uses SWR. You get zero benefit from that config for the dashboard.

### Problem 5 — `preloadCriticalData` in layout + hooks both fetch = duplicate requests

`DashboardLayout` calls `preloadCriticalData` on mount. Then the dashboard page mounts and both hooks also fetch. If preload and hook fetches aren't deduplicated (and they aren't — different call sites, different timing), you get double fetches.

### Problem 6 — `revalidateOnFocus: true` in SWR config

For a clinic dashboard, refetching everything when a user switches browser tabs is wrong. A doctor switching to Gmail and back shouldn't hammer your DB.

### Problem 7 — `useDashboardLists` fetches 8 endpoints every 60s (inherited from stats polling)

Stats polls every 60s. But lists don't poll — they only fetch on mount and manual refresh. However the polling in stats triggers re-renders that can cause downstream effects. More importantly: 8 separate DB queries for lists means your MongoDB gets hit with 8 queries per user per page load with no aggregation.

---

## THE ENTERPRISE FIX — 3 layers

```
Layer 1: Server  — Single aggregated MongoDB query replaces 8 separate queries
Layer 2: API     — New /api/dashboard/all endpoint returns everything in one response
Layer 3: Client  — Single unified hook with SWR, proper caching, smart revalidation
```

---

## FIX 1 — Create a single dashboard aggregation API endpoint

**Create file:** `apps/clinic/app/api/dashboard/all/route.js`

This replaces all 8 list fetches AND the stats fetch with one endpoint that runs everything in parallel at the DB level — not the HTTP level.

```js
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/mongoose';
import { getTenantId } from '@/lib/auth/tenant';

// Import your existing service/model functions
// Adjust these imports to match your actual lib structure
async function getDashboardAll(tenantId, userId, role) {
  await connectDB();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const oneHourLater = new Date(now.getTime() + 3600000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  // Run ALL queries in parallel at the DB level — one connection, many queries
  // Replace these with your actual Mongoose model imports and queries
  const [
    statsResult,
    todayAppointments,
    recentPatients,
    overdueInvoices,
    lowStock,
    queueItems,
    expiringLots,
    pendingRequests,
    chartRevenue,
    chartAppointments,
    chartPatients,
  ] = await Promise.allSettled([
    // Stats — your existing /dashboard/summary logic
    import('@/models/Appointment').then(({ default: Appt }) =>
      Promise.all([
        Appt.countDocuments({ tenantId, appointmentDate: { $gte: todayStart, $lt: todayEnd } }),
        Appt.countDocuments({
          tenantId,
          status: 'completed',
          appointmentDate: { $gte: todayStart, $lt: todayEnd },
        }),
        Appt.countDocuments({ tenantId, status: 'pending' }),
      ]),
    ),
    // Today appointments
    import('@/models/Appointment').then(({ default: Appt }) =>
      Appt.find({ tenantId, appointmentDate: { $gte: todayStart, $lt: todayEnd } })
        .limit(10)
        .sort({ startTime: 1 })
        .lean(),
    ),
    // Recent patients
    import('@/models/Patient').then(({ default: Patient }) =>
      Patient.find({ tenantId }).sort({ createdAt: -1 }).limit(5).lean(),
    ),
    // Overdue invoices
    import('@/models/Invoice').then(({ default: Invoice }) =>
      Invoice.find({ tenantId, status: 'pending', dueDate: { $lt: now } })
        .limit(5)
        .sort({ dueDate: 1 })
        .lean(),
    ),
    // Low stock
    import('@/models/InventoryItem').then(({ default: Item }) =>
      Item.find({ tenantId, $expr: { $lte: ['$quantity', '$reorderPoint'] } })
        .limit(5)
        .lean(),
    ),
    // Queue
    import('@/models/Queue').then(({ default: Queue }) =>
      Queue.find({ tenantId, status: { $in: ['waiting', 'in_progress'] } })
        .limit(100)
        .lean(),
    ),
    // Expiring lots
    import('@/models/InventoryLot').then(({ default: Lot }) => {
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000);
      return Lot.find({ tenantId, expiryDate: { $lte: thirtyDaysFromNow, $gte: now } })
        .limit(5)
        .lean();
    }),
    // Pending appointment requests
    import('@/models/Appointment').then(({ default: Appt }) =>
      Appt.find({ tenantId, status: 'pending' }).limit(5).sort({ createdAt: -1 }).lean(),
    ),
    // Chart: revenue last 14 days — aggregate
    import('@/models/Invoice').then(({ default: Invoice }) =>
      Invoice.aggregate([
        { $match: { tenantId, status: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            value: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ),
    // Chart: appointments last 14 days
    import('@/models/Appointment').then(({ default: Appt }) =>
      Appt.aggregate([
        { $match: { tenantId, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            value: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ),
    // Chart: new patients last 14 days
    import('@/models/Patient').then(({ default: Patient }) =>
      Patient.aggregate([
        { $match: { tenantId, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            value: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ),
  ]);

  // Helper: safely extract value or return fallback
  const val = (result, fallback) => (result.status === 'fulfilled' ? result.value : fallback);

  // Build stats
  const [todayCount, completedToday, pendingCount] = val(statsResult, [0, 0, 0]);
  const queue = val(queueItems, []);

  return {
    stats: {
      todayAppointments: todayCount,
      completedToday,
      pendingAppointments: pendingCount,
      queueActive: queue.filter((q) => q.status === 'waiting' || q.status === 'in_progress').length,
      queueWaiting: queue.filter((q) => q.status === 'waiting').length,
      lastUpdated: now.toISOString(),
    },
    lists: {
      todayAppointments: val(todayAppointments, []),
      recentPatients: val(recentPatients, []),
      overdueInvoices: val(overdueInvoices, []),
      lowStockItems: val(lowStock, []),
      queueStatus: {
        active: queue.filter((q) => q.status === 'waiting' || q.status === 'in_progress').length,
        waiting: queue.filter((q) => q.status === 'waiting').length,
        inProgress: queue.filter((q) => q.status === 'in_progress').length,
      },
      expiringLots: val(expiringLots, []),
      appointmentRequests: val(pendingRequests, []),
    },
    charts: {
      revenue: val(chartRevenue, []),
      appointments: val(chartAppointments, []),
      patients: val(chartPatients, []),
    },
    meta: {
      fetchedAt: now.toISOString(),
      role,
    },
  };
}

export const GET = withAuth(async (req, { user }) => {
  try {
    const tenantId = getTenantId(user);
    const data = await getDashboardAll(tenantId, user.userId, user.role);

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          // Private cache — CDN won't cache, but browser will for 30s
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (err) {
    console.error('Dashboard all endpoint error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to load dashboard' } },
      { status: 500 },
    );
  }
});
```

> **Note:** Replace model import paths (`@/models/Appointment` etc.) with your actual model paths. Run `find apps/clinic/models -name "*.js" | sort` to see your real model files.

---

## FIX 2 — Replace both hooks with one unified SWR hook

**Create file:** `apps/clinic/app/dashboard/hooks/useDashboard.js`

This replaces `useDashboardStats.js` AND `useDashboardLists.js` entirely.

```js
/**
 * useDashboard — single unified dashboard hook
 * - One HTTP request replaces 9
 * - SWR handles caching, deduplication, background revalidation
 * - Realtime socket events trigger targeted revalidation
 * - Cache-first on return navigation (keepPreviousData)
 */
import { apiClient } from '@/lib/api/client';
import { onRealtimeEvent } from '@/lib/realtime/realtime-client';
import { useEffect } from 'react';
import useSWR from 'swr';

const fetcher = () =>
  apiClient.get('/dashboard/all').then((res) => {
    if (!res.data?.success) throw new Error('Dashboard fetch failed');
    return res.data.data;
  });

// Events that should trigger a background revalidation (not a loading state)
const REVALIDATE_EVENTS = [
  'appointment:created',
  'appointment:updated',
  'appointment:cancelled',
  'payment:received',
  'payment:failed',
  'queue:updated',
  'patient:created',
  'dashboard-events',
];

export function useDashboard({ enabled = true } = {}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? '/api/dashboard/all' : null,
    fetcher,
    {
      // Show stale data immediately on return navigation — zero loading flash
      keepPreviousData: true,

      // Background refresh every 90s — only when tab is visible
      refreshInterval: (data) => (document.hidden ? 0 : 90000),

      // Don't refetch just because user switched browser tabs
      revalidateOnFocus: false,

      // Do revalidate when network reconnects (doctor was offline)
      revalidateOnReconnect: true,

      // Deduplicate — if two components call this hook, only one fetch fires
      dedupingInterval: 15000,

      // Don't retry on auth errors
      shouldRetryOnError: (err) => err?.status !== 401 && err?.status !== 403,
    },
  );

  // Subscribe to realtime events — trigger silent background revalidation
  useEffect(() => {
    if (!enabled) return;

    const unsubs = REVALIDATE_EVENTS.map((event) =>
      onRealtimeEvent(event, () => {
        // mutate() with no args = background revalidate, no loading spinner
        mutate();
      }),
    );

    return () => unsubs.forEach((fn) => fn());
  }, [enabled, mutate]);

  // Convenience: optimistic queue removal (instant UI, no waiting for server)
  const removeFromQueue = (id) => {
    mutate(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          lists: {
            ...current.lists,
            queueStatus: {
              ...current.lists.queueStatus,
              waiting: Math.max(0, current.lists.queueStatus.waiting - 1),
              active: Math.max(0, current.lists.queueStatus.active - 1),
            },
          },
        };
      },
      { revalidate: false }, // don't refetch, just update local state
    );
  };

  return {
    // Stats (previously from useDashboardStats)
    stats: data?.stats ?? null,
    statsLoading: isLoading,

    // Lists (previously from useDashboardLists)
    todayAppointments: data?.lists?.todayAppointments ?? [],
    recentPatients: data?.lists?.recentPatients ?? [],
    overdueInvoices: data?.lists?.overdueInvoices ?? [],
    lowStockList: data?.lists?.lowStockItems ?? [],
    queueStatus: data?.lists?.queueStatus ?? { active: 0, waiting: 0, inProgress: 0 },
    expiringLots: data?.lists?.expiringLots ?? [],
    appointmentRequests: data?.lists?.appointmentRequests ?? [],

    // Charts (previously from useDashboardCharts)
    chartData: data?.charts ?? { revenue: [], appointments: [], patients: [] },
    chartsLoading: isLoading,

    // Unified loading/error state
    loading: isLoading,
    isRefreshing: isValidating && !isLoading, // background refresh, not initial load
    error,

    // Actions
    refresh: () => mutate(),
    removeFromQueue,
  };
}
```

---

## FIX 3 — Update `apps/clinic/app/dashboard/page.jsx`

Replace the two hook calls at the top of the dashboard page:

```js
// BEFORE — delete these two lines
const { stats, loading: statsLoading, error: statsError } = useDashboardStats();
const { todayAppointments, recentPatients, ... loading: listsLoading } = useDashboardLists();

// AFTER — one line replaces both
const {
  stats, statsLoading,
  todayAppointments, recentPatients, overdueInvoices, lowStockList,
  queueStatus, expiringLots, appointmentRequests,
  chartData, chartsLoading,
  loading, isRefreshing, error,
  refresh,
} = useDashboard();
```

Then update all `listsLoading` references → `loading`, and `chartsLoading` stays as-is.

Add a subtle refresh indicator for background revalidation:

```jsx
{
  /* Add near the top of your dashboard JSX */
}
{
  isRefreshing && (
    <div
      className='fixed top-4 right-4 z-50 flex items-center gap-2
    bg-white dark:bg-slate-800 shadow-lg rounded-full px-3 py-1.5
    text-xs text-slate-500 border border-slate-100 dark:border-slate-700'
    >
      <RefreshCwIcon className='icon icon-xs animate-spin' />
      Syncing...
    </div>
  );
}
```

---

## FIX 4 — Fix SWR global config in `Providers.jsx`

Change `revalidateOnFocus: true` → `false`. This is the single most impactful SWR config change for a clinic dashboard:

```js
// apps/clinic/components/providers/Providers.jsx
const swrOptions = {
  revalidateOnFocus: false, // ← change from true to false
  revalidateOnReconnect: true, // keep — good for offline recovery
  dedupingInterval: 30000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: (err) => err?.status !== 401 && err?.status !== 403,
  onErrorRetry: swrRetryWithBackoff,
};
```

**Why:** With `revalidateOnFocus: true`, every time a doctor opens a patient chart, writes a prescription, or reads an email and comes back to the dashboard tab — it fires ALL SWR requests again. In a clinical setting, doctors switch tabs constantly.

---

## FIX 5 — Fix `DashboardLayout` preload to use SWR cache

**File:** `apps/clinic/app/dashboard/layout.jsx`

The preload currently fetches but stores in a separate cache that SWR doesn't know about. Fix: use SWR's `mutate` to prime the cache.

```js
'use client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { useEffect } from 'react';
import { mutate } from 'swr';
import './styles/dashboard.css';

export default function DashboardLayout({ children }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.tenantId) return;

    // Prime the SWR cache before the dashboard page mounts
    // When dashboard page mounts and calls useDashboard(), SWR finds data already
    // in cache → renders immediately with no loading state
    mutate('/api/dashboard/all', () => apiClient.get('/dashboard/all').then((r) => r.data.data), {
      revalidate: false, // don't re-fetch after priming
      populateCache: true, // store result in SWR cache
    });
  }, [user?.tenantId]);

  return (
    <>
      <OfflineBanner />
      <ErrorBoundary>{children}</ErrorBoundary>
    </>
  );
}
```

**Result:** Dashboard page mounts, calls `useDashboard()`, SWR cache already has data → **zero loading state on navigation to dashboard**.

---

## FIX 6 — Doctor-specific dashboard (avoids fetching clinic-only data)

Your dashboard has `isDoctor` checks. The new `/api/dashboard/all` endpoint should respect role:

```js
// In /api/dashboard/all/route.js — add role check
const isDoctor = role === 'doctor';

// Only run these for non-doctors
const [overdueInvoices, chartRevenue, chartAppointments, chartPatients] = isDoctor
  ? [
      Promise.resolve({ status: 'fulfilled', value: [] }),
      Promise.resolve({ status: 'fulfilled', value: [] }),
      Promise.resolve({ status: 'fulfilled', value: [] }),
      Promise.resolve({ status: 'fulfilled', value: [] }),
    ]
  : await Promise.allSettled([
      // ... invoice/chart queries
    ]);
```

For doctors, pass `userId` filter to appointment queries so they only see their own patients.

---

## FIX 7 — Add MongoDB indexes for dashboard queries

Run once in your MongoDB shell or as a migration script:

```js
// apps/clinic/scripts/add-dashboard-indexes.js
// Run: node apps/clinic/scripts/add-dashboard-indexes.js

const mongoose = require('mongoose');
require('dotenv').config({ path: 'apps/clinic/.env.local' });

async function addIndexes() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  // Appointments — most queried collection
  await db
    .collection('appointments')
    .createIndex(
      { tenantId: 1, appointmentDate: 1, status: 1 },
      { background: true, name: 'dashboard_appt_date_status' },
    );
  await db
    .collection('appointments')
    .createIndex(
      { tenantId: 1, status: 1, createdAt: -1 },
      { background: true, name: 'dashboard_appt_status_created' },
    );

  // Invoices
  await db
    .collection('invoices')
    .createIndex(
      { tenantId: 1, status: 1, dueDate: 1 },
      { background: true, name: 'dashboard_invoice_status_due' },
    );

  // Patients
  await db
    .collection('patients')
    .createIndex(
      { tenantId: 1, createdAt: -1 },
      { background: true, name: 'dashboard_patient_created' },
    );

  // Queue
  await db
    .collection('queues')
    .createIndex({ tenantId: 1, status: 1 }, { background: true, name: 'dashboard_queue_status' });

  // Inventory
  await db
    .collection('inventoryitems')
    .createIndex(
      { tenantId: 1, quantity: 1, reorderPoint: 1 },
      { background: true, name: 'dashboard_inventory_stock' },
    );

  console.log('✅ Dashboard indexes created');
  await mongoose.disconnect();
}

addIndexes().catch(console.error);
```

---

## FIX 8 — Delete the now-redundant old hooks

After the new `useDashboard.js` is working and dashboard page is updated:

```bash
# These are now replaced by useDashboard.js
# Only delete after confirming dashboard works with new hook
rm apps/clinic/app/dashboard/hooks/useDashboardStats.js
rm apps/clinic/app/dashboard/hooks/useDashboardLists.js
# Keep useDashboardCharts.js only if used elsewhere, otherwise delete it too
# Keep useDoctorDashboardStats.js and useDoctorDashboardLists.js until doctor dashboard is migrated
```

---

## EXECUTION ORDER

```
Day 1 — Backend
  1. Run: find apps/clinic/models -name "*.js" | sort
     → Get your actual model file names
  2. Create /api/dashboard/all/route.js with correct model imports
  3. Test: curl -H "Authorization: Bearer <token>" http://localhost:5053/api/dashboard/all
     → Should return { success: true, data: { stats, lists, charts } } in < 200ms

Day 2 — Hook migration
  4. Create useDashboard.js
  5. Update dashboard/page.jsx to use useDashboard()
  6. Update dashboard/layout.jsx to use SWR mutate for preload
  7. Test: Open dashboard → Network tab → should see ONE request to /api/dashboard/all
     → Navigate away → come back → should see ZERO requests (SWR cache hit)

Day 3 — Config + cleanup
  8. Fix SWR revalidateOnFocus in Providers.jsx
  9. Run MongoDB index migration script
  10. Delete old hooks after confirming everything works

Day 4 — Verify
  11. Open Chrome DevTools → Performance tab
      Record dashboard load → should see < 3 network requests total
  12. Check MongoDB slow query log: no query should take > 50ms
  13. Navigate between pages 10x → dashboard should load instantly from cache
```

---

## EXPECTED RESULTS

| Metric                          | Before       | After                          |
| ------------------------------- | ------------ | ------------------------------ |
| HTTP requests on dashboard load | 9            | 1                              |
| Requests on return navigation   | 9            | 0 (cache hit)                  |
| DB queries per load             | 8–11         | 11 (parallel, same connection) |
| Background tab revalidation     | Every focus  | Never                          |
| Network tab switches wasted     | Every switch | None                           |
| Dashboard load time (cold)      | ~800–1500ms  | ~150–300ms                     |
| Dashboard load time (warm)      | ~800–1500ms  | ~0ms (instant)                 |

---

## IMPORTANT NOTES

1. **Adjust model import paths** — the route file uses `@/models/Appointment` etc. Run `find apps/clinic/models -name "*.js"` to get your real paths and update accordingly.

2. **Keep old hooks temporarily** — don't delete `useDashboardStats.js` and `useDashboardLists.js` until the new hook is confirmed working in production. You can run both in parallel during testing.

3. **Doctor dashboard** — `useDoctorDashboardStats.js` and `useDoctorDashboardLists.js` are separate and should be migrated similarly after the clinic dashboard is done.

4. **`withAuth` middleware** — use whatever auth wrapper your other route files use. Check `apps/clinic/app/api/appointments/route.js` for the pattern.

5. **`getTenantId`** — use whatever function your other routes use to extract tenantId from the user object.
