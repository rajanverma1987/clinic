/**
 * Number Generator Utility
 * Generates unique sequential numbers for appointments, prescriptions, invoices, etc.
 * Based on NEW-PLANS.md requirements
 */

import connectDB from '@/lib/db/connection';

/**
 * Generate unique appointment number (e.g., "APT001234")
 */
export async function generateAppointmentNumber(tenantId) {
  await connectDB();
  const { default: Appointment } = await import('@/models/Appointment');
  
  // Get the highest appointment number for this tenant
  const lastAppointment = await Appointment.findOne(
    { tenantId, appointmentNumber: { $exists: true, $ne: null } },
    { appointmentNumber: 1 }
  )
    .sort({ appointmentNumber: -1 })
    .lean();

  let nextNumber = 1;
  if (lastAppointment?.appointmentNumber) {
    const lastNum = parseInt(lastAppointment.appointmentNumber.replace('APT', ''), 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `APT${String(nextNumber).padStart(6, '0')}`;
}

/**
 * Generate unique consultation number (e.g., "CON001234")
 */
export async function generateConsultationNumber(tenantId) {
  await connectDB();
  const { default: ClinicalNote } = await import('@/models/ClinicalNote');
  
  const lastConsultation = await ClinicalNote.findOne(
    { tenantId, consultationNumber: { $exists: true, $ne: null } },
    { consultationNumber: 1 }
  )
    .sort({ consultationNumber: -1 })
    .lean();

  let nextNumber = 1;
  if (lastConsultation?.consultationNumber) {
    const lastNum = parseInt(lastConsultation.consultationNumber.replace('CON', ''), 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `CON${String(nextNumber).padStart(6, '0')}`;
}

/**
 * Generate unique prescription number (e.g., "RX001234")
 */
export async function generatePrescriptionNumber(tenantId) {
  await connectDB();
  const { default: Prescription } = await import('@/models/Prescription');
  
  const lastPrescription = await Prescription.findOne(
    { tenantId, prescriptionNumber: { $exists: true, $ne: null } },
    { prescriptionNumber: 1 }
  )
    .sort({ prescriptionNumber: -1 })
    .lean();

  let nextNumber = 1;
  if (lastPrescription?.prescriptionNumber) {
    const lastNum = parseInt(lastPrescription.prescriptionNumber.replace('RX', ''), 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `RX${String(nextNumber).padStart(6, '0')}`;
}

/**
 * Generate unique invoice number (e.g., "INV001234")
 */
export async function generateInvoiceNumber(tenantId) {
  await connectDB();
  const { default: Invoice } = await import('@/models/Invoice');
  
  const lastInvoice = await Invoice.findOne(
    { tenantId, invoiceNumber: { $exists: true, $ne: null } },
    { invoiceNumber: 1 }
  )
    .sort({ invoiceNumber: -1 })
    .lean();

  let nextNumber = 1;
  if (lastInvoice?.invoiceNumber) {
    const lastNum = parseInt(lastInvoice.invoiceNumber.replace('INV', ''), 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `INV${String(nextNumber).padStart(6, '0')}`;
}

/**
 * Generate unique payment number (e.g., "PAY001234")
 */
export async function generatePaymentNumber(tenantId) {
  await connectDB();
  const { default: Payment } = await import('@/models/Payment');
  
  const lastPayment = await Payment.findOne(
    { tenantId, paymentNumber: { $exists: true, $ne: null } },
    { paymentNumber: 1 }
  )
    .sort({ paymentNumber: -1 })
    .lean();

  let nextNumber = 1;
  if (lastPayment?.paymentNumber) {
    const lastNum = parseInt(lastPayment.paymentNumber.replace('PAY', ''), 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `PAY${String(nextNumber).padStart(6, '0')}`;
}

/**
 * Generate unique lab order number (e.g., "LAB001234")
 */
export async function generateLabOrderNumber(tenantId) {
  await connectDB();
  const { default: LabOrder } = await import('@/models/LabOrder');
  
  const lastOrder = await LabOrder.findOne(
    { tenantId, orderNumber: { $exists: true, $ne: null } },
    { orderNumber: 1 }
  )
    .sort({ orderNumber: -1 })
    .lean();

  let nextNumber = 1;
  if (lastOrder?.orderNumber) {
    const lastNum = parseInt(lastOrder.orderNumber.replace('LAB', ''), 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `LAB${String(nextNumber).padStart(6, '0')}`;
}

/**
 * Generate unique patient ID (e.g., "PT001234")
 */
export async function generatePatientId(tenantId) {
  await connectDB();
  const { default: Patient } = await import('@/models/Patient');
  
  const lastPatient = await Patient.findOne(
    { tenantId, patientId: { $exists: true, $ne: null } },
    { patientId: 1 }
  )
    .sort({ patientId: -1 })
    .lean();

  let nextNumber = 1;
  if (lastPatient?.patientId) {
    const lastNum = parseInt(lastPatient.patientId.replace('PT', ''), 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `PT${String(nextNumber).padStart(6, '0')}`;
}

/**
 * Generate unique imaging study number (e.g., "IMG001234")
 */
export async function generateImagingStudyNumber(tenantId) {
  await connectDB();
  const { default: ImagingStudy } = await import('@/models/ImagingStudy');
  
  const lastStudy = await ImagingStudy.findOne(
    { tenantId, studyNumber: { $exists: true, $ne: null } },
    { studyNumber: 1 }
  )
    .sort({ studyNumber: -1 })
    .lean();

  let nextNumber = 1;
  if (lastStudy?.studyNumber) {
    const lastNum = parseInt(lastStudy.studyNumber.replace('IMG', ''), 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `IMG${String(nextNumber).padStart(6, '0')}`;
}

/**
 * Generate unique referral number (e.g., "REF001234")
 */
export async function generateReferralNumber(tenantId) {
  await connectDB();
  const { default: Referral } = await import('@/models/Referral');
  
  const lastReferral = await Referral.findOne(
    { tenantId, referralNumber: { $exists: true, $ne: null } },
    { referralNumber: 1 }
  )
    .sort({ referralNumber: -1 })
    .lean();

  let nextNumber = 1;
  if (lastReferral?.referralNumber) {
    const lastNum = parseInt(lastReferral.referralNumber.replace('REF', ''), 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `REF${String(nextNumber).padStart(6, '0')}`;
}
