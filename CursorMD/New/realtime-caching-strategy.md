# REAL-TIME ARCHITECTURE & CACHING STRATEGY

## 1. WEBSOCKET ARCHITECTURE

### Event Flow Diagram
```
Client Browser/Mobile
       ↓
   Socket.IO Client
       ↓
   Load Balancer (Sticky Sessions)
       ↓
   WebSocket Server (Node.js)
       ↓
   Redis Pub/Sub (Message Broker)
       ↓
   Multiple Server Instances
       ↓
   PostgreSQL + Redis Cache
```

### Real-Time Events to Implement

```javascript
// APPOINTMENT EVENTS
'appointment:created'      // New appointment booked
'appointment:updated'      // Appointment rescheduled/modified
'appointment:cancelled'    // Appointment cancelled
'appointment:checkin'      // Patient checked in
'appointment:completed'    // Consultation completed
'appointment:reminder'     // Automated reminder sent

// PATIENT EVENTS
'patient:registered'       // New patient added
'patient:updated'          // Patient info modified
'patient:queue_status'     // Queue position updated

// BILLING EVENTS
'payment:received'         // Payment completed
'invoice:generated'        // New invoice created
'payment:pending'          // Payment reminder

// INVENTORY EVENTS
'stock:low'               // Stock below threshold
'stock:updated'           // Stock quantity changed
'medicine:expired'        // Medicine expiring soon

// NOTIFICATION EVENTS
'notification:new'        // New notification
'notification:broadcast'  // System-wide announcement

// DASHBOARD EVENTS
'dashboard:refresh'       // Trigger dashboard refresh
'stats:updated'           // Real-time stats update
```

### WebSocket Server Implementation

```javascript
// websocket/server.js
const io = require('socket.io')(server, {
  cors: { origin: process.env.FRONTEND_URL },
  pingTimeout: 60000,
  pingInterval: 25000
});

const Redis = require('ioredis');
const redisClient = new Redis(process.env.REDIS_URL);
const redisPub = new Redis(process.env.REDIS_URL);

// Authenticate socket connection
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const user = await verifyJWT(token);
    socket.userId = user.id;
    socket.clinicId = user.clinicId;
    socket.role = user.role;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);
  
  // Join clinic-specific room
  socket.join(`clinic:${socket.clinicId}`);
  
  // Join role-specific room
  socket.join(`role:${socket.role}`);
  
  // Subscribe to Redis channels
  redisClient.subscribe(`clinic:${socket.clinicId}`, (err) => {
    if (err) console.error('Redis subscribe error:', err);
  });
  
  // Handle incoming events
  socket.on('subscribe:appointments', () => {
    socket.join(`appointments:${socket.clinicId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

// Listen to Redis pub/sub
redisClient.on('message', (channel, message) => {
  const data = JSON.parse(message);
  io.to(channel).emit(data.event, data.payload);
});

// Publish events from API
function publishEvent(clinicId, event, payload) {
  const channel = `clinic:${clinicId}`;
  const message = JSON.stringify({ event, payload });
  redisPub.publish(channel, message);
}

module.exports = { io, publishEvent };
```

### Client-Side Socket Handler

```javascript
// frontend/services/socket.js
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    this.socket = io(process.env.REACT_APP_WS_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.socket.emit('subscribe:appointments');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    this.socket?.on(event, callback);
  }

  off(event, callback) {
    this.socket?.off(event, callback);
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    this.socket?.emit(event, data);
  }

  disconnect() {
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(cb => this.socket?.off(event, cb));
    });
    this.listeners.clear();
    this.socket?.disconnect();
  }
}

export default new SocketService();
```

---

## 2. MULTI-LAYER CACHING STRATEGY

### Cache Layers

```
┌─────────────────────────────────────┐
│   Layer 1: Browser Cache            │
│   - LocalStorage (Settings, Prefs)  │
│   - SessionStorage (Temp Data)      │
│   - React Query Cache (API Data)    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Layer 2: CDN Cache                │
│   - Static Assets (Images, CSS, JS) │
│   - Public Resources                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Layer 3: Redis Cache              │
│   - Session Data                    │
│   - Frequently Accessed Data        │
│   - Query Results                   │
│   - Real-time Data                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Layer 4: Database Query Cache     │
│   - PostgreSQL Result Cache         │
│   - Materialized Views              │
└─────────────────────────────────────┘
```

### React Query Configuration

```javascript
// frontend/config/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Cache configuration per data type
      staleTime: 5 * 60 * 1000, // 5 minutes default
      cacheTime: 10 * 60 * 1000, // 10 minutes
      
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Network mode
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

// Specific cache configs
export const CACHE_CONFIGS = {
  // Critical real-time data
  appointments_today: {
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // Poll every minute
    refetchOnFocus: true,
  },
  
  // Semi-static data
  patients_list: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000,
    refetchOnFocus: false,
  },
  
  // Static reference data
  doctors_list: {
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: Infinity,
    refetchOnFocus: false,
  },
  
  // Analytics/Reports
  dashboard_stats: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000,
    refetchOnFocus: true,
  },
  
  // User preferences
  settings: {
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnMount: false,
  },
};
```

### Custom Hooks with Caching

```javascript
// hooks/useAppointments.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CACHE_CONFIGS } from '../config/queryClient';
import socketService from '../services/socket';

