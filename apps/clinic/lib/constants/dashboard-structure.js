import { WEBSOCKET_TO_CACHE_EVENT_MAP } from '@/lib/cache/websocket-cache-events';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';

/** Manager cannot access these paths (nav filter). Kept local so getNavItemsForRole never depends on route-security. */
const MANAGER_FORBIDDEN_PATHS_NAV = [
  '/staff',
  '/settings',
  '/reports',
  '/prescriptions/new',
  '/inventory/lots',
];

function isManagerPathForbiddenNav(path) {
  if (!path) return false;
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/';
  return MANAGER_FORBIDDEN_PATHS_NAV.some(
    (p) => normalized === p || normalized.startsWith(p + '/'),
  );
}

// ─── CURRENT STATUS ────────────────────────────────────────────────────────
/**
 * Status of this dashboard-structure file relative to codebase and CursorMD/New.
 * Update when routes, roles, or admin structure change. Used for alignment checks and onboarding.
 */
export const DASHBOARD_STRUCTURE_STATUS = {
  asOf: '2025-02-09',
  sourceOfTruth:
    'CursorMD/New (clinic-complete-specification.md, clinic-dashboard-architecture.mermaid, database-schema.mermaid, realtime-caching-strategy.md)',
  scope: 'clinic_only',
  roles: [
    'super_admin',
    'doctor',
    'clinic_admin',
    'admin',
    'manager',
    'nurse',
    'receptionist',
    'accountant',
    'pharmacist',
  ],
  clinicSidebarRoutes: [
    '/dashboard',
    '/appointments',
    '/queue',
    '/patients',
    '/staff',
    '/prescriptions',
    '/invoices',
    '/inventory',
    '/reports',
    '/telemedicine',
    '/settings',
    '/subscription',
  ],
  adminTopLevel: [
    '/admin',
    '/admin/clients',
    '/admin/subscriptions',
    '/admin/users',
    '/admin/patients',
    '/admin/appointments',
    '/admin/doctors',
    '/admin/content',
    '/admin/financial',
    '/admin/reports',
    '/admin/analytics',
    '/admin/activity-logs',
    '/admin/settings',
    '/admin/reviews',
    '/admin/create-admin',
  ],
  managerRestrictionsNav: MANAGER_FORBIDDEN_PATHS_NAV,
  notes: [
    'Nav and route definitions drive getNavItemsForRole, breadcrumbs, and route security.',
    'Admin child routes: ADMIN_SETTINGS_CHILDREN, ADMIN_FINANCIAL_CHILDREN, ADMIN_CONTENT_CHILDREN, ADMIN_REPORTS_CHILDREN, ADMIN_REVIEWS_CHILDREN.',
    'Run getProjectStructureSummary() for counts (totalPages, adminSubrouteCount, etc.).',
  ],
};

// ─── PROJECT (full details) ────────────────────────────────────────────────
/** High-level project meta: name, scope, stack, data layer, auth, i18n, real-time. */
export const PROJECT_META = {
  name: 'Clinic Management Dashboard',
  description:
    'Multi-tenant clinic management: appointments, patients, prescriptions, billing, inventory, reports, telemedicine. Clinic staff only (no public/patient self-service in scope).',
  scope: 'clinic_only',
  stack: 'Next.js (App Router), React, MongoDB/Mongoose, Socket.IO, WebRTC',
  dataLayer:
    'MongoDB with Mongoose; all collections include tenantId; timestamps UTC; indexes on appointments, billing, inventory.',
  auth: 'JWT access + refresh; optional 2FA; OAuth (Google); magic link; role-based (super_admin, doctor, clinic_admin, admin, manager, nurse, receptionist, accountant, pharmacist). Clinic-only; no patient role in scope.',
  i18n: 'Context-based i18n; locale/currency/timezone from tenantSettings; UI strings via labelKey in lib/i18n/locales (en, ar, es, fr).',
  realtime:
    'Socket.IO for live updates; Redis pub/sub for cache invalidation; see realtime-caching-strategy.md.',
  roles: [
    'super_admin',
    'doctor',
    'clinic_admin',
    'admin',
    'manager',
    'nurse',
    'receptionist',
    'accountant',
    'pharmacist',
  ],
  compliance:
    'HIPAA/GDPR-aware; PHI encrypted; audit logs; consent tracking; no PHI in logs/URLs/notifications.',
};

/** Subscription/feature flags that gate certain routes (e.g. nav visibility). Keys match tenant plan features. */
export const FEATURES = {
  APPOINTMENT_SCHEDULING: 'Appointment Scheduling',
  QUEUE_MANAGEMENT: 'Queue Management',
  PATIENT_MANAGEMENT: 'Patient Management',
  PRESCRIPTIONS_MANAGEMENT: 'Prescriptions Management',
  INVOICE_BILLING: 'Invoice & Billing',
  INVENTORY_MANAGEMENT: 'Inventory Management',
  REPORTS_ANALYTICS: 'Reports & Analytics',
  MULTI_LOCATION: 'Multi-Location Support',
  API_ACCESS: 'API Access',
  CUSTOM_BRANDING: 'Custom Branding',
  WHITE_LABEL: 'White Label Solution',
};

/** Human-readable description per role. Aligns with CursorMD/New permission matrix. */
export const ROLE_DESCRIPTIONS = {
  super_admin:
    'Platform owner. Full access to /admin: all clinics, subscriptions, users, financial, content, settings, activity logs. No tenantId scope.',
  doctor:
    'Clinic owner/primary. Full clinic access; can create Admin/Manager; manage staff, settings, billing config. Access gated by subscription features.',
  clinic_admin:
    'Same as Admin. Full clinic access except cannot assign Admin/Manager; no billing config. Alias: admin in permissions.',
  admin:
    'Full clinic access within tenant. Cannot create Admin/Manager. Settings read; limited audit. Subscription features apply.',
  manager:
    'Limited clinic access. View-only reports; add/edit patients; book/cancel appointments; create invoices (no pricing); no medical records, no inventory manage, no staff, no settings.',
  nurse:
    'Clinical support. Patients, appointments, prescriptions (read), lab orders/results, clinical notes, inventory read, queue read/update, telemedicine read.',
  receptionist:
    'Front desk. Patients create/read/update; appointments create/read/update/cancel; invoices/payments; queue create/read/update; prescriptions/inventory read.',
  accountant:
    'Financial. Invoices/payments full; reports read/export; patients/appointments read; no clinical, no telemedicine.',
  pharmacist: 'Prescriptions dispense; inventory create/read/update; patients/appointments read.',
};

/** Section meanings for ALL_PAGES and nav grouping. */
export const SECTION_DESCRIPTIONS = {
  auth: 'Login, forgot/reset password, change password. No public signup; clinics provisioned by admin/sales.',
  marketing: 'Landing, pricing, blog, legal, privacy, terms. Public.',
  support: 'Support hub and contact. Authenticated clinic users.',
  clinic:
    'Main clinic dashboard and modules: dashboard, appointments, queue, patients, staff, prescriptions, invoices, inventory, reports, telemedicine, settings, subscription.',
  doctor:
    'Doctor-area pages: profile, schedule, earnings, reviews, analytics, messages, register, leaves. Appointments via /appointments; patient detail via /patients/:id with role-based tabs.',
  admin:
    'Super Admin only. /admin dashboard, clients, subscriptions, users, patients, appointments, doctors, content, financial, reports, analytics, activity-logs, settings, reviews; plus all child routes.',
};

// ─── ROLES (canonical) ─────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  DOCTOR: 'doctor',
  CLINIC_ADMIN: 'clinic_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  ACCOUNTANT: 'accountant',
  PHARMACIST: 'pharmacist',
};

// ─── MAIN ROUTES (sidebar / top-level nav) ─────────────────────────────────
/** Paths for clinic sidebar. requiredFeature must match tenant plan feature name (use FEATURES.*). Manager has no Settings READ. */
export const ROUTES = [
  {
    path: '/dashboard',
    labelKey: 'dashboard.title',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.APPOINTMENT, action: ACTIONS.READ },
    requiredRoles: [
      'doctor',
      'clinic_admin',
      'admin',
      'manager',
      'nurse',
      'receptionist',
      'accountant',
      'pharmacist',
    ],
  },
  {
    path: '/appointments',
    labelKey: 'appointments.title',
    requiredFeature: FEATURES.APPOINTMENT_SCHEDULING,
    requiredPermission: { resource: RESOURCES.APPOINTMENT, action: ACTIONS.READ },
    requiredRoles: [
      'doctor',
      'clinic_admin',
      'admin',
      'manager',
      'nurse',
      'receptionist',
      'accountant',
    ],
  },
  {
    path: '/queue',
    labelKey: 'queue.title',
    requiredFeature: FEATURES.QUEUE_MANAGEMENT,
    requiredPermission: { resource: RESOURCES.QUEUE, action: ACTIONS.READ },
    requiredRoles: ['doctor', 'clinic_admin', 'admin', 'manager', 'nurse', 'receptionist'],
  },
  {
    path: '/patients',
    labelKey: 'patients.title',
    requiredFeature: FEATURES.PATIENT_MANAGEMENT,
    requiredPermission: { resource: RESOURCES.PATIENT, action: ACTIONS.READ },
    requiredRoles: [
      'doctor',
      'clinic_admin',
      'admin',
      'manager',
      'nurse',
      'receptionist',
      'accountant',
    ],
  },
  {
    path: '/staff',
    labelKey: 'staff.title',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.USER, action: ACTIONS.READ },
    requiredRoles: ['doctor', 'clinic_admin'],
  },
  {
    path: '/prescriptions',
    labelKey: 'prescriptions.title',
    requiredFeature: FEATURES.PRESCRIPTIONS_MANAGEMENT,
    requiredPermission: { resource: RESOURCES.PRESCRIPTION, action: ACTIONS.READ },
    requiredRoles: [
      'doctor',
      'clinic_admin',
      'admin',
      'nurse',
      'receptionist',
      'pharmacist',
      'manager',
    ],
  },
  {
    path: '/invoices',
    labelKey: 'invoices.title',
    requiredFeature: FEATURES.INVOICE_BILLING,
    requiredPermission: { resource: RESOURCES.INVOICE, action: ACTIONS.READ },
    requiredRoles: ['doctor', 'clinic_admin', 'admin', 'accountant', 'receptionist', 'manager'],
  },
  {
    path: '/inventory',
    labelKey: 'inventory.title',
    requiredFeature: FEATURES.INVENTORY_MANAGEMENT,
    requiredPermission: { resource: RESOURCES.INVENTORY, action: ACTIONS.READ },
    requiredRoles: [
      'doctor',
      'clinic_admin',
      'admin',
      'nurse',
      'receptionist',
      'pharmacist',
      'manager',
    ],
  },
  {
    path: '/reports',
    labelKey: 'reports.title',
    requiredFeature: FEATURES.REPORTS_ANALYTICS,
    requiredPermission: { resource: RESOURCES.REPORT, action: ACTIONS.READ },
    requiredRoles: ['doctor', 'clinic_admin', 'admin', 'accountant', 'nurse', 'receptionist'],
  },
  {
    path: '/telemedicine',
    labelKey: 'telemedicine.title',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.TELEMEDICINE, action: ACTIONS.READ },
    requiredRoles: ['doctor', 'clinic_admin', 'admin', 'nurse', 'receptionist'],
  },
  {
    path: '/settings',
    labelKey: 'settings.title',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.SETTINGS, action: ACTIONS.READ },
    requiredRoles: ['doctor', 'clinic_admin', 'admin'],
  },
];

