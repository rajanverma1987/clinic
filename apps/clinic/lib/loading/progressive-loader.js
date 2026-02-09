/**
 * Progressive loading strategy per CursorMD/CLAUDE-AI.md.
 * Maps route paths to phased loading config (skeleton type per phase).
 */

import { LOADING_PRIORITIES, SKELETON_TYPES } from './loading-states.js';

export const PROGRESSIVE_LOADING_MAP = {
  '/dashboard': {
    phases: [
      {
        phase: 1,
        priority: LOADING_PRIORITIES.CRITICAL,
        components: ['UserAuth', 'TenantContext', 'PermissionsCheck'],
        timeout: 1000,
        fallback: 'redirect-login',
      },
      {
        phase: 2,
        priority: LOADING_PRIORITIES.HIGH,
        components: ['DashboardStats', 'QuickActions', 'TodayAppointments'],
        timeout: 2000,
        skeleton: SKELETON_TYPES.DASHBOARD,
      },
      {
        phase: 3,
        priority: LOADING_PRIORITIES.MEDIUM,
        components: ['RevenueChart', 'PatientSummary', 'QueueWidget'],
        timeout: 3000,
        skeleton: SKELETON_TYPES.CHART,
      },
      {
        phase: 4,
        priority: LOADING_PRIORITIES.LOW,
        components: ['InventoryAlerts', 'RecentActivity'],
        timeout: 5000,
        skeleton: SKELETON_TYPES.CARD,
      },
    ],
    preload: ['critical-fonts', 'icons', 'primary-css'],
    deferrable: ['analytics-script', 'chat-widget'],
  },
  '/appointments': {
    phases: [
      {
        phase: 1,
        priority: LOADING_PRIORITIES.CRITICAL,
        components: ['AppointmentFilters', 'CalendarHeader'],
        timeout: 1000,
      },
      {
        phase: 2,
        priority: LOADING_PRIORITIES.HIGH,
        components: ['AppointmentCalendar', 'TodayList'],
        timeout: 2500,
        skeleton: SKELETON_TYPES.CALENDAR,
      },
      {
        phase: 3,
        priority: LOADING_PRIORITIES.MEDIUM,
        components: ['UpcomingList', 'StatusSummary'],
        timeout: 4000,
        skeleton: SKELETON_TYPES.LIST,
      },
    ],
  },
  '/patients': {
    phases: [
      {
        phase: 1,
        priority: LOADING_PRIORITIES.CRITICAL,
        components: ['SearchBar', 'FilterPanel'],
        timeout: 1000,
      },
      {
        phase: 2,
        priority: LOADING_PRIORITIES.HIGH,
        components: ['PatientTable'],
        timeout: 2500,
        skeleton: SKELETON_TYPES.TABLE,
        virtualScroll: true,
        initialRows: 50,
      },
    ],
  },
  '/patients/:id': {
    phases: [
      {
        phase: 1,
        priority: LOADING_PRIORITIES.CRITICAL,
        components: ['PatientHeader', 'TabNavigation'],
        timeout: 1500,
        skeleton: SKELETON_TYPES.DETAIL,
      },
      {
        phase: 2,
        priority: LOADING_PRIORITIES.HIGH,
        components: ['ActiveTabContent'],
        timeout: 2000,
        skeleton: 'tab-specific',
      },
      {
        phase: 3,
        priority: LOADING_PRIORITIES.MEDIUM,
        components: ['RelatedData', 'Timeline'],
        timeout: 3500,
        lazy: true,
      },
    ],
  },
  '/queue': {
    phases: [
      {
        phase: 1,
        priority: LOADING_PRIORITIES.HIGH,
        components: ['QueueBoard'],
        timeout: 1500,
        skeleton: SKELETON_TYPES.KANBAN,
        realtime: true,
      },
    ],
  },
  '/reports': {
    phases: [
      {
        phase: 1,
        priority: LOADING_PRIORITIES.CRITICAL,
        components: ['DateRangePicker', 'ReportFilters'],
        timeout: 1000,
      },
      {
        phase: 2,
        priority: LOADING_PRIORITIES.MEDIUM,
        components: ['ReportCharts', 'SummaryCards'],
        timeout: 3000,
        skeleton: SKELETON_TYPES.CHART,
        cacheable: true,
        cacheKey: 'date-range',
      },
      {
        phase: 3,
        priority: LOADING_PRIORITIES.LOW,
        components: ['DetailedTable', 'ExportButtons'],
        timeout: 5000,
        skeleton: SKELETON_TYPES.TABLE,
      },
    ],
  },
  '/inventory': {
    phases: [
      {
        phase: 1,
        priority: LOADING_PRIORITIES.HIGH,
        components: ['InventoryTabs', 'SearchFilter'],
        timeout: 1000,
      },
      {
        phase: 2,
        priority: LOADING_PRIORITIES.HIGH,
        components: ['ItemsTable', 'LowStockAlerts'],
        timeout: 2500,
        skeleton: SKELETON_TYPES.TABLE,
      },
      {
        phase: 3,
        priority: LOADING_PRIORITIES.MEDIUM,
        components: ['ExpiryAlerts', 'TransactionHistory'],
        timeout: 4000,
      },
    ],
  },
  '/telemedicine/:id': {
    phases: [
      {
        phase: 1,
        priority: LOADING_PRIORITIES.CRITICAL,
        components: ['MediaDeviceCheck', 'ConnectionStatus'],
        timeout: 2000,
        fallback: 'device-error',
      },
      {
        phase: 2,
        priority: LOADING_PRIORITIES.HIGH,
        components: ['VideoStream', 'ChatPanel'],
        timeout: 5000,
        skeleton: 'video-placeholder',
      },
    ],
  },
  '/admin': {
    phases: [
      {
        phase: 1,
        priority: LOADING_PRIORITIES.CRITICAL,
        components: ['AdminStats', 'PlatformHealth'],
        timeout: 2000,
        skeleton: SKELETON_TYPES.DASHBOARD,
      },
      {
        phase: 2,
        priority: LOADING_PRIORITIES.MEDIUM,
        components: ['TenantList', 'RevenueChart'],
        timeout: 3500,
      },
    ],
  },
};

