/**
 * GDPR Compliance Service
 * Handles GDPR requirements: right to access, rectification, erasure, portability, and object
 * Based on NEW-PLANS.md requirements
 */

import connectDB from '@/lib/db/connection.js';
import Patient from '@/models/Patient.js';
import Appointment from '@/models/Appointment.js';
import Prescription from '@/models/Prescription.js';
import ClinicalNote from '@/models/ClinicalNote.js';
import Invoice from '@/models/Invoice.js';
import LabOrder from '@/models/LabOrder.js';
import LabResult from '@/models/LabResult.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

/**
 * Export all patient data (Right to Data Portability)
 */
export async function exportPatientData(patientId, tenantId, userId) {
  await connectDB();

  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: patientId,
      deletedAt: null,
    })
  ).lean();

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Collect all related data
  const [appointments, prescriptions, clinicalNotes, invoices, labOrders, labResults] = await Promise.all([
    Appointment.find(withTenant(tenantId, { patientId, deletedAt: null })).lean(),
    Prescription.find(withTenant(tenantId, { patientId, deletedAt: null })).lean(),
    ClinicalNote.find(withTenant(tenantId, { patientId, deletedAt: null })).lean(),
    Invoice.find(withTenant(tenantId, { patientId, deletedAt: null })).lean(),
    LabOrder.find(withTenant(tenantId, { patientId })).lean(),
    LabResult.find(withTenant(tenantId, { patientId })).lean(),
  ]);

  const exportData = {
    patient: {
      demographics: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
      },
      contact: {
        email: patient.email,
        phone: patient.phone,
        address: patient.address,
      },
      identifiers: {
        patientId: patient.patientId,
      },
      // Note: PHI fields (medicalHistory, allergies, etc.) are encrypted
      // They would need to be decrypted for export if required
    },
    appointments: appointments.map((apt) => ({
      appointmentNumber: apt.appointmentNumber,
      appointmentDate: apt.appointmentDate,
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
      type: apt.type,
      doctorId: apt.doctorId,
    })),
    prescriptions: prescriptions.map((pres) => ({
      prescriptionNumber: pres.prescriptionNumber,
      status: pres.status,
      validFrom: pres.validFrom,
      validUntil: pres.validUntil,
      items: pres.items.map((item) => ({
        drugName: item.drugName,
        quantity: item.quantity,
        frequency: item.frequency,
        duration: item.duration,
      })),
    })),
    clinicalNotes: clinicalNotes.map((note) => ({
      type: note.type,
      createdAt: note.createdAt,
      // Note: Content is encrypted, would need decryption
    })),
    invoices: invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      totalAmount: inv.totalAmount,
      status: inv.status,
    })),
    labOrders: labOrders.map((order) => ({
      orderNumber: order.orderNumber,
      orderedAt: order.orderedAt,
      status: order.status,
    })),
    labResults: labResults.map((result) => ({
      reportedAt: result.reportedAt,
      status: result.status,
    })),
    exportDate: new Date().toISOString(),
    exportedBy: userId,
  };

  // Audit log
  await AuditLogger.auditWrite(
    'patient',
    patientId,
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { action: 'gdpr_data_export' }
  );

  return exportData;
}

/**
 * Anonymize patient data for analytics (Right to Object)
 * Removes all identifying information
 */
export async function anonymizePatientData(patientId, tenantId, userId) {
  await connectDB();

  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: patientId,
      deletedAt: null,
    })
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Anonymize patient record
  const anonymizedData = {
    firstName: 'ANONYMIZED',
    lastName: 'ANONYMIZED',
    email: null,
    phone: null,
    address: null,
    nationalId: null,
    medicalHistory: null,
    allergies: null,
    currentMedications: null,
    emergencyContact: null,
    notes: 'Data anonymized per GDPR request',
  };

  await Patient.findByIdAndUpdate(patientId, {
    $set: anonymizedData,
    $unset: {
      email: '',
      phone: '',
      'address.street': '',
      'address.city': '',
      'address.state': '',
      'address.zipCode': '',
      'address.country': '',
      nationalId: '',
      medicalHistory: '',
      allergies: '',
      currentMedications: '',
      'emergencyContact.name': '',
      'emergencyContact.phone': '',
      'emergencyContact.email': '',
    },
  });

  // Audit log
  await AuditLogger.auditWrite(
    'patient',
    patientId,
    userId,
    tenantId,
    AuditAction.UPDATE,
    undefined,
    { action: 'gdpr_anonymization' }
  );

  return { success: true, message: 'Patient data anonymized' };
}

/**
 * Delete patient data (Right to Erasure)
 * Soft delete with retention period consideration
 */
export async function deletePatientData(patientId, tenantId, userId, reason) {
  await connectDB();

  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: patientId,
      deletedAt: null,
    })
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Check if data can be deleted (consider legal retention requirements)
  // In some jurisdictions, medical records must be retained for a period
  const retentionPeriod = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years
  const patientAge = new Date() - new Date(patient.createdAt);
  
  if (patientAge < retentionPeriod) {
    // Soft delete - mark as deleted but retain for legal requirements
    patient.deletedAt = new Date();
    patient.status = 'inactive';
    await patient.save();

    // Audit log
    await AuditLogger.auditWrite(
      'patient',
      patientId,
      userId,
      tenantId,
      AuditAction.DELETE,
      undefined,
      { action: 'gdpr_soft_delete', reason, retentionPeriod: '7 years' }
    );

    return {
      success: true,
      message: 'Patient data marked for deletion (retained for legal requirements)',
      deletedAt: patient.deletedAt,
    };
  }

  // Hard delete if retention period has passed
  // Note: In production, this should be done carefully with backups
  await Patient.findByIdAndDelete(patientId);

  // Audit log
  await AuditLogger.auditWrite(
    'patient',
    patientId,
    userId,
    tenantId,
    AuditAction.DELETE,
    undefined,
    { action: 'gdpr_hard_delete', reason }
  );

  return {
    success: true,
    message: 'Patient data permanently deleted',
  };
}

/**
 * Rectify patient data (Right to Rectification)
 */
export async function rectifyPatientData(patientId, corrections, tenantId, userId) {
  await connectDB();

  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: patientId,
      deletedAt: null,
    })
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  const before = patient.toObject();

  // Apply corrections
  const allowedFields = [
    'firstName', 'lastName', 'email', 'phone', 'address',
    'dateOfBirth', 'gender', 'bloodGroup', 'alternatePhone',
  ];

  const updateData = {};
  for (const [field, value] of Object.entries(corrections)) {
    if (allowedFields.includes(field)) {
      updateData[field] = value;
    }
  }

  const updated = await Patient.findByIdAndUpdate(
    patientId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  // Audit log
  await AuditLogger.auditWrite(
    'patient',
    patientId,
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: updated.toObject() },
    { action: 'gdpr_rectification', corrections }
  );

  return updated;
}
