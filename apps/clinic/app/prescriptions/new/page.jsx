'use client';

import '@/app/prescriptions/styles/prescription-form.css';
import { FileDownIcon, PrinterIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClinicalDecisionSupport } from '@/components/prescriptions/ClinicalDecisionSupport';
import { ICD10SearchInput } from '@/components/prescriptions/ICD10SearchInput';
import { PatientDetailsPanel } from '@/components/prescriptions/PatientDetailsPanel';
import { PrescriptionFormPrintPreview } from '@/components/prescriptions/PrescriptionFormPrintPreview';
import { PrescriptionItemsTable } from '@/components/prescriptions/PrescriptionItemsTable.jsx';
import { PrescriptionPatientHeader } from '@/components/prescriptions/PrescriptionPatientHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { SimpleTextEditor } from '@/components/ui/SimpleTextEditor';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import icd10Common from '@/data/icd10-common.json';
import { useFormAutoSave } from '@/hooks/useFormAutoSave.js';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts.js';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

function NewPrescriptionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [patients, setPatients] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [clinicSettings, setClinicSettings] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Get patientId from URL query parameter if present
  const patientIdFromUrl = searchParams?.get('patientId') || '';
  const [items, setItems] = useState([
    {
      itemType: 'drug',
      drugId: '',
      drugName: '',
      frequency: 'twice daily',
      duration: 7,
      quantity: 1,
      unit: 'tablets',
      instructions: '',
      takeWithFood: false,
      allowSubstitution: true,
      route: 'oral',
      refills: 0,
    },
  ]);
  const [labTests] = useState([
    { code: 'CBC', name: 'Complete Blood Count' },
    { code: 'LIPID', name: 'Lipid Profile' },
    { code: 'LFT', name: 'Liver Function Test' },
    { code: 'RFT', name: 'Renal Function Test' },
    { code: 'TSH', name: 'Thyroid Stimulating Hormone' },
    { code: 'HBA1C', name: 'Hemoglobin A1C' },
    { code: 'URINE', name: 'Urine Analysis' },
    { code: 'XRAY', name: 'X-Ray' },
    { code: 'CT', name: 'CT Scan' },
    { code: 'MRI', name: 'MRI Scan' },
    { code: 'ECG', name: 'Electrocardiogram' },
    { code: 'ECHO', name: 'Echocardiogram' },
    { code: 'ULTRASOUND', name: 'Ultrasound' },
    { code: 'VITD', name: 'Vitamin D' },
    { code: 'B12', name: 'Vitamin B12' },
  ]);
  const [formData, setFormData] = useState({
    patientId: patientIdFromUrl,
    appointmentId: '',
    clinicalNoteId: '',
    symptoms: '',
    diagnosis: '',
    icd10Codes: [],
    additionalInstructions: '',
    validUntil: '',
    refillsAllowed: 0,
    followUpDate: '',
    followUpType: 'in-person',
    followUpAutoSchedule: false,
    digitalSignature: '',
    signedByTitle: '',
    signedByLicense: '',
  });
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Auto-save form drafts
  const {
    loadDraft,
    clearDraft,
    setSubmitting: setAutoSaveSubmitting,
  } = useFormAutoSave({
    formData: { ...formData, items },
    formKey: 'new-prescription',
    enabled: true,
  });

  // Keyboard shortcuts - useMemo to ensure router is in scope
  const keyboardShortcuts = useMemo(
    () => [
      {
        key: 's',
        ctrlKey: true,
        action: (e) => {
          e.preventDefault();
          const form = document.querySelector('form');
          if (form) {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
          }
        },
        description: 'Save prescription (Ctrl+S)',
      },
      {
        key: 'Escape',
        action: (e) => {
          e.preventDefault();
          router.back();
        },
        description: 'Cancel (Esc)',
      },
    ],
    [router],
  );

  useKeyboardShortcuts(keyboardShortcuts);

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchData();

      // Load draft if available (but don't override patientId from URL)
      const draft = loadDraft();
      if (draft) {
        if (draft.formData) {
          setFormData((prev) => ({
            ...prev,
            ...draft.formData,
            // Preserve patientId from URL if provided
            patientId: patientIdFromUrl || draft.formData.patientId || prev.patientId,
          }));
        }
        if (draft.items && Array.isArray(draft.items)) {
          setItems(draft.items);
        }
      }
    }
  }, [authLoading, currentUser, patientIdFromUrl]);

  // Fetch current appointment when patient is selected
  const fetchCurrentAppointment = async (patientId) => {
    if (!patientId) {
      setCurrentAppointment(null);
      return;
    }

    try {
      // First try to get from queue (in_progress)
      const queueResponse = await apiClient.get(
        `/queue?patientId=${patientId}&status=in_progress&limit=1`,
      );

      if (queueResponse.success && queueResponse.data) {
        const queueData = extractArrayData(queueResponse);

        if (queueData.length > 0 && queueData[0].appointmentId) {
          const appointmentId =
            typeof queueData[0].appointmentId === 'string'
              ? queueData[0].appointmentId
              : queueData[0].appointmentId?._id;

          if (appointmentId) {
            // Fetch full appointment details
            const aptResponse = await apiClient.get(`/appointments/${appointmentId}`);
            if (aptResponse.success && aptResponse.data) {
              setCurrentAppointment(aptResponse.data);
              setFormData((prev) => ({
                ...prev,
                appointmentId: appointmentId,
                clinicalNoteId: aptResponse.data.clinicalNoteId || prev.clinicalNoteId,
              }));
              return;
            }
          }
        }
      }

      // Fallback: Get from appointments (in_progress)
      const appointmentsResponse = await apiClient.get(
        `/appointments?patientId=${patientId}&status=in_progress&limit=1`,
      );

      if (appointmentsResponse.success && appointmentsResponse.data) {
        const aptsData = extractArrayData(appointmentsResponse);

        if (aptsData.length > 0) {
          const appointment = aptsData[0];
          setCurrentAppointment(appointment);
          setFormData((prev) => ({
            ...prev,
            appointmentId: appointment._id,
            clinicalNoteId: appointment.clinicalNoteId || prev.clinicalNoteId,
          }));
        } else {
          setCurrentAppointment(null);
          setFormData((prev) => ({
            ...prev,
            appointmentId: '',
            clinicalNoteId: '',
          }));
        }
      }
    } catch (error) {
      logger.error('Failed to fetch current appointment:', error);
      setCurrentAppointment(null);
    }
  };

  // Update patientId when URL parameter changes or when patients are loaded
  useEffect(() => {
    if (patientIdFromUrl && patients.length > 0) {
      // Verify patient exists in the list before setting
      const patientExists = patients.some((p) => p._id === patientIdFromUrl);
      if (patientExists) {
        setFormData((prev) => ({ ...prev, patientId: patientIdFromUrl }));
        // Fetch current appointment for this patient
        fetchCurrentAppointment(patientIdFromUrl);
      }
    }
  }, [patientIdFromUrl, patients]);

  // Update appointment when patient changes
  useEffect(() => {
    if (formData.patientId) {
      fetchCurrentAppointment(formData.patientId);
    } else {
      setCurrentAppointment(null);
      setFormData((prev) => ({
        ...prev,
        appointmentId: '',
        clinicalNoteId: '',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.patientId]);

  // Fetch full patient for allergy conflict check
  useEffect(() => {
    if (!formData.patientId) {
      setSelectedPatient(null);
      return;
    }
    let cancelled = false;
    apiClient
      .get(`/patients/${formData.patientId}`)
      .then((res) => {
        if (!cancelled && res?.success && res?.data) setSelectedPatient(res.data);
        else if (!cancelled) setSelectedPatient(null);
      })
      .catch(() => {
        if (!cancelled) setSelectedPatient(null);
      });
    return () => {
      cancelled = true;
    };
  }, [formData.patientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch clinic settings for print and prescription validity
      try {
        const settingsResponse = await apiClient.get('/settings');
        if (settingsResponse.success && settingsResponse.data) {
          setClinicSettings(settingsResponse.data);

          // Auto-calculate validUntil date based on prescription validity days
          const validityDays = settingsResponse.data.settings?.prescriptionValidityDays || 30;
          const today = new Date();
          const validUntilDate = new Date(today);
          validUntilDate.setDate(validUntilDate.getDate() + validityDays);

          // Format as YYYY-MM-DD for date input
          const validUntilStr = validUntilDate.toISOString().split('T')[0];

          // Only set if validUntil is not already set (don't override user input)
          setFormData((prev) => ({
            ...prev,
            validUntil: prev.validUntil || validUntilStr,
          }));
        }
      } catch (err) {
        logger.error('Failed to fetch clinic settings:', err);
      }

      // Fetch appointments with in_progress status to get patients
      const appointmentsResponse = await apiClient.get(
        '/appointments?status=in_progress&limit=100',
      );

      // Store appointments for linking
      let appointmentsData = [];
      if (appointmentsResponse.success && appointmentsResponse.data) {
        appointmentsData = Array.isArray(appointmentsResponse.data)
          ? appointmentsResponse.data
          : appointmentsResponse.data?.data || [];
      }

      // Extract unique patient IDs from appointments
      let patientIds = [];
      if (appointmentsData.length > 0) {
        patientIds = [
          ...new Set(
            appointmentsData
              .map((apt) => {
                if (typeof apt.patientId === 'string') return apt.patientId;
                if (apt.patientId?._id) return apt.patientId._id;
                return null;
              })
              .filter((id) => id !== null),
          ),
        ];
      }

      // Fetch all patients
      const allPatientsResponse = await apiClient.get('/patients?limit=100');
      let allPatients = [];

      if (allPatientsResponse.success && allPatientsResponse.data) {
        allPatients = extractArrayData(allPatientsResponse);
      }

      // Filter patients to only include those with in_progress appointments
      // But also include the patient from URL if provided
      let filteredPatients = [];
      if (patientIds.length > 0) {
        filteredPatients = allPatients.filter((p) => patientIds.includes(p._id));
      }

      // If patientId is in URL, add that patient to the list if not already included
      if (patientIdFromUrl) {
        const urlPatient = allPatients.find((p) => p._id === patientIdFromUrl);
        if (urlPatient && !filteredPatients.find((p) => p._id === patientIdFromUrl)) {
          filteredPatients.push(urlPatient);
        }
      }

      setPatients(filteredPatients);

      // Fetch drugs from inventory (medications) - use type=medicine (not medication)
      const drugsResponse = await apiClient.get('/inventory/items?type=medicine&limit=1000');
      logger.debug('Drugs API Response:', drugsResponse);
      if (drugsResponse.success && drugsResponse.data) {
        // Handle pagination structure - API returns { success: true, data: { data: [...], pagination: {...} } }
        let drugsList = [];

        // Extract drugs data and filter for medicines
        const allDrugs = extractArrayData(drugsResponse);
        drugsList = allDrugs
          .filter((item) => item.type === 'medicine') // Double-check it's a medicine
          .map((item) => ({
            _id: item._id,
            name: item.name || item.brandName || 'Unknown',
            genericName: item.genericName,
            form: item.form || '',
            strength: item.strength,
          }));

        logger.debug('Extracted drugs list:', drugsList.length, 'drugs found');
        setDrugs(drugsList);
      } else {
        logger.error('Failed to fetch drugs:', drugsResponse.error || 'Unknown error');
      }
    } catch (error) {
      logger.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        itemType: 'drug',
        drugId: '',
        drugName: '',
        frequency: 'twice daily',
        duration: 7,
        quantity: 1,
        unit: 'tablets',
        instructions: '',
        takeWithFood: false,
        allowSubstitution: true,
        route: 'oral',
        refills: 0,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    setItems((prevItems) => {
      const updated = [...prevItems];
      updated[index] = { ...updated[index], [field]: value };

      // If drugId changed, update drugName
      if (field === 'drugId' && value) {
        const drug = drugs.find((d) => d._id === value);
        if (drug) {
          updated[index].drugName = drug.name;
        }
      }

      return updated;
    });
  };

  const updateItemComplete = (index, item) => {
    setItems((prevItems) => {
      const updated = [...prevItems];
      updated[index] = item;
      return updated;
    });
  };

  const validateForm = () => {
    const errors = {};

    // Validate patient
    if (!formData.patientId || formData.patientId.trim() === '') {
      errors.patientId = t('prescriptions.validationPatientRequired');
    }

    // Validate validUntil
    if (!formData.validUntil) {
      errors.validUntil = t('prescriptions.validationValidUntilRequired');
    } else {
      const validUntilDate = new Date(formData.validUntil);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (validUntilDate < today) {
        errors.validUntil = t('prescriptions.validationValidUntilFuture');
      }
    }

    // Validate items
    if (items.length === 0) {
      errors.items = t('prescriptions.validationItemsRequired');
    } else {
      items.forEach((item, index) => {
        const itemType = item.itemType || 'drug';
        const itemKey = `item_${index}`;

        if (itemType === 'drug') {
          if (!item.drugId || (typeof item.drugId === 'string' && item.drugId.trim() === '')) {
            errors[itemKey] = t('prescriptions.validationSelectDrug');
          }
          if (!item.frequency || item.frequency.trim() === '') {
            errors[`${itemKey}_frequency`] = t('prescriptions.validationFrequencyRequired');
          }
          if (!item.duration || item.duration < 1) {
            errors[`${itemKey}_duration`] = t('prescriptions.validationDurationMin');
          }
          if (!item.quantity || item.quantity < 1) {
            errors[`${itemKey}_quantity`] = t('prescriptions.validationQuantityMin');
          }
        } else if (itemType === 'lab') {
          if (
            !item.labTestCode ||
            (typeof item.labTestCode === 'string' && item.labTestCode.trim() === '')
          ) {
            errors[itemKey] = t('prescriptions.validationSelectLabTest');
          }
        } else if (itemType === 'procedure') {
          if (
            !item.procedureName ||
            (typeof item.procedureName === 'string' && item.procedureName.trim() === '')
          ) {
            errors[itemKey] = t('prescriptions.validationProcedureName');
          }
        } else if (itemType === 'other') {
          if (
            !item.itemName ||
            (typeof item.itemName === 'string' && item.itemName.trim() === '')
          ) {
            errors[itemKey] = t('prescriptions.validationItemName');
          }
        }
      });
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPrescriptionPayload = (status) => {
    const validUntil = formData.validUntil
      ? new Date(formData.validUntil).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const base = {
      patientId: formData.patientId,
      appointmentId: formData.appointmentId || currentAppointment?._id || undefined,
      clinicalNoteId: formData.clinicalNoteId || currentAppointment?.clinicalNoteId || undefined,
      status,
      items: items.map((item) => {
        const baseItem = {
          itemType: item.itemType || 'drug',
          instructions: item.instructions || undefined,
        };
        if (item.itemType === 'drug') {
          baseItem.drugId = item.drugId;
          baseItem.drugName = item.drugName || undefined;
          baseItem.genericName = item.genericName || undefined;
          baseItem.form = item.form || undefined;
          baseItem.strength = item.strength || undefined;
          baseItem.frequency = item.frequency || undefined;
          baseItem.duration = item.duration || undefined;
          baseItem.quantity = item.quantity || undefined;
          baseItem.unit = item.unit || undefined;
          baseItem.takeWithFood = item.takeWithFood || false;
          baseItem.takeBeforeMeal = item.takeBeforeMeal || false;
          baseItem.takeAfterMeal = item.takeAfterMeal || false;
          baseItem.allowSubstitution = item.allowSubstitution !== false;
          baseItem.route = item.route || undefined;
          baseItem.refills = item.refills != null ? item.refills : undefined;
        } else if (item.itemType === 'lab') {
          baseItem.labTestName = item.labTestName || undefined;
          baseItem.labTestCode = item.labTestCode || undefined;
          baseItem.labInstructions = item.labInstructions || undefined;
          baseItem.fastingRequired = item.fastingRequired || false;
          baseItem.priority = item.priority || undefined;
        } else if (item.itemType === 'procedure') {
          baseItem.procedureName = item.procedureName || undefined;
          baseItem.procedureCode = item.procedureCode || undefined;
          baseItem.procedureInstructions = item.procedureInstructions || undefined;
        } else if (item.itemType === 'other') {
          baseItem.itemName = item.itemName || undefined;
          baseItem.itemDescription = item.itemDescription || undefined;
        }
        return baseItem;
      }),
      diagnosis: formData.diagnosis || undefined,
      icd10Codes: formData.icd10Codes?.length ? formData.icd10Codes : undefined,
      chiefComplaint: formData.symptoms || undefined,
      followUpDate: formData.followUpDate || undefined,
      followUpType: formData.followUpType || undefined,
      followUpAutoSchedule: formData.followUpAutoSchedule || false,
      additionalInstructions: formData.additionalInstructions || undefined,
      validUntil,
      refillsAllowed: formData.refillsAllowed || 0,
    };
    if (
      status === 'active' &&
      (formData.digitalSignature || formData.signedByTitle || formData.signedByLicense)
    ) {
      base.doctorSignature = formData.digitalSignature?.trim();
      base.signedByTitle = formData.signedByTitle?.trim();
      base.signedByLicense = formData.signedByLicense?.trim();
    }
    return base;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSubmitting(true);
    setAutoSaveSubmitting(true);

    if (!validateForm()) {
      setError(t('prescriptions.validationFixErrors'));
      setSubmitting(false);
      setAutoSaveSubmitting(false);
      return;
    }
    if (!formData.digitalSignature?.trim()) {
      setError(t('prescriptions.validationSignatureRequired'));
      setSubmitting(false);
      setAutoSaveSubmitting(false);
      return;
    }

    try {
      const prescriptionData = buildPrescriptionPayload('active');
      const response = await apiClient.post('/prescriptions', prescriptionData);
      if (response.success) {
        clearDraft();
        showSuccess(t('prescriptions.signedAndSentSuccess'));
        router.push('/prescriptions');
      } else {
        const errorMessage = response.error?.message || t('prescriptions.failedToCreatePrescription');
        setError(errorMessage);
        showError(errorMessage);
      }
    } catch (error) {
      logger.error('Failed to create prescription:', error);
      const errorMessage = error.message || t('prescriptions.failedToCreatePrescription');
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setSubmitting(false);
      setAutoSaveSubmitting(false); // Re-enable auto-save after submission
    }
  };

  const handleSaveDraft = async () => {
    setError('');
    setFieldErrors({});
    if (!formData.patientId?.trim()) {
      setError(t('prescriptions.validationSelectPatientForDraft'));
      return;
    }
    setSubmitting(true);
    setAutoSaveSubmitting(true);

    try {
      const prescriptionData = buildPrescriptionPayload('draft');

      const response = await apiClient.post('/prescriptions', prescriptionData);
      if (response.success) {
        clearDraft();
        showSuccess(t('prescriptions.savedAsDraftSuccess'));
      } else {
        const errorMessage = response.error?.message || t('prescriptions.failedToSaveDraft');
        setError(errorMessage);
        showError(errorMessage);
      }
    } catch (error) {
      logger.error('Failed to save prescription draft:', error);
      const errorMessage = error.message || t('prescriptions.failedToSaveDraft');
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setSubmitting(false);
      setAutoSaveSubmitting(false);
    }
  };

  // Print preview handler
  const handlePrintPreview = () => {
    const selectedPatient = patients.find((p) => p._id === formData.patientId);
    if (!selectedPatient) {
      showError(t('prescriptions.selectPatientFirst') || 'Please select a patient first');
      return;
    }
    setShowPrintPreview(true);
  };

  // Redirect if not authenticated (non-blocking)
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [authLoading, currentUser, router]);

  // Show empty state while redirecting
  if (!currentUser) {
    return null;
  }

  if (loading) {
    return <Loader type='page' text={t('common.loading')} />;
  }

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #prescription-print-view,
          #prescription-print-view * {
            visibility: visible;
          }
          #prescription-print-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      <Layout>
        <PageHeader
          title={t('prescriptions.createPrescription')}
          subtitle={t('prescriptions.prescriptionList')}
          notifications={[]}
          unreadCount={0}
        />
        <div style={{ padding: '0 10px' }}>
          {/* Two-column layout: Form on left (wider), Patient details on right */}
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            {/* Left column: Main form */}
            <div className='lg:col-span-3'>
              <div className='prescription-form-card'>
                <PrescriptionPatientHeader patientId={formData.patientId} />
                <form onSubmit={handleSubmit} noValidate>
                  {error && (
                    <div
                      className='prescription-form-section'
                      style={{ paddingBottom: 'var(--space-4)' }}
                    >
                      <div className='bg-status-error/10 border-l-4 border-status-error text-status-error px-4 py-3 rounded-lg flex items-center gap-2'>
                        <span>⚠</span>
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  {selectedPatient?.allergies &&
                    items.some(
                      (it) =>
                        it.itemType === 'drug' &&
                        (it.drugName || it.genericName) &&
                        String(selectedPatient.allergies || '')
                          .toLowerCase()
                          .split(/\s*[,;]\s*|\s+/)
                          .some(
                            (a) =>
                              (it.drugName || '').toLowerCase().includes(a) ||
                              (it.genericName || '').toLowerCase().includes(a),
                          ),
                    ) && (
                      <div
                        className='prescription-form-section'
                        style={{ paddingBottom: 'var(--space-4)' }}
                      >
                        <div className='bg-status-warning/10 border-l-4 border-status-warning text-status-warning px-4 py-3 rounded-lg flex items-center gap-2'>
                          <span>⚠</span>
                          <span>{t('prescriptions.allergyWarning')}</span>
                        </div>
                      </div>
                    )}

                  <ClinicalDecisionSupport
                    items={items}
                    onOrderTest={(testName) => {
                      setFormData((prev) => ({
                        ...prev,
                        additionalInstructions:
                          (prev.additionalInstructions || '') + ` [Order: ${testName}]`,
                      }));
                    }}
                    onReferral={() => {
                      setFormData((prev) => ({
                        ...prev,
                        additionalInstructions:
                          (prev.additionalInstructions || '') + ' [Referral suggested]',
                      }));
                    }}
                  />

                  <div className='prescription-form-section'>
                    <h2 className='prescription-form-section-title'>{t('prescriptions.prescriptionDetails')}</h2>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                      <div className='prescription-form-field'>
                        <label
                          htmlFor='patientId'
                          className='prescription-form-label prescription-form-label-required'
                        >
                          {t('appointments.patient')}
                        </label>
                        <select
                          id='patientId'
                          required
                          value={formData.patientId}
                          onChange={(e) => {
                            const selectedPatientId = e.target.value;
                            setFormData({ ...formData, patientId: selectedPatientId });
                            setFieldErrors({ ...fieldErrors, patientId: '' });
                            // Fetch appointment for selected patient
                            if (selectedPatientId) {
                              fetchCurrentAppointment(selectedPatientId);
                            } else {
                              setCurrentAppointment(null);
                              setFormData((prev) => ({
                                ...prev,
                                appointmentId: '',
                                clinicalNoteId: '',
                              }));
                            }
                          }}
                          className={`prescription-form-input ${
                            fieldErrors.patientId ? 'border-status-error' : ''
                          }`}
                          disabled={patients.length === 0}
                        >
                          <option value=''>
                            {patients.length === 0
                              ? t('prescriptions.noPatientsInProgress')
                              : `${t('common.select')} ${t('appointments.patient').toLowerCase()}`}
                          </option>
                          {patients.map((patient) => (
                            <option key={patient._id} value={patient._id}>
                              {patient.patientId} - {patient.firstName} {patient.lastName}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.patientId && (
                          <div className='prescription-form-error'>{fieldErrors.patientId}</div>
                        )}
                        {currentAppointment && (
                          <p
                            className='prescription-form-help-text'
                            style={{ color: 'var(--color-secondary-700)' }}
                          >
                            ✓ {t('prescriptions.linkedToAppointment')}:{' '}
                            {new Date(currentAppointment.appointmentDate).toLocaleDateString()}
                          </p>
                        )}
                        {patients.length === 0 && !loading && (
                          <p className='prescription-form-help-text'>
                            {t('prescriptions.onlyPatientsWithAppointments')}
                          </p>
                        )}
                      </div>

                      <div className='prescription-form-field'>
                        <label
                          htmlFor='validUntil'
                          className='prescription-form-label prescription-form-label-required'
                        >
                          {t('prescriptions.validUntil')}
                        </label>
                        <Input
                          id='validUntil'
                          type='date'
                          value={formData.validUntil}
                          onChange={(e) => {
                            setFormData({ ...formData, validUntil: e.target.value });
                            setFieldErrors({ ...fieldErrors, validUntil: '' });
                          }}
                          required
                          className={fieldErrors.validUntil ? 'border-status-error' : ''}
                        />
                        {fieldErrors.validUntil && (
                          <div className='prescription-form-error'>{fieldErrors.validUntil}</div>
                        )}
                        <p className='prescription-form-help-text'>
                          {t('prescriptions.validUntilHelp')}
                        </p>
                      </div>

                      <div className='prescription-form-field'>
                        <label htmlFor='symptoms' className='prescription-form-label'>
                          {t('prescriptions.chiefComplaint')}
                        </label>
                        <Input
                          id='symptoms'
                          value={formData.symptoms}
                          onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                          placeholder={t('prescriptions.diagnosisPlaceholderExample')}
                        />
                        <p className='prescription-form-help-text'>
                          {t('prescriptions.symptomsHelp')}
                        </p>
                      </div>

                      <div className='prescription-form-field'>
                        <label htmlFor='diagnosis' className='prescription-form-label'>
                          {t('prescriptions.primaryDiagnosis')}
                        </label>
                        <ICD10SearchInput
                          codes={icd10Common}
                          value={formData.icd10Codes?.[0] || ''}
                          displayValue={formData.diagnosis}
                          onChange={(code) =>
                            setFormData((prev) => ({
                              ...prev,
                              icd10Codes: code ? [code] : [],
                            }))
                          }
                          onSelect={(item) =>
                            setFormData((prev) => ({
                              ...prev,
                              diagnosis: item
                                ? `${item.code || ''} - ${item.title || ''}`.trim()
                                : prev.diagnosis,
                              icd10Codes: item?.code ? [item.code] : [],
                            }))
                          }
                          className={fieldErrors.diagnosis ? 'border-status-error' : ''}
                        />
                        <p className='prescription-form-help-text'>
                          Search by ICD-10 code or description
                        </p>
                      </div>

                      <div className='prescription-form-field'>
                        <label htmlFor='followUpDate' className='prescription-form-label'>
                          Follow-up Date
                        </label>
                        <Input
                          id='followUpDate'
                          type='date'
                          value={formData.followUpDate}
                          onChange={(e) =>
                            setFormData({ ...formData, followUpDate: e.target.value })
                          }
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <p className='prescription-form-help-text'>
                          Recommended date for patient follow-up
                        </p>
                      </div>

                      <div className='prescription-form-field'>
                        <label htmlFor='followUpType' className='prescription-form-label'>
                          {t('prescriptions.followUpType')}
                        </label>
                        <select
                          id='followUpType'
                          value={formData.followUpType}
                          onChange={(e) =>
                            setFormData({ ...formData, followUpType: e.target.value })
                          }
                          className='prescription-form-input'
                        >
                          <option value='in-person'>{t('prescriptions.followUpInPerson')}</option>
                          <option value='video'>{t('prescriptions.followUpVideo')}</option>
                          <option value='phone'>{t('prescriptions.followUpPhone')}</option>
                        </select>
                      </div>

                      <div className='prescription-form-field flex items-center gap-2'>
                        <input
                          type='checkbox'
                          id='followUpAutoSchedule'
                          checked={formData.followUpAutoSchedule}
                          onChange={(e) =>
                            setFormData({ ...formData, followUpAutoSchedule: e.target.checked })
                          }
                        />
                        <label
                          htmlFor='followUpAutoSchedule'
                          className='prescription-form-label'
                          style={{ marginBottom: 0 }}
                        >
                          {t('prescriptions.followUpAutoSchedule')}
                        </label>
                      </div>

                      <div className='prescription-form-field'>
                        <label htmlFor='refillsAllowed' className='prescription-form-label'>
                          Refills Allowed
                        </label>
                        <Input
                          id='refillsAllowed'
                          type='number'
                          min='0'
                          value={formData.refillsAllowed}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              refillsAllowed: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder={t('prescriptions.refillsPlaceholder')}
                        />
                        <p className='prescription-form-help-text'>
                          Number of times this prescription can be refilled
                        </p>
                      </div>
                    </div>

                    <div
                      className='prescription-form-field'
                      style={{ marginTop: 'var(--space-5)' }}
                    >
                      <label className='prescription-form-label'>
                        {t('prescriptions.digitalSignature')}
                      </label>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <Input
                          id='digitalSignature'
                          type='text'
                          value={formData.digitalSignature}
                          onChange={(e) =>
                            setFormData({ ...formData, digitalSignature: e.target.value })
                          }
                          placeholder={
                            currentUser
                              ? `Dr. ${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
                                'Dr. Name'
                              : 'Dr. Name'
                          }
                        />
                        <Input
                          id='signedByTitle'
                          type='text'
                          value={formData.signedByTitle}
                          onChange={(e) =>
                            setFormData({ ...formData, signedByTitle: e.target.value })
                          }
                          placeholder={t('prescriptions.doctorTitle')}
                        />
                        <Input
                          id='signedByLicense'
                          type='text'
                          value={formData.signedByLicense}
                          onChange={(e) =>
                            setFormData({ ...formData, signedByLicense: e.target.value })
                          }
                          placeholder={t('prescriptions.licenseNumber')}
                        />
                      </div>
                      <p className='prescription-form-help-text'>
                        Name, title, and license # for e-signature. Required for Sign &amp; Send.
                      </p>
                    </div>

                    <div
                      className='prescription-form-field'
                      style={{ marginTop: 'var(--space-5)' }}
                    >
                      <label htmlFor='additionalInstructions' className='prescription-form-label'>
                        {t('prescriptions.advicePrecautions')}
                      </label>
                      <SimpleTextEditor
                        value={formData.additionalInstructions}
                        onChange={(value) =>
                          setFormData({ ...formData, additionalInstructions: value })
                        }
                        placeholder={t('prescriptions.instructionsPlaceholder')}
                        rows={4}
                      />
                      <p className='prescription-form-help-text'>
                        Special instructions, warnings, or notes for the patient
                      </p>
                    </div>
                  </div>

                  <div className='prescription-items-section'>
                    <div className='prescription-items-header'>
                        <h3 className='prescription-items-title'>{t('prescriptions.prescriptionItems')}</h3>
                      <Button type='button' variant='secondary' size='sm' onClick={addItem}>
                        + Add Item
                      </Button>
                    </div>
                    {fieldErrors.items && (
                      <div
                        className='prescription-form-error'
                        style={{ marginBottom: 'var(--space-4)' }}
                      >
                        {fieldErrors.items}
                      </div>
                    )}
                    <PrescriptionItemsTable
                      items={items}
                      drugs={drugs}
                      labTests={labTests}
                      onUpdate={updateItem}
                      onUpdateItem={updateItemComplete}
                      onRemove={removeItem}
                      onAdd={addItem}
                      fieldErrors={fieldErrors}
                    />
                  </div>

                  <div className='prescription-form-actions'>
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={() => router.back()}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={handleSaveDraft}
                      isLoading={submitting}
                      disabled={submitting}
                    >
                      {t('prescriptions.saveAsDraft')}
                    </Button>
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={handlePrintPreview}
                      disabled={submitting || !formData.patientId}
                    >
                      <PrinterIcon className='icon icon-sm mr-2' ariaHidden />
                      {t('prescriptions.print')}
                    </Button>
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={handlePrintPreview}
                      disabled={submitting || !formData.patientId}
                      title={
                        t('prescriptions.downloadPdfHint') ||
                        t('prescriptions.openPreviewToPrint')
                      }
                    >
                      <FileDownIcon className='icon icon-sm mr-2' ariaHidden />
                      {t('prescriptions.downloadPdf') || 'Download PDF'}
                    </Button>
                    <Button
                      type='submit'
                      variant='primary'
                      isLoading={submitting}
                      disabled={submitting}
                    >
                      {t('prescriptions.signAndSend')}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right column: Patient Details Panel */}
            <div className='lg:col-span-1 min-w-0'>
              <div className='sticky top-4'>
                <PatientDetailsPanel patientId={formData.patientId} />
              </div>
            </div>
          </div>

          <PrescriptionFormPrintPreview
            isOpen={showPrintPreview}
            onClose={() => setShowPrintPreview(false)}
            formData={formData}
            items={items}
            patients={patients}
            clinicSettings={clinicSettings}
          />
        </div>
      </Layout>
    </>
  );
}

export default function NewPrescriptionPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<Loader type='page' text={t('common.loading')} />}>
      <NewPrescriptionPageContent />
    </Suspense>
  );
}
