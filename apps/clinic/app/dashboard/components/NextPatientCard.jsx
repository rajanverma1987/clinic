'use client';

import { ChatIcon, DocumentIcon, PhoneIcon, VideoIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';

export function NextPatientCard({
  patient,
  appointment,
  onCall,
  onViewDetails,
  onChat,
  onStartVideo,
}) {
  const { t } = useI18n();
  const isVideoAppointment = appointment?.isTelemedicine;
  const showStartVideo = isVideoAppointment && onStartVideo;
  if (!patient && !appointment) {
    return null;
  }

  const patientData = patient || appointment?.patientId;
  const firstName = patientData?.firstName || '';
  const lastName = patientData?.lastName || '';
  const patientName =
    patientData?.name || `${firstName} ${lastName}`.trim() || t('common.unknownPatient');
  const initials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase() || 'PN';

  const patientId = patientData?.patientId || patientData?._id?.slice(-12) || 'N/A';
  const dateOfBirth = patientData?.dateOfBirth
    ? new Date(patientData.dateOfBirth).toLocaleDateString()
    : 'N/A';
  const gender = patientData?.gender || 'N/A';
  const weight = patientData?.weight || 'N/A';
  const height = patientData?.height || 'N/A';
  const phone = patientData?.phone || 'N/A';
  const regDate = patientData?.createdAt
    ? new Date(patientData.createdAt).toLocaleDateString()
    : 'N/A';

  const lastAppointment = appointment?.lastAppointment
    ? new Date(appointment.lastAppointment).toLocaleDateString()
    : 'N/A';

  const reason = appointment?.reason || appointment?.type || t('common.generalConsultation');

  // Parse medical history from patient data (can be string, array, or object)
  const parseMedicalInfo = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      // Split by common delimiters (comma, semicolon, newline)
      return data.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  };
  
  // Combine medicalHistory, chronicConditions, and allergies for display
  const medicalHistory = [
    ...parseMedicalInfo(patientData?.chronicConditions),
    ...parseMedicalInfo(patientData?.medicalHistory),
    ...parseMedicalInfo(patientData?.allergies).map(a => `Allergy: ${a}`),
  ].filter(Boolean);

  return (
    <Card className='dashboard-next-patient-card'>
      <div className='p-4 h-full flex flex-col overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center gap-3 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-700'>
          <div className='w-3 h-3 bg-primary-500 rounded-full'></div>
          <h2 className='text-h4 font-semibold text-neutral-900 dark:text-neutral-100'>
            {t('dashboard.nextPatientDetails')}
          </h2>
        </div>

        {/* Patient Info — gradient hero header */}
        <div className='mb-4'>
          <div className='relative -mx-4 -mt-4 mb-4 px-4 pt-4 pb-4 rounded-t-xl overflow-hidden bg-gradient-to-br from-primary-600 to-indigo-700'>
            {/* Decorative orb */}
            <div className='absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none' />
            <div className='relative flex items-center justify-between gap-3'>
              <div className='flex items-center gap-3 flex-1 min-w-0'>
                <div className='w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border-2 border-white/30 shadow-lg'>
                  <span className='text-white font-bold text-lg'>{initials}</span>
                </div>
                <div className='flex-1 min-w-0'>
                  <h3 className='text-base font-semibold text-white leading-tight truncate'>
                    {patientName}
                  </h3>
                  <p className='text-primary-200 text-xs mt-0.5 truncate'>{reason}</p>
                </div>
              </div>
              {/* Patient ID */}
              <div className='text-right flex-shrink-0'>
                <span className='text-primary-200 text-[10px] uppercase tracking-wider block'>
                  {t('dashboard.patientIdLabel')}
                </span>
                <p className='text-white text-xs font-semibold font-mono mt-0.5'>{patientId}</p>
              </div>
            </div>
          </div>

          {/* Patient Details Grid */}
          <div className='grid grid-cols-3 gap-3 text-body-xs'>
            <div>
              <span className='text-neutral-500 dark:text-neutral-400'>D.O.B</span>
              <p className='font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5'>
                {dateOfBirth}
              </p>
            </div>
            <div>
              <span className='text-neutral-500 dark:text-neutral-400'>Sex</span>
              <p className='font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5'>
                {gender}
              </p>
            </div>
            <div>
              <span className='text-neutral-500 dark:text-neutral-400'>Weight</span>
              <p className='font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5'>
                {weight}
              </p>
            </div>
            <div>
              <span className='text-neutral-500 dark:text-neutral-400'>Last Appointment</span>
              <p className='font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5'>
                {lastAppointment}
              </p>
            </div>
            <div>
              <span className='text-neutral-500 dark:text-neutral-400'>Height</span>
              <p className='font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5'>
                {height}
              </p>
            </div>
            <div>
              <span className='text-neutral-500 dark:text-neutral-400'>Reg. Date</span>
              <p className='font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5'>
                {regDate}
              </p>
            </div>
          </div>
        </div>

        {/* Patient History */}
        <div className='mb-4'>
          <p className='text-body-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2'>
            {t('dashboard.patientHistory')}
          </p>
          {medicalHistory && medicalHistory.length > 0 ? (
            <div className='flex flex-wrap gap-2'>
              {medicalHistory.map((condition, index) => (
                <span
                  key={index}
                  className='inline-flex items-center px-2.5 py-1 rounded-md text-body-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-neutral-700/50 dark:text-neutral-300 dark:border-neutral-600'
                >
                  {typeof condition === 'object' && condition?.condition
                    ? condition.condition
                    : condition}
                </span>
              ))}
            </div>
          ) : (
            <p className='text-body-sm text-neutral-500 dark:text-neutral-400 italic'>
              {t('common.notMentioned') || 'Not mentioned'}
            </p>
          )}
        </div>

        {/* Quick Action Buttons – size sm for touch targets */}
        <div className='flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700 overflow-visible'>
          <Button
            variant='secondary'
            size='sm'
            onClick={(e) => {
              e.stopPropagation();
              onCall?.();
            }}
            title={t('dashboard.call')}
            className='flex-1 min-w-fit !overflow-visible gap-1.5'
          >
            <PhoneIcon className='icon icon-sm flex-shrink-0' />
            <span className='text-body-sm font-semibold whitespace-nowrap'>{phone}</span>
          </Button>
          <Button
            variant='secondary'
            size='sm'
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.();
            }}
            title={t('dashboard.viewDetails')}
            className='flex-1 hidden sm:inline-flex'
          >
            <DocumentIcon className='icon icon-sm' />
            <span className='text-body-sm font-semibold'>{t('dashboard.document')}</span>
          </Button>
          <Button
            variant='secondary'
            size='sm'
            iconOnly
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.();
            }}
            title={t('dashboard.viewDetails')}
            aria-label={t('dashboard.viewDetails')}
            className='sm:hidden flex-shrink-0'
          >
            <DocumentIcon className='icon icon-sm' />
          </Button>
          {showStartVideo ? (
            <>
              <Button
                variant='primary'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation();
                  onStartVideo(appointment);
                }}
                title={t('queue.startVideo')}
                className='flex-1 hidden sm:inline-flex'
              >
                <VideoIcon className='icon icon-sm' />
                <span className='text-body-sm font-semibold'>{t('queue.startVideo')}</span>
              </Button>
              <Button
                variant='primary'
                size='sm'
                iconOnly
                onClick={(e) => {
                  e.stopPropagation();
                  onStartVideo(appointment);
                }}
                title={t('queue.startVideo')}
                aria-label={t('queue.startVideo')}
                className='sm:hidden flex-shrink-0'
              >
                <VideoIcon className='icon icon-sm' />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant='secondary'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation();
                  onChat?.();
                }}
                title={t('dashboard.chat')}
                className='flex-1 hidden sm:inline-flex'
              >
                <ChatIcon className='icon icon-sm' />
                <span className='text-body-sm font-semibold'>{t('dashboard.chat')}</span>
              </Button>
              <Button
                variant='secondary'
                size='sm'
                iconOnly
                onClick={(e) => {
                  e.stopPropagation();
                  onChat?.();
                }}
                title={t('dashboard.chat')}
                aria-label={t('dashboard.chat')}
                className='sm:hidden flex-shrink-0'
              >
                <ChatIcon className='icon icon-sm' />
              </Button>
            </>
          )}
        </div>

        {/* Last Prescriptions Section */}
        <div className='mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700'>
          <p className='text-body-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2'>
            {t('dashboard.lastPrescriptions')}
          </p>
          <p className='text-body-xs text-neutral-500 dark:text-neutral-400'>
            {t('dashboard.noPrescriptionsAvailable')}
          </p>
        </div>
      </div>
    </Card>
  );
}
