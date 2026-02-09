/**
 * Compress large API responses with gzip. Use in route handlers that return big JSON.
 * Do not set Content-Encoding in middleware without compressing the body (clients would break).
 * Next.js compress: true (next.config.js) already compresses many responses; use this when
 * you need explicit control (e.g. very large JSON) or when response is built in a route.
 */

import zlib from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(zlib.gzip);

/**
 * Minimum size (bytes) before we bother compressing. Below this, gzip overhead isn't worth it.
 */
const MIN_COMPRESS_BYTES = 1024;

/**
 * Return a gzip-compressed Response for large JSON. Uses Node zlib (no pako dependency).
 * @param {object} data - Data to send (will be JSON.stringify'd then gzipped)
 * @param {object} [options] - Optional { status, headers }
 * @param {number} [options.minBytes=1024] - Only compress if string length >= this
 * @returns {Promise<Response>}
 */
async function compressedJsonResponse(data, options = {}) {
  const { status = 200, headers: extraHeaders = {}, minBytes = MIN_COMPRESS_BYTES } = options;
  const json = JSON.stringify(data);
  const bytes = Buffer.byteLength(json, 'utf8');

  if (bytes < minBytes) {
    return new Response(json, {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
    });
  }

  const compressed = await gzipAsync(Buffer.from(json, 'utf8'));
  return new Response(compressed, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip',
      'Content-Length': String(compressed.length),
      ...extraHeaders,
    },
  });
}

export { compressedJsonResponse, MIN_COMPRESS_BYTES };
