# 🏥 Clinic Dashboard Technical Architecture & UX Audit

## Purpose

Audit the Doctor's Clinic Dashboard for enterprise-grade technical architecture, interaction patterns, and performance optimization. **NO color/styling suggestions - focus ONLY on structure, behavior, and technical implementation.**

---

## 🚨 CRITICAL ISSUE #1: TAB SWITCHING (2-3 Second Delay)

### Current Problem Analysis:

```
User clicks tab → "○ Compiling /prescriptions ... ✓ Compiled in 916ms (4303 modules)"
```

**This indicates:**

- ❌ Tabs are implemented as separate Next.js routes/pages
- ❌ Each tab click triggers server-side compilation
- ❌ 4303 modules being loaded per tab = massive overhead
- ❌ No code splitting or lazy loading strategy

### Required Architecture:

#### ✅ CORRECT Pattern: Single Page with Client-Side State

```typescript
// app/dashboard/page.tsx (SINGLE PAGE for all tabs)
'use client'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get('tab') || 'overview'

  const switchTab = (tabId: string) => {
    // Update URL without page reload
    router.push(`/dashboard?tab=${tabId}`, { shallow: true })
  }

  return (
    <div>
      <TabBar activeTab={activeTab} onTabChange={switchTab} />
      <TabContent activeTab={activeTab} />
    </div>
  )
}
```

#### Tab Content Pattern:

```typescript
// Lazy load tab content - only load when needed
const TabContent = ({ activeTab }) => {
  return (
    <Suspense fallback={<TabSkeleton type={activeTab} />}>
      {activeTab === 'appointments' && <AppointmentsTab />}
      {activeTab === 'prescriptions' && <PrescriptionsTab />}
      {activeTab === 'patients' && <PatientsTab />}
    </Suspense>
  )
}
```

### Technical Checklist:

```
Current Implementation Audit:
□ Are tabs separate files in app/appointments/page.tsx, app/prescriptions/page.tsx?
  → If YES: THIS IS THE PROBLEM - consolidate into single page

□ Is tab state stored in URL or component state?
  → URL: Use searchParams (?tab=appointments)
  → State: Use useState for instant switching

□ Are tab components using dynamic imports?
  → Should be: const PrescriptionsTab = lazy(() => import('./tabs/Prescriptions'))

□ Is there a shared layout.tsx for all tabs?
  → If NO: Each tab is loading full layout = slow

□ Are heavy dependencies (charts, PDF, Excel) loaded on initial page load?
  → If YES: Move to tab-specific dynamic imports

File Structure - WRONG:
app/
├── appointments/
│   └── page.tsx          ❌ Separate page = compilation on navigate
├── prescriptions/
│   └── page.tsx          ❌ Separate page = compilation on navigate
└── patients/
    └── page.tsx          ❌ Separate page = compilation on navigate

File Structure - CORRECT:
app/
├── dashboard/
│   ├── page.tsx          ✅ Single page
│   ├── _components/
│   │   ├── TabBar.tsx
│   │   └── TabContent.tsx
│   └── _tabs/
│       ├── AppointmentsTab.tsx    ✅ Components, not pages
│       ├── PrescriptionsTab.tsx
│       └── PatientsTab.tsx
```

### Performance Target:

- **Tab switch perceived time: < 50ms** (instant visual feedback)
- **Tab content render: < 200ms** (with skeleton)
- **Full data load: < 500ms** (from cache or API)

---

## 💀 CRITICAL ISSUE #2: SKELETON SCREEN ARCHITECTURE

### The Problem:

Generic skeletons that don't match final layout = jarring visual jump when content loads

### Required Pattern: Component-Specific Skeletons

#### Dashboard Skeleton Structure:

