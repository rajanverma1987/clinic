# PROBLEMS.md — 100% Line-by-Line Implementation Plan

This plan maps every section and checklist in `PROBLEMS.md` to concrete tasks, current codebase state, and target files. **JavaScript only** (no TypeScript). Aligns with CursorMD/New, existing SWR/cache, and clinic-only scope.

---

## Scope: Clinic tool vs Website

This repo contains **two separate applications**:

| App             | Location                                            | Purpose                                                                                                                                | This plan applies?                                                                                                                  |
| --------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Clinic tool** | Root: `app/`, `components/`, `lib/`, `hooks/`, etc. | Authenticated clinic dashboard (doctors, admins, staff): appointments, patients, prescriptions, billing, inventory, reports, settings. | **Yes** — all tasks, file paths, and checklists below refer to the **Clinic tool** only.                                            |
| **Website**     | `website/`                                          | Marketing/landing site: hero, pricing, blog, legal, contact. Public-facing; no dashboard.                                              | **No** — PROBLEMS.md audits the **Doctor's Clinic Dashboard**; the Website has its own structure and is out of scope for this plan. |

- **File paths in this document** (e.g. `app/dashboard/page.jsx`, `components/ui/Button.jsx`) are relative to the **repo root** and refer to the **Clinic tool**.
- **Website** code lives under `website/` (e.g. `website/components/`, `website/app/`) and is not modified by the tasks in this plan unless a task explicitly says “website” or “marketing”.

---

## Current State Summary (Clinic tool)

| Area              | Current State                                                                                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tabs**          | Sidebar links to `/dashboard?tab=appointments` and `?tab=prescriptions`; dashboard **redirects** to `/appointments` and `/prescriptions` (full routes). Each click = full Next.js navigation + compilation. |
| **Skeletons**     | `DashboardSkeleton.jsx` (layout-matched). `SkeletonFactory.jsx` has Table, Form, Chart, Calendar. Not every list/page has a component-specific skeleton.                                                    |
| **API**           | SWR in use (`useSWRDashboard`, `useSWRConfig`). `apiClient` + optional cache. Parallel batches in `useDashboardLists`/Charts. No TanStack Query (use SWR per .cursorrules).                                 |
| **Buttons/Links** | Sidebar uses `<Link>` for nav. Some list/detail actions may be buttons that should be links; needs audit.                                                                                                   |
| **Inputs**        | `--input-height: 2.5rem` (40px), `form-control-height` in globals; Input/Select/DatePicker use it. No explicit sm/md/lg size tokens.                                                                        |
| **Loading**       | Dashboard: full skeleton on load; SWR isValidating; some button loaders. No unified task-aware loading types.                                                                                               |

_(All of the above refer to the **Clinic tool** (`app/`, `components/`, etc.). The **Website** (`website/`) is separate and not in scope.)_

---

## CRITICAL ISSUE #1: Tab Switching (2–3s delay)

### PROBLEMS.md lines 9–113 — Implementation tasks