/** Doctor-only nav items (shown after Dashboard for role doctor). */
export const DOCTOR_ROUTES = [
  {
    path: '/doctors/profile',
    labelKey: 'doctors.profile',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.DOCTOR, action: ACTIONS.READ },
    requiredRoles: ['doctor'],
  },
  {
    path: '/doctors/schedule',
    labelKey: 'doctors.schedule',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.APPOINTMENT, action: ACTIONS.READ },
    requiredRoles: ['doctor'],
  },
  {
    path: '/doctors/earnings',
    labelKey: 'doctors.earnings',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.PAYMENT, action: ACTIONS.READ },
    requiredRoles: ['doctor'],
  },
  {
    path: '/doctors/reviews',
    labelKey: 'doctors.reviews',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.DOCTOR, action: ACTIONS.READ },
    requiredRoles: ['doctor'],
  },
];

/** Super Admin only: /admin section. Explicit permission per route for audit/CLAUDE-AI. */
export const ADMIN_ROUTES = [
  {
    path: '/admin',
    labelKey: 'admin.dashboard',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.REPORT, action: ACTIONS.READ },
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/clients',
    labelKey: 'admin.clients',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.SUBSCRIPTION, action: ACTIONS.READ },
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/subscriptions',
    labelKey: 'admin.subscriptions',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.SUBSCRIPTION, action: ACTIONS.MANAGE },
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/users',
    labelKey: 'admin.allUsers',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.USER, action: ACTIONS.MANAGE },
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/patients',
    labelKey: 'admin.patients',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.PATIENT, action: ACTIONS.READ },
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/appointments',
    labelKey: 'admin.appointments',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.APPOINTMENT, action: ACTIONS.READ },
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/doctors',
    labelKey: 'admin.doctors',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.DOCTOR, action: ACTIONS.READ },
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/create-admin',
    labelKey: 'admin.createAdmin',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.USER, action: ACTIONS.CREATE },
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/content',
    labelKey: 'admin.content',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.SETTINGS, action: ACTIONS.READ },
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/financial',
    labelKey: 'admin.financial',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.PAYMENT, action: ACTIONS.READ },
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/reports',
    labelKey: 'admin.reports',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.REPORT, action: ACTIONS.READ },
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/analytics',
    labelKey: 'admin.analytics',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.REPORT, action: ACTIONS.READ },
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/activity-logs',
    labelKey: 'admin.activityLogs',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.AUDIT_LOG, action: ACTIONS.READ },
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/settings',
    labelKey: 'admin.settings',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.SETTINGS, action: ACTIONS.MANAGE },
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/reviews',
    labelKey: 'admin.reviews',
    requiredFeature: null,
    requiredPermission: { resource: RESOURCES.DOCTOR, action: ACTIONS.READ },
    requiredRoles: ['super_admin'],
    /** Hidden from Super Admin sidebar: not in spec key features (System Admin: subscriptions, logs, clinics, support). Route remains accessible via URL. */
    showInSuperAdminSidebar: false,
  },
];

// ─── TABBED PAGES: path pattern → tabs with ids and label keys ────────────
/**
 * Tab definition: { id, labelKey, adminOnly?, doctorOnly? }.
 * adminOnly: only Doctor/Clinic Admin see (Manager cannot).
 * doctorOnly: only Doctor sees (clinical tabs on patient detail). Other roles use main /patients/:id.
 */
export const TABBED_PAGES = {
  '/settings': {
    defaultTab: 'general',
    tabs: [
      { id: 'profile', labelKey: 'settings.profile', adminOnly: false },
      { id: 'general', labelKey: 'settings.clinicInfo', adminOnly: true },
      { id: 'compliance', labelKey: 'settings.compliance', adminOnly: true },
      { id: 'doctors', labelKey: 'settings.doctorsStaff', adminOnly: true },
      { id: 'hours', labelKey: 'settings.clinicHours', adminOnly: true },
      { id: 'queue', labelKey: 'settings.queueSettings', adminOnly: true },
      { id: 'tax', labelKey: 'settings.taxSettings', adminOnly: true },
      { id: 'smtp', labelKey: 'settings.emailSettings', adminOnly: true },
      { id: 'holidays', labelKey: 'settings.holidays', adminOnly: true },
    ],
  },
  '/inventory': {
    defaultTab: 'items',
    tabs: [
      { id: 'items', labelKey: 'inventory.items' },
      { id: 'lots', labelKey: 'nav.lots' },
      { id: 'suppliers', labelKey: 'inventory.suppliers' },
      { id: 'transactions', labelKey: 'inventory.transactions' },
    ],
  },
  '/reports': {
    defaultTab: 'revenue',
    tabs: [
      { id: 'revenue', labelKey: 'reports.revenue' },
      { id: 'patients', labelKey: 'reports.patients' },
      { id: 'appointments', labelKey: 'reports.appointments' },
      { id: 'inventory', labelKey: 'reports.inventory' },
    ],
  },
  /** Patient detail tabs: must match lib/constants/route-security.js PATIENT_DETAIL_TABS (enforced at runtime). */
  '/patients/:id': {
    defaultTab: 'overview',
    tabs: [
      {
        id: 'overview',
        labelKey: 'patients.overview',
        requiredPermission: { resource: RESOURCES.PATIENT, action: ACTIONS.READ },
        phiLevel: 'basic',
      },
      {
        id: 'visits',
        labelKey: 'patients.visits',
        requiredPermission: { resource: RESOURCES.APPOINTMENT, action: ACTIONS.READ },
        phiLevel: 'basic',
      },
      {
        id: 'prescriptions',
        labelKey: 'prescriptions.title',
        requiredPermission: { resource: RESOURCES.PRESCRIPTION, action: ACTIONS.READ },
        phiLevel: 'sensitive',
      },
      {
        id: 'invoices',
        labelKey: 'invoices.title',
        requiredPermission: { resource: RESOURCES.INVOICE, action: ACTIONS.READ },
        phiLevel: 'medium',
      },
      {
        id: 'lab-tests',
        labelKey: 'reports.labTests',
        requiredPermission: { resource: RESOURCES.LAB_RESULT, action: ACTIONS.READ },
        phiLevel: 'sensitive',
      },
      {
        id: 'notes',
        labelKey: 'doctors.notes',
        doctorOnly: true,
        requiredPermission: { resource: RESOURCES.CLINICAL_NOTE, action: ACTIONS.READ },
        phiLevel: 'sensitive',
        auditAccess: true,
      },
    ],
  },
  '/doctors/profile': {
    defaultTab: 'profile',
    tabs: [
      { id: 'profile', labelKey: 'doctors.tabProfile' },
      { id: 'clinic', labelKey: 'doctors.tabClinicDetails' },
      { id: 'fees', labelKey: 'doctors.tabFeesInsurance' },
      { id: 'availability', labelKey: 'doctors.tabAvailability' },
    ],
  },
  '/admin/patients/:id': {
    defaultTab: 'overview',
    tabs: [
      { id: 'overview', labelKey: 'common.overview' },
      { id: 'appointments', labelKey: 'appointments.title' },
      { id: 'payments', labelKey: 'invoices.payments' },
    ],
  },
  /** Lots sub-tabs when viewing Inventory → Lots (optional; UI may show all/expiringSoon/expired within lots tab). */
  '/inventory/lots': {
    defaultTab: 'all',
    tabs: [
      { id: 'all', labelKey: 'inventory.allLots' },
      { id: 'expiringSoon', labelKey: 'inventory.expiringSoon' },
      { id: 'expired', labelKey: 'inventory.expired' },
    ],
  },
};

/** Allowed tab names per tabbed page (id only). Settings tabs match SettingsTabs.jsx; inventory/reports/patient detail unified with role-based tabs. */
export const TABBED_PAGE_TAB_IDS = {
  '/settings': [
    'profile',
    'general',
    'compliance',
    'doctors',
    'hours',
    'queue',
    'tax',
    'smtp',
    'holidays',
  ],
  '/inventory': ['items', 'lots', 'suppliers', 'transactions'],
  '/reports': ['revenue', 'patients', 'appointments', 'inventory'],
  '/patients/:id': ['overview', 'visits', 'prescriptions', 'invoices', 'lab-tests', 'notes'],
  '/doctors/profile': ['profile', 'clinic', 'fees', 'availability'],
  '/admin/patients/:id': ['overview', 'appointments', 'payments'],
  '/inventory/lots': ['all', 'expiringSoon', 'expired'],
};

/** Nav order for main ROUTES (1-based). Locations, api-docs, branding, white-label are under Settings (tabs/children). */
export const ROUTE_ORDER = {
  '/dashboard': 1,
  '/appointments': 2,
  '/queue': 3,
  '/patients': 4,
  '/staff': 5,
  '/prescriptions': 6,
  '/invoices': 7,
  '/inventory': 8,
  '/reports': 9,
  '/telemedicine': 10,
  '/settings': 11,
};

/** Collapsible sidebar groups per CLAUDE-AI. Financial = Invoices + Earnings; Personal = Profile, Schedule, Reviews only. */
export const NAV_GROUPS = {
  Clinical: ['/patients', '/queue', '/prescriptions', '/telemedicine'],
  Operations: ['/appointments', '/staff', '/inventory'],
  Financial: ['/invoices', '/doctors/earnings'],
  Personal: ['/doctors/profile', '/doctors/schedule', '/doctors/reviews'],
  Admin: ['/reports', '/settings'],
};

/** Layout templates by role cluster. Per CLAUDE-AI: Clinical, Administrative, Financial. */
export const LAYOUT_TEMPLATES = {
  Clinical: ['doctor', 'nurse'],
  Administrative: ['receptionist', 'manager', 'clinic_admin', 'admin'],
  Financial: ['accountant'],
  Full: ['doctor', 'clinic_admin'],
};

/** Responsive breakpoints per CLAUDE-AI. Desktop: full sidebar; Tablet: collapsible; Mobile: bottom nav. */
export const RESPONSIVE_BREAKPOINTS = {
  desktop: 1280,
  tablet: 768,
  mobile: 0,
};

/** Settings sub-pages (not top-level nav). All under /settings as tabs or child routes. tabId maps to TABBED_PAGES['/settings'].tabs[].id. */
export const SETTINGS_CHILD_ROUTES = [
  {
    path: '/settings/locations',
    labelKey: 'nav.locations',
    tabId: 'general',
    requiredFeature: 'MULTI_LOCATION',
  },
  {
    path: '/settings/branding',
    labelKey: 'nav.branding',
    tabId: 'general',
    requiredFeature: 'CUSTOM_BRANDING',
  },
  {
    path: '/settings/white-label',
    labelKey: 'nav.whiteLabel',
    tabId: 'general',
    requiredFeature: 'WHITE_LABEL',
  },
  {
    path: '/api-docs',
    labelKey: 'nav.apiDocs',
    tabId: 'general',
    requiredFeature: 'API_ACCESS',
  },
  {
    path: '/settings/create-manager',
    labelKey: 'settings.createManager',
    tabId: 'doctors',
    requiredFeature: null,
  },
];

