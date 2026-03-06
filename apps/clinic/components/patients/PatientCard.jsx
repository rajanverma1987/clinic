'use client';

import { DocumentIcon } from '@/components/icons/DocumentIcon';
import { MailIcon } from '@/components/icons/MailIcon';
import { PencilIcon } from '@/components/icons/PencilIcon';
import { UserIcon } from '@/components/icons/UserIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';
import { getEmailDisplayValue } from '@/lib/utils/email-display';
import { getPatientDisplayName } from '@/lib/utils/patient-display-name';
import { useRouter } from 'next/navigation';

/**
 * Patient card for list view: demographics, last visit, total visits, conditions, active Rx, allergies, last lab.
 * View action is an icon-only button in the top-right; optional doctor actions (message, notes) as icons.
 */
export function PatientCard({ patient, isDoctor }) {
  const { t, locale } = useI18n();
  const localeCode = (locale || 'en').toString().slice(0, 2);
  const router = useRouter();
  const dateLocale =
    localeCode === 'ar' ? 'ar' : localeCode === 'es' ? 'es' : undefined;
  const na = t('common.na');

  const name = getPatientDisplayName(patient, localeCode, t) || na;
  const dob = patient.dateOfBirth
    ? new Date(patient.dateOfBirth).toLocaleDateString(dateLocale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : na;
  const lastVisit = patient.lastVisitDate
    ? new Date(patient.lastVisitDate).toLocaleDateString(dateLocale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : na;
  const totalVisits = patient.appointmentCount ?? na;
  const conditions =
    patient.conditionsSummary ||
    (patient.chronicConditions?.length ? patient.chronicConditions.join(', ') : null) ||
    na;
  const activeRx = patient.activePrescriptionsCount ?? na;
  const allergies =
    patient.allergiesSummary ||
    (Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies) ||
    na;
  const lastLab = patient.lastLabDate
    ? new Date(patient.lastLabDate).toLocaleDateString(dateLocale, {
        year: 'numeric',
        month: 'short',
      })
    : na;

  const recordPath = isDoctor ? `/doctors/patients/${patient._id}` : `/patients/${patient._id}`;

  const handleCardClick = () => router.push(recordPath);

  return (
    <Card className='patient-card group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900/50 dark:hover:border-neutral-600'>
      {/* Top-right: icon-only actions */}
      <div
        className='absolute right-3 top-3 flex items-center gap-1'
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant='ghost'
          size='sm'
          onClick={handleCardClick}
          className='patient-card__action h-8 w-8 min-w-8 rounded-lg p-0'
          title={t('patients.viewRecord')}
          aria-label={t('patients.viewRecord')}
        >
          <DocumentIcon className='icon icon-sm' ariaHidden />
        </Button>
        {isDoctor && (
          <>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => router.push('/doctors/messages')}
              className='patient-card__action h-8 w-8 min-w-8 rounded-lg p-0'
              title={t('patients.message')}
              aria-label={t('patients.message')}
            >
              <MailIcon className='icon icon-sm' ariaHidden />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => router.push(`${recordPath}?tab=notes`)}
              className='patient-card__action h-8 w-8 min-w-8 rounded-lg p-0'
              title={t('patients.addNotes')}
              aria-label={t('patients.addNotes')}
            >
              <PencilIcon className='icon icon-sm' ariaHidden />
            </Button>
          </>
        )}
      </div>

      <div
        className='flex cursor-pointer flex-col gap-4 pr-10'
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        role='button'
        tabIndex={0}
      >
        <div className='flex items-start gap-3'>
          <div className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40'>
            <UserIcon className='icon icon-lg text-primary-600 dark:text-primary-400' />
          </div>
          <div className='min-w-0 flex-1'>
            <h3 className='truncate font-semibold text-neutral-900 dark:text-neutral-100'>
              {name}
            </h3>
            <p className='text-body-xs text-neutral-500 dark:text-neutral-400'>
              ID: {patient.patientId || patient._id?.slice(-8) || na}
            </p>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-x-4 gap-y-2 text-body-xs'>
          <span className='text-neutral-500 dark:text-neutral-400'>{t('patients.phone')}:</span>
          <span className='truncate text-neutral-700 dark:text-neutral-300'>
            {patient.phone || na}
          </span>
          <span className='text-neutral-500 dark:text-neutral-400'>{t('patients.email')}:</span>
          <span className='truncate text-neutral-700 dark:text-neutral-300'>
            {patient.email ? getEmailDisplayValue(patient.email, localeCode) : na}
          </span>
          <span className='text-neutral-500 dark:text-neutral-400'>
            {t('patients.dateOfBirth')}:
          </span>
          <span className='text-neutral-700 dark:text-neutral-300'>{dob}</span>
          <span className='text-neutral-500 dark:text-neutral-400'>{t('patients.lastVisit')}:</span>
          <span className='text-neutral-700 dark:text-neutral-300'>{lastVisit}</span>
          <span className='text-neutral-500 dark:text-neutral-400'>
            {t('patients.totalVisits')}:
          </span>
          <span className='text-neutral-700 dark:text-neutral-300'>{totalVisits}</span>
          <span className='text-neutral-500 dark:text-neutral-400'>
            {t('patients.conditions')}:
          </span>
          <span className='truncate text-neutral-700 dark:text-neutral-300' title={conditions}>
            {conditions}
          </span>
          <span className='text-neutral-500 dark:text-neutral-400'>{t('patients.activeRx')}:</span>
          <span className='text-neutral-700 dark:text-neutral-300'>{activeRx}</span>
          <span className='text-neutral-500 dark:text-neutral-400'>{t('patients.allergies')}:</span>
          <span className='truncate text-neutral-700 dark:text-neutral-300' title={allergies}>
            {allergies}
          </span>
          <span className='text-neutral-500 dark:text-neutral-400'>{t('patients.lastLab')}:</span>
          <span className='text-neutral-700 dark:text-neutral-300'>{lastLab}</span>
        </div>
      </div>
    </Card>
  );
}
