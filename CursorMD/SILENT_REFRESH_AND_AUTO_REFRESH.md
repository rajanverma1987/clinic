# Silent Refresh and Auto-Refresh

## Overview

- **Silent refresh**: Tab switches and filter toggles update data via client-side state + API refetch only. No full page reload and no flicker.
- **Standard auto-refresh**: Dashboard and report pages periodically refetch data in the background so data stays up to date.

## Dashboard

- **Auto-refresh interval**: 60 seconds (configurable in `lib/constants/dashboard.js` as `DASHBOARD_AUTO_REFRESH_MS`).
- **What is refreshed**: Stats, lists (appointments, patients, invoices, low stock, etc.), and charts (for non-doctor users). All refetches are client-side; no page reload.
- **Visibility behavior**: When the tab is hidden (`document.hidden`), the interval is cleared to avoid needless work. When the tab becomes visible again, a refresh runs immediately and the interval is restarted.
- **Focus behavior**: When the window gains focus (e.g. user returns from another tab), stats, lists, and charts are refetched once.

## Reports Page

- **Tab switch**: All report tabs (Revenue, Patients, Appointments, Inventory) use `<button type="button">`. Switching tabs only updates React state and triggers the existing `useEffect` to fetch the active tab’s report—no form submit, no full reload.
- **Auto-refresh**: The current report tab is refetched silently every 2 minutes (`REPORTS_AUTO_REFRESH_MS`). Refetch uses a `silent` flag so the loading spinner is not shown (no flicker). When the tab is hidden, the interval is cleared; when visible again, it is restarted.

## Tab Buttons (Silent Tab Switch)

All tab buttons across the app use `type="button"` so they never submit a form and never cause a full page reload:

- **Shared components**: `components/ui/Tabs.jsx` (pills and default variants), `components/settings/SettingsTabs.jsx`.
- **Pages**: `app/reports/page.jsx`, `app/patient-portal/appointments/page.jsx`, `app/doctors/profile/page.jsx`, `app/admin/patients/[id]/page.jsx`, `app/patient-portal/profile/page.jsx`, `app/patient-portal/medical-records/page.jsx`, `app/patient-portal/doctors/[id]/page.jsx`, `app/doctors/patients/[id]/page.jsx`.
- **Inventory**: Low Stock filter on `app/inventory/page.jsx` uses a single clickable div with `preventDefault`/`stopPropagation` (no nested labels), so toggling the filter never triggers a full reload.

## Constants

| Constant | File | Value | Purpose |
|---------|------|--------|---------|
| `DASHBOARD_AUTO_REFRESH_MS` | `lib/constants/dashboard.js` | 60_000 (60 s) | Dashboard stats/lists/charts polling interval |
| `REPORTS_AUTO_REFRESH_MS` | `app/reports/page.jsx` | 120_000 (2 min) | Reports current-tab silent refetch interval |

## Adding New Tabbed Pages

1. Use `<button type="button">` for every tab trigger so tab switches never submit a form.
2. Load tab content via React state + `useEffect` (or similar) that fetches when `activeTab` (and any filters) change—no `router.refresh()` or full navigation for tab changes.
3. For auto-refresh, use a `setInterval` that calls your fetch with a `silent` option (or equivalent) so background refetch does not show the loading state, and clear the interval on `visibilitychange` when `document.hidden` is true.