```
Dashboard Page Anatomy:
┌─────────────────────────────────────────────────┐
│ Header (Fixed)                                   │ ← No skeleton needed (static)
├─────────────────────────────────────────────────┤
│ Metrics Row (4 cards)                           │ ← MetricsCardsSkeleton
├─────────────────────────────────────────────────┤
│ ┌──────────────────┬────────────────────────┐  │
│ │ Today's Schedule │ Quick Actions          │  │ ← TwoColumnSkeleton
│ │ (List)           │ (Buttons + Form)       │  │
│ └──────────────────┴────────────────────────┘  │
├─────────────────────────────────────────────────┤
│ Recent Activity Table                           │ ← TableSkeleton
└─────────────────────────────────────────────────┘
```

#### Skeleton Implementation Checklist:

```
For EACH component that loads data:

□ Does skeleton have EXACT same height as loaded component?
  → Measure: Loaded component height = Skeleton height
  → Tool: Chrome DevTools Elements panel

□ Does skeleton have EXACT same number of rows/items?
  → Example: If table shows 10 rows, skeleton shows 10 rows
  → Use: Default page size (e.g., 20 items) for skeleton count

□ Does skeleton match grid/flex layout?
  → If component is 3-column grid, skeleton is 3-column grid
  → If component is flexbox row, skeleton is flexbox row

□ Are skeleton element widths matching content widths?
  → Avatar: Same size (e.g., 40x40px)
  → Text: Varying widths (60%, 80%, 45% to look natural)
  → Buttons: Exact button width

□ Do skeleton borders/spacing match actual component?
  → Border radius same
  → Padding same
  → Gap/spacing same

□ Is skeleton animation non-blocking?
  → Use CSS animation (not JS)
  → Use transform/opacity (GPU accelerated)
  → Avoid layout-triggering properties
```

#### Skeleton Component Pattern:

```typescript
// Wrong: Generic skeleton
<div className="skeleton-loader" /> ❌

// Correct: Component-matched skeleton
<div className="metrics-grid"> {/* Same container as real component */}
  {[1,2,3,4].map(i => (
    <div key={i} className="metric-card"> {/* Same card structure */}
      <div className="skeleton-line w-16 h-4" /> {/* Icon placeholder */}
      <div className="skeleton-line w-24 h-8 mt-2" /> {/* Number placeholder */}
      <div className="skeleton-line w-32 h-3 mt-1" /> {/* Label placeholder */}
    </div>
  ))}
</div>
```

#### Skeleton States by Component Type:

```
1. Dashboard Cards (Metrics):
   □ Card container with exact dimensions
   □ Icon area (circle or square)
   □ Large number area (bold, larger)
   □ Label area (smaller text)
   □ Trend indicator area (optional)

2. Data Tables:
   □ Table header (static - no skeleton)
   □ N rows based on page size
   □ Column widths matching actual columns
   □ Action button placeholders in last column

3. Forms:
   □ Label area (static - no skeleton)
   □ Input field placeholders (full width)
   □ Button placeholders (actual button size)

4. Calendar/Schedule:
   □ Grid structure (7 columns for week view)
   □ Time slots (matching actual slot height)
   □ Event placeholders (varying widths)

5. Charts:
   □ Chart container with fixed height
   □ Axis placeholders
   □ Simple geometric shape (bar/line approximation)
   □ Legend placeholders

6. Lists (Patients, Prescriptions):
   □ List item container (same height as real item)
   □ Avatar placeholder (circle, left)
   □ Text lines (name, details, metadata)
   □ Action button placeholder (right)
```

### Skeleton Loading States Architecture:

```typescript
// State machine for loading states
type LoadingState =
  | 'idle'           // Not loaded yet
  | 'skeleton'       // Showing skeleton
  | 'data'           // Showing real data
  | 'error'          // Error state
  | 'empty'          // No data (different from error)

// Component pattern
function PatientList() {
  const { data, isLoading, isError, isEmpty } = usePatients()

  if (isLoading) return <PatientListSkeleton />
  if (isError) return <ErrorState onRetry={refetch} />
  if (isEmpty) return <EmptyState onAction={createPatient} />

  return <PatientListContent data={data} />
}
```

---

## ⚡ CRITICAL ISSUE #3: API PERFORMANCE ARCHITECTURE

