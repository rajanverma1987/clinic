'use client';

import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { getDiagnosisDisplayValue } from '@/lib/i18n/inventory-name-dictionary';
import { loadHtml2Canvas, loadJsPDF } from '@/lib/utils/dynamic-imports';
import { loadImageAsDataUrl } from '@/lib/utils/image-dataurl';
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
  const { t, locale } = useI18n();
  const localeCode = (locale || 'en').toString().slice(0, 2);
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
  }, [isOpen, formData, items, locale]);

  const generatePrintHtml = async () => {
    setLoading(true);
    setError('');

    try {
      const selectedPatient = patients.find((p) => p._id === formData.patientId);
      if (!selectedPatient) {
        setError(t('prescriptions.selectPatientFirst'));
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

      // Format clinic address: use settings.address (object) or main location from settings.locations
      let clinicAddress = '';
      if (clinicSettings?.settings?.address && typeof clinicSettings.settings.address === 'object') {
        const a = clinicSettings.settings.address;
        clinicAddress = [a.street, a.city, a.state, a.zipCode, a.country].filter(Boolean).join(', ');
      } else if (clinicSettings?.settings?.locations?.length) {
        const main =
          clinicSettings.settings.locations.find((loc) => loc.isMain) ||
          clinicSettings.settings.locations[0];
        if (main?.address) clinicAddress = main.address;
      }

      // Clinic phone: settings.phone or main location phone
      const clinicPhone =
        clinicSettings?.settings?.phone ||
        (clinicSettings?.settings?.locations?.length &&
          (clinicSettings.settings.locations.find((loc) => loc.isMain) ||
            clinicSettings.settings.locations[0])?.phone) ||
        '';

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
        clinicName: clinicSettings?.name || t('prescriptions.clinicNameFallback'),
        clinicLogoUrl: clinicSettings?.settings?.logo || '',
        clinicAddress: clinicAddress,
        clinicPhone: clinicPhone,
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
        diagnosis: formData.diagnosis
          ? formData.diagnosis.split(/[,;]+/).map((d) => getDiagnosisDisplayValue(d.trim(), localeCode)).filter(Boolean)
          : [],
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
                    ? ` (${t('prescriptions.printBeforeFood')})`
                    : item.takeAfterMeal
                      ? ` (${t('prescriptions.printAfterFood')})`
                      : item.takeWithFood
                        ? ` (${t('prescriptions.printWithFood')})`
                        : ''
                }`
              : '';

          const duration =
            item.itemType === 'drug' && item.duration
              ? `${item.duration} ${t('prescriptions.printDays')} (${t('prescriptions.printTot')}:${item.quantity || 1} ${
                  form === 'TABLET' ? t('prescriptions.printTab') : form === 'CAPSULE' ? t('prescriptions.printCap') : t('prescriptions.printUnit')
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

      const labels = {
        printDiagnosis: t('prescriptions.printDiagnosis'),
        printProceduresConducted: t('prescriptions.printProceduresConducted'),
        printMedicineName: t('prescriptions.printMedicineName'),
        printDosage: t('prescriptions.printDosage'),
        printDuration: t('prescriptions.printDuration'),
        printDays: t('prescriptions.printDays'),
        printTab: t('prescriptions.printTab'),
        printCap: t('prescriptions.printCap'),
        printUnit: t('prescriptions.printUnit'),
        printTot: t('prescriptions.printTot'),
        printInvestigations: t('prescriptions.printInvestigations'),
        printAdviceGiven: t('prescriptions.printAdviceGiven'),
        printFollowUp: t('prescriptions.printFollowUp'),
        printAdditionalInstructions: t('prescriptions.printAdditionalInstructions'),
        printValidUntilDisclaimer: t('prescriptions.printValidUntilDisclaimer'),
        printSignature: t('prescriptions.printSignature'),
        printKnownHistoryOf: t('prescriptions.printKnownHistoryOf'),
        printChiefComplaints: t('prescriptions.printChiefComplaints'),
        printClinicalFindings: t('prescriptions.printClinicalFindings'),
        printNotes: t('prescriptions.printNotes'),
        printDate: t('prescriptions.printDate'),
        printAddress: t('prescriptions.printAddress'),
        printWeightKg: t('prescriptions.printWeightKg'),
        printHeightCms: t('prescriptions.printHeightCms'),
        printBp: t('prescriptions.printBp'),
        printReferredBy: t('prescriptions.printReferredBy'),
        printTiming: t('prescriptions.printTiming'),
        printPh: t('prescriptions.printPh'),
      };
      const html = generatePrescriptionPrintHTML(printData, labels);
      setPrintHtml(html);
    } catch (error) {
      logger.error('Failed to generate print preview:', error);
      setError(t('prescriptions.failedToGeneratePrintPreview'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printHtml) return;
    setDownloadingPdf(true);
    let iframe = null;
    try {
      let htmlToUse = printHtml;
      const logoUrl = clinicSettings?.settings?.logo || '';
      const clinicName = clinicSettings?.name || 'Clinic Name';
      if (logoUrl) {
        const logoDataUrl = await loadImageAsDataUrl(logoUrl);
        if (logoDataUrl) {
          const escapedUrl = String(logoUrl).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
          htmlToUse = htmlToUse.replace(`src="${escapedUrl}"`, `src="${logoDataUrl}"`);
        } else {
          const safeName = String(clinicName)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
          htmlToUse = htmlToUse.replace(
            /<img[^>]*class="clinic-logo-img"[^>]*\/?>/i,
            `<div class="clinic-logo-text" style="font-size:14px;font-weight:bold;">${safeName}</div>`,
          );
        }
      }

      iframe = document.createElement('iframe');
      iframe.style.cssText =
        'position:absolute;left:-9999px;top:0;width:794px;height:1123px;border:0;background:#fff;';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(htmlToUse);
      iframeDoc.close();

      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 300)));

      const body = iframeDoc.body;
      if (!body) throw new Error('Iframe body not ready');

      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      if (iframe?.parentNode) document.body.removeChild(iframe);
      iframe = null;

      const imgData = canvas.toDataURL('image/png');
      const JsPDF = await loadJsPDF();
      const pdf = new JsPDF('p', 'mm', 'a4');
      const pageW = 190;
      const pageH = 277;
      const imgW = canvas.width;
      const imgH = canvas.height;
      const imgWmm = (imgW * 25.4) / 96;
      const imgHmm = (imgH * 25.4) / 96;
      const scale = Math.min(pageW / imgWmm, pageH / imgHmm);
      const w = imgWmm * scale;
      const h = imgHmm * scale;
      pdf.addImage(imgData, 'PNG', 10, 10, w, h);
      pdf.save(`prescription-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      logger.error('Failed to generate PDF:', err);
      if (iframe?.parentNode) document.body.removeChild(iframe);
    } finally {
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
            <div className='prescription-print-preview-wrapper border rounded-lg overflow-hidden bg-white'>
              <div
                className='print-preview p-4 bg-white'
                dangerouslySetInnerHTML={{ __html: printHtml }}
                style={{
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                }}
              />
            </div>

            <div className='flex justify-end gap-2 pt-4 border-t'>
              <Button variant='secondary' onClick={onClose}>
                {t('common.close')}
              </Button>
              <Button variant='secondary' onClick={handleDownloadPDF} disabled={downloadingPdf}>
                {downloadingPdf
                  ? t('common.loading')
                  : t('prescriptions.downloadPdf')}
              </Button>
              <Button onClick={handlePrint}>{t('prescriptions.print')}</Button>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        /* Force light theme for prescription print preview so it's readable in dark mode */
        .prescription-print-preview-wrapper {
          background: #ffffff !important;
          color: #000000 !important;
        }
        .prescription-print-preview-wrapper .print-preview {
          background: #ffffff !important;
          color: #000000 !important;
        }
        .print-preview {
          font-family: Arial, sans-serif;
          background: #ffffff !important;
          color: #000000 !important;
        }
        .print-preview * {
          max-width: 100%;
          color: inherit;
        }
        .print-preview body,
        .print-preview .prescription-container {
          background: #ffffff !important;
          color: #000000 !important;
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
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>
    </Modal>
  );
}
