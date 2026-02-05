/**
 * Route-based validation helpers using ROUTE_VALIDATION from route-security.
 * Use for file uploads and route-specific rules (e.g. /invoices/new, /patients/:id/upload).
 */

import { ROUTE_VALIDATION } from '@/lib/constants/route-security';

const SIZE_SUFFIX = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };

/**
 * Parse maxFileSize string (e.g. '10MB', '5MB') to bytes.
 * @param {string} sizeStr
 * @returns {number} bytes
 */
export function parseMaxFileSize(sizeStr) {
  if (!sizeStr || typeof sizeStr !== 'string') return 0;
  const match = sizeStr
    .trim()
    .toUpperCase()
    .match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const suffix = (match[2] || 'B').replace(/^B$/, 'B');
  const mult = SIZE_SUFFIX[suffix] ?? 1;
  return Math.floor(num * mult);
}

/**
 * Get validation config for a path. Supports :id-style segments.
 * @param {string} path - e.g. '/patients/123/upload' or '/invoices/new'
 * @returns {Object|null} ROUTE_VALIDATION entry or null
 */
export function getValidationForPath(path) {
  if (!path) return null;
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/';
  for (const [pattern, config] of Object.entries(ROUTE_VALIDATION)) {
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
    if (regex.test(normalized)) return config;
  }
  return null;
}

/**
 * Validate a file against route validation config.
 * @param {string} routePath - path used for lookup (e.g. '/patients/:id/upload')
 * @param {File|{ size: number, type?: string, name?: string }} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFileForRoute(routePath, file) {
  const config = getValidationForPath(routePath) ?? ROUTE_VALIDATION[routePath];
  if (!config) return { valid: true };

  if (config.maxFileSize) {
    const maxBytes = parseMaxFileSize(config.maxFileSize);
    if (maxBytes > 0 && file.size > maxBytes) {
      return { valid: false, error: `File size exceeds ${config.maxFileSize} limit` };
    }
  }

  if (config.allowedFileTypes && config.allowedFileTypes.length) {
    const allowed = config.allowedFileTypes.map((t) => t.toLowerCase());
    const isMimeList = allowed.some((a) => a.includes('/'));
    const mime = (file.type || '').toLowerCase();
    const ext = (file.name || '').split('.').pop()?.toLowerCase();
    const ok = isMimeList
      ? mime &&
        allowed.some((a) => mime === a || (a.startsWith('image/') && mime.startsWith('image/')))
      : ext && allowed.includes(ext);
    if (!ok) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${config.allowedFileTypes.join(', ')}`,
      };
    }
  }

  return { valid: true };
}