/** Layout component hierarchy. Per CLAUDE-AI #15. */
export const LAYOUT_HIERARCHY = {
  AppLayout: 'Root shell; auth gate; theme.',
  AuthLayout: 'Login, forgot/reset password. No sidebar.',
  DashboardLayout:
    'Main clinic: Sidebar + TopBar + Main. Variants: Minimal (receptionist), Full (doctor), Financial (accountant).',
  AdminLayout: 'Super Admin: /admin shell; own sidebar.',
  TelemedicineLayout: 'Full-screen or dedicated video shell; see TELEMEDICINE_VIDEO_LAYOUT.',
  PrintLayout: 'Prescriptions, invoices; no nav; print-optimized. See PRINT_LAYOUT.',
};

/** Modal/drawer sizes. Per CLAUDE-AI #16. */
export const MODAL_DRAWER_SIZES = {
  sm: 'Alerts, confirmations.',
  md: 'Forms (appointment quick book, patient search overlay).',
  lg: 'Patient detail preview, prescription quick-view.',
};

/** Empty state scenarios. Per CLAUDE-AI #17. */
export const EMPTY_STATE_SCENARIOS = [
  {
    id: 'first-time-setup',
    labelKey: 'empty.firstTimeSetup',
    description: 'No patients yet; onboarding CTA',
  },
  {
    id: 'no-search-results',
    labelKey: 'empty.noSearchResults',
    description: 'Search returned nothing',
  },
  {
    id: 'expired-subscription',
    labelKey: 'empty.expiredSubscription',
    description: 'Subscription expired; upgrade CTA',
  },
  { id: 'offline', labelKey: 'empty.offline', description: 'Offline mode; retry when online' },
];

/** Skeleton/loading scenes. Per CLAUDE-AI #18. */
export const SKELETON_SCENES = {
  dashboard: 'Dashboard loading (stats, lists, charts)',
  table: 'Table loading (appointments list, patients list, invoices list)',
  patientDetail: 'Patient detail loading',
  form: 'Form loading',
};

/** Queue visualization. Per CLAUDE-AI #19. */
export const QUEUE_VISUALIZATION = {
  pattern:
    'Define one: Kanban (Waiting → In Consultation → Done), vertical list with priority, or TV display (large format for waiting room).',
  options: ['kanban', 'vertical-list', 'tv-display'],
};

/** Dashboard layout. Per CLAUDE-AI #9. Widget catalog maps to DASHBOARD_CACHE_WIDGET_CONFIG keys via DASHBOARD_WIDGET_TO_CACHE_KEY. */
export const DASHBOARD_GRID = {
  columns: 12,
  widgetCatalog: [
    'stats-cards',
    'appointments-list',
    'patients-summary',
    'revenue-chart',
    'queue-widget',
    'inventory-alerts',
    'quick-actions',
    'recent-activity',
  ],
  priorityOrder: [
    'stats-cards',
    'quick-actions',
    'appointments-list',
    'revenue-chart',
    'patients-summary',
    'queue-widget',
    'inventory-alerts',
    'recent-activity',
  ],
};

/** Map DASHBOARD_GRID.widgetCatalog id to DASHBOARD_CACHE_WIDGET_CONFIG / useDashboardCache widget key. */
export const DASHBOARD_WIDGET_TO_CACHE_KEY = {
  'stats-cards': 'stats',
  'appointments-list': 'todayAppointments',
  'patients-summary': 'patientSummary',
  'revenue-chart': 'revenueChart',
  'queue-widget': 'queue',
  'inventory-alerts': 'inventoryAlerts',
  'quick-actions': 'quickActions',
  'recent-activity': 'recentActivity',
};

/** Bulk action patterns. Per CLAUDE-AI #10. */
export const BULK_ACTION_PATTERNS = {
  multiSelect: 'Checkbox per row; select all; clear selection',
  toolbar: 'Reusable bulk action toolbar (appears when selection count > 0)',
  confirmationModal: 'Batch operation confirmation (e.g. bulk status update, bulk export)',
  supportedLists: ['patients', 'appointments', 'invoices'],
};

// ─── DASHBOARD CACHE STRATEGY (multi-layer, SWR, WebSocket sync) ────────────
/** TTL presets by data sensitivity (seconds). financial: max 10 min IndexedDB for HIPAA/compliance. */
export const CACHE_TTL_BY_SENSITIVITY = {
  realtime: { memory: 10, indexedDB: null },
  high: { memory: 60, indexedDB: 300 },
  medium: { memory: 180, indexedDB: 900 },
  low: { memory: 600, indexedDB: 3600 },
  financial: { memory: 120, indexedDB: 600 },
  aggregate: { memory: 300, indexedDB: 1800 },
};

/** Cache layer definitions: storage type, TTL (seconds), maxSize (bytes), maxEntries, evictionPolicy. Source: lib/cache/cache-architecture.js */
export const CACHE_LAYERS_SUMMARY = {
  MEMORY: {
    storage: 'in-memory',
    ttl: 60,
    maxSize: 50 * 1024 * 1024,
    maxSizeDisplay: '50MB',
    maxEntries: 1000,
    evictionPolicy: 'lru',
    priority: 1,
    use: 'Current session hot data',
  },
  INDEXED_DB: {
    storage: 'indexeddb',
    ttl: 3600,
    maxSize: 500 * 1024 * 1024,
    maxSizeDisplay: '500MB',
    maxEntries: 10000,
    evictionPolicy: 'lru',
    quotaExceededHandler: 'clear-oldest',
    priority: 2,
    use: 'Offline support, large datasets',
  },
  LOCAL_STORAGE: {
    storage: 'localStorage',
    ttl: 86400,
    maxSize: 10 * 1024 * 1024,
    maxSizeDisplay: '10MB',
    maxEntries: 500,
    evictionPolicy: 'lru',
    priority: 3,
    use: 'User preferences, tokens',
  },
  SERVICE_WORKER: {
    storage: 'cache-api',
    ttl: 604800,
    maxSize: 100 * 1024 * 1024,
    maxSizeDisplay: '100MB',
    priority: 4,
    use: 'Static assets, API responses',
  },
  CDN: {
    storage: 'cdn-edge',
    ttl: 2592000,
    priority: 5,
    use: 'Static assets, public data',
  },
  REDIS: {
    storage: 'redis',
    ttl: 300,
    priority: 6,
    use: 'Shared session data, rate limiting',
  },
};

/** Cache strategy names. Source: lib/cache/cache-architecture.js */
export const CACHE_STRATEGY_NAMES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  SWR: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
};

/**
 * Dashboard widget cache config summary. Full config: lib/cache/dashboard-cache-config.js.
 * Keys match useDashboardCache(widget, params, fetcher) and DASHBOARD_GRID.widgetCatalog.
 * requiredPermission/requiredRoles: enforced in useDashboardCache before serving cache.
 * phiLevel/encryptionRequired/auditAccess: HIPAA-aware; tenantId required in cacheKey for multi-tenant isolation.
 */
export const DASHBOARD_CACHE_WIDGET_CONFIG = {
  stats: {
    strategy: 'stale-while-revalidate',
    layers: ['MEMORY'],
    ttlMemory: 30,
    ttlIndexedDB: 300,
    staleTime: 60,
    deduplication: true,
    backgroundRevalidation: true,
    cacheKey: ['tenantId', 'userId', 'role', 'date'],
    revalidateOn: [
      'appointment.created',
      'appointment.updated',
      'patient.created',
      'invoice.paid',
      'queue.updated',
    ],
    prefetch: true,
    background: true,
    retry: { attempts: 3, backoff: 'exponential' },
    requiredPermission: { resource: RESOURCES.REPORT, action: ACTIONS.READ },
    requiredRoles: [
      'doctor',
      'clinic_admin',
      'admin',
      'manager',
      'nurse',
      'receptionist',
      'accountant',
    ],
    phiLevel: 'aggregate',
    encryptionRequired: false,
    auditAccess: false,
  },
  todayAppointments: {
    strategy: 'stale-while-revalidate',
    layers: ['MEMORY'],
    ttlMemory: 60,
    ttlIndexedDB: 300,
    staleTime: 120,
    cacheKey: ['tenantId', 'userId', 'date'],
    revalidateOn: [
      'appointment.created',
      'appointment.updated',
      'appointment.cancelled',
      'appointment.completed',
    ],
    realtime: true,
    optimistic: true,
    virtualScroll: true,
    pagination: { enabled: true, pageSize: 20, cachePages: 3, prefetchPages: 1 },
    requiredPermission: { resource: RESOURCES.APPOINTMENT, action: ACTIONS.READ },
    requiredRoles: [
      'doctor',
      'clinic_admin',
      'admin',
      'manager',
      'nurse',
      'receptionist',
      'accountant',
    ],
    phiLevel: 'basic',
    encryptionRequired: true,
    auditAccess: true,
    redactFields: ['ssn', 'dob'],
  },
  queue: {
    strategy: 'network-first',
    layers: [],
    ttlMemory: 10,
    staleTime: 5,
    cacheKey: ['tenantId', 'locationId', 'date'],
    revalidateOn: ['queue.created', 'queue.updated', 'queue.statusChange', 'appointment.checkin'],
    realtime: true,
    polling: { enabled: true, interval: 15000 },
    optimistic: true,
    debounce: 1000,
    requiredPermission: { resource: RESOURCES.QUEUE, action: ACTIONS.READ },
    requiredRoles: ['doctor', 'clinic_admin', 'admin', 'manager', 'nurse', 'receptionist'],
    phiLevel: 'basic',
    encryptionRequired: false,
    auditAccess: false,
  },
  revenueChart: {
    strategy: 'cache-first',
    layers: ['MEMORY', 'INDEXED_DB'],
    sensitivity: 'financial',
    ttlMemory: 120,
    ttlIndexedDB: 600,
    staleTime: 300,
    cacheKey: ['tenantId', 'dateRange', 'groupBy'],
    revalidateOn: ['invoice.paid', 'payment.received', 'invoice.created'],
    debounce: 2000,
    requiredPermission: { resource: RESOURCES.REPORT, action: ACTIONS.READ },
    requiredRoles: ['doctor', 'clinic_admin', 'admin', 'accountant', 'manager'],
    phiLevel: 'aggregate',
    encryptionRequired: false,
    auditAccess: false,
  },
  patientSummary: {
    strategy: 'stale-while-revalidate',
    layers: ['MEMORY', 'INDEXED_DB'],
    ttlMemory: 180,
    ttlIndexedDB: 1800,
    staleTime: 300,
    cacheKey: ['tenantId', 'period'],
    revalidateOn: ['patient.created', 'patient.updated'],
    aggregate: true,
    requiredPermission: { resource: RESOURCES.PATIENT, action: ACTIONS.READ },
    requiredRoles: [
      'doctor',
      'clinic_admin',
      'admin',
      'manager',
      'nurse',
      'receptionist',
      'accountant',
    ],
    phiLevel: 'aggregate',
    encryptionRequired: false,
    auditAccess: false,
  },
  inventoryAlerts: {
    strategy: 'cache-first',
    layers: ['MEMORY', 'INDEXED_DB'],
    ttlMemory: 300,
    ttlIndexedDB: 1800,
    staleTime: 600,
    cacheKey: ['tenantId', 'alertType'],
    revalidateOn: ['inventory.updated', 'inventory.lowStock', 'inventory.expirySoon'],
    lazy: true,
    requiredPermission: { resource: RESOURCES.INVENTORY, action: ACTIONS.READ },
    requiredRoles: [
      'doctor',
      'clinic_admin',
      'admin',
      'nurse',
      'receptionist',
      'pharmacist',
      'manager',
    ],
    phiLevel: 'aggregate',
    encryptionRequired: false,
    auditAccess: false,
  },
  recentActivity: {
    strategy: 'network-first',
    layers: ['MEMORY'],
    ttlMemory: 60,
    staleTime: 30,
    cacheKey: ['tenantId', 'userId'],
    revalidateOn: 'any',
    stream: true,
    maxItems: 50,
    requiredPermission: { resource: RESOURCES.NOTIFICATION, action: ACTIONS.READ },
    requiredRoles: ['doctor', 'clinic_admin', 'admin', 'manager', 'nurse', 'receptionist'],
    phiLevel: 'basic',
    encryptionRequired: false,
    auditAccess: false,
  },
  quickActions: {
    strategy: 'cache-only',
    layers: ['LOCAL_STORAGE'],
    ttlLocalStorage: 86400,
    cacheKey: ['tenantId', 'userId', 'role'],
    revalidateOn: ['user.preferences.updated'],
    requiredPermission: null,
    requiredRoles: null,
    phiLevel: 'none',
    encryptionRequired: false,
    auditAccess: false,
  },
};

