'use client';

export function generatePrescriptionPrintHTML(data) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Prescription</title>
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
    
    .prescription-container {
      max-width: 100%;
      margin: 0 auto;
      padding: 10px;
    }
    
    /* Header Section */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #000;
    }
    
    .doctor-info {
      flex: 1;
      font-size: 10pt;
    }
    
    .doctor-info .doctor-name {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 3px;
    }
    
    .clinic-logo {
      flex: 1;
      text-align: center;
      font-weight: bold;
      font-size: 12pt;
    }
    
    .clinic-info {
      flex: 1;
      text-align: right;
      font-size: 9pt;
    }
    
    .clinic-info .clinic-name {
      font-weight: bold;
      font-size: 10pt;
      margin-bottom: 3px;
    }
    
    /* Patient Section */
    .patient-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      font-size: 10pt;
    }
    
    .patient-left {
      flex: 1;
    }
    
    .patient-right {
      flex: 1;
      text-align: right;
    }
    
    .patient-id {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .patient-details {
      margin-bottom: 5px;
    }
    
    .patient-vitals {
      margin-top: 5px;
    }
    
    /* Clinical Section */
    .section-divider {
      border-top: 1px solid #000;
      margin: 10px 0;
    }
    
    .clinical-section {
      display: flex;
      gap: 20px;
      margin-bottom: 10px;
    }
    
    .clinical-left, .clinical-right {
      flex: 1;
    }
    
    .section-title {
      font-weight: bold;
      margin-bottom: 5px;
      font-size: 10pt;
    }
    
    .section-content {
      font-size: 9pt;
      margin-left: 10px;
    }
    
    .section-content ul {
      list-style: none;
      padding-left: 0;
    }
    
    .section-content li {
      margin-bottom: 3px;
    }
    
    .section-content li:before {
      content: "* ";
      margin-right: 5px;
    }
    
    /* Prescription Table */
    .prescription-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 9pt;
    }
    
    .prescription-table th {
      background-color: #f0f0f0;
      border: 1px solid #000;
      padding: 6px;
      text-align: left;
      font-weight: bold;
    }
    
    .prescription-table td {
      border: 1px solid #000;
      padding: 6px;
    }
    
    .prescription-table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    /* Footer */
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 2px solid #000;
    }
    
    .footer-section {
      margin-bottom: 10px;
    }
    
    .signature-section {
      text-align: right;
      margin-top: 30px;
    }
    
    .signature-line {
      border-top: 1px solid #000;
      display: inline-block;
      padding-top: 5px;
      min-width: 200px;
      text-align: center;
    }
    
    /* Watermark (optional) */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72pt;
      color: rgba(0, 0, 0, 0.05);
      z-index: -1;
      pointer-events: none;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="prescription-container">
    ${data.clinicName ? `<div class="watermark">${data.clinicName}</div>` : ''}
    
    <!-- Header -->
    <div class="header">
      <div class="doctor-info">
        <div class="doctor-name">Dr. ${data.doctorName}</div>
        ${data.doctorQualification ? `<div>${data.doctorQualification}</div>` : ''}
        ${data.doctorRegNo ? `<div>Reg. No: ${data.doctorRegNo}</div>` : ''}
        ${data.doctorPhone ? `<div>Mob. No: ${data.doctorPhone}</div>` : ''}
      </div>
      <div class="clinic-logo">
        ${data.clinicName || 'CLINIC NAME'}
      </div>
      <div class="clinic-info">
        ${data.clinicName ? `<div class="clinic-name">${data.clinicName}</div>` : ''}
        ${data.clinicAddress ? `<div>${data.clinicAddress}</div>` : ''}
        ${data.clinicPhone ? `<div>Ph: ${data.clinicPhone}</div>` : ''}
        ${data.clinicTiming ? `<div>Timing: ${data.clinicTiming}</div>` : ''}
      </div>
    </div>
    
    <!-- Patient Section -->
    <div class="patient-section">
      <div class="patient-left">
        <div class="patient-id">ID: ${data.patientId} - ${data.patientName}${data.patientGender ? ` (${data.patientGender.charAt(0).toUpperCase()})` : ''}${data.patientAge ? ` / ${data.patientAge} Y` : ''}</div>
        ${data.patientAddress ? `<div class="patient-details">Address: ${data.patientAddress}</div>` : ''}
        ${data.weight || data.height || data.bloodPressure ? `
          <div class="patient-vitals">
            ${data.weight ? `Weight(kg): ${data.weight}` : ''}${data.weight && data.height ? ', ' : ''}
            ${data.height ? `Height (cms): ${data.height}` : ''}${(data.weight || data.height) && data.bloodPressure ? ', ' : ''}
            ${data.bloodPressure ? `BP: ${data.bloodPressure} mmHg` : ''}
          </div>
        ` : ''}
        ${data.referredBy ? `<div>Referred By: ${data.referredBy}</div>` : ''}
        ${data.knownHistory && data.knownHistory.length > 0 ? `
          <div style="margin-top: 5px;">
            <div style="font-weight: bold;">Known History Of</div>
            <ul style="list-style: none; padding-left: 0; margin-top: 3px;">
              ${data.knownHistory.map(h => `<li>* ${h}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
      <div class="patient-right">
        <div>Date: ${formatDate(data.visitDate)}${data.visitTime ? `, ${formatTime(data.visitDate)}` : ''}</div>
      </div>
    </div>
    
    <div class="section-divider"></div>
    
    <!-- Clinical Section -->
    ${(data.chiefComplaints && data.chiefComplaints.length > 0) || (data.clinicalFindings && data.clinicalFindings.length > 0) ? `
      <div class="clinical-section">
        ${data.chiefComplaints && data.chiefComplaints.length > 0 ? `
          <div class="clinical-left">
            <div class="section-title">Chief Complaints</div>
            <div class="section-content">
              <ul>
                ${data.chiefComplaints.map(cc => `<li>${cc}</li>`).join('')}
              </ul>
            </div>
          </div>
        ` : ''}
        ${data.clinicalFindings && data.clinicalFindings.length > 0 ? `
          <div class="clinical-right">
            <div class="section-title">Clinical Findings</div>
            <div class="section-content">
              <ul>
                ${data.clinicalFindings.map(cf => `<li>${cf}</li>`).join('')}
              </ul>
            </div>
          </div>
        ` : ''}
      </div>
    ` : ''}
    
    ${data.notes ? `
      <div class="section-divider"></div>
      <div style="margin-bottom: 10px;">
        <div class="section-title">Notes:</div>
        <div class="section-content">${data.notes}</div>
      </div>
    ` : ''}
    
    ${data.diagnosis && data.diagnosis.length > 0 ? `
      <div style="margin-bottom: 10px;">
        <div class="section-title">Diagnosis:</div>
        <div class="section-content">
          <ul>
            ${data.diagnosis.map(d => `<li>${d}</li>`).join('')}
          </ul>
        </div>
      </div>
    ` : ''}
    
    ${data.procedures && data.procedures.length > 0 ? `
      <div style="margin-bottom: 10px;">
        <div class="section-title">Procedures conducted</div>
        <div class="section-content">
          <ul>
            ${data.procedures.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      </div>
    ` : ''}
    
    <!-- Prescription Table - Only show drugs -->
    ${data.items && data.items.filter(item => item.itemType === 'drug').length > 0 ? `
      <div style="margin: 15px 0;">
        <div class="section-title" style="margin-bottom: 8px;">R</div>
        <table class="prescription-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 40%;">Medicine Name</th>
              <th style="width: 30%;">Dosage</th>
              <th style="width: 25%;">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.filter(item => item.itemType === 'drug').map((item, index) => {
              const medicineName = `${item.name}${item.dosage ? ` ${item.dosage}` : ''}`;
              
              const dosage = item.frequency
                ? `${item.quantity || 1} ${item.frequency}${item.instructions ? ` (${item.instructions})` : ''}`
                : item.instructions || '-';
              
              const duration = item.duration
                ? `${item.duration} Days${item.quantity ? ` (Tot:${item.quantity} ${item.name.includes('TAB') ? 'Tab' : item.name.includes('CAP') ? 'Cap' : 'Unit'})` : ''}`
                : '-';
              
              return `
                <tr>
                  <td>${index + 1})</td>
                  <td>${medicineName}</td>
                  <td>${dosage}</td>
                  <td>${duration}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}
    
    ${data.investigations && data.investigations.length > 0 ? `
      <div style="margin-bottom: 10px;">
        <div class="section-title">Investigations:</div>
        <div class="section-content">
          <ul>
            ${data.investigations.map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>
      </div>
    ` : ''}
    
    ${data.advice && data.advice.length > 0 ? `
      <div style="margin-bottom: 10px;">
        <div class="section-title">Advice Given:</div>
        <div class="section-content">
          ${data.advice.length === 1 && data.advice[0].includes('<') ? 
            // If single item contains HTML, render it directly
            data.advice[0] :
            // Otherwise render as list
            `<ul>${data.advice.map(a => `<li>${a}</li>`).join('')}</ul>`
          }
        </div>
      </div>
    ` : ''}
    
    ${data.followUp ? `
      <div style="margin-bottom: 10px;">
        <div class="section-title">Follow Up: ${data.followUp}</div>
      </div>
    ` : ''}
    
    ${data.additionalInstructions ? `
      <div style="margin-bottom: 10px;">
        <div class="section-title">Additional Instructions:</div>
        <div class="section-content">${data.additionalInstructions}</div>
      </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      <div class="signature-section">
        <div class="signature-line">
          <div style="font-weight: bold; margin-bottom: 5px;">Signature</div>
          <div>Dr. ${data.doctorName}${data.doctorQualification ? ` ${data.doctorQualification}` : ''}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

