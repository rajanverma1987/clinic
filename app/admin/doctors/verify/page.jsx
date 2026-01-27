'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function AdminDoctorVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [verificationComment, setVerificationComment] = useState('');
  const [requestDocumentType, setRequestDocumentType] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchPendingDoctors();
    }
  }, [authLoading, user]);

  useEffect(() => {
    const doctorId = searchParams?.get('doctorId');
    if (doctorId) {
      fetchDoctorDetails(doctorId);
    }
  }, [searchParams]);

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/doctors?verificationStatus=pending');
      if (response.success && response.data) {
        setPendingDoctors(extractArrayData(response));
      }
    } catch (error) {
      console.error('Failed to fetch pending doctors:', error);
      showError('Failed to fetch pending doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorDetails = async (doctorId) => {
    try {
      const response = await apiClient.get(`/admin/doctors/${doctorId}`);
      if (response.success && response.data) {
        setSelectedDoctor(response.data);
        // Fetch uploaded documents
        const docsResponse = await apiClient.get(`/admin/doctors/${doctorId}/documents`);
        if (docsResponse.success && docsResponse.data) {
          setDocuments(Array.isArray(docsResponse.data) ? docsResponse.data : []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch doctor details:', error);
      showError('Failed to fetch doctor details');
    }
  };

  const handleApprove = async (doctorId) => {
    try {
      setSubmitting(true);
      const response = await apiClient.post(`/admin/doctors/${doctorId}/verify`, {
        action: 'approve',
        comment: verificationComment,
      });
      if (response.success) {
        showSuccess('Doctor approved successfully');
        setSelectedDoctor(null);
        setVerificationComment('');
        fetchPendingDoctors();
      } else {
        showError(response.error?.message || 'Failed to approve doctor');
      }
    } catch (error) {
      showError('Failed to approve doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (doctorId) => {
    if (!verificationComment.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }
    try {
      setSubmitting(true);
      const response = await apiClient.post(`/admin/doctors/${doctorId}/verify`, {
        action: 'reject',
        comment: verificationComment,
      });
      if (response.success) {
        showSuccess('Doctor rejected. Email notification sent.');
        setSelectedDoctor(null);
        setVerificationComment('');
        fetchPendingDoctors();
      } else {
        showError(response.error?.message || 'Failed to reject doctor');
      }
    } catch (error) {
      showError('Failed to reject doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestDocuments = async (doctorId) => {
    if (!requestDocumentType.trim()) {
      showError('Please specify which documents are needed');
      return;
    }
    try {
      const response = await apiClient.post(`/admin/doctors/${doctorId}/request-documents`, {
        documentType: requestDocumentType,
        comment: verificationComment,
      });
      if (response.success) {
        showSuccess('Document request sent to doctor');
        setRequestDocumentType('');
        setVerificationComment('');
      } else {
        showError(response.error?.message || 'Failed to request documents');
      }
    } catch (error) {
      showError('Failed to request documents');
    }
  };

  if (authLoading || loading) {
    return <Loader fullScreen size='lg' />;
  }

  if (user?.role !== 'super_admin') {
    return null;
  }

  return (
    <Layout
      title='Doctor Verification'
      subtitle='Review and verify doctor applications'
      actionButton={
        <Button variant='primary' onClick={() => router.push('/admin/doctors')}>
          Back to Doctors
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Pending Doctors List */}
          <div className='lg:col-span-1'>
            <Card>
              <div className='p-6'>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>
                  Pending Applications ({pendingDoctors.length})
                </h2>
                <div className='space-y-3'>
                  {pendingDoctors.length === 0 ? (
                    <p className='text-neutral-500 text-center py-8'>No pending applications</p>
                  ) : (
                    pendingDoctors.map((doctor) => (
                      <div
                        key={doctor._id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedDoctor?._id === doctor._id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                        }`}
                        onClick={() => {
                          router.push(`/admin/doctors/verify?doctorId=${doctor._id}`);
                        }}
                      >
                        <div className='flex items-start justify-between mb-2'>
                          <div className='flex-1'>
                            <p className='font-semibold text-neutral-900'>
                              {doctor.userId?.firstName || doctor.firstName} {doctor.userId?.lastName || doctor.lastName}
                            </p>
                            <p className='text-sm text-neutral-600'>{doctor.userId?.email || doctor.email}</p>
                          </div>
                          <Tag className='bg-yellow-100 text-yellow-800'>Pending</Tag>
                        </div>
                        <p className='text-xs text-neutral-500 mt-2'>
                          Applied: {new Date(doctor.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Doctor Details & Verification */}
          <div className='lg:col-span-2'>
            {selectedDoctor ? (
              <div className='space-y-6'>
                {/* Doctor Information */}
                <Card>
                  <div className='p-6'>
                    <h2 className='text-lg font-bold text-neutral-900 mb-4'>Doctor Information</h2>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <p className='text-sm text-neutral-600'>Name</p>
                        <p className='font-semibold text-neutral-900'>
                          {selectedDoctor.userId?.firstName || selectedDoctor.firstName}{' '}
                          {selectedDoctor.userId?.lastName || selectedDoctor.lastName}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-neutral-600'>Email</p>
                        <p className='font-semibold text-neutral-900'>{selectedDoctor.userId?.email || selectedDoctor.email}</p>
                      </div>
                      <div>
                        <p className='text-sm text-neutral-600'>Phone</p>
                        <p className='font-semibold text-neutral-900'>{selectedDoctor.userId?.phone || selectedDoctor.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className='text-sm text-neutral-600'>Specialty</p>
                        <p className='font-semibold text-neutral-900'>
                          {selectedDoctor.professional?.specialization?.[0] || selectedDoctor.specialty || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-neutral-600'>License Number</p>
                        <p className='font-semibold text-neutral-900'>
                          {selectedDoctor.professional?.licenseNumber || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-neutral-600'>Experience</p>
                        <p className='font-semibold text-neutral-900'>
                          {selectedDoctor.professional?.experienceYears || 'N/A'} years
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Uploaded Documents */}
                <Card>
                  <div className='p-6'>
                    <h2 className='text-lg font-bold text-neutral-900 mb-4'>Uploaded Documents</h2>
                    <div className='space-y-3'>
                      {documents.length === 0 ? (
                        <p className='text-neutral-500 text-center py-4'>No documents uploaded</p>
                      ) : (
                        documents.map((doc, index) => (
                          <div key={index} className='p-4 border border-neutral-200 rounded-lg'>
                            <div className='flex items-center justify-between'>
                              <div>
                                <p className='font-medium text-neutral-900'>{doc.type || 'Document'}</p>
                                <p className='text-sm text-neutral-600'>{doc.filename || doc.name}</p>
                              </div>
                              <Button
                                variant='secondary'
                                size='sm'
                                onClick={() => {
                                  if (doc.url) {
                                    window.open(doc.url, '_blank');
                                  } else {
                                    alert('Document URL not available');
                                  }
                                }}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>

                {/* Verification Actions */}
                <Card>
                  <div className='p-6'>
                    <h2 className='text-lg font-bold text-neutral-900 mb-4'>Verification Actions</h2>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-neutral-700 mb-2'>
                          Comments / Notes
                        </label>
                        <textarea
                          className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                          rows={4}
                          value={verificationComment}
                          onChange={(e) => setVerificationComment(e.target.value)}
                          placeholder='Add verification notes or comments...'
                        />
                      </div>
                      <div className='flex gap-3'>
                        <Button
                          variant='primary'
                          onClick={() => handleApprove(selectedDoctor._id)}
                          disabled={submitting}
                        >
                          {submitting ? 'Processing...' : 'Approve Doctor'}
                        </Button>
                        <Button
                          variant='outline'
                          onClick={() => handleReject(selectedDoctor._id)}
                          disabled={submitting}
                          className='border-red-300 text-red-700 hover:bg-red-50'
                        >
                          {submitting ? 'Processing...' : 'Reject Application'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Request Additional Documents */}
                <Card>
                  <div className='p-6'>
                    <h2 className='text-lg font-bold text-neutral-900 mb-4'>Request Additional Documents</h2>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-neutral-700 mb-2'>
                          Document Type Needed
                        </label>
                        <select
                          className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                          value={requestDocumentType}
                          onChange={(e) => setRequestDocumentType(e.target.value)}
                        >
                          <option value=''>Select document type...</option>
                          <option value='medical_license'>Medical License</option>
                          <option value='degree_certificate'>Degree Certificate</option>
                          <option value='id_proof'>ID Proof</option>
                          <option value='clinic_registration'>Clinic Registration</option>
                          <option value='other'>Other</option>
                        </select>
                      </div>
                      <Button
                        variant='secondary'
                        onClick={() => handleRequestDocuments(selectedDoctor._id)}
                        disabled={!requestDocumentType.trim()}
                      >
                        Request Document
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card>
                <div className='p-12 text-center'>
                  <p className='text-neutral-500 mb-4'>Select a doctor from the list to review their application</p>
                  <Button variant='secondary' onClick={() => router.push('/admin/doctors')}>
                    View All Doctors
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function AdminDoctorVerificationPage() {
  return (
    <Suspense fallback={<Loader fullScreen size='lg' />}>
      <AdminDoctorVerificationContent />
    </Suspense>
  );
}