/**
 * Service Worker API cache strategies by path. exact: pathname === pattern; prefix: pathname.startsWith(pattern);
 * pattern: regex from pattern (e.g. [id] -> [^/]+). Applied in public/sw.js getStrategy().
 */
export const SERVICE_WORKER_API_STRATEGIES = {
  '/api/reports/dashboard': { strategy: 'stale-while-revalidate', exact: true },
  '/api/appointments': { strategy: 'network-first', prefix: true },
  '/api/queue': { strategy: 'network-only', prefix: true },
  '/api/patients': { strategy: 'cache-first', prefix: true },
};

/** Re-export for consumers that expect it from dashboard-structure. Canonical: lib/cache/websocket-cache-events.js */
export { WEBSOCKET_TO_CACHE_EVENT_MAP };

/**
 * WebSocket events that trigger dashboard cache invalidation (array form for backward compat).
 * Derived from WEBSOCKET_TO_CACHE_EVENT_MAP.
 */
export const REALTIME_CACHE_EVENTS = Object.fromEntries(
  Object.entries(WEBSOCKET_TO_CACHE_EVENT_MAP).map(([k, v]) => [k, [v]]),
);

/** Non-dashboard cached data (user preferences, settings). Always include tenantId in cacheKey. */
export const SYSTEM_CACHE_CONFIG = {
  userPreferences: {
    strategy: 'cache-first',
    layers: ['MEMORY', 'LOCAL_STORAGE'],
    ttlMemory: 3600,
    ttlLocalStorage: 604800,
    cacheKey: ['tenantId', 'userId'],
    revalidateOn: ['user.preferences.updated'],
    persist: true,
    requiredPermission: { resource: RESOURCES.SETTINGS, action: ACTIONS.READ },
    requiredRoles: ['doctor', 'clinic_admin', 'admin'],
    phiLevel: 'none',
    encryptionRequired: false,
    auditAccess: false,
  },
};

/** Dashboard cache integration: module and hook paths. */
export const DASHBOARD_CACHE_INTEGRATION = {
  cacheArchitecture: 'lib/cache/cache-architecture.js',
  dashboardCacheConfig: 'lib/cache/dashboard-cache-config.js',
  dashboardCacheManager: 'lib/cache/dashboard-cache-manager.js',
  useDashboardCache: 'hooks/useDashboardCache.js',
  websocketSync: 'lib/cache/websocket-sync.js',
  websocketCacheEvents: 'lib/cache/websocket-cache-events.js',
  serviceWorker: 'public/sw.js',
  dashboardCacheLegacy: 'lib/cache/dashboard-cache.js',
  indexedDBCache: 'lib/cache/indexed-db-cache.js',
  cacheConfigSWR: 'lib/cache/cache-config.js',
  useSWRDashboard: 'hooks/useSWRDashboard.js',
};

/** Print layout. Per CLAUDE-AI #5. */
export const PRINT_LAYOUT = {
  useCase: 'Prescriptions, invoices MUST print properly.',
  rules: 'No sidebar/nav; print-optimized CSS; page break control.',
};

/** Queue display layout. Per CLAUDE-AI #5. */
export const QUEUE_DISPLAY_LAYOUT = {
  useCase: 'TV-mode full-screen view for waiting room.',
  option: 'Same data as /queue; optional full-screen kiosk layout.',
};

/** Telemedicine video layout. Per CLAUDE-AI #5. */
export const TELEMEDICINE_VIDEO_LAYOUT = {
  options: ['full-screen', 'sidebar-chat', 'picture-in-picture'],
  useCase: 'Video consultation; define primary layout.',
};

// ─── ADMIN SUB-ROUTES (Super Admin hub children) ───────────────────────────
/** Child pages under /admin/settings. */
export const ADMIN_SETTINGS_CHILDREN = [
  {
    path: '/admin/settings/general',
    labelKey: 'admin.settingsGeneral',
    descKey: 'admin.settingsGeneralDesc',
  },
  {
    path: '/admin/settings/booking',
    labelKey: 'admin.settingsBooking',
    descKey: 'admin.settingsBookingDesc',
  },
  {
    path: '/admin/settings/payment',
    labelKey: 'admin.settingsPayment',
    descKey: 'admin.settingsPaymentDesc',
  },
  {
    path: '/admin/settings/notification',
    labelKey: 'admin.settingsNotification',
    descKey: 'admin.settingsNotificationDesc',
  },
  {
    path: '/admin/settings/email-sms',
    labelKey: 'admin.settingsEmailSms',
    descKey: 'admin.settingsEmailSmsDesc',
  },
  { path: '/admin/settings/seo', labelKey: 'admin.settingsSeo', descKey: 'admin.settingsSeoDesc' },
  {
    path: '/admin/settings/security',
    labelKey: 'admin.settingsSecurity',
    descKey: 'admin.settingsSecurityDesc',
  },
];

/** Child pages under /admin/financial. */
export const ADMIN_FINANCIAL_CHILDREN = [
  {
    path: '/admin/financial/revenue',
    labelKey: 'admin.financialRevenueDashboard',
    descKey: 'admin.financialRevenueDashboardDesc',
  },
  {
    path: '/admin/financial/disputes',
    labelKey: 'admin.financialPaymentDisputes',
    descKey: 'admin.financialPaymentDisputesDesc',
  },
  {
    path: '/admin/financial/settlements',
    labelKey: 'admin.financialDoctorSettlements',
    descKey: 'admin.financialDoctorSettlementsDesc',
  },
  {
    path: '/admin/financial/commission',
    labelKey: 'admin.financialCommissionSettings',
    descKey: 'admin.financialCommissionSettingsDesc',
  },
  {
    path: '/admin/financial/invoicing',
    labelKey: 'admin.financialInvoicing',
    descKey: 'admin.financialInvoicingDesc',
  },
];

/** Child pages under /admin/content. */
export const ADMIN_CONTENT_CHILDREN = [
  {
    path: '/admin/content/specialties',
    labelKey: 'admin.specialtyManagement',
    descKey: 'admin.specialtyManagementSubtitle',
  },
  { path: '/admin/content/blog', labelKey: 'admin.contentBlog', descKey: 'admin.contentBlogDesc' },
  { path: '/admin/content/faqs', labelKey: 'admin.contentFaqs', descKey: 'admin.contentFaqsDesc' },
  {
    path: '/admin/content/pages',
    labelKey: 'admin.contentPages',
    descKey: 'admin.contentPagesDesc',
  },
  {
    path: '/admin/content/banners',
    labelKey: 'admin.contentBannerManagement',
    descKey: 'admin.contentBannerManagementDesc',
  },
];

/** Child pages under /admin/reports. */
export const ADMIN_REPORTS_CHILDREN = [
  { path: '/admin/reports/user', labelKey: 'admin.reportsUser', descKey: 'admin.reportsUserDesc' },
  {
    path: '/admin/reports/appointments',
    labelKey: 'admin.reportsAppointments',
    descKey: 'admin.reportsAppointmentsDesc',
  },
  {
    path: '/admin/reports/financial',
    labelKey: 'admin.reportsFinancial',
    descKey: 'admin.reportsFinancialDesc',
  },
  {
    path: '/admin/reports/performance',
    labelKey: 'admin.reportsPerformance',
    descKey: 'admin.reportsPerformanceDesc',
  },
  {
    path: '/admin/reports/export',
    labelKey: 'admin.reportsExport',
    descKey: 'admin.reportsExportDesc',
  },
];

/** Child pages under /admin/reviews. */
export const ADMIN_REVIEWS_CHILDREN = [
  {
    path: '/admin/reviews/dashboard',
    labelKey: 'admin.reviewsDashboard',
    descKey: 'admin.reviewsDashboardDesc',
  },
  {
    path: '/admin/reviews/actions',
    labelKey: 'admin.reviewsActions',
    descKey: 'admin.reviewsActionsDesc',
  },
  {
    path: '/admin/reviews/analytics',
    labelKey: 'admin.reviewsAnalytics',
    descKey: 'admin.reviewsAnalyticsDesc',
  },
];

/** Map parent path to children. Use getAdminSubroutes(parentPath) for lookup. */
export const ADMIN_SUBROUTES_MAP = {
  '/admin/settings': ADMIN_SETTINGS_CHILDREN,
  '/admin/financial': ADMIN_FINANCIAL_CHILDREN,
  '/admin/content': ADMIN_CONTENT_CHILDREN,
  '/admin/reports': ADMIN_REPORTS_CHILDREN,
  '/admin/reviews': ADMIN_REVIEWS_CHILDREN,
};

