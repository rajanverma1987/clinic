'use client';

import { EyeIcon, PencilIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tabs, getTabPanelId, getTabPanelLabelledBy } from '@/components/ui/Tabs';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DoctorPatientRecordsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const patientId = params.id;
  const tabFromUrl = searchParams.get('tab');
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [clinicalNotes, setClinicalNotes] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [personalNotes, setPersonalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'notes' ? 'notes' : 'timeline');

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

  useEffect(() => {
    if (
      tabFromUrl &&
      [
        'timeline',
        'vitals',
        'prescriptions',
        'lab-results',
        'imaging',
        'allergies',
        'conditions',
        'notes',
      ].includes(tabFromUrl)
    ) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (id) => {
    setActiveTab(id);
    const path = `/doctors/patients/${patientId}`;
    queueMicrotask(() => router.replace(path + '?tab=' + encodeURIComponent(id)));
  };

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
        `/appointments?patientId=${patientId}&limit=100&sortBy=appointmentDate&sortOrder=desc`,
      );
      if (appointmentsResponse.success) {
        const appointmentsData = extractArrayData(appointmentsResponse);
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      }

      // Fetch prescriptions
      const prescriptionsResponse = await apiClient.get(
        `/prescriptions?patientId=${patientId}&limit=100&sortBy=createdAt&sortOrder=desc`,
      );
      if (prescriptionsResponse.success) {
        const prescriptionsData = extractArrayData(prescriptionsResponse);
        setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);
      }

      // Fetch clinical notes
      const notesResponse = await apiClient.get(
        `/clinical-notes?patientId=${patientId}&limit=100&sortBy=createdAt&sortOrder=desc`,
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
        logger.error('Failed to fetch medical history:', err);
      }

      // Fetch lab reports
      try {
        const labResponse = await apiClient.get(
          `/lab-results?patientId=${patientId}&limit=100&sortBy=createdAt&sortOrder=desc`,
        );
        if (labResponse.success) {
          const labData = extractArrayData(labResponse);
          setLabReports(Array.isArray(labData) ? labData : []);
        }
      } catch (err) {
        logger.error('Failed to fetch lab reports:', err);
      }

      // Fetch personal notes (doctor's private notes about this patient)
      try {
        const notesResponse = await apiClient.get(`/patients/${patientId}/doctor-notes`);
        if (notesResponse.success) {
          setPersonalNotes(notesResponse.data?.notes || '');
        }
      } catch (err) {
        // Endpoint might not exist yet, that's okay
        logger.warn('Doctor notes endpoint not available', { error: err?.message });
      }
    } catch (err) {
      logger.error('Failed to fetch patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
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
        <Loader type='page' text={t('common.loading')} />
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
          <p className='text-neutral-500'>{t('patients.patientNotFound')}</p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '0 10px' }} className='space-y-6'>
        <PageHeader
          title={`Patient: ${patient.firstName} ${patient.lastName}`}
          subtitle={`Patient ID: ${patient.patientId || patient._id.slice(-8)}`}
        />

        {/* Demographics section */}
        <section aria-labelledby='demographics-heading'>
          <h2 id='demographics-heading' className='sr-only'>
            {t('patients.demographics')}
          </h2>
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
                        : t('patients.ageNotSpecified')}
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
                    {t('patients.newPrescription')}
                  </Button>
                  <Button
                    variant='secondary'
                    onClick={() => router.push(`/appointments/new?patientId=${patientId}`)}
                  >
                    {t('patients.newAppointment')}
                  </Button>
                </div>
              </div>

              {/* Quick Info */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-neutral-200'>
                <div>
                  <p className='text-sm text-neutral-600'>{t('patients.bloodGroup')}</p>
                  <p className='font-semibold text-neutral-900'>
                    {patient.bloodGroup || t('patients.notSpecified')}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-neutral-600'>{t('patients.allergies')}</p>
                  <p className='font-semibold text-neutral-900'>
                    {patient.allergies?.length > 0
                      ? patient.allergies.join(', ')
                      : t('common.none')}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-neutral-600'>{t('patients.totalVisits')}</p>
                  <p className='font-semibold text-neutral-900'>{appointments.length}</p>
                </div>
                <div>
                  <p className='text-sm text-neutral-600'>{t('patients.lastVisit')}</p>
                  <p className='font-semibold text-neutral-900'>
                    {appointments.length > 0
                      ? formatDate(appointments[0].appointmentDate || appointments[0].startTime)
                      : t('common.never')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <Tabs
          tabs={[
            { id: 'timeline', label: t('patients.doctorPatientTimeline') },
            { id: 'vitals', label: t('patients.doctorPatientVitals') },
            { id: 'prescriptions', label: t('patients.doctorPatientPrescriptions') },
            { id: 'lab-results', label: t('patients.doctorPatientLabResults') },
            { id: 'imaging', label: t('patients.doctorPatientImaging') },
            { id: 'allergies', label: t('patients.doctorPatientAllergies') },
            { id: 'conditions', label: t('patients.doctorPatientConditions') },
            { id: 'notes', label: t('patients.doctorPatientNotes') },
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
          idPrefix='doctor-patient-tabs'
          ariaLabel={t('patients.patientRecord')}
        />

        <div
          role='tabpanel'
          id={getTabPanelId('doctor-patient-tabs', activeTab)}
          aria-labelledby={getTabPanelLabelledBy('doctor-patient-tabs', activeTab)}
        >
          {/* Timeline tab: chronological entries with View Full / Edit */}
          {activeTab === 'timeline' &&
            (() => {
              const timelineItems = [
                ...appointments.map((a) => ({
                  _id: a._id,
                  type: 'consultation',
                  label: `${a.type || 'Consultation'} • ${a.status}`,
                  date: a.appointmentDate || a.startTime,
                  link: `/appointments/${a._id}`,
                  editLink: `/appointments/${a._id}/edit`,
                })),
                ...prescriptions.map((p) => ({
                  _id: p._id,
                  type: 'prescription',
                  label: `Prescription ${p.prescriptionNumber || p._id?.slice(-8)} • ${p.status}`,
                  date: p.createdAt,
                  link: `/prescriptions/${p._id}`,
                  editLink: `/prescriptions/${p._id}/edit`,
                })),
                ...clinicalNotes.map((n) => ({
                  _id: n._id,
                  type: 'clinical_note',
                  label: `Clinical note • ${n.type || 'Note'}`,
                  date: n.createdAt,
                  link: `/clinical-notes/${n._id}`,
                  editLink: null,
                })),
                ...labReports.map((r) => ({
                  _id: r._id,
                  type: 'lab_result',
                  label: `Lab result • ${r.testId?.name || r._id?.slice(-8)}`,
                  date: r.reportedAt || r.createdAt,
                  link: null,
                  editLink: null,
                })),
              ].sort((a, b) => new Date(b.date) - new Date(a.date));

              return (
                <Card>
                  <div className='p-6'>
                    <h3 className='text-lg font-bold text-neutral-900 mb-4'>
                      {t('patients.doctorPatientTimeline')}
                    </h3>
                    {timelineItems.length > 0 ? (
                      <ul className='space-y-3'>
                        {timelineItems.map((item) => (
                          <li
                            key={`${item.type}-${item._id}`}
                            className='flex items-center justify-between gap-4 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50'
                          >
                            <div className='flex-1 min-w-0'>
                              <p className='font-medium text-neutral-900 capitalize'>
                                {item.label}
                              </p>
                              <p className='text-sm text-neutral-600'>
                                {formatDateTime(item.date)}
                              </p>
                            </div>
                            <div className='flex gap-2 flex-shrink-0'>
                              {item.link && (
                                <Button
                                  variant='secondary'
                                  size='sm'
                                  onClick={() => router.push(item.link)}
                                  className='p-2 min-w-[2.25rem]'
                                  title={t('common.show')}
                                  aria-label={t('common.show')}
                                >
                                  <EyeIcon className='icon icon-sm' ariaHidden />
                                </Button>
                              )}
                              {item.editLink && (
                                <Button
                                  variant='secondary'
                                  size='sm'
                                  onClick={() => router.push(item.editLink)}
                                  className='p-2 min-w-[2.25rem]'
                                  title={t('common.edit')}
                                  aria-label={t('common.edit')}
                                >
                                  <PencilIcon className='icon icon-sm' ariaHidden />
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className='text-neutral-500 text-center py-8'>
                        {t('patients.noTimelineEntries')}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })()}

          {/* Vitals tab */}
          {activeTab === 'vitals' && (
            <Card>
              <div className='p-6'>
                <h3 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('patients.doctorPatientVitals')}
                </h3>
                <p className='text-neutral-600 text-sm'>{t('patients.vitalsDescription')}</p>
              </div>
            </Card>
          )}

          {/* Tab Content - overview removed; timeline is primary. Prescriptions tab */}
          {activeTab === 'prescriptions' && (
            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-bold text-neutral-900'>
                    {t('patients.allPrescriptions')}
                  </h3>
                  <Button
                    variant='primary'
                    size='sm'
                    onClick={() => router.push(`/prescriptions/new?patientId=${patientId}`)}
                  >
                    {t('patients.newPrescription')}
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
                              {formatDate(pres.createdAt)} •{' '}
                              {pres.diagnosis || t('patients.noDiagnosis')}
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
                          {pres.items.length === 1
                            ? t('patients.medicinesPrescribedOne')
                            : t('patients.medicinesPrescribedOther', { count: pres.items.length })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-12'>
                    <p className='text-neutral-500 mb-4'>{t('patients.noPrescriptionsFound')}</p>
                    <Button
                      variant='primary'
                      onClick={() => router.push(`/prescriptions/new?patientId=${patientId}`)}
                    >
                      {t('patients.createFirstPrescription')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'lab-results' && (
            <Card>
              <div className='p-6'>
                <h3 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('patients.labReports')}
                </h3>
                {labReports.length > 0 ? (
                  <div className='space-y-4'>
                    {labReports.map((report) => (
                      <div
                        key={report._id}
                        className='p-4 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow'
                      >
                        <div className='flex items-start justify-between mb-2'>
                          <div>
                            <p className='font-semibold text-neutral-900'>
                              {report.testName || report.name || t('patients.labTest')}
                            </p>
                            <p className='text-sm text-neutral-600'>
                              {formatDate(report.date || report.createdAt)}
                            </p>
                          </div>
                          <Tag
                            className={
                              report.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {report.status || t('patients.statusPending')}
                          </Tag>
                        </div>
                        {report.results && report.results.length > 0 && (
                          <div className='mt-3 space-y-2'>
                            {report.results.slice(0, 3).map((result, index) => (
                              <div key={index} className='text-sm'>
                                <span className='font-medium text-neutral-900'>
                                  {result.parameter}:
                                </span>{' '}
                                <span className='text-neutral-700'>
                                  {result.value} {result.unit || ''}
                                </span>
                                {result.normalRange && (
                                  <span className='text-neutral-500 ml-2'>
                                    ({t('patients.range')}: {result.normalRange})
                                  </span>
                                )}
                              </div>
                            ))}
                            {report.results.length > 3 && (
                              <p className='text-xs text-neutral-500'>
                                {t('patients.moreResults', { count: report.results.length - 3 })}
                              </p>
                            )}
                          </div>
                        )}
                        <Button
                          variant='secondary'
                          size='sm'
                          className='mt-3'
                          onClick={() => router.push(`/lab-results/${report._id}`)}
                        >
                          {t('patients.viewFullReport')}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-neutral-500 text-center py-12'>
                    {t('patients.noLabReportsFound')}
                  </p>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'imaging' && (
            <Card>
              <div className='p-6'>
                <h3 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('patients.doctorPatientImaging')}
                </h3>
                <p className='text-neutral-600 text-sm'>{t('patients.imagingDescription')}</p>
              </div>
            </Card>
          )}

          {activeTab === 'allergies' && (
            <Card>
              <div className='p-6'>
                <h3 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('patients.doctorPatientAllergies')}
                </h3>
                {patient.allergies &&
                (Array.isArray(patient.allergies) ? patient.allergies : [patient.allergies]).filter(
                  Boolean,
                ).length > 0 ? (
                  <div className='flex flex-wrap gap-2'>
                    {(Array.isArray(patient.allergies)
                      ? patient.allergies
                      : [patient.allergies]
                    ).map((allergy, index) => (
                      <Tag key={index} className='bg-red-100 text-red-800'>
                        {typeof allergy === 'string'
                          ? allergy
                          : allergy?.name || allergy?.substance || t('patients.unknown')}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <p className='text-neutral-500'>{t('patients.noAllergiesRecorded')}</p>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'conditions' && (
            <Card>
              <div className='p-6'>
                <h3 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('patients.doctorPatientConditions')}
                </h3>
                {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                  <div className='flex flex-wrap gap-2 mb-4'>
                    {patient.chronicConditions.map((condition, index) => (
                      <Tag key={index} className='bg-yellow-100 text-yellow-800'>
                        {condition}
                      </Tag>
                    ))}
                  </div>
                ) : null}
                {patient.medicalHistory && (
                  <div className='mt-4'>
                    <h4 className='font-semibold text-neutral-900 mb-2'>
                      {t('patients.medicalHistory')}
                    </h4>
                    <p className='text-neutral-700 whitespace-pre-wrap'>{patient.medicalHistory}</p>
                  </div>
                )}
                {(!patient.chronicConditions || patient.chronicConditions.length === 0) &&
                  !patient.medicalHistory && (
                    <p className='text-neutral-500'>{t('patients.noConditionsOrMedicalHistory')}</p>
                  )}
              </div>
            </Card>
          )}

          {activeTab === 'notes' && (
            <Card>
              <div className='p-6'>
                <h3 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('patients.doctorPatientNotes')}
                </h3>
                <p className='text-sm text-neutral-600 mb-4'>{t('patients.privateNotesHint')}</p>
                <textarea
                  className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                  rows={10}
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  placeholder={t('doctors.personalNotesPlaceholder')}
                />
                <div className='flex justify-end mt-4'>
                  <Button
                    variant='primary'
                    onClick={async () => {
                      try {
                        setSavingNotes(true);
                        const response = await apiClient.put(
                          `/patients/${patientId}/doctor-notes`,
                          {
                            notes: personalNotes,
                          },
                        );
                        if (response.success) {
                          showSuccess(t('doctors.notesSaved'));
                        } else {
                          showError(t('doctors.notesSaveFailed') || 'Failed to save notes');
                        }
                      } catch (err) {
                        showError(t('doctors.notesSaveFailed') || 'Failed to save notes');
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
      </div>
    </Layout>
  );
}
