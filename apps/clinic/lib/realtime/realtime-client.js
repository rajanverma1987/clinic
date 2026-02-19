/**
 * Enterprise real-time client: WebSocket (Socket.IO) with heartbeat, auto-reconnect,
 * and SSE fallback when WebSocket is unavailable.
 *
 * socket.io-client is lazy-loaded on first connection so it is NOT bundled
 * into the main JS chunk for pages that never open a socket (e.g. login, public pages).
 */

let _ioLoader = null;
function loadIo() {
  if (!_ioLoader) _ioLoader = import('socket.io-client').then((m) => m.io);
  return _ioLoader;
}

const HEARTBEAT_INTERVAL_MS = 25000;
const HEARTBEAT_TIMEOUT_MS = 10000;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const RECONNECT_MAX_ATTEMPTS = 10;

let socketInstance = null;
let heartbeatTimer = null;
let heartbeatTimeout = null;
let reconnectAttempts = 0;
let sseEventSource = null;
let currentTenantId = null;
let eventHandlers = new Map();
let useSSEFallback = false;

function getSocketUrl() {
  if (typeof window === 'undefined') return '';
  return process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
}

function clearHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (heartbeatTimeout) {
    clearTimeout(heartbeatTimeout);
    heartbeatTimeout = null;
  }
}

function startHeartbeat(socket) {
  clearHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (!socket.connected) return;
    let responded = false;
    const pingStart = Date.now();
    heartbeatTimeout = setTimeout(() => {
      if (!responded) {
        socket.conn.close();
      }
    }, HEARTBEAT_TIMEOUT_MS);
    socket.emit('ping', () => {
      responded = true;
      trackPingLatency(Date.now() - pingStart);
      if (heartbeatTimeout) {
        clearTimeout(heartbeatTimeout);
        heartbeatTimeout = null;
      }
    });
  }, HEARTBEAT_INTERVAL_MS);
}

function emitToHandlers(event, data) {
  const fns = eventHandlers.get(event);
  if (fns) {
    fns.forEach((fn) => {
      try {
        fn(data);
      } catch (_e) {
        // Handler error
      }
    });
  }
  const all = eventHandlers.get('*');
  if (all) {
    all.forEach((fn) => {
      try {
        fn({ event, data });
      } catch (_e) {
        // Wildcard handler error
      }
    });
  }
}

