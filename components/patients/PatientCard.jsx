'use client';

import { CalendarIcon, DocumentIcon, MailIcon, UserIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter } from 'next/navigation';

/**
 * Patient card for list view: demographics, last visit, total visits, conditions, active Rx, allergies, last lab, actions.
 * Optional enriched fields (lastVisitDate, appointmentCount, etc.) when API provides them.
 */
export function PatientCard({ patient, isDoctor }) {
  const { t } = useI18n();
  const router = useRouter();

  const name = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || '—';
  const dob = patient.dateOfBirth
    ? new Date(patient.dateOfBirth).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';
  const lastVisit = patient.lastVisitDate
    ? new Date(patient.lastVisitDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';
  const totalVisits = patient.appointmentCount ?? '—';
  const conditions =
    patient.conditionsSummary ||
    (patient.chronicConditions?.length ? patient.chronicConditions.join(', ') : null) ||
    '—';
  const activeRx = patient.activePrescriptionsCount ?? '—';
  const allergies =
    patient.allergiesSummary ||
    (Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies) ||
    '—';
  const lastLab = patient.lastLabDate
    ? new Date(patient.lastLabDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
      })
    : '—';

  const recordPath = isDoctor ? `/doctors/patients/${patient._id}` : `/patients/${patient._id}`;

  return (
    <Card
      className='p-4 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer'
      onClick={() => router.push(recordPath)}
    >
      <div className='flex flex-col gap-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-3 min-w-0'>
            <div className='w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0'>
              <UserIcon className='icon icon-lg text-primary-600' />
            </div>
            <div className='min-w-0'>
              <h3 className='font-semibold text-neutral-900 truncate'>{name}</h3>
              <p className='text-body-xs text-neutral-600'>
                ID: {patient.patientId || patient._id?.slice(-8) || '—'}
              </p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-x-4 gap-y-1 text-body-xs text-neutral-700'>
          <span className='text-neutral-500'>{t('patients.phone')}:</span>
          <span className='truncate'>{patient.phone || '—'}</span>
          <span className='text-neutral-500'>{t('patients.email')}:</span>
          <span className='truncate'>{patient.email || '—'}</span>
          <span className='text-neutral-500'>{t('patients.dateOfBirth')}:</span>
          <span>{dob}</span>
          <span className='text-neutral-500'>{t('patients.lastVisit')}:</span>
          <span>{lastVisit}</span>
          <span className='text-neutral-500'>{t('patients.totalVisits')}:</span>
          <span>{totalVisits}</span>
          <span className='text-neutral-500'>{t('patients.conditions')}:</span>
          <span className='truncate' title={conditions}>
            {conditions}
          </span>
          <span className='text-neutral-500'>{t('patients.activeRx')}:</span>
          <span>{activeRx}</span>
          <span className='text-neutral-500'>{t('patients.allergies')}:</span>
          <span className='truncate' title={allergies}>
            {allergies}
          </span>
          <span className='text-neutral-500'>{t('patients.lastLab')}:</span>
          <span>{lastLab}</span>
        </div>

        <div
          className='flex flex-wrap gap-2 pt-2 border-t border-neutral-200'
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant='secondary'
            size='sm'
            onClick={() => router.push(recordPath)}
            className='whitespace-nowrap'
          >
            <DocumentIcon className='icon icon-xs' ariaHidden />
            {t('patients.viewRecord')}
          </Button>
          <Button
            variant='secondary'
            size='sm'
            onClick={() => router.push(`/appointments/new?patientId=${patient._id}`)}
            className='whitespace-nowrap'
          >
            <CalendarIcon className='icon icon-xs' ariaHidden />
            {t('appointments.bookAppointment')}
          </Button>
          {isDoctor && (
            <>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => router.push('/doctors/messages')}
                className='whitespace-nowrap'
              >
                <MailIcon className='icon icon-xs' ariaHidden />
                {t('patients.message')}
              </Button>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => router.push(`${recordPath}?tab=notes`)}
                className='whitespace-nowrap'
              >
                {t('patients.addNotes')}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
