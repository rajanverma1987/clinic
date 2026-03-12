/**
 * WebSocket cache synchronization: on real-time events, invalidate dashboard cache
 * so useDashboardCache revalidates. Uses WEBSOCKET_TO_CACHE_EVENT_MAP (single source of truth).
 */

import { dashboardCacheManager as cacheManager } from './dashboard-cache-manager.js';
import { WEBSOCKET_TO_CACHE_EVENT_MAP } from './websocket-cache-events.js';

function getSocketUrl() {
  if (typeof window === 'undefined') return '';
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (envUrl && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(envUrl)) {
    try {
      return new URL(envUrl).origin;
    } catch (_) {
      return window.location.origin;
    }
  }
  return window.location.origin;
}

class WebSocketCacheSync {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(tenantId, userId) {
    if (typeof window === 'undefined') return;
    import('socket.io-client')
      .then(({ io }) => {
        const url = getSocketUrl();
        this.socket = io(url, {
          path: '/realtime',
          query: { tenantId, userId },
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        });
        this.setupListeners();
      })
      .catch(() => {
        // socket.io-client not available or init failed
      });
  }

  setupListeners() {
    if (!this.socket) return;
    for (const [socketEvent, cacheEvent] of Object.entries(WEBSOCKET_TO_CACHE_EVENT_MAP)) {
      this.socket.on(socketEvent, (data) => {
        cacheManager.emit(cacheEvent, data || {});
      });
    }

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
    });
    this.socket.on('disconnect', () => {});
    this.socket.on('error', () => {});
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const wsCacheSync = new WebSocketCacheSync();