| #   | Checklist / requirement              | Current                                                                                     | Task                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Files                                                                                 |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1.1 | Tabs as separate routes?             | Yes: `/appointments`, `/prescriptions` are full pages; dashboard redirects `?tab=*` to them | **Consolidate** (Clinic tool): Dashboard must NOT redirect. Render tab content in-page.                                                                                                                                                                                                                                                                                                                                                                 | `app/dashboard/page.jsx`, `components/layout/Sidebar.jsx`                             |
| 1.2 | Tab state in URL or state?           | URL `?tab=` exists but triggers redirect                                                    | **Keep** `?tab=appointments` / `?tab=prescriptions`; **remove** redirect. Use `searchParams.get('tab')` and render tab content in same page.                                                                                                                                                                                                                                                                                                            | `app/dashboard/page.jsx`                                                              |
| 1.3 | Tab components dynamic import?       | N/A (tabs are routes)                                                                       | **Add**: `_tabs/AppointmentsTab.jsx`, `_tabs/PrescriptionsTab.jsx` (or under `_components`). Lazy-load with `dynamic(..., { loading: () => <TabSkeleton /> })`.                                                                                                                                                                                                                                                                                         | `app/dashboard/_tabs/` (new), `app/dashboard/page.jsx`                                |
| 1.4 | Shared layout for all tabs?          | Dashboard has `layout.jsx`; appointments/prescriptions have their own layouts               | **Single layout**: All tab content under `app/dashboard` so one layout wraps Overview + Appointments + Prescriptions tabs.                                                                                                                                                                                                                                                                                                                              | `app/dashboard/layout.jsx` (already shared when tabs are in-page)                     |
| 1.5 | Heavy deps on initial load?          | Charts/Calendar/CriticalAlerts already dynamic                                              | **Ensure** tab content (e.g. appointments list, prescriptions list) is lazy-loaded only when tab is selected.                                                                                                                                                                                                                                                                                                                                           | `app/dashboard/page.jsx`, `_tabs/*`                                                   |
| 1.6 | File structure: single page          | Currently dashboard + separate app/appointments, app/prescriptions                          | **Target**: Dashboard page renders Overview                                                                                                                                                                                                                                                                                                                                                                                                             | AppointmentsTab                                                                       | PrescriptionsTab by `?tab=`. Detail routes `/appointments/[id]`, `/prescriptions/[id]` remain for deep links. List views become tab content. | See 1.7 |
| 1.7 | File structure: \_tabs as components | N/A                                                                                         | **Create**: `app/dashboard/_components/TabBar.jsx`, `TabContent.jsx`; `app/dashboard/_tabs/OverviewTab.jsx`, `AppointmentsTab.jsx`, `PrescriptionsTab.jsx`. PROBLEMS.md also lists **PatientsTab** and **ReportsTab** — add **PatientsTab.jsx** (and optionally ReportsTab.jsx) if those list views are consolidated into dashboard tabs; else keep `/patients` and `/reports` as routes. Move list UIs into tab components or reuse shared components. | New dirs; refactor list pages to shared components used by tabs and/or by route pages |

**Sidebar change** (Clinic tool only): Keep links as `/dashboard?tab=appointments` and `/dashboard?tab=prescriptions`. Do **not** link to `/appointments` or `/prescriptions` for the main “list” view (or support both: dashboard tabs for in-dashboard list, and keep `/appointments` as a route that can render the same content for direct URL / bookmarks — then both use same component).

**Performance target**: Tab switch &lt; 50ms perceived; tab content render &lt; 200ms (with skeleton); **full data load &lt; 500ms** (from cache or API); no “Compiling…” on tab click.

---

## CRITICAL ISSUE #2: Skeleton screen architecture

### PROBLEMS.md lines 116–236 — Implementation tasks

