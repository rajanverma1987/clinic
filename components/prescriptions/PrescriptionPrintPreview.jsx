'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { generatePrescriptionPrintHTML } from './PrescriptionPrintTemplate';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function PrescriptionPrintPreview({ prescriptionId, isOpen, onClose }) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [printHtml, setPrintHtml] = useState('');

  useEffect(() => {
    if (isOpen && prescriptionId) {
      loadPrescriptionData();
    } else {
      setPrintHtml('');
      setError('');
    }
  }, [isOpen, prescriptionId]);

  const loadPrescriptionData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch prescription
      const prescriptionResponse = await apiClient.get(`/prescriptions/${prescriptionId}`);
      if (!prescriptionResponse.success || !prescriptionResponse.data) {
        setError('Prescription not found');
        setLoading(false);
        return;
      }

      const prescription = prescriptionResponse.data;
      const patientId = prescription.patientId?._id || prescription.patientId;

      if (!patientId) {
        setError('Patient information not found');
        setLoading(false);
        return;
      }

      // Fetch patient data
      const patientResponse = await apiClient.get(`/patients/${patientId}`);
      let patient = null;
      if (patientResponse.success && patientResponse.data) {
        patient = patientResponse.data;
      } else {
        patient = prescription.patientId;
      }

      if (!patient) {
        setError('Patient not found');
        setLoading(false);
        return;
      }

      // Fetch clinic settings
      let clinicSettings = null;
      try {
        const settingsResponse = await apiClient.get('/settings');
        if (settingsResponse.success && settingsResponse.data) {
          clinicSettings = settingsResponse.data;
        }
      } catch (err) {
        console.error('Failed to fetch clinic settings:', err);
      }

      // Fetch clinical note if appointmentId exists
      let clinicalNote = null;
      const appointmentId = prescription.appointmentId?._id || prescription.appointmentId;
      if (appointmentId) {
        try {
          const noteResponse = await apiClient.get(`/clinical-notes?appointmentId=${appointmentId}&limit=1`);
          if (noteResponse.success && noteResponse.data) {
            const noteData = noteResponse.data?.data || noteResponse.data;
            if (Array.isArray(noteData) && noteData[0]) {
              clinicalNote = noteData[0];
            }
          }
        } catch (err) {
          console.error('Failed to fetch clinical note:', err);
        }
      }

      // Calculate patient age
      const age = patient.dateOfBirth 
        ? Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : undefined;

      // Format clinic address
      const clinicAddress = clinicSettings?.settings?.address 
        ? `${clinicSettings.settings.address.street || ''}, ${clinicSettings.settings.address.city || ''} - ${clinicSettings.settings.address.zipCode || ''}.`
        : '';

      // Format clinic timing
      const clinicTiming = clinicSettings?.settings?.clinicHours
        ? clinicSettings.settings.clinicHours
            .filter((h) => h.isOpen)
            .map((h) => `${h.day}: ${h.timeSlots?.[0]?.startTime || ''} - ${h.timeSlots?.[0]?.endTime || ''}`)
            .join(', ')
        : '';

      // Format visit date
      const visitDate = prescription.createdAt || new Date().toISOString();
      const visitTime = new Date(visitDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      // Prepare print data
      const printData = {
        clinicName: clinicSettings?.name || 'Clinic Name',
        clinicAddress: clinicAddress,
        clinicPhone: clinicSettings?.settings?.phone || '',
        clinicTiming: clinicTiming,
        doctorName: prescription.doctorId 
          ? `${prescription.doctorId.firstName || ''} ${prescription.doctorId.lastName || ''}`.trim()
          : `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim(),
        doctorQualification: '',
        doctorRegNo: '',
        doctorPhone: '',
        patientId: patient.patientId || patient._id,
        patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
        patientAge: age ? `${age} Y` : undefined,
        patientGender: patient.gender?.charAt(0).toUpperCase() || '',
        patientAddress: patient.address 
          ? `${patient.address.street || ''}, ${patient.address.city || ''}`.trim()
          : '',
        weight: clinicalNote?.vitalSigns?.weight ? `${clinicalNote.vitalSigns.weight} kg` : undefined,
        height: clinicalNote?.vitalSigns?.height ? `${clinicalNote.vitalSigns.height} cms` : undefined,
        bloodPressure: clinicalNote?.vitalSigns?.bloodPressure || undefined,
        referredBy: undefined,
        knownHistory: patient.medicalHistory ? [patient.medicalHistory] : [],
        visitDate: visitDate,
        visitTime: visitTime,
        chiefComplaints: clinicalNote?.soap?.subjective 
          ? clinicalNote.soap.subjective.split('\n').filter((s) => s.trim())
          : [],
        clinicalFindings: clinicalNote?.soap?.objective
          ? clinicalNote.soap.objective.split('\n').filter((s) => s.trim())
          : [],
        notes: clinicalNote?.soap?.plan || (prescription.additionalInstructions ? prescription.additionalInstructions : undefined),
        diagnosis: prescription.diagnosis 
          ? prescription.diagnosis.split(',').map((d) => d.trim())
          : [],
        procedures: prescription.items?.filter(i => i.itemType === 'procedure').map(i => i.procedureName || '') || [],
        items: (prescription.items || []).map(item => {
          const form = item.form?.toUpperCase() || '';
          const name = item.itemType === 'drug' 
            ? `${form === 'TABLET' ? 'TAB.' : form === 'CAPSULE' ? 'CAP.' : ''} ${item.drugName || ''}`.trim()
            : item.itemType === 'lab'
            ? item.labTestName || ''
            : item.itemType === 'procedure'
            ? item.procedureName || ''
            : item.itemName || '';
          
          const dosage = item.itemType === 'drug' && item.frequency
            ? `${item.quantity || 1} ${item.frequency}${item.takeBeforeMeal ? ' (Before Food)' : item.takeAfterMeal ? ' (After Food)' : item.takeWithFood ? ' (With Food)' : ''}`
            : '';
          
          const duration = item.itemType === 'drug' && item.duration
            ? `${item.duration} Days (Tot:${item.quantity || 1} ${form === 'TABLET' ? 'Tab' : form === 'CAPSULE' ? 'Cap' : 'Unit'})`
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
        investigations: prescription.items?.filter(i => i.itemType === 'lab').map(i => i.labTestName || '') || [],
        advice: prescription.additionalInstructions 
          ? (prescription.additionalInstructions.includes('<') 
              ? [prescription.additionalInstructions] // If HTML, pass as single item
              : prescription.additionalInstructions.split('\n').filter((a) => a.trim()))
          : [],
        followUp: prescription.validUntil 
          ? new Date(prescription.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : undefined,
        additionalInstructions: undefined,
      };

      const html = generatePrescriptionPrintHTML(printData);
      setPrintHtml(html);
    } catch (error) {
      console.error('Failed to load prescription data:', error);
      setError('Failed to load prescription data');
    } finally {
      setLoading(false);
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Print Preview"
      size="print"
    >
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {printHtml && !loading && (
          <>
            <div className="border rounded-lg overflow-hidden bg-white">
              <div 
                className="print-preview p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: printHtml }}
                style={{
                  maxHeight: '70vh',
                  overflowY: 'auto',
                }}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handlePrint}>
                Print
              </Button>
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