export function useAppointments(date) {
  const queryClient = useQueryClient();

  // Query with optimized caching
  const query = useQuery({
    queryKey: ['appointments', date],
    queryFn: () => fetchAppointments(date),
    ...CACHE_CONFIGS.appointments_today,
    
    // Optimistic updates preparation
    onSuccess: (data) => {
      // Prefetch related data
      data.forEach(apt => {
        queryClient.prefetchQuery({
          queryKey: ['patient', apt.patientId],
          queryFn: () => fetchPatient(apt.patientId),
        });
      });
    },
  });

  // Real-time updates via WebSocket
  useEffect(() => {
    const handleNewAppointment = (appointment) => {
      if (appointment.date === date) {
        queryClient.setQueryData(['appointments', date], (old) => {
          return [...(old || []), appointment];
        });
        
        // Show toast notification
        toast.success('New appointment booked');
      }
    };

    const handleUpdatedAppointment = (appointment) => {
      queryClient.setQueryData(['appointments', date], (old) => {
        return old.map(apt => 
          apt.id === appointment.id ? appointment : apt
        );
      });
    };

    socketService.on('appointment:created', handleNewAppointment);
    socketService.on('appointment:updated', handleUpdatedAppointment);

    return () => {
      socketService.off('appointment:created', handleNewAppointment);
      socketService.off('appointment:updated', handleUpdatedAppointment);
    };
  }, [date, queryClient]);

  return query;
}

// Mutation with optimistic update
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAppointment,
    
    // Optimistic update
    onMutate: async (newAppointment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['appointments', newAppointment.date]);

      // Snapshot previous value
      const previousAppointments = queryClient.getQueryData([
        'appointments',
        newAppointment.date
      ]);

      // Optimistically update
      queryClient.setQueryData(['appointments', newAppointment.date], (old) => {
        return [...(old || []), { ...newAppointment, id: 'temp-' + Date.now() }];
      });

      return { previousAppointments };
    },
    
    // On error, rollback
    onError: (err, newAppointment, context) => {
      queryClient.setQueryData(
        ['appointments', newAppointment.date],
        context.previousAppointments
      );
      toast.error('Failed to create appointment');
    },
    
    // On success, refetch to get server data
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['appointments', variables.date]);
      toast.success('Appointment created successfully');
    },
  });
}
```

### Redis Caching Strategy (Backend)

```javascript
// services/cache.service.js
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

class CacheService {
  // Cache TTL configurations (in seconds)
  static TTL = {
    APPOINTMENTS: 60,           // 1 minute
    PATIENTS: 300,             // 5 minutes
    DOCTORS: 3600,             // 1 hour
    SETTINGS: 86400,           // 24 hours
    STATS: 300,                // 5 minutes
    MEDICINES: 1800,           // 30 minutes
  };

  // Generate cache key
  static key(prefix, ...args) {
    return `${prefix}:${args.join(':')}`;
  }

  // Get from cache
  static async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Cache get error:', err);
      return null;
    }
  }

  // Set to cache
  static async set(key, value, ttl = 300) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (err) {
      console.error('Cache set error:', err);
    }
  }

  // Delete from cache
  static async del(key) {
    try {
      await redis.del(key);
    } catch (err) {
      console.error('Cache delete error:', err);
    }
  }

  // Delete by pattern
  static async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      console.error('Cache pattern delete error:', err);
    }
  }

  // Cache wrapper for database queries
  static async remember(key, ttl, callback) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await callback();
    await this.set(key, fresh, ttl);
    return fresh;
  }
}

// Usage in controllers
async function getAppointments(req, res) {
  const { clinicId, date } = req.params;
  const cacheKey = CacheService.key('appointments', clinicId, date);

  const appointments = await CacheService.remember(
    cacheKey,
    CacheService.TTL.APPOINTMENTS,
    async () => {
      return await Appointment.findAll({
        where: { clinicId, date },
        include: [Patient, Doctor],
      });
    }
  );

  res.json(appointments);
}

// Invalidate cache on updates
async function updateAppointment(req, res) {
  const { id } = req.params;
  const appointment = await Appointment.findByPk(id);
  
  await appointment.update(req.body);

  // Invalidate related caches
  await CacheService.del(
    CacheService.key('appointments', appointment.clinicId, appointment.date)
  );
  await CacheService.del(
    CacheService.key('patient', appointment.patientId)
  );

  // Publish WebSocket event
  publishEvent(appointment.clinicId, 'appointment:updated', appointment);

  res.json(appointment);
}

