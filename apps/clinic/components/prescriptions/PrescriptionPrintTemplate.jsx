'use client';

export function generatePrescriptionPrintHTML(data) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
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
      padding: 16px;
    }

    /* Header Section */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #000;
    }

    .doctor-info {
      flex: 1;
      font-size: 10pt;
      line-height: 1.5;
    }

    .doctor-info .doctor-name {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 4px;
    }

    .doctor-info > div:not(.doctor-name) {
      margin-bottom: 2px;
    }

    .clinic-logo {
      flex: 1;
      text-align: center;
      font-weight: bold;
      font-size: 12pt;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .clinic-logo-img {
      max-height: 48px;
      max-width: 180px;
      width: auto;
      height: auto;
      object-fit: contain;
    }

    .clinic-info {
      flex: 1;
      text-align: right;
      font-size: 9pt;
      line-height: 1.5;
    }

    .clinic-info .clinic-name {
      font-weight: bold;
      font-size: 10pt;
      margin-bottom: 4px;
    }

    .clinic-info > div:not(.clinic-name) {
      margin-bottom: 2px;
    }

    /* Patient Section */
    .patient-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;
      font-size: 10pt;
      line-height: 1.5;
    }

    .patient-left {
      flex: 1;
      min-width: 0;
    }

    .patient-right {
      flex: 0 0 auto;
      text-align: right;
    }

    .patient-id {
      font-weight: bold;
      margin-bottom: 8px;
    }

    .patient-details {
      margin-bottom: 4px;
    }

    .patient-vitals {
      margin-top: 8px;
    }

    .patient-left > div:not(.patient-id):not(.patient-details):not(.patient-vitals) {
      margin-top: 4px;
    }

    /* Clinical Section */
    .section-divider {
      border-top: 1px solid #000;
      margin: 16px 0;
    }

    .clinical-section {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
    }

    .clinical-left, .clinical-right {
      flex: 1;
      min-width: 0;
    }

    .section-title {
      font-weight: bold;
      margin-bottom: 8px;
      font-size: 10pt;
    }

    .section-content {
      font-size: 9pt;
      margin-left: 0;
      padding-left: 0;
      line-height: 1.45;
    }

    .section-content ul {
      list-style: none;
      padding-left: 0;
      margin: 0 0 0 12px;
    }

    .section-content li {
      margin-bottom: 4px;
    }

    .section-content li:before {
      content: "• ";
      margin-right: 6px;
    }

    /* Prescription Table */
    .prescription-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 9pt;
    }

    .prescription-table th {
      background-color: #f0f0f0;
      border: 1px solid #000;
      padding: 8px 12px;
      text-align: left;
      font-weight: bold;
    }

    .prescription-table td {
      border: 1px solid #000;
      padding: 8px 12px;
      vertical-align: top;
    }

    .prescription-table tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    /* Footer */
    .footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #000;
    }

    .footer-section {
      margin-bottom: 12px;
    }

    .signature-section {
      text-align: right;
      margin-top: 32px;
    }

    .signature-line {
      border-top: 1px solid #000;
      display: inline-block;
      padding-top: 8px;
      min-width: 200px;
      text-align: center;
      font-size: 10pt;
    }

    .signature-line > div:first-child {
      margin-bottom: 4px;
    }

    /* Block sections (notes, diagnosis, etc.) */
    .block-section {
      margin-bottom: 16px;
    }

    .block-section .section-title {
      margin-bottom: 6px;
    }

    /* Watermark (optional) */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      margin-top: -50%;
      margin-left: -50%;
      transform: rotate(-45deg);
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
        ${
          data.clinicLogoUrl
            ? `<img src="${String(data.clinicLogoUrl).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" alt="" class="clinic-logo-img" />`
            : data.clinicName || 'CLINIC NAME'
        }
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
        <div class="patient-id">ID: ${data.patientId} - ${data.patientName}${
          data.patientGender ? ` (${data.patientGender.charAt(0).toUpperCase()})` : ''
        }${data.patientAge ? ` / ${data.patientAge} Y` : ''}</div>
        ${
          data.patientAddress
            ? `<div class="patient-details">Address: ${data.patientAddress}</div>`
            : ''
        }
        ${
          data.weight || data.height || data.bloodPressure
            ? `
          <div class="patient-vitals">
            ${data.weight ? `Weight(kg): ${data.weight}` : ''}${
              data.weight && data.height ? ', ' : ''
            }
            ${data.height ? `Height (cms): ${data.height}` : ''}${
              (data.weight || data.height) && data.bloodPressure ? ', ' : ''
            }
            ${data.bloodPressure ? `BP: ${data.bloodPressure} mmHg` : ''}
          </div>
        `
            : ''
        }
        ${data.referredBy ? `<div>Referred By: ${data.referredBy}</div>` : ''}
        ${
          data.knownHistory && data.knownHistory.length > 0
            ? `
          <div style="margin-top: 8px;">
            <div class="section-title" style="margin-bottom: 4px;">Known History Of</div>
            <ul style="list-style: none; padding-left: 12px; margin: 0;">
              ${data.knownHistory
                .map((h) => `<li style="margin-bottom: 4px;">• ${h}</li>`)
                .join('')}
            </ul>
          </div>
        `
            : ''
        }
      </div>
      <div class="patient-right">
        <div>Date: ${formatDate(data.visitDate)}${
          data.visitTime ? `, ${formatTime(data.visitDate)}` : ''
        }</div>
      </div>
    </div>

    <div class="section-divider"></div>

    <!-- Clinical Section -->
    ${
      (data.chiefComplaints && data.chiefComplaints.length > 0) ||
      (data.clinicalFindings && data.clinicalFindings.length > 0)
        ? `
      <div class="clinical-section">
        ${
          data.chiefComplaints && data.chiefComplaints.length > 0
            ? `
          <div class="clinical-left">
            <div class="section-title">Chief Complaints</div>
            <div class="section-content">
              <ul>
                ${data.chiefComplaints.map((cc) => `<li>${cc}</li>`).join('')}
              </ul>
            </div>
          </div>
        `
            : ''
        }
        ${
          data.clinicalFindings && data.clinicalFindings.length > 0
            ? `
          <div class="clinical-right">
            <div class="section-title">Clinical Findings</div>
            <div class="section-content">
              <ul>
                ${data.clinicalFindings.map((cf) => `<li>${cf}</li>`).join('')}
              </ul>
            </div>
          </div>
        `
            : ''
        }
      </div>
    `
        : ''
    }

    ${
      data.notes
        ? `
      <div class="section-divider"></div>
      <div class="block-section">
        <div class="section-title">Notes:</div>
        <div class="section-content">${data.notes}</div>
      </div>
    `
        : ''
    }

    ${
      data.diagnosis && data.diagnosis.length > 0
        ? `
      <div class="block-section">
        <div class="section-title">Diagnosis:</div>
        <div class="section-content">
          <ul>
            ${data.diagnosis.map((d) => `<li>${d}</li>`).join('')}
          </ul>
        </div>
      </div>
    `
        : ''
    }

    ${
      data.procedures && data.procedures.length > 0
        ? `
      <div class="block-section">
        <div class="section-title">Procedures conducted</div>
        <div class="section-content">
          <ul>
            ${data.procedures.map((p) => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      </div>
    `
        : ''
    }

    <!-- Prescription Table - Only show drugs -->
    ${
      data.items && data.items.filter((item) => item.itemType === 'drug').length > 0
        ? `
      <div class="block-section" style="margin-top: 20px;">
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
            ${data.items
              .filter((item) => item.itemType === 'drug')
              .map((item, index) => {
                const medicineName = `${item.name}${item.dosage ? ` ${item.dosage}` : ''}`;

                const dosage = item.frequency
                  ? `${item.quantity || 1} ${item.frequency}${
                      item.instructions ? ` (${item.instructions})` : ''
                    }`
                  : item.instructions || '-';

                const duration = item.duration
                  ? `${item.duration} Days${
                      item.quantity
                        ? ` (Tot:${item.quantity} ${
                            item.name.includes('TAB')
                              ? 'Tab'
                              : item.name.includes('CAP')
                                ? 'Cap'
                                : 'Unit'
                          })`
                        : ''
                    }`
                  : '-';

                return `
                <tr>
                  <td>${index + 1})</td>
                  <td>${medicineName}</td>
                  <td>${dosage}</td>
                  <td>${duration}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `
        : ''
    }

    ${
      data.investigations && data.investigations.length > 0
        ? `
      <div class="block-section">
        <div class="section-title">Investigations:</div>
        <div class="section-content">
          <ul>
            ${data.investigations.map((i) => `<li>${i}</li>`).join('')}
          </ul>
        </div>
      </div>
    `
        : ''
    }

    ${
      data.advice && data.advice.length > 0
        ? `
      <div class="block-section">
        <div class="section-title">Advice Given:</div>
        <div class="section-content">
          ${
            data.advice.length === 1 && data.advice[0].includes('<')
              ? data.advice[0]
              : `<ul>${data.advice.map((a) => `<li>${a}</li>`).join('')}</ul>`
          }
        </div>
      </div>
    `
        : ''
    }

    ${
      data.followUp
        ? `
      <div class="block-section">
        <div class="section-title">Follow Up: ${data.followUp}</div>
      </div>
    `
        : ''
    }

    ${
      data.additionalInstructions
        ? `
      <div class="block-section">
        <div class="section-title">Additional Instructions:</div>
        <div class="section-content">${data.additionalInstructions}</div>
      </div>
    `
        : ''
    }

    <!-- Footer -->
    <div class="footer">
      <div class="signature-section">
        <div class="signature-line">
          <div style="font-weight: bold; margin-bottom: 5px;">Signature</div>
          <div>Dr. ${data.doctorName}${
            data.doctorQualification ? ` ${data.doctorQualification}` : ''
          }</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
