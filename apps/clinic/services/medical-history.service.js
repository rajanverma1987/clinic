/**
 * Medical History service
 * Handles patient medical history management
 */

import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import Patient from '@/models/Patient.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

/**
 * Add medical history condition to patient
 */
export async function addMedicalHistoryCondition(patientId, conditionData, tenantId, userId) {
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

  // Parse existing medical history
  let medicalHistory = [];
  if (patient.medicalHistory) {
    try {
      // Try to parse as JSON (if stored as structured data)
      if (typeof patient.medicalHistory === 'string' && patient.medicalHistory.startsWith('[')) {
        medicalHistory = JSON.parse(patient.medicalHistory);
      } else if (Array.isArray(patient.medicalHistory)) {
        medicalHistory = patient.medicalHistory;
      } else {
        // If it's a plain string, convert to array with single entry
        medicalHistory = [
          {
            condition: patient.medicalHistory,
            diagnosed_date: new Date(),
            status: 'active',
            notes: '',
          },
        ];
      }
    } catch (e) {
      // If parsing fails, create new array
      medicalHistory = [
        {
          condition: patient.medicalHistory,
          diagnosed_date: new Date(),
          status: 'active',
          notes: '',
        },
      ];
    }
  }

  // Add new condition
  const newCondition = {
    condition: conditionData.condition,
    diagnosed_date: conditionData.diagnosed_date
      ? new Date(conditionData.diagnosed_date)
      : new Date(),
    status: conditionData.status || 'active',
    notes: conditionData.notes || '',
  };

  medicalHistory.push(newCondition);

  // Update patient
  patient.medicalHistory = JSON.stringify(medicalHistory);
  await patient.save();

  // Audit log
  await AuditLogger.auditWrite(
    'medical_history',
    patient._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE,
    undefined,
    { action: 'add_condition', condition: newCondition }
  );

  return newCondition;
}

/**
 * Update medical history condition
 */
export async function updateMedicalHistoryCondition(
  patientId,
  conditionIndex,
  conditionData,
  tenantId,
  userId
) {
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

  // Parse existing medical history
  let medicalHistory = [];
  if (patient.medicalHistory) {
    try {
      if (typeof patient.medicalHistory === 'string' && patient.medicalHistory.startsWith('[')) {
        medicalHistory = JSON.parse(patient.medicalHistory);
      } else if (Array.isArray(patient.medicalHistory)) {
        medicalHistory = patient.medicalHistory;
      }
    } catch (e) {
      throw new Error('Invalid medical history format');
    }
  }

  if (!medicalHistory[conditionIndex]) {
    throw new Error('Condition not found');
  }

  const before = { ...medicalHistory[conditionIndex] };

  // Update condition
  if (conditionData.condition !== undefined) {
    medicalHistory[conditionIndex].condition = conditionData.condition;
  }
  if (conditionData.diagnosed_date !== undefined) {
    medicalHistory[conditionIndex].diagnosed_date = new Date(conditionData.diagnosed_date);
  }
  if (conditionData.status !== undefined) {
    medicalHistory[conditionIndex].status = conditionData.status;
  }
  if (conditionData.notes !== undefined) {
    medicalHistory[conditionIndex].notes = conditionData.notes;
  }

  // Update patient
  patient.medicalHistory = JSON.stringify(medicalHistory);
  await patient.save();

  // Audit log
  await AuditLogger.auditWrite(
    'medical_history',
    patient._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: medicalHistory[conditionIndex] },
    { action: 'update_condition', conditionIndex }
  );

  return medicalHistory[conditionIndex];
}

/**
 * Remove medical history condition
 */
export async function removeMedicalHistoryCondition(patientId, conditionIndex, tenantId, userId) {
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

  // Parse existing medical history
  let medicalHistory = [];
  if (patient.medicalHistory) {
    try {
      if (typeof patient.medicalHistory === 'string' && patient.medicalHistory.startsWith('[')) {
        medicalHistory = JSON.parse(patient.medicalHistory);
      } else if (Array.isArray(patient.medicalHistory)) {
        medicalHistory = patient.medicalHistory;
      }
    } catch (e) {
      throw new Error('Invalid medical history format');
    }
  }

  if (!medicalHistory[conditionIndex]) {
    throw new Error('Condition not found');
  }

  const removedCondition = medicalHistory[conditionIndex];
  medicalHistory.splice(conditionIndex, 1);

  // Update patient
  patient.medicalHistory = medicalHistory.length > 0 ? JSON.stringify(medicalHistory) : '';
  await patient.save();

  // Audit log
  await AuditLogger.auditWrite(
    'medical_history',
    patient._id.toString(),
    userId,
    tenantId,
    AuditAction.DELETE,
    undefined,
    { action: 'remove_condition', condition: removedCondition }
  );

  return removedCondition;
}

/**
 * Get medical history for a patient
 */
export async function getMedicalHistory(patientId, tenantId, userId) {
  await connectDB();

  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: patientId,
      deletedAt: null,
    })
  ).select('medicalHistory');

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Parse medical history
  let medicalHistory = [];
  if (patient.medicalHistory) {
    try {
      if (typeof patient.medicalHistory === 'string' && patient.medicalHistory.startsWith('[')) {
        medicalHistory = JSON.parse(patient.medicalHistory);
      } else if (Array.isArray(patient.medicalHistory)) {
        medicalHistory = patient.medicalHistory;
      } else {
        // Legacy format - convert to array
        medicalHistory = [
          {
            condition: patient.medicalHistory,
            diagnosed_date: new Date(),
            status: 'active',
            notes: '',
          },
        ];
      }
    } catch (e) {
      // If parsing fails, return empty array
      medicalHistory = [];
    }
  }

  // Sort by diagnosed date (newest first)
  medicalHistory.sort((a, b) => {
    const dateA = new Date(a.diagnosed_date || 0);
    const dateB = new Date(b.diagnosed_date || 0);
    return dateB - dateA;
  });

  // Audit access
  await AuditLogger.auditRead('medical_history', patientId, userId, tenantId);

  return medicalHistory;
}

/**
 * Get medical history timeline
 */
export async function getMedicalHistoryTimeline(patientId, tenantId, userId) {
  await connectDB();

  const medicalHistory = await getMedicalHistory(patientId, tenantId, userId);

  // Group by status
  const active = medicalHistory.filter((c) => c.status === 'active');
  const resolved = medicalHistory.filter((c) => c.status === 'resolved');

  // Create timeline (sorted by date)
  const timeline = medicalHistory.map((condition) => ({
    date: new Date(condition.diagnosed_date),
    condition: condition.condition,
    status: condition.status,
    notes: condition.notes,
  }));

  timeline.sort((a, b) => b.date - a.date);

  return {
    active,
    resolved,
    timeline,
    total: medicalHistory.length,
  };
}
