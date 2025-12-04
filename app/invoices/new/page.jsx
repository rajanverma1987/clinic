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

export default function NewInvoicePage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([
    {
      type: 'consultation',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 0,
    },
  ]);
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    discountType: 'percentage',
    discountValue: 0,
    discountReason: '',
    dueDate: '',
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchData();
    }
  }, [authLoading, currentUser]);

  // Auto-populate invoice items when patient is selected
  useEffect(() => {
    if (formData.patientId) {
      autoPopulateInvoiceItems(formData.patientId);
    } else {
      // Reset to default empty item when no patient selected
      setItems([{
        type: 'consultation',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxRate: 0,
      }]);
      setFormData(prev => ({ ...prev, appointmentId: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.patientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all patients - invoices can be for consultations, prescriptions, labs, etc.
      const allPatientsResponse = await apiClient.get('/patients?limit=1000');
      let allPatients = [];
      
      if (allPatientsResponse.success && allPatientsResponse.data) {
        allPatients = Array.isArray(allPatientsResponse.data) 
          ? allPatientsResponse.data 
          : allPatientsResponse.data.data || [];
      }

      setPatients(allPatients);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-populate invoice items based on patient's appointments, prescriptions, and lab orders
  const autoPopulateInvoiceItems = async (patientId) => {
    try {
      const invoiceItems = [];

      // Fetch completed/in_progress appointments for consultation fees (in parallel)
      const [appointmentsResponse, prescriptionsResponse] = await Promise.all([
        apiClient.get(`/appointments?patientId=${patientId}&limit=100`),
        apiClient.get(`/prescriptions?patientId=${patientId}&limit=100`),
      ]);
      
      // Process appointments - get most recent completed/in_progress appointment
      if (appointmentsResponse.success && appointmentsResponse.data) {
        const appointmentsData = Array.isArray(appointmentsResponse.data)
          ? appointmentsResponse.data
          : appointmentsResponse.data.data || [];

        // Filter for completed/in_progress appointments and get the most recent one
        const recentAppointment = appointmentsData
          .filter((apt) => apt.status === 'completed' || apt.status === 'in_progress')
          .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())[0];

        if (recentAppointment) {
          // Default consultation fee - $100 in-person, $150 telemedicine (can be configured in settings)
          const defaultConsultationFee = recentAppointment.isTelemedicine ? 150 : 100;
          
          invoiceItems.push({
            type: 'consultation',
            description: `${recentAppointment.isTelemedicine ? 'Video' : 'In-Person'} Consultation - ${new Date(recentAppointment.appointmentDate).toLocaleDateString()}`,
            quantity: 1,
            unitPrice: defaultConsultationFee,
            discount: 0,
            taxRate: 0,
            appointmentId: recentAppointment._id,
          });

          // Set appointment ID in form data
          setFormData(prev => ({ ...prev, appointmentId: recentAppointment._id }));
        }
      }

      // Process prescriptions - get active/dispensed prescriptions
      if (prescriptionsResponse.success && prescriptionsResponse.data) {
        const prescriptionsData = Array.isArray(prescriptionsResponse.data)
          ? prescriptionsResponse.data
          : prescriptionsResponse.data.data || [];

        // Filter for active/dispensed prescriptions
        const activePrescriptions = prescriptionsData.filter(
          (pres) => pres.status === 'active' || pres.status === 'dispensed'
        );

        // Process each prescription item
        for (const pres of activePrescriptions) {
          if (pres.items && Array.isArray(pres.items)) {
            for (const item of pres.items) {
              if (item.drugId) {
                try {
                  // Fetch inventory item to get price
                  const inventoryResponse = await apiClient.get(`/inventory/items/${item.drugId}`);
                  
                  if (inventoryResponse.success && inventoryResponse.data) {
                    const inventoryItem = Array.isArray(inventoryResponse.data)
                      ? inventoryResponse.data[0]
                      : inventoryResponse.data.data || inventoryResponse.data;
                    
                    const sellingPrice = inventoryItem?.sellingPrice 
                      ? inventoryItem.sellingPrice / 100 // Convert from minor units (cents) to dollars
                      : 0;

                    if (sellingPrice > 0) {
                      invoiceItems.push({
                        type: 'medication',
                        description: `${item.drugName || inventoryItem?.name || 'Medicine'}${item.strength ? ` (${item.strength})` : ''} - Qty: ${item.quantity || 1} ${item.unit || 'units'}`,
                        quantity: item.quantity || 1,
                        unitPrice: sellingPrice,
                        discount: 0,
                        taxRate: 0,
                        prescriptionId: pres._id,
                      });
                    }
                  }
                } catch (err) {
                  console.warn(`Failed to fetch inventory item ${item.drugId}:`, err);
                  // Continue with other items
                }
              }
            }
          }
        }
      }

      // If no items found, show a default consultation item that user can edit
      if (invoiceItems.length === 0) {
        invoiceItems.push({
          type: 'consultation',
          description: 'Consultation',
          quantity: 1,
          unitPrice: 100, // Default consultation fee
          discount: 0,
          taxRate: 0,
        });
      }

      setItems(invoiceItems);
    } catch (error) {
      console.error('Failed to auto-populate invoice items:', error);
      // On error, show default consultation item
      setItems([{
        type: 'consultation',
        description: 'Consultation',
        quantity: 1,
        unitPrice: 100,
        discount: 0,
        taxRate: 0,
      }]);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        type: 'consultation',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxRate: 0,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculateItemTotal = (item) => {
    // unitPrice is in dollars, convert to cents for calculation
    const unitPriceCents = item.unitPrice * 100;
    const subtotal = item.quantity * unitPriceCents;
    const discountAmount = item.discount 
      ? (subtotal * item.discount) / 100 
      : 0;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = item.taxRate 
      ? (afterDiscount * item.taxRate) / 100 
      : 0;
    return {
      subtotal,
      discountAmount,
      afterDiscount,
      taxAmount,
      total: afterDiscount + taxAmount,
    };
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach(item => {
      const calc = calculateItemTotal(item);
      subtotal += calc.subtotal;
      totalDiscount += calc.discountAmount;
      totalTax += calc.taxAmount;
    });

    // Apply invoice-level discount (convert to cents if fixed amount)
    const invoiceDiscount = formData.discountType === 'percentage'
      ? (subtotal * formData.discountValue) / 100
      : formData.discountValue * 100; // Convert dollars to cents
    
    const finalSubtotal = subtotal - invoiceDiscount;
    const finalTotal = finalSubtotal + totalTax;

    return {
      subtotal,
      invoiceDiscount,
      totalDiscount: totalDiscount + invoiceDiscount,
      totalTax,
      finalTotal,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const invoiceData = {
        patientId: formData.patientId,
        appointmentId: formData.appointmentId || undefined,
        items: items.map(item => ({
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitPrice: Math.round(item.unitPrice * 100), // Convert to minor units
          discount: item.discount || undefined,
          taxRate: item.taxRate || undefined,
          appointmentId: item.appointmentId || undefined,
          prescriptionId: item.prescriptionId || undefined,
        })),
        discountType: formData.discountType,
        discountValue: formData.discountValue || undefined,
        discountReason: formData.discountReason || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        notes: formData.notes || undefined,
      };

      const response = await apiClient.post('/invoices', invoiceData);
      if (response.success) {
        router.push('/invoices');
      } else {
        setError(response.error?.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
      setError(error.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = calculateTotals();

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
        <h1 className="text-3xl font-bold text-gray-900">{t('invoices.createInvoice')}</h1>
        <p className="text-gray-600 mt-2">{t('invoices.invoiceList')}</p>
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
                Patient *
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
                    ? 'No patients available' 
                    : 'Select a patient'
                  }
                </option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.patientId} - {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Invoice Items</h2>
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
                        Type *
                      </label>
                      <select
                        required
                        value={item.type}
                        onChange={(e) => updateItem(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="consultation">Consultation</option>
                        <option value="procedure">Procedure</option>
                        <option value="medication">Medication</option>
                        <option value="lab_test">Lab Test</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <Input
                        required
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Item description"
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
                        Unit Price *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount (%)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount || 0}
                        onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Rate (%)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.taxRate || 0}
                        onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between text-sm">
                      <span>Item Total:</span>
                      <span className="font-medium">
                        ${(calculateItemTotal(item).total / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Invoice Discount</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <Input
                  value={formData.discountReason}
                  onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })}
                  placeholder="Discount reason"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${(totals.subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-${(totals.invoiceDiscount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${(totals.totalTax / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${(totals.finalTotal / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional notes"
            />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Create Invoice
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}

