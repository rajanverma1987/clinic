/**
 * Enterprise API Versioning Middleware
 * Supports API versioning via headers and URL paths
 */

import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/utils/api-response.js';
import { logger } from '@/lib/utils/logger.js';

const SUPPORTED_VERSIONS = ['v1'];
const DEFAULT_VERSION = 'v1';

/**
 * Extract API version from request
 */
function getApiVersion(req) {
  // Check Accept header: application/vnd.api+json;version=1
  const acceptHeader = req.headers.get('accept') || '';
  const versionMatch = acceptHeader.match(/version[=:](\d+)/i);
  if (versionMatch) {
    return `v${versionMatch[1]}`;
  }
  
  // Check custom header: X-API-Version
  const customHeader = req.headers.get('x-api-version');
  if (customHeader) {
    return customHeader.startsWith('v') ? customHeader : `v${customHeader}`;
  }
  
  // Check URL path: /api/v1/...
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const versionIndex = pathParts.indexOf('api') + 1;
  if (versionIndex > 0 && pathParts[versionIndex]?.startsWith('v')) {
    return pathParts[versionIndex];
  }
  
  return DEFAULT_VERSION;
}

/**
 * API versioning middleware
 */
export function withApiVersion(handler) {
  return async (req, ...args) => {
    const version = getApiVersion(req);
    
    // Validate version
    if (!SUPPORTED_VERSIONS.includes(version)) {
      logger.warn('Unsupported API version requested', {
        version,
        url: req.url,
        supportedVersions: SUPPORTED_VERSIONS,
      });
      
      return NextResponse.json(
        errorResponse(
          `Unsupported API version: ${version}. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
          'UNSUPPORTED_API_VERSION'
        ),
        {
          status: 400,
          headers: {
            'X-Supported-Versions': SUPPORTED_VERSIONS.join(', '),
            'X-API-Version': DEFAULT_VERSION,
          },
        }
      );
    }
    
    // Add version to request context
    req.apiVersion = version;
    
    // Add version headers to response
    const result = await handler(req, ...args);
    
    if (result instanceof NextResponse) {
      result.headers.set('X-API-Version', version);
      result.headers.set('X-Supported-Versions', SUPPORTED_VERSIONS.join(', '));
    }
    
    return result;
  };
}

/**
 * Get current API version from request
 */
export function getCurrentApiVersion(req) {
  return req?.apiVersion || DEFAULT_VERSION;
}