| #    | Requirement                             | Current                                            | Task                                                                                                    | Files                                                                    |
| ---- | --------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 2.1  | Skeleton height = loaded component      | DashboardSkeleton matches grid/cards               | **Verify** with DevTools; fix any mismatch. Add **row count** to match default page size (e.g. 10/20).  | `app/dashboard/components/DashboardSkeleton.jsx`                         |
| 2.2  | Same number of rows/items               | Dashboard list skeletons use fixed counts (e.g. 5) | **Align** list skeleton row count with default page size used in data (e.g. 20).                        | Dashboard + list skeletons                                               |
| 2.3  | Skeleton grid/flex matches component    | Done for dashboard grid                            | **Audit** AppointmentsTab, PrescriptionsTab, Patients list: same grid/flex.                             | `_tabs/*`, `components/skeletons/`                                       |
| 2.4  | Skeleton widths (avatar, text, buttons) | Generic widths in SkeletonFactory                  | **Define** per-component: avatar 40px, text 60%/80%/45%, button width.                                  | `components/skeletons/SkeletonFactory.jsx`, component-specific skeletons |
| 2.5  | Borders/spacing match                   | Partially done                                     | **Match** border radius, padding, gap in each skeleton to real component.                               | All skeleton components                                                  |
| 2.6  | CSS-only animation, GPU-friendly        | Use `animate-pulse` / transform/opacity            | **Ensure** no layout-triggering props; use existing pulse/shimmer.                                      | globals/skeleton classes                                                 |
| 2.7  | Metrics cards skeleton                  | DashboardSkeleton has stat cards                   | **Confirm** icon area, number, label, trend match `StatsCard`.                                          | `DashboardSkeleton.jsx`, `StatsCard.jsx`                                 |
| 2.8  | Data tables skeleton                    | TableSkeleton in SkeletonFactory                   | **Per table**: header + N rows (page size), column widths, action column.                               | `components/skeletons/`, table pages                                     |
| 2.9  | Forms skeleton                          | FormSkeleton exists                                | **Align** field count and layout with real forms.                                                       | FormSkeleton, form pages                                                 |
| 2.10 | Calendar skeleton                       | CalendarSkeleton exists                            | **Match** 7-col week grid, time slot height, event placeholders.                                        | `CalendarSkeleton`, `CalendarWidget`                                     |
| 2.11 | Charts skeleton                         | ChartSkeleton variant                              | **Match** container height, axis, legend.                                                               | ChartSkeleton, ChartCard                                                 |
| 2.12 | Lists (patients, prescriptions)         | List item skeleton pattern                         | **Add** PatientListSkeleton, PrescriptionListSkeleton: item height, avatar, lines, action.              | New in SkeletonFactory or \_skeletons                                    |
| 2.13 | Loading state machine                   | idle/skeleton/data/error/empty                     | **Apply** in each data component: isLoading → skeleton; isError → error; isEmpty → empty; else content. | All list/dashboard components                                            |

---

## CRITICAL ISSUE #3: API performance architecture

### PROBLEMS.md lines 239–358 — Implementation tasks

| #    | Requirement                                    | Current                                            | Task                                                                                                                                                                      | Files                                                                                               |
| ---- | ---------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 3.1  | Parallel requests (no waterfall)               | useDashboardListsSWR / Charts use parallel batches | **Audit** all pages: no `await a(); await b();` — use `Promise.all` / `Promise.allSettled`.                                                                               | Dashboard hooks, any sequential fetch                                                               |
| 3.2  | Caching (SWR)                                  | SWR + getSWROptions, cache-config                  | **Confirm** staleTime/cacheTime per data type (dashboard stats/lists/charts, appointments, patients).                                                                     | `lib/cache/cache-config.js`, `hooks/useSWRDashboard.js`                                             |
| 3.3  | Optimistic updates                             | Not systematic                                     | **Add** for mutations: appointments update, patient update, prescription update — update cache in `onMutate`, rollback in `onError`, invalidate in `onSettled`.           | Hooks that use `mutate` for mutations; consider SWR’s `optimisticData` / `rollbackOnError`          |
| 3.4  | Request deduplication                          | SWR dedupes by key                                 | **Verify** same key used across components for same data; check Network tab.                                                                                              | All useSWR keys (dashboard-keys, etc.)                                                              |
| 3.5  | Prefetch on hover                              | usePrefetchTabs for patient tabs                   | **Add** prefetch on hover for list → detail (e.g. patient list item hover → prefetch patient detail; appointment hover → prefetch appointment).                           | List components (patients, appointments, prescriptions), `lib/query/queryConfig.js` prefetch helper |
| 3.6  | Pagination / infinite scroll                   | Some lists paginated                               | **Ensure** all list endpoints and UIs use pagination; no unbounded loads.                                                                                                 | API routes, list pages                                                                              |
| 3.7  | Search debounce (≥300ms)                       | Audit needed                                       | **Add** debounce to search inputs (300ms min).                                                                                                                            | Search components, dashboard/list filters                                                           |
| 3.8  | Backend: indexes, pooling, N+1, slow query log | DB indexes and queries                             | **Audit** MongoDB indexes for appointments, billing, inventory; **connection pooling** configured; aggregation/joins to avoid N+1; **slow queries logged and monitored**. | `lib/db/indexes.js`, `lib/db/connection.js`, API routes                                             |
| 3.9  | Backend: pagination, compression, Redis        | Per existing architecture                          | **Confirm** response pagination, gzip/brotli, Redis where specified.                                                                                                      | API routes, next.config, Redis usage                                                                |
| 3.10 | API response &lt; 200ms P95                    | —                                                  | **Measure** and log; add perf marks if needed.                                                                                                                            | `lib/cache/perf-markers.js`, API middleware                                                         |
| 3.11 | Network: CDN, HTTP/2, edge                     | —                                                  | **Confirm** static assets on CDN (if applicable); HTTP/2 or HTTP/3 enabled; API routes using edge functions where possible.                                               | next.config, hosting/CDN, API routes                                                                |

