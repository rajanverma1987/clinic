/**
 * Export Utilities
 * Functions for exporting data to PDF, Excel, CSV
 */

import { arrayToCSV, reportToCSV } from './csv-export';

/**
 * Export analytics data to CSV
 */
export function exportAnalyticsToCSV(analytics, dateRange) {
  const rows = [];
  
  rows.push('Doctor Analytics Report');
  rows.push(`Date Range: ${dateRange}`);
  rows.push(`Generated: ${new Date().toISOString()}`);
  rows.push('');
  
  // Summary
  rows.push('Summary');
  rows.push(`Total Patients,${analytics.totalPatients || 0}`);
  rows.push(`Total Appointments,${analytics.totalAppointments || 0}`);
  rows.push(`Completed Appointments,${analytics.completedAppointments || 0}`);
  rows.push(`Cancelled Appointments,${analytics.cancelledAppointments || 0}`);
  rows.push(`Completion Rate,${analytics.completionRate?.toFixed(2) || 0}%`);
  rows.push(`Revenue,${analytics.revenue || 0}`);
  rows.push('');
  
  // Age Distribution
  if (analytics.ageGroups) {
    rows.push('Age Distribution');
    rows.push('Age Group,Count');
    Object.entries(analytics.ageGroups).forEach(([ageGroup, count]) => {
      rows.push(`${ageGroup},${count}`);
    });
    rows.push('');
  }
  
  // Gender Distribution
  if (analytics.genderCount) {
    rows.push('Gender Distribution');
    rows.push('Gender,Count');
    Object.entries(analytics.genderCount).forEach(([gender, count]) => {
      rows.push(`${gender},${count}`);
    });
    rows.push('');
  }
  
  // Appointment Status
  if (analytics.statusCount) {
    rows.push('Appointment Status');
    rows.push('Status,Count');
    Object.entries(analytics.statusCount).forEach(([status, count]) => {
      rows.push(`${status},${count}`);
    });
    rows.push('');
  }
  
  // Appointment Trends
  if (analytics.appointmentsByDate) {
    rows.push('Appointment Trends');
    rows.push('Date,Count');
    Object.entries(analytics.appointmentsByDate).forEach(([date, count]) => {
      rows.push(`${date},${count}`);
    });
  }
  
  return rows.join('\n');
}

/**
 * Export analytics data to Excel format (CSV with Excel headers)
 */
export function exportAnalyticsToExcel(analytics, dateRange) {
  // Excel can open CSV files, so we'll use CSV format
  // For true Excel format, you'd need a library like exceljs
  return exportAnalyticsToCSV(analytics, dateRange);
}

/**
 * Generate PDF content for analytics (HTML format for client-side PDF generation)
 */
export function generateAnalyticsPDFHTML(analytics, dateRange) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Doctor Analytics Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #2D9CDB; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Doctor Analytics Report</h1>
  <p><strong>Date Range:</strong> ${dateRange}</p>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Total Patients:</strong> ${analytics.totalPatients || 0}</p>
    <p><strong>Total Appointments:</strong> ${analytics.totalAppointments || 0}</p>
    <p><strong>Completed:</strong> ${analytics.completedAppointments || 0}</p>
    <p><strong>Completion Rate:</strong> ${analytics.completionRate?.toFixed(2) || 0}%</p>
    <p><strong>Revenue:</strong> ${analytics.revenue || 0}</p>
  </div>
  
  ${analytics.ageGroups ? `
    <h2>Age Distribution</h2>
    <table>
      <tr><th>Age Group</th><th>Count</th></tr>
      ${Object.entries(analytics.ageGroups).map(([ageGroup, count]) => 
        `<tr><td>${ageGroup}</td><td>${count}</td></tr>`
      ).join('')}
    </table>
  ` : ''}
  
  ${analytics.genderCount ? `
    <h2>Gender Distribution</h2>
    <table>
      <tr><th>Gender</th><th>Count</th></tr>
      ${Object.entries(analytics.genderCount).map(([gender, count]) => 
        `<tr><td>${gender}</td><td>${count}</td></tr>`
      ).join('')}
    </table>
  ` : ''}
  
  ${analytics.statusCount ? `
    <h2>Appointment Status</h2>
    <table>
      <tr><th>Status</th><th>Count</th></tr>
      ${Object.entries(analytics.statusCount).map(([status, count]) => 
        `<tr><td>${status}</td><td>${count}</td></tr>`
      ).join('')}
    </table>
  ` : ''}
</body>
</html>
  `;
  
  return html;
}

/**
 * Export data array to Excel (CSV format)
 */
export function exportToExcel(data, filename = 'export') {
  const csv = arrayToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
