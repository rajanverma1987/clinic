/**
 * CSV Export Utility
 * Converts data arrays to CSV format
 */

/**
 * Escape CSV field value
 */
function escapeCSVField(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV(data, headers) {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Build CSV
  const rows = [];
  
  // Header row
  rows.push(csvHeaders.map(escapeCSVField).join(','));

  // Data rows
  data.forEach((row) => {
    const values = csvHeaders.map((header) => escapeCSVField(row[header]));
    rows.push(values.join(','));
  });
  
  return rows.join('\n');
}

/**
 * Convert report data to CSV format
 */
export function reportToCSV(reportData, reportType) {
  const rows = [];
  
  // Add report header
  rows.push(`Report Type: ${reportType}`);
  rows.push(`Generated: ${new Date().toISOString()}`);
  rows.push('');
  
  // Add summary
  if (reportData.summary) {
    rows.push('Summary');
    Object.entries(reportData.summary).forEach(([key, value]) => {
      rows.push(`${key},${escapeCSVField(value)}`);
    });
    rows.push('');
  }
  
  // Add breakdown
  if (reportData.breakdown) {
    rows.push('Breakdown');
    Object.entries(reportData.breakdown).forEach(([category, data]) => {
      rows.push(`\n${category}`);
      if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([key, value]) => {
          rows.push(`${key},${escapeCSVField(value)}`);
        });
      }
    });
    rows.push('');
  }
  
  // Add time series
  if (reportData.timeSeries && Array.isArray(reportData.timeSeries)) {
    rows.push('Time Series');
    if (reportData.timeSeries.length > 0) {
      const timeSeriesHeaders = Object.keys(reportData.timeSeries[0]);
      rows.push(timeSeriesHeaders.join(','));
      reportData.timeSeries.forEach((item) => {
        rows.push(timeSeriesHeaders.map((h) => escapeCSVField(item[h])).join(','));
      });
    }
    rows.push('');
  }
  
  // Add detailed data (low stock, expired items, etc.)
  if (reportData.lowStockItems && Array.isArray(reportData.lowStockItems)) {
    rows.push('Low Stock Items');
    rows.push('Name,Current Stock,Threshold');
    reportData.lowStockItems.forEach((item) => {
      rows.push(`${escapeCSVField(item.name)},${item.currentStock},${item.threshold}`);
    });
    rows.push('');
  }
  
  if (reportData.expiredItems && Array.isArray(reportData.expiredItems)) {
    rows.push('Expired Items');
    rows.push('Item Name,Batch Number,Expiry Date,Quantity');
    reportData.expiredItems.forEach((item) => {
      rows.push(
        `${escapeCSVField(item.itemName)},${escapeCSVField(item.batchNumber)},${escapeCSVField(item.expiryDate)},${item.quantity}`
      );
    });
    rows.push('');
  }
  
  if (reportData.predictions && Array.isArray(reportData.predictions)) {
    rows.push('Inventory Predictions');
    rows.push('Item Name,Current Stock,Reorder Point,Predicted Reorder Days,Daily Consumption');
    reportData.predictions.forEach((pred) => {
      rows.push(
        `${escapeCSVField(pred.itemName)},${pred.currentStock},${pred.reorderPoint},${pred.predictedReorderDays},${pred.dailyConsumption}`
      );
    });
    rows.push('');
  }
  
  return rows.join('\n');
}

