'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SessionSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useI18n();
  const sessionId = params.id;
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await apiClient.get(`/telemedicine/sessions/${sessionId}`);
      if (response.success && response.data) {
        setSession(response.data);
        // Check if patient has already rated
        if (response.data.review) {
          setRating(response.data.review.rating || 0);
          setReview(response.data.review.reviewText || '');
        } else {
          setShowRating(true);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      showError(t('telemedicine.selectRating'));
      return;
    }
    try {
      setSubmittingRating(true);
      const response = await apiClient.post(`/telemedicine/sessions/${sessionId}/review`, {
        rating,
        reviewText: review,
      });
      if (response.success) {
        showSuccess(t('telemedicine.thankYouFeedback'));
        setShowRating(false);
        fetchSession();
      } else {
        showError(t('telemedicine.failedToSubmitRating'));
      }
    } catch (err) {
      showError(t('telemedicine.failedToSubmitRating'));
    } finally {
      setSubmittingRating(false);
    }
  };

  const downloadSummary = () => {
    // Generate and download consultation summary PDF
    const summaryContent = `
${t('telemedicine.consultationSummary')}
${t('telemedicine.sessionId')}: ${session.sessionId}
${t('common.date')}: ${new Date(session.scheduledStartTime).toLocaleString()}
${t('telemedicine.durationLabel')}: ${session.duration ?? t('common.na')} ${t('queue.minutes')}

${t('telemedicine.patient')}: ${session.patientId?.firstName} ${session.patientId?.lastName}
${t('telemedicine.doctor')}: ${t('telemedicine.doctorPrefix')} ${session.doctorId?.firstName} ${session.doctorId?.lastName}

${session.notes ? `${t('telemedicine.clinicalNotes')}:\n${session.notes}\n\n` : ''}
${session.diagnosis ? `${t('telemedicine.diagnosis')}:\n${session.diagnosis}\n\n` : ''}
${t('telemedicine.connectionQuality')}: ${session.connectionQuality || t('common.na')}
    `.trim();

    const blob = new Blob([summaryContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consultation-summary-${session.sessionId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <Loader type='page' text={t('common.loading')} />;
  }

  if (!session) {
    return (
      <Layout>
        <Card>
          <div className='p-8 text-center'>
            <p className='text-neutral-600'>{t('telemedicine.sessionNotFound')}</p>
            <Button href='/telemedicine' className='mt-4'>
              {t('telemedicine.backToSessions')}
            </Button>
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '0 10px' }}>
        <div className='mb-8' style={{ paddingTop: '10px' }}>
          <Button variant='secondary' size='md' href='/telemedicine' className='mb-4'>
            ← {t('telemedicine.backToSessions')}
          </Button>
          <h1 className='text-3xl font-bold text-neutral-900'>
            {t('telemedicine.consultationSummary')}
          </h1>
          <p className='text-neutral-600 mt-2'>
            {t('telemedicine.sessionId')} {session.sessionId}
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Summary */}
          <Card className='lg:col-span-2'>
            <h2 className='text-xl font-semibold mb-6'>{t('telemedicine.sessionDetails')}</h2>

            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm text-neutral-600'>{t('telemedicine.patient')}</label>
                  <p className='font-medium text-neutral-900'>
                    {session.patientId.firstName} {session.patientId.lastName}
                    <span className='text-neutral-500 text-sm ml-2'>
                      ({session.patientId.patientId})
                    </span>
                  </p>
                </div>

                <div>
                  <label className='text-sm text-neutral-600'>{t('telemedicine.doctor')}</label>
                  <p className='font-medium text-neutral-900'>
                    {t('telemedicine.doctorPrefix')} {session.doctorId.firstName} {session.doctorId.lastName}
                  </p>
                </div>

                <div>
                  <label className='text-sm text-neutral-600'>
                    {t('telemedicine.sessionType')}
                  </label>
                  <Tag variant='default'>
                    {t(
                      `telemedicine.${
                        (session.sessionType || '').toUpperCase() === 'CHAT'
                          ? 'typeChat'
                          : 'typeVideo'
                      }`
                    )}
                  </Tag>
                </div>

                <div>
                  <label className='text-sm text-neutral-600'>
                    {t('telemedicine.status')}
                  </label>
                  <Tag variant={session.status === 'COMPLETED' ? 'success' : 'default'}>
                    {t(
                      `telemedicine.${
                        {
                          SCHEDULED: 'statusScheduled',
                          IN_PROGRESS: 'statusInProgress',
                          COMPLETED: 'statusCompleted',
                          CANCELLED: 'statusCancelled',
                        }[session.status] || 'statusScheduled'
                      }`
                    )}
                  </Tag>
                </div>

                <div>
                  <label className='text-sm text-neutral-600'>
                    {t('telemedicine.scheduledTime')}
                  </label>
                  <p className='font-medium text-neutral-900'>
                    {new Date(session.scheduledStartTime).toLocaleString()}
                  </p>
                </div>

                {session.duration && (
                  <div>
                    <label className='text-sm text-neutral-600'>{t('appointments.duration')}</label>
                    <p className='font-medium text-neutral-900'>
                    {session.duration} {t('queue.minutes')}
                  </p>
                  </div>
                )}

                {session.connectionQuality && (
                  <div>
                    <label className='text-sm text-neutral-600'>
                      {t('telemedicine.connectionQuality')}
                    </label>
                    <Tag
                      variant={
                        session.connectionQuality === 'EXCELLENT' ||
                        session.connectionQuality === 'GOOD'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      {session.connectionQuality}
                    </Tag>
                  </div>
                )}
              </div>

              {session.notes && (
                <div className='pt-4 border-t'>
                  <label className='text-sm text-neutral-600'>
                    {t('telemedicine.clinicalNotes')}
                  </label>
                  <p className='mt-2 text-neutral-900 whitespace-pre-wrap'>{session.notes}</p>
                </div>
              )}

              {session.diagnosis && (
                <div className='pt-4 border-t'>
                  <label className='text-sm text-neutral-600'>{t('telemedicine.diagnosis')}</label>
                  <p className='mt-2 text-neutral-900'>{session.diagnosis}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Chat History */}
          <Card>
            <h2 className='text-xl font-semibold mb-6'>{t('telemedicine.chatHistory')}</h2>

            {session.chatMessages && session.chatMessages.length > 0 ? (
              <div className='space-y-3 max-h-96 overflow-y-auto'>
                {session.chatMessages.map((msg, idx) => (
                  <div key={idx} className='p-3 bg-neutral-100 rounded-lg'>
                    <div className='flex justify-between items-start mb-1'>
                      <span className='text-sm font-semibold text-neutral-900'>
                        {msg.senderName}
                      </span>
                      <span className='text-xs text-neutral-500'>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className='text-sm text-neutral-700'>{msg.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-neutral-500 text-sm text-center py-8'>
                {t('telemedicine.noChatMessages')}
              </p>
            )}
          </Card>
        </div>

        {/* Rating Section (for Patients) */}
        {showRating && !session.review && (
          <Card className='mt-6 p-6 bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200'>
            <h3 className='text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2'>
              <svg
                className='icon icon-md text-primary-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
                />
              </svg>
              {t('telemedicine.rateThisConsultation')}
            </h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>{t('telemedicine.ratingLabel')}</label>
                <div className='flex items-center gap-2'>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type='button'
                      variant='ghost'
                      size='sm'
                      iconOnly
                      onClick={() => setRating(star)}
                      className='focus:outline-none min-w-0 p-0'
                      aria-label={
                        t('telemedicine.rateStars', { count: star }) ||
                        `Rate ${star} star${star === 1 ? '' : 's'}`
                      }
                    >
                      <svg
                        className={`w-8 h-8 transition-colors ${
                          star <= rating ? 'text-yellow-400 fill-current' : 'text-neutral-300'
                        }`}
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                      </svg>
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('telemedicine.yourReviewOptional')}
                </label>
                <textarea
                  className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                  rows={4}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder={t('telemedicine.feedbackPlaceholder')}
                />
              </div>
              <Button
                variant='primary'
                onClick={handleSubmitRating}
                disabled={submittingRating || rating === 0}
              >
                {submittingRating ? t('telemedicine.submittingRating') : t('telemedicine.submitRating')}
              </Button>
            </div>
          </Card>
        )}

        {/* Actions */}
        <Card className='mt-6'>
          <div className='flex items-center justify-between flex-wrap gap-4'>
            <div>
              <h3 className='font-semibold text-neutral-900'>{t('common.actions')}</h3>
              <p className='text-sm text-neutral-600'>{t('telemedicine.nextStepsConsultation')}</p>
            </div>
            <div className='flex flex-wrap gap-3'>
              <Button
                variant='primary'
                onClick={() => {
                  const patientId = session.patientId?._id || session.patientId;
                  if (patientId) {
                    router.push(
                      `/prescriptions/new?patientId=${patientId}&appointmentId=${session.appointmentId || ''}`,
                    );
                  } else {
                    router.push('/prescriptions/new');
                  }
                }}
              >
                <svg
                  className='icon icon-xs mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                {t('prescriptions.createPrescription')}
              </Button>
              <Button
                variant='secondary'
                onClick={() => {
                  const patientId = session.patientId?._id || session.patientId;
                  if (patientId) {
                    router.push(`/appointments/new?patientId=${patientId}&followUp=true`);
                  } else {
                    router.push('/appointments/new');
                  }
                }}
              >
                <svg
                  className='icon icon-xs mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
                {t('telemedicine.bookFollowUp')}
              </Button>
              <Button variant='primary' onClick={downloadSummary}>
                <svg
                  className='icon icon-xs mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                {t('telemedicine.downloadSummary')}
              </Button>
              <Button variant='secondary' onClick={() => window.print()}>
                <svg
                  className='icon icon-xs mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z'
                  />
                </svg>
                {t('telemedicine.printSummary')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
