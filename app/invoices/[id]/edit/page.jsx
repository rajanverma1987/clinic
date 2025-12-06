'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id;
  const { user: currentUser, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    discountType: 'percentage',
    discountValue: 0,
    discountReason: '',
    dueDate: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && currentUser && invoiceId) {
      fetchData();
      fetchInvoice();
    }
  }, [authLoading, currentUser, invoiceId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all patients
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

  const fetchInvoice = async () => {
    try {
      const response = await apiClient.get(`/invoices/${invoiceId}`);
      if (response.success && response.data) {
        const invoice = response.data;
        
        // Check if invoice is draft
        if (invoice.status !== 'draft') {
          setError('Only draft invoices can be edited');
          return;
        }

        // Populate form data
        setFormData({
          patientId: invoice.patientId?._id || invoice.patientId || '',
          appointmentId: invoice.appointmentId?._id || invoice.appointmentId || '',
          discountType: invoice.discountType || 'percentage',
          discountValue: invoice.discountValue ? invoice.discountValue / 100 : 0, // Convert from cents to dollars
          discountReason: invoice.discountReason || '',
          dueDate: invoice.dueDate 
            ? new Date(invoice.dueDate).toISOString().split('T')[0]
            : '',
          invoiceDate: invoice.invoiceDate 
            ? new Date(invoice.invoiceDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          notes: invoice.notes || '',
        });

        // Populate items - convert amounts from cents to dollars
        if (invoice.items && Array.isArray(invoice.items)) {
          setItems(invoice.items.map(item => ({
            type: item.type || 'consultation',
            description: item.description || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice ? item.unitPrice / 100 : 0, // Convert from cents to dollars
            discount: item.discount || 0,
            taxRate: item.taxRate || 0,
            appointmentId: item.appointmentId?._id || item.appointmentId || undefined,
            prescriptionId: item.prescriptionId?._id || item.prescriptionId || undefined,
          })));
        }
      } else {
        setError('Invoice not found');
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      setError('Failed to load invoice');
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
      // Prepare items for submission
      // Note: Send amounts in dollars - the service will convert to cents using parseAmount
      const itemsWithTotals = items.map(item => {
        const itemCalc = calculateItemTotal(item);
        const taxAmount = itemCalc.taxAmount || 0;
        const discountAmount = itemCalc.discountAmount || 0;
        
        return {
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice, // Send in dollars - service will convert to cents
          discount: item.discount || undefined,
          discountAmount: discountAmount / 100, // Convert from cents to dollars
          taxRate: item.taxRate || 0,
          taxAmount: taxAmount / 100, // Convert from cents to dollars
          total: itemCalc.afterDiscount / 100, // Convert from cents to dollars
          totalWithTax: itemCalc.total / 100, // Convert from cents to dollars
          appointmentId: item.appointmentId || undefined,
          prescriptionId: item.prescriptionId || undefined,
        };
      });

      const invoiceData = {
        patientId: formData.patientId,
        appointmentId: formData.appointmentId || undefined,
        items: itemsWithTotals,
        discountType: formData.discountType,
        discountValue: formData.discountValue || undefined,
        discountReason: formData.discountReason || undefined,
        invoiceDate: formData.invoiceDate ? new Date(formData.invoiceDate).toISOString() : new Date().toISOString(),
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        notes: formData.notes || undefined,
      };

      const response = await apiClient.put(`/invoices/${invoiceId}`, invoiceData);
      if (response.success) {
        router.push('/invoices');
      } else {
        setError(response.error?.message || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Failed to update invoice:', error);
      setError(error.message || 'Failed to update invoice');
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
        <h1 className="text-3xl font-bold text-gray-900">Edit Invoice</h1>
        <p className="text-gray-600 mt-2">Update invoice details</p>
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
              <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date *
              </label>
              <Input
                id="invoiceDate"
                type="date"
                required
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              />
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

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount (%)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax Rate (%)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          required
                          value={item.type}
                          onChange={(e) => updateItem(index, 'type', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="consultation">Consultation</option>
                          <option value="procedure">Procedure</option>
                          <option value="medication">Medication</option>
                          <option value="lab_test">Lab Test</option>
                          <option value="other">Other</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Input
                          required
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                          className="text-xs w-full"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="text-xs w-20"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="text-xs w-24"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount || 0}
                          onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="text-xs w-20"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.taxRate || 0}
                          onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="text-xs w-20"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrencyUtil(calculateItemTotal(item).total, currency, locale)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700 text-xs"
                          >
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <span>{formatCurrencyUtil(totals.subtotal, currency, locale)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-{formatCurrencyUtil(totals.invoiceDiscount, currency, locale)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrencyUtil(totals.totalTax, currency, locale)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrencyUtil(totals.finalTotal, currency, locale)}</span>
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
              Update Invoice
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}