---

## ISSUE #4: Interaction patterns (buttons vs links)

### PROBLEMS.md lines 361–448 — Implementation tasks

| #   | Rule                                                                                  | Task                                                                                                          | Files                                  |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 4.1 | Use `<button>` for: state change, submit, non-navigation, disabled, loading           | Keep; ensure loading/disabled on async actions.                                                               | All forms and action buttons           |
| 4.2 | Use `<Link>` for: different page, shareable URL, history, bookmark                    | **Audit**: Every “View…”, “See all…”, “Go to…”, sidebar nav, table row to detail → must be `<Link href=...>`. | All pages/components that navigate     |
| 4.3 | Use `<div>` with click only when necessary; add role, tabIndex, onKeyDown, aria-label | **Audit** div onClick; convert to button or link where possible; else add a11y.                               | Global grep `onClick` on divs          |
| 4.4 | Button types: primary, secondary, tertiary, icon, destructive, loading                | **Confirm** Button variants and usage; icon buttons have aria-label.                                          | `components/ui/Button.jsx`, all usages |
| 4.5 | Checklist: navigate? → Link; action? → button; loading state; a11y                    | **Line-by-line** audit dashboard, appointments, patients, prescriptions, invoices, inventory.                 | All app/ and components/               |

---

## ISSUE #5: Input height consistency

### PROBLEMS.md lines 451–521 — Implementation tasks

| #   | Requirement                                                                                                                                                | Current                                           | Task                                                                                                                                                                                                                                                    | Files                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 5.1 | Standard sizes: sm 32px, md 40px, lg 48px                                                                                                                  | `--input-height: 2.5rem` (40px) only              | **Add** CSS vars: `--input-height-sm`, `--input-height-md`, `--input-height-lg`; default md.                                                                                                                                                            | `app/globals.css`                                                  |
| 5.2 | All input types same height                                                                                                                                | Input, Select, DatePicker use form-control-height | **Apply** size prop and consistent height to: text, number, email, password, **date picker**, **time picker**, **select**, **multi-select**, **autocomplete**, **textarea**, **search**. Same border thickness, radius, focus, disabled, error styling. | `components/ui/Input.jsx`, `Select.jsx`, `DatePicker.jsx`, globals |
| 5.3 | Same height as buttons in same row                                                                                                                         | Button has sm/md                                  | **Align** form row: input md + button md (40px).                                                                                                                                                                                                        | All form rows (search bars, filters)                               |
| 5.4 | Inline form (input + button) 40px; **Pattern 3**: input with icon (icon 20x20px, centered in 40px); **Pattern 4**: input with clear button (clear 40x40px) | —                                                 | **Audit** all inline search/filter rows; ensure icon and clear-button patterns match spec.                                                                                                                                                              | Dashboard, list pages                                              |
| 5.5 | Touch target ≥ 44px (mobile)                                                                                                                               | 40px default                                      | **Optional** container padding or use lg on touch-heavy screens.                                                                                                                                                                                        | Responsive forms                                                   |
| 5.6 | Label htmlFor, error aria-describedby, aria-invalid, **placeholder contrast ≥ 4.5:1**                                                                      | Audit                                             | **Ensure** all inputs: associated label, error linking, disabled/focus visible, **placeholder contrast 4.5:1**.                                                                                                                                         | Form components                                                    |

---

## ISSUE #6: Dashboard loading states

### PROBLEMS.md lines 524–616 — Implementation tasks

