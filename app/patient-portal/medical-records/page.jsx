'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PatientMedicalRecordsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [activeTab, setActiveTab] = useState('timeline');
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('reports'); // reports, prescriptions, bills, images
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      
      // Fetch patient profile with documents
      const patientResponse = await apiClient.get('/auth/me');
      if (patientResponse.success) {
        setPatient(patientResponse.data);
      }

      // Fetch documents separately
      try {
        const docsResponse = await apiClient.get('/patients/me/documents');
        if (docsResponse.success && docsResponse.data) {
          setPatient((prev) => ({
            ...prev,
            attachments: docsResponse.data.documents || [],
          }));
        }
      } catch (err) {
        console.error('Failed to fetch documents:', err);
      }

      // Fetch medical history
      try {
        const historyResponse = await apiClient.get('/patients/me/medical-history');
        if (historyResponse.success) {
          setMedicalHistory(historyResponse.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch medical history:', err);
      }

      // Fetch appointments
      const appointmentsResponse = await apiClient.get('/appointments?limit=100&sortBy=appointmentDate&sortOrder=desc');
      if (appointmentsResponse.success) {
        setAppointments(appointmentsResponse.data || []);
      }

      // Fetch prescriptions
      const prescriptionsResponse = await apiClient.get('/prescriptions?limit=100&sortBy=createdAt&sortOrder=desc');
      if (prescriptionsResponse.success) {
        setPrescriptions(prescriptionsResponse.data || []);
      }

      // Fetch lab reports (from prescriptions with lab items)
      const labItems = prescriptions
        .flatMap((p) => p.items?.filter((i) => i.itemType === 'lab') || [])
        .map((item) => ({
          _id: item.labTestName || '',
          testName: item.labTestName || '',
          date: new Date().toISOString(),
          status: 'pending',
        }));
      setLabReports(labItems);
    } catch (err) {
      console.error('Failed to fetch medical records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, JPG, or PNG file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', uploadCategory);
      formData.append('documentType', uploadCategory); // reports, prescriptions, bills, images

      const response = await apiClient.post('/patients/me/documents', formData);

      if (response.success) {
        alert('Document uploaded successfully');
        fetchMedicalRecords();
      } else {
        alert(response.error || 'Failed to upload document');
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const shareWithDoctor = async (documentId, doctorId) => {
    try {
      const response = await apiClient.post(`/patients/me/documents/${documentId}/share`, {
        doctorId,
      });
      if (response.success) {
        alert('Document shared with doctor successfully');
      } else {
        alert('Failed to share document');
      }
    } catch (err) {
      alert('Failed to share document');
    }
  };

  const downloadDocument = (document) => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <Loader size='lg' />
      </div>
    );
  }

  // Combine all records for timeline
  const timelineItems = [
    ...appointments.map((apt) => ({
      type: 'appointment',
      date: apt.appointmentDate || apt.startTime,
      title: `Appointment with Dr. ${apt.doctorId?.userId?.firstName || ''} ${apt.doctorId?.userId?.lastName || ''}`,
      description: apt.reason || apt.type || 'Consultation',
      data: apt,
      icon: '📅',
      color: 'blue',
    })),
    ...prescriptions.map((pres) => ({
      type: 'prescription',
      date: pres.createdAt,
      title: `Prescription: ${pres.diagnosis || 'No diagnosis'}`,
      description: `${pres.items?.length || 0} medicines prescribed`,
      data: pres,
      icon: '💊',
      color: 'green',
    })),
    ...labReports.map((lab) => ({
      type: 'lab',
      date: lab.date,
      title: `Lab Test: ${lab.testName}`,
      description: lab.status,
      data: lab,
      icon: '🔬',
      color: 'purple',
    })),
    ...(patient?.attachments || []).map((doc) => ({
      type: 'document',
      date: doc.uploadedAt || doc.createdAt,
      title: doc.filename || 'Document',
      description: `${doc.category || doc.documentType || 'Document'} uploaded`,
      data: doc,
      icon: '📄',
      color: 'gray',
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

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
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-bold text-neutral-900'>Medical Records</h1>
          <div>
            <label className='cursor-pointer'>
              <input
                type='file'
                className='hidden'
                accept='.pdf,.jpg,.jpeg,.png'
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Button variant='primary' disabled={uploading} as='span'>
                {uploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className='flex gap-2 mb-6 border-b border-neutral-200'>
          {['timeline', 'appointments', 'prescriptions', 'lab-reports', 'documents'].map(
            (tab) => (
              <button
                key={tab}
                className={`px-4 py-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.replace('-', ' ')}
              </button>
            )
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'timeline' && (
          <Card>
            <div className='p-6'>
              <h2 className='text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2'>
                <svg className='icon icon-md text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                Medical History Timeline
              </h2>
              {timelineItems.length > 0 ? (
                <div className='relative'>
                  {/* Timeline Line */}
                  <div className='absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-200' />
                  
                  <div className='space-y-6'>
                    {timelineItems.map((item, index) => (
                      <div key={index} className='relative flex gap-6 pl-2'>
                        {/* Timeline Dot */}
                        <div className='flex-shrink-0 relative z-10'>
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${
                              item.color === 'blue'
                                ? 'bg-blue-500'
                                : item.color === 'green'
                                ? 'bg-green-500'
                                : item.color === 'purple'
                                ? 'bg-purple-500'
                                : 'bg-neutral-500'
                            }`}
                          >
                            <span className='text-white text-lg'>{item.icon}</span>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <Card className='flex-1 p-4 hover:shadow-lg transition-shadow'>
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <h3 className='font-semibold text-neutral-900 mb-1'>{item.title}</h3>
                              <p className='text-sm text-neutral-600 mb-2'>{item.description}</p>
                              <p className='text-xs text-neutral-500'>{formatDate(item.date)}</p>
                            </div>
                            <div className='flex items-center gap-2'>
                              {item.type === 'appointment' && (
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => router.push(`/patient-portal/appointments/${item.data._id}`)}
                                >
                                  View
                                </Button>
                              )}
                              {item.type === 'prescription' && (
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => router.push(`/patient-portal/prescriptions/${item.data._id}`)}
                                >
                                  View
                                </Button>
                              )}
                              {item.type === 'document' && (
                                <>
                                  <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => downloadDocument(item.data)}
                                  >
                                    Download
                                  </Button>
                                  <Button
                                    variant='secondary'
                                    size='sm'
                                    onClick={() => {
                                      if (doctors.length > 0) {
                                        const doctorId = prompt('Select doctor ID to share with');
                                        if (doctorId) {
                                          shareWithDoctor(item.data._id || item.data.id, doctorId);
                                        }
                                      }
                                    }}
                                  >
                                    Share
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className='text-center py-12'>
                  <p className='text-neutral-500 mb-4'>No medical records yet</p>
                  <p className='text-sm text-neutral-400'>
                    Your medical history will appear here as you book appointments and upload documents
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'appointments' && (
          <Card>
            <div className='p-6'>
              <h2 className='text-lg font-bold text-neutral-900 mb-4'>All Appointments</h2>
              {appointments.length > 0 ? (
                <div className='space-y-3'>
                  {appointments.map((apt) => (
                    <div
                      key={apt._id}
                      className='p-4 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer'
                      onClick={() => router.push(`/patient-portal/appointments/${apt._id}`)}
                    >
                      <div className='flex items-start justify-between'>
                        <div>
                          <h3 className='font-semibold text-neutral-900'>
                            Dr. {apt.doctorId?.userId?.firstName} {apt.doctorId?.userId?.lastName}
                          </h3>
                          <p className='text-sm text-neutral-600'>
                            {formatDate(apt.appointmentDate || apt.startTime)}
                          </p>
                        </div>
                        <span className='text-sm text-neutral-500 capitalize'>{apt.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-neutral-500 text-center py-12'>No appointments found</p>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'prescriptions' && (
          <Card>
            <div className='p-6'>
              <h2 className='text-lg font-bold text-neutral-900 mb-4'>All Prescriptions</h2>
              {prescriptions.length > 0 ? (
                <div className='space-y-3'>
                  {prescriptions.map((pres) => (
                    <div
                      key={pres._id}
                      className='p-4 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer'
                      onClick={() => router.push(`/patient-portal/prescriptions/${pres._id}`)}
                    >
                      <div className='flex items-start justify-between'>
                        <div>
                          <h3 className='font-semibold text-neutral-900'>
                            {pres.prescriptionNumber || pres._id.slice(-8)}
                          </h3>
                          <p className='text-sm text-neutral-600'>
                            {formatDate(pres.createdAt)} • {pres.diagnosis || 'No diagnosis'}
                          </p>
                        </div>
                        <span className='text-sm text-neutral-500 capitalize'>{pres.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-neutral-500 text-center py-12'>No prescriptions found</p>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'lab-reports' && (
          <Card>
            <div className='p-6'>
              <h2 className='text-lg font-bold text-neutral-900 mb-4'>Lab Reports</h2>
              {labReports.length > 0 ? (
                <div className='space-y-3'>
                  {labReports.map((lab, index) => (
                    <div key={index} className='p-4 border border-neutral-200 rounded-lg'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <h3 className='font-semibold text-neutral-900'>{lab.testName}</h3>
                          <p className='text-sm text-neutral-600'>{formatDate(lab.date)}</p>
                        </div>
                        <span className='text-sm text-neutral-500 capitalize'>{lab.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-neutral-500 text-center py-12'>No lab reports found</p>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'documents' && (
          <Card>
            <div className='p-6'>
              <h2 className='text-lg font-bold text-neutral-900 mb-4'>Uploaded Documents</h2>
              {patient?.attachments && patient.attachments.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {patient.attachments.map((doc, index) => (
                    <Card key={index} className='p-4 hover:shadow-lg transition-shadow'>
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex-1'>
                          <h3 className='font-semibold text-neutral-900 mb-1 truncate'>{doc.filename || 'Document'}</h3>
                          <div className='flex items-center gap-2 mb-2'>
                            <Tag className='bg-primary-100 text-primary-800 text-xs'>
                              {doc.category || doc.documentType || 'Document'}
                            </Tag>
                            <span className='text-xs text-neutral-500'>
                              {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => downloadDocument(doc)}
                          className='flex-1'
                        >
                          <svg className='icon icon-xs mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                            />
                          </svg>
                          Download
                        </Button>
                        <Button
                          variant='secondary'
                          size='sm'
                          onClick={() => {
                            // TODO: Open share modal
                            if (doctors.length > 0) {
                              const doctorId = prompt('Select doctor ID to share with');
                              if (doctorId) {
                                shareWithDoctor(doc._id || doc.id, doctorId);
                              }
                            } else {
                              alert('No doctors available to share with');
                            }
                          }}
                        >
                          <svg className='icon icon-xs' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
                            />
                          </svg>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className='text-center py-12'>
                  <p className='text-neutral-500 mb-4'>No documents uploaded yet</p>
                  <label className='cursor-pointer inline-block'>
                    <input
                      type='file'
                      className='hidden'
                      accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    <Button variant='primary' disabled={uploading} as='span'>
                      Upload Your First Document
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
