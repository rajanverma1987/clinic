'use client';

import React from 'react';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { useIncrementalAppointments } from '@/hooks/useIncrementalAppointments';
import { AppointmentListItem } from './AppointmentListItem';

/**
 * AppointmentsList component
 * Displays a list of appointments using incremental updates
 */
export function AppointmentsList({ appointments, loading, onRefresh, limit = 10 }) {
  const { t } = useI18n();

  if (loading && (!appointments || appointments.length === 0)) {
    return (
      <div className='flex items-center justify-center min-h-[200px]'>
        <Loader type='section' text={t('common.loading')} />
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[200px] text-center'>
        <p className='text-neutral-500 mb-4'>{t('appointments.noAppointmentsFound')}</p>
        {onRefresh && (
          <Button variant='secondary' size='sm' onClick={onRefresh}>
            {t('common.refresh')}
          </Button>
        )}
      </div>
    );
  }

  const displayAppointments = limit ? appointments.slice(0, limit) : appointments;

  return (
    <div className='appointments-list'>
      {onRefresh && (
        <div className='flex justify-end mb-3'>
          <Button variant='secondary' size='sm' onClick={onRefresh}>
            {t('common.refresh')}
          </Button>
        </div>
      )}
      <div className='space-y-2'>
        {displayAppointments.map((appointment) => (
          <AppointmentListItem
            key={appointment._id || appointment.id}
            appointment={appointment}
          />
        ))}
      </div>
      {appointments.length > limit && (
        <div className='mt-4 text-center'>
          <p className='text-sm text-neutral-500'>
            {t('common.showing')} {limit} {t('common.of')} {appointments.length}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * AppointmentsListWithHook component
 * Wrapper that uses useIncrementalAppointments hook
 */
export function AppointmentsListWithHook({ filters = {}, limit = 10 }) {
  const { appointments, loading, error, refresh } = useIncrementalAppointments({
    ...filters,
    limit,
    status: filters.status || 'scheduled',
  });

  const { t } = useI18n();

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[200px] text-center'>
        <p className='text-status-error mb-4'>{error}</p>
        <Button variant='primary' size='sm' onClick={refresh}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return <AppointmentsList appointments={appointments} loading={loading} onRefresh={refresh} limit={limit} />;
}