| #    | Loading type                             | Task                                                                                                | Files                                                                                                                                                                                                                                                                                                                                                                             |
| ---- | ---------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 6.1  | Page load (0–2s)                         | Full skeleton; optional top progress bar.                                                           | Dashboard, layout                                                                                                                                                                                                                                                                                                                                                                 |
| 6.2  | Tab switch                               | Instant tab highlight; tab content skeleton if not cached.                                          | TabBar, TabContent, \_tabs                                                                                                                                                                                                                                                                                                                                                        |
| 6.3  | Data refresh                             | Subtle indicator; data stays visible.                                                               | Use SWR `isValidating`; show small indicator, no full skeleton.                                                                                                                                                                                                                                                                                                                   | Dashboard, list components |
| 6.4  | Action (save/delete)                     | Button loading (spinner + disabled); optional optimistic UI.                                        | All mutation buttons                                                                                                                                                                                                                                                                                                                                                              |
| 6.5  | Background sync                          | Non-intrusive; toast on complete.                                                                   | RealtimeContext / SWR revalidation                                                                                                                                                                                                                                                                                                                                                |
| 6.6  | File upload/download                     | Progress bar + cancel.                                                                              | Upload/download components                                                                                                                                                                                                                                                                                                                                                        |
| 6.7  | Search/filter                            | Inline loading in results; keep previous results dimmed.                                            | Search/filter UIs                                                                                                                                                                                                                                                                                                                                                                 |
| 6.8  | Long task &gt; 3s                        | Progress bar + cancel + optional ETA.                                                               | Report generation, bulk ops                                                                                                                                                                                                                                                                                                                                                       |
| 6.9  | Error + retry                            | Every async path has error state and retry.                                                         | All data components                                                                                                                                                                                                                                                                                                                                                               |
| 6.10 | Decision tree                            | Implement: first load → full skeleton; refresh → indicator; action → button state; long → progress. | Centralize in a small LoadingStates helper if desired                                                                                                                                                                                                                                                                                                                             |
| 6.11 | **Global loading state** (optional)      | —                                                                                                   | **Consider** context with: isPageLoading, isRefreshing, isSyncing, activeRequests, currentTask (human-readable). Use for top bar or status indicator.                                                                                                                                                                                                                             | Context or store           |
| 6.12 | **Loading checklist (PROBLEMS 682–714)** | —                                                                                                   | **Immediate feedback &lt; 16ms** (press state, cursor); **indicator after 200ms** (spinner/skeleton/progress); indicator matches task scope; **success confirmation** (critical: modal/toast; simple: optimistic only). **Loading indicator placement**: component (button/table/card/form/modal), page (progress bar/skeleton/center spinner), global (corner/status bar/toast). | All async flows            |

---

## Technical architecture (file structure)

### PROBLEMS.md lines 619–662 — Implementation tasks

| #   | Item                                                                                                                       | Task                                                                                                                                                                                            | Files                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 7.1 | `app/dashboard/layout.jsx`                                                                                                 | Keep; shared for all dashboard tabs.                                                                                                                                                            | `app/dashboard/layout.jsx`                                 |
| 7.2 | `app/dashboard/page.jsx`                                                                                                   | Single page; reads `?tab=`; renders TabBar + TabContent.                                                                                                                                        | `app/dashboard/page.jsx`                                   |
| 7.3 | `_components/TabBar.jsx`, `TabContent.jsx`, **DashboardHeader.tsx**, **LoadingStates.tsx**                                 | **Add** TabBar, TabContent; PROBLEMS.md also lists **DashboardHeader** and **LoadingStates** (centralized skeletons) — add if not already covered by layout/PageHeader and skeleton components. | `app/dashboard/_components/`                               |
| 7.4 | `_tabs/OverviewTab.jsx`, `AppointmentsTab.jsx`, `PrescriptionsTab.jsx` (+ **PatientsTab**, **ReportsTab** if consolidated) | **Add**; Overview = current dashboard content; Appointments/Prescriptions = list content (from current route pages or shared components).                                                       | `app/dashboard/_tabs/`                                     |
| 7.5 | `_skeletons/`                                                                                                              | **Add** OverviewSkeleton (existing DashboardSkeleton), AppointmentsSkeleton, PrescriptionsSkeleton, **PatientsSkeleton**, **ReportsSkeleton** (if those tabs exist).                            | `app/dashboard/_skeletons/` or use `components/skeletons/` |
| 7.6 | `_hooks/`                                                                                                                  | **Keep** existing dashboard hooks; add useAppointments, usePrescriptions for tab data if needed.                                                                                                | `app/dashboard/hooks/`                                     |
| 7.7 | Tab content pattern                                                                                                        | Each tab: Suspense + skeleton fallback; inside, use SWR hook; if loading → skeleton; error → error state; empty → empty state; else content.                                                    | Each `_tabs/*.jsx`                                         |
| 7.8 | Prefetch / measure                                                                                                         | Prefetch on tab hover if desired. **Measure tab switch**: performance.now(); **log to analytics** (e.g. tab, duration, isFast); **console.warn if &gt; 500ms**.                                 | TabBar, optional perf utility (e.g. measureTabSwitch())    |

