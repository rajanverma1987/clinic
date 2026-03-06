'use client';

import '@/app/prescriptions/styles/prescription-form.css';
import { FileDownIcon, PrinterIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClinicalDecisionSupport } from '@/components/prescriptions/ClinicalDecisionSupport';
import { ICD10SearchInput } from '@/components/prescriptions/ICD10SearchInput';
import { PrescriptionFormPrintPreview } from '@/components/prescriptions/PrescriptionFormPrintPreview';
import { PrescriptionItemsTable } from '@/components/prescriptions/PrescriptionItemsTable.jsx';
import { PrescriptionPatientHeader } from '@/components/prescriptions/PrescriptionPatientHeader';
import { AiAssistSuggest } from '@/components/ui/AiAssistSuggest';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { SimpleTextEditor } from '@/components/ui/SimpleTextEditor';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import icd10Common from '@/data/icd10-common.json';
import { getPatientDisplayName } from '@/lib/utils/patient-display-name';
import { useFormAutoSave } from '@/hooks/useFormAutoSave.js';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts.js';
import { apiClient } from '@/lib/api/client';
import * as routeCache from '@/lib/cache/dashboard-cache';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

function NewPrescriptionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { t, locale: i18nLocale } = useI18n();
  const { locale: settingsLocale } = useSettings();
  const localeCode = (settingsLocale || i18nLocale || 'en').toString().slice(0, 2);
  const [patients, setPatients] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [clinicSettings, setClinicSettings] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Get patientId from URL query parameter if present
  const patientIdFromUrl = searchParams?.get('patientId') || '';

  // Settings: SWR so remounts reuse cache and avoid repeated 3s+ fetches
  const SETTINGS_KEY = '/api/settings';
  const settingsFetcher = async () => {
    const res = await apiClient.get('/settings');
    if (!res?.success || !res?.data) return null;
    return res.data;
  };
  const { data: settingsFromSWR } = useSWR(SETTINGS_KEY, settingsFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2 * 60 * 1000,
  });
  useEffect(() => {
    if (settingsFromSWR) {
      setClinicSettings(settingsFromSWR);
      const validityDays = settingsFromSWR.settings?.prescriptionValidityDays || 30;
      const today = new Date();
      const validUntilDate = new Date(today);
      validUntilDate.setDate(validUntilDate.getDate() + validityDays);
      const validUntilStr = validUntilDate.toISOString().split('T')[0];
      setFormData((prev) => (prev.validUntil ? prev : { ...prev, validUntil: validUntilStr }));
    }
  }, [settingsFromSWR]);

  // Medicines list: SWR so remounts/navigations reuse cache and avoid repeated 2s+ fetches
  const MEDICINES_KEY = '/api/inventory/items?type=medicine&limit=500&lightweight=true';
  const medicinesFetcher = async () => {
    const res = await apiClient.get('/inventory/items?type=medicine&limit=500&lightweight=true');
    if (!res?.success || !res?.data) return [];
    const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    return raw
      .filter((item) => item.type === 'medicine')
      .map((item) => ({
        _id: item._id,
        name: item.name || item.brandName || '',
        genericName: item.genericName,
        form: item.form || '',
        strength: item.strength,
      }));
  };
  const { data: medicinesFromSWR, isLoading: medicinesLoading } = useSWR(
    MEDICINES_KEY,
    medicinesFetcher,
    { revalidateOnFocus: false, dedupingInterval: 5 * 60 * 1000 },
  );
  useEffect(() => {
    if (!medicinesFromSWR) return;
    setDrugs(
      medicinesFromSWR.map((item) => ({
        ...item,
        name: item.name || item.brandName || t('prescriptions.unknownMedicine'),
      })),
    );
  }, [medicinesFromSWR, t]);

  // Appointments and patients: SWR so remounts reuse cache (avoids repeated 5s+ and 2s+ fetches)
  const appointmentsKey = currentUser?.tenantId
    ? '/api/appointments?status=in_progress&limit=100'
    : null;
  const patientsKey = currentUser?.tenantId ? '/api/patients?limit=100' : null;
  const appointmentsFetcher = async () => {
    const res = await apiClient.get('/appointments?status=in_progress&limit=100');
    if (!res?.success || !res?.data) return [];
    return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
  };
  const patientsFetcher = async () => {
    const res = await apiClient.get('/patients?limit=100');
    if (!res?.success || !res?.data) return [];
    return extractArrayData(res);
  };
  const { data: appointmentsFromSWR, isLoading: appointmentsLoading } = useSWR(
    appointmentsKey,
    appointmentsFetcher,
    { revalidateOnFocus: false, dedupingInterval: 2 * 60 * 1000 },
  );
  const { data: patientsFromSWR, isLoading: patientsLoading } = useSWR(
    patientsKey,
    patientsFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2 * 60 * 1000,
    },
  );
  useEffect(() => {
    if (appointmentsFromSWR === undefined || patientsFromSWR === undefined) return;
    const appointmentsData = appointmentsFromSWR ?? [];
    const allPatients = patientsFromSWR ?? [];
    const patientIds = [
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
    let filtered =
      patientIds.length > 0 ? allPatients.filter((p) => patientIds.includes(p._id)) : [];
    if (patientIdFromUrl) {
      const urlPatient = allPatients.find((p) => p._id === patientIdFromUrl);
      if (urlPatient && !filtered.find((p) => p._id === patientIdFromUrl)) {
        filtered = [...filtered, urlPatient];
      }
    }
    setPatients(filtered);
  }, [appointmentsFromSWR, patientsFromSWR, patientIdFromUrl]);

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
        description: t('prescriptions.shortcutSavePrescription'),
      },
      {
        key: 'Escape',
        action: (e) => {
          e.preventDefault();
          router.back();
        },
        description: t('prescriptions.shortcutCancel'),
      },
    ],
    [router, t],
  );

  useKeyboardShortcuts(keyboardShortcuts);

  useEffect(() => {
    if (!authLoading && currentUser) {
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

  // Settings, appointments, patients, medicines all come from useSWR — no fetchData

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

  const [treatmentPackages, setTreatmentPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  useEffect(() => {
    apiClient.get('/treatment-packages?limit=100').then((res) => {
      if (res?.success && res?.data?.items) setTreatmentPackages(res.data.items);
    });
  }, []);

  const addItemsFromPackage = () => {
    if (!selectedPackageId) return;
    const pkg = treatmentPackages.find((p) => p._id === selectedPackageId);
    if (!pkg?.items?.length) return;
    const newItems = pkg.items.map((i) => ({
      itemType: 'procedure',
      procedureName: i.name || '',
      procedureCode: i.procedureType || '',
      procedureInstructions: i.description || '',
    }));
    setItems((prev) => [...prev, ...newItems]);
    setSelectedPackageId('');
    showSuccess(t('prescriptions.addedFromPackage'));
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
        routeCache.clear('route_prescriptions', currentUser?.tenantId ?? undefined);
        showSuccess(t('prescriptions.signedAndSentSuccess'));
        router.push('/prescriptions');
      } else {
        const errorMessage =
          response.error?.message || t('prescriptions.failedToCreatePrescription');
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
        routeCache.clear('route_prescriptions', currentUser?.tenantId ?? undefined);
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
      showError(t('prescriptions.selectPatientFirst'));
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

  // Wait for appointments + patients + medicines (all from SWR) so form and drug dropdown are ready
  const dataLoading =
    appointmentsLoading || patientsLoading || (drugs.length === 0 && medicinesLoading);
  if (dataLoading) {
    return <Layout loading />;
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
        <div className='prescription-new-page'>
          <div className='prescription-form-grid'>
            {/* Left: Main form */}
            <div className='prescription-form-main min-w-0'>
              <div className='prescription-form-card'>
                <PrescriptionPatientHeader patientId={formData.patientId} />
                <form onSubmit={handleSubmit} noValidate>
                  {error && (
                    <div className='prescription-form-section prescription-form-alert'>
                      <div className='prescription-form-alert-banner prescription-form-alert-banner--error'>
                        <span aria-hidden>⚠</span>
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
                      <div className='prescription-form-section prescription-form-alert'>
                        <div className='prescription-form-alert-banner prescription-form-alert-banner--warning'>
                          <span aria-hidden>⚠</span>
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
                    <h2 className='prescription-form-section-title'>
                      {t('prescriptions.prescriptionDetails')}
                    </h2>

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
                              {patient.patientId} - {getPatientDisplayName(patient, localeCode, t)}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.patientId && (
                          <div className='prescription-form-error'>{fieldErrors.patientId}</div>
                        )}
                        {currentAppointment && (
                          <p className='prescription-form-help-text prescription-form-help-text--success'>
                            ✓ {t('prescriptions.linkedToAppointment')}:{' '}
                            {new Date(currentAppointment.appointmentDate).toLocaleDateString()}
                          </p>
                        )}
                        {patients.length === 0 && !dataLoading && (
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
                        <div className='flex items-center justify-between gap-2 mb-2'>
                          <label htmlFor='diagnosis' className='prescription-form-label'>
                            {t('prescriptions.primaryDiagnosis')}
                          </label>
                          <AiAssistSuggest
                            context='diagnosis'
                            onInsert={(text) =>
                              setFormData((prev) => ({
                                ...prev,
                                diagnosis: prev.diagnosis ? `${prev.diagnosis}; ${text}` : text,
                              }))
                            }
                          />
                        </div>
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
                          {t('prescriptions.followUpDate')}
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
                          {t('prescriptions.followUpDateHelp')}
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
                          className='prescription-form-label prescription-form-label--inline'
                        >
                          {t('prescriptions.followUpAutoSchedule')}
                        </label>
                      </div>

                      <div className='prescription-form-field'>
                        <label htmlFor='refillsAllowed' className='prescription-form-label'>
                          {t('prescriptions.refillsAllowed')}
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
                          {t('prescriptions.refillsAllowedHelp')}
                        </p>
                      </div>
                    </div>

                    <div className='prescription-form-field prescription-form-field-block'>
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
                          placeholder={t('prescriptions.doctorNamePlaceholder')}
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
                        {t('prescriptions.signatureHelp')}
                      </p>
                    </div>

                    <div className='prescription-form-field prescription-form-field-block'>
                      <div className='flex items-center justify-between gap-2 mb-2'>
                        <label htmlFor='additionalInstructions' className='prescription-form-label'>
                          {t('prescriptions.advicePrecautions')}
                        </label>
                        <AiAssistSuggest
                          context='clinical_notes'
                          onInsert={(text) =>
                            setFormData((prev) => ({
                              ...prev,
                              additionalInstructions: prev.additionalInstructions
                                ? `${prev.additionalInstructions}\n${text}`
                                : text,
                            }))
                          }
                        />
                      </div>
                      <SimpleTextEditor
                        value={formData.additionalInstructions}
                        onChange={(value) =>
                          setFormData((prev) => ({ ...prev, additionalInstructions: value }))
                        }
                        placeholder={t('prescriptions.instructionsPlaceholder')}
                        rows={4}
                      />
                      <p className='prescription-form-help-text'>
                        {t('prescriptions.additionalInstructionsHelp')}
                      </p>
                    </div>
                  </div>

                  <Card
                    className='prescription-items-card'
                    title={t('prescriptions.prescriptionItems')}
                    actions={
                      <div className='flex flex-wrap items-center gap-2'>
                        <Button type='button' variant='primary' size='sm' onClick={addItem}>
                          + {t('prescriptions.addItem')}
                        </Button>
                        {treatmentPackages.length > 0 && (
                          <>
                            <select
                              value={selectedPackageId}
                              onChange={(e) => setSelectedPackageId(e.target.value)}
                              className='px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm min-w-[160px]'
                              aria-label={t('prescriptions.addFromPackage')}
                            >
                              <option value=''>
                                {t('prescriptions.selectPackage')}
                              </option>
                              {treatmentPackages.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              type='button'
                              variant='secondary'
                              size='sm'
                              onClick={addItemsFromPackage}
                              disabled={!selectedPackageId}
                            >
                              {t('prescriptions.addFromPackage')}
                            </Button>
                          </>
                        )}
                      </div>
                    }
                  >
                    {fieldErrors.items && (
                      <div className='prescription-form-error mb-4'>{fieldErrors.items}</div>
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
                  </Card>

                  <div className='prescription-form-actions'>
                    <Button
                      type='button'
                      variant='ghost'
                      onClick={() => router.back()}
                      disabled={submitting}
                    >
                      {t('common.cancel')}
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
                      <PrinterIcon className='icon icon-sm flex-shrink-0' ariaHidden />
                      {t('prescriptions.print')}
                    </Button>
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={handlePrintPreview}
                      disabled={submitting || !formData.patientId}
                      title={
                        t('prescriptions.downloadPdfHint') || t('prescriptions.openPreviewToPrint')
                      }
                    >
                      <FileDownIcon className='icon icon-sm flex-shrink-0' ariaHidden />
                      {t('prescriptions.downloadPdf')}
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
