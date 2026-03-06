'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PatientDetailsPanel } from '@/components/prescriptions/PatientDetailsPanel';
import { PrescriptionPrintPreview } from '@/components/prescriptions/PrescriptionPrintPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { getDiagnosisDisplayValue } from '@/lib/i18n/inventory-name-dictionary';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PrescriptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prescriptionId = params?.id;
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [versions, setVersions] = useState({ items: [], total: 0 });
  const [versionsLoading, setVersionsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && prescriptionId) {
      fetchPrescription();
    }
  }, [authLoading, user, prescriptionId]);

  useEffect(() => {
    if (user && prescriptionId && prescription) {
      fetchVersions();
    }
  }, [user, prescriptionId, prescription]);

  const fetchVersions = async () => {
    if (!prescriptionId) return;
    setVersionsLoading(true);
    try {
      const response = await apiClient.get(`/prescriptions/${prescriptionId}/versions`, {
        params: { page: 1, limit: 20 },
      });
      if (response.success && response.data) {
        setVersions({
          items: response.data.items || [],
          total: response.data.total ?? 0,
        });
      }
    } catch (_err) {
      setVersions({ items: [], total: 0 });
    } finally {
      setVersionsLoading(false);
    }
  };

  const fetchPrescription = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
      if (response.success && response.data) {
        setPrescription(response.data);
      } else {
        setError(t('prescriptions.prescriptionNotFound'));
      }
    } catch (error) {
      logger.error('Failed to fetch prescription:', error);
      setError(t('prescriptions.failedToLoadPrescription'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      draft: t('prescriptions.statusDraft'),
      active: t('prescriptions.statusActive'),
      dispensed: t('prescriptions.statusDispensed'),
      cancelled: t('prescriptions.statusCancelled'),
      expired: t('prescriptions.statusExpired'),
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      draft: 'bg-status-warning/10 text-status-warning',
      active: 'bg-primary-100 text-primary-700',
      dispensed: 'bg-primary-100 text-primary-700',
      cancelled: 'bg-status-error/10 text-status-error',
      expired: 'bg-neutral-100 text-neutral-700',
    };
    return colorMap[status] || 'bg-neutral-100 text-neutral-700';
  };

  // Redirect if not authenticated (non-blocking)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Show empty state while redirecting
  if (!user) {
    return null;
  }

  if (loading) {
    return <Layout loading />;
  }

  if (error || !prescription) {
    return (
      <Layout>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <div className='text-status-error'>{error || t('prescriptions.prescriptionNotFound')}</div>
          </div>
        </div>
      </Layout>
    );
  }

  const patientId = prescription.patientId?._id || prescription.patientId;

  return (
    <Layout>
      <PageHeader
        title={`Prescription #${prescription.prescriptionNumber}`}
        subtitle={`${t('prescriptions.createdOn')} ${new Date(prescription.createdAt).toLocaleDateString()}`}
        notifications={[]}
        unreadCount={0}
        actionButtons={
          <>
            <Button variant='primary' size='md' href={`/prescriptions/${prescriptionId}/edit`}>
              {t('common.edit')}
            </Button>
            <Button
              variant='secondary'
              onClick={async () => {
                try {
                  const response = await apiClient.get(`/prescriptions/${prescriptionId}/download`);
                  if (response.success && response.data?.pdfUrl) {
                    window.open(response.data.pdfUrl, '_blank');
                  } else {
                    setShowPrintPreview(true);
                  }
                } catch (err) {
                  setShowPrintPreview(true);
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
                  d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              {t('prescriptions.downloadPdf')}
            </Button>
            <Button
              variant='secondary'
              onClick={async () => {
                try {
                  const response = await apiClient.post(`/prescriptions/${prescriptionId}/email`, {
                    patientEmail: prescription.patientId?.email,
                  });
                  if (response.success)
                    showSuccess(
                      t('prescriptions.emailSentSuccess'),
                    );
                  else
                    showError(
                      t('prescriptions.emailSendFailed'),
                    );
                } catch (err) {
                  showError(
                    t('prescriptions.emailSendFailed'),
                  );
                }
              }}
              disabled={!prescription.patientId?.email}
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
                  d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                />
              </svg>
              {t('prescriptions.email')}
            </Button>
            <Button variant='secondary' size='md' onClick={() => setShowPrintPreview(true)}>
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
              {t('prescriptions.print')}
            </Button>
          </>
        }
      />
      <div style={{ padding: '0 10px' }}>
        <div className='content-grid-3 content-grid-gap-6'>
          <div className='lg:col-span-2 space-y-6'>
            {/* Prescription Info */}
            <Card>
              <div className='space-y-4'>
                <div className='flex items-center justify-between pb-4 border-b'>
                  <h2 className='text-lg font-semibold'>{t('prescriptions.prescriptionDetails')}</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      prescription.status,
                    )}`}
                  >
                    {getStatusLabel(prescription.status)}
                  </span>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>
                      {t('prescriptions.prescriptionNumber')}
                    </label>
                    <p className='text-neutral-900 font-semibold'>
                      {prescription.prescriptionNumber}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>{t('prescriptions.status')}</label>
                    <p className='text-neutral-900'>{getStatusLabel(prescription.status)}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>{t('prescriptions.validFrom')}</label>
                    <p className='text-neutral-900'>
                      {new Date(prescription.validFrom).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>{t('prescriptions.validUntil')}</label>
                    <p className='text-neutral-900'>
                      {new Date(prescription.validUntil).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>{t('prescriptions.refillsAllowed')}</label>
                    <p className='text-neutral-900'>{prescription.refillsAllowed || 0}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>{t('prescriptions.refillsUsed')}</label>
                    <p className='text-neutral-900'>{prescription.refillsUsed || 0}</p>
                  </div>
                </div>

                {prescription.diagnosis && (
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>{t('prescriptions.diagnosisLabel')}</label>
                    <p className='text-neutral-900 mt-1'>{getDiagnosisDisplayValue(prescription.diagnosis, localeCode)}</p>
                  </div>
                )}

                {prescription.additionalInstructions && (
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>
                      {t('prescriptions.additionalInstructions')}
                    </label>
                    <div
                      className='text-neutral-900 mt-1 prose prose-sm max-w-none'
                      style={{
                        lineHeight: '1.6',
                      }}
                      dangerouslySetInnerHTML={{ __html: prescription.additionalInstructions }}
                    />
                    <style jsx>{`
                      div :global(p) {
                        margin: 0.5em 0;
                      }
                      div :global(ul),
                      div :global(ol) {
                        margin: 0.5em 0;
                        padding-left: 1.5em;
                      }
                      div :global(li) {
                        margin: 0.25em 0;
                      }
                      div :global(strong) {
                        font-weight: 600;
                      }
                      div :global(em) {
                        font-style: italic;
                      }
                      div :global(u) {
                        text-decoration: underline;
                      }
                    `}</style>
                  </div>
                )}
              </div>
            </Card>

            {/* Prescription Items */}
            <Card>
              <h2 className='text-lg font-semibold mb-4'>{t('prescriptions.prescriptionItems')}</h2>
              <div className='clinic-table-wrap'>
                <table className='clinic-table'>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t('prescriptions.itemType')}</th>
                      <th>{t('prescriptions.item')}</th>
                      <th>{t('prescriptions.details')}</th>
                      <th>{t('prescriptions.instructions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescription.items && prescription.items.length > 0 ? (
                      prescription.items.map((item, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td className='capitalize'>{item.itemType || 'drug'}</td>
                          <td>
                            {item.itemType === 'drug' && item.drugName && (
                              <div>
                                <div className='font-medium'>{item.drugName}</div>
                                {item.genericName && (
                                  <div className='text-xs text-neutral-500'>
                                    ({item.genericName})
                                  </div>
                                )}
                                {item.strength && (
                                  <div className='text-xs text-neutral-500'>{item.strength}</div>
                                )}
                                {item.form && (
                                  <div className='text-xs text-neutral-500'>{item.form}</div>
                                )}
                              </div>
                            )}
                            {item.itemType === 'lab' && item.labTestName && (
                              <div>
                                <div className='font-medium'>{item.labTestName}</div>
                                {item.labTestCode && (
                                  <div className='text-xs text-neutral-500'>
                                    Code: {item.labTestCode}
                                  </div>
                                )}
                              </div>
                            )}
                            {item.itemType === 'procedure' && item.procedureName && (
                              <div>
                                <div className='font-medium'>{item.procedureName}</div>
                                {item.procedureCode && (
                                  <div className='text-xs text-neutral-500'>
                                    Code: {item.procedureCode}
                                  </div>
                                )}
                              </div>
                            )}
                            {item.itemType === 'other' && item.itemName && (
                              <div className='font-medium'>{item.itemName}</div>
                            )}
                          </td>
                          <td>
                            {item.itemType === 'drug' && (
                              <div className='space-y-1'>
                                {item.frequency && <div>Frequency: {item.frequency}</div>}
                                {item.duration && <div>Duration: {item.duration} days</div>}
                                {item.quantity && (
                                  <div>
                                    {t('prescriptions.quantity')}: {item.quantity} {item.unit || t('prescriptions.units')}
                                  </div>
                                )}
                                {item.takeWithFood && (
                                  <div className='text-xs text-neutral-500'>{t('prescriptions.takeWithFood')}</div>
                                )}
                                {item.allowSubstitution !== undefined && (
                                  <div className='text-xs text-neutral-500'>
                                    {item.allowSubstitution
                                      ? t('prescriptions.substitutionAllowed')
                                      : t('prescriptions.noSubstitution')}
                                  </div>
                                )}
                              </div>
                            )}
                            {item.itemType === 'lab' && (
                              <div>
                                {item.fastingRequired && (
                                  <div className='text-xs text-orange-600'>{t('prescriptions.fastingRequired')}</div>
                                )}
                                {item.labInstructions && (
                                  <div className='text-xs text-neutral-500'>
                                    {item.labInstructions}
                                  </div>
                                )}
                              </div>
                            )}
                            {item.itemType === 'procedure' && item.procedureInstructions && (
                              <div className='text-xs text-neutral-500'>
                                {item.procedureInstructions}
                              </div>
                            )}
                            {item.itemType === 'other' && item.itemDescription && (
                              <div className='text-xs text-neutral-500'>{item.itemDescription}</div>
                            )}
                          </td>
                          <td>
                            {item.instructions && (
                              <div className='whitespace-pre-wrap'>{item.instructions}</div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr data-empty>
                        <td colSpan={5}>{t('prescriptions.noItems')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Doctor Info */}
            {prescription.doctorId && (
              <Card>
                <h2 className='text-lg font-semibold mb-4'>{t('prescriptions.prescribedBy')}</h2>
                <div className='space-y-2'>
                  <p className='text-neutral-900'>
                    {prescription.doctorId.firstName} {prescription.doctorId.lastName}
                  </p>
                  <p className='text-sm text-neutral-500'>
                    {t('prescriptions.createdOn')} {new Date(prescription.createdAt).toLocaleString()}
                  </p>
                  {prescription.dispensedAt && (
                    <p className='text-sm text-neutral-500'>
                      {t('prescriptions.dispensedOn')} {new Date(prescription.dispensedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Version History */}
            <Card>
              <h2 className='text-lg font-semibold mb-4'>{t('prescriptions.versionHistory')}</h2>
              {versionsLoading ? (
                <p className='text-sm text-neutral-500'>{t('common.loading')}</p>
              ) : versions.items.length === 0 ? (
                <p className='text-sm text-neutral-500'>{t('prescriptions.versionHistoryEmpty')}</p>
              ) : (
                <div className='clinic-table-wrap'>
                  <table className='clinic-table'>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t('prescriptions.versionActionLabel')}</th>
                        <th>{t('prescriptions.versionChangedBy')}</th>
                        <th>{t('prescriptions.versionChangedAt')}</th>
                        <th>{t('prescriptions.versionReason')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {versions.items.map((v, idx) => (
                        <tr key={v._id || idx}>
                          <td>{v.version}</td>
                          <td>
                            {v.action === 'create' && t('prescriptions.versionActionCreate')}
                            {v.action === 'update' && t('prescriptions.versionActionUpdate')}
                            {v.action === 'void' && t('prescriptions.versionActionVoid')}
                            {!['create', 'update', 'void'].includes(v.action) && v.action}
                          </td>
                          <td>
                            {v.changedById?.firstName != null || v.changedById?.lastName != null
                              ? `${v.changedById.firstName || ''} ${v.changedById.lastName || ''}`.trim()
                              : '—'}
                          </td>
                          <td>{v.changedAt ? new Date(v.changedAt).toLocaleString() : '—'}</td>
                          <td>{v.reason || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar - Patient Details */}
          <div className='lg:col-span-1'>
            <div className='sticky top-4'>
              <PatientDetailsPanel patientId={patientId} />
            </div>
          </div>
        </div>

        <PrescriptionPrintPreview
          prescriptionId={prescriptionId}
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
        />
      </div>
    </Layout>
  );
}
