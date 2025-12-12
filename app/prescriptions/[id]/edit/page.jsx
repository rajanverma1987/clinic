'use client';

import { Layout } from '@/components/layout/Layout';
import { PatientDetailsPanel } from '@/components/prescriptions/PatientDetailsPanel';
import { PrescriptionItemsTable } from '@/components/prescriptions/PrescriptionItemsTable.jsx';
import { PrescriptionPrintPreview } from '@/components/prescriptions/PrescriptionPrintPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { SimpleTextEditor } from '@/components/ui/SimpleTextEditor';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts.js';
import { apiClient } from '@/lib/api/client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function EditPrescriptionPage() {
  const router = useRouter();
  const params = useParams();
  const prescriptionId = params?.id;
  const { user: currentUser, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [patients, setPatients] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [clinicSettings, setClinicSettings] = useState(null);
  const [items, setItems] = useState([]);
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
    patientId: '',
    appointmentId: '',
    clinicalNoteId: '',
    diagnosis: '',
    additionalInstructions: '',
    validUntil: '',
    refillsAllowed: 0,
  });
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Keyboard shortcuts
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
    [router]
  );

  useKeyboardShortcuts(keyboardShortcuts);

  useEffect(() => {
    if (!authLoading && currentUser && prescriptionId) {
      // Fetch both in parallel - they're independent
      fetchData();
      fetchPrescription();
    }
  }, [authLoading, currentUser, prescriptionId]);

  // Sync items after drugs are loaded to ensure drugId matches
  // This ensures that when drugs load, any items with drugId are properly matched
  useEffect(() => {
    if (drugs.length > 0 && items.length > 0) {
      // Check if any item has a drugId that needs to be synced
      setItems((prevItems) => {
        let hasChanges = false;
        const updatedItems = prevItems.map((item) => {
          if (item.itemType === 'drug' && item.drugId) {
            const drugIdStr = String(item.drugId).trim();
            // Try to find the drug in the list by matching _id
            const drug = drugs.find((d) => {
              const drugId = String(d._id).trim();
              return drugId === drugIdStr;
            });

            if (drug) {
              // Ensure drugId is exactly matching the drug's _id (as string)
              const correctDrugId = String(drug._id).trim();
              if (item.drugId !== correctDrugId) {
                console.log('Syncing drugId:', {
                  old: item.drugId,
                  new: correctDrugId,
                  drugName: drug.name,
                });
                hasChanges = true;
                return {
                  ...item,
                  drugId: correctDrugId,
                  drugName: drug.name || item.drugName,
                  form: drug.form || item.form,
                  strength: drug.strength || item.strength,
                };
              }
            } else {
              console.warn('Drug not found in list:', {
                drugId: drugIdStr,
                availableIds: drugs.slice(0, 5).map((d) => String(d._id)),
              });
            }
          }
          return item;
        });

        // Only update if there were actual changes to prevent infinite loops
        return hasChanges ? updatedItems : prevItems;
      });
    }
  }, [drugs]); // Only re-run when drugs change

  const fetchPrescription = async () => {
    try {
      const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
      if (response.success && response.data) {
        const prescription = response.data;

        // Populate form data
        setFormData({
          patientId: prescription.patientId?._id || prescription.patientId || '',
          appointmentId: prescription.appointmentId?._id || prescription.appointmentId || '',
          clinicalNoteId: prescription.clinicalNoteId?._id || prescription.clinicalNoteId || '',
          diagnosis: prescription.diagnosis || '',
          additionalInstructions: prescription.additionalInstructions || '',
          validUntil: prescription.validUntil
            ? new Date(prescription.validUntil).toISOString().split('T')[0]
            : '',
          refillsAllowed: prescription.refillsAllowed || 0,
        });

        // Populate items
        if (prescription.items && Array.isArray(prescription.items)) {
          const mappedItems = prescription.items.map((item) => {
            // Extract drugId and ensure it's a string
            let drugIdValue = '';
            if (item.drugId) {
              if (typeof item.drugId === 'object' && item.drugId._id) {
                drugIdValue = String(item.drugId._id);
              } else if (typeof item.drugId === 'string') {
                drugIdValue = item.drugId.trim(); // Remove any whitespace
              } else {
                drugIdValue = String(item.drugId);
              }
            }

            console.log('Prescription item drugId:', {
              original: item.drugId,
              normalized: drugIdValue,
              type: typeof item.drugId,
              isObject: typeof item.drugId === 'object',
            });

            return {
              itemType: item.itemType || 'drug',
              drugId: drugIdValue,
              drugName: item.drugName || '',
              form: item.form || '',
              strength: item.strength || '',
              frequency: item.frequency || 'twice daily',
              duration: item.duration || 7,
              quantity: item.quantity || 1,
              unit: item.unit || 'tablets',
              instructions: item.instructions || '',
              takeWithFood: item.takeWithFood || false,
              allowSubstitution: item.allowSubstitution !== false,
              // Lab fields
              labTestCode: item.labTestCode || '',
              labTestName: item.labTestName || '',
              labInstructions: item.labInstructions || '',
              fastingRequired: item.fastingRequired || false,
              // Procedure fields
              procedureName: item.procedureName || '',
              procedureCode: item.procedureCode || '',
              procedureInstructions: item.procedureInstructions || '',
              // Other fields
              itemName: item.itemName || '',
              itemDescription: item.itemDescription || '',
            };
          });

          console.log('Mapped prescription items:', mappedItems);
          setItems(mappedItems);
        } else {
          // Default item if none exist
          setItems([
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
        }
      } else {
        setError('Prescription not found');
      }
    } catch (error) {
      console.error('Failed to fetch prescription:', error);
      setError('Failed to load prescription');
    }
  };

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

      // Fetch all patients (for edit, we show all patients)
      const allPatientsResponse = await apiClient.get('/patients?limit=1000');
      let allPatients = [];

      if (allPatientsResponse.success && allPatientsResponse.data) {
        allPatients = Array.isArray(allPatientsResponse.data)
          ? allPatientsResponse.data
          : allPatientsResponse.data?.data || [];
      }

      setPatients(allPatients);

      // Fetch drugs from inventory (medications)
      const drugsResponse = await apiClient.get('/inventory/items?type=medicine&limit=1000');
      if (drugsResponse.success && drugsResponse.data) {
        let drugsList = [];

        if (drugsResponse.data.data && Array.isArray(drugsResponse.data.data)) {
          drugsList = drugsResponse.data.data
            .filter((item) => item.type === 'medicine')
            .map((item) => ({
              _id: String(item._id).trim(), // Ensure _id is always a string and trimmed
              name: item.name || item.brandName || 'Unknown',
              genericName: item.genericName,
              form: item.form || '',
              strength: item.strength,
            }));
        } else if (Array.isArray(drugsResponse.data)) {
          drugsList = drugsResponse.data
            .filter((item) => item.type === 'medicine')
            .map((item) => ({
              _id: String(item._id).trim(), // Ensure _id is always a string and trimmed
              name: item.name || item.brandName || 'Unknown',
              genericName: item.genericName,
              form: item.form || '',
              strength: item.strength,
            }));
        }

        console.log('Fetched drugs list:', drugsList.length, 'drugs');
        console.log(
          'Sample drug IDs:',
          drugsList.slice(0, 3).map((d) => ({ id: d._id, name: d.name }))
        );
        setDrugs(drugsList);
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

      if (field === 'drugId' && value) {
        const drug = drugs.find((d) => String(d._id) === String(value));
        if (drug) {
          updated[index].drugName = drug.name;
          updated[index].form = drug.form || '';
          updated[index].strength = drug.strength || '';
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

    try {
      // Validate items before submission
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemType = item.itemType || 'drug';

        if (itemType === 'drug') {
          if (!item.drugId || (typeof item.drugId === 'string' && item.drugId.trim() === '')) {
            setError(`Item ${i + 1}: Please select a drug`);
            setSubmitting(false);
            return;
          }
        } else if (itemType === 'lab') {
          if (
            !item.labTestCode ||
            (typeof item.labTestCode === 'string' && item.labTestCode.trim() === '')
          ) {
            setError(`Item ${i + 1}: Please select a lab test`);
            setSubmitting(false);
            return;
          }
        } else if (itemType === 'procedure') {
          if (
            !item.procedureName ||
            (typeof item.procedureName === 'string' && item.procedureName.trim() === '')
          ) {
            setError(`Item ${i + 1}: Please enter a procedure name`);
            setSubmitting(false);
            return;
          }
        } else if (itemType === 'other') {
          if (
            !item.itemName ||
            (typeof item.itemName === 'string' && item.itemName.trim() === '')
          ) {
            setError(`Item ${i + 1}: Please enter an item name`);
            setSubmitting(false);
            return;
          }
        }
      }

      const validUntil = formData.validUntil
        ? new Date(formData.validUntil).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const prescriptionData = {
        items: items.map((item) => {
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
      };

      const response = await apiClient.put(`/prescriptions/${prescriptionId}`, prescriptionData);
      if (response.success) {
        router.push('/prescriptions');
      } else {
        setError(response.error?.message || 'Failed to update prescription');
      }
    } catch (error) {
      console.error('Failed to update prescription:', error);
      setError(error.message || 'Failed to update prescription');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  // Redirect if not authenticated (non-blocking)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Show empty state while redirecting
  if (!user) {
    return null;
  }

  if (loading) {
    return <Loader fullScreen size='lg' />;
  }

  return (
    <Layout>
      <div style={{ padding: '0 10px' }}>
        <div className='mb-6' style={{ paddingTop: '10px' }}>
          <button
            onClick={() => router.back()}
            className='flex items-center justify-center w-10 h-10 rounded-lg border-2 border-neutral-200 hover:border-primary-300 hover:bg-primary-50 text-neutral-600 hover:text-primary-600 transition-all duration-200 mb-4'
            aria-label={t('common.back')}
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>
          <h1 className='text-2xl font-bold text-neutral-900'>Edit Prescription</h1>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2'>
            <Card>
              <form onSubmit={handleSubmit} className='space-y-6' noValidate>
                {error && (
                  <div className='bg-status-error/10 border-l-4 border-status-error text-status-error px-4 py-3 rounded'>
                    {error}
                  </div>
                )}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label
                      htmlFor='patientId'
                      className='block text-sm font-medium text-neutral-700 mb-2'
                    >
                      {t('appointments.patient')} *
                    </label>
                    <select
                      id='patientId'
                      required
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                      disabled={patients.length === 0}
                    >
                      <option value=''>
                        {patients.length === 0
                          ? 'No patients available'
                          : `${t('common.select')} ${t('appointments.patient').toLowerCase()}`}
                      </option>
                      {patients.map((patient) => (
                        <option key={patient._id} value={patient._id}>
                          {patient.patientId} - {patient.firstName} {patient.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor='validUntil'
                      className='block text-sm font-medium text-neutral-700 mb-2'
                    >
                      Valid Until *
                    </label>
                    <Input
                      id='validUntil'
                      type='date'
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='diagnosis'
                      className='block text-sm font-medium text-neutral-700 mb-2'
                    >
                      Diagnosis
                    </label>
                    <Input
                      id='diagnosis'
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      placeholder='Enter diagnosis'
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='refillsAllowed'
                      className='block text-sm font-medium text-neutral-700 mb-2'
                    >
                      Refills Allowed
                    </label>
                    <Input
                      id='refillsAllowed'
                      type='number'
                      min='0'
                      value={formData.refillsAllowed}
                      onChange={(e) =>
                        setFormData({ ...formData, refillsAllowed: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor='additionalInstructions'
                    className='block text-sm font-medium text-neutral-700 mb-2'
                  >
                    Additional Instructions
                  </label>
                  <SimpleTextEditor
                    value={formData.additionalInstructions}
                    onChange={(value) =>
                      setFormData({ ...formData, additionalInstructions: value })
                    }
                    placeholder='Enter additional instructions for the patient'
                    rows={4}
                  />
                </div>

                <div className='border-t pt-6'>
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

                <div className='flex justify-end gap-4 pt-6 border-t'>
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
                    onClick={handlePrint}
                    disabled={submitting}
                  >
                    Print
                  </Button>
                  <Button type='submit' isLoading={submitting} disabled={submitting}>
                    Update Prescription
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <div className='lg:col-span-1'>
            <div className='sticky top-4'>
              <PatientDetailsPanel patientId={formData.patientId} />
            </div>
          </div>
        </div>

        <PrescriptionPrintPreview
          prescriptionId={prescriptionId}
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
        />
      </div>
    </Layout>
  );
}