### Current Problem:

APIs feel slow, no caching strategy, waterfall requests

### Required: Multi-Layer Performance Strategy

#### Layer 1: Request Architecture

```typescript
// ❌ WRONG: Serial requests (waterfall)
const dashboard = await fetchDashboard();
const appointments = await fetchAppointments(); // Waits for above
const patients = await fetchPatients(); // Waits for above

// ✅ CORRECT: Parallel requests
const [dashboard, appointments, patients] = await Promise.all([
  fetchDashboard(),
  fetchAppointments(),
  fetchPatients(),
]);
```

#### Layer 2: Caching Strategy (TanStack Query)

```typescript
// Install: npm install @tanstack/react-query

// Setup in layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // Consider fresh for 30s
      cacheTime: 300000, // Keep in cache for 5min
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
    },
  },
});

// Usage in components
function AppointmentsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['appointments', date],
    queryFn: () => fetchAppointments(date),
    staleTime: 30000, // 30s for time-sensitive data
  });
}

function PatientsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: fetchPatients,
    staleTime: 300000, // 5min for stable data
  });
}
```

#### Layer 3: Optimistic Updates

```typescript
// For instant UI feedback on mutations
function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAppointment,
    onMutate: async (updatedData) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries(['appointments']);

      // Snapshot current data
      const previous = queryClient.getQueryData(['appointments']);

      // Optimistically update
      queryClient.setQueryData(['appointments'], (old) =>
        old.map((apt) => (apt.id === updatedData.id ? updatedData : apt)),
      );

      return { previous };
    },
    onError: (err, updatedData, context) => {
      // Rollback on error
      queryClient.setQueryData(['appointments'], context.previous);
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries(['appointments']);
    },
  });
}
```

#### Layer 4: Request Deduplication

```
Scenario: 3 components need same patient data
❌ WRONG: 3 separate API calls
✅ CORRECT: TanStack Query deduplicates automatically

How it works:
- Component A requests ['patient', '123']
- Component B requests ['patient', '123'] (same key)
- Component C requests ['patient', '123'] (same key)
→ Only 1 API call made, result shared to all 3
```

#### Layer 5: Prefetching

```typescript
// Prefetch on hover for instant navigation
function PatientListItem({ patient }) {
  const queryClient = useQueryClient()

  const prefetchDetails = () => {
    queryClient.prefetchQuery({
      queryKey: ['patient', patient.id],
      queryFn: () => fetchPatientDetails(patient.id),
    })
  }

  return (
    <div onMouseEnter={prefetchDetails}>
      <Link href={`/patients/${patient.id}`}>
        {patient.name}
      </Link>
    </div>
  )
}
```

#### API Performance Checklist:

```
Frontend:
□ Is TanStack Query (or SWR) installed and configured?
□ Are all GET requests cached with appropriate staleTime?
□ Are related requests using Promise.all (parallel)?
□ Are mutations using optimistic updates?
□ Is request deduplication working? (check Network tab)
□ Are list pages using pagination/infinite scroll?
□ Is search input debounced (300ms minimum)?

Backend:
□ Are database queries indexed properly?
□ Is connection pooling configured?
□ Are N+1 queries eliminated? (use aggregation/joins)
□ Is response pagination implemented?
□ Are responses compressed (gzip/brotli)?
□ Is Redis caching configured for frequent queries?
□ Are slow queries logged and monitored?

Network:
□ Is API response time < 200ms for 95th percentile?
□ Are static assets on CDN?
□ Is HTTP/2 or HTTP/3 enabled?
□ Are API routes using edge functions (if possible)?
```

---

## 🎯 ISSUE #4: INTERACTION PATTERNS (Buttons vs Links)

### Decision Matrix: When to Use What

#### **Use `<button>` Element:**

