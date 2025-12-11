'use client';

import { Layout } from '@/components/layout/Layout';
import { PatientDetailsPanel } from '@/components/prescriptions/PatientDetailsPanel';
import { PrescriptionPrintPreview } from '@/components/prescriptions/PrescriptionPrintPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
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

  useEffect(() => {
    if (!authLoading && user && prescriptionId) {
      fetchPrescription();
    }
  }, [authLoading, user, prescriptionId]);

  const fetchPrescription = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
      if (response.success && response.data) {
        setPrescription(response.data);
      } else {
        setError('Prescription not found');
      }
    } catch (error) {
      console.error('Failed to fetch prescription:', error);
      setError('Failed to load prescription');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      draft: 'Draft',
      active: 'Active',
      dispensed: 'Dispensed',
      cancelled: 'Cancelled',
      expired: 'Expired',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      draft: 'bg-status-warning/10 text-status-warning',
      active: 'bg-secondary-100 text-secondary-700',
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
    return (
      <Layout>
        <Loader size='md' className='h-64' />
      </Layout>
    );
  }

  if (error || !prescription) {
    return (
      <Layout>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <div className='text-status-error mb-4'>{error || 'Prescription not found'}</div>
            <Button onClick={() => router.push('/prescriptions')}>Back to Prescriptions</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const patientId = prescription.patientId?._id || prescription.patientId;

  return (
    <Layout>
      <div className='mb-6'>
        <Button variant='secondary' onClick={() => router.back()} className='mb-4'>
          ← {t('common.back')}
        </Button>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-neutral-900'>
              Prescription #{prescription.prescriptionNumber}
            </h1>
            <p className='text-neutral-600 mt-1'>
              Created on {new Date(prescription.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='secondary'
              onClick={() => router.push(`/prescriptions/${prescriptionId}/edit`)}
            >
              Edit
            </Button>
            <Button variant='secondary' onClick={() => setShowPrintPreview(true)}>
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          {/* Prescription Info */}
          <Card>
            <div className='space-y-4'>
              <div className='flex items-center justify-between pb-4 border-b'>
                <h2 className='text-lg font-semibold'>Prescription Details</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    prescription.status
                  )}`}
                >
                  {getStatusLabel(prescription.status)}
                </span>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-neutral-500'>
                    Prescription Number
                  </label>
                  <p className='text-neutral-900 font-semibold'>
                    {prescription.prescriptionNumber}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-neutral-500'>Status</label>
                  <p className='text-neutral-900'>{getStatusLabel(prescription.status)}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-neutral-500'>Valid From</label>
                  <p className='text-neutral-900'>
                    {new Date(prescription.validFrom).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-neutral-500'>Valid Until</label>
                  <p className='text-neutral-900'>
                    {new Date(prescription.validUntil).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-neutral-500'>Refills Allowed</label>
                  <p className='text-neutral-900'>{prescription.refillsAllowed || 0}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-neutral-500'>Refills Used</label>
                  <p className='text-neutral-900'>{prescription.refillsUsed || 0}</p>
                </div>
              </div>

              {prescription.diagnosis && (
                <div>
                  <label className='text-sm font-medium text-neutral-500'>Diagnosis</label>
                  <p className='text-neutral-900 mt-1'>{prescription.diagnosis}</p>
                </div>
              )}

              {prescription.additionalInstructions && (
                <div>
                  <label className='text-sm font-medium text-neutral-500'>
                    Additional Instructions
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
            <h2 className='text-lg font-semibold mb-4'>Prescription Items</h2>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-neutral-50'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                      #
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                      Type
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                      Item
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                      Details
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                      Instructions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {prescription.items && prescription.items.length > 0 ? (
                    prescription.items.map((item, index) => (
                      <tr key={index} className='hover:bg-neutral-50'>
                        <td className='px-4 py-3 text-sm text-neutral-900'>{index + 1}</td>
                        <td className='px-4 py-3 text-sm text-neutral-900 capitalize'>
                          {item.itemType || 'drug'}
                        </td>
                        <td className='px-4 py-3 text-sm text-neutral-900'>
                          {item.itemType === 'drug' && item.drugName && (
                            <div>
                              <div className='font-medium'>{item.drugName}</div>
                              {item.genericName && (
                                <div className='text-xs text-neutral-500'>({item.genericName})</div>
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
                        <td className='px-4 py-3 text-sm text-neutral-900'>
                          {item.itemType === 'drug' && (
                            <div className='space-y-1'>
                              {item.frequency && <div>Frequency: {item.frequency}</div>}
                              {item.duration && <div>Duration: {item.duration} days</div>}
                              {item.quantity && (
                                <div>
                                  Quantity: {item.quantity} {item.unit || 'units'}
                                </div>
                              )}
                              {item.takeWithFood && (
                                <div className='text-xs text-neutral-500'>Take with food</div>
                              )}
                              {item.allowSubstitution !== undefined && (
                                <div className='text-xs text-neutral-500'>
                                  {item.allowSubstitution
                                    ? 'Substitution allowed'
                                    : 'No substitution'}
                                </div>
                              )}
                            </div>
                          )}
                          {item.itemType === 'lab' && (
                            <div>
                              {item.fastingRequired && (
                                <div className='text-xs text-orange-600'>Fasting required</div>
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
                        <td className='px-4 py-3 text-sm text-neutral-900'>
                          {item.instructions && (
                            <div className='whitespace-pre-wrap'>{item.instructions}</div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan='5' className='px-4 py-8 text-center text-neutral-500'>
                        No items in this prescription
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Doctor Info */}
          {prescription.doctorId && (
            <Card>
              <h2 className='text-lg font-semibold mb-4'>Prescribed By</h2>
              <div className='space-y-2'>
                <p className='text-neutral-900'>
                  {prescription.doctorId.firstName} {prescription.doctorId.lastName}
                </p>
                <p className='text-sm text-neutral-500'>
                  Created on {new Date(prescription.createdAt).toLocaleString()}
                </p>
                {prescription.dispensedAt && (
                  <p className='text-sm text-neutral-500'>
                    Dispensed on {new Date(prescription.dispensedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </Card>
          )}
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
    </Layout>
  );
}
