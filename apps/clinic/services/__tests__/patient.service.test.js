/**
 * Unit tests for patient service
 * Tests patient CRUD operations and search functionality
 */

import { createPatient, getPatientById, searchPatients, updatePatient } from '../patient.service';
import Patient from '@/models/Patient';
import { connectDB } from '@/lib/db/connection';
import { withTenant } from '@/lib/db/tenant-helper';
import { generatePatientId } from '@/lib/utils/number-generator';
import * as auditLogger from '@/lib/audit/audit-logger';

// Mock dependencies
jest.mock('@/lib/db/connection');
jest.mock('@/models/Patient');
jest.mock('@/lib/db/tenant-helper');
jest.mock('@/lib/utils/number-generator');
jest.mock('@/lib/audit/audit-logger');
jest.mock('@/lib/utils/pagination', () => ({
  getPaginationParams: jest.fn((page, limit) => ({
    page: page || 1,
    limit: limit || 50,
    skip: ((page || 1) - 1) * (limit || 50),
  })),
  createPaginationResult: jest.fn((data, total, page, limit) => ({
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  })),
}));

describe('Patient Service', () => {
  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    connectDB.mockResolvedValue();
    withTenant.mockImplementation((tenantId, query) => ({ ...query, tenantId }));
  });

  describe('createPatient', () => {
    it('should create a new patient with generated patient ID', async () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phone: '1234567890',
        email: 'john@example.com',
      };

      generatePatientId.mockResolvedValue('PAT-0001');

      const mockPatient = {
        _id: 'patient-id',
        patientId: 'PAT-0001',
        ...input,
        tenantId: mockTenantId,
        toObject: () => ({
          _id: 'patient-id',
          patientId: 'PAT-0001',
          ...input,
        }),
      };

      Patient.findOne.mockResolvedValue(null); // No existing patient
      Patient.create.mockResolvedValue(mockPatient);
      auditLogger.logCreate.mockResolvedValue();

      const result = await createPatient(input, mockTenantId, mockUserId);

      expect(result).toEqual(mockPatient);
      expect(generatePatientId).toHaveBeenCalledWith(mockTenantId);
      expect(Patient.create).toHaveBeenCalled();
      expect(auditLogger.logCreate).toHaveBeenCalled();
    });

    it('should create patient with provided patient ID', async () => {
      const input = {
        patientId: 'PAT-CUSTOM',
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1985-05-15',
        gender: 'female',
        phone: '9876543210',
      };

      Patient.findOne.mockResolvedValue(null); // No existing patient with this ID
      const mockPatient = {
        _id: 'patient-id',
        patientId: 'PAT-CUSTOM',
        ...input,
        tenantId: mockTenantId,
      };
      Patient.create.mockResolvedValue(mockPatient);
      auditLogger.logCreate.mockResolvedValue();

      const result = await createPatient(input, mockTenantId, mockUserId);

      expect(result.patientId).toBe('PAT-CUSTOM');
      expect(generatePatientId).not.toHaveBeenCalled();
    });

    it('should throw error if patient ID already exists', async () => {
      const input = {
        patientId: 'PAT-EXISTING',
        firstName: 'John',
        lastName: 'Doe',
      };

      Patient.findOne.mockResolvedValue({ _id: 'existing-id' }); // Patient exists

      await expect(createPatient(input, mockTenantId, mockUserId)).rejects.toThrow(
        'Patient ID already exists for this tenant'
      );
    });
  });

  describe('getPatientById', () => {
    it('should get patient by ID', async () => {
      const patientId = 'patient-123';
      const mockPatient = {
        _id: patientId,
        patientId: 'PAT-0001',
        firstName: 'John',
        lastName: 'Doe',
        populate: jest.fn().mockReturnThis(),
        toObject: () => ({
          _id: patientId,
          patientId: 'PAT-0001',
          firstName: 'John',
          lastName: 'Doe',
        }),
      };

      Patient.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue(mockPatient),
      });
      auditLogger.logPHIAccess.mockResolvedValue();

      const result = await getPatientById(patientId, mockTenantId, mockUserId);

      expect(result).toBeDefined();
      expect(auditLogger.logPHIAccess).toHaveBeenCalled();
    });

    it('should throw error if patient not found', async () => {
      const patientId = 'non-existent';

      Patient.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(getPatientById(patientId, mockTenantId, mockUserId)).rejects.toThrow('Patient not found');
    });
  });

  describe('searchPatients', () => {
    it('should search patients by name', async () => {
      const filters = {
        search: 'John',
        page: 1,
        limit: 10,
      };

      const mockPatients = [
        { _id: '1', firstName: 'John', lastName: 'Doe' },
        { _id: '2', firstName: 'Johnny', lastName: 'Smith' },
      ];

      Patient.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPatients),
      });

      Patient.countDocuments.mockResolvedValue(2);
      auditLogger.logPHIAccess.mockResolvedValue();

      const result = await searchPatients(filters, mockTenantId, mockUserId);

      expect(result.data).toBeDefined();
      expect(Patient.find).toHaveBeenCalled();
    });

    it('should filter patients by status', async () => {
      const filters = {
        status: 'active',
        page: 1,
        limit: 10,
      };

      Patient.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      Patient.countDocuments.mockResolvedValue(0);
      auditLogger.logPHIAccess.mockResolvedValue();

      await searchPatients(filters, mockTenantId, mockUserId);

      expect(Patient.find).toHaveBeenCalled();
      const query = Patient.find.mock.calls[0][0];
      expect(query.status).toBe('active');
    });

    it('should filter patients by gender', async () => {
      const filters = {
        gender: 'male',
        page: 1,
        limit: 10,
      };

      Patient.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      Patient.countDocuments.mockResolvedValue(0);
      auditLogger.logPHIAccess.mockResolvedValue();

      await searchPatients(filters, mockTenantId, mockUserId);

      const query = Patient.find.mock.calls[0][0];
      expect(query.gender).toBe('male');
    });
  });

  describe('updatePatient', () => {
    it('should update patient successfully', async () => {
      const patientId = 'patient-123';
      const updates = {
        firstName: 'Updated',
        phone: '9999999999',
      };

      const existingPatient = {
        _id: patientId,
        patientId: 'PAT-0001',
        firstName: 'John',
        lastName: 'Doe',
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({
          _id: patientId,
          ...updates,
        }),
      };

      Patient.findOne.mockResolvedValue(existingPatient);
      auditLogger.logUpdate.mockResolvedValue();

      const result = await updatePatient(patientId, updates, mockTenantId, mockUserId);

      expect(existingPatient.save).toHaveBeenCalled();
      expect(auditLogger.logUpdate).toHaveBeenCalled();
    });

    it('should throw error if patient not found', async () => {
      const patientId = 'non-existent';
      const updates = { firstName: 'Updated' };

      Patient.findOne.mockResolvedValue(null);

      await expect(updatePatient(patientId, updates, mockTenantId, mockUserId)).rejects.toThrow('Patient not found');
    });
  });
});