```
Actions that:
□ Trigger state changes (open modal, submit form, toggle)
□ Perform operations (save, delete, update, send)
□ Don't navigate to new page
□ Are disabled conditionally
□ Need loading/processing state

Examples:
- "Save Patient"
- "Book Appointment"
- "Generate Invoice"
- "Send Prescription"
- "Mark as Complete"
- "Cancel"
- "Submit"
- Filter buttons
- Sort buttons
- Action menu triggers (⋮)
```

**Implementation:**

```typescript
// Primary actions (main CTA)
<button type="button" onClick={handleSave} disabled={isSaving}>
  {isSaving ? <Spinner /> : 'Save Patient'}
</button>

// Secondary actions
<button type="button" onClick={handleCancel}>
  Cancel
</button>

// Destructive actions
<button type="button" onClick={handleDelete}>
  Delete
</button>

// Icon buttons
<button type="button" onClick={handleEdit} aria-label="Edit patient">
  <EditIcon />
</button>
```

#### **Use `<Link>` or `<a>` Element:**

```
Navigation that:
□ Goes to different page/route
□ Has a URL that can be opened in new tab
□ Should be crawlable by search engines
□ Appears in browser history
□ Can be bookmarked

Examples:
- "View Patient Details"
- "See All Appointments"
- "Go to Reports"
- Sidebar navigation items
- Breadcrumb links
- Table row clicks (to detail page)
- "Learn More" links
```

**Implementation:**

```typescript
// Next.js Link
<Link href={`/patients/${patient.id}`}>
  View Details
</Link>

// External link
<a href="https://help.clinic.com" target="_blank" rel="noopener">
  Help Documentation
</a>

// Navigation with state
<Link href={`/appointments?date=${date}`}>
  Today's Schedule
</Link>
```

#### **Use `<div>` with `onClick` (Clickable):**

```
ONLY when:
□ Complex interactive component (drag-drop, multi-select)
□ Custom widgets that aren't standard buttons/links
□ Event handlers on containers (but prefer button/link inside)

⚠️ Must include:
- role="button" or appropriate ARIA role
- tabIndex={0} for keyboard access
- onKeyDown handler for Enter/Space
- Accessible label
```

**Implementation:**

```typescript
// Card that opens modal (not navigation)
<div
  role="button"
  tabIndex={0}
  onClick={handleOpenModal}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleOpenModal()
    }
  }}
  aria-label="Open patient quick view"
>
  {/* Card content */}
</div>
```

#### **Button Type Classification:**

```
Structure your buttons into categories:

1. PRIMARY BUTTON (1 per page section)
   - Main call-to-action
   - Example: "Create Appointment", "Save Changes"
   - Usage: Most important action user should take

2. SECONDARY BUTTON (supporting actions)
   - Less prominent than primary
   - Example: "Cancel", "Go Back", "Skip"
   - Usage: Alternative or less critical actions

3. TERTIARY BUTTON / TEXT BUTTON (minimal emphasis)
   - Least prominent
   - Example: "Learn More", "View Details", "Advanced Options"
   - Usage: Low-priority actions, often toggles

4. ICON BUTTON (compact)
   - Just icon, no text (or icon + text)
   - Example: Edit (✏️), Delete (🗑️), More (⋮)
   - Usage: Space-constrained areas, repeated actions
   - ⚠️ Must have aria-label

5. DESTRUCTIVE BUTTON (dangerous actions)
   - Visually indicates danger
   - Example: "Delete Patient", "Cancel Appointment"
   - Usage: Irreversible or critical actions
   - Should trigger confirmation modal

6. LOADING BUTTON (processing state)
   - Shows spinner during async operation
   - Disabled while loading
   - Example: Button becomes "Saving..." with spinner
```

#### Button Audit Checklist:

