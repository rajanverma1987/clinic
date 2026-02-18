/**
 * Global Search API Route
 * 
 * Provides unified search across all entities:
 * - Patients
 * - Appointments
 * - Prescriptions
 * - Invoices
 * - Doctors
 * - Medicines
 * 
 * @module app/api/search/route
 * @since 1.0.0
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import Patient from '@/models/Patient.js';
import Appointment from '@/models/Appointment.js';
import Prescription from '@/models/Prescription.js';
import Invoice from '@/models/Invoice.js';
import Doctor from '@/models/Doctor.js';
import Drug from '@/models/Drug.js';
import User from '@/models/User.js';
import { logger } from '@/lib/utils/logger.js';

/**
 * GET /api/search
 * Global search endpoint
 */
async function getHandler(req, user) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const tenantId = user.tenantId;
    const userId = user.userId;

    if (!query || query.length < 2) {
      return NextResponse.json(
        successResponse({ results: [] })
      );
    }

    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const results = [];

    // Super Admin: search Users (email, name, tenant) instead of tenant-scoped patients
    if (user.role === 'super_admin') {
      try {
        const userQuery = {
          role: { $ne: 'super_admin' },
          $or: [
            { email: searchRegex },
            { firstName: searchRegex },
            { lastName: searchRegex },
          ],
        };
        const users = await User.find(userQuery)
          .select('email firstName lastName role')
          .populate('tenantId', 'name slug')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        users.forEach((u) => {
          const tenantName = u.tenantId?.name || u.tenantId?.slug || '';
          results.push({
            type: 'user',
            id: u._id.toString(),
            title: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
            subtitle: u.email || '',
            meta: tenantName ? `${u.role} · ${tenantName}` : u.role,
          });
        });
      } catch (err) {
        logger.error('User search error (super_admin)', err);
      }
      // Return user results only for super_admin so search is user-focused
      return NextResponse.json(
        successResponse({
          results: results.slice(0, 20),
          total: results.length,
        })
      );
    }

    // Search Patients (tenant-scoped for non–super_admin)
    try {
      const patients = await Patient.find(
        withTenant(tenantId, {
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { phone: searchRegex },
            { email: searchRegex },
            { patientId: searchRegex },
          ],
          deletedAt: null,
        })
      )
        .select('firstName lastName phone email patientId')
        .limit(5)
        .lean();

      patients.forEach((patient) => {
        results.push({
          type: 'patient',
          id: patient._id.toString(),
          title: `${patient.firstName} ${patient.lastName}`,
          subtitle: `Phone: ${patient.phone} | ID: ${patient.patientId || 'N/A'}`,
          meta: patient.email || '',
        });
      });
    } catch (err) {
      logger.error('Patient search error', err);
    }

    // Search Appointments
    try {
      const appointments = await Appointment.find(
        withTenant(tenantId, {
          $or: [
            { reason: searchRegex },
            { appointmentNumber: searchRegex },
          ],
        })
      )
        .populate('patientId', 'firstName lastName')
        .populate('doctorId', 'userId')
        .select('appointmentDate startTime status reason appointmentNumber')
        .limit(5)
        .lean();

      appointments.forEach((apt) => {
        results.push({
          type: 'appointment',
          id: apt._id.toString(),
          title: `Appointment - ${apt.patientId?.firstName || 'Unknown'} ${apt.patientId?.lastName || ''}`,
          subtitle: `${new Date(apt.appointmentDate || apt.startTime).toLocaleDateString()} | ${apt.status}`,
          meta: apt.reason || apt.appointmentNumber || '',
        });
      });
    } catch (err) {
      logger.error('Appointment search error', err);
    }

    // Search Prescriptions
    try {
      const prescriptions = await Prescription.find(
        withTenant(tenantId, {
          prescriptionNumber: searchRegex,
        })
      )
        .populate('patientId', 'firstName lastName')
        .select('prescriptionNumber createdAt status')
        .limit(5)
        .lean();

      prescriptions.forEach((prescription) => {
        results.push({
          type: 'prescription',
          id: prescription._id.toString(),
          title: `Prescription #${prescription.prescriptionNumber}`,
          subtitle: `${prescription.patientId?.firstName || 'Unknown'} ${prescription.patientId?.lastName || ''} | ${prescription.status}`,
          meta: new Date(prescription.createdAt).toLocaleDateString(),
        });
      });
    } catch (err) {
      logger.error('Prescription search error', err);
    }

    // Search Invoices
    try {
      const invoices = await Invoice.find(
        withTenant(tenantId, {
          $or: [
            { invoiceNumber: searchRegex },
            { notes: searchRegex },
          ],
        })
      )
        .populate('patientId', 'firstName lastName')
        .select('invoiceNumber totalAmount status invoiceDate')
        .limit(5)
        .lean();

      invoices.forEach((invoice) => {
        results.push({
          type: 'invoice',
          id: invoice._id.toString(),
          title: `Invoice #${invoice.invoiceNumber}`,
          subtitle: `${invoice.patientId?.firstName || 'Unknown'} ${invoice.patientId?.lastName || ''} | ₹${invoice.totalAmount || 0}`,
          meta: `${invoice.status} | ${new Date(invoice.invoiceDate).toLocaleDateString()}`,
        });
      });
    } catch (err) {
      logger.error('Invoice search error', err);
    }

    // Search Doctors
    try {
      const doctors = await Doctor.find(
        withTenant(tenantId, {
          $or: [
            { 'professional.licenseNumber': searchRegex },
            { 'professional.qualification': searchRegex },
          ],
        })
      )
        .populate('userId', 'firstName lastName')
        .select('professional')
        .limit(5)
        .lean();

      doctors.forEach((doctor) => {
        results.push({
          type: 'doctor',
          id: doctor._id.toString(),
          title: `Dr. ${doctor.userId?.firstName || ''} ${doctor.userId?.lastName || ''}`,
          subtitle: doctor.professional?.qualification || '',
          meta: doctor.professional?.specialization?.join(', ') || '',
        });
      });
    } catch (err) {
      logger.error('Doctor search error', err);
    }

    // Search Medicines
    try {
      const medicines = await Drug.find(
        withTenant(tenantId, {
          $or: [
            { name: searchRegex },
            { genericName: searchRegex },
            { code: searchRegex },
          ],
        })
      )
        .select('name genericName code')
        .limit(5)
        .lean();

      medicines.forEach((medicine) => {
        results.push({
          type: 'medicine',
          id: medicine._id.toString(),
          title: medicine.name,
          subtitle: medicine.genericName || '',
          meta: medicine.code || '',
        });
      });
    } catch (err) {
      logger.error('Medicine search error', err);
    }

    // Sort results by relevance (simple - could be enhanced)
    results.sort((a, b) => {
      const aMatch = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      const bMatch = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      return bMatch - aMatch;
    });

    return NextResponse.json(
      successResponse({
        results: results.slice(0, 20), // Limit total results
        total: results.length,
      })
    );
  } catch (error) {
    logger.error('Global search error', error);
    return NextResponse.json(
      errorResponse('Search failed. Please try again.', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export const GET = withErrorHandler(
  withAuth(getHandler)
);