function connectSSE(tenantId) {
  if (sseEventSource) {
    sseEventSource.close();
    sseEventSource = null;
  }
  const base = getSocketUrl();
  const url = base.startsWith('http')
    ? base
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${base}`;
  const sseUrl = `${url.replace(/\/$/, '')}/api/sse?tenantId=${encodeURIComponent(tenantId || '')}`;
  try {
    const es = new EventSource(sseUrl);
    sseEventSource = es;
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        const { event: e, data: d } = payload;
        if (e && d) emitToHandlers(e, d);
      } catch (_) {}
    };
    es.onerror = () => {
      es.close();
      sseEventSource = null;
    };
  } catch (_e) {
    // SSE fallback failed
  }
}

function disconnectSSE() {
  if (sseEventSource) {
    sseEventSource.close();
    sseEventSource = null;
  }
}

async function connectSocket(tenantId) {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
  const io = await loadIo();
  const url = getSocketUrl();
  const socket = io(`${url}/realtime`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: RECONNECT_MAX_ATTEMPTS,
    reconnectionDelay: RECONNECT_BASE_MS,
    reconnectionDelayMax: RECONNECT_MAX_MS,
    timeout: 20000,
  });

  socketInstance = socket;

  socket.on('connect', () => {
    reconnectAttempts = 0;
    clearHeartbeat();
    startHeartbeat(socket);
    if (tenantId) {
      socket.emit('join-tenant', tenantId);
      socket.emit('subscribe:appointments');
      socket.emit('subscribe:dashboard-events');
    }
    if (useSSEFallback) {
      disconnectSSE();
      useSSEFallback = false;
    }
    emitToHandlers('connectionState', { connected: true, via: 'websocket' });
  });

  socket.on('disconnect', (reason) => {
    clearHeartbeat();
    trackDisconnect();
    emitToHandlers('connectionState', { connected: false, reason });
    if (reason === 'io server disconnect' || reason === 'io client disconnect') return;
    reconnectAttempts += 1;
    if (reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
      useSSEFallback = true;
      connectSSE(tenantId);
      emitToHandlers('connectionState', { connected: true, via: 'sse' });
    }
  });

  socket.on('connect_error', () => {
    reconnectAttempts += 1;
    if (reconnectAttempts >= RECONNECT_MAX_ATTEMPTS && !sseEventSource) {
      useSSEFallback = true;
      connectSSE(tenantId);
      emitToHandlers('connectionState', { connected: true, via: 'sse' });
    }
  });

  // CursorMD/New realtime-caching-strategy.md: colon-format events
  const specEvents = [
    'appointment:created',
    'appointment:updated',
    'appointment:cancelled',
    'appointment:checkin',
    'appointment:completed',
    'appointment:reminder',
    'patient:registered',
    'patient:updated',
    'patient:queue_status',
    'payment:received',
    'invoice:generated',
    'payment:pending',
    'notification:new',
    'notification:broadcast',
    'dashboard:refresh',
    'stats:updated',
    'dashboard-events',
    'payment:failed',
  ];
  const legacyEvents = [
    'appointment.created',
    'appointment.statusChanged',
    'queue.updated',
    'patient.checkedIn',
    'patient.updated',
    'doctor.statusChanged',
    'prescription.ready',
    'labResult.ready',
    'payment.received',
    'notification.new',
    'notification.updated',
  ];
  [...specEvents, ...legacyEvents].forEach((event) => {
    socket.on(event, (data) => {
      emitToHandlers(event, data);
    });
  });
}

/**
 * Initialize realtime client and join tenant. Call once when user is known (e.g. after login).
 * @param {string} tenantId
 */
export function initRealtimeClient(tenantId) {
  if (typeof window === 'undefined') return;
  currentTenantId = tenantId;
  useSSEFallback = false;
  reconnectAttempts = 0;
  connectSocket(tenantId);
}

/**
 * Disconnect and clear state. Call on logout.
 */
export function disconnectRealtimeClient() {
  if (typeof window === 'undefined') return;
  clearHeartbeat();
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
  disconnectSSE();
  currentTenantId = null;
  useSSEFallback = false;
  reconnectAttempts = 0;
  emitToHandlers('connectionState', { connected: false });
}

/**
 * Subscribe to realtime events.
 * @param {string} event - e.g. 'appointment.created', 'patient.updated', or '*' for all
 * @param {(data: any) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onRealtimeEvent(event, handler) {
  if (!eventHandlers.has(event)) eventHandlers.set(event, new Set());
  eventHandlers.get(event).add(handler);
  return () => {
    const set = eventHandlers.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) eventHandlers.delete(event);
    }
  };
}

/**
 * Join appointment room for granular updates.
 * @param {string} appointmentId
 */
export function joinAppointment(appointmentId) {
  if (socketInstance?.connected && appointmentId) {
    socketInstance.emit('join-appointment', appointmentId);
  }
}

/**
 * Join queue room.
 * @param {string} queueId
 */
export function joinQueue(queueId) {
  if (socketInstance?.connected && queueId) {
    socketInstance.emit('join-queue', queueId);
  }
}

/**
 * Join doctor room.
 * @param {string} doctorId
 */
export function joinDoctor(doctorId) {
  if (socketInstance?.connected && doctorId) {
    socketInstance.emit('join-doctor', doctorId);
  }
}

export function getCurrentTenantId() {
  return currentTenantId;
}

export function isRealtimeConnected() {
  return (socketInstance && socketInstance.connected) || !!sseEventSource;
}

/** Connection quality: last ping latency (ms), disconnect count (for monitoring) */
const connectionQuality = { lastPingLatencyMs: null, disconnectCount: 0 };

export function getConnectionQuality() {
  return { ...connectionQuality };
}

export function trackDisconnect() {
  connectionQuality.disconnectCount += 1;
}

export function trackPingLatency(ms) {
  connectionQuality.lastPingLatencyMs = ms;
}
