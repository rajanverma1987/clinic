'use client';

import { apiClient } from '@/lib/api/client';
import { useEffect, useRef } from 'react';
import { useSWRConfig } from 'swr';

const PREFETCH_DELAY_MS = 500;

/**
 * Build SWR key and fetcher for a patient-detail tab.
 * Keys must match if the page uses useSWR for tab data (so prefetched data is consumed).
 */
function getTabFetcher(tabId, patientId) {
  switch (tabId) {
    case 'overview':
      return {
        key: ['patient', patientId],
        fetcher: () =>
          apiClient.get(`/patients/${patientId}`).then((r) => (r.success ? r.data : null)),
      };
    case 'visits':
      return {
        key: ['patient-tab', patientId, 'appointments'],
        fetcher: () =>
          apiClient
            .get(`/appointments?patientId=${patientId}&limit=100`)
            .then((r) =>
              r.success && r.data ? (Array.isArray(r.data) ? r.data : r.data.data || []) : [],
            ),
      };
    case 'prescriptions':
      return {
        key: ['patient-tab', patientId, 'prescriptions'],
        fetcher: () =>
          apiClient
            .get(`/prescriptions?patientId=${patientId}&limit=100`)
            .then((r) =>
              r.success && r.data ? (Array.isArray(r.data) ? r.data : r.data.data || []) : [],
            ),
      };
    case 'invoices':
      return {
        key: ['patient-tab', patientId, 'invoices'],
        fetcher: () =>
          apiClient
            .get(`/invoices?patientId=${patientId}&limit=100`)
            .then((r) =>
              r.success && r.data ? (Array.isArray(r.data) ? r.data : r.data.data || []) : [],
            ),
      };
    case 'lab-tests':
      return {
        key: ['patient-tab', patientId, 'lab'],
        fetcher: () =>
          apiClient.get(`/prescriptions?patientId=${patientId}&limit=100`).then((r) => {
            if (!r.success || !r.data) return [];
            const pres = Array.isArray(r.data) ? r.data : r.data.data || [];
            return pres.flatMap((p) =>
              (p.items || [])
                .filter((i) => i.itemType === 'lab')
                .map((i) => ({
                  _id: i.labTestName || '',
                  testName: i.labTestName || '',
                  testCode: '',
                  createdAt: (p.createdAt && new Date(p.createdAt).toISOString()) || '',
                  status: 'pending',
                })),
            );
          }),
      };
    case 'notes':
      return {
        key: ['patient-tab', patientId, 'notes'],
        fetcher: () =>
          apiClient
            .get(`/clinical-notes?patientId=${patientId}&limit=100`)
            .then((r) =>
              r.success && r.data
                ? Array.isArray(r.data)
                  ? r.data
                  : r.data.data || r.data.docs || []
                : [],
            ),
      };
    default:
      return null;
  }
}

/**
 * Prefetch adjacent patient-detail tabs so switching tabs feels instant.
 * Uses SWR cache: populate cache for next/prev tab after a short delay.
 * Must run inside SWRConfig. Pass the same tab list and patientId as the page.
 *
 * @param {string} currentTab - Active tab id
 * @param {{ id: string }[]} allTabs - Full list of tab configs (e.g. PATIENT_DETAIL_TABS.tabs)
 * @param {string} [patientId] - Patient id (required for prefetch)
 */
export function usePrefetchTabs(currentTab, allTabs, patientId) {
  const { mutate } = useSWRConfig();
  const prefetchedRef = useRef(new Set([currentTab]));

  useEffect(() => {
    if (!patientId || !allTabs?.length) return;

    const currentIndex = allTabs.findIndex((t) => t.id === currentTab);
    const nextTab = allTabs[currentIndex + 1];
    const prevTab = allTabs[currentIndex - 1];

    const timer = setTimeout(() => {
      [nextTab, prevTab].filter(Boolean).forEach((tab) => {
        if (!prefetchedRef.current.has(tab.id)) {
          const config = getTabFetcher(tab.id, patientId);
          if (config) {
            mutate(config.key, config.fetcher(), {
              revalidate: false,
              revalidateIfStale: false,
            });
            prefetchedRef.current.add(tab.id);
          }
        }
      });
    }, PREFETCH_DELAY_MS);

    return () => clearTimeout(timer);
  }, [currentTab, allTabs, patientId, mutate]);
}
