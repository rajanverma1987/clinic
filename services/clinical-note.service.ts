/**
 * Clinical Note service
 * Handles all clinical note-related business logic
 */

import connectDB from '@/lib/db/connection';
import ClinicalNote, { IClinicalNote, NoteType } from '@/models/ClinicalNote';
import NoteTemplate from '@/models/NoteTemplate';
import Patient from '@/models/Patient';
import User from '@/models/User';
import Appointment from '@/models/Appointment';
import { withTenant } from '@/lib/db/tenant-helper';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger';
import {
  CreateClinicalNoteInput,
  UpdateClinicalNoteInput,
  ClinicalNoteQueryInput,
} from '@/lib/validations/clinical-note';
import { getPaginationParams, createPaginationResult, PaginationResult } from '@/lib/utils/pagination';

/**
 * Create a new clinical note
 */
export async function createClinicalNote(
  input: CreateClinicalNoteInput,
  tenantId: string,
  userId: string
): Promise<IClinicalNote> {
  await connectDB();

  // Validate patient exists and belongs to tenant
  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: input.patientId,
      deletedAt: null,
    })
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Validate doctor exists and belongs to tenant
  const doctor = await User.findOne(
    withTenant(tenantId, {
      _id: userId,
      isActive: true,
    })
  );

  if (!doctor) {
    throw new Error('Doctor not found or inactive');
  }

  // Validate appointment if provided
  if (input.appointmentId) {
    const appointment = await Appointment.findOne(
      withTenant(tenantId, {
        _id: input.appointmentId,
        deletedAt: null,
      })
    );

    if (!appointment) {
      throw new Error('Appointment not found');
    }
  }

  // Load template if provided
  let template = null;
  if (input.templateId) {
    template = await NoteTemplate.findOne(
      withTenant(tenantId, {
        _id: input.templateId,
        isActive: true,
      })
    );

    if (!template) {
      throw new Error('Template not found');
    }

    // Increment usage count
    template.usageCount += 1;
    await template.save();
  }

  // Parse vital signs date if provided
  const noteData: any = {
    ...input,
    tenantId,
    doctorId: userId,
    type: input.type || NoteType.SOAP,
    version: 1,
  };

  if (input.vitalSigns?.recordedAt) {
    noteData.vitalSigns = {
      ...input.vitalSigns,
      recordedAt: input.vitalSigns.recordedAt instanceof Date
        ? input.vitalSigns.recordedAt
        : new Date(input.vitalSigns.recordedAt),
    };
  }

  // Create note
  const note = await ClinicalNote.create(noteData);

  // Audit log
  await AuditLogger.auditWrite(
    'clinical_note',
    note._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return note;
}

/**
 * Get clinical note by ID
 */
export async function getClinicalNoteById(
  noteId: string,
  tenantId: string,
  userId: string
): Promise<IClinicalNote | null> {
  await connectDB();

  const note = await ClinicalNote.findOne(
    withTenant(tenantId, {
      _id: noteId,
      deletedAt: null,
    })
  )
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName')
    .populate('appointmentId', 'appointmentDate startTime')
    .populate('templateId', 'name')
    .lean();

  if (note) {
    await AuditLogger.auditRead('clinical_note', noteId, userId, tenantId);
  }

  return note as IClinicalNote | null;
}

/**
 * List clinical notes with pagination and filters
 */
export async function listClinicalNotes(
  query: ClinicalNoteQueryInput,
  tenantId: string,
  userId: string
): Promise<PaginationResult<IClinicalNote>> {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  // Build filter
  const filter: any = withTenant(tenantId, {
    deletedAt: null,
  });

  if (query.patientId) {
    filter.patientId = query.patientId;
  }

  if (query.doctorId) {
    filter.doctorId = query.doctorId;
  }

  if (query.appointmentId) {
    filter.appointmentId = query.appointmentId;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  // Date filters
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate);
    }
  }

  // Get total count
  const total = await ClinicalNote.countDocuments(filter);

  // Get paginated results
  const notes = await ClinicalNote.find(filter)
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'clinical_note',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: notes.length, filters: query }
  );

  return createPaginationResult(notes as unknown as IClinicalNote[], total, page || 1, limit || 10);
}

/**
 * Update clinical note (creates new version)
 */
export async function updateClinicalNote(
  noteId: string,
  input: UpdateClinicalNoteInput,
  tenantId: string,
  userId: string
): Promise<IClinicalNote | null> {
  await connectDB();

  const existing = await ClinicalNote.findOne(
    withTenant(tenantId, {
      _id: noteId,
      deletedAt: null,
    })
  );

  if (!existing) {
    return null;
  }

  const before = existing.toObject();

  // Create new version
  const updateData: any = {
    ...input,
    version: existing.version + 1,
    previousVersionId: existing._id,
  };

  // Parse vital signs date if provided
  if (input.vitalSigns?.recordedAt) {
    updateData.vitalSigns = {
      ...input.vitalSigns,
      recordedAt: input.vitalSigns.recordedAt instanceof Date
        ? input.vitalSigns.recordedAt
        : new Date(input.vitalSigns.recordedAt),
    };
  }

  // Remove patientId from update (shouldn't be changed)
  delete updateData.patientId;

  // Create new version (don't update existing)
  const newNote = await ClinicalNote.create({
    ...existing.toObject(),
    ...updateData,
    _id: undefined, // Let MongoDB generate new ID
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Mark old version as inactive
  existing.isActive = false;
  await existing.save();

  // Audit log
  await AuditLogger.auditWrite(
    'clinical_note',
    newNote._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: newNote.toObject() },
    { previousVersionId: existing._id.toString() }
  );

  return newNote;
}

/**
 * Get note version history
 */
export async function getNoteVersionHistory(
  noteId: string,
  tenantId: string,
  userId: string
): Promise<IClinicalNote[]> {
  await connectDB();

  // Find all versions of this note
  const versions: IClinicalNote[] = [];
  let currentNote = await ClinicalNote.findOne(
    withTenant(tenantId, {
      _id: noteId,
      deletedAt: null,
    })
  );

  if (!currentNote) {
    return [];
  }

  // Collect all versions by following previousVersionId chain
  while (currentNote) {
    versions.unshift(currentNote.toObject());
    
    if (currentNote.previousVersionId) {
      currentNote = await ClinicalNote.findById(currentNote.previousVersionId);
    } else {
      break;
    }
  }

  // Audit read
  await AuditLogger.auditRead('clinical_note', noteId, userId, tenantId);

  return versions;
}

/**
 * Soft delete clinical note
 */
export async function deleteClinicalNote(
  noteId: string,
  tenantId: string,
  userId: string
): Promise<boolean> {
  await connectDB();

  const note = await ClinicalNote.findOne(
    withTenant(tenantId, {
      _id: noteId,
      deletedAt: null,
    })
  );

  if (!note) {
    return false;
  }

  note.deletedAt = new Date();
  note.isActive = false;
  await note.save();

  await AuditLogger.auditWrite(
    'clinical_note',
    note._id.toString(),
    userId,
    tenantId,
    AuditAction.DELETE
  );

  return true;
}