// ─── API ROUTES (full list of API path prefixes and key endpoints) ──────────
/** Every API route group with methods and short description. Used for docs and allowlists. */
export const API_ROUTE_GROUPS = [
  {
    path: '/api/auth',
    methods: ['GET', 'POST'],
    description:
      'Login, logout, refresh, me, 2FA, OAuth, magic-link, forgot/reset/change-password, devices. No public register; clinics provisioned by admin/sales.',
  },
  {
    path: '/api/appointments',
    methods: ['GET', 'POST', 'PUT'],
    description: 'CRUD appointments; [id], [id]/status; slots',
  },
  {
    path: '/api/patients',
    methods: ['GET', 'POST', 'PUT'],
    description:
      'CRUD patients; [id], [id]/medical-history, [id]/upload, [id]/vital-signs; stats; me/documents',
  },
  {
    path: '/api/queue',
    methods: ['GET', 'POST', 'PUT'],
    description: 'Queue list; [id], [id]/status',
  },
  {
    path: '/api/prescriptions',
    methods: ['GET', 'POST', 'PUT'],
    description: 'CRUD prescriptions; [id], [id]/activate, dispense, sign; check-interactions',
  },
  { path: '/api/invoices', methods: ['GET', 'POST', 'PUT'], description: 'CRUD invoices; [id]' },
  { path: '/api/payments', methods: ['GET', 'POST'], description: 'Record and list payments' },
  {
    path: '/api/inventory/items',
    methods: ['GET', 'POST', 'PUT'],
    description: 'CRUD inventory items; [id]',
  },
  {
    path: '/api/inventory/batches',
    methods: ['GET', 'POST', 'PUT'],
    description: 'Batches; [id], [id]/quantity',
  },
  { path: '/api/inventory/lots', methods: ['GET'], description: 'List lots' },
  { path: '/api/inventory/suppliers', methods: ['GET'], description: 'Suppliers' },
  {
    path: '/api/inventory/transactions',
    methods: ['GET', 'POST'],
    description: 'Stock transactions',
  },
  { path: '/api/reports/dashboard', methods: ['GET'], description: 'Dashboard metrics' },
  { path: '/api/reports/revenue', methods: ['GET'], description: 'Revenue report' },
  { path: '/api/reports/patients', methods: ['GET'], description: 'Patient stats' },
  { path: '/api/reports/appointments', methods: ['GET'], description: 'Appointment analytics' },
  { path: '/api/reports/departments', methods: ['GET'], description: 'Department report' },
  { path: '/api/reports/doctors', methods: ['GET'], description: 'Doctors report' },
  { path: '/api/reports/inventory', methods: ['GET'], description: 'Inventory report' },
  {
    path: '/api/clinical-notes',
    methods: ['GET', 'POST', 'PUT'],
    description: 'Clinical notes; [id], [id]/versions',
  },
  {
    path: '/api/lab-orders',
    methods: ['GET', 'POST', 'PUT'],
    description: 'Lab orders; [id], [id]/results',
  },
  {
    path: '/api/lab-results',
    methods: ['GET', 'PUT'],
    description: 'Lab results; [id], [id]/verify',
  },
  { path: '/api/lab-tests', methods: ['GET', 'POST', 'PUT'], description: 'Lab tests; [id]' },
  {
    path: '/api/departments',
    methods: ['GET', 'POST', 'PUT'],
    description: 'Departments; [id], [id]/head-doctor',
  },
  {
    path: '/api/doctors',
    methods: ['GET', 'POST', 'PUT'],
    description:
      'Doctors list; [id], [id]/leaves, [id]/reviews, [id]/schedule; dashboard; register; search; user/[userId]',
  },
  {
    path: '/api/users',
    methods: ['GET', 'POST', 'PUT'],
    description: 'Users; [id]; register-staff',
  },
  { path: '/api/settings', methods: ['GET', 'PUT'], description: 'Clinic settings' },
  {
    path: '/api/notifications',
    methods: ['GET', 'PUT'],
    description: 'Notifications; [id], read, read-all, unread-count',
  },
  {
    path: '/api/notification-templates',
    methods: ['GET', 'PUT'],
    description: 'Templates; [id], [id]/apply',
  },
  {
    path: '/api/note-templates',
    methods: ['GET'],
    description: 'Note templates; [id], [id]/apply',
  },
  {
    path: '/api/reviews',
    methods: ['GET', 'POST', 'PUT'],
    description: 'Reviews; [id]/flag, [id]/response',
  },
  {
    path: '/api/telemedicine/sessions',
    methods: ['GET', 'POST', 'PUT'],
    description: 'Sessions; [id], admit, reject, chat, files, waiting-room, public; send-link',
  },
  { path: '/api/telemedicine/signaling', methods: ['GET'], description: 'WebRTC signaling; [id]' },
  {
    path: '/api/subscriptions',
    methods: ['GET', 'PUT'],
    description: 'Subscription; [id], [id]/addons; features; stripe-complete',
  },
  { path: '/api/subscription-plans', methods: ['GET'], description: 'Plans (clinic)' },
  { path: '/api/features', methods: ['GET'], description: 'Tenant feature flags' },
  { path: '/api/gdpr/export', methods: ['POST'], description: 'GDPR export' },
  { path: '/api/gdpr/delete', methods: ['POST'], description: 'GDPR delete' },
  { path: '/api/gdpr/anonymize', methods: ['POST'], description: 'GDPR anonymize' },
  { path: '/api/gdpr/rectify', methods: ['POST'], description: 'GDPR rectify' },
  {
    path: '/api/insurance/claims',
    methods: ['GET', 'POST', 'PUT'],
    description: 'Claims; [id], [id]/status, [id]/submit',
  },
  { path: '/api/insurance/verify', methods: ['GET'], description: 'Insurance verify' },
  { path: '/api/messages', methods: ['GET', 'PUT'], description: 'Messages; [id]/read' },
  { path: '/api/reminders/process', methods: ['POST'], description: 'Process reminders (cron)' },
  { path: '/api/search', methods: ['GET'], description: 'Global search' },
  { path: '/api/batch', methods: ['POST'], description: 'Batch operations' },
  { path: '/api/socket', methods: ['GET'], description: 'Socket.IO handshake' },
  { path: '/api/sse', methods: ['GET'], description: 'Server-sent events' },
  { path: '/api/health', methods: ['GET'], description: 'Health check' },
  {
    path: '/api/mobile/appointments/upcoming',
    methods: ['GET'],
    description: 'Mobile upcoming appointments',
  },
  { path: '/api/mobile/devices', methods: ['GET'], description: 'Mobile devices' },
  {
    path: '/api/mobile/prescriptions/recent',
    methods: ['GET'],
    description: 'Mobile recent prescriptions',
  },
  { path: '/api/mobile/sync', methods: ['GET'], description: 'Mobile sync' },
  { path: '/api/webhooks/stripe', methods: ['POST'], description: 'Stripe webhook' },
  { path: '/api/webhooks/paypal', methods: ['POST'], description: 'PayPal webhook' },
  {
    path: '/api/whatsapp/conversations',
    methods: ['GET'],
    description: 'WhatsApp conversations [patientId]',
  },
  { path: '/api/whatsapp/messages', methods: ['GET', 'POST'], description: 'WhatsApp messages' },
  { path: '/api/whatsapp/webhook', methods: ['POST'], description: 'WhatsApp webhook' },
  { path: '/api/admin/stats', methods: ['GET'], description: 'Super admin stats' },
  { path: '/api/admin/clients', methods: ['GET', 'PUT'], description: 'Tenants/clients; [id]' },
  { path: '/api/admin/users', methods: ['GET', 'PUT'], description: 'All users; [id]' },
  {
    path: '/api/admin/patients',
    methods: ['GET', 'PUT'],
    description: 'All patients; [id]; export',
  },
  {
    path: '/api/admin/appointments',
    methods: ['GET', 'PUT'],
    description: 'All appointments; [id], [id]/status, [id]/report; analytics',
  },
  {
    path: '/api/admin/doctors',
    methods: ['GET', 'PUT'],
    description: 'Doctors; [id], [id]/documents, request-documents, verify; bulk-action',
  },
  { path: '/api/admin/financial/revenue', methods: ['GET'], description: 'Revenue dashboard' },
  { path: '/api/admin/financial/disputes', methods: ['GET', 'PUT'], description: 'Disputes; [id]' },
  { path: '/api/admin/analytics', methods: ['GET'], description: 'Analytics; export' },
  { path: '/api/admin/activity-logs', methods: ['GET'], description: 'Activity logs' },
  {
    path: '/api/admin/settings/general',
    methods: ['GET', 'PUT'],
    description: 'Admin general settings',
  },
  {
    path: '/api/admin/settings/security',
    methods: ['GET', 'PUT'],
    description: 'Admin security settings',
  },
  {
    path: '/api/admin/specialties',
    methods: ['GET', 'POST', 'PUT'],
    description: 'Specialties; [id]',
  },
  {
    path: '/api/admin/subscription-plans',
    methods: ['GET', 'POST', 'PUT'],
    description: 'Plans; [id]; create-paypal-plan',
  },
  { path: '/api/admin/ip-whitelist', methods: ['GET'], description: 'IP whitelist' },
];

/** RBAC resource names (from lib/permissions/constants). Used for requiredPermission.resource. */
export const RESOURCES_LIST = Object.values(RESOURCES);

/** RBAC action names (from lib/permissions/constants). Used for requiredPermission.action. */
export const ACTIONS_LIST = Object.values(ACTIONS);

