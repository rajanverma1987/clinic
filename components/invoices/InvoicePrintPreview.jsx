'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { Modal } from '@/components/ui/Modal';
import { generateInvoicePrintHTML } from './InvoicePrintTemplate';

export function InvoicePrintPreview({ invoiceId, isOpen, onClose }) {
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
      
      console.log('Fetching invoice:', invoiceIdStr);
      // Fetch invoice and clinic settings in parallel
      const [invoiceResponse, settingsResponse] = await Promise.all([
        apiClient.get(`/invoices/${invoiceIdStr}`),
        apiClient.get('/settings'),
      ]);

      console.log('Invoice response:', invoiceResponse);
      console.log('Settings response:', settingsResponse);

      if (invoiceResponse.success && invoiceResponse.data) {
        setInvoiceData(invoiceResponse.data);
        console.log('Invoice data set:', invoiceResponse.data);
      } else {
        const errorMessage = invoiceResponse?.error?.message || invoiceResponse?.error || 'Failed to load invoice';
        setError(errorMessage);
        console.error('Failed to fetch invoice:', invoiceResponse);
      }

      if (settingsResponse.success && settingsResponse.data) {
        setClinicSettings(settingsResponse.data);
      } else {
        // Settings failure is not critical, we can still show invoice
        console.warn('Failed to fetch clinic settings:', settingsResponse);
      }
    } catch (error) {
      console.error('Failed to fetch invoice data:', error);
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
            <div className="text-gray-500">Loading invoice...</div>
          </div>
        ) : invoiceData ? (
          <>
            <iframe
              srcDoc={generateInvoicePrintHTML({
                invoice: invoiceData,
                clinicSettings: clinicSettings || {},
                currency: clinicSettings?.settings?.currency || clinicSettings?.currency || 'USD',
              })}
              className="w-full h-[600px] border border-gray-300 rounded"
              title="Invoice Preview"
            />
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Print
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-red-600 font-medium mb-2">
              Failed to load invoice
            </div>
            {error && (
              <div className="text-sm text-gray-600">
                {error}
              </div>
            )}
            <button
              onClick={fetchInvoiceData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

