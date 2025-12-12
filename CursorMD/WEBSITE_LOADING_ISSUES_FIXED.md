# Website Loading Issues - Root Causes & Fixes

## Problem Summary

The website was not loading properly and this issue was happening repeatedly. After investigation, several root causes were identified and fixed.

## Root Causes Identified

### 1. **Layout Component Sidebar Width Calculation**

**Issue**: The `calc()` CSS function was using template literals with `sidebarWidth` state, which could cause rendering issues during initial mount before the component was fully hydrated.

**Fix**: Added a `mounted` state check to ensure proper default values are used before the component is fully mounted:

```javascript
marginLeft: mounted ? `calc(${sidebarWidth} + 10px)` : 'calc(14rem + 10px)',
maxWidth: mounted ? `calc(100vw - ${sidebarWidth} - 10px)` : 'calc(100vw - 14rem - 10px)',
```

### 2. **Dashboard useEffect Infinite Loop Risk**

**Issue**: The `useEffect` in `dashboard/page.jsx` had function dependencies (`fetchStats`, `fetchChartData`, `fetchDashboardLists`) that, while memoized with `useCallback`, could still cause unnecessary re-renders if the dependency array wasn't carefully managed.

**Fix**: Added a `useRef` to track if data has already been fetched, preventing duplicate API calls:

```javascript
const hasFetchedRef = useRef(false);
// Only fetch once when user is available
if (user && !hasFetchedRef.current) {
  hasFetchedRef.current = true;
  fetchStats();
  fetchChartData();
  fetchDashboardLists();
}
```

### 3. **Critical Alerts Race Condition**

**Issue**: In `useDashboardLists.js`, the `criticalAlerts` state was being updated multiple times using `setCriticalAlerts((prev) => [...prev, ...])`, which could cause race conditions and inconsistent state updates.

**Fix**: Changed to build the alerts array first, then set it once at the end:

```javascript
const alerts = []; // Build alerts array
// ... collect all alerts ...
setCriticalAlerts(alerts); // Set all at once at the end
```

### 4. **Home Page Redirect for Authenticated Users**

**Issue**: Authenticated users visiting the home page (`/`) would see the marketing header instead of being redirected to the dashboard.

**Fix**: Added automatic redirect for authenticated users:

```javascript
useEffect(() => {
  if (!authLoading && user) {
    router.push('/dashboard');
  }
}, [authLoading, user, router]);
```

## Files Modified

1. **`components/layout/Layout.jsx`**

   - Added `mounted` state check for sidebar width calculation
   - Ensures proper default values during initial render

2. **`app/dashboard/page.jsx`**

   - Added `useRef` to prevent duplicate data fetching
   - Improved `useEffect` dependency management

3. **`app/dashboard/hooks/useDashboardLists.js`**

   - Fixed race condition in `criticalAlerts` state updates
   - Changed from multiple state updates to single batch update

4. **`app/page.jsx`**
   - Added redirect for authenticated users to dashboard
   - Added loading state handling

## Prevention Measures

1. **Always use refs for tracking fetch state** - Prevents duplicate API calls
2. **Batch state updates** - Collect data first, then update state once
3. **Handle hydration properly** - Use `mounted` state for client-only calculations
4. **Manage useEffect dependencies carefully** - Avoid including functions that change frequently

## Testing Checklist

- [x] Dashboard loads without infinite loops
- [x] Layout calculates sidebar width correctly on initial load
- [x] Critical alerts display correctly without duplicates
- [x] Authenticated users are redirected from home page
- [x] No console errors during page load
- [x] No unnecessary API calls on re-renders

## Expected Behavior After Fixes

1. **Initial Load**: Page should load smoothly with proper sidebar positioning
2. **Data Fetching**: Dashboard data should fetch once when user is authenticated
3. **State Updates**: Critical alerts should update correctly without race conditions
4. **Navigation**: Authenticated users should be automatically redirected to dashboard

## Notes

- The fixes maintain backward compatibility
- No breaking changes to existing functionality
- Performance improvements through reduced unnecessary re-renders
- Better error handling and state management
