/**
 * Input Sanitization Utilities
 * Prevents XSS, SQL injection, and other injection attacks
 * Based on NEW-PLANS.md security requirements
 */

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized.trim();
}

/**
 * Sanitize object recursively
 * @param {any} input - Input to sanitize
 * @param {Array<string>} allowedFields - Fields to keep (if provided)
 * @returns {any} - Sanitized object
 */
export function sanitizeObject(input, allowedFields = null) {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeString(input);
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item, allowedFields));
  }

  if (typeof input === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      // Skip if field not in allowed list (if provided)
      if (allowedFields && !allowedFields.includes(key)) {
        continue;
      }
      
      // Sanitize key
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value, allowedFields);
    }
    return sanitized;
  }

  return input;
}

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return '';
  }

  // Remove whitespace and convert to lowercase
  const sanitized = email.trim().toLowerCase();
  
  // Basic email validation pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  return sanitized;
}

/**
 * Sanitize phone number
 * @param {string} phone - Phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
export function sanitizePhone(phone) {
  if (typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters except +
  const sanitized = phone.replace(/[^\d+]/g, '');
  
  // Basic validation (at least 10 digits)
  if (sanitized.replace(/\+/g, '').length < 10) {
    throw new Error('Invalid phone number format');
  }

  return sanitized;
}

/**
 * Sanitize URL
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol');
    }

    return parsed.toString();
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}

/**
 * Sanitize MongoDB ObjectId
 * @param {string} id - ObjectId to sanitize
 * @returns {string} - Sanitized ObjectId
 */
export function sanitizeObjectId(id) {
  if (typeof id !== 'string') {
    return '';
  }

  // MongoDB ObjectId is 24 hex characters
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  
  if (!objectIdPattern.test(id)) {
    throw new Error('Invalid ObjectId format');
  }

  return id;
}

/**
 * Remove potentially dangerous characters from search queries
 * @param {string} query - Search query to sanitize
 * @returns {string} - Sanitized search query
 */
export function sanitizeSearchQuery(query) {
  if (typeof query !== 'string') {
    return '';
  }

  // Remove special regex characters that could cause issues
  const sanitized = query
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
    .trim()
    .substring(0, 200); // Limit length

  return sanitized;
}

/**
 * Validate and sanitize date input
 * @param {string|Date} date - Date to sanitize
 * @returns {Date} - Valid Date object
 */
export function sanitizeDate(date) {
  if (date instanceof Date) {
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date;
  }

  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new Error('Invalid date format');
    }
    return parsed;
  }

  throw new Error('Date must be a string or Date object');
}