/**
 * Resolve config for a path (supports dynamic segments, e.g. /patients/123 -> /patients).
 */
export function getProgressiveLoadingConfig(pathname) {
  if (!pathname) return null;
  const normalized = pathname.split('?')[0].replace(/\/$/, '') || '/';
  if (PROGRESSIVE_LOADING_MAP[normalized]) return PROGRESSIVE_LOADING_MAP[normalized];
  const segments = normalized.split('/').filter(Boolean);
  if (segments[0] === 'patients' && segments.length >= 2)
    return PROGRESSIVE_LOADING_MAP['/patients/:id'] ?? PROGRESSIVE_LOADING_MAP['/patients'] ?? null;
  if (segments[0] === 'patients') return PROGRESSIVE_LOADING_MAP['/patients'] ?? null;
  if (segments[0] === 'appointments') return PROGRESSIVE_LOADING_MAP['/appointments'] ?? null;
  if (segments[0] === 'inventory') return PROGRESSIVE_LOADING_MAP['/inventory'] ?? null;
  if (segments[0] === 'admin') return PROGRESSIVE_LOADING_MAP['/admin'] ?? null;
  if (segments[0] === 'queue') return PROGRESSIVE_LOADING_MAP['/queue'] ?? null;
  if (segments[0] === 'reports') return PROGRESSIVE_LOADING_MAP['/reports'] ?? null;
  if (segments[0] === 'telemedicine' && segments.length >= 2)
    return PROGRESSIVE_LOADING_MAP['/telemedicine/:id'] ?? null;
  return null;
}
