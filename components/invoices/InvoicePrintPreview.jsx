'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/ui/Loader';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { generateInvoicePrintHTML } from './InvoicePrintTemplate';
import { logger } from '@/lib/utils/logger.js';
import { useEffect, useState } from 'react';

export function InvoicePrintPreview({ invoiceId, isOpen, onClose }) {
  const { t } = useI18n();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clinicSettings, setClinicSettings] = useState(null);

  useEffect(() => {
    if (isOpen && invoiceId) {
      // Ensure invoiceId is a string
      const id = typeof invoiceId === 'string' ? invoiceId : invoiceId?._id || invoiceId?.toString();
      if (id) {
        fetchInvoiceData(id);
      }
    } else {
      setInvoiceData(null);
      setError(null);
    }
  }, [isOpen, invoiceId]);

  const fetchInvoiceData = async (id = invoiceId) => {
    setLoading(true);
    setError(null);
    try {
      // Ensure id is a string
      const invoiceIdStr = typeof id === 'string' ? id : id?._id || id?.toString();
      if (!invoiceIdStr) {
        setError('Invalid invoice ID');
        setLoading(false);
        return;
      }
      
      logger.info('Fetching invoice:', invoiceIdStr);
      // Fetch invoice and clinic settings in parallel
      const [invoiceResponse, settingsResponse] = await Promise.all([
        apiClient.get(`/invoices/${invoiceIdStr}`),
        apiClient.get('/settings'),
      ]);

      logger.info('Invoice response:', invoiceResponse);
      logger.info('Settings response:', settingsResponse);

      if (invoiceResponse.success && invoiceResponse.data) {
        setInvoiceData(invoiceResponse.data);
        logger.info('Invoice data set:', invoiceResponse.data);
      } else {
        const errorMessage = invoiceResponse?.error?.message || invoiceResponse?.error || 'Failed to load invoice';
        setError(errorMessage);
        logger.error('Failed to fetch invoice:', invoiceResponse);
      }

      if (settingsResponse.success && settingsResponse.data) {
        setClinicSettings(settingsResponse.data);
      } else {
        // Settings failure is not critical, we can still show invoice
        logger.warn('Failed to fetch clinic settings:', settingsResponse);
      }
    } catch (error) {
      logger.error('Failed to fetch invoice data:', error);
      setError(error.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!invoiceData) return;

    const printHTML = generateInvoicePrintHTML({
      invoice: invoiceData,
      clinicSettings: clinicSettings || {},
      currency: clinicSettings?.settings?.currency || clinicSettings?.currency || 'USD',
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="print"
      title={`Invoice ${invoiceData?.invoiceNumber || ''}`}
    >
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader type='section' text={t('invoices.loadingInvoice')} />
          </div>
        ) : invoiceData ? (
          <>
            <iframe
              srcDoc={generateInvoicePrintHTML({
                invoice: invoiceData,
                clinicSettings: clinicSettings || {},
                currency: clinicSettings?.settings?.currency || clinicSettings?.currency || 'USD',
              })}
              className="w-full h-[600px] border border-neutral-300 rounded"
              title="Invoice Preview"
            />
            <div className="flex justify-end gap-4 mt-4">
              <Button
                variant='secondary'
                size='sm'
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                variant='primary'
                size='sm'
                onClick={handlePrint}
              >
                Print
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-status-error font-medium mb-2">
              Failed to load invoice
            </div>
            {error && (
              <div className="text-sm text-neutral-600">
                {error}
              </div>
            )}
            <Button
              variant='primary'
              size='sm'
              onClick={fetchInvoiceData}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