module.exports = CacheService;
```

### Cache Invalidation Rules

```javascript
// Cache invalidation mapping
const INVALIDATION_RULES = {
  'appointment:created': [
    'appointments:*',
    'dashboard:stats:*',
    'patient:appointments:*',
  ],
  
  'appointment:updated': [
    'appointments:*',
    'appointment:*',
  ],
  
  'patient:created': [
    'patients:*',
    'dashboard:stats:*',
  ],
  
  'payment:received': [
    'invoices:*',
    'payments:*',
    'dashboard:revenue:*',
  ],
  
  'medicine:stockUpdate': [
    'inventory:*',
    'medicines:*',
  ],
};

// Auto-invalidate on events
function setupCacheInvalidation() {
  Object.entries(INVALIDATION_RULES).forEach(([event, patterns]) => {
    socketService.on(event, async () => {
      for (const pattern of patterns) {
        await CacheService.delPattern(pattern);
      }
    });
  });
}
```

---

## 3. OFFLINE-FIRST STRATEGY

### Service Worker Implementation

```javascript
// public/service-worker.js
const CACHE_NAME = 'clinic-v1';
const OFFLINE_URL = '/offline.html';

const CACHE_ASSETS = [
  '/',
  '/offline.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/logo.png',
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_ASSETS);
    })
  );
});

// Cache strategies
self.addEventListener('fetch', (event) => {
  // Network first for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
  // Cache first for static assets
  else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

### IndexedDB for Offline Data

```javascript
// services/indexedDB.js
import { openDB } from 'idb';

const DB_NAME = 'ClinicDB';
const DB_VERSION = 1;

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('appointments')) {
        db.createObjectStore('appointments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('patients')) {
        db.createObjectStore('patients', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_mutations')) {
        db.createObjectStore('pending_mutations', { 
          keyPath: 'id',
          autoIncrement: true 
        });
      }
    },
  });
}

export async function saveToIndexedDB(storeName, data) {
  const db = await initDB();
  await db.put(storeName, data);
}

export async function getFromIndexedDB(storeName, id) {
  const db = await initDB();
  return await db.get(storeName, id);
}

export async function getAllFromIndexedDB(storeName) {
  const db = await initDB();
  return await db.getAll(storeName);
}

// Queue mutations when offline
export async function queueMutation(mutation) {
  const db = await initDB();
  await db.add('pending_mutations', {
    ...mutation,
    timestamp: Date.now(),
  });
}

// Sync pending mutations when back online
export async function syncPendingMutations() {
  const db = await initDB();
  const pending = await db.getAll('pending_mutations');
  
  for (const mutation of pending) {
    try {
      await executeMutation(mutation);
      await db.delete('pending_mutations', mutation.id);
    } catch (err) {
      console.error('Sync failed for mutation:', mutation, err);
    }
  }
}
```

---

## 4. PERFORMANCE MONITORING

### Frontend Performance Tracking

```javascript
// utils/performance.js
export function measurePerformance(metricName, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  // Log to analytics
  console.log(`${metricName}: ${(end - start).toFixed(2)}ms`);
  
  // Send to monitoring service
  if (window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: metricName,
      value: Math.round(end - start),
    });
  }
  
  return result;
}

// Track cache hit/miss ratio
export function trackCacheMetrics() {
  let hits = 0;
  let misses = 0;
  
  return {
    recordHit: () => hits++,
    recordMiss: () => misses++,
    getStats: () => ({
      hits,
      misses,
      ratio: hits / (hits + misses) || 0,
    }),
  };
}
```

### Backend Performance Monitoring

```javascript
// middleware/performance.middleware.js
const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.url} - ${duration}ms`);
    }
    
    // Send to monitoring service (e.g., DataDog, New Relic)
    if (process.env.NODE_ENV === 'production') {
      trackMetric('api_response_time', duration, {
        method: req.method,
        route: req.route?.path,
        status: res.statusCode,
      });
    }
  });
  
  next();
};
```

---

## IMPLEMENTATION CHECKLIST

✅ **WebSocket Setup**
- [ ] Install Socket.IO
- [ ] Configure Redis Pub/Sub
- [ ] Implement event handlers
- [ ] Add authentication middleware
- [ ] Test connection resilience

✅ **Caching Implementation**
- [ ] Configure React Query
- [ ] Setup Redis cache
- [ ] Implement cache invalidation
- [ ] Add LocalStorage persistence
- [ ] Setup service worker

✅ **Real-Time Features**
- [ ] Live appointment updates
- [ ] Real-time notifications
- [ ] Queue status updates
- [ ] Payment confirmations
- [ ] Dashboard live stats

✅ **Offline Support**
- [ ] Service worker registration
- [ ] IndexedDB setup
- [ ] Mutation queueing
- [ ] Background sync
- [ ] Offline UI indicators

✅ **Performance**
- [ ] Add performance monitoring
- [ ] Track cache metrics
- [ ] Optimize bundle size
- [ ] Implement code splitting
- [ ] Setup CDN for assets

✅ **Testing**
- [ ] Load testing
- [ ] Stress testing
- [ ] Cache effectiveness testing
- [ ] WebSocket connection testing
- [ ] Offline scenario testing
