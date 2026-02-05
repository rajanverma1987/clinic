/**
 * Dashboard-specific cache configuration per widget.
 * Uses CACHE_LAYERS and CACHE_STRATEGY from cache-architecture.
 * TTLs in seconds. requiredPermission/requiredRoles enforced in useDashboardCache.
 * cacheKey must include tenantId for multi-tenant isolation (except system caches that enforce it).
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants.js';
import { CACHE_LAYERS, CACHE_STRATEGY } from './cache-architecture.js';

export const DASHBOARD_CACHE_CONFIG = {
  // Stats Cards (Top metrics)
  stats: {
    layer: [CACHE_LAYERS.MEMORY, CACHE_LAYERS.INDEXED_DB],
    strategy: CACHE_STRATEGY.SWR,
    ttl: { memory: 30, indexedDB: 300 },
    staleTime: 60,
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
  },

  // Today's Appointments (PHI: basic; encrypt in IndexedDB)
  todayAppointments: {
    layer: [CACHE_LAYERS.MEMORY, CACHE_LAYERS.INDEXED_DB],
    strategy: CACHE_STRATEGY.SWR,
    ttl: { memory: 60, indexedDB: 300 },
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
    pagination: { enabled: true, pageSize: 20, cachePages: 3 },
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

  // Queue Widget
  queue: {
    layer: [CACHE_LAYERS.MEMORY],
    strategy: CACHE_STRATEGY.NETWORK_FIRST,
    ttl: { memory: 10 },
    staleTime: 5,
    cacheKey: ['tenantId', 'locationId', 'date'],
    revalidateOn: ['queue.created', 'queue.updated', 'queue.statusChange', 'appointment.checkin'],
    realtime: true,
    polling: { enabled: true, interval: 15000 },
    optimistic: true,
    requiredPermission: { resource: RESOURCES.QUEUE, action: ACTIONS.READ },
    requiredRoles: ['doctor', 'clinic_admin', 'admin', 'manager', 'nurse', 'receptionist'],
    phiLevel: 'basic',
  },

  // Revenue Chart (financial: shorter TTL for compliance)
  revenueChart: {
    layer: [CACHE_LAYERS.MEMORY, CACHE_LAYERS.INDEXED_DB],
    strategy: CACHE_STRATEGY.CACHE_FIRST,
    sensitivity: 'financial',
    ttl: {
      memory: 120,
      indexedDB: 600,
    },
    staleTime: 300,
    cacheKey: ['tenantId', 'dateRange', 'groupBy'],
    revalidateOn: ['invoice.paid', 'payment.received', 'invoice.created'],
    debounce: 2000,
    transform: (data) => data,
    requiredPermission: { resource: RESOURCES.REPORT, action: ACTIONS.READ },
    requiredRoles: ['doctor', 'clinic_admin', 'admin', 'accountant', 'manager'],
    phiLevel: 'aggregate',
  },

  // Patient Summary
  patientSummary: {
    layer: [CACHE_LAYERS.MEMORY, CACHE_LAYERS.INDEXED_DB],
    strategy: CACHE_STRATEGY.SWR,
    ttl: { memory: 180, indexedDB: 1800 },
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
  },

  // Inventory Alerts
  inventoryAlerts: {
    layer: [CACHE_LAYERS.MEMORY, CACHE_LAYERS.INDEXED_DB],
    strategy: CACHE_STRATEGY.CACHE_FIRST,
    ttl: { memory: 300, indexedDB: 1800 },
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
  },

  // Recent Activity
  recentActivity: {
    layer: [CACHE_LAYERS.MEMORY],
    strategy: CACHE_STRATEGY.NETWORK_FIRST,
    ttl: { memory: 60 },
    staleTime: 30,
    cacheKey: ['tenantId', 'userId'],
    revalidateOn: 'any',
    stream: true,
    maxItems: 50,
    requiredPermission: { resource: RESOURCES.NOTIFICATION, action: ACTIONS.READ },
    requiredRoles: ['doctor', 'clinic_admin', 'admin', 'manager', 'nurse', 'receptionist'],
    phiLevel: 'basic',
  },

  // Quick Actions (Static) – tenantId required for multi-tenant isolation
  quickActions: {
    layer: [CACHE_LAYERS.LOCAL_STORAGE],
    strategy: CACHE_STRATEGY.CACHE_ONLY,
    ttl: {
      localStorage: 86400,
    },
    cacheKey: ['tenantId', 'userId', 'role'],
    revalidateOn: ['user.preferences.updated'],
    requiredPermission: null,
    requiredRoles: null,
  },

  // User Preferences (system cache) – tenantId required
  userPreferences: {
    layer: [CACHE_LAYERS.MEMORY, CACHE_LAYERS.LOCAL_STORAGE],
    strategy: CACHE_STRATEGY.CACHE_FIRST,
    ttl: {
      memory: 3600,
      localStorage: 604800,
    },
    cacheKey: ['tenantId', 'userId'],
    revalidateOn: ['user.preferences.updated'],
    persist: true,
    requiredPermission: { resource: RESOURCES.SETTINGS, action: ACTIONS.READ },
    requiredRoles: ['doctor', 'clinic_admin', 'admin'],
  },
};
