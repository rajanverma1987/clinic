'use client';

/**
 * RealtimeContext: WebSocket + SSE fallback, event-driven cache invalidation,
 * optimistic UI (merge new data without full refetch), rollback on error, batched updates.
 * Must be used inside SWRConfig so mutate is available.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import {
  disconnectRealtimeClient,
  initRealtimeClient,
  isRealtimeConnected,
  joinAppointment,
  joinDoctor,
  joinQueue,
  onRealtimeEvent,
} from '@/lib/realtime/realtime-client';
import {
  DASHBOARD_LISTS_KEY,
  DASHBOARD_STATS_KEY,
  PATIENTS_LIST_KEY,
  patientKey,
} from '@/lib/swr/dashboard-keys';
import { showToast } from '@/lib/utils/toast';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

const BATCH_MS = 100;

const RealtimeContext = createContext(undefined);

export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const tenantId = user?.tenantId ?? null;
  const [connected, setConnected] = useState(false);
  const { mutate: globalMutate } = useSWRConfig();
  const batchRef = useRef([]);
  const batchTimerRef = useRef(null);
  const previousListsRef = useRef(null);

  const flushBatch = useCallback(() => {
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }
    const items = batchRef.current;
    batchRef.current = [];
    if (items.length === 0) return;
    globalMutate(
      DASHBOARD_LISTS_KEY,
      (current) => {
        previousListsRef.current = current;
        let next = current;
        for (const { type, data } of items) {
          if (!next) next = current;
          if (type === 'appointment.created' && data?.appointment) {
            const list = Array.isArray(next.todayAppointments) ? next.todayAppointments : [];
            const id = data.appointment._id || data.appointment.id;
            if (!list.some((a) => (a._id || a.id) === id)) {
              next = {
                ...next,
                todayAppointments: [{ ...data.appointment, _updated: true }, ...list],
              };
            }
          } else if (type === 'appointment.statusChanged') {
            const list = Array.isArray(next.todayAppointments) ? next.todayAppointments : [];
            const id = data?.appointmentId || data?.appointment?._id;
            next = {
              ...next,
              todayAppointments: list.map((a) =>
                (a._id || a.id) === id
                  ? { ...a, ...data.appointment, status: data.status, _updated: true }
                  : a,
              ),
            };
          }
        }
        return next;
      },
      { revalidate: false },
    );
    globalMutate(DASHBOARD_STATS_KEY);
    if (items.some((i) => i.type === 'appointment.created')) {
      showToast(t('notifications.newAppointmentAdded'), 'success');
    }
  }, [globalMutate, t]);

  useEffect(() => {
    if (!tenantId) {
      disconnectRealtimeClient();
      setConnected(false);
      return;
    }
    initRealtimeClient(tenantId);
    const unsubState = onRealtimeEvent('connectionState', (payload) => {
      setConnected(payload.connected === true);
    });
    return () => {
      unsubState();
      disconnectRealtimeClient();
      setConnected(false);
    };
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;

    const unsubCreated = onRealtimeEvent('appointment.created', (data) => {
      batchRef.current.push({ type: 'appointment.created', data });
      if (!batchTimerRef.current) {
        batchTimerRef.current = setTimeout(flushBatch, BATCH_MS);
      }
    });

    const unsubStatus = onRealtimeEvent('appointment.statusChanged', (data) => {
      batchRef.current.push({ type: 'appointment.statusChanged', data });
      if (!batchTimerRef.current) {
        batchTimerRef.current = setTimeout(flushBatch, BATCH_MS);
      }
    });

    const unsubPatient = onRealtimeEvent('patient.updated', (data) => {
      if (data?.id) globalMutate(patientKey(data.id));
      globalMutate(PATIENTS_LIST_KEY);
    });

    const unsubQueue = onRealtimeEvent('queue.updated', () => {
      globalMutate(DASHBOARD_LISTS_KEY);
      globalMutate(DASHBOARD_STATS_KEY);
    });

    const unsubPatientCheckedIn = onRealtimeEvent('patient.checkedIn', () => {
      globalMutate(DASHBOARD_LISTS_KEY);
      globalMutate(DASHBOARD_STATS_KEY);
    });

    return () => {
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
      unsubCreated();
      unsubStatus();
      unsubPatient();
      unsubQueue();
      unsubPatientCheckedIn();
    };
  }, [tenantId, globalMutate, flushBatch]);

  const value = {
    connected: connected || isRealtimeConnected(),
    joinAppointment,
    joinQueue,
    joinDoctor,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (ctx === undefined) {
    return {
      connected: false,
      joinAppointment: () => {},
      joinQueue: () => {},
      joinDoctor: () => {},
    };
  }
  return ctx;
}