/** Extra per-page details: parentPath (for breadcrumbs), descKey, order within section, requiredFeature key. */
export const PAGE_EXTRA_DETAILS = {
  '/login': { parentPath: null, descKey: 'auth.loginDesc', order: 1, requiredFeature: null },
  '/forgot-password': {
    parentPath: '/login',
    descKey: 'auth.forgotPasswordDesc',
    order: 3,
    requiredFeature: null,
  },
  '/change-password': {
    parentPath: '/dashboard',
    descKey: 'auth.changePasswordDesc',
    order: 4,
    requiredFeature: null,
  },
  '/dashboard': {
    parentPath: null,
    descKey: 'dashboard.titleDesc',
    order: 1,
    requiredFeature: null,
  },
  '/appointments': {
    parentPath: null,
    descKey: 'appointments.titleDesc',
    order: 2,
    requiredFeature: 'APPOINTMENT_SCHEDULING',
  },
  '/appointments/new': {
    parentPath: '/appointments',
    descKey: 'appointments.newDesc',
    order: 1,
    requiredFeature: 'APPOINTMENT_SCHEDULING',
  },
  '/appointments/[id]': {
    parentPath: '/appointments',
    descKey: 'appointments.detailDesc',
    order: 2,
    requiredFeature: 'APPOINTMENT_SCHEDULING',
  },
  '/appointments/[id]/edit': {
    parentPath: '/appointments/[id]',
    descKey: 'appointments.editDesc',
    order: 1,
    requiredFeature: 'APPOINTMENT_SCHEDULING',
  },
  '/queue': {
    parentPath: null,
    descKey: 'queue.titleDesc',
    order: 3,
    requiredFeature: 'QUEUE_MANAGEMENT',
  },
  '/patients': {
    parentPath: null,
    descKey: 'patients.titleDesc',
    order: 4,
    requiredFeature: 'PATIENT_MANAGEMENT',
  },
  '/patients/[id]': {
    parentPath: '/patients',
    descKey: 'patients.detailDesc',
    order: 1,
    requiredFeature: 'PATIENT_MANAGEMENT',
  },
  '/staff': { parentPath: null, descKey: 'staff.titleDesc', order: 5, requiredFeature: null },
  '/prescriptions': {
    parentPath: null,
    descKey: 'prescriptions.titleDesc',
    order: 6,
    requiredFeature: 'PRESCRIPTIONS_MANAGEMENT',
  },
  '/prescriptions/new': {
    parentPath: '/prescriptions',
    descKey: 'prescriptions.newDesc',
    order: 1,
    requiredFeature: 'PRESCRIPTIONS_MANAGEMENT',
  },
  '/prescriptions/[id]': {
    parentPath: '/prescriptions',
    descKey: 'prescriptions.detailDesc',
    order: 2,
    requiredFeature: 'PRESCRIPTIONS_MANAGEMENT',
  },
  '/prescriptions/[id]/edit': {
    parentPath: '/prescriptions/[id]',
    descKey: 'prescriptions.editDesc',
    order: 1,
    requiredFeature: 'PRESCRIPTIONS_MANAGEMENT',
  },
  '/prescriptions/[id]/print': {
    parentPath: '/prescriptions/[id]',
    descKey: 'prescriptions.printDesc',
    order: 2,
    requiredFeature: 'PRESCRIPTIONS_MANAGEMENT',
  },
  '/invoices': {
    parentPath: null,
    descKey: 'invoices.titleDesc',
    order: 7,
    requiredFeature: 'INVOICE_BILLING',
  },
  '/invoices/new': {
    parentPath: '/invoices',
    descKey: 'invoices.newDesc',
    order: 1,
    requiredFeature: 'INVOICE_BILLING',
  },
  '/invoices/[id]': {
    parentPath: '/invoices',
    descKey: 'invoices.detailDesc',
    order: 2,
    requiredFeature: 'INVOICE_BILLING',
  },
  '/invoices/[id]/edit': {
    parentPath: '/invoices/[id]',
    descKey: 'invoices.editDesc',
    order: 1,
    requiredFeature: 'INVOICE_BILLING',
  },
  '/payment-history': {
    parentPath: '/invoices',
    descKey: 'paymentHistory.titleDesc',
    order: 3,
    requiredFeature: 'INVOICE_BILLING',
  },
  '/inventory': {
    parentPath: null,
    descKey: 'inventory.titleDesc',
    order: 8,
    requiredFeature: 'INVENTORY_MANAGEMENT',
  },
  '/inventory/items': {
    parentPath: '/inventory',
    descKey: 'inventory.itemsDesc',
    order: 1,
    requiredFeature: 'INVENTORY_MANAGEMENT',
  },
  '/inventory/items/new': {
    parentPath: '/inventory/items',
    descKey: 'inventory.addItemDesc',
    order: 1,
    requiredFeature: 'INVENTORY_MANAGEMENT',
  },
  '/inventory/items/[id]': {
    parentPath: '/inventory/items',
    descKey: 'inventory.itemDetailDesc',
    order: 2,
    requiredFeature: 'INVENTORY_MANAGEMENT',
  },
  '/inventory/lots': {
    parentPath: '/inventory',
    descKey: 'inventory.lotsDesc',
    order: 2,
    requiredFeature: 'INVENTORY_MANAGEMENT',
  },
  '/reports': {
    parentPath: null,
    descKey: 'reports.titleDesc',
    order: 9,
    requiredFeature: 'REPORTS_ANALYTICS',
  },
  '/telemedicine': {
    parentPath: null,
    descKey: 'telemedicine.titleDesc',
    order: 10,
    requiredFeature: null,
  },
  '/telemedicine/[id]': {
    parentPath: '/telemedicine',
    descKey: 'telemedicine.sessionDesc',
    order: 1,
    requiredFeature: null,
  },
  '/telemedicine/[id]/summary': {
    parentPath: '/telemedicine/[id]',
    descKey: 'telemedicine.summaryDesc',
    order: 1,
    requiredFeature: null,
  },
  '/settings': {
    parentPath: null,
    descKey: 'settings.titleDesc',
    order: 11,
    requiredFeature: null,
  },
  '/settings/locations': {
    parentPath: '/settings',
    descKey: 'nav.locationsDesc',
    order: 1,
    requiredFeature: 'MULTI_LOCATION',
  },
  '/settings/branding': {
    parentPath: '/settings',
    descKey: 'nav.brandingDesc',
    order: 2,
    requiredFeature: 'CUSTOM_BRANDING',
  },
  '/settings/white-label': {
    parentPath: '/settings',
    descKey: 'nav.whiteLabelDesc',
    order: 3,
    requiredFeature: 'WHITE_LABEL',
  },
  '/settings/create-manager': {
    parentPath: '/settings',
    descKey: 'settings.createManagerDesc',
    order: 4,
    requiredFeature: null,
  },
  '/api-docs': {
    parentPath: '/settings',
    descKey: 'nav.apiDocsDesc',
    order: 5,
    requiredFeature: 'API_ACCESS',
  },
  '/subscription': {
    parentPath: '/settings',
    descKey: 'subscription.titleDesc',
    order: 6,
    requiredFeature: null,
  },
  '/subscription/cancel': {
    parentPath: '/subscription',
    descKey: 'subscription.cancelDesc',
    order: 1,
    requiredFeature: null,
  },
  '/subscription/return': {
    parentPath: '/subscription',
    descKey: 'subscription.returnDesc',
    order: 2,
    requiredFeature: null,
  },
  '/admin': { parentPath: null, descKey: 'admin.dashboardDesc', order: 1, requiredFeature: null },
  '/admin/settings': {
    parentPath: '/admin',
    descKey: 'admin.settingsDesc',
    order: 1,
    requiredFeature: null,
  },
  '/admin/financial': {
    parentPath: '/admin',
    descKey: 'admin.financialDesc',
    order: 2,
    requiredFeature: null,
  },
  '/admin/content': {
    parentPath: '/admin',
    descKey: 'admin.contentDesc',
    order: 3,
    requiredFeature: null,
  },
  '/admin/reports': {
    parentPath: '/admin',
    descKey: 'admin.reportsDesc',
    order: 4,
    requiredFeature: null,
  },
  '/admin/reviews': {
    parentPath: '/admin',
    descKey: 'admin.reviewsDesc',
    order: 5,
    requiredFeature: null,
  },
  '/admin/clients': {
    parentPath: '/admin',
    descKey: 'admin.clientsDesc',
    order: 6,
    requiredFeature: null,
  },
  '/admin/subscriptions': {
    parentPath: '/admin',
    descKey: 'admin.subscriptionsDesc',
    order: 7,
    requiredFeature: null,
  },
  '/admin/users': {
    parentPath: '/admin',
    descKey: 'admin.allUsersDesc',
    order: 8,
    requiredFeature: null,
  },
  '/admin/patients': {
    parentPath: '/admin',
    descKey: 'admin.patientsDesc',
    order: 9,
    requiredFeature: null,
  },
  '/admin/patients/[id]': {
    parentPath: '/admin/patients',
    descKey: 'admin.patientDetailDesc',
    order: 1,
    requiredFeature: null,
  },
  '/admin/appointments': {
    parentPath: '/admin',
    descKey: 'admin.appointmentsDesc',
    order: 10,
    requiredFeature: null,
  },
  '/admin/appointments/analytics': {
    parentPath: '/admin/appointments',
    descKey: 'admin.appointmentsAnalyticsDesc',
    order: 1,
    requiredFeature: null,
  },
  '/admin/doctors': {
    parentPath: '/admin',
    descKey: 'admin.doctorsDesc',
    order: 11,
    requiredFeature: null,
  },
  '/admin/doctors/verify': {
    parentPath: '/admin/doctors',
    descKey: 'admin.doctorsVerifyDesc',
    order: 1,
    requiredFeature: null,
  },
  '/admin/create-admin': {
    parentPath: '/admin',
    descKey: 'admin.createAdminDesc',
    order: 12,
    requiredFeature: null,
  },
  '/admin/analytics': {
    parentPath: '/admin',
    descKey: 'admin.analyticsDesc',
    order: 13,
    requiredFeature: null,
  },
  '/admin/activity-logs': {
    parentPath: '/admin',
    descKey: 'admin.activityLogsDesc',
    order: 14,
    requiredFeature: null,
  },
  '/admin/settings/general': {
    parentPath: '/admin/settings',
    descKey: 'admin.settingsGeneralDesc',
    order: 1,
    requiredFeature: null,
  },
  '/admin/settings/booking': {
    parentPath: '/admin/settings',
    descKey: 'admin.settingsBookingDesc',
    order: 2,
    requiredFeature: null,
  },
  '/admin/settings/payment': {
    parentPath: '/admin/settings',
    descKey: 'admin.settingsPaymentDesc',
    order: 3,
    requiredFeature: null,
  },
  '/admin/settings/notification': {
    parentPath: '/admin/settings',
    descKey: 'admin.settingsNotificationDesc',
    order: 4,
    requiredFeature: null,
  },
  '/admin/settings/email-sms': {
    parentPath: '/admin/settings',
    descKey: 'admin.settingsEmailSmsDesc',
    order: 5,
    requiredFeature: null,
  },
  '/admin/settings/seo': {
    parentPath: '/admin/settings',
    descKey: 'admin.settingsSeoDesc',
    order: 6,
    requiredFeature: null,
  },
  '/admin/settings/security': {
    parentPath: '/admin/settings',
    descKey: 'admin.settingsSecurityDesc',
    order: 7,
    requiredFeature: null,
  },
  '/admin/financial/revenue': {
    parentPath: '/admin/financial',
    descKey: 'admin.financialRevenueDashboardDesc',
    order: 1,
    requiredFeature: null,
  },
  '/admin/financial/disputes': {
    parentPath: '/admin/financial',
    descKey: 'admin.financialPaymentDisputesDesc',
    order: 2,
    requiredFeature: null,
  },
  '/admin/financial/settlements': {
    parentPath: '/admin/financial',
    descKey: 'admin.financialDoctorSettlementsDesc',
    order: 3,
    requiredFeature: null,
  },
  '/admin/financial/commission': {
    parentPath: '/admin/financial',
    descKey: 'admin.financialCommissionSettingsDesc',
    order: 4,
    requiredFeature: null,
  },
  '/admin/financial/invoicing': {
    parentPath: '/admin/financial',
    descKey: 'admin.financialInvoicingDesc',
    order: 5,
    requiredFeature: null,
  },
  '/admin/content/specialties': {
    parentPath: '/admin/content',
    descKey: 'admin.specialtyManagementSubtitle',
    order: 1,
    requiredFeature: null,
  },
  '/admin/content/blog': {
    parentPath: '/admin/content',
    descKey: 'admin.contentBlogDesc',
    order: 2,
    requiredFeature: null,
  },
  '/admin/content/faqs': {
    parentPath: '/admin/content',
    descKey: 'admin.contentFaqsDesc',
    order: 3,
    requiredFeature: null,
  },
  '/admin/content/pages': {
    parentPath: '/admin/content',
    descKey: 'admin.contentPagesDesc',
    order: 4,
    requiredFeature: null,
  },
  '/admin/content/banners': {
    parentPath: '/admin/content',
    descKey: 'admin.contentBannerManagementDesc',
    order: 5,
    requiredFeature: null,
  },
  '/admin/reports/user': {
    parentPath: '/admin/reports',
    descKey: 'admin.reportsUserDesc',
    order: 1,
    requiredFeature: null,
  },
  '/admin/reports/appointments': {
    parentPath: '/admin/reports',
    descKey: 'admin.reportsAppointmentsDesc',
    order: 2,
    requiredFeature: null,
  },
  '/admin/reports/financial': {
    parentPath: '/admin/reports',
    descKey: 'admin.reportsFinancialDesc',
    order: 3,
    requiredFeature: null,
  },
  '/admin/reports/performance': {
    parentPath: '/admin/reports',
    descKey: 'admin.reportsPerformanceDesc',
    order: 4,
    requiredFeature: null,
  },
  '/admin/reports/export': {
    parentPath: '/admin/reports',
    descKey: 'admin.reportsExportDesc',
    order: 5,
    requiredFeature: null,
  },
  '/admin/reviews/dashboard': {
    parentPath: '/admin/reviews',
    descKey: 'admin.reviewsDashboardDesc',
    order: 1,
    requiredFeature: null,
  },
  '/admin/reviews/actions': {
    parentPath: '/admin/reviews',
    descKey: 'admin.reviewsActionsDesc',
    order: 2,
    requiredFeature: null,
  },
  '/admin/reviews/analytics': {
    parentPath: '/admin/reviews',
    descKey: 'admin.reviewsAnalyticsDesc',
    order: 3,
    requiredFeature: null,
  },
};