```
For EACH button in your dashboard:

□ Does it navigate to a new page?
  → YES: Change to <Link>
  → NO: Keep as <button>

□ Does it have a URL that should be shareable?
  → YES: Use <Link> with proper href
  → NO: Use <button>

□ Does it trigger an action (save, delete, create)?
  → YES: <button> with onClick

□ Does it open a modal/dropdown?
  → YES: <button> with onClick

□ Does it have a loading state?
  → YES: Ensure disabled={isLoading} and show spinner

□ Does it have an accessible label?
  → Icon-only buttons: Add aria-label
  → Text buttons: Text is the label (no aria-label needed)

□ Can it be triggered by keyboard?
  → <button>: Automatically accessible
  → <div onClick>: Must add tabIndex and onKeyDown
```

---

## 📏 ISSUE #5: INPUT HEIGHT CONSISTENCY

### Problem:

Inconsistent input heights create visual chaos and alignment issues

### Required Architecture: Unified Input System

#### Input Height Specification:

```
Define standard sizes in your design system:

SIZE         HEIGHT    USE CASE
─────────────────────────────────────────────────
sm           32px      Compact tables, filters, inline edit
md (default) 40px      Standard forms, search bars
lg           48px      Prominent inputs, touch-friendly

Padding breakdown (for md/40px):
┌────────────────────────────┐
│ ↕ 8px (top padding)        │
│ Text: 16px line-height 24px│  = 40px total
│ ↕ 8px (bottom padding)     │
└────────────────────────────┘

Internal spacing:
- Left padding: 12px (or 40px if has icon)
- Right padding: 12px (or 40px if has icon/clear button)
```

#### Input Component Checklist:

```
All input types MUST have consistent heights:

□ Text input (<input type="text">)
□ Number input (<input type="number">)
□ Email input (<input type="email">)
□ Password input (<input type="password">)
□ Date picker (custom or native)
□ Time picker
□ Select/dropdown
□ Multi-select
□ Autocomplete
□ Textarea (min-height same, expandable)
□ Search input

Visual Consistency:
□ Same height as buttons in same row
□ Same border thickness
□ Same border radius
□ Same focus state outline
□ Same disabled state styling
□ Same error state styling
```

#### Form Layout Patterns:

```
Pattern 1: Inline Form (Input + Button)
┌──────────────────────┬─────────┐
│ Search input (40px)  │ Btn 40px│
└──────────────────────┴─────────┘
→ Both must be 40px for alignment

Pattern 2: Two-Column Form
┌──────────────┬──────────────┐
│ First Name   │ Last Name    │  ← Both 40px
├──────────────┴──────────────┤
│ Email                       │  ← 40px
├─────────────────────────────┤
│ Phone                       │  ← 40px
└─────────────────────────────┘

Pattern 3: Input with Icon
┌────────────────────────────┐
│ 🔍 Search patients...       │  ← Icon centered in 40px
└────────────────────────────┘
Icon: 20x20px, centered vertically

Pattern 4: Input with Clear Button
┌─────────────────────────┬──┐
│ Text content            │ ✕ │  ← Clear button 40px height
└─────────────────────────┴──┘
Clear button: 40x40px click area
```

#### Implementation Pattern:

```typescript
// Base input component with size variants
interface InputProps {
  size?: 'sm' | 'md' | 'lg'
  // ... other props
}

// All inputs use this base, ensuring consistency
<Input size="md" type="text" />
<Select size="md" />
<DatePicker size="md" />
<Button size="md" />  // Matches input height

// Form row pattern
<div className="flex gap-2">
  <Input size="md" className="flex-1" />
  <Button size="md">Search</Button>
</div>
```

#### Accessibility Requirements:

```
□ Minimum touch target: 44x44px (mobile)
  → If input is 40px, add 2px top+bottom padding in container

□ Label associated with input:
  <label htmlFor="patient-name">Name</label>
  <input id="patient-name" />

□ Error messages linked:
  <input aria-describedby="name-error" aria-invalid="true" />
  <span id="name-error">Name is required</span>

□ Disabled state clearly visible
□ Focus state has visible outline
□ Placeholder text has sufficient contrast (4.5:1 minimum)
```

---

## 🔄 ISSUE #6: DASHBOARD LOADING STATES

### Problem:

Unclear what's happening during background tasks

### Required: Task-Aware Loading Strategy

