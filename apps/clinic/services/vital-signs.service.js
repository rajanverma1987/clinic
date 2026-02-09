/**
 * Vital Signs service
 * Handles vital signs tracking and aggregation from clinical notes
 */

import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import ClinicalNote from '@/models/ClinicalNote.js';
import Patient from '@/models/Patient.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

/**
 * Record vital signs (creates or updates clinical note with vital signs)
 */
export async function recordVitalSigns(input, tenantId, userId) {
  await connectDB();

  // Validate patient exists
  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: input.patientId,
      deletedAt: null,
    })
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Calculate BMI if weight and height provided
  let bmi = null;
  if (input.weight && input.height) {
    const heightInMeters = input.height / 100; // Convert cm to meters
    bmi = input.weight / (heightInMeters * heightInMeters);
    bmi = Math.round(bmi * 10) / 10; // Round to 1 decimal place
  }

  // Parse blood pressure if provided as string (e.g., "120/80")
  let bloodPressure = input.bloodPressure;
  if (typeof bloodPressure === 'string' && bloodPressure.includes('/')) {
    bloodPressure = bloodPressure; // Keep as string for storage
  }

  // Build vital signs object
  const vitalSigns = {
    bloodPressure: bloodPressure || null,
    heartRate: input.heartRate || null,
    temperature: input.temperature || null,
    respiratoryRate: input.respiratoryRate || null,
    oxygenSaturation: input.oxygenSaturation || null,
    weight: input.weight || null,
    height: input.height || null,
    bmi: bmi,
    recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
  };

  // If appointmentId or consultationId provided, update existing note
  if (input.appointmentId || input.consultationId) {
    const note = await ClinicalNote.findOne(
      withTenant(tenantId, {
        ...(input.consultationId ? { _id: input.consultationId } : {}),
        ...(input.appointmentId ? { appointmentId: input.appointmentId } : {}),
        patientId: input.patientId,
        deletedAt: null,
      })
    );

    if (note) {
      note.vitalSigns = vitalSigns;
      await note.save();

      await AuditLogger.auditWrite(
        'vital_signs',
        note._id.toString(),
        userId,
        tenantId,
        AuditAction.UPDATE,
        undefined,
        { action: 'record_vitals', appointmentId: input.appointmentId }
      );

      return { note, vitalSigns };
    }
  }

  // Otherwise, create a new clinical note with just vital signs
  const note = await ClinicalNote.create({
    tenantId,
    patientId: input.patientId,
    doctorId: userId,
    appointmentId: input.appointmentId || null,
    date: vitalSigns.recordedAt,
    type: 'consultation',
    vitalSigns,
    status: 'draft',
  });

  await AuditLogger.auditWrite(
    'vital_signs',
    note._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE,
    undefined,
    { action: 'record_vitals' }
  );

  return { note, vitalSigns };
}

/**
 * Get vital signs history for a patient
 */
export async function getVitalSignsHistory(patientId, query, tenantId, userId) {
  await connectDB();

  // Validate patient exists
  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: patientId,
      deletedAt: null,
    })
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Build filter
  const filter = withTenant(tenantId, {
    patientId: patientId,
    deletedAt: null,
    'vitalSigns.recordedAt': { $exists: true, $ne: null },
  });

  if (query.startDate) {
    filter['vitalSigns.recordedAt'] = {
      ...filter['vitalSigns.recordedAt'],
      $gte: new Date(query.startDate),
    };
  }

  if (query.endDate) {
    filter['vitalSigns.recordedAt'] = {
      ...filter['vitalSigns.recordedAt'],
      $lte: new Date(query.endDate),
    };
  }

  // Get vital signs from clinical notes
  const notes = await ClinicalNote.find(filter)
    .select('vitalSigns date doctorId appointmentId')
    .populate('doctorId', 'firstName lastName')
    .sort({ 'vitalSigns.recordedAt': -1 })
    .limit(query.limit || 100)
    .lean();

  // Extract and format vital signs
  const vitalSignsHistory = notes
    .filter((note) => note.vitalSigns && note.vitalSigns.recordedAt)
    .map((note) => ({
      id: note._id.toString(),
      recordedAt: note.vitalSigns.recordedAt,
      date: note.date,
      doctor: note.doctorId ? `${note.doctorId.firstName} ${note.doctorId.lastName}` : null,
      appointmentId: note.appointmentId?.toString() || null,
      ...note.vitalSigns,
    }));

  // Audit access
  await AuditLogger.auditRead('vital_signs', `patient_${patientId}`, userId, tenantId);

  return vitalSignsHistory;
}

/**
 * Get vital signs trends for a patient
 */
export async function getVitalSignsTrends(patientId, query, tenantId, userId) {
  await connectDB();

  // Get vital signs history
  const history = await getVitalSignsHistory(patientId, query, tenantId, userId);

  // Calculate trends for each vital sign
  const trends = {
    bloodPressure: {
      systolic: [],
      diastolic: [],
      labels: [],
    },
    heartRate: {
      values: [],
      labels: [],
    },
    temperature: {
      values: [],
      labels: [],
    },
    weight: {
      values: [],
      labels: [],
    },
    bmi: {
      values: [],
      labels: [],
    },
    oxygenSaturation: {
      values: [],
      labels: [],
    },
  };

  history.forEach((vital) => {
    const dateLabel = new Date(vital.recordedAt).toLocaleDateString();

    // Blood pressure
    if (vital.bloodPressure) {
      const bp = vital.bloodPressure.toString();
      const match = bp.match(/(\d+)\s*\/\s*(\d+)/);
      if (match) {
        trends.bloodPressure.systolic.push(parseInt(match[1]));
        trends.bloodPressure.diastolic.push(parseInt(match[2]));
        trends.bloodPressure.labels.push(dateLabel);
      }
    }

    // Heart rate
    if (vital.heartRate) {
      trends.heartRate.values.push(vital.heartRate);
      trends.heartRate.labels.push(dateLabel);
    }

    // Temperature
    if (vital.temperature) {
      trends.temperature.values.push(vital.temperature);
      trends.temperature.labels.push(dateLabel);
    }

    // Weight
    if (vital.weight) {
      trends.weight.values.push(vital.weight);
      trends.weight.labels.push(dateLabel);
    }

    // BMI
    if (vital.bmi) {
      trends.bmi.values.push(vital.bmi);
      trends.bmi.labels.push(dateLabel);
    }

    // Oxygen saturation
    if (vital.oxygenSaturation) {
      trends.oxygenSaturation.values.push(vital.oxygenSaturation);
      trends.oxygenSaturation.labels.push(dateLabel);
    }
  });

  // Calculate statistics
  const stats = {
    latest: history[0] || null,
    count: history.length,
    dateRange: {
      start: history.length > 0 ? history[history.length - 1].recordedAt : null,
      end: history.length > 0 ? history[0].recordedAt : null,
    },
  };

  return {
    history,
    trends,
    stats,
  };
}

/**
 * Get latest vital signs for a patient
 */
export async function getLatestVitalSigns(patientId, tenantId, userId) {
  await connectDB();

  const note = await ClinicalNote.findOne(
    withTenant(tenantId, {
      patientId: patientId,
      deletedAt: null,
      'vitalSigns.recordedAt': { $exists: true, $ne: null },
    })
  )
    .select('vitalSigns date')
    .sort({ 'vitalSigns.recordedAt': -1 })
    .lean();

  if (!note || !note.vitalSigns) {
    return null;
  }

  await AuditLogger.auditRead('vital_signs', `patient_${patientId}_latest`, userId, tenantId);

  return {
    ...note.vitalSigns,
    date: note.date,
  };
}
