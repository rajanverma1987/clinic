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
import { useInvalidateDashboard } from '@/hooks/useInvalidateDashboard';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { ERROR_HANDLING, PATIENT_DETAIL_TABS } from '@/lib/constants/route-security';
import { hasPermission } from '@/lib/permissions/constants';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const PATIENT_TAB_IDS = PATIENT_DETAIL_TABS.tabs.map((tab) => tab.id);

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [imagingStudies, setImagingStudies] = useState([]);
  const [insuranceClaims, setInsuranceClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && PATIENT_TAB_IDS.includes(tabFromUrl)
      ? tabFromUrl
      : PATIENT_DETAIL_TABS.defaultTab,
  );
  const { invalidateLists } = useInvalidateDashboard();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!authLoading && user && params?.id) {
      fetchAllData();
    }
  }, [authLoading, user, params?.id]);

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

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const patientId = params.id;

      // Prefetch all tab data in parallel (total time ≈ slowest request)
      const [patientRes, aptRes, presRes, invRes, labResRes, imagingRes, claimsRes] =
        await Promise.all([
          apiClient.get(`/patients/${patientId}`),
          apiClient.get(`/appointments?patientId=${patientId}&limit=100`),
          apiClient.get(`/prescriptions?patientId=${patientId}&limit=100`),
          apiClient.get(`/invoices?patientId=${patientId}&limit=100`),
          apiClient.get(`/lab-results?patientId=${patientId}&limit=100`),
          apiClient.get(`/imaging?patientId=${patientId}&limit=100`),
          apiClient.get(`/insurance/claims?patientId=${patientId}&limit=100`),
        ]);

      if (patientRes.success && patientRes.data) {
        setPatient(patientRes.data);
        setFormData(patientRes.data);
      }

      if (aptRes.success && aptRes.data) {
        const aptData = Array.isArray(aptRes.data) ? aptRes.data : aptRes.data?.data || [];
        setAppointments(aptData);
      } else {
        logger.error('Failed to fetch appointments', aptRes.error);
      }

      let prescriptionsData = [];
      if (presRes.success && presRes.data) {
        prescriptionsData = Array.isArray(presRes.data) ? presRes.data : presRes.data?.data || [];
        setPrescriptions(prescriptionsData);
      } else {
        logger.error('Failed to fetch prescriptions', presRes.error);
      }

      if (invRes.success && invRes.data) {
        const invData = Array.isArray(invRes.data) ? invRes.data : invRes.data?.data || [];
        setInvoices(invData);
      } else {
        logger.error('Failed to fetch invoices', invRes.error);
      }

      if (labResRes.success && labResRes.data) {
        setLabResults(Array.isArray(labResRes.data) ? labResRes.data : labResRes.data?.data || []);
      }
      if (imagingRes.success && imagingRes.data) {
        setImagingStudies(
          Array.isArray(imagingRes.data) ? imagingRes.data : imagingRes.data?.data || [],
        );
      }
      if (claimsRes.success && claimsRes.data) {
        setInsuranceClaims(
          Array.isArray(claimsRes.data) ? claimsRes.data : claimsRes.data?.data || [],
        );
      }

      // Lab tests derived from prescriptions (use response, not state)
      const labItems = (prescriptionsData || []).flatMap((p) =>
        (p.items || [])
          .filter((i) => i.itemType === 'lab')
          .map((item) => ({
            _id: item.labTestName || '',
            testName: item.labTestName || '',
            testCode: '',
            createdAt:
              (p.createdAt && new Date(p.createdAt).toISOString()) || new Date().toISOString(),
            status: 'pending',
          })),
      );
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
          'firstName_es',
          'lastName_es',
          'firstName_ar',
          'lastName_ar',
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
          'chronicConditions',
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
        invalidateLists();
        fetchAllData();
      } else {
        setError(response.error?.message || t('patients.failedToUpdatePatient'));
      }
    } catch (error) {
      logger.error('Failed to update patient:', error);
      setError(error.message || t('patients.failedToUpdatePatient'));
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

  const visibleTabs = useMemo(() => {
    return PATIENT_DETAIL_TABS.tabs
      .filter(
        (tab) =>
          user &&
          hasPermission(
            user.role,
            tab.requiredPermission.resource,
            tab.requiredPermission.action,
          ) &&
          (!tab.doctorOnly || user.role === 'doctor'),
      )
      .map((tab) => {
        let label = t(tab.labelKey);
        if (tab.id === 'visits') label += ` (${appointments.length})`;
        if (tab.id === 'prescriptions') label += ` (${prescriptions.length})`;
        if (tab.id === 'invoices') label += ` (${invoices.length})`;
        if (tab.id === 'lab-tests') label += ` (${labTests.length})`;
        if (tab.id === 'lab-results') label += ` (${labResults.length})`;
        if (tab.id === 'imaging') label += ` (${imagingStudies.length})`;
        if (tab.id === 'insurance') label += ` (${insuranceClaims.length})`;
        return { id: tab.id, label };
      });
  }, [
    user,
    appointments.length,
    prescriptions.length,
    invoices.length,
    labTests.length,
    labResults.length,
    imagingStudies.length,
    insuranceClaims.length,
    t,
  ]);

  const tabs = visibleTabs;
  const visibleIds = useMemo(() => tabs.map((tab) => tab.id), [tabs]);

  useEffect(() => {
    if (tabs.length && !visibleIds.includes(activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs.length, visibleIds, activeTab]);

  if (!user) return null;

  return (
    <Layout>
      {loading ? (
        <>
          <PageHeader
            title={t('patients.title')}
            subtitle={t('common.loading')}
            notifications={[]}
            unreadCount={0}
          />
          <div className='flex items-center justify-center min-h-[400px]'>
            <Loader type='section' text={t('common.loading')} />
          </div>
        </>
      ) : !patient ? (
        <>
          <PageHeader
            title={t('patients.title')}
            subtitle={t('patients.patientDetail')}
            notifications={[]}
            unreadCount={0}
          />
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <p className='text-status-error mb-4'>{t('patients.patientNotFound')}</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <PageHeader
            title={`${patient.firstName} ${patient.lastName}`}
            subtitle={`Patient ID: ${patient.patientId}`}
            notifications={[]}
            unreadCount={0}
            actionButtons={
              <>
                {!isEditing ? (
                  <>
                    <Button variant='primary' size='md' onClick={() => setIsEditing(true)}>
                      {t('patients.editPatient')}
                    </Button>
                    <Button
                      variant='secondary'
                      size='md'
                      href={`/appointments/new?patientId=${params.id}`}
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
                      {t('common.cancel')}
                    </Button>
                    <Button variant='primary' onClick={handleSave} isLoading={saving}>
                      {t('patients.saveChanges')}
                    </Button>
                  </>
                )}
              </>
            }
          />
          <div
            className='data-tabs-container w-full'
            style={{ marginBottom: 'var(--dashboard-element-gap, 16px)' }}
          >
            {error && (
              <div className='mb-4 p-4 bg-status-error/10 dark:bg-status-error/20 border border-status-error/30 text-status-error rounded-xl'>
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
              className='data-tabs-content tab-content-standard-width-left'
              role='tabpanel'
              id={getTabPanelId('patient-detail-tabs', activeTab)}
              aria-labelledby={getTabPanelLabelledBy('patient-detail-tabs', activeTab)}
            >
              {activeTab === 'overview' && (
                <div className='content-grid-2 content-grid-gap-6'>
                  <Card>
                    <h2 className='text-xl font-semibold mb-4'>
                      {t('patients.personalInformation')}
                    </h2>
                    <div className='space-y-4'>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                            First Name
                          </label>
                          {isEditing ? (
                            <Input
                              value={formData.firstName || ''}
                              onChange={(e) =>
                                setFormData({ ...formData, firstName: e.target.value })
                              }
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
                              onChange={(e) =>
                                setFormData({ ...formData, lastName: e.target.value })
                              }
                            />
                          ) : (
                            <p className='text-neutral-900'>{patient.lastName}</p>
                          )}
                        </div>
                      </div>
                      {isEditing && (
                        <div className='grid grid-cols-2 gap-4 pt-2 border-t border-neutral-200'>
                          <div>
                            <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                              {t('patients.firstNameEs')}
                            </label>
                            <Input
                              value={formData.firstName_es || ''}
                              onChange={(e) =>
                                setFormData({ ...formData, firstName_es: e.target.value })
                              }
                              placeholder={t('patients.firstNameEs')}
                            />
                          </div>
                          <div>
                            <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                              {t('patients.lastNameEs')}
                            </label>
                            <Input
                              value={formData.lastName_es || ''}
                              onChange={(e) =>
                                setFormData({ ...formData, lastName_es: e.target.value })
                              }
                              placeholder={t('patients.lastNameEs')}
                            />
                          </div>
                          <div>
                            <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                              {t('patients.firstNameAr')}
                            </label>
                            <Input
                              value={formData.firstName_ar || ''}
                              onChange={(e) =>
                                setFormData({ ...formData, firstName_ar: e.target.value })
                              }
                              placeholder={t('patients.firstNameAr')}
                              dir='rtl'
                            />
                          </div>
                          <div>
                            <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                              {t('patients.lastNameAr')}
                            </label>
                            <Input
                              value={formData.lastName_ar || ''}
                              onChange={(e) =>
                                setFormData({ ...formData, lastName_ar: e.target.value })
                              }
                              placeholder={t('patients.lastNameAr')}
                              dir='rtl'
                            />
                          </div>
                        </div>
                      )}
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
                            onChange={(e) =>
                              setFormData({ ...formData, dateOfBirth: e.target.value })
                            }
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
                              onChange={(e) =>
                                setFormData({ ...formData, bloodGroup: e.target.value })
                              }
                              className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                            >
                              <option value=''>{t('patients.notSpecified')}</option>
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
                            <p className='text-neutral-900'>
                              {patient.bloodGroup || t('patients.notSpecified')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
                          {t('patients.phone')}
                        </label>
                        {isEditing ? (
                          <Input
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        ) : (
                          <p className='text-neutral-900 dark:text-neutral-100'>{patient.phone}</p>
                        )}
                      </div>
                      <div>
                        <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
                          {t('patients.alternatePhone')}
                        </label>
                        {isEditing ? (
                          <Input
                            value={formData.alternatePhone || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, alternatePhone: e.target.value })
                            }
                          />
                        ) : (
                          <p className='text-neutral-900 dark:text-neutral-100'>
                            {patient.alternatePhone || t('patients.notProvided')}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
                          {t('patients.email')}
                        </label>
                        {isEditing ? (
                          <Input
                            type='email'
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        ) : (
                          <p className='text-neutral-900 dark:text-neutral-100'>
                            {patient.email || t('patients.notProvided')}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
                          {t('patients.address')}
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
                          <p className='text-neutral-900 dark:text-neutral-100'>
                            {patient.address
                              ? [
                                  patient.address.street,
                                  patient.address.city,
                                  patient.address.state,
                                  patient.address.zipCode,
                                ]
                                  .filter(Boolean)
                                  .join(', ') || t('patients.notProvided')
                              : t('patients.notProvided')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>

                  <Card title={t('patients.medicalInformation')}>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
                          {t('patients.medicalHistory')}
                        </label>
                        {isEditing ? (
                          <textarea
                            value={formData.medicalHistory || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, medicalHistory: e.target.value })
                            }
                            className='w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500'
                            rows={4}
                          />
                        ) : (
                          <p className='text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap'>
                            {patient.medicalHistory || t('patients.notProvided')}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
                          {t('patients.allergies')}
                        </label>
                        {isEditing ? (
                          <Input
                            value={formData.allergies || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, allergies: e.target.value })
                            }
                          />
                        ) : (
                          <p className='text-neutral-900 dark:text-neutral-100'>
                            {patient.allergies || t('patients.noneKnown')}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
                          Chronic Conditions
                        </label>
                        {isEditing ? (
                          <Input
                            value={formData.chronicConditions || ''}
                            placeholder={t('patients.conditionsPlaceholder')}
                            onChange={(e) =>
                              setFormData({ ...formData, chronicConditions: e.target.value })
                            }
                          />
                        ) : (
                          <p className='text-neutral-900 dark:text-neutral-100'>
                            {patient.chronicConditions || t('patients.noneKnown')}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
                          {t('patients.currentMedications')}
                        </label>
                        {isEditing ? (
                          <textarea
                            value={formData.currentMedications || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, currentMedications: e.target.value })
                            }
                            className='w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500'
                            rows={3}
                          />
                        ) : (
                          <p className='text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap'>
                            {patient.currentMedications || t('common.none')}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
                          {t('patients.notes')}
                        </label>
                        {isEditing ? (
                          <textarea
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className='w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500'
                            rows={3}
                          />
                        ) : (
                          <p className='text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap'>
                            {patient.notes || t('patients.noNotes')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>

                  <Card title={t('dashboard.quickStats')} className='md:col-span-2'>
                    <div className='content-grid-4'>
                      <div className='text-center p-4 bg-primary-100 dark:bg-primary-900/30 rounded-xl border border-primary-200 dark:border-primary-800'>
                        <div className='text-2xl font-bold text-primary-600 dark:text-primary-400'>
                          {appointments.length}
                        </div>
                        <div className='text-sm text-neutral-600 dark:text-neutral-400'>
                          {t('patients.totalVisits')}
                        </div>
                      </div>
                      <div className='text-center p-4 bg-primary-100 dark:bg-primary-900/30 rounded-xl border border-primary-200 dark:border-primary-800'>
                        <div className='text-2xl font-bold text-primary-700 dark:text-primary-400'>
                          {prescriptions.length}
                        </div>
                        <div className='text-sm text-neutral-600 dark:text-neutral-400'>
                          {t('prescriptions.title')}
                        </div>
                      </div>
                      <div className='text-center p-4 bg-neutral-100 dark:bg-neutral-700/50 rounded-xl border border-neutral-200 dark:border-neutral-600'>
                        <div className='text-2xl font-bold text-neutral-700 dark:text-neutral-300'>
                          {invoices.length}
                        </div>
                        <div className='text-sm text-neutral-600 dark:text-neutral-400'>
                          {t('invoices.title')}
                        </div>
                      </div>
                      <div className='text-center p-4 bg-neutral-100 dark:bg-neutral-700/50 rounded-xl border border-neutral-200 dark:border-neutral-600'>
                        <div className='text-2xl font-bold text-neutral-700 dark:text-neutral-300'>
                          {labTests.length}
                        </div>
                        <div className='text-sm text-neutral-600 dark:text-neutral-400'>
                          {t('lab.labTests')}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'visits' && (
                <Card title={t('appointments.appointmentList')}>
                  <div className='clinic-table-wrap'>
                    <table className='clinic-table'>
                      <thead>
                        <tr>
                          <th>{t('appointments.date')}</th>
                          <th>{t('appointments.time')}</th>
                          <th>{t('appointments.type')}</th>
                          <th>{t('appointments.doctor')}</th>
                          <th>{t('appointments.status')}</th>
                          <th>{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((apt) => (
                          <tr key={apt._id}>
                            <td className='whitespace-nowrap'>
                              {new Date(apt.appointmentDate).toLocaleDateString()}
                            </td>
                            <td className='whitespace-nowrap'>{apt.startTime || '-'}</td>
                            <td className='whitespace-nowrap capitalize'>
                              {apt.type || 'In-Person'}
                            </td>
                            <td className='whitespace-nowrap'>
                              {apt.doctorId
                                ? `Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName}`
                                : '-'}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  apt.status === 'completed'
                                    ? 'bg-success-100 text-success-700 dark:bg-green-800 dark:text-green-100'
                                    : apt.status === 'in_progress'
                                      ? 'bg-primary-100 text-primary-700 dark:bg-blue-800 dark:text-blue-100'
                                      : apt.status === 'cancelled'
                                        ? 'bg-status-error/10 dark:bg-red-900/60 text-status-error dark:text-red-200'
                                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
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

              {activeTab === 'prescriptions' && (
                <Card title={t('prescriptions.title')}>
                  <div className='clinic-table-wrap'>
                    <table className='clinic-table'>
                      <thead>
                        <tr>
                          <th>{t('prescriptions.rxNumber')}</th>
                          <th>{t('appointments.date')}</th>
                          <th>{t('prescriptions.diagnosis')}</th>
                          <th>{t('common.items')}</th>
                          <th>{t('appointments.status')}</th>
                          <th>{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.map((pres) => (
                          <tr key={pres._id}>
                            <td className='whitespace-nowrap font-medium'>
                              {pres.prescriptionNumber}
                            </td>
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
                                    ? 'bg-secondary-100 dark:bg-secondary-900/40 text-secondary-700 dark:text-secondary-300'
                                    : pres.status === 'dispensed'
                                      ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
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
                                  title={t('common.ariaLabelPrint')}
                                  aria-label={t('common.ariaLabelPrint')}
                                >
                                  <PrinterIcon className='icon icon-sm' ariaHidden />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {prescriptions.length === 0 && (
                          <tr data-empty>
                            <td colSpan={6}>{t('common.noDataFound')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {activeTab === 'invoices' && (
                <Card title={t('invoices.title')}>
                  <div className='clinic-table-wrap'>
                    <table className='clinic-table'>
                      <thead>
                        <tr>
                          <th>{t('invoices.invoiceNumber')}</th>
                          <th>{t('appointments.date')}</th>
                          <th>{t('common.items')}</th>
                          <th>{t('invoices.amount')}</th>
                          <th>{t('appointments.status')}</th>
                          <th>{t('common.actions')}</th>
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
                              {inv.items.length}{' '}
                              {inv.items.length !== 1
                                ? t('common.items')
                                : t('common.item')}
                            </td>
                            <td className='whitespace-nowrap font-medium'>
                              ${inv.totalAmount.toFixed(2)}
                            </td>
                            <td className='whitespace-nowrap'>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  inv.status === 'paid'
                                    ? 'bg-success-100 text-success-700 dark:bg-green-800 dark:text-green-100'
                                    : inv.status === 'pending'
                                      ? 'bg-status-warning/10 text-status-warning dark:bg-amber-900/60 dark:text-amber-200'
                                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
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
                            <td colSpan={6}>{t('common.noDataFound')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {activeTab === 'lab-tests' && (
                <Card title={t('lab.labTests')}>
                  <div className='clinic-table-wrap'>
                    <table className='clinic-table'>
                      <thead>
                        <tr>
                          <th>{t('lab.testName')}</th>
                          <th>{t('lab.testCode')}</th>
                          <th>{t('appointments.date')}</th>
                          <th>{t('appointments.status')}</th>
                          <th>{t('lab.results')}</th>
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
                                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                                    : test.status === 'pending'
                                      ? 'bg-status-warning/10 dark:bg-status-warning/20 text-status-warning'
                                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
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
                            <td colSpan={5}>{t('common.noDataFound')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* ── Lab Results tab ── */}
              {activeTab === 'lab-results' && (
                <Card title={t('patients.labResults')}>
                  <div className='clinic-table-wrap'>
                    <table className='clinic-table'>
                      <thead>
                        <tr>
                          <th>{t('patients.testName')}</th>
                          <th>{t('patients.orderedBy')}</th>
                          <th>{t('patients.date')}</th>
                          <th>{t('common.status')}</th>
                          <th>{t('patients.result')}</th>
                          <th>{t('patients.referenceRange')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labResults.map((r) => (
                          <tr key={r._id}>
                            <td className='font-medium'>{r.testName || r.test?.name || '-'}</td>
                            <td>
                              {r.orderedBy?.firstName
                                ? `Dr. ${r.orderedBy.firstName} ${r.orderedBy.lastName}`
                                : '-'}
                            </td>
                            <td className='whitespace-nowrap'>
                              {r.resultDate
                                ? new Date(r.resultDate).toLocaleDateString()
                                : new Date(r.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${r.status === 'verified' ? 'bg-status-success/10 text-status-success' : r.status === 'pending' ? 'bg-status-warning/10 text-status-warning' : 'bg-neutral-100 text-neutral-600'}`}
                              >
                                {r.status || 'pending'}
                              </span>
                            </td>
                            <td>{r.results || r.value || '-'}</td>
                            <td className='text-neutral-500 text-xs'>{r.referenceRange || '-'}</td>
                          </tr>
                        ))}
                        {labResults.length === 0 && (
                          <tr data-empty>
                            <td colSpan={6}>{t('common.noDataFound')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* ── Imaging tab ── */}
              {activeTab === 'imaging' && (
                <Card title={t('patients.imagingRadiology')}>
                  <div className='clinic-table-wrap'>
                    <table className='clinic-table'>
                      <thead>
                        <tr>
                          <th>{t('patients.studyType')}</th>
                          <th>{t('patients.bodyPart')}</th>
                          <th>{t('patients.date')}</th>
                          <th>{t('common.status')}</th>
                          <th>{t('patients.radiologist')}</th>
                          <th>{t('patients.findings')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {imagingStudies.map((img) => (
                          <tr key={img._id}>
                            <td className='font-medium capitalize'>
                              {img.studyType || img.modality || '-'}
                            </td>
                            <td className='capitalize'>{img.bodyPart || img.region || '-'}</td>
                            <td className='whitespace-nowrap'>
                              {img.studyDate
                                ? new Date(img.studyDate).toLocaleDateString()
                                : new Date(img.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${img.status === 'reported' ? 'bg-status-success/10 text-status-success' : img.status === 'pending' ? 'bg-status-warning/10 text-status-warning' : 'bg-neutral-100 text-neutral-600'}`}
                              >
                                {img.status || 'pending'}
                              </span>
                            </td>
                            <td>{img.radiologist?.name || img.radiologistName || '-'}</td>
                            <td className='max-w-xs truncate text-sm'>
                              {img.findings || img.report?.findings || '-'}
                            </td>
                          </tr>
                        ))}
                        {imagingStudies.length === 0 && (
                          <tr data-empty>
                            <td colSpan={6}>{t('common.noDataFound')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* ── Insurance tab ── */}
              {activeTab === 'insurance' && (
                <div className='space-y-6'>
                  {/* Insurance policy details from patient record */}
                  <Card title={t('patients.insurancePolicy')}>
                    {patient.insurance?.provider ? (
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <p className='text-xs text-neutral-500 mb-1'>{t('patients.provider')}</p>
                          <p className='font-medium'>{patient.insurance.provider}</p>
                        </div>
                        <div>
                          <p className='text-xs text-neutral-500 mb-1'>
                            {t('patients.policyNumber')}
                          </p>
                          <p className='font-medium'>{patient.insurance.policyNumber || '-'}</p>
                        </div>
                        <div>
                          <p className='text-xs text-neutral-500 mb-1'>
                            {t('patients.groupNumber')}
                          </p>
                          <p className='font-medium'>{patient.insurance.groupNumber || '-'}</p>
                        </div>
                        <div>
                          <p className='text-xs text-neutral-500 mb-1'>
                            {t('patients.validUntil')}
                          </p>
                          <p className='font-medium'>
                            {patient.insurance.validUntil
                              ? new Date(patient.insurance.validUntil).toLocaleDateString()
                              : '-'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className='text-neutral-500 text-sm'>{t('patients.noInsuranceOnFile')}</p>
                    )}
                  </Card>

                  {/* Insurance claims */}
                  <Card title={t('patients.claimsHistory')}>
                    <div className='clinic-table-wrap'>
                      <table className='clinic-table'>
                        <thead>
                          <tr>
                            <th>{t('patients.claimNumber')}</th>
                            <th>{t('patients.date')}</th>
                            <th>{t('patients.amount')}</th>
                            <th>{t('common.status')}</th>
                            <th>{t('patients.provider')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {insuranceClaims.map((claim) => {
                            const amount =
                              claim.claimAmount != null
                                ? claim.claimAmount
                                : (claim.invoiceId?.totalAmount ?? 0);
                            const statusClass =
                              claim.status === 'approved' ||
                              claim.status === 'paid' ||
                              claim.status === 'partially_approved'
                                ? 'bg-status-success/10 text-status-success'
                                : claim.status === 'denied' || claim.status === 'rejected'
                                  ? 'bg-status-error/10 text-status-error'
                                  : 'bg-status-warning/10 text-status-warning';
                            return (
                              <tr key={claim._id}>
                                <td className='font-medium whitespace-nowrap'>
                                  {claim.claimNumber || claim._id?.slice(-8)}
                                </td>
                                <td className='whitespace-nowrap'>
                                  {new Date(claim.createdAt).toLocaleDateString()}
                                </td>
                                <td className='whitespace-nowrap'>
                                  {formatCurrencyUtil(amount, currency, locale)}
                                </td>
                                <td>
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded-full ${statusClass}`}
                                  >
                                    {claim.status || 'draft'}
                                  </span>
                                </td>
                                <td>{claim.insuranceProvider || claim.notes || '-'}</td>
                              </tr>
                            );
                          })}
                          {insuranceClaims.length === 0 && (
                            <tr data-empty>
                              <td colSpan={5}>{t('common.noDataFound')}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* ── Documents tab ── */}
              {activeTab === 'documents' && (
                <Card title={t('patients.patientDocuments')}>
                  {patient.attachments && patient.attachments.length > 0 ? (
                    <div className='space-y-2'>
                      {patient.attachments.map((doc, i) => (
                        <div
                          key={i}
                          className='flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50'
                        >
                          <div className='flex items-center gap-3'>
                            <svg
                              className='icon icon-sm text-primary-600'
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
                            <div>
                              <p className='text-sm font-medium text-neutral-900'>
                                {doc.filename || doc.name}
                              </p>
                              {doc.uploadedAt && (
                                <p className='text-xs text-neutral-500'>
                                  {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          {doc.url && (
                            <a
                              href={doc.url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-primary-600 hover:text-primary-700 text-sm font-medium'
                            >
                              View
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-neutral-500 text-sm'>{t('common.noDataFound')}</p>
                  )}
                </Card>
              )}

              {activeTab === 'notes' && (
                <Card title={t('patients.notes')}>
                  <p className='text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap'>
                    {patient.notes || t('patients.noNotes')}
                  </p>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