#### Loading State Types:

```
1. PAGE LOAD (initial visit)
   → Full skeleton screen
   → Progress indicator in top bar (optional)
   → Duration: 0-2 seconds

2. TAB SWITCH
   → Instant tab highlight (0ms)
   → Tab content skeleton (if not cached)
   → Duration: 0-500ms

3. DATA REFRESH (pull-to-refresh, auto-refresh)
   → Subtle indicator (no full skeleton)
   → Small spinner in corner or pulse animation
   → Data remains visible during refresh
   → Duration: 0-1 second

4. ACTION PROCESSING (save, delete, create)
   → Button loading state (spinner + disabled)
   → Optional: Optimistic UI update
   → Duration: 0-2 seconds

5. BACKGROUND SYNC (offline sync, auto-save)
   → Non-intrusive indicator
   → Toast notification on complete
   → Duration: variable (can be minutes)

6. FILE UPLOAD/DOWNLOAD
   → Progress bar with percentage
   → Cancel option
   → Duration: variable (based on file size)

7. SEARCH/FILTER
   → Inline loading in results area
   → Keep previous results visible (dimmed)
   → Duration: 0-500ms
```

#### Dashboard Loader Architecture:

```typescript
// Global loading state context
interface LoadingState {
  isPageLoading: boolean      // Initial page load
  isRefreshing: boolean        // Background refresh
  isSyncing: boolean           // Offline sync
  activeRequests: number       // Concurrent API calls
  currentTask?: string         // Human-readable task name
}

// Usage pattern
function Dashboard() {
  const { data, isLoading, isRefetching } = useQuery(['dashboard'])

  // Initial load
  if (isLoading) {
    return <DashboardSkeleton />
  }

  // Background refresh (show data + indicator)
  return (
    <div>
      {isRefetching && <RefreshIndicator />}
      <DashboardContent data={data} />
    </div>
  )
}
```

#### Task-Compatible Loading Patterns:

```
TASK: Creating new appointment
┌────────────────────────────────────────┐
│ [Loading...] Creating appointment      │  ← Modal shows task
└────────────────────────────────────────┘
→ Button disabled + spinner
→ Form fields disabled
→ Close button (✕) disabled

TASK: Saving patient data
┌────────────────────────────────────────┐
│ Patient Form                            │
│ ...fields...                           │
│ [Saving...] [Cancel]                   │  ← Button state change
└────────────────────────────────────────┘
→ Save button shows spinner
→ Cancel remains enabled
→ Form fields remain enabled (can make more changes)

TASK: Generating report
┌────────────────────────────────────────┐
│ ⏳ Generating revenue report... 45%    │  ← Progress bar
│ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░                 │
│ [Cancel]                               │
└────────────────────────────────────────┘
→ Shows progress percentage
→ Allows cancellation
→ Estimated time remaining (optional)

TASK: Deleting patient (dangerous)
┌────────────────────────────────────────┐
│ Are you sure?                          │
│ This action cannot be undone.          │
│                                         │
│ [Cancel] [Deleting... ⏳]              │  ← Processing state
└────────────────────────────────────────┘
→ Delete button changes to "Deleting..."
→ Both buttons disabled during process
→ Cannot close modal during deletion
```

#### Loading Indicator Placement:

```
Component Level:
- Button: Spinner replaces text or appears next to text
- Table: Skeleton rows OR overlay spinner
- Card: Skeleton structure OR shimmer animation
- Form: Disabled state + button spinner
- Modal: Full modal skeleton OR content skeleton

Page Level:
- Top progress bar (YouTube/GitHub style)
- Skeleton layout (Facebook/LinkedIn style)
- Center spinner (only if page is mostly empty)

Global Level:
- Top-right corner indicator (Gmail style)
- Status bar at top (Slack style)
- Bottom toast notification (Vercel style)
```

#### Loading State Decision Tree:

```
Is this the first time loading this page?
├─ YES → Full skeleton screen
└─ NO → Is data already visible?
    ├─ YES → Subtle refresh indicator (keep data visible)
    └─ NO → Content area skeleton

Is this a user-triggered action?
├─ YES → Button loading state + optimistic update
└─ NO → Background indicator (non-blocking)

Is this a long-running task (>3 seconds)?
├─ YES → Progress bar + cancel option + time estimate
└─ NO → Simple spinner + disabled state

Can the task fail?
├─ YES → Error state + retry option
└─ NO → Success state + dismiss option
```

#### Loading Checklist:

```
For EACH async operation in your dashboard:

□ Is there immediate visual feedback (<16ms)?
  → Button press state, cursor change, etc.

□ Is there a loading indicator after 200ms?
  → Spinner, skeleton, progress bar

□ Does the indicator match the task scope?
  → Button task: Button spinner
  → Page task: Page skeleton
  → Global task: Top bar indicator

□ Is existing data kept visible during refresh?
  → Yes for background refresh
  → No for initial load

□ Can the user cancel long tasks?
  → File uploads: Yes
  → Report generation: Yes
  → Simple saves: No (too fast)

□ Is there error handling with retry?
  → Every async operation needs error state

□ Is there a success confirmation?
  → Critical actions: Modal or toast
  → Simple actions: Optimistic update only
```

---

## 🏗️ TECHNICAL ARCHITECTURE REQUIREMENTS

### File Structure (for Tab-Based Dashboard):

```
app/
└── dashboard/
    ├── layout.tsx                    # Shared layout (sidebar, header)
    ├── page.tsx                      # Main dashboard (tab container)
    │
    ├── _components/                  # Private components (not routes)
    │   ├── DashboardHeader.tsx
    │   ├── TabBar.tsx               # Tab navigation
    │   ├── TabContent.tsx           # Tab content renderer
    │   └── LoadingStates.tsx        # Centralized skeletons
    │
    ├── _tabs/                        # Tab content components
    │   ├── OverviewTab.tsx
    │   ├── AppointmentsTab.tsx
    │   ├── PatientsTab.tsx
    │   ├── PrescriptionsTab.tsx
    │   └── ReportsTab.tsx
    │
    ├── _skeletons/                   # Component-specific skeletons
    │   ├── OverviewSkeleton.tsx
    │   ├── AppointmentsSkeleton.tsx
    │   ├── PatientsSkeleton.tsx
    │   └── ReportsSkeleton.tsx
    │
    └── _hooks/                       # Dashboard-specific hooks
        ├── useDashboardData.ts
        ├── useAppointments.ts
        └── usePatients.ts
```

### Component Pattern (Tab Content):

```typescript
// _tabs/AppointmentsTab.tsx
'use client'
import { Suspense } from 'react'
import AppointmentsSkeleton from '../_skeletons/AppointmentsSkeleton'
import { useAppointments } from '../_hooks/useAppointments'

export default function AppointmentsTab() {
  return (
    <Suspense fallback={<AppointmentsSkeleton />}>
      <AppointmentsContent />
    </Suspense>
  )
}

function AppointmentsContent() {
  const { data, isLoading, error } = useAppointments()

  if (isLoading) return <AppointmentsSkeleton />
  if (error) return <ErrorState error={error} />
  if (!data?.length) return <EmptyState />

  return <AppointmentsList appointments={data} />
}
```

### Data Fetching Pattern:

```typescript
// _hooks/useAppointments.ts
import { useQuery } from '@tanstack/react-query';

export function useAppointments(date?: string) {
  return useQuery({
    queryKey: ['appointments', date],
    queryFn: () => fetchAppointments(date),
    staleTime: 30000, // Fresh for 30s
    cacheTime: 300000, // Keep in cache 5min
    refetchOnWindowFocus: true, // Refresh when tab becomes active
    retry: 3, // Retry failed requests
  });
}

// Prefetch for instant navigation
export function usePrefetchAppointment(id: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: ['appointment', id],
      queryFn: () => fetchAppointment(id),
    });
  };
}
```

### Performance Measurement:

