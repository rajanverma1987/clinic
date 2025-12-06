'use client';

export function generateInvoicePrintHTML(data) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const clinicSettings = data.clinicSettings || {};
  const currency = clinicSettings.settings?.currency || clinicSettings.currency || data.currency || 'USD';
  const locale = clinicSettings.settings?.locale || clinicSettings.locale || 'en-US';
  
  // Extract clinic information
  const clinicName = clinicSettings.name || 'Clinic Name';
  const clinicPhone = clinicSettings.settings?.phone || '';
  const clinicEmail = clinicSettings.settings?.email || '';
  const clinicAddress = clinicSettings.settings?.address || {};
  const addressLine = clinicAddress.street || '';
  const city = clinicAddress.city || '';
  const state = clinicAddress.state || '';
  const zipCode = clinicAddress.zipCode || '';
  const fullAddress = [addressLine, city, state, zipCode].filter(Boolean).join(', ');

  // Format appointment display
  const formatAppointment = (appointmentId) => {
    if (!appointmentId) return '';
    if (typeof appointmentId === 'object' && appointmentId !== null) {
      const appointmentDate = appointmentId.appointmentDate 
        ? new Date(appointmentId.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '';
      const startTime = appointmentId.startTime 
        ? new Date(appointmentId.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '';
      return appointmentDate + (startTime ? ' at ' + startTime : '');
    }
    return String(appointmentId);
  };

  const formatCurrency = (amount) => {
    if (!amount) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(0);
    }
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount / 100); // Convert from cents to dollars
  };
  const invoice = data.invoice || {};
  const patient = invoice.patientId || {};
  const items = invoice.items || [];

  // Calculate totals
  const subtotal = invoice.subtotal || 0;
  const totalDiscount = invoice.totalDiscount || 0;
  const totalTax = invoice.totalTax || 0;
  const totalAmount = invoice.totalAmount || 0;
  const paidAmount = invoice.paidAmount || 0;
  const balanceAmount = invoice.balanceAmount || 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber || ''}</title>
  <style>
    @page {
      size: A4;
      margin: 0.5in;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      background: #fff;
    }
    
    .invoice-container {
      max-width: 100%;
      margin: 0 auto;
      padding: 10px;
    }
    
    /* Header Section */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #000;
    }
    
    .clinic-info {
      flex: 1;
      font-size: 10pt;
    }
    
    .clinic-info .clinic-name {
      font-weight: bold;
      font-size: 14pt;
      margin-bottom: 5px;
    }
    
    .invoice-info {
      flex: 1;
      text-align: right;
      font-size: 10pt;
    }
    
    .invoice-info .invoice-number {
      font-weight: bold;
      font-size: 16pt;
      margin-bottom: 5px;
    }
    
    /* Patient and Invoice Details */
    .details-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 10pt;
    }
    
    .patient-details, .invoice-details {
      flex: 1;
    }
    
    .patient-details {
      margin-right: 20px;
    }
    
    .section-title {
      font-weight: bold;
      margin-bottom: 5px;
      font-size: 11pt;
    }
    
    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10pt;
    }
    
    .items-table th {
      background-color: #f5f5f5;
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
      font-weight: bold;
    }
    
    .items-table td {
      border: 1px solid #000;
      padding: 8px;
    }
    
    .items-table .text-right {
      text-align: right;
    }
    
    .items-table .text-center {
      text-align: center;
    }
    
    /* Totals Section */
    .totals-section {
      margin-left: auto;
      width: 300px;
      font-size: 10pt;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #ddd;
    }
    
    .totals-row.total {
      font-weight: bold;
      font-size: 12pt;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 10px 0;
      margin-top: 5px;
    }
    
    /* Footer */
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      font-size: 9pt;
      color: #666;
    }
    
    .notes {
      margin-top: 20px;
      padding: 10px;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      font-size: 10pt;
    }
    
    .status-badge {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 10pt;
    }
    
    .status-paid {
      background-color: #d4edda;
      color: #155724;
    }
    
    .status-pending {
      background-color: #fff3cd;
      color: #856404;
    }
    
    .status-overdue {
      background-color: #f8d7da;
      color: #721c24;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="clinic-info">
        <div class="clinic-name">${clinicName}</div>
        ${fullAddress ? `<div>${fullAddress}</div>` : ''}
        ${clinicPhone ? `<div>Phone: ${clinicPhone}</div>` : ''}
        ${clinicEmail ? `<div>Email: ${clinicEmail}</div>` : ''}
      </div>
      <div class="invoice-info">
        <div class="invoice-number">INVOICE</div>
        <div><strong>Invoice #:</strong> ${invoice.invoiceNumber || ''}</div>
        <div><strong>Date:</strong> ${formatDate(invoice.invoiceDate)}</div>
        <div><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</div>
        <div><strong>Status:</strong> 
          <span class="status-badge status-${invoice.status || 'pending'}">
            ${(invoice.status || 'pending').toUpperCase()}
          </span>
        </div>
      </div>
    </div>

    <!-- Patient and Invoice Details -->
    <div class="details-section">
      <div class="patient-details">
        <div class="section-title">Bill To:</div>
        <div><strong>${patient.firstName || ''} ${patient.lastName || ''}</strong></div>
        <div>${patient.address || ''}</div>
        <div>${patient.city || ''}, ${patient.state || ''} ${patient.zipCode || ''}</div>
        <div>Phone: ${patient.phone || ''}</div>
        <div>Email: ${patient.email || ''}</div>
      </div>
      <div class="invoice-details">
        <div class="section-title">Invoice Details:</div>
        <div><strong>Patient ID:</strong> ${patient.patientId || ''}</div>
        ${invoice.appointmentId ? `<div><strong>Appointment:</strong> ${formatAppointment(invoice.appointmentId)}</div>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 45%;">Description</th>
          <th style="width: 8%;" class="text-center">Qty</th>
          <th style="width: 12%;" class="text-right">Unit Price</th>
          <th style="width: 10%;" class="text-right">Discount</th>
          <th style="width: 10%;" class="text-right">Tax</th>
          <th style="width: 10%;" class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.description || ''}</td>
            <td class="text-center">${item.quantity || 1}</td>
            <td class="text-right">${formatCurrency(item.unitPrice || 0)}</td>
            <td class="text-right">${formatCurrency(item.discountAmount || 0)}</td>
            <td class="text-right">${formatCurrency(item.taxAmount || 0)}</td>
            <td class="text-right"><strong>${formatCurrency(item.totalWithTax || item.total || 0)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(subtotal)}</span>
      </div>
      ${totalDiscount > 0 ? `
      <div class="totals-row">
        <span>Discount:</span>
        <span>-${formatCurrency(totalDiscount)}</span>
      </div>
      ` : ''}
      ${totalTax > 0 ? `
      <div class="totals-row">
        <span>Tax:</span>
        <span>${formatCurrency(totalTax)}</span>
      </div>
      ` : ''}
      <div class="totals-row total">
        <span>Total Amount:</span>
        <span>${formatCurrency(totalAmount)}</span>
      </div>
      ${paidAmount > 0 ? `
      <div class="totals-row">
        <span>Paid Amount:</span>
        <span>${formatCurrency(paidAmount)}</span>
      </div>
      ` : ''}
      ${balanceAmount > 0 && invoice.status !== 'paid' ? `
      <div class="totals-row">
        <span>Balance Due:</span>
        <span><strong>${formatCurrency(balanceAmount)}</strong></span>
      </div>
      ` : ''}
      ${invoice.status === 'paid' ? `
      <div class="totals-row">
        <span>Status:</span>
        <span><strong style="color: #16a34a;">Fully Paid</strong></span>
      </div>
      ` : ''}
    </div>

    ${invoice.notes ? `
    <div class="notes">
      <div class="section-title">Notes:</div>
      <div>${invoice.notes}</div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <div>Thank you for your business!</div>
      <div style="margin-top: 10px;">
        ${clinicName}${fullAddress ? ' - ' + fullAddress : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

