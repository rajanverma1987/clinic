'use client';

/**
 * Prefetch list→detail: on hover, populate SWR cache so navigation to detail page is instant.
 * Detail pages must use the same key (appointmentKey, patientKey, prescriptionDetailKey) with useSWR
 * to consume prefetched data. Must run inside SWRConfig.
 */
import { apiClient } from '@/lib/api/client';
import {
  appointmentKey,
  patientKey,
  prescriptionDetailKey,
} from '@/lib/swr/dashboard-keys';
import { useSWRConfig } from 'swr';
import { useCallback } from 'react';

export function usePrefetchDetail() {
  const { mutate } = useSWRConfig();

  const prefetchAppointment = useCallback(
    (id) => {
      if (!id) return;
      const key = appointmentKey(id);
      apiClient
        .get(`/appointments/${id}`)
        .then((r) => (r.success && r.data ? mutate(key, r.data, { revalidate: false }) : null))
        .catch(() => {});
    },
    [mutate],
  );

  const prefetchPatient = useCallback(
    (id) => {
      if (!id) return;
      const key = patientKey(id);
      apiClient
        .get(`/patients/${id}`)
        .then((r) => (r.success && r.data ? mutate(key, r.data, { revalidate: false }) : null))
        .catch(() => {});
    },
    [mutate],
  );

  const prefetchPrescription = useCallback(
    (id) => {
      if (!id) return;
      const key = prescriptionDetailKey(id);
      apiClient
        .get(`/prescriptions/${id}`)
        .then((r) => (r.success && r.data ? mutate(key, r.data, { revalidate: false }) : null))
        .catch(() => {});
    },
    [mutate],
  );

  return { prefetchAppointment, prefetchPatient, prefetchPrescription };
}
