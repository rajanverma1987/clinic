'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DoctorPatientRecordsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const patientId = params.id;
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [clinicalNotes, setClinicalNotes] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [personalNotes, setPersonalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'doctor') {
      router.push('/dashboard');
      return;
    }
    if (patientId) {
      fetchAllData();
    }
  }, [authLoading, user, router, patientId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch patient
      const patientResponse = await apiClient.get(`/patients/${patientId}`);
      if (patientResponse.success) {
        setPatient(patientResponse.data);
      }

      // Fetch appointments
      const appointmentsResponse = await apiClient.get(
        `/appointments?patientId=${patientId}&limit=100&sortBy=appointmentDate&sortOrder=desc`
      );
      if (appointmentsResponse.success) {
        const appointmentsData = extractArrayData(appointmentsResponse);
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      }

      // Fetch prescriptions
      const prescriptionsResponse = await apiClient.get(
        `/prescriptions?patientId=${patientId}&limit=100&sortBy=createdAt&sortOrder=desc`
      );
      if (prescriptionsResponse.success) {
        const prescriptionsData = extractArrayData(prescriptionsResponse);
        setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);
      }

      // Fetch clinical notes
      const notesResponse = await apiClient.get(
        `/clinical-notes?patientId=${patientId}&limit=100&sortBy=createdAt&sortOrder=desc`
      );
      if (notesResponse.success) {
        const notesData = extractArrayData(notesResponse);
        setClinicalNotes(Array.isArray(notesData) ? notesData : []);
      }

      // Fetch medical history
      try {
        const historyResponse = await apiClient.get(`/patients/${patientId}/medical-history`);
        if (historyResponse.success) {
          setMedicalHistory(historyResponse.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch medical history:', err);
      }

      // Fetch lab reports
      try {
        const labResponse = await apiClient.get(`/lab-results?patientId=${patientId}&limit=100&sortBy=createdAt&sortOrder=desc`);
        if (labResponse.success) {
          const labData = extractArrayData(labResponse);
          setLabReports(Array.isArray(labData) ? labData : []);
        }
      } catch (err) {
        console.error('Failed to fetch lab reports:', err);
      }

      // Fetch personal notes (doctor's private notes about this patient)
      try {
        const notesResponse = await apiClient.get(`/patients/${patientId}/doctor-notes`);
        if (notesResponse.success) {
          setPersonalNotes(notesResponse.data?.notes || '');
        }
      } catch (err) {
        // Endpoint might not exist yet, that's okay
        console.warn('Doctor notes endpoint not available:', err);
      }
    } catch (err) {
      console.error('Failed to fetch patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <Loader fullScreen size='lg' />
      </Layout>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  if (!patient) {
    return (
      <Layout>
        <Card className='p-8 text-center'>
          <p className='text-neutral-500 mb-4'>Patient not found</p>
          <Button variant='primary' onClick={() => router.push('/patients')}>
            Back to Patients
          </Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='max-w-7xl mx-auto space-y-6'>
        <PageHeader
          title={`Patient: ${patient.firstName} ${patient.lastName}`}
          subtitle={`Patient ID: ${patient.patientId || patient._id.slice(-8)}`}
        />

        {/* Patient Info Card */}
        <Card>
          <div className='p-6'>
            <div className='flex items-start justify-between mb-4'>
              <div className='flex items-center gap-4'>
                <div className='w-20 h-20 bg-primary-100 rounded-lg flex items-center justify-center'>
                  <span className='text-3xl font-bold text-primary-600'>
                    {patient.firstName?.charAt(0) || 'P'}
                  </span>
                </div>
                <div>
                  <h2 className='text-2xl font-bold text-neutral-900'>
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <p className='text-neutral-600'>
                    {patient.dateOfBirth
                      ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years old`
                      : 'Age not specified'}
                    {patient.gender && ` • ${patient.gender}`}
                  </p>
                  <p className='text-sm text-neutral-500 mt-1'>
                    {patient.phone} {patient.email && `• ${patient.email}`}
                  </p>
                </div>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='primary'
                  onClick={() => router.push(`/prescriptions/new?patientId=${patientId}`)}
                >
                  New Prescription
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => router.push(`/appointments/new?patientId=${patientId}`)}
                >
                  New Appointment
                </Button>
              </div>
            </div>

            {/* Quick Info */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-neutral-200'>
              <div>
                <p className='text-sm text-neutral-600'>Blood Group</p>
                <p className='font-semibold text-neutral-900'>
                  {patient.bloodGroup || 'Not specified'}
                </p>
              </div>
              <div>
                <p className='text-sm text-neutral-600'>Allergies</p>
                <p className='font-semibold text-neutral-900'>
                  {patient.allergies?.length > 0 ? patient.allergies.join(', ') : 'None'}
                </p>
              </div>
              <div>
                <p className='text-sm text-neutral-600'>Total Visits</p>
                <p className='font-semibold text-neutral-900'>{appointments.length}</p>
              </div>
              <div>
                <p className='text-sm text-neutral-600'>Last Visit</p>
                <p className='font-semibold text-neutral-900'>
                  {appointments.length > 0
                    ? formatDate(appointments[0].appointmentDate || appointments[0].startTime)
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className='border-b border-neutral-200'>
          <div className='flex gap-4 overflow-x-auto'>
            {['overview', 'appointments', 'prescriptions', 'clinical-notes', 'lab-reports', 'medical-history', 'personal-notes'].map(
              (tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 font-medium text-sm capitalize whitespace-nowrap ${
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
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <div className='p-6'>
                <h3 className='text-lg font-bold text-neutral-900 mb-4'>Recent Appointments</h3>
                {appointments.slice(0, 5).length > 0 ? (
                  <div className='space-y-3'>
                    {appointments.slice(0, 5).map((apt) => (
                      <div
                        key={apt._id}
                        className='p-3 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer'
                        onClick={() => router.push(`/appointments/${apt._id}`)}
                      >
                        <div className='flex items-start justify-between'>
                          <div>
                            <p className='font-medium text-neutral-900'>
                              {formatDate(apt.appointmentDate || apt.startTime)}
                            </p>
                            <p className='text-sm text-neutral-600'>
                              {apt.type || 'Consultation'} • {apt.status}
                            </p>
                          </div>
                          <Tag
                            className={
                              apt.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : apt.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {apt.status}
                          </Tag>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-neutral-500 text-center py-4'>No appointments yet</p>
                )}
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <h3 className='text-lg font-bold text-neutral-900 mb-4'>Recent Prescriptions</h3>
                {prescriptions.slice(0, 5).length > 0 ? (
                  <div className='space-y-3'>
                    {prescriptions.slice(0, 5).map((pres) => (
                      <div
                        key={pres._id}
                        className='p-3 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer'
                        onClick={() => router.push(`/prescriptions/${pres._id}`)}
                      >
                        <div className='flex items-start justify-between'>
                          <div>
                            <p className='font-medium text-neutral-900'>
                              {formatDate(pres.createdAt)}
                            </p>
                            <p className='text-sm text-neutral-600'>
                              {pres.diagnosis || 'No diagnosis'} • {pres.items.length} items
                            </p>
                          </div>
                          <Tag
                            className={
                              pres.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {pres.status}
                          </Tag>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-neutral-500 text-center py-4'>No prescriptions yet</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'appointments' && (
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-bold text-neutral-900'>All Appointments</h3>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={() => router.push(`/appointments/new?patientId=${patientId}`)}
                >
                  New Appointment
                </Button>
              </div>
              {appointments.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-neutral-200'>
                        <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>
                          Date
                        </th>
                        <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>
                          Time
                        </th>
                        <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>
                          Type
                        </th>
                        <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>
                          Status
                        </th>
                        <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((apt) => (
                        <tr
                          key={apt._id}
                          className='border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer'
                          onClick={() => router.push(`/appointments/${apt._id}`)}
                        >
                          <td className='py-3 px-4 text-sm text-neutral-900'>
                            {formatDate(apt.appointmentDate || apt.startTime)}
                          </td>
                          <td className='py-3 px-4 text-sm text-neutral-600'>
                            {new Date(apt.startTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className='py-3 px-4 text-sm text-neutral-600 capitalize'>
                            {apt.type || 'Consultation'}
                          </td>
                          <td className='py-3 px-4'>
                            <Tag
                              className={
                                apt.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : apt.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }
                            >
                              {apt.status}
                            </Tag>
                          </td>
                          <td className='py-3 px-4'>
                            <Button
                              variant='secondary'
                              size='sm'
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/appointments/${apt._id}`);
                              }}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className='text-center py-12'>
                  <p className='text-neutral-500 mb-4'>No appointments found</p>
                  <Button
                    variant='primary'
                    onClick={() => router.push(`/appointments/new?patientId=${patientId}`)}
                  >
                    Create First Appointment
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'prescriptions' && (
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-bold text-neutral-900'>All Prescriptions</h3>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={() => router.push(`/prescriptions/new?patientId=${patientId}`)}
                >
                  New Prescription
                </Button>
              </div>
              {prescriptions.length > 0 ? (
                <div className='space-y-4'>
                  {prescriptions.map((pres) => (
                    <div
                      key={pres._id}
                      className='p-4 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer'
                      onClick={() => router.push(`/prescriptions/${pres._id}`)}
                    >
                      <div className='flex items-start justify-between mb-2'>
                        <div>
                          <p className='font-semibold text-neutral-900'>
                            {pres.prescriptionNumber || pres._id.slice(-8)}
                          </p>
                          <p className='text-sm text-neutral-600'>
                            {formatDate(pres.createdAt)} • {pres.diagnosis || 'No diagnosis'}
                          </p>
                        </div>
                        <Tag
                          className={
                            pres.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {pres.status}
                        </Tag>
                      </div>
                      <div className='text-sm text-neutral-600'>
                        {pres.items.length} medicine{pres.items.length !== 1 ? 's' : ''} prescribed
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-12'>
                  <p className='text-neutral-500 mb-4'>No prescriptions found</p>
                  <Button
                    variant='primary'
                    onClick={() => router.push(`/prescriptions/new?patientId=${patientId}`)}
                  >
                    Create First Prescription
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'clinical-notes' && (
          <Card>
            <div className='p-6'>
              <h3 className='text-lg font-bold text-neutral-900 mb-4'>Clinical Notes</h3>
              {clinicalNotes.length > 0 ? (
                <div className='space-y-4'>
                  {clinicalNotes.map((note) => (
                    <div
                      key={note._id}
                      className='p-4 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer'
                      onClick={() => router.push(`/clinical-notes/${note._id}`)}
                    >
                      <div className='flex items-start justify-between mb-2'>
                        <div>
                          <p className='font-semibold text-neutral-900'>
                            {note.type?.toUpperCase() || 'Clinical Note'}
                          </p>
                          <p className='text-sm text-neutral-600'>{formatDateTime(note.createdAt)}</p>
                        </div>
                        <Tag className='bg-blue-100 text-blue-800'>{note.type || 'Note'}</Tag>
                      </div>
                      {note.soap && (
                        <div className='text-sm text-neutral-700 mt-2'>
                          <p>
                            <strong>Subjective:</strong> {note.soap.subjective || 'N/A'}
                          </p>
                          <p className='mt-1'>
                            <strong>Objective:</strong> {note.soap.objective || 'N/A'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-neutral-500 text-center py-12'>No clinical notes found</p>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'lab-reports' && (
          <Card>
            <div className='p-6'>
              <h3 className='text-lg font-bold text-neutral-900 mb-4'>Lab Reports</h3>
              {labReports.length > 0 ? (
                <div className='space-y-4'>
                  {labReports.map((report) => (
                    <div
                      key={report._id}
                      className='p-4 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow'
                    >
                      <div className='flex items-start justify-between mb-2'>
                        <div>
                          <p className='font-semibold text-neutral-900'>{report.testName || report.name || 'Lab Test'}</p>
                          <p className='text-sm text-neutral-600'>{formatDate(report.date || report.createdAt)}</p>
                        </div>
                        <Tag className={report.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {report.status || 'Pending'}
                        </Tag>
                      </div>
                      {report.results && report.results.length > 0 && (
                        <div className='mt-3 space-y-2'>
                          {report.results.slice(0, 3).map((result, index) => (
                            <div key={index} className='text-sm'>
                              <span className='font-medium text-neutral-900'>{result.parameter}:</span>{' '}
                              <span className='text-neutral-700'>{result.value} {result.unit || ''}</span>
                              {result.normalRange && (
                                <span className='text-neutral-500 ml-2'>(Range: {result.normalRange})</span>
                              )}
                            </div>
                          ))}
                          {report.results.length > 3 && (
                            <p className='text-xs text-neutral-500'>+{report.results.length - 3} more results</p>
                          )}
                        </div>
                      )}
                      <Button
                        variant='secondary'
                        size='sm'
                        className='mt-3'
                        onClick={() => router.push(`/lab-results/${report._id}`)}
                      >
                        View Full Report
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-neutral-500 text-center py-12'>No lab reports found</p>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'medical-history' && (
          <Card>
            <div className='p-6'>
              <h3 className='text-lg font-bold text-neutral-900 mb-4'>Medical History Timeline</h3>
              
              {/* Allergies and Chronic Conditions */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                {patient.allergies && patient.allergies.length > 0 && (
                  <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                    <h4 className='font-semibold text-red-900 mb-2 flex items-center gap-2'>
                      <svg className='icon icon-sm' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                      </svg>
                      Allergies
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {patient.allergies.map((allergy, index) => (
                        <Tag key={index} className='bg-red-100 text-red-800'>
                          {allergy}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
                {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                  <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <h4 className='font-semibold text-yellow-900 mb-2 flex items-center gap-2'>
                      <svg className='icon icon-sm' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                      </svg>
                      Chronic Conditions
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {patient.chronicConditions.map((condition, index) => (
                        <Tag key={index} className='bg-yellow-100 text-yellow-800'>
                          {condition}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline View */}
              <div className='space-y-6'>
                {/* Combine all events into a timeline */}
                {[
                  ...appointments.map((apt) => ({ type: 'appointment', data: apt, date: apt.appointmentDate || apt.startTime })),
                  ...prescriptions.map((pres) => ({ type: 'prescription', data: pres, date: pres.createdAt })),
                  ...clinicalNotes.map((note) => ({ type: 'note', data: note, date: note.createdAt })),
                  ...labReports.map((report) => ({ type: 'lab', data: report, date: report.date || report.createdAt })),
                ]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((event, index) => (
                    <div key={`${event.type}-${event.data._id}`} className='relative flex gap-6 pl-2'>
                      <div className='flex-shrink-0 relative z-10'>
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${
                            event.type === 'appointment'
                              ? 'bg-blue-500'
                              : event.type === 'prescription'
                              ? 'bg-green-500'
                              : event.type === 'lab'
                              ? 'bg-purple-500'
                              : 'bg-neutral-500'
                          }`}
                        >
                          <span className='text-white text-lg'>
                            {event.type === 'appointment'
                              ? '📅'
                              : event.type === 'prescription'
                              ? '💊'
                              : event.type === 'lab'
                              ? '🔬'
                              : '📝'}
                          </span>
                        </div>
                        {index <
                          [
                            ...appointments,
                            ...prescriptions,
                            ...clinicalNotes,
                            ...labReports,
                          ].length -
                            1 && (
                          <div className='absolute top-12 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-neutral-200' style={{ height: 'calc(100% + 1.5rem)' }} />
                        )}
                      </div>
                      <Card className='flex-1 p-4 hover:shadow-lg transition-shadow'>
                        <div className='flex items-start justify-between mb-2'>
                          <div>
                            <h4 className='font-semibold text-neutral-900'>
                              {event.type === 'appointment'
                                ? `Appointment - ${event.data.type || 'Consultation'}`
                                : event.type === 'prescription'
                                ? `Prescription #${event.data.prescriptionNumber || event.data._id.slice(-8)}`
                                : event.type === 'lab'
                                ? `Lab Test - ${event.data.testName || event.data.name}`
                                : 'Clinical Note'}
                            </h4>
                            <p className='text-sm text-neutral-600'>{formatDateTime(event.date)}</p>
                          </div>
                          <Button
                            variant='secondary'
                            size='sm'
                            onClick={() => {
                              if (event.type === 'appointment') {
                                router.push(`/appointments/${event.data._id}`);
                              } else if (event.type === 'prescription') {
                                router.push(`/prescriptions/${event.data._id}`);
                              } else if (event.type === 'lab') {
                                router.push(`/lab-results/${event.data._id}`);
                              } else {
                                router.push(`/clinical-notes/${event.data._id}`);
                              }
                            }}
                          >
                            View
                          </Button>
                        </div>
                        {event.type === 'appointment' && (
                          <p className='text-sm text-neutral-700'>
                            Status: {event.data.status} • {event.data.reason || 'No reason provided'}
                          </p>
                        )}
                        {event.type === 'prescription' && (
                          <p className='text-sm text-neutral-700'>
                            Diagnosis: {event.data.diagnosis || 'N/A'} • {event.data.items?.length || 0} medicines
                          </p>
                        )}
                        {event.type === 'lab' && (
                          <p className='text-sm text-neutral-700'>
                            Status: {event.data.status} • {event.data.results?.length || 0} results
                          </p>
                        )}
                        {event.type === 'note' && event.data.notes && (
                          <p className='text-sm text-neutral-700 mt-2 line-clamp-2'>{event.data.notes}</p>
                        )}
                      </Card>
                    </div>
                  ))}
                {appointments.length === 0 && prescriptions.length === 0 && clinicalNotes.length === 0 && labReports.length === 0 && (
                  <p className='text-neutral-500 text-center py-12'>No medical history timeline available</p>
                )}
              </div>

              {patient.medicalHistory && (
                <div className='mt-6 p-4 bg-neutral-50 rounded-lg'>
                  <h4 className='font-semibold text-neutral-900 mb-2'>Additional Medical History</h4>
                  <p className='text-neutral-700 whitespace-pre-wrap'>{patient.medicalHistory}</p>
                </div>
              )}

              {patient.currentMedications && patient.currentMedications.length > 0 && (
                <div className='mt-6'>
                  <h4 className='font-semibold text-neutral-900 mb-2'>Current Medications</h4>
                  <div className='space-y-2'>
                    {patient.currentMedications.map((med, index) => (
                      <div key={index} className='p-3 bg-neutral-50 rounded-lg'>
                        <p className='text-neutral-900'>{med}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'personal-notes' && (
          <Card>
            <div className='p-6'>
              <h3 className='text-lg font-bold text-neutral-900 mb-4'>Personal Notes</h3>
              <p className='text-sm text-neutral-600 mb-4'>
                Private notes visible only to you. Use this to record observations, reminders, or any other information about this patient.
              </p>
              <textarea
                className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                rows={10}
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                placeholder='Enter your personal notes about this patient...'
              />
              <div className='flex justify-end mt-4'>
                <Button
                  variant='primary'
                  onClick={async () => {
                    try {
                      setSavingNotes(true);
                      const response = await apiClient.put(`/patients/${patientId}/doctor-notes`, {
                        notes: personalNotes,
                      });
                      if (response.success) {
                        alert('Personal notes saved');
                      } else {
                        alert('Failed to save notes');
                      }
                    } catch (err) {
                      alert('Failed to save personal notes');
                    } finally {
                      setSavingNotes(false);
                    }
                  }}
                  disabled={savingNotes}
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
