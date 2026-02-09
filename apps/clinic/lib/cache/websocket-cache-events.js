/**
 * Single source of truth: WebSocket event (colon) -> cache invalidation event(s) (dot).
 * Used by lib/cache/websocket-sync.js and referenced in lib/constants/dashboard-structure.js.
 */

export const WEBSOCKET_TO_CACHE_EVENT_MAP = {
  'appointment:created': 'appointment.created',
  'appointment:updated': 'appointment.updated',
  'appointment:cancelled': 'appointment.cancelled',
  'appointment:completed': 'appointment.completed',
  'appointment:checkin': 'appointment.checkin',
  'queue:updated': 'queue.updated',
  'queue:statusChange': 'queue.statusChange',
  'invoice:paid': 'invoice.paid',
  'payment:received': 'payment.received',
  'invoice:generated': 'invoice.created',
  'patient:registered': 'patient.created',
  'patient:updated': 'patient.updated',
  'stock:low': 'inventory.lowStock',
  'stock:updated': 'inventory.updated',
  'medicine:expired': 'inventory.expirySoon',
  'dashboard:refresh': 'any',
  'stats:updated': 'appointment.updated',
};
