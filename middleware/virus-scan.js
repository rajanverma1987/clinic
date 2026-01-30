/**
 * Virus Scan Middleware
 * Scans uploaded files for viruses
 * Based on NEW-PLANS.md requirements
 */

import { scanFile, isFileTypeAllowed, validateFileSize } from '@/lib/security/virus-scanner.js';

/**
 * Middleware to scan uploaded files
 */
export async function scanUploadedFile(file, options = {}) {
  const { maxSizeMB = 10, allowedTypes = [] } = options;

  // Validate file type
  if (!isFileTypeAllowed(file.name, allowedTypes)) {
    throw new Error(`File type not allowed: ${file.name}`);
  }

  // Validate file size
  if (!validateFileSize(file.size, maxSizeMB)) {
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Scan for viruses
  const scanResult = await scanFile(buffer, file.name);

  if (!scanResult.clean) {
    throw new Error('File failed virus scan');
  }

  return {
    ...scanResult,
    file,
    buffer,
  };
}

export default scanUploadedFile;