// ─── ALL PAGES (full clinic UI routes with details) ────────────────────────
/**
 * Every UI route in the clinic app with path, labelKey, section, and access.
 * Use for sitemaps, breadcrumbs, or "full project structure" reference.
 * For extra fields (parentPath, descKey, order) see PAGE_EXTRA_DETAILS.
 */
export const ALL_PAGES = [
  // Auth & public
  { path: '/login', labelKey: 'auth.login', section: 'auth', requiredRoles: null },
  {
    path: '/forgot-password',
    labelKey: 'auth.forgotPassword',
    section: 'auth',
    requiredRoles: null,
  },
  {
    path: '/change-password',
    labelKey: 'auth.changePassword',
    section: 'auth',
    requiredRoles: null,
  },
  { path: '/pricing', labelKey: 'pricing.title', section: 'marketing', requiredRoles: null },
  { path: '/about', labelKey: 'about.title', section: 'marketing', requiredRoles: null },
  { path: '/contact', labelKey: 'contact.title', section: 'marketing', requiredRoles: null },
  { path: '/blog', labelKey: 'nav.blog', section: 'marketing', requiredRoles: null },
  { path: '/blog/[slug]', labelKey: 'nav.blogPost', section: 'marketing', requiredRoles: null },
  { path: '/legal', labelKey: 'nav.legal', section: 'marketing', requiredRoles: null },
  {
    path: '/legal/responsible-disclosure',
    labelKey: 'legal.responsibleDisclosure',
    section: 'marketing',
    requiredRoles: null,
  },
  { path: '/privacy', labelKey: 'nav.privacy', section: 'marketing', requiredRoles: null },
  { path: '/terms', labelKey: 'nav.terms', section: 'marketing', requiredRoles: null },
  { path: '/support', labelKey: 'support.title', section: 'support', requiredRoles: null },
  {
    path: '/support/contact',
    labelKey: 'support.contact',
    section: 'support',
    requiredRoles: null,
  },
  // Clinic dashboard & core
  { path: '/dashboard', labelKey: 'dashboard.title', section: 'clinic', requiredRoles: null },
  { path: '/appointments', labelKey: 'appointments.title', section: 'clinic', requiredRoles: null },
  {
    path: '/appointments/new',
    labelKey: 'appointments.new',
    section: 'clinic',
    requiredRoles: null,
  },
  {
    path: '/appointments/[id]',
    labelKey: 'appointments.detail',
    section: 'clinic',
    requiredRoles: null,
  },
  {
    path: '/appointments/[id]/edit',
    labelKey: 'appointments.edit',
    section: 'clinic',
    requiredRoles: null,
  },
  { path: '/queue', labelKey: 'queue.title', section: 'clinic', requiredRoles: null },
  { path: '/patients', labelKey: 'patients.title', section: 'clinic', requiredRoles: null },
  { path: '/patients/[id]', labelKey: 'patients.detail', section: 'clinic', requiredRoles: null },
  {
    path: '/staff',
    labelKey: 'staff.title',
    section: 'clinic',
    requiredRoles: ['doctor', 'clinic_admin'],
  },
  {
    path: '/prescriptions',
    labelKey: 'prescriptions.title',
    section: 'clinic',
    requiredRoles: null,
  },
  {
    path: '/prescriptions/new',
    labelKey: 'prescriptions.new',
    section: 'clinic',
    requiredRoles: null,
  },
  {
    path: '/prescriptions/[id]',
    labelKey: 'prescriptions.detail',
    section: 'clinic',
    requiredRoles: null,
  },
  {
    path: '/prescriptions/[id]/edit',
    labelKey: 'prescriptions.edit',
    section: 'clinic',
    requiredRoles: null,
  },
  {
    path: '/prescriptions/[id]/print',
    labelKey: 'prescriptions.print',
    section: 'clinic',
    requiredRoles: null,
  },
  { path: '/invoices', labelKey: 'invoices.title', section: 'clinic', requiredRoles: null },
  { path: '/invoices/new', labelKey: 'invoices.new', section: 'clinic', requiredRoles: null },
  { path: '/invoices/[id]', labelKey: 'invoices.detail', section: 'clinic', requiredRoles: null },
  {
    path: '/invoices/[id]/edit',
    labelKey: 'invoices.edit',
    section: 'clinic',
    requiredRoles: null,
  },
  {
    path: '/payment-history',
    labelKey: 'paymentHistory.title',
    section: 'clinic',
    requiredRoles: null,
  },
  { path: '/inventory', labelKey: 'inventory.title', section: 'clinic', requiredRoles: null },
  { path: '/inventory/items', labelKey: 'inventory.items', section: 'clinic', requiredRoles: null },
  {
    path: '/inventory/items/new',
    labelKey: 'inventory.addItem',
    section: 'clinic',
    requiredRoles: null,
  },
  {
    path: '/inventory/items/[id]',
    labelKey: 'inventory.itemDetail',
    section: 'clinic',
    requiredRoles: null,
  },
  { path: '/inventory/lots', labelKey: 'nav.lots', section: 'clinic', requiredRoles: null },
  { path: '/reports', labelKey: 'reports.title', section: 'clinic', requiredRoles: null },
  { path: '/telemedicine', labelKey: 'telemedicine.title', section: 'clinic', requiredRoles: null },
  {
    path: '/telemedicine/[id]',
    labelKey: 'telemedicine.session',
    section: 'clinic',
    requiredRoles: null,
  },
  {
    path: '/telemedicine/[id]/summary',
    labelKey: 'telemedicine.summary',
    section: 'clinic',
    requiredRoles: null,
  },
  // Clinic settings
  { path: '/settings', labelKey: 'settings.title', section: 'clinic', requiredRoles: null },
  {
    path: '/settings/locations',
    labelKey: 'nav.locations',
    section: 'clinic',
    requiredRoles: ['clinic_admin'],
  },
  {
    path: '/settings/branding',
    labelKey: 'nav.branding',
    section: 'clinic',
    requiredRoles: ['clinic_admin'],
  },
  {
    path: '/settings/white-label',
    labelKey: 'nav.whiteLabel',
    section: 'clinic',
    requiredRoles: ['clinic_admin'],
  },
  {
    path: '/settings/create-manager',
    labelKey: 'settings.createManager',
    section: 'clinic',
    requiredRoles: null,
  },
  {
    path: '/api-docs',
    labelKey: 'nav.apiDocs',
    section: 'clinic',
    requiredRoles: ['clinic_admin'],
  },
  { path: '/subscription', labelKey: 'subscription.title', section: 'clinic', requiredRoles: null },
  {
    path: '/subscription/cancel',
    labelKey: 'subscription.cancel',
    section: 'clinic',
    requiredRoles: null,
  },
  {
    path: '/subscription/return',
    labelKey: 'subscription.return',
    section: 'clinic',
    requiredRoles: null,
  },
  // Doctor area
  {
    path: '/doctors/profile',
    labelKey: 'doctors.profile',
    section: 'doctor',
    requiredRoles: ['doctor'],
  },
  {
    path: '/doctors/schedule',
    labelKey: 'doctors.schedule',
    section: 'doctor',
    requiredRoles: ['doctor'],
  },
  {
    path: '/doctors/earnings',
    labelKey: 'doctors.earnings',
    section: 'doctor',
    requiredRoles: ['doctor'],
  },
  {
    path: '/doctors/reviews',
    labelKey: 'doctors.reviews',
    section: 'doctor',
    requiredRoles: ['doctor'],
  },
  {
    path: '/doctors/analytics',
    labelKey: 'doctors.analytics',
    section: 'doctor',
    requiredRoles: ['doctor'],
  },
  {
    path: '/doctors/messages',
    labelKey: 'doctors.messages',
    section: 'doctor',
    requiredRoles: ['doctor'],
  },
  {
    path: '/doctors/register',
    labelKey: 'doctors.register',
    section: 'doctor',
    requiredRoles: ['doctor'],
  },
  {
    path: '/doctors/[id]/leaves',
    labelKey: 'doctors.leaves',
    section: 'doctor',
    requiredRoles: null,
  },
  // Super Admin
  { path: '/admin', labelKey: 'admin.dashboard', section: 'admin', requiredRoles: ['super_admin'] },
  {
    path: '/admin/clients',
    labelKey: 'admin.clients',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/subscriptions',
    labelKey: 'admin.subscriptions',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/users',
    labelKey: 'admin.allUsers',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/patients',
    labelKey: 'admin.patients',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/patients/[id]',
    labelKey: 'admin.patientDetail',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/appointments',
    labelKey: 'admin.appointments',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/appointments/analytics',
    labelKey: 'admin.appointmentsAnalytics',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/doctors',
    labelKey: 'admin.doctors',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/doctors/verify',
    labelKey: 'admin.doctorsVerify',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/create-admin',
    labelKey: 'admin.createAdmin',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/content',
    labelKey: 'admin.content',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/financial',
    labelKey: 'admin.financial',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/reports',
    labelKey: 'admin.reports',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/analytics',
    labelKey: 'admin.analytics',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/activity-logs',
    labelKey: 'admin.activityLogs',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/settings',
    labelKey: 'admin.settings',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  {
    path: '/admin/reviews',
    labelKey: 'admin.reviews',
    section: 'admin',
    requiredRoles: ['super_admin'],
  },
  // Admin sub-routes (same section: admin)
  ...ADMIN_SETTINGS_CHILDREN.map((r) => ({
    ...r,
    section: 'admin',
    requiredRoles: ['super_admin'],
  })),
  ...ADMIN_FINANCIAL_CHILDREN.map((r) => ({
    ...r,
    section: 'admin',
    requiredRoles: ['super_admin'],
  })),
  ...ADMIN_CONTENT_CHILDREN.map((r) => ({
    ...r,
    section: 'admin',
    requiredRoles: ['super_admin'],
  })),
  ...ADMIN_REPORTS_CHILDREN.map((r) => ({
    ...r,
    section: 'admin',
    requiredRoles: ['super_admin'],
  })),
  ...ADMIN_REVIEWS_CHILDREN.map((r) => ({
    ...r,
    section: 'admin',
    requiredRoles: ['super_admin'],
  })),
];

// ─── HELPERS ───────────────────────────────────────────────────────────────

/**
 * Resolve route path to a TABBED_PAGES key (e.g. /patients/123 -> /patients/:id).
 */
export function resolveTabbedPageKey(pathname) {
  if (!pathname) return null;
  const exact = TABBED_PAGES[pathname];
  if (exact) return pathname;
  for (const key of Object.keys(TABBED_PAGES)) {
    if (!key.includes(':')) continue;
    const pattern = key.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(pathname)) return key;
  }
  return null;
}

/**
 * Get tab config for a page. Returns { defaultTab, tabs } or null.
 */
export function getTabConfigForPage(pathname) {
  const key = resolveTabbedPageKey(pathname);
  return key ? TABBED_PAGES[key] : null;
}

/**
 * Get list of tab ids allowed for this user on this page.
 * For /settings, adminOnly tabs are hidden from Manager (and anyone without Settings write/clinic_admin).
 */
