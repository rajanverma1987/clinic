/**
 * PDF Generator Utility
 * Generates PDF invoices and documents
 */

// Note: For server-side PDF generation, we'll use a simple approach
// For production, consider using libraries like pdfkit, puppeteer, or a service

/**
 * Generate invoice PDF (simplified version)
 * Returns PDF data as base64 string
 * 
 * For full implementation, use a proper PDF library like:
 * - pdfkit (Node.js)
 * - puppeteer (HTML to PDF)
 * - jsPDF (client-side)
 */
export async function generateInvoicePDF(invoice, tenant, patient) {
  // This is a placeholder - implement with actual PDF library
  // For now, return a JSON representation that can be converted to PDF

  const invoiceData = {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    patient: {
      name: `${patient.firstName} ${patient.lastName}`,
      address: patient.address,
      phone: patient.phone,
      email: patient.email
    },
    clinic: {
      name: tenant.name,
      address: tenant.settings?.address,
      phone: tenant.settings?.phone,
      email: tenant.settings?.email
    },
    items: invoice.items.map(item => ({
      description: item.description || item.drugName || item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      tax: item.totalWithTax - item.total
    })),
    subtotal: invoice.subtotal,
    totalDiscount: invoice.totalDiscount,
    totalTax: invoice.totalTax,
    totalAmount: invoice.totalAmount,
    paidAmount: invoice.paidAmount,
    balanceAmount: invoice.balanceAmount,
    currency: invoice.currency,
    taxBreakdown: invoice.taxBreakdown,
    notes: invoice.notes
  };

  // Return structured data - actual PDF generation should be implemented
  // using a proper library based on your needs
  return {
    data: invoiceData,
    message: 'PDF generation requires a PDF library. Install pdfkit or puppeteer for full implementation.'
  };
}

/**
 * Generate simple text invoice (fallback)
 */
export function generateInvoiceText(invoice, tenant, patient) {
  let text = `
INVOICE
${tenant.name || 'Clinic'}

Invoice Number: ${invoice.invoiceNumber}
Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}
${invoice.dueDate ? `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}` : ''}

BILL TO:
${patient.firstName} ${patient.lastName}
${patient.address || ''}
${patient.phone ? `Phone: ${patient.phone}` : ''}
${patient.email ? `Email: ${patient.email}` : ''}

ITEMS:
`;

  invoice.items.forEach((item, index) => {
    text += `
${index + 1}. ${item.description || item.drugName || item.name}
   Quantity: ${item.quantity} ${item.unit || ''}
   Unit Price: ${formatCurrency(item.unitPrice, invoice.currency)}
   Total: ${formatCurrency(item.total, invoice.currency)}
`;
  });

  text += `
SUBTOTAL: ${formatCurrency(invoice.subtotal, invoice.currency)}
${invoice.totalDiscount > 0 ? `DISCOUNT: -${formatCurrency(invoice.totalDiscount, invoice.currency)}` : ''}
TAX: ${formatCurrency(invoice.totalTax, invoice.currency)}
TOTAL: ${formatCurrency(invoice.totalAmount, invoice.currency)}
PAID: ${formatCurrency(invoice.paidAmount, invoice.currency)}
BALANCE: ${formatCurrency(invoice.balanceAmount, invoice.currency)}
`;

  if (invoice.notes) {
    text += `\nNOTES: ${invoice.notes}\n`;
  }

  return text;
}

/**
 * Format currency
 */
function formatCurrency(amount, currency = 'USD') {
  const major = Math.abs(amount) / 100;
  const sign = amount < 0 ? '-' : '';
  const symbol = getCurrencySymbol(currency);
  return `${sign}${symbol}${major.toFixed(2)}`;
}

/**
 * Get currency symbol
 */
function getCurrencySymbol(currency) {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$'
  };
  return symbols[currency] || currency;
}