---

## Final implementation checklist (phases)

### Phase 1: Tab switching (Priority 1)

| Done? | Task                                                                                                                                                                                                                        |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ☑     | Remove redirect from dashboard for `?tab=appointments` and `?tab=prescriptions`.                                                                                                                                            |
| ☑     | Create `_components/TabBar.jsx` and `TabContent.jsx`; drive by `searchParams.get('tab')`.                                                                                                                                   |
| ☑     | Create `_tabs/OverviewTab.jsx` (current dashboard content), `AppointmentsTab.jsx`, `PrescriptionsTab.jsx` (list content).                                                                                                   |
| ☑     | Lazy-load tab components with `dynamic(..., loading: TabSkeleton)`.                                                                                                                                                         |
| ☑     | Measure tab switch time (target &lt; 200ms); ensure no “Compiling…” on tab click.                                                                                                                                           |
| ☑     | Update Sidebar (Clinic tool) so “Appointments” and “Prescriptions” go to `/dashboard?tab=appointments` and `/dashboard?tab=prescriptions` only (or keep `/appointments` as alias that renders same content for direct URL). |

### Phase 2: Skeletons (Priority 2)

| Done? | Task                                                                                                                                |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ☑     | One skeleton per major component (Overview, Appointments list, Prescriptions list, Patients list, Tables, Forms, Charts, Calendar). |
| ☑     | Match skeleton dimensions and row counts to loaded content exactly; measure CLS (target &lt; 0.1).                                  |
| ☑     | Add skeleton for **all** loading states: initial, refresh, filter (per PROBLEMS 687).                                               |
| ☑     | Progressive loading: header → content → actions where applicable.                                                                   |

### Phase 3: API performance (Priority 3)

| Done? | Task                                                                             |
| ----- | -------------------------------------------------------------------------------- |
| ☑     | Confirm SWR config (staleTime, cacheTime) per key; parallel requests everywhere. |
| ☑     | Convert critical mutations to optimistic updates (or document where not done).   |
| ☑     | Prefetch on hover for list → detail.                                             |
| ☑     | Measure API P95; backend: indexes, no N+1, pagination, compression.              |

### Phase 4: Interaction patterns (Priority 4)

| Done? | Task                                                                    |
| ----- | ----------------------------------------------------------------------- |
| ☑     | Audit all buttons: navigation → Link; actions → button; loading + a11y. |
| ☑     | Icon buttons: aria-label; keyboard (Tab, Enter, Esc).                   |

### Phase 5: Input consistency (Priority 5)

| Done? | Task                                                                      |
| ----- | ------------------------------------------------------------------------- |
| ☑     | Define sm/md/lg input heights in CSS; apply to Input, Select, DatePicker. |
| ☑     | Audit form rows; buttons same height as inputs; 44px touch where needed.  |

### Phase 6: Loading states (Priority 6)