```typescript
// Add performance monitoring
export function measureTabSwitch(tabId: string) {
  const start = performance.now();

  return () => {
    const duration = performance.now() - start;

    // Log to analytics
    analytics.track('tab_switch', {
      tab: tabId,
      duration,
      isFast: duration < 200, // Target: <200ms
    });

    // Warn if slow
    if (duration > 500) {
      console.warn(`Slow tab switch to ${tabId}: ${duration}ms`);
    }
  };
}

// Usage
const measure = measureTabSwitch('appointments');
// ... tab switch logic
measure(); // Records duration
```

---

## ✅ FINAL IMPLEMENTATION CHECKLIST

### Phase 1: Fix Tab Switching (Priority 1)

```
□ Consolidate tab routes into single page.tsx
□ Move tab content to _tabs/ directory as components
□ Implement client-side tab state with URL sync
□ Add tab-specific Suspense boundaries
□ Measure tab switch time (target <200ms)
□ Remove "Compiling..." messages
```

### Phase 2: Perfect Skeletons (Priority 2)

```
□ Create skeleton for each major component
□ Match skeleton dimensions to loaded content exactly
□ Test layout shift (CLS < 0.1 in Lighthouse)
□ Add skeleton for all loading states (initial, refresh, filter)
□ Implement progressive loading (header → content → actions)
```

### Phase 3: API Performance (Priority 3)

```
□ Install @tanstack/react-query
□ Configure caching strategy (staleTime, cacheTime)
□ Convert all data fetching to useQuery hooks
□ Implement optimistic updates for mutations
□ Add request deduplication
□ Measure API response times (target P95 <300ms)
□ Add prefetching on hover for detail pages
```

### Phase 4: Interaction Patterns (Priority 4)

```
□ Audit all buttons - convert navigation to <Link>
□ Ensure all buttons have loading states
□ Add aria-labels to icon buttons
□ Test keyboard navigation (Tab, Enter, Esc)
□ Verify button types (primary, secondary, destructive)
```

### Phase 5: Input Consistency (Priority 5)

```
□ Define standard input heights (sm: 32px, md: 40px, lg: 48px)
□ Audit all input types for height consistency
□ Ensure buttons match input heights in same row
□ Test form layouts on mobile (min 44px touch target)
```

### Phase 6: Loading States (Priority 6)

```
□ Define loading patterns for each task type
□ Implement task-aware loading indicators
□ Add progress bars for long tasks (>3s)
□ Ensure data remains visible during background refresh
□ Add error states with retry options
```

---

## 🎯 SUCCESS CRITERIA

Your dashboard is "100% perfect" when:

✅ Tab switches are instant (<50ms perceived, <200ms measured)
✅ No "Compiling..." messages on tab clicks
✅ Skeletons match final layout pixel-perfectly (CLS < 0.1)
✅ API responses feel instant (<100ms with cache, <300ms without)
✅ Every button has appropriate loading state
✅ All inputs have consistent heights
✅ Navigation uses <Link>, actions use <button>
✅ Long tasks show progress indication
✅ All interactions have immediate visual feedback
✅ Keyboard navigation works for all functions
✅ Error states provide clear recovery paths
✅ Lighthouse Performance score > 90 (mobile)

---

## 📊 MEASUREMENT TOOLS

```
Chrome DevTools:
- Performance tab → Record tab switch
- Network tab → Check API parallelization
- Coverage tab → Check unused code
- Lighthouse → Performance audit

React DevTools:
- Profiler → Measure component render time
- Components → Check unnecessary re-renders

TanStack Query DevTools:
- Cache inspection
- Request deduplication verification
- Stale/fresh state monitoring

Custom Metrics:
- Add performance.mark() around critical operations
- Log to analytics (Vercel Analytics, Mixpanel, etc.)
- Set up alerts for slow operations (>500ms)
```

---

**Focus:** This audit is purely technical - implementation patterns, architecture decisions, and interaction logic. No styling/theming recommendations included.
