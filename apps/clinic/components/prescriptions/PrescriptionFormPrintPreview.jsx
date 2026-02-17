'use client';

import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { loadJsPDF } from '@/lib/utils/dynamic-imports';
import { logger } from '@/lib/utils/logger.js';
import { useEffect, useState } from 'react';
import { generatePrescriptionPrintHTML } from './PrescriptionPrintTemplate';

export function PrescriptionFormPrintPreview({
  isOpen,
  onClose,
  formData,
  items,
  patients,
  clinicSettings,
}) {
  const { user: currentUser } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState('');
  const [printHtml, setPrintHtml] = useState('');

  useEffect(() => {
    if (isOpen && formData && items) {
      generatePrintHtml();
    } else {
      setPrintHtml('');
      setError('');
    }
  }, [isOpen, formData, items]);

  const generatePrintHtml = async () => {
    setLoading(true);
    setError('');

    try {
      const selectedPatient = patients.find((p) => p._id === formData.patientId);
      if (!selectedPatient) {
        setError('Please select a patient first');
        setLoading(false);
        return;
      }

      // Calculate patient age
      const age = selectedPatient.dateOfBirth
        ? Math.floor(
            (new Date().getTime() - new Date(selectedPatient.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          )
        : undefined;

      // Format clinic address
      const clinicAddress = clinicSettings?.settings?.address
        ? `${clinicSettings.settings.address.street || ''}, ${
            clinicSettings.settings.address.city || ''
          } - ${clinicSettings.settings.address.zipCode || ''}.`
        : '';

      // Format clinic timing
      const clinicTiming = clinicSettings?.settings?.clinicHours
        ? clinicSettings.settings.clinicHours
            .filter((h) => h.isOpen)
            .map(
              (h) =>
                `${h.day}: ${h.timeSlots?.[0]?.startTime || ''} - ${
                  h.timeSlots?.[0]?.endTime || ''
                }`,
            )
            .join(', ')
        : '';

      // Get appointment for clinical notes
      let clinicalNote = null;
      if (formData.appointmentId) {
        try {
          const noteResponse = await apiClient.get(
            `/clinical-notes?appointmentId=${formData.appointmentId}&limit=1`,
          );
          if (noteResponse.success && noteResponse.data) {
            const noteData = noteResponse.data?.data || noteResponse.data;
            if (Array.isArray(noteData) && noteData[0]) {
              clinicalNote = noteData[0];
            }
          }
        } catch (err) {
          logger.error('Failed to fetch clinical note:', err);
        }
      }

      // Prepare print data
      const printData = {
        clinicName: clinicSettings?.name || 'Clinic Name',
        clinicAddress: clinicAddress,
        clinicPhone: clinicSettings?.settings?.phone || '',
        clinicTiming: clinicTiming,
        doctorName: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim(),
        doctorQualification: '',
        doctorRegNo: '',
        doctorPhone: '',
        patientId: selectedPatient.patientId,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        patientAge: age ? `${age} Y` : undefined,
        patientGender: selectedPatient.gender?.charAt(0).toUpperCase() || '',
        patientAddress: selectedPatient.address
          ? `${selectedPatient.address.street || ''}, ${selectedPatient.address.city || ''}`.trim()
          : '',
        weight: clinicalNote?.vitalSigns?.weight
          ? `${clinicalNote.vitalSigns.weight} kg`
          : undefined,
        height: clinicalNote?.vitalSigns?.height
          ? `${clinicalNote.vitalSigns.height} cms`
          : undefined,
        bloodPressure: clinicalNote?.vitalSigns?.bloodPressure || undefined,
        referredBy: undefined,
        knownHistory: selectedPatient.medicalHistory ? [selectedPatient.medicalHistory] : [],
        visitDate: new Date().toISOString(),
        visitTime: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        chiefComplaints: clinicalNote?.soap?.subjective
          ? clinicalNote.soap.subjective.split('\n').filter((s) => s.trim())
          : [],
        clinicalFindings: clinicalNote?.soap?.objective
          ? clinicalNote.soap.objective.split('\n').filter((s) => s.trim())
          : [],
        notes:
          clinicalNote?.soap?.plan ||
          (formData.additionalInstructions ? formData.additionalInstructions : undefined),
        diagnosis: formData.diagnosis ? formData.diagnosis.split(',').map((d) => d.trim()) : [],
        procedures: items
          .filter((i) => i.itemType === 'procedure')
          .map((i) => i.procedureName || ''),
        items: items.map((item) => {
          const form = item.form?.toUpperCase() || '';
          const name =
            item.itemType === 'drug'
              ? `${form === 'TABLET' ? 'TAB.' : form === 'CAPSULE' ? 'CAP.' : ''} ${
                  item.drugName || ''
                }`.trim()
              : item.itemType === 'lab'
                ? item.labTestName || ''
                : item.itemType === 'procedure'
                  ? item.procedureName || ''
                  : item.itemName || '';

          const dosage =
            item.itemType === 'drug' && item.frequency
              ? `${item.quantity || 1} ${item.frequency}${
                  item.takeBeforeMeal
                    ? ' (Before Food)'
                    : item.takeAfterMeal
                      ? ' (After Food)'
                      : item.takeWithFood
                        ? ' (With Food)'
                        : ''
                }`
              : '';

          const duration =
            item.itemType === 'drug' && item.duration
              ? `${item.duration} Days (Tot:${item.quantity || 1} ${
                  form === 'TABLET' ? 'Tab' : form === 'CAPSULE' ? 'Cap' : 'Unit'
                })`
              : '';

          return {
            itemType: item.itemType,
            name,
            dosage,
            frequency: item.frequency,
            duration,
            quantity: item.quantity?.toString(),
            instructions: item.instructions,
          };
        }),
        investigations: items.filter((i) => i.itemType === 'lab').map((i) => i.labTestName || ''),
        advice: formData.additionalInstructions
          ? formData.additionalInstructions.includes('<')
            ? [formData.additionalInstructions] // If HTML, pass as single item
            : formData.additionalInstructions.split('\n').filter((a) => a.trim())
          : [],
        followUp: formData.validUntil
          ? new Date(formData.validUntil).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : undefined,
        additionalInstructions: undefined,
      };

      const html = generatePrescriptionPrintHTML(printData);
      setPrintHtml(html);
    } catch (error) {
      logger.error('Failed to generate print preview:', error);
      setError('Failed to generate print preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printHtml) return;
    setDownloadingPdf(true);
    let tempDiv = null;
    try {
      const JsPDF = await loadJsPDF();
      const pdf = new JsPDF('p', 'mm', 'a4');
      tempDiv = document.createElement('div');
      tempDiv.innerHTML = printHtml;
      tempDiv.style.width = '210mm';
      tempDiv.style.padding = '10mm';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '11px';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      pdf.html(tempDiv, {
        x: 10,
        y: 10,
        width: 190,
        callback: (doc) => {
          if (tempDiv?.parentNode) document.body.removeChild(tempDiv);
          doc.save(`prescription-${new Date().toISOString().slice(0, 10)}.pdf`);
          setDownloadingPdf(false);
        },
      });
    } catch (err) {
      logger.error('Failed to generate PDF:', err);
      if (tempDiv?.parentNode) document.body.removeChild(tempDiv);
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';

    document.body.appendChild(printFrame);

    const printDoc = printFrame.contentWindow.document;
    printDoc.open();
    printDoc.write(printHtml);
    printDoc.close();

    printFrame.contentWindow.onload = () => {
      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        document.body.removeChild(printFrame);
      }, 250);
    };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('prescriptions.printPreview')} size='print'>
      <div className='space-y-4'>
        {loading && (
          <div className='flex items-center justify-center py-8'>
            <Loader type='section' text={t('common.loading')} />
          </div>
        )}

        {error && (
          <div className='bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded'>
            {error}
          </div>
        )}

        {printHtml && !loading && (
          <>
            <div className='border rounded-lg overflow-hidden bg-white'>
              <div
                className='print-preview p-4 bg-white'
                dangerouslySetInnerHTML={{ __html: printHtml }}
                style={{
                  maxHeight: '70vh',
                  overflowY: 'auto',
                }}
              />
            </div>

            <div className='flex justify-end gap-2 pt-4 border-t'>
              <Button variant='secondary' onClick={onClose}>
                Close
              </Button>
              <Button variant='secondary' onClick={handleDownloadPDF} disabled={downloadingPdf}>
                {downloadingPdf
                  ? t('common.loading')
                  : t('prescriptions.downloadPdf') || 'Download PDF'}
              </Button>
              <Button onClick={handlePrint}>{t('prescriptions.print') || 'Print'}</Button>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .print-preview {
          font-family: Arial, sans-serif;
        }
        .print-preview * {
          max-width: 100%;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .print-preview,
          .print-preview * {
            visibility: visible;
          }
          .print-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </Modal>
  );
}
