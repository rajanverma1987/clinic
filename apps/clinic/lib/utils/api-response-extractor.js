/**
 * Utility functions for extracting data from API responses
 * Handles various response structures consistently
 */

/**
 * Extract array data from API response
 * Handles multiple response structures:
 * - Direct array: { success: true, data: [...] }
 * - Paginated: { success: true, data: { data: [...], pagination: {...} } }
 * - Nested: { success: true, data: { patients: [...] } }
 *
 * @param {Object} response - API response object
 * @param {string} nestedKey - Optional key to extract from nested object (e.g., 'patients', 'items')
 * @returns {Array} Extracted array data or empty array
 */
export function extractArrayData(response, nestedKey = null) {
  if (!response || !response.success || !response.data) {
    return [];
  }

  const data = response.data;

  // Direct array
  if (Array.isArray(data)) {
    return data;
  }

  // Nested key (e.g., data.patients)
  if (nestedKey && data[nestedKey] && Array.isArray(data[nestedKey])) {
    return data[nestedKey];
  }

  // Paginated structure (data.data)
  if (data.data && Array.isArray(data.data)) {
    return data.data;
  }

  // If it's an object but not an array, return empty
  if (typeof data === 'object' && !Array.isArray(data)) {
    return [];
  }

  return [];
}

/**
 * Extract single object from API response
 *
 * @param {Object} response - API response object
 * @returns {Object|null} Extracted object or null
 */
export function extractObjectData(response) {
  if (!response || !response.success || !response.data) {
    return null;
  }

  const data = response.data;

  // Direct object
  if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
    return data;
  }

  // Nested in data.data
  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return data.data;
  }

  return null;
}

/**
 * Extract pagination info from API response
 *
 * @param {Object} response - API response object
 * @returns {Object} Pagination info with default values
 */
export function extractPaginationData(response) {
  if (!response || !response.success || !response.data) {
    return {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
      pages: 1,
      hasNext: false,
      hasPrev: false,
    };
  }

  const data = response.data;

  // Pagination in data.pagination
  if (data.pagination) {
    const totalPages = data.pagination.totalPages || 1;
    return {
      page: data.pagination.page || 1,
      limit: data.pagination.limit || 20,
      total: data.pagination.total || 0,
      totalPages,
      pages: totalPages,
      hasNext: data.pagination.hasNext || false,
      hasPrev: data.pagination.hasPrev || false,
    };
  }

  // Default values
  return {
    page: 1,
    limit: 20,
    total: Array.isArray(data) ? data.length : data.data?.length || 0,
    totalPages: 1,
    pages: 1,
    hasNext: false,
    hasPrev: false,
  };
}
