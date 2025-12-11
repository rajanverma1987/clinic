# Hydration Error Fixes

## Issue

React hydration error: "Hydration failed because the initial UI does not match what was rendered on the server."

## Root Causes

### 1. **I18nContext** - localStorage access during initial render

- **Problem**: Component initialized with `useState('en')` but then read from `localStorage` in `useEffect`, causing server (always 'en') vs client (could be different locale) mismatch.
- **Fix**: Added `mounted` state to prevent localStorage access until after hydration.

### 2. **Layout Component** - Sidebar width from localStorage

- **Problem**: `sidebarWidth` initialized to `'14rem'` but updated from `localStorage` in `useEffect`, causing mismatch.
- **Fix**: Added `mounted` state to delay localStorage read until after hydration.

### 3. **Sidebar Component** - Collapsed state from localStorage

- **Problem**: `getInitialCollapsedState()` checked `typeof window !== 'undefined'` which returns `false` on server but could return `true` on client, causing mismatch.
- **Fix**: Changed to always initialize as `false` (server default) and update from localStorage only after mount.

### 4. **Next.js Config** - Deprecated images.domains

- **Problem**: Using deprecated `images.domains` configuration.
- **Fix**: Removed `domains` property, kept only `remotePatterns` (modern approach).

## Changes Made

### `/contexts/I18nContext.jsx`

- Added `mounted` state
- Wrapped localStorage access in `useEffect` that checks `mounted` first
- Ensures server and client render the same initial state ('en')

### `/components/layout/Layout.jsx`

- Added `mounted` state
- Delayed sidebar width update from localStorage until after mount
- Prevents hydration mismatch for sidebar width

### `/components/layout/Sidebar.jsx`

- Removed `getInitialCollapsedState()` function
- Changed initial state to always be `false` (matches server)
- Added `useEffect` to sync with localStorage after mount

### `/next.config.js`

- Removed deprecated `domains: ['images.unsplash.com', 'via.placeholder.com']`
- Kept only `remotePatterns` configuration

## Pattern Used

The fix follows the standard React hydration-safe pattern:

```javascript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
  // Now safe to access localStorage, window, etc.
}, []);

useEffect(() => {
  if (!mounted) return;
  // Client-only logic here
}, [mounted]);
```

This ensures:

1. Server renders with default state
2. Client initially renders with same default state (no mismatch)
3. After hydration, `mounted` becomes `true` and client-specific values are applied

## Testing

After these fixes, the hydration error should be resolved. The application will:

- Render consistently on server and client initially
- Apply localStorage values after hydration completes
- Avoid any visual flash or mismatch errors

## Notes

- All components using `localStorage` should follow this pattern
- Date/time values should also be handled carefully if used in initial state
- Browser-only APIs (`window`, `document`, `localStorage`, `navigator`) should only be accessed after mount
