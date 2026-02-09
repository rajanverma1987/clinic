/**
 * GDPR Data Export Formats
 * Supports JSON, CSV, and PDF export formats
 * Based on NEW-PLANS.md requirements
 */

/**
 * Export data as CSV
 */
export function exportToCSV(exportData) {
  const lines = [];

  // Patient data
  lines.push('Section,Field,Value');
  lines.push('Patient,First Name,' + (exportData.patient?.demographics?.firstName || ''));
  lines.push('Patient,Last Name,' + (exportData.patient?.demographics?.lastName || ''));
  lines.push('Patient,Date of Birth,' + (exportData.patient?.demographics?.dateOfBirth || ''));
  lines.push('Patient,Gender,' + (exportData.patient?.demographics?.gender || ''));
  lines.push('Patient,Email,' + (exportData.patient?.contact?.email || ''));
  lines.push('Patient,Phone,' + (exportData.patient?.contact?.phone || ''));

  // Appointments
  if (exportData.appointments?.length > 0) {
    lines.push('');
    lines.push('Appointments,Appointment Number,Date,Status,Type');
    exportData.appointments.forEach((apt) => {
      lines.push(
        `Appointment,${apt.appointmentNumber || ''},${apt.appointmentDate || ''},${apt.status || ''},${apt.type || ''}`
      );
    });
  }

  // Prescriptions
  if (exportData.prescriptions?.length > 0) {
    lines.push('');
    lines.push('Prescriptions,Prescription Number,Status,Valid From,Valid Until');
    exportData.prescriptions.forEach((pres) => {
      lines.push(
        `Prescription,${pres.prescriptionNumber || ''},${pres.status || ''},${pres.validFrom || ''},${pres.validUntil || ''}`
      );
    });
  }

  // Invoices
  if (exportData.invoices?.length > 0) {
    lines.push('');
    lines.push('Invoices,Invoice Number,Date,Amount,Status');
    exportData.invoices.forEach((inv) => {
      lines.push(
        `Invoice,${inv.invoiceNumber || ''},${inv.invoiceDate || ''},${inv.totalAmount || ''},${inv.status || ''}`
      );
    });
  }

  return lines.join('\n');
}

/**
 * Export data as PDF (simplified - returns HTML that can be converted to PDF)
 * For full PDF generation, use jspdf library
 */
export function exportToPDFHTML(exportData) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Patient Data Export</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Patient Data Export</h1>
  <p><strong>Export Date:</strong> ${exportData.exportDate || new Date().toISOString()}</p>

  <h2>Patient Information</h2>
  <table>
    <tr><th>Field</th><th>Value</th></tr>
    <tr><td>First Name</td><td>${exportData.patient?.demographics?.firstName || ''}</td></tr>
    <tr><td>Last Name</td><td>${exportData.patient?.demographics?.lastName || ''}</td></tr>
    <tr><td>Date of Birth</td><td>${exportData.patient?.demographics?.dateOfBirth || ''}</td></tr>
    <tr><td>Gender</td><td>${exportData.patient?.demographics?.gender || ''}</td></tr>
    <tr><td>Email</td><td>${exportData.patient?.contact?.email || ''}</td></tr>
    <tr><td>Phone</td><td>${exportData.patient?.contact?.phone || ''}</td></tr>
  </table>

  ${exportData.appointments?.length > 0 ? `
  <h2>Appointments (${exportData.appointments.length})</h2>
  <table>
    <tr><th>Appointment Number</th><th>Date</th><th>Status</th><th>Type</th></tr>
    ${exportData.appointments.map(apt => `
      <tr>
        <td>${apt.appointmentNumber || ''}</td>
        <td>${apt.appointmentDate || ''}</td>
        <td>${apt.status || ''}</td>
        <td>${apt.type || ''}</td>
      </tr>
    `).join('')}
  </table>
  ` : ''}

  ${exportData.prescriptions?.length > 0 ? `
  <h2>Prescriptions (${exportData.prescriptions.length})</h2>
  <table>
    <tr><th>Prescription Number</th><th>Status</th><th>Valid From</th><th>Valid Until</th></tr>
    ${exportData.prescriptions.map(pres => `
      <tr>
        <td>${pres.prescriptionNumber || ''}</td>
        <td>${pres.status || ''}</td>
        <td>${pres.validFrom || ''}</td>
        <td>${pres.validUntil || ''}</td>
      </tr>
    `).join('')}
  </table>
  ` : ''}

  ${exportData.invoices?.length > 0 ? `
  <h2>Invoices (${exportData.invoices.length})</h2>
  <table>
    <tr><th>Invoice Number</th><th>Date</th><th>Amount</th><th>Status</th></tr>
    ${exportData.invoices.map(inv => `
      <tr>
        <td>${inv.invoiceNumber || ''}</td>
        <td>${inv.invoiceDate || ''}</td>
        <td>${inv.totalAmount || ''}</td>
        <td>${inv.status || ''}</td>
      </tr>
    `).join('')}
  </table>
  ` : ''}
</body>
</html>
  `;

  return html;
}

/**
 * Export audit logs as CSV
 */
export function exportAuditLogsCSV(auditLogs) {
  const lines = ['Timestamp,User,Action,Resource,Resource ID,IP Address,User Agent'];
  
  auditLogs.forEach((log) => {
    lines.push(
      `${log.timestamp || ''},${log.userId || ''},${log.action || ''},${log.resource || ''},${log.resourceId || ''},${log.ipAddress || ''},${log.userAgent || ''}`
    );
  });

  return lines.join('\n');
}

/**
 * Export billing data as Excel-compatible CSV
 */
export function exportBillingDataCSV(billingData) {
  const lines = ['Invoice Number,Date,Patient,Amount,Status,Payment Method,Paid Date'];
  
  billingData.forEach((invoice) => {
    lines.push(
      `${invoice.invoiceNumber || ''},${invoice.invoiceDate || ''},${invoice.patientName || ''},${invoice.totalAmount || ''},${invoice.status || ''},${invoice.paymentMethod || ''},${invoice.paidDate || ''}`
    );
  });

  return lines.join('\n');
}

export default {
  exportToCSV,
  exportToPDFHTML,
  exportAuditLogsCSV,
  exportBillingDataCSV,
};