| Done? | Task                                                                                   |
| ----- | -------------------------------------------------------------------------------------- |
| ☑     | Task-aware indicators: page load, tab switch, refresh, action, long task, error+retry. |
| ☑     | Data visible during background refresh; progress + cancel for long tasks.              |

---

## Success criteria (PROBLEMS.md lines 719–732)

- Tab switches &lt; 50ms perceived, &lt; 200ms measured; no “Compiling…” on tab click.
- Skeletons match layout (CLS &lt; 0.1).
- API feels instant with cache (&lt; 100ms); without cache &lt; 300ms.
- Buttons have loading state; inputs consistent height; navigation = Link, actions = button.
- Long tasks show progress; keyboard and error recovery work; Lighthouse Performance &gt; 90 (mobile).

---

## Measurement tools (PROBLEMS.md lines 736–752)

- **Chrome DevTools**: Performance tab (record tab switch), Network (parallelization), **Coverage tab (unused code)**, Lighthouse.
- **React DevTools**: Profiler (render time), Components (unnecessary re-renders).
- **SWR** (project uses SWR, not TanStack Query): cache inspection, deduping, stale/fresh via useSWRConfig (or devtools if added).
- **Custom**: performance.mark() around critical operations; log to analytics (Vercel Analytics, Mixpanel, etc.); alerts for slow ops (&gt; 500ms).

---

## Implementation order (recommended)

1. **Phase 1** (tab switching): Unblock 2–3s delay; single dashboard page + tab components.
2. **Phase 2** (skeletons): Per-tab and per-component skeletons; CLS and perceived performance.
3. **Phase 3** (API): Parallel + cache + optimistic + prefetch; backend checks.
4. **Phase 4** (buttons/links): Accessibility and correctness.
5. **Phase 5** (inputs): Visual consistency and a11y.
6. **Phase 6** (loading): Polish and long-task UX.

Each phase can be broken into smaller PRs (e.g. Phase 1: remove redirect + add TabBar/TabContent, then add \_tabs, then lazy-load).

---

## 100% coverage checklist (PROBLEMS.md)

| PROBLEMS.md section              | Plan section       | Notes                                                                                                         |
| -------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| Purpose (3–6)                    | —                  | No actionable task; scope reflected throughout. PROBLEMS.md audits **Clinic dashboard**; Website is separate. |
| Critical #1 Tab (9–113)          | §1 + Phase 1 + 7.x | All checklist items, file structure, performance targets (50ms/200ms/**500ms**).                              |
| Critical #2 Skeletons (116–236)  | §2 + Phase 2       | Anatomy, checklist, component types, state machine (idle/skeleton/data/error/empty).                          |
| Critical #3 API (239–358)        | §3 + Phase 3       | Layers 1–5; frontend/backend/network checklists; SWR used instead of TanStack Query per .cursorrules.         |
| Issue #4 Buttons/Links (361–448) | §4 + Phase 4       | Decision matrix, button types, audit checklist.                                                               |
| Issue #5 Input (451–521)         | §5 + Phase 5       | Heights sm/md/lg, all input types, form patterns, a11y (incl. placeholder contrast).                          |
| Issue #6 Loading (524–616)       | §6 + Phase 6       | All 7 loading types, loader architecture, task patterns, placement, decision tree, checklist.                 |
| Architecture (619–662)           | §7                 | File structure, TabBar/TabContent/DashboardHeader/LoadingStates, \_tabs, \_skeletons, \_hooks, measurement.   |
| Final checklist (759–815)        | Phases 1–6         | All phase items; Phase 3 uses SWR (not “Install TanStack Query”).                                             |
| Success criteria (719–732)       | Success criteria   | All 12 criteria.                                                                                              |
| Measurement tools (736–752)      | Measurement tools  | Chrome (incl. Coverage), React DevTools, SWR, custom metrics.                                                 |

#Keep only paypal payment method for subscription. remove card option

**Intentional alignment**: JavaScript only; SWR for caching (not TanStack Query); CursorMD/New and clinic-only scope. **Scope**: This plan applies to the **Clinic tool** (root `app/`, `components/`, etc.). The **Website** (`website/`) is a separate app and is out of scope unless a task explicitly references it.
