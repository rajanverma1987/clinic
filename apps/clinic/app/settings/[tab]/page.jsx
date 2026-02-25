'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { SettingsPageContent } from '../SettingsPageContent';

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
];

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

  return <SettingsPageContent />;
}
