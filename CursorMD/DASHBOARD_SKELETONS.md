# Dashboard Skeletons

Skeleton loaders for the dashboard use shared CSS and a full-page skeleton that matches the real layout.

## Layout

**DashboardSkeleton** mirrors the real dashboard:

1. **Header** – Same structure as PageHeader: title row (accent dot + title), subtitle, and action placeholders. Uses `sticky-header-bar`, `--dashboard-header-height`, `--dashboard-header-padding-x`, `--dashboard-element-gap`.
2. **Stats row** – `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3` with 4 stat-card skeletons (matches non-doctor layout).
3. **Main content** – `grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch` with `dashboard-card-cell` wrappers. Six cells in this order:
   - Patients Summary (chart)
   - Today Appointments (list)
   - List card
   - Patients Review
   - Calendar
   - Appointment Request

Each content cell uses `dashboard-card-cell` so height comes from `--dashboard-card-height` (420px). Cards use `h-full flex flex-col` and inner content uses `flex-1 min-h-0` so skeletons fill the card.

## CSS (dashboard.css)

Skeleton utilities:

| Class | Purpose |
|-------|---------|
| `.skeleton` | Base shimmer gradient, `border-radius: var(--radius-md)`, `flex-shrink: 0` |
| `.skeleton-text` | Height from `--text-body-xs-line-height` (16px), no bottom margin |
| `.skeleton-text-lg` | Height from `--text-body-md-line-height` (24px) |
| `.skeleton-stat-icon` | 40×40px, matches `.stat-icon` |
| `.skeleton-list-item` | 72px height, list row placeholder |
| `.skeleton-list-item-sm` | 48px height, short rows (e.g. Patients Review) |
| `.skeleton-chart` | `flex: 1`, `min-height: 160px`, for chart/calendar body |
| `.skeleton-card` | 160px height, generic block |

Shimmer animation: `@keyframes shimmer` (background-position -200% → 200%).

## Per-component loading

Each dashboard card that supports `loading` uses the same patterns:

- **StatsCard** – `stat-card` wrapper, accent placeholder + `skeleton-text` + `skeleton-text-lg` + `skeleton-stat-icon` at bottom.
- **DashboardListCard** – Accent + title skeleton, then 4× `skeleton-list-item` in a `flex-1 min-h-0` list area.
- **CalendarWidget** – `calendar-widget-card` + `calendar-widget-inner`, `calendar-widget-header` with accent + title, then `skeleton flex-1 min-h-[200px]` for the calendar body.
- **ChartCard** – Accent + title, then `skeleton skeleton-chart flex-1`.
- **PatientsSummaryChart** – Same as ChartCard (accent + title + `skeleton-chart`).
- **PatientsReviewCard** – Accent + title, then 4× `skeleton-list-item-sm`.
- **AppointmentRequestCard** – Accent + title, then 3× 60px-high skeleton rows.

All loading cards use `h-full flex flex-col` and inner `flex-1 flex flex-col min-h-0` so they fill `dashboard-card-cell` height.

## Usage

The dashboard shows `DashboardSkeleton` when `isInitialLoading && !hasRenderedOnce && !forceRender`. Per-card skeletons are shown when that card’s `loading` prop is true (e.g. `loading={listsLoading}`). Use the shared classes above so sizes and motion stay consistent across the dashboard.