export function getAllowedTabIdsForPage(pathname, userRole, canAccessAdminTabs = false) {
  const config = getTabConfigForPage(pathname);
  if (!config) return [];

  const role = (userRole || '').toLowerCase();
  const isAdminOrDoctor =
    role === 'doctor' || role === 'clinic_admin' || role === 'admin' || role === 'super_admin';

  const isDoctor = role === 'doctor';

  return config.tabs
    .filter((tab) => {
      if (tab.adminOnly && !canAccessAdminTabs && !isAdminOrDoctor) return false;
      if (tab.doctorOnly && !isDoctor) return false;
      return true;
    })
    .map((t) => t.id);
}

/**
 * Get full tab list for page (with id and labelKey). Optionally filter by allowed tabs for user.
 */
export function getTabsForPage(pathname, userRole = null, canAccessAdminTabs = false) {
  const config = getTabConfigForPage(pathname);
  if (!config) return [];

  const allowedIds =
    userRole != null ? getAllowedTabIdsForPage(pathname, userRole, canAccessAdminTabs) : null;

  return config.tabs
    .filter((t) => allowedIds == null || allowedIds.includes(t.id))
    .map((t) => ({ id: t.id, labelKey: t.labelKey || t.id }));
}

/**
 * Get default tab id for a tabbed page (first allowed tab for user, or config default).
 */
export function getDefaultTabForPage(pathname, userRole = null, canAccessAdminTabs = false) {
  const config = getTabConfigForPage(pathname);
  if (!config) return null;
  const allowed = getAllowedTabIdsForPage(pathname, userRole, canAccessAdminTabs);
  if (allowed.length === 0) return null;
  return allowed.includes(config.defaultTab) ? config.defaultTab : allowed[0];
}

/**
 * Get route definition by path (exact or prefix for /admin/*).
 */
export function getRouteByPath(pathname) {
  const exact = ROUTES.find((r) => r.path === pathname);
  if (exact) return exact;
  if (pathname?.startsWith('/admin')) {
    return (
      ADMIN_ROUTES.find((r) => r.path === pathname || pathname.startsWith(r.path + '/')) ||
      ADMIN_ROUTES[0]
    );
  }
  return ROUTES.find((r) => pathname === r.path);
}

/**
 * Flat list of nav route objects for a role (clinic sidebar). Includes DOCTOR_ROUTES when role is doctor.
 * Caller should still filter by feature flags and permissions.
 * @param {string} role - User role (e.g. 'doctor', 'clinic_admin', 'manager')
 * @returns {{ route: object, source: 'main'|'doctor' }[]}
 */
export function getNavItemsForRole(role) {
  const r = (role || '').toLowerCase();
  let main = ROUTES.filter((route) => {
    if (!route.requiredRoles) return true;
    return route.requiredRoles.some((roleKey) => roleKey.toLowerCase() === r);
  });
  if (r === 'manager') {
    main = main.filter((route) => !isManagerPathForbiddenNav(route.path));
  }
  const items = main.map((route) => ({ route, source: 'main' }));
  if (r === 'doctor') {
    DOCTOR_ROUTES.forEach((route) => items.push({ route, source: 'doctor' }));
  }
  return items;
}

/**
 * Nav items grouped by NAV_GROUPS for sidebar rendering. Dashboard is first (ungrouped); then groups.
 * @param {string} role - User role
 * @returns {{ dashboard: object, groups: Record<string, object[]> }}
 */
export function getNavItemsGrouped(role) {
  const items = getNavItemsForRole(role);
  const dashboard = items.find(({ route }) => route.path === '/dashboard')?.route || null;
  const rest = items.filter(({ route }) => route.path !== '/dashboard');
  const pathToRoute = Object.fromEntries(rest.map(({ route }) => [route.path, route]));
  const groups = {};
  for (const [groupName, paths] of Object.entries(NAV_GROUPS)) {
    groups[groupName] = paths.map((p) => pathToRoute[p]).filter(Boolean);
  }
  return { dashboard, groups };
}

/**
 * All tab ids for a page (no role filter). Useful for URL validation.
 */
export function getTabIdsForPage(pathname) {
  const config = getTabConfigForPage(pathname);
  return config ? config.tabs.map((t) => t.id) : [];
}

/**
 * Get child routes for an admin hub (e.g. /admin/settings -> settings children).
 */
export function getAdminSubroutes(parentPath) {
  return ADMIN_SUBROUTES_MAP[parentPath] || [];
}

/**
 * Get all UI pages grouped by section (auth, clinic, doctor, admin, marketing, support).
 * Per CLAUDE-AI #14: Prefer generating this at build time as static JSON; these helpers are for dev/runtime.
 */
export function getAllPagesBySection() {
  const bySection = {};
  for (const page of ALL_PAGES) {
    const section = page.section || 'other';
    if (!bySection[section]) bySection[section] = [];
    bySection[section].push(page);
  }
  return bySection;
}

/**
 * Full project structure summary (for docs or tooling).
 */
export function getProjectStructureSummary() {
  return {
    project: PROJECT_META,
    features: Object.keys(FEATURES),
    roles: Object.values(ROLES),
    roleDescriptions: ROLE_DESCRIPTIONS,
    sectionDescriptions: SECTION_DESCRIPTIONS,
    navRoutes: ROUTES.length,
    doctorRoutes: DOCTOR_ROUTES.length,
    adminRoutes: ADMIN_ROUTES.length,
    tabbedPages: Object.keys(TABBED_PAGES),
    tabIdsByPage: TABBED_PAGE_TAB_IDS,
    navGroups: NAV_GROUPS,
    layoutTemplates: LAYOUT_TEMPLATES,
    responsiveBreakpoints: RESPONSIVE_BREAKPOINTS,
    settingsChildRoutes: SETTINGS_CHILD_ROUTES,
    layoutHierarchy: LAYOUT_HIERARCHY,
    modalDrawerSizes: MODAL_DRAWER_SIZES,
    emptyStateScenarios: EMPTY_STATE_SCENARIOS,
    skeletonScenes: SKELETON_SCENES,
    queueVisualization: QUEUE_VISUALIZATION,
    dashboardGrid: DASHBOARD_GRID,
    bulkActionPatterns: BULK_ACTION_PATTERNS,
    printLayout: PRINT_LAYOUT,
    queueDisplayLayout: QUEUE_DISPLAY_LAYOUT,
    telemedicineVideoLayout: TELEMEDICINE_VIDEO_LAYOUT,
    cacheLayersSummary: Object.keys(CACHE_LAYERS_SUMMARY),
    cacheStrategyNames: Object.keys(CACHE_STRATEGY_NAMES),
    dashboardCacheWidgets: Object.keys(DASHBOARD_CACHE_WIDGET_CONFIG),
    dashboardWidgetToCacheKey: DASHBOARD_WIDGET_TO_CACHE_KEY,
    serviceWorkerApiStrategies: Object.keys(SERVICE_WORKER_API_STRATEGIES),
    realtimeCacheEvents: Object.keys(REALTIME_CACHE_EVENTS),
    websocketToCacheEventMap: Object.keys(WEBSOCKET_TO_CACHE_EVENT_MAP),
    systemCacheConfig: Object.keys(SYSTEM_CACHE_CONFIG),
    dashboardCacheIntegration: DASHBOARD_CACHE_INTEGRATION,
    routeOrder: ROUTE_ORDER,
    adminSubrouteParents: Object.keys(ADMIN_SUBROUTES_MAP),
    adminSubrouteCount: Object.values(ADMIN_SUBROUTES_MAP).reduce((s, arr) => s + arr.length, 0),
    totalPages: ALL_PAGES.length,
    apiRouteGroupCount: API_ROUTE_GROUPS.length,
    resourcesList: RESOURCES_LIST,
    actionsList: ACTIONS_LIST,
    pageExtraDetailsCount: Object.keys(PAGE_EXTRA_DETAILS).length,
  };
}

/**
 * Get full details for a page by path (base path or pattern). Merges ALL_PAGES entry with PAGE_EXTRA_DETAILS.
 */
export function getFullPageDetails(pathname) {
  const exact = ALL_PAGES.find((p) => p.path === pathname);
  const extra = PAGE_EXTRA_DETAILS[pathname];
  if (!exact) return null;
  return { ...exact, ...extra };
}

/**
 * Returns a single object with every detail: project meta, roles, features, all routes, all tabs, all pages, all API groups, permissions reference.
 * Use for documentation, codegen, or "full project dump".
 */
export function getFullProjectDetails() {
  return {
    projectMeta: PROJECT_META,
    features: FEATURES,
    roleDescriptions: ROLE_DESCRIPTIONS,
    sectionDescriptions: SECTION_DESCRIPTIONS,
    roles: ROLES,
    routes: ROUTES,
    routeOrder: ROUTE_ORDER,
    doctorRoutes: DOCTOR_ROUTES,
    adminRoutes: ADMIN_ROUTES,
    tabbedPages: TABBED_PAGES,
    tabbedPageTabIds: TABBED_PAGE_TAB_IDS,
    navGroups: NAV_GROUPS,
    layoutTemplates: LAYOUT_TEMPLATES,
    responsiveBreakpoints: RESPONSIVE_BREAKPOINTS,
    settingsChildRoutes: SETTINGS_CHILD_ROUTES,
    layoutHierarchy: LAYOUT_HIERARCHY,
    modalDrawerSizes: MODAL_DRAWER_SIZES,
    emptyStateScenarios: EMPTY_STATE_SCENARIOS,
    skeletonScenes: SKELETON_SCENES,
    queueVisualization: QUEUE_VISUALIZATION,
    dashboardGrid: DASHBOARD_GRID,
    bulkActionPatterns: BULK_ACTION_PATTERNS,
    printLayout: PRINT_LAYOUT,
    queueDisplayLayout: QUEUE_DISPLAY_LAYOUT,
    telemedicineVideoLayout: TELEMEDICINE_VIDEO_LAYOUT,
    cacheLayersSummary: CACHE_LAYERS_SUMMARY,
    cacheStrategyNames: CACHE_STRATEGY_NAMES,
    dashboardCacheWidgetConfig: DASHBOARD_CACHE_WIDGET_CONFIG,
    dashboardWidgetToCacheKey: DASHBOARD_WIDGET_TO_CACHE_KEY,
    serviceWorkerApiStrategies: SERVICE_WORKER_API_STRATEGIES,
    realtimeCacheEvents: REALTIME_CACHE_EVENTS,
    websocketToCacheEventMap: WEBSOCKET_TO_CACHE_EVENT_MAP,
    systemCacheConfig: SYSTEM_CACHE_CONFIG,
    cacheTtlBySensitivity: CACHE_TTL_BY_SENSITIVITY,
    dashboardCacheIntegration: DASHBOARD_CACHE_INTEGRATION,
    adminSubroutesMap: ADMIN_SUBROUTES_MAP,
    adminSettingsChildren: ADMIN_SETTINGS_CHILDREN,
    adminFinancialChildren: ADMIN_FINANCIAL_CHILDREN,
    adminContentChildren: ADMIN_CONTENT_CHILDREN,
    adminReportsChildren: ADMIN_REPORTS_CHILDREN,
    adminReviewsChildren: ADMIN_REVIEWS_CHILDREN,
    allPages: ALL_PAGES,
    pageExtraDetails: PAGE_EXTRA_DETAILS,
    apiRouteGroups: API_ROUTE_GROUPS,
    resourcesList: RESOURCES_LIST,
    actionsList: ACTIONS_LIST,
    summary: getProjectStructureSummary(),
  };
}
