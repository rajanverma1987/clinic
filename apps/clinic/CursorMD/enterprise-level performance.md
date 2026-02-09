Transform my existing clinic dashboard into an enterprise-grade real-time system with these requirements:

1. REAL-TIME UPDATE ARCHITECTURE:

- Implement WebSocket connection for live updates (appointments, patient status changes)
- Use Server-Sent Events (SSE) as fallback
- Add optimistic UI updates: show changes immediately, rollback on error
- Implement event-driven cache invalidation
- Add heartbeat mechanism to detect connection loss and auto-reconnect

2. ADVANCED CACHING LAYERS:

- Level 1: React Query/SWR with staleTime and cacheTime configured per data type
  - Critical data (today's appointments): staleTime 30s, refetch on focus
  - Static data (doctor list, departments): staleTime 1 hour
  - Analytics/stats: staleTime 5 minutes
- Level 2: IndexedDB for offline-first capability (store last 7 days data)
- Level 3: Service Worker for background sync
- Implement cache versioning to handle schema changes
- Add cache warming on login (preload commonly accessed data)

3. TAB/ROUTE PERSISTENCE (NO RELOAD):

- Keep component state alive when switching tabs using React Router with proper state management
- Use keepalive wrapper for expensive components
- Implement virtual scrolling for long lists (react-window)
- Preserve scroll position and form state across tab switches
- Cache tab-specific filters and sort preferences in sessionStorage

4. ZERO-FLICKER UPDATES:

- Use React Transition API for smooth updates
- Implement double-buffering: prepare new data off-screen, swap atomically
- Add CSS transitions for data changes (highlight updated rows for 2s)
- Use layout animations (Framer Motion) for list reordering
- Implement skeleton screens that morph into real content

5. SMART BACKGROUND REFRESH:

- Poll critical endpoints every 30s when tab is active
- Use Page Visibility API: pause polling when tab inactive, resume on focus
- Implement exponential backoff for failed requests
- Add "Updates available" notification instead of auto-applying all changes
- Batch multiple updates to prevent rapid re-renders

6. STATE MANAGEMENT PATTERN:

- Use Zustand/Jotai for global state with persistence middleware
- Implement normalized data structure (avoid nested objects)
- Add selectors with shallow equality checks
- Use Immer for immutable updates
- Separate server state (React Query) from UI state (Zustand)

7. WEBSOCKET EVENT HANDLING:

```javascript
// Example structure needed:
websocket.on('appointment.created', (data) => {
  queryClient.setQueryData(['appointments'], (old) => {
    // Merge new data without full refetch
  });
  showToast('New appointment added');
});

websocket.on('patient.updated', (data) => {
  // Invalidate affected queries only
  queryClient.invalidateQueries(['patient', data.id]);
});
```

8. PERFORMANCE OPTIMIZATIONS:

- Implement request deduplication (multiple components requesting same data)
- Add request batching for GraphQL or batch API endpoints
- Use React.memo strategically on list items and heavy components
- Implement code splitting with React.lazy for each dashboard section
- Add prefetching on hover for quick navigation
- Use useTransition for non-urgent updates

9. ERROR RECOVERY & RESILIENCE:

- Show stale data with warning banner during connection issues
- Implement retry logic with exponential backoff (max 3 retries)
- Add offline mode indicator
- Queue mutations when offline, sync when back online
- Log failed operations to retry later

10. MONITORING & DEBUGGING:

- Add performance markers for cache hits/misses
- Track WebSocket connection quality
- Log state transitions in dev mode
- Add React DevTools Profiler integration
- Implement custom hook: useQueryStats() to show cache efficiency

11. CONFIGURATION:

```javascript
// Cache strategy config needed:
const CACHE_CONFIG = {
  appointments: { staleTime: 30000, cacheTime: 300000, refetchOnFocus: true },
  patients: { staleTime: 60000, cacheTime: 600000, refetchOnFocus: false },
  analytics: { staleTime: 300000, cacheTime: 3600000, refetchOnMount: false },
  doctors: { staleTime: 3600000, cacheTime: Infinity },
};
```

12. SPECIFIC DASHBOARD BEHAVIORS:

- Today's appointments: WebSocket updates + 30s polling backup
- Patient list: Infinite scroll with windowing, cache paginated results
- Stats/metrics: Update every 5 minutes, animate number changes
- Notifications: Real-time via WebSocket, badge count updates
- Search: Debounced 300ms, cache recent searches in localStorage

Make it feel like Google Analytics, Stripe Dashboard, or Vercel Dashboard - instant navigation, live updates, zero loading spinners on tab switches, smooth transitions.

Include proper jsx types, comprehensive error boundaries, and production-ready code.
