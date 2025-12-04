'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts.js';
import { useFormAutoSave } from '@/hooks/useFormAutoSave.js';
import { PatientDetailsPanel } from '@/components/prescriptions/PatientDetailsPanel';
import { PrescriptionItemsTable } from '@/components/prescriptions/PrescriptionItemsTable.jsx';
import { PrescriptionFormPrintPreview } from '@/components/prescriptions/PrescriptionFormPrintPreview';
import { SimpleTextEditor } from '@/components/ui/SimpleTextEditor';

export default function NewPrescriptionPage() {
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
    patientId: patientIdFromUrl, // Pre-fill from URL if provided
    appointmentId: '',
    clinicalNoteId: '',
    diagnosis: '',
    additionalInstructions: '',
    validUntil: '',
    refillsAllowed: 0,
  });
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Auto-save form drafts
  const { loadDraft, clearDraft, setSubmitting: setAutoSaveSubmitting } = useFormAutoSave({
    formData: { ...formData, items },
    formKey: 'new-prescription',
    enabled: true,
  });

  // Keyboard shortcuts - useMemo to ensure router is in scope
  const keyboardShortcuts = useMemo(() => [
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
  ], [router]);
  
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
            patientId: patientIdFromUrl || draft.formData.patientId || prev.patientId
          }));
        }
        if (draft.items && Array.isArray(draft.items)) {
          setItems(draft.items);
        }
      }
    }
  }, [authLoading, currentUser, patientIdFromUrl]);

  // Update patientId when URL parameter changes or when patients are loaded
  useEffect(() => {
    if (patientIdFromUrl && patients.length > 0) {
      // Verify patient exists in the list before setting
      const patientExists = patients.some(p => p._id === patientIdFromUrl);
      if (patientExists) {
        setFormData(prev => ({ ...prev, patientId: patientIdFromUrl }));
      }
    }
  }, [patientIdFromUrl, patients]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch clinic settings for print
      try {
        const settingsResponse = await apiClient.get('/settings');
        if (settingsResponse.success && settingsResponse.data) {
          setClinicSettings(settingsResponse.data);
        }
      } catch (err) {
        console.error('Failed to fetch clinic settings:', err);
      }

      // Fetch appointments with in_progress status to get patients
      const appointmentsResponse = await apiClient.get('/appointments?status=in_progress&limit=100');
      
      // Extract unique patient IDs from appointments
      let patientIds = [];
      if (appointmentsResponse.success && appointmentsResponse.data) {
        const appointmentsData = Array.isArray(appointmentsResponse.data) 
          ? appointmentsResponse.data 
          : appointmentsResponse.data?.data || [];
        
        patientIds = [...new Set(
          appointmentsData.map((apt) => {
            if (typeof apt.patientId === 'string') return apt.patientId;
            if (apt.patientId?._id) return apt.patientId._id;
            return null;
          }).filter((id) => id !== null)
        )];
      }

      // Fetch all patients
      const allPatientsResponse = await apiClient.get('/patients?limit=100');
      let allPatients = [];
      
      if (allPatientsResponse.success && allPatientsResponse.data) {
        allPatients = Array.isArray(allPatientsResponse.data) 
          ? allPatientsResponse.data 
          : allPatientsResponse.data?.data || [];
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
      console.log('Drugs API Response:', drugsResponse);
      if (drugsResponse.success && drugsResponse.data) {
        // Handle pagination structure - API returns { success: true, data: { data: [...], pagination: {...} } }
        let drugsList = [];
        
        // Check if response.data has a data property (pagination structure) - this is the most common case
        if (drugsResponse.data.data && Array.isArray(drugsResponse.data.data)) {
          drugsList = drugsResponse.data.data
            .filter((item) => item.type === 'medicine') // Double-check it's a medicine
            .map((item) => ({
              _id: item._id,
              name: item.name || item.brandName || 'Unknown',
              genericName: item.genericName,
              form: item.form || '',
              strength: item.strength,
            }));
        }
        // Check if response.data is directly an array (fallback)
        else if (Array.isArray(drugsResponse.data)) {
          drugsList = drugsResponse.data
            .filter((item) => item.type === 'medicine')
            .map((item) => ({
              _id: item._id,
              name: item.name || item.brandName || 'Unknown',
              genericName: item.genericName,
              form: item.form || '',
              strength: item.strength,
            }));
        }
        
        console.log('Extracted drugs list:', drugsList.length, 'drugs found');
        setDrugs(drugsList);
      } else {
        console.error('Failed to fetch drugs:', drugsResponse.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
        const drug = drugs.find(d => d._id === value);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    setAutoSaveSubmitting(true); // Disable auto-save during submission

    try {
      // Validate items before submission
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemType = item.itemType || 'drug';
        
        if (itemType === 'drug') {
          if (!item.drugId || (typeof item.drugId === 'string' && item.drugId.trim() === '')) {
            setError(`Item ${i + 1}: Please select a drug`);
            setSubmitting(false);
            setAutoSaveSubmitting(false);
            return;
          }
        } else if (itemType === 'lab') {
          if (!item.labTestCode || (typeof item.labTestCode === 'string' && item.labTestCode.trim() === '')) {
            setError(`Item ${i + 1}: Please select a lab test`);
            setSubmitting(false);
            setAutoSaveSubmitting(false);
            return;
          }
        } else if (itemType === 'procedure') {
          if (!item.procedureName || (typeof item.procedureName === 'string' && item.procedureName.trim() === '')) {
            setError(`Item ${i + 1}: Please enter a procedure name`);
            setSubmitting(false);
            setAutoSaveSubmitting(false);
            return;
          }
        } else if (itemType === 'other') {
          if (!item.itemName || (typeof item.itemName === 'string' && item.itemName.trim() === '')) {
            setError(`Item ${i + 1}: Please enter an item name`);
            setSubmitting(false);
            setAutoSaveSubmitting(false);
            return;
          }
        }
      }

      // Calculate validUntil if not provided (default to 30 days from now)
      const validUntil = formData.validUntil 
        ? new Date(formData.validUntil).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const prescriptionData = {
        patientId: formData.patientId,
        appointmentId: formData.appointmentId || undefined,
        clinicalNoteId: formData.clinicalNoteId || undefined,
        status: 'active', // Set to active when creating prescription (not draft)
        items: items.map(item => {
          const baseItem = {
            itemType: item.itemType || 'drug',
            instructions: item.instructions || undefined,
          };

          // Add type-specific fields
          if (item.itemType === 'drug') {
            baseItem.drugId = item.drugId;
            baseItem.drugName = item.drugName;
            baseItem.frequency = item.frequency;
            baseItem.duration = item.duration;
            baseItem.quantity = item.quantity;
            baseItem.unit = item.unit || undefined;
            baseItem.takeWithFood = item.takeWithFood || false;
            baseItem.allowSubstitution = item.allowSubstitution !== false;
          } else if (item.itemType === 'lab') {
            baseItem.labTestName = item.labTestName;
            baseItem.labTestCode = item.labTestCode;
            baseItem.labInstructions = item.labInstructions;
            baseItem.fastingRequired = item.fastingRequired || false;
          } else if (item.itemType === 'procedure') {
            baseItem.procedureName = item.procedureName;
            baseItem.procedureCode = item.procedureCode;
            baseItem.procedureInstructions = item.procedureInstructions;
          } else if (item.itemType === 'other') {
            baseItem.itemName = item.itemName;
            baseItem.itemDescription = item.itemDescription;
          }

          return baseItem;
        }),
        diagnosis: formData.diagnosis || undefined,
        additionalInstructions: formData.additionalInstructions || undefined,
        validUntil,
        refillsAllowed: formData.refillsAllowed || undefined,
      };

      const response = await apiClient.post('/prescriptions', prescriptionData);
      if (response.success) {
        clearDraft(); // Clear saved draft on successful submission
        router.push('/prescriptions');
      } else {
        setError(response.error?.message || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Failed to create prescription:', error);
      setError(error.message || 'Failed to create prescription');
    } finally {
      setSubmitting(false);
      setAutoSaveSubmitting(false); // Re-enable auto-save after submission
    }
  };

  const handleSaveDraft = async () => {
    setError('');
    setSubmitting(true);
    setAutoSaveSubmitting(true);

    try {
      const validUntil = formData.validUntil 
        ? new Date(formData.validUntil).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const prescriptionData = {
        patientId: formData.patientId,
        appointmentId: formData.appointmentId || undefined,
        clinicalNoteId: formData.clinicalNoteId || undefined,
        items: items.map(item => {
          const baseItem = {
            itemType: item.itemType || 'drug',
            instructions: item.instructions || undefined,
          };

          if (item.itemType === 'drug') {
            baseItem.drugId = item.drugId;
            baseItem.drugName = item.drugName;
            baseItem.frequency = item.frequency;
            baseItem.duration = item.duration;
            baseItem.quantity = item.quantity;
            baseItem.unit = item.unit || undefined;
            baseItem.takeWithFood = item.takeWithFood || false;
            baseItem.allowSubstitution = item.allowSubstitution !== false;
          } else if (item.itemType === 'lab') {
            baseItem.labTestName = item.labTestName;
            baseItem.labTestCode = item.labTestCode;
            baseItem.labInstructions = item.labInstructions;
            baseItem.fastingRequired = item.fastingRequired || false;
          } else if (item.itemType === 'procedure') {
            baseItem.procedureName = item.procedureName;
            baseItem.procedureCode = item.procedureCode;
            baseItem.procedureInstructions = item.procedureInstructions;
          } else if (item.itemType === 'other') {
            baseItem.itemName = item.itemName;
            baseItem.itemDescription = item.itemDescription;
          }

          return baseItem;
        }),
        diagnosis: formData.diagnosis || undefined,
        additionalInstructions: formData.additionalInstructions || undefined,
        validUntil,
        refillsAllowed: formData.refillsAllowed || undefined,
        status: 'draft',
      };

      const response = await apiClient.post('/prescriptions', prescriptionData);
      if (response.success) {
        clearDraft();
        // Show success message but stay on page
        alert('Prescription saved as draft successfully!');
      } else {
        setError(response.error?.message || 'Failed to save prescription as draft');
      }
    } catch (error) {
      console.error('Failed to save prescription draft:', error);
      setError(error.message || 'Failed to save prescription as draft');
    } finally {
      setSubmitting(false);
      setAutoSaveSubmitting(false);
    }
  };

  // Print preview handler
  const handlePrintPreview = () => {
    const selectedPatient = patients.find(p => p._id === formData.patientId);
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    setShowPrintPreview(true);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      </Layout>
    );
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
        <div className="mb-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          ← {t('common.back')}
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{t('prescriptions.createPrescription')}</h1>
      </div>

      {/* Two-column layout: Form on left, Patient details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Main form */}
        <div className="lg:col-span-2">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
                {t('appointments.patient')} *
              </label>
              <select
                id="patientId"
                required
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={patients.length === 0}
              >
                <option value="">
                  {patients.length === 0 
                    ? 'No patients with in-progress appointments available' 
                    : `${t('common.select')} ${t('appointments.patient').toLowerCase()}`
                  }
                </option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.patientId} - {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
              {patients.length === 0 && !loading && (
                <p className="mt-1 text-sm text-gray-500">
                  Only patients with appointments in progress can receive prescriptions. Start an appointment from the Queue page first.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until *
              </label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis
              </label>
              <Input
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="Enter diagnosis"
              />
            </div>

            <div>
              <label htmlFor="refillsAllowed" className="block text-sm font-medium text-gray-700 mb-2">
                Refills Allowed
              </label>
              <Input
                id="refillsAllowed"
                type="number"
                min="0"
                value={formData.refillsAllowed}
                onChange={(e) => setFormData({ ...formData, refillsAllowed: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="additionalInstructions" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Instructions
            </label>
            <SimpleTextEditor
              value={formData.additionalInstructions}
              onChange={(value) => setFormData({ ...formData, additionalInstructions: value })}
              placeholder="Enter additional instructions for the patient"
              rows={4}
            />
          </div>

          <div className="border-t pt-6">
            <PrescriptionItemsTable
              items={items}
              drugs={drugs}
              labTests={labTests}
              onUpdate={updateItem}
              onUpdateItem={updateItemComplete}
              onRemove={removeItem}
              onAdd={addItem}
            />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={handleSaveDraft} isLoading={submitting}>
              Save as Draft
            </Button>
            <Button type="button" variant="outline" onClick={handlePrintPreview}>
              Print
            </Button>
            <Button type="submit" isLoading={submitting}>
              Create Prescription
            </Button>
          </div>
        </form>
      </Card>
        </div>

        {/* Right column: Patient Details Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
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
    </Layout>
    </>
  );
}
