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
  const patientName = patientData?.name || `${firstName} ${lastName}`.trim() || 'Unknown Patient';
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

  const reason = appointment?.reason || appointment?.type || 'General Consultation';

  // Mock medical history - in real app, this would come from patient data
  const medicalHistory = patientData?.medicalHistory || ['Asthma', 'Hypertension'];

  return (
    <Card className='dashboard-next-patient-card'>
      <div className='p-4 h-full flex flex-col overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center gap-3 mb-4 pb-3 border-b border-neutral-200'>
          <div className='w-3 h-3 bg-primary-500 rounded-full'></div>
          <h2 className='text-h4 font-semibold text-neutral-900'>
            {t('dashboard.nextPatientDetails')}
          </h2>
        </div>

        {/* Patient Info */}
        <div className='mb-4'>
          <div className='flex items-center justify-between gap-3 mb-4'>
            <div className='flex items-center gap-3 flex-1'>
              <div className='w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 border-2 border-primary-200'>
                <span className='text-primary-600 font-semibold text-lg'>{initials}</span>
              </div>
              <div className='flex-1'>
                <h3 className='text-body-md font-semibold text-neutral-900 mb-1'>{patientName}</h3>
                <p className='text-body-xs text-neutral-600'>{reason}</p>
              </div>
            </div>
            {/* Patient ID - Right aligned */}
            <div className='text-right flex-shrink-0'>
              <span className='text-body-xs text-neutral-500 block'>
                {t('dashboard.patientIdLabel')}
              </span>
              <p className='text-body-xs font-semibold text-neutral-900 mt-0.5'>{patientId}</p>
            </div>
          </div>

          {/* Patient Details Grid */}
          <div className='grid grid-cols-3 gap-3 text-body-xs'>
            <div>
              <span className='text-neutral-500'>D.O.B</span>
              <p className='font-semibold text-neutral-900 mt-0.5'>{dateOfBirth}</p>
            </div>
            <div>
              <span className='text-neutral-500'>Sex</span>
              <p className='font-semibold text-neutral-900 mt-0.5'>{gender}</p>
            </div>
            <div>
              <span className='text-neutral-500'>Weight</span>
              <p className='font-semibold text-neutral-900 mt-0.5'>{weight}</p>
            </div>
            <div>
              <span className='text-neutral-500'>Last Appointment</span>
              <p className='font-semibold text-neutral-900 mt-0.5'>{lastAppointment}</p>
            </div>
            <div>
              <span className='text-neutral-500'>Height</span>
              <p className='font-semibold text-neutral-900 mt-0.5'>{height}</p>
            </div>
            <div>
              <span className='text-neutral-500'>Reg. Date</span>
              <p className='font-semibold text-neutral-900 mt-0.5'>{regDate}</p>
            </div>
          </div>
        </div>

        {/* Patient History */}
        {medicalHistory && medicalHistory.length > 0 && (
          <div className='mb-4'>
            <p className='text-body-sm font-semibold text-neutral-900 mb-2'>
              {t('dashboard.patientHistory')}
            </p>
            <div className='flex flex-wrap gap-2'>
              {medicalHistory.map((condition, index) => {
                const isActive = index === 1;
                return (
                  <Button
                    key={index}
                    variant={isActive ? 'primary' : 'outline'}
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails?.();
                    }}
                  >
                    {condition}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Action Buttons – size sm for touch targets */}
        <div className='flex items-center gap-2 pt-3 border-t border-neutral-200'>
          <Button
            variant='secondary'
            size='sm'
            onClick={(e) => {
              e.stopPropagation();
              onCall?.();
            }}
            title={t('dashboard.call')}
            className='flex-1'
          >
            <PhoneIcon className='icon icon-sm' />
            <span className='text-body-sm font-semibold'>{phone}</span>
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
        <div className='mt-4 pt-3 border-t border-neutral-200'>
          <p className='text-body-sm font-semibold text-neutral-900 mb-2'>
            {t('dashboard.lastPrescriptions')}
          </p>
          <p className='text-body-xs text-neutral-500'>{t('dashboard.noPrescriptionsAvailable')}</p>
        </div>
      </div>
    </Card>
  );
}
