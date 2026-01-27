'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { apiClient } from '@/lib/api/client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PatientPrescriptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prescriptionId = params.id;
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState(null);

  useEffect(() => {
    if (prescriptionId) {
      fetchPrescription();
    }
  }, [prescriptionId]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
      if (response.success) {
        setPrescription(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch prescription:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDownload = () => {
    window.open(`/prescriptions/${prescriptionId}/print`, '_blank');
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <Loader size='lg' />
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <Card className='p-8 text-center'>
          <p className='text-neutral-500 mb-4'>Prescription not found</p>
          <Link href='/patient-portal/prescriptions'>
            <Button variant='primary'>Back to Prescriptions</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-neutral-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <Link href='/patient-portal/dashboard' className='flex items-center gap-2'>
              <div className='w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-xl'>C</span>
              </div>
              <span className='text-xl font-bold text-neutral-900'>ClinicTool</span>
            </Link>
          </div>
        </div>
      </header>

      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-bold text-neutral-900'>Prescription Details</h1>
          <div className='flex items-center gap-3'>
            <Button variant='secondary' onClick={() => router.push('/patient-portal/prescriptions')}>
              <svg className='icon icon-xs mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M10 19l-7-7m0 0l7-7m-7 7h18'
                />
              </svg>
              Back to List
            </Button>
            <Button variant='primary' onClick={handleDownload}>
              <svg className='icon icon-sm mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              Download PDF
            </Button>
          </div>
        </div>

        <Card className='p-6 mb-6'>
          <div className='flex items-start justify-between mb-4'>
            <div>
              <h2 className='text-xl font-bold text-neutral-900 mb-2'>
                {prescription.prescriptionNumber || prescription._id.slice(-8)}
              </h2>
              <p className='text-neutral-600'>
                Dr. {prescription.doctorId?.userId?.firstName} {prescription.doctorId?.userId?.lastName}
              </p>
              <p className='text-sm text-neutral-500 mt-1'>{formatDate(prescription.createdAt)}</p>
            </div>
            <Tag
              className={
                prescription.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }
            >
              {prescription.status}
            </Tag>
          </div>

          {prescription.diagnosis && (
            <div className='mb-4 p-4 bg-neutral-50 rounded-lg'>
              <h3 className='font-semibold text-neutral-900 mb-2'>Diagnosis</h3>
              <p className='text-neutral-700'>{prescription.diagnosis}</p>
            </div>
          )}
        </Card>

        <Card className='p-6 mb-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-bold text-neutral-900'>Medicines ({prescription.items?.length || 0})</h2>
            {prescription.status === 'active' && prescription.items && prescription.items.length > 0 && (
              <Button
                variant='primary'
                size='sm'
                onClick={() => {
                  // TODO: Implement reorder medicines functionality
                  alert('Reorder medicines feature coming soon');
                }}
              >
                <svg className='icon icon-xs mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
                Reorder All Medicines
              </Button>
            )}
          </div>
          <div className='space-y-4'>
            {prescription.items?.map((item, index) => (
              <Card key={index} className='p-4 border-2 border-neutral-200 hover:border-primary-300 transition-colors'>
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <h3 className='text-lg font-bold text-neutral-900'>
                        {item.drugName || item.itemName}
                      </h3>
                      {item.strength && (
                        <Tag className='bg-primary-100 text-primary-800 text-xs'>
                          {item.strength}
                        </Tag>
                      )}
                    </div>
                    {item.genericName && (
                      <p className='text-sm text-neutral-500 mb-2'>({item.genericName})</p>
                    )}
                  </div>
                  {item.quantity && (
                    <div className='text-right'>
                      <p className='text-sm font-semibold text-neutral-900'>
                        {item.quantity} {item.unit || 'units'}
                      </p>
                      {item.price && (
                        <p className='text-xs text-neutral-500'>${item.price}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-3'>
                  <div className='p-2 bg-blue-50 rounded'>
                    <p className='text-xs text-neutral-600 mb-1'>Dosage</p>
                    <p className='font-semibold text-neutral-900'>
                      {item.dosage || item.quantity || 'N/A'} {item.unit || ''}
                    </p>
                  </div>
                  <div className='p-2 bg-green-50 rounded'>
                    <p className='text-xs text-neutral-600 mb-1'>Frequency</p>
                    <p className='font-semibold text-neutral-900'>{item.frequency || 'N/A'}</p>
                  </div>
                  <div className='p-2 bg-purple-50 rounded'>
                    <p className='text-xs text-neutral-600 mb-1'>Duration</p>
                    <p className='font-semibold text-neutral-900'>{item.duration || 'N/A'} days</p>
                  </div>
                </div>
                {item.instructions && (
                  <div className='p-3 bg-yellow-50 border border-yellow-200 rounded'>
                    <p className='text-xs font-semibold text-neutral-700 mb-1'>Special Instructions:</p>
                    <p className='text-sm text-neutral-700'>{item.instructions}</p>
                  </div>
                )}
                {prescription.status === 'active' && (
                  <div className='mt-3 pt-3 border-t border-neutral-200'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        // TODO: Implement individual medicine reorder
                        alert(`Reorder ${item.drugName || item.itemName} feature coming soon`);
                      }}
                    >
                      <svg className='icon icon-xs mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
                        />
                      </svg>
                      Reorder This Medicine
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Card>

        {prescription.additionalInstructions && (
          <Card className='p-6 mb-6'>
            <h2 className='text-lg font-bold text-neutral-900 mb-4'>Additional Instructions</h2>
            <p className='text-neutral-700 whitespace-pre-wrap'>
              {prescription.additionalInstructions}
            </p>
          </Card>
        )}

        {prescription.validUntil && (
          <Card className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-neutral-600'>Valid Until</p>
                <p className='font-semibold text-neutral-900'>{formatDate(prescription.validUntil)}</p>
              </div>
              {prescription.refillsAllowed > 0 && (
                <div>
                  <p className='text-sm text-neutral-600'>Refills Remaining</p>
                  <p className='font-semibold text-neutral-900'>{prescription.refillsAllowed}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
