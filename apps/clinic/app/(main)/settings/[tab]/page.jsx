'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

const VALID_TABS = [
  'profile',
  'general',
  'compliance',
  'doctors',
  'hours',
  'queue',
  'tax',
  'smtp',
  'holidays',
  'consent',
];

/**
 * Content for these tabs is rendered by settings layout (SettingsPageContent) so it stays
 * mounted when switching tabs = fast. This page returns null to avoid double-render.
 */
export default function SettingsTabPage({ params }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const tab = resolvedParams?.tab || 'general';

  useEffect(() => {
    if (!VALID_TABS.includes(tab)) {
      router.replace('/settings/general');
    }
  }, [tab, router]);

  if (!VALID_TABS.includes(tab)) {
    return null;
  }

  return null;
}
