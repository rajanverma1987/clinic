'use client';

import { EyeIcon, PencilIcon, PrinterIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Tabs, getTabPanelId, getTabPanelLabelledBy } from '@/components/ui/Tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { ERROR_HANDLING, PATIENT_DETAIL_TABS } from '@/lib/constants/route-security';
import { hasPermission } from '@/lib/permissions/constants';
import { logger } from '@/lib/utils/logger';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

const PATIENT_TAB_IDS = PATIENT_DETAIL_TABS.tabs.map((tab) => tab.id);

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && PATIENT_TAB_IDS.includes(tabFromUrl)
      ? tabFromUrl
      : PATIENT_DETAIL_TABS.defaultTab,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user && params.id) {
      fetchAllData();
    }
  }, [authLoading, user, params.id]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && PATIENT_TAB_IDS.includes(t)) setActiveTab(t);
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const base = pathname || `/patients/${params.id}`;
    queueMicrotask(() => {
      router.replace(base + '?tab=' + encodeURIComponent(tabId));
    });
  };

  const deferredTab = useDeferredValue(activeTab);
  const isTabPending = activeTab !== deferredTab;

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch patient
      const patientResponse = await apiClient.get(`/patients/${params.id}`);
      if (patientResponse.success && patientResponse.data) {
        setPatient(patientResponse.data);
        setFormData(patientResponse.data);
      }

      // Fetch appointments
      try {
        const aptResponse = await apiClient.get(`/appointments?patientId=${params.id}&limit=100`);
        if (aptResponse.success && aptResponse.data) {
          const aptData = Array.isArray(aptResponse.data)
            ? aptResponse.data
            : aptResponse.data.data || [];
          setAppointments(aptData);
        }
      } catch (err) {
        logger.error('Failed to fetch appointments:', err);
      }

      // Fetch prescriptions
      try {
        const presResponse = await apiClient.get(`/prescriptions?patientId=${params.id}&limit=100`);
        if (presResponse.success && presResponse.data) {
          const presData = Array.isArray(presResponse.data)
            ? presResponse.data
            : presResponse.data.data || [];
          setPrescriptions(presData);
        }
      } catch (err) {
        logger.error('Failed to fetch prescriptions:', err);
      }

      // Fetch invoices
      try {
        const invResponse = await apiClient.get(`/invoices?patientId=${params.id}&limit=100`);
        if (invResponse.success && invResponse.data) {
          const invData = Array.isArray(invResponse.data)
            ? invResponse.data
            : invResponse.data.data || [];
          setInvoices(invData);
        }
      } catch (err) {
        logger.error('Failed to fetch invoices:', err);
      }

      // Fetch lab tests (from prescriptions with lab items)
      const labItems = prescriptions
        .flatMap((p) => p.items.filter((i) => i.itemType === 'lab'))
        .map((item) => ({
          _id: item.labTestName || '',
          testName: item.labTestName || '',
          testCode: '',
          createdAt: new Date().toISOString(),
          status: 'pending',
        }));
      setLabTests(labItems);
    } catch (error) {
      logger.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Only send fields that are actually being edited
      const updateData = {};

      if (patient) {
        // Only include fields that have changed
        const fieldsToCheck = [
          'firstName',
          'lastName',
          'dateOfBirth',
          'gender',
          'bloodGroup',
          'email',
          'phone',
          'alternatePhone',
          'address',
          'nationalId',
          'insuranceId',
          'medicalHistory',
          'allergies',
          'currentMedications',
          'notes',
        ];

        fieldsToCheck.forEach((key) => {
          const formValue = formData[key];
          const patientValue = patient[key];

          // Only include if the value has changed
          if (JSON.stringify(formValue) !== JSON.stringify(patientValue)) {
            updateData[key] = formValue;
          }
        });

        // Handle emergencyContact separately
        if (formData.emergencyContact) {
          const formEmergencyContact = formData.emergencyContact;
          const patientEmergencyContact = patient.emergencyContact;

          if (JSON.stringify(formEmergencyContact) !== JSON.stringify(patientEmergencyContact)) {
            if (
              formEmergencyContact &&
              Object.keys(formEmergencyContact).some((key) => formEmergencyContact[key])
            ) {
              updateData.emergencyContact = formEmergencyContact;
            }
          }
        }
      }

      const response = await apiClient.put(`/patients/${params.id}`, updateData);
      if (response.success) {
        setIsEditing(false);
        fetchAllData();
      } else {
        setError(response.error?.message || 'Failed to update patient');
      }
    } catch (error) {
      logger.error('Failed to update patient:', error);
      setError(error.message || 'Failed to update patient');
    } finally {
      setSaving(false);
    }
  };

  // Redirect if not authenticated (non-blocking)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ERROR_HANDLING.unauthorizedRedirect);
    }
  }, [authLoading, user, router]);

  // Show empty state while redirecting
  if (!user) {
    return null;
  }

  if (loading) {
    return <Loader type='page' text={t('common.loading')} />;
  }

  if (!patient) {
    return (
      <Layout>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <p className='text-status-error mb-4'>Patient not found</p>
            <Button variant='primary' size='md' onClick={() => router.push('/patients')}>
              Back to Patients
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const visibleTabs = useMemo(() => {
    return PATIENT_DETAIL_TABS.tabs
      .filter(
        (tab) =>
          user &&
          hasPermission(user.role, tab.requiredPermission.resource, tab.requiredPermission.action) &&
          (!tab.doctorOnly || user.role === 'doctor'),
      )
      .map((tab) => {
        let label = t(tab.labelKey);
        if (tab.id === 'visits') label += ` (${appointments.length})`;
        if (tab.id === 'prescriptions') label += ` (${prescriptions.length})`;
        if (tab.id === 'invoices') label += ` (${invoices.length})`;
        if (tab.id === 'lab-tests') label += ` (${labTests.length})`;
        return { id: tab.id, label };
      });
  }, [user, appointments.length, prescriptions.length, invoices.length, labTests.length, t]);

  const tabs = visibleTabs;
  const visibleIds = useMemo(() => tabs.map((tab) => tab.id), [tabs]);

  useEffect(() => {
    if (tabs.length && !visibleIds.includes(activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs.length, visibleIds, activeTab]);

  return (
    <Layout>
      <PageHeader
        title={`${patient.firstName} ${patient.lastName}`}
        subtitle={`Patient ID: ${patient.patientId}`}
        notifications={[]}
        unreadCount={0}
        actionButtons={
          <>
            <Button variant='secondary' size='md' onClick={() => router.push('/patients')}>
              ← {t('patients.backToPatients')}
            </Button>
            {!isEditing ? (
              <>
                <Button variant='primary' size='md' onClick={() => setIsEditing(true)}>
                  {t('patients.editPatient')}
                </Button>
                <Button
                  variant='secondary'
                  size='md'
                  onClick={() => router.push(`/appointments/new?patientId=${params.id}`)}
                >
                  + {t('dashboard.newAppointment')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant='secondary'
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(patient || {});
                    setError('');
                  }}
                >
                  Cancel
                </Button>
                <Button variant='primary' onClick={handleSave} isLoading={saving}>
                  Save Changes
                </Button>
              </>
            )}
          </>
        }
      />
      <div className='data-tabs-container w-full'>
        {error && (
          <div className='mb-6 p-4 bg-status-error/10 border border-status-error/30 text-status-error rounded-lg'>
            {error}
          </div>
        )}

        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
          idPrefix='patient-detail-tabs'
          ariaLabel={t('patients.patientDetails')}
        />

        <div
          className='data-tabs-content tab-content-standard-width'
          role='tabpanel'
          id={getTabPanelId('patient-detail-tabs', activeTab)}
          aria-labelledby={getTabPanelLabelledBy('patient-detail-tabs', activeTab)}
          aria-busy={isTabPending}
        >
          {isTabPending && (
            <div className='flex min-h-[200px] items-center justify-center py-8'>
              <Loader type='section' text={t('common.loading')} />
            </div>
          )}
          {!isTabPending && deferredTab === 'overview' && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <Card>
                <h2 className='text-xl font-semibold mb-4'>Personal Information</h2>
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                        First Name
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.firstName || ''}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      ) : (
                        <p className='text-neutral-900'>{patient.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                        Last Name
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.lastName || ''}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      ) : (
                        <p className='text-neutral-900'>{patient.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Patient ID
                    </label>
                    <p className='text-neutral-900'>{patient.patientId}</p>
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Date of Birth
                    </label>
                    {isEditing ? (
                      <Input
                        type='date'
                        value={
                          formData.dateOfBirth
                            ? new Date(formData.dateOfBirth).toISOString().split('T')[0]
                            : ''
                        }
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      />
                    ) : (
                      <p className='text-neutral-900'>
                        {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                        Gender
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.gender || ''}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                        >
                          <option value='male'>Male</option>
                          <option value='female'>Female</option>
                          <option value='other'>Other</option>
                        </select>
                      ) : (
                        <p className='text-neutral-900 capitalize'>{patient.gender}</p>
                      )}
                    </div>
                    <div>
                      <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                        Blood Group
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.bloodGroup || ''}
                          onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                          className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                        >
                          <option value=''>Not Specified</option>
                          <option value='A+'>A+</option>
                          <option value='A-'>A-</option>
                          <option value='B+'>B+</option>
                          <option value='B-'>B-</option>
                          <option value='AB+'>AB+</option>
                          <option value='AB-'>AB-</option>
                          <option value='O+'>O+</option>
                          <option value='O-'>O-</option>
                        </select>
                      ) : (
                        <p className='text-neutral-900'>{patient.bloodGroup || 'Not Specified'}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Phone
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    ) : (
                      <p className='text-neutral-900'>{patient.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Alternate Phone
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.alternatePhone || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, alternatePhone: e.target.value })
                        }
                      />
                    ) : (
                      <p className='text-neutral-900'>{patient.alternatePhone || 'Not Provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Email
                    </label>
                    {isEditing ? (
                      <Input
                        type='email'
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    ) : (
                      <p className='text-neutral-900'>{patient.email || 'Not Provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Address
                    </label>
                    {isEditing ? (
                      <div className='space-y-2'>
                        <Input
                          placeholder={t('patients.streetPlaceholder')}
                          value={formData.address?.street || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: { ...formData.address, street: e.target.value },
                            })
                          }
                        />
                        <div className='grid grid-cols-2 gap-2'>
                          <Input
                            placeholder={t('patients.cityPlaceholder')}
                            value={formData.address?.city || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: { ...formData.address, city: e.target.value },
                              })
                            }
                          />
                          <Input
                            placeholder={t('patients.statePlaceholder')}
                            value={formData.address?.state || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: { ...formData.address, state: e.target.value },
                              })
                            }
                          />
                        </div>
                        <Input
                          placeholder={t('patients.zipPlaceholder')}
                          value={formData.address?.zipCode || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: { ...formData.address, zipCode: e.target.value },
                            })
                          }
                        />
                      </div>
                    ) : (
                      <p className='text-neutral-900'>
                        {patient.address
                          ? [
                              patient.address.street,
                              patient.address.city,
                              patient.address.state,
                              patient.address.zipCode,
                            ]
                              .filter(Boolean)
                              .join(', ') || 'Not Provided'
                          : 'Not Provided'}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className='text-xl font-semibold mb-4'>Medical Information</h2>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Medical History
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.medicalHistory || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, medicalHistory: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                        rows={4}
                      />
                    ) : (
                      <p className='text-neutral-900 whitespace-pre-wrap'>
                        {patient.medicalHistory || 'Not Provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Allergies
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.allergies || ''}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      />
                    ) : (
                      <p className='text-neutral-900'>{patient.allergies || 'None Known'}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Current Medications
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.currentMedications || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, currentMedications: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                        rows={3}
                      />
                    ) : (
                      <p className='text-neutral-900 whitespace-pre-wrap'>
                        {patient.currentMedications || 'None'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Notes
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                        rows={3}
                      />
                    ) : (
                      <p className='text-neutral-900 whitespace-pre-wrap'>
                        {patient.notes || 'No Notes'}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card className='md:col-span-2'>
                <h2 className='text-xl font-semibold mb-4'>Quick Stats</h2>
                <div className='grid grid-cols-4 gap-4'>
                  <div className='text-center p-4 bg-primary-100 rounded-lg'>
                    <div className='text-2xl font-bold text-primary-600'>{appointments.length}</div>
                    <div className='text-sm text-neutral-600'>Total Visits</div>
                  </div>
                  <div className='text-center p-4 bg-primary-100 rounded-lg'>
                    <div className='text-2xl font-bold text-primary-700'>
                      {prescriptions.length}
                    </div>
                    <div className='text-sm text-neutral-600'>Prescriptions</div>
                  </div>
                  <div className='text-center p-4 bg-purple-50 rounded-lg'>
                    <div className='text-2xl font-bold text-purple-600'>{invoices.length}</div>
                    <div className='text-sm text-neutral-600'>Invoices</div>
                  </div>
                  <div className='text-center p-4 bg-orange-50 rounded-lg'>
                    <div className='text-2xl font-bold text-orange-600'>{labTests.length}</div>
                    <div className='text-sm text-neutral-600'>Lab Tests</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {!isTabPending && deferredTab === 'visits' && (
            <Card>
              <div className='clinic-table-wrap'>
                <table className='clinic-table'>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Doctor</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt) => (
                      <tr key={apt._id}>
                        <td className='whitespace-nowrap'>
                          {new Date(apt.appointmentDate).toLocaleDateString()}
                        </td>
                        <td className='whitespace-nowrap'>{apt.startTime || '-'}</td>
                        <td className='whitespace-nowrap capitalize'>{apt.type || 'In-Person'}</td>
                        <td className='whitespace-nowrap'>
                          {apt.doctorId
                            ? `Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName}`
                            : '-'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              apt.status === 'completed'
                                ? 'bg-primary-100 text-primary-700'
                                : apt.status === 'in_progress'
                                  ? 'bg-primary-100 text-primary-700'
                                  : apt.status === 'cancelled'
                                    ? 'bg-status-error/10 text-status-error'
                                    : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td className='whitespace-nowrap'>
                          <Button
                            variant='secondary'
                            size='sm'
                            onClick={() => router.push(`/appointments/${apt._id}`)}
                            className='p-2 min-w-[2.25rem]'
                            title={t('common.show')}
                            aria-label={t('common.show')}
                          >
                            <EyeIcon className='icon icon-sm' ariaHidden />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {appointments.length === 0 && (
                      <tr data-empty>
                        <td colSpan={6}>{t('appointments.noAppointmentsFound')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {!isTabPending && deferredTab === 'prescriptions' && (
            <Card>
              <div className='clinic-table-wrap'>
                <table className='clinic-table'>
                  <thead>
                    <tr>
                      <th>Rx #</th>
                      <th>Date</th>
                      <th>Diagnosis</th>
                      <th>Items</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((pres) => (
                      <tr key={pres._id}>
                        <td className='whitespace-nowrap font-medium'>{pres.prescriptionNumber}</td>
                        <td className='whitespace-nowrap'>
                          {new Date(pres.createdAt).toLocaleDateString()}
                        </td>
                        <td>{pres.diagnosis || '-'}</td>
                        <td>
                          {pres.items.length} item{pres.items.length !== 1 ? 's' : ''}
                        </td>
                        <td className='whitespace-nowrap'>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              pres.status === 'active'
                                ? 'bg-secondary-100 text-secondary-700'
                                : pres.status === 'dispensed'
                                  ? 'bg-primary-100 text-primary-700'
                                  : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {pres.status}
                          </span>
                        </td>
                        <td className='whitespace-nowrap'>
                          <div className='flex gap-2'>
                            <Button
                              variant='secondary'
                              size='sm'
                              onClick={() => router.push(`/prescriptions/${pres._id}/edit`)}
                              className='p-2 min-w-[2.25rem]'
                              title={t('common.edit')}
                              aria-label={t('common.edit')}
                            >
                              <PencilIcon className='icon icon-sm' ariaHidden />
                            </Button>
                            <Button
                              variant='secondary'
                              size='sm'
                              onClick={() =>
                                window.open(`/prescriptions/${pres._id}/print`, '_blank')
                              }
                              className='p-2 min-w-[2.25rem]'
                              title='Print'
                              aria-label='Print'
                            >
                              <PrinterIcon className='icon icon-sm' ariaHidden />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {prescriptions.length === 0 && (
                      <tr data-empty>
                        <td colSpan={6}>No prescriptions found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {!isTabPending && deferredTab === 'invoices' && (
            <Card>
              <div className='clinic-table-wrap'>
                <table className='clinic-table'>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv._id}>
                        <td className='whitespace-nowrap font-medium'>{inv.invoiceNumber}</td>
                        <td className='whitespace-nowrap'>
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          {inv.items.length} item{inv.items.length !== 1 ? 's' : ''}
                        </td>
                        <td className='whitespace-nowrap font-medium'>
                          ${inv.totalAmount.toFixed(2)}
                        </td>
                        <td className='whitespace-nowrap'>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              inv.status === 'paid'
                                ? 'bg-primary-100 text-primary-700'
                                : inv.status === 'pending'
                                  ? 'bg-status-warning/10 text-status-warning'
                                  : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className='whitespace-nowrap'>
                          <Button
                            variant='secondary'
                            size='sm'
                            onClick={() => router.push(`/invoices/${inv._id}`)}
                            className='p-2 min-w-[2.25rem]'
                            title={t('common.show')}
                            aria-label={t('common.show')}
                          >
                            <EyeIcon className='icon icon-sm' ariaHidden />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr data-empty>
                        <td colSpan={6}>No invoices found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {!isTabPending && deferredTab === 'lab-tests' && (
            <Card>
              <div className='clinic-table-wrap'>
                <table className='clinic-table'>
                  <thead>
                    <tr>
                      <th>Test Name</th>
                      <th>Test Code</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Results</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labTests.map((test, index) => (
                      <tr key={test._id || index}>
                        <td className='whitespace-nowrap font-medium'>{test.testName}</td>
                        <td className='whitespace-nowrap'>{test.testCode || '-'}</td>
                        <td className='whitespace-nowrap'>
                          {new Date(test.createdAt).toLocaleDateString()}
                        </td>
                        <td className='whitespace-nowrap'>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              test.status === 'completed'
                                ? 'bg-primary-100 text-primary-700'
                                : test.status === 'pending'
                                  ? 'bg-status-warning/10 text-status-warning'
                                  : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {test.status}
                          </span>
                        </td>
                        <td>{test.results || '-'}</td>
                      </tr>
                    ))}
                    {labTests.length === 0 && (
                      <tr data-empty>
                        <td colSpan={5}>No lab tests found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {!isTabPending && deferredTab === 'notes' && (
            <Card>
              <h2 className='text-lg font-semibold mb-4'>{t('doctors.notes')}</h2>
              <p className='text-neutral-700 whitespace-pre-wrap'>{patient.notes || t('patients.noNotes')}</p>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
