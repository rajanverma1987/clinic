'use client';

import { Layout } from '@/components/layout/Layout';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { isManagerPathLimitedWrite } from '@/lib/constants/route-security';
import { apiClient } from '@/lib/api/client';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NewInvoicePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();
  const managerLimitedWrite = isManagerPathLimitedWrite(pathname);
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
    invoiceDate: new Date().toISOString().split('T')[0], // Default to today
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
      setItems([
        {
          type: 'consultation',
          description: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          taxRate: 0,
        },
      ]);
      setFormData((prev) => ({ ...prev, appointmentId: '' }));
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
      logger.error('Failed to fetch data:', error);
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
          .sort(
            (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
          )[0];

        if (recentAppointment) {
          // Default consultation fee - $100 in-person, $150 telemedicine (can be configured in settings)
          const defaultConsultationFee = recentAppointment.isTelemedicine ? 150 : 100;

          invoiceItems.push({
            type: 'consultation',
            description: `${
              recentAppointment.isTelemedicine ? 'Video' : 'In-Person'
            } Consultation - ${new Date(recentAppointment.appointmentDate).toLocaleDateString()}`,
            quantity: 1,
            unitPrice: defaultConsultationFee,
            discount: 0,
            taxRate: 0,
            appointmentId: recentAppointment._id,
          });

          // Set appointment ID in form data
          setFormData((prev) => ({ ...prev, appointmentId: recentAppointment._id }));
        }
      }

      // Process prescriptions - get only the LATEST active/dispensed prescription
      if (prescriptionsResponse.success && prescriptionsResponse.data) {
        const prescriptionsData = Array.isArray(prescriptionsResponse.data)
          ? prescriptionsResponse.data
          : prescriptionsResponse.data.data || [];

        // Filter for active/dispensed prescriptions and get the most recent one
        const activePrescriptions = prescriptionsData.filter(
          (pres) => pres.status === 'active' || pres.status === 'dispensed'
        );

        // Sort by creation date (most recent first) and get only the latest prescription
        const latestPrescription = activePrescriptions.sort(
          (a, b) =>
            new Date(b.createdAt || b._id.getTimestamp()).getTime() -
            new Date(a.createdAt || a._id.getTimestamp()).getTime()
        )[0];

        // Process only the latest prescription
        if (latestPrescription) {
          if (latestPrescription.items && Array.isArray(latestPrescription.items)) {
            for (const item of latestPrescription.items) {
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
                        description: `${item.drugName || inventoryItem?.name || 'Medicine'}${
                          item.strength ? ` (${item.strength})` : ''
                        } - Qty: ${item.quantity || 1} ${item.unit || 'units'}`,
                        quantity: item.quantity || 1,
                        unitPrice: sellingPrice,
                        discount: 0,
                        taxRate: 0,
                        prescriptionId: latestPrescription._id,
                      });
                    }
                  }
                } catch (err) {
                  logger.warn(`Failed to fetch inventory item ${item.drugId}:`, err);
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
      logger.error('Failed to auto-populate invoice items:', error);
      // On error, show default consultation item
      setItems([
        {
          type: 'consultation',
          description: 'Consultation',
          quantity: 1,
          unitPrice: 100,
          discount: 0,
          taxRate: 0,
        },
      ]);
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
    const discountAmount = item.discount ? (subtotal * item.discount) / 100 : 0;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = item.taxRate ? (afterDiscount * item.taxRate) / 100 : 0;
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

    items.forEach((item) => {
      const calc = calculateItemTotal(item);
      subtotal += calc.subtotal;
      totalDiscount += calc.discountAmount;
      totalTax += calc.taxAmount;
    });

    // Apply invoice-level discount (convert to cents if fixed amount)
    const invoiceDiscount =
      formData.discountType === 'percentage'
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
      // The service will calculate total and totalWithTax, but we need to send them for validation
      // So we calculate them here in dollars, then service will recalculate in cents
      const itemsWithTotals = items.map((item) => {
        const itemCalc = calculateItemTotal(item);
        // Ensure taxAmount is 0 (not undefined) when tax is 0
        const taxAmount = itemCalc.taxAmount || 0;
        const discountAmount = itemCalc.discountAmount || 0;

        return {
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice, // Send in dollars - service will convert to cents via parseAmount
          discount: item.discount || undefined,
          discountAmount: discountAmount / 100, // Convert from cents to dollars for service
          taxRate: item.taxRate || 0, // Default to 0 if not set
          taxAmount: taxAmount / 100, // Convert from cents to dollars for service
          // Send totals in dollars - service will recalculate in cents
          total: itemCalc.afterDiscount / 100, // Total after discount, before tax (in dollars)
          totalWithTax: itemCalc.total / 100, // Total including tax (in dollars)
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
        invoiceDate: formData.invoiceDate
          ? new Date(formData.invoiceDate).toISOString()
          : new Date().toISOString(),
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
      logger.error('Failed to create invoice:', error);
      setError(error.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = calculateTotals();

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

  const labelClass =
    'block text-sm font-medium text-neutral-700 mb-1 leading-tight min-h-[1.25rem]';
  return (
    <Layout>
      <div style={{ padding: '0 10px' }}>
        <div className='mb-4 pt-2'>
          <BackButton className='mb-2' />
          <h1 className='text-2xl font-bold text-neutral-900'>{t('invoices.createInvoice')}</h1>
          <p className='text-neutral-600 mt-1 text-sm'>{t('invoices.invoiceList')}</p>
        </div>

        <Card className='p-4'>
          <form onSubmit={handleSubmit} className='space-y-3' noValidate>
            {error && (
              <div className='bg-status-error/10 border-l-4 border-status-error text-status-error px-3 py-2 rounded text-sm'>
                {error}
              </div>
            )}

            {/* Invoice details: 3-column grid, equal-height controls */}
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end'>
              <div>
                <label htmlFor='patientId' className={labelClass}>
                  {t('appointments.patient')} *
                </label>
                <select
                  id='patientId'
                  required
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className='form-control-height w-full px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                  disabled={patients.length === 0}
                >
                  <option value=''>
                    {patients.length === 0 ? t('patients.noPatientsFound') : t('patientSelector.selectPatient')}
                  </option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.patientId} - {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor='invoiceDate' className={labelClass}>
                  {t('invoices.invoiceDate')} *
                </label>
                <Input
                  id='invoiceDate'
                  type='date'
                  required
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  className='text-sm'
                />
              </div>
              <div>
                <label htmlFor='dueDate' className={labelClass}>
                  {t('invoices.dueDate')}
                </label>
                <Input
                  id='dueDate'
                  type='date'
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className='text-sm'
                />
              </div>
            </div>

            {/* Invoice items: equal-height inputs in table */}
            <div className='border-t border-neutral-200 pt-3'>
              <div className='flex items-center justify-between mb-2'>
                <h2 className='text-base font-semibold text-neutral-900'>
                  {t('invoices.invoiceItems')}
                </h2>
                <Button type='button' variant='secondary' size='sm' onClick={addItem}>
                  + {t('invoices.addItem')}
                </Button>
              </div>

              <div className='overflow-x-auto -mx-1'>
                <table className='w-full table-fixed divide-y divide-neutral-200 border border-neutral-200 rounded-lg text-sm'>
                  <colgroup>
                    <col style={{ width: '2rem' }} />
                    <col style={{ width: '7rem' }} />
                    <col style={{ minWidth: '8rem' }} />
                    <col style={{ width: '4.5rem' }} />
                    <col style={{ width: '5.5rem' }} />
                    <col style={{ width: '4.5rem' }} />
                    <col style={{ width: '4.5rem' }} />
                    <col style={{ width: '5.5rem' }} />
                    <col style={{ width: '5rem' }} />
                  </colgroup>
                  <thead className='bg-neutral-100'>
                    <tr>
                      <th className='px-2 py-1.5 text-left text-xs font-medium text-neutral-500 uppercase'>
                        #
                      </th>
                      <th className='px-2 py-1.5 text-left text-xs font-medium text-neutral-500 uppercase'>
                        {t('invoices.type')}
                      </th>
                      <th className='px-2 py-1.5 text-left text-xs font-medium text-neutral-500 uppercase'>
                        {t('invoices.description')}
                      </th>
                      <th className='px-2 py-1.5 text-center text-xs font-medium text-neutral-500 uppercase w-[4.5rem]'>
                        {t('invoices.quantity')}
                      </th>
                      <th className='px-2 py-1.5 text-center text-xs font-medium text-neutral-500 uppercase w-[5.5rem]'>
                        {t('invoices.unitPrice')}
                      </th>
                      <th className='px-2 py-1.5 text-center text-xs font-medium text-neutral-500 uppercase w-[4.5rem]'>
                        {t('invoices.discount')}
                      </th>
                      <th className='px-2 py-1.5 text-center text-xs font-medium text-neutral-500 uppercase w-[4.5rem]'>
                        {t('invoices.taxRate')}
                      </th>
                      <th className='px-2 py-1.5 text-right text-xs font-medium text-neutral-500 uppercase w-[5.5rem]'>
                        {t('invoices.total')}
                      </th>
                      <th className='px-2 py-1.5 text-left text-xs font-medium text-neutral-500 uppercase'>
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-neutral-200'>
                    {items.map((item, index) => (
                      <tr key={index} className='hover:bg-neutral-50'>
                        <td className='px-2 py-1.5 text-neutral-900 align-middle'>{index + 1}</td>
                        <td className='px-2 py-1.5 align-middle'>
                          <select
                            required
                            value={item.type}
                            onChange={(e) => updateItem(index, 'type', e.target.value)}
                            className='form-control-height input-compact w-full min-w-0 text-xs border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500'
                          >
                            <option value='consultation'>{t('invoices.typeConsultation')}</option>
                            <option value='procedure'>{t('invoices.typeProcedure')}</option>
                            <option value='medication'>{t('invoices.typeMedication')}</option>
                            <option value='lab_test'>{t('invoices.typeLabTest')}</option>
                            <option value='other'>{t('invoices.typeOther')}</option>
                          </select>
                        </td>
                        <td className='px-2 py-1.5 align-middle min-w-0'>
                          <Input
                            required
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder={t('invoices.itemDescriptionPlaceholder')}
                            className='input-compact text-xs w-full min-w-0'
                          />
                        </td>
                        <td className='px-2 py-1.5 align-middle text-center'>
                          <Input
                            type='number'
                            min='1'
                            required
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, 'quantity', parseInt(e.target.value) || 1)
                            }
                            className='input-compact text-xs w-full min-w-0 text-center'
                          />
                        </td>
                        <td className='px-2 py-1.5 align-middle text-center'>
                          <Input
                            type='number'
                            min='0'
                            step='0.01'
                            required
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className='input-compact text-xs w-full min-w-0 text-center'
                            disabled={managerLimitedWrite}
                          />
                        </td>
                        <td className='px-2 py-1.5 align-middle text-center'>
                          <Input
                            type='number'
                            min='0'
                            max='100'
                            value={item.discount || 0}
                            onChange={(e) =>
                              updateItem(index, 'discount', parseFloat(e.target.value) || 0)
                            }
                            className='input-compact text-xs w-full min-w-0 text-center'
                            disabled={managerLimitedWrite}
                          />
                        </td>
                        <td className='px-2 py-1.5 align-middle text-center'>
                          <Input
                            type='number'
                            min='0'
                            max='100'
                            value={item.taxRate || 0}
                            onChange={(e) =>
                              updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)
                            }
                            className='input-compact text-xs w-full min-w-0 text-center'
                            disabled={managerLimitedWrite}
                          />
                        </td>
                        <td className='px-2 py-1.5 text-neutral-900 font-medium align-middle whitespace-nowrap text-right'>
                          {formatCurrencyUtil(calculateItemTotal(item).total, currency, locale)}
                        </td>
                        <td className='px-2 py-1.5 align-middle'>
                          {items.length > 1 && (
                            <Button
                              type='button'
                              variant='secondary'
                              size='sm'
                              onClick={() => removeItem(index)}
                              className='text-status-error hover:text-status-error/80 text-xs py-1'
                            >
                              {t('common.remove')}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className='border-t border-neutral-200 pt-3'>
              <h2 className='text-base font-semibold text-neutral-900 mb-2'>
                {t('invoices.invoiceDiscount')}
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 items-end'>
                <div>
                  <label className={labelClass}>
                    {t('invoices.discountType')}
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className='form-control-height w-full px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                    disabled={managerLimitedWrite}
                  >
                    <option value='percentage'>{t('invoices.percentage')}</option>
                    <option value='fixed'>{t('invoices.fixedAmount')}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    {t('invoices.discountValue')}
                  </label>
                  <Input
                    type='number'
                    min='0'
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })
                    }
                    className='text-sm'
                    disabled={managerLimitedWrite}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {t('invoices.reason')}
                  </label>
                  <Input
                    value={formData.discountReason}
                    onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })}
                    placeholder={t('invoices.discountReasonPlaceholder')}
                    className='text-sm'
                    disabled={managerLimitedWrite}
                  />
                </div>
              </div>
            </div>

            <div className='border-t border-neutral-200 pt-3'>
              <h2 className='text-base font-semibold text-neutral-900 mb-2'>
                {t('invoices.summary')}
              </h2>
              <div className='flex justify-end'>
                <div className='bg-neutral-100 p-3 rounded-lg space-y-1.5 max-w-xs w-full sm:w-auto min-w-[12rem]'>
                <div className='flex justify-between text-sm'>
                  <span className='text-neutral-600'>{t('invoices.subtotal')}</span>
                  <span>{formatCurrencyUtil(totals.subtotal, currency, locale)}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-neutral-600'>{t('invoices.discount')}</span>
                  <span>-{formatCurrencyUtil(totals.invoiceDiscount, currency, locale)}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-neutral-600'>{t('invoices.tax')}</span>
                  <span>{formatCurrencyUtil(totals.totalTax, currency, locale)}</span>
                </div>
                <div className='flex justify-between font-semibold border-t border-neutral-200 pt-2 mt-2'>
                  <span>{t('invoices.total')}</span>
                  <span>{formatCurrencyUtil(totals.finalTotal, currency, locale)}</span>
                </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor='notes' className={labelClass}>
                {t('invoices.notes')}
              </label>
              <textarea
                id='notes'
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className='w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[var(--input-height)] resize-y'
                rows={2}
                placeholder={t('invoices.notesPlaceholder')}
              />
            </div>

            <div className='flex justify-end gap-3 pt-3 border-t border-neutral-200'>
              <Button
                type='button'
                variant='secondary'
                onClick={() => router.back()}
                disabled={submitting}
              >
                {t('common.cancel')}
              </Button>
              <Button type='submit' isLoading={submitting} disabled={submitting}>
                {t('invoices.createInvoice')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
