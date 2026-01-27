'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PatientPrescriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    fetchPrescriptions();
  }, [appointmentId]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      let url = '/prescriptions?limit=100&sortBy=createdAt&sortOrder=desc';
      if (appointmentId) {
        url += `&appointmentId=${appointmentId}`;
      }
      const response = await apiClient.get(url);
      
      if (response.success) {
        const prescriptionsData = extractArrayData(response);
        setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);
      }
    } catch (err) {
      console.error('Failed to fetch prescriptions:', err);
      setPrescriptions([]);
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

  const handleDownload = async (prescriptionId) => {
    try {
      const response = await apiClient.get(`/prescriptions/${prescriptionId}/download`);
      if (response.success) {
        // Handle PDF download
        window.open(`/prescriptions/${prescriptionId}/print`, '_blank');
      }
    } catch (err) {
      console.error('Failed to download prescription:', err);
      alert('Failed to download prescription');
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <Loader size='lg' />
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

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <h1 className='text-3xl font-bold text-neutral-900 mb-6'>My Prescriptions</h1>

        {prescriptions.length > 0 ? (
          <div className='space-y-4'>
            {prescriptions.map((pres) => (
              <Card key={pres._id} className='p-6'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <h3 className='text-xl font-bold text-neutral-900'>
                        {pres.prescriptionNumber || pres._id.slice(-8)}
                      </h3>
                      <Tag
                        className={
                          pres.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : pres.status === 'dispensed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {pres.status}
                      </Tag>
                    </div>
                    <p className='text-neutral-600 mb-2'>
                      Dr. {pres.doctorId?.userId?.firstName} {pres.doctorId?.userId?.lastName}
                    </p>
                    <p className='text-sm text-neutral-500 mb-4'>
                      {formatDate(pres.createdAt)}
                      {pres.diagnosis && ` • ${pres.diagnosis}`}
                    </p>
                    <div className='mb-4'>
                      <p className='text-sm font-medium text-neutral-700 mb-2'>Medicines ({pres.items?.length || 0}):</p>
                      <div className='space-y-2'>
                        {pres.items?.slice(0, 3).map((item, index) => (
                          <div key={index} className='p-2 bg-neutral-50 rounded border border-neutral-200'>
                            <p className='text-sm font-semibold text-neutral-900'>
                              {item.drugName || item.itemName}
                              {item.strength && <span className='text-neutral-600 font-normal'> ({item.strength})</span>}
                            </p>
                            <div className='flex items-center gap-4 text-xs text-neutral-600 mt-1'>
                              <span>Dosage: {item.dosage || item.quantity || 'N/A'} {item.unit || ''}</span>
                              <span>Frequency: {item.frequency || 'N/A'}</span>
                              <span>Duration: {item.duration || 'N/A'} days</span>
                            </div>
                            {item.instructions && (
                              <p className='text-xs text-neutral-500 mt-1'>{item.instructions}</p>
                            )}
                          </div>
                        ))}
                        {pres.items?.length > 3 && (
                          <p className='text-sm text-neutral-500 italic'>
                            +{pres.items.length - 3} more medicines (view details to see all)
                          </p>
                        )}
                      </div>
                    </div>
                    {pres.additionalInstructions && (
                      <p className='text-sm text-neutral-600'>
                        <strong>Instructions:</strong> {pres.additionalInstructions}
                      </p>
                    )}
                  </div>
                  <div className='flex flex-col gap-2'>
                    <Button
                      variant='primary'
                      size='sm'
                      onClick={() => router.push(`/patient-portal/prescriptions/${pres._id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={() => handleDownload(pres._id)}
                    >
                      <svg className='icon icon-xs mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                      </svg>
                      Download PDF
                    </Button>
                    {pres.status === 'active' && pres.items && pres.items.length > 0 && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          // TODO: Implement reorder medicines functionality
                          alert('Reorder medicines feature coming soon');
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
                        Reorder Medicines
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className='p-12 text-center'>
            <p className='text-neutral-500 mb-4'>No prescriptions found</p>
            <Link href='/patient-portal/dashboard'>
              <Button variant='primary'>Go to Dashboard</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
