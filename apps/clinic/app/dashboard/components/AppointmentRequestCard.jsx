'use client';

import { ChatIcon, CheckIcon, ChevronRightIcon, XIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';

export function AppointmentRequestCard({
  requests = [],
  onAccept,
  onDecline,
  onMessage,
  onSeeAll,
  loading = false,
}) {
  const { t } = useI18n();

  if (loading) {
    return (
      <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col'>
        <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0'>
          <div className='flex items-center gap-2 mb-4'>
            <div className='skeleton w-1 h-4 rounded-full shrink-0' />
            <div className='skeleton skeleton-text w-36' />
          </div>
          <div className='space-y-2'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='skeleton rounded-lg' style={{ height: '60px' }} />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className='dashboard-list-card dashboard-list-card-primary'>
      <div className='relative z-10 p-4 flex-1 flex flex-col'>
        {/* Header */}
        <div className='section-header'>
          <div className='accent-bar accent-bar-primary' />
          <h2 className='section-title'>{t('dashboard.appointmentRequest')}</h2>
        </div>

        {/* Requests List */}
        <div className='flex-1 overflow-y-auto'>
          {requests && requests.length > 0 ? (
            <div className='space-y-2'>
              {requests.map((request, index) => {
                const patient = request.patientId || request;
                const firstName = patient?.firstName || '';
                const lastName = patient?.lastName || '';
                const patientName =
                  patient?.name || `${firstName} ${lastName}`.trim() || t('common.unknownPatient');
                const initials =
                  `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase() || 'PN';
                const reason = request.reason || request.type || t('common.generalConsultation');

                return (
                  <div
                    key={request._id || request.id || index}
                    className='dashboard-appointment-item'
                  >
                    <div className='flex items-center gap-3'>
                      {/* Patient Avatar */}
                      <div className='w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 border-2 border-primary-200'>
                        <span className='text-primary-600 font-semibold text-xs'>{initials}</span>
                      </div>

                      {/* Content */}
                      <div className='flex-1 min-w-0'>
                        <h4 className='text-body-sm font-semibold text-neutral-900 mb-0.5 truncate'>
                          {patientName}
                        </h4>
                        <p className='text-body-xs text-neutral-600 truncate'>{reason}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className='flex items-center gap-2 flex-shrink-0'>
                        <Button
                          variant='success'
                          size='xs'
                          iconOnly
                          onClick={(e) => {
                            e.stopPropagation();
                            onAccept?.(request);
                          }}
                          title={t('common.accept')}
                          aria-label={t('common.accept')}
                        >
                          <CheckIcon className='icon icon-xs' />
                        </Button>
                        <Button
                          variant='danger'
                          size='xs'
                          iconOnly
                          onClick={(e) => {
                            e.stopPropagation();
                            onDecline?.(request);
                          }}
                          title={t('common.decline')}
                          aria-label={t('common.decline')}
                        >
                          <XIcon className='icon icon-xs' />
                        </Button>
                        <Button
                          variant='secondary'
                          size='xs'
                          iconOnly
                          onClick={(e) => {
                            e.stopPropagation();
                            onMessage?.(request);
                          }}
                          title={t('common.message')}
                          aria-label={t('common.message')}
                        >
                          <ChatIcon className='icon icon-xs' />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className='empty-state'>
              <p className='text-neutral-500 text-body-sm'>
                {t('dashboard.noAppointmentRequests')}
              </p>
            </div>
          )}
        </div>

        {/* See All Link - positioned at bottom */}
        {requests && requests.length > 0 && (
          <div className='pt-3 border-t border-neutral-200 dark:border-neutral-700 mt-auto'>
            <button
              type='button'
              onClick={() => {
                if (onSeeAll) onSeeAll();
                else window.location.href = '/appointments?status=pending';
              }}
              className='w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 text-sm font-medium group'
              aria-label={t('dashboard.seeAll')}
            >
              <span>{t('dashboard.seeAll')}</span>
              <ChevronRightIcon
                className='icon icon-xs group-hover:translate-x-0.5 transition-transform'
                ariaHidden
              />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
