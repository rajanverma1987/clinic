'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
}

interface Drug {
  _id: string;
  name: string;
  genericName?: string;
  form: string;
  strength?: string;
}

interface PrescriptionItem {
  drugId: string;
  drugName: string;
  frequency: string;
  duration: number;
  quantity: number;
  unit?: string;
  instructions?: string;
  takeWithFood?: boolean;
  allowSubstitution?: boolean;
}

export default function NewPrescriptionPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<PrescriptionItem[]>([
    {
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
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    clinicalNoteId: '',
    diagnosis: '',
    additionalInstructions: '',
    validUntil: '',
    refillsAllowed: 0,
  });

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchData();
    }
  }, [authLoading, currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch patients
      const patientsResponse = await apiClient.get<Patient[]>('/patients?limit=100');
      if (patientsResponse.success && patientsResponse.data) {
        setPatients(Array.isArray(patientsResponse.data) ? patientsResponse.data : []);
      }

      // Fetch drugs from inventory
      const drugsResponse = await apiClient.get<Drug[]>('/inventory/items?type=medication&limit=100');
      if (drugsResponse.success && drugsResponse.data) {
        setDrugs(Array.isArray(drugsResponse.data) ? drugsResponse.data : []);
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

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    
    // If drugId changed, update drugName
    if (field === 'drugId' && value) {
      const drug = drugs.find(d => d._id === value);
      if (drug) {
        updated[index].drugName = drug.name;
      }
    }
    
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Calculate validUntil if not provided (default to 30 days from now)
      const validUntil = formData.validUntil 
        ? new Date(formData.validUntil).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const prescriptionData = {
        patientId: formData.patientId,
        appointmentId: formData.appointmentId || undefined,
        clinicalNoteId: formData.clinicalNoteId || undefined,
        items: items.map(item => ({
          drugId: item.drugId,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
          unit: item.unit || undefined,
          instructions: item.instructions || undefined,
          takeWithFood: item.takeWithFood || false,
          allowSubstitution: item.allowSubstitution !== false,
        })),
        diagnosis: formData.diagnosis || undefined,
        additionalInstructions: formData.additionalInstructions || undefined,
        validUntil,
        refillsAllowed: formData.refillsAllowed || undefined,
      };

      const response = await apiClient.post('/prescriptions', prescriptionData);
      if (response.success) {
        router.push('/prescriptions');
      } else {
        setError(response.error?.message || 'Failed to create prescription');
      }
    } catch (error: any) {
      console.error('Failed to create prescription:', error);
      setError(error.message || 'Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
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
    <Layout>
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          ← {t('common.back')}
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{t('prescriptions.createPrescription')}</h1>
        <p className="text-gray-600 mt-2">{t('prescriptions.prescriptionList')}</p>
      </div>

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
              >
                <option value="">{t('common.select')} {t('appointments.patient').toLowerCase()}</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.patientId} - {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
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
            <textarea
              id="additionalInstructions"
              value={formData.additionalInstructions}
              onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter additional instructions for the patient"
            />
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Prescription Items</h2>
              <Button type="button" variant="secondary" onClick={addItem}>
                + Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Item {index + 1}</h3>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Drug *
                      </label>
                      <select
                        required
                        value={item.drugId}
                        onChange={(e) => updateItem(index, 'drugId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a drug</option>
                        {drugs.map((drug) => (
                          <option key={drug._id} value={drug._id}>
                            {drug.name} {drug.strength ? `(${drug.strength})` : ''} - {drug.form}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency *
                      </label>
                      <select
                        required
                        value={item.frequency}
                        onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="once daily">Once Daily</option>
                        <option value="twice daily">Twice Daily</option>
                        <option value="three times daily">Three Times Daily</option>
                        <option value="four times daily">Four Times Daily</option>
                        <option value="as needed">As Needed</option>
                        <option value="before meals">Before Meals</option>
                        <option value="after meals">After Meals</option>
                        <option value="with meals">With Meals</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (days) *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        required
                        value={item.duration}
                        onChange={(e) => updateItem(index, 'duration', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit
                      </label>
                      <Input
                        value={item.unit || ''}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        placeholder="e.g., tablets, ml, bottles"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.takeWithFood || false}
                          onChange={(e) => updateItem(index, 'takeWithFood', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Take with food</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.allowSubstitution !== false}
                          onChange={(e) => updateItem(index, 'allowSubstitution', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Allow generic substitution</span>
                      </label>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instructions
                      </label>
                      <textarea
                        value={item.instructions || ''}
                        onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Additional instructions for this medication"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Create Prescription
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}

