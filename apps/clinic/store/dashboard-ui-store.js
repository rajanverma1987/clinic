/**
 * Zustand store for dashboard UI state: tab filters, sort preferences, scroll keys.
 * Persisted to sessionStorage for tab-specific persistence (no reload).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';

const SESSION_KEY = 'clinic_dashboard_ui';

function sessionStorageAdapter(config) {
  return createJSONStorage(() => ({
    getItem: (name) => {
      if (typeof window === 'undefined') return null;
      try {
        return sessionStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      if (typeof window === 'undefined') return;
      try {
        sessionStorage.setItem(name, value);
      } catch (_) {}
    },
    removeItem: (name) => {
      if (typeof window === 'undefined') return;
      try {
        sessionStorage.removeItem(name);
      } catch (_) {}
    },
  }))(config);
}

export const useDashboardUIStore = create(
  persist(
    (set) => ({
      // Tab-specific filters and sort (e.g. appointments, patients)
      filters: {},
      sortBy: {},
      sortOrder: {},
      // Scroll position keys (route key -> scrollTop)
      scrollPositions: {},
      // Last selected tab per section (e.g. 'overview' | 'reports')
      activeTabs: {},

      setFilter: (scope, key, value) =>
        set(
          produce((state) => {
            if (!state.filters[scope]) state.filters[scope] = {};
            state.filters[scope][key] = value;
          })
        ),

      setSort: (scope, sortByVal, order = 'asc') =>
        set(
          produce((state) => {
            state.sortBy[scope] = sortByVal;
            state.sortOrder[scope] = order;
          })
        ),

      setScrollPosition: (routeKey, scrollTop) =>
        set(
          produce((state) => {
            state.scrollPositions[routeKey] = scrollTop;
          })
        ),

      setActiveTab: (section, tab) =>
        set(
          produce((state) => {
            state.activeTabs[section] = tab;
          })
        ),

      resetScope: (scope) =>
        set(
          produce((state) => {
            if (state.filters[scope]) delete state.filters[scope];
            if (state.sortBy[scope]) delete state.sortBy[scope];
            if (state.sortOrder[scope]) delete state.sortOrder[scope];
          })
        ),
    }),
    {
      name: SESSION_KEY,
      storage: sessionStorageAdapter,
      partialize: (state) => ({
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        activeTabs: state.activeTabs,
        scrollPositions: state.scrollPositions,
      }),
    }
  )
);
