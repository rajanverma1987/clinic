/**
 * Standard API response wrapper
 * All API responses follow: { success, data, error }
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(
  message: string,
  code?: string,
  details?: any
): ApiResponse {
  return {
    success: false,
    error: {
      message,
      code,
      details,
    },
  };
}

/**
 * Format Zod validation errors into user-friendly messages
 */
export function formatValidationErrors(zodErrors: any[]): string {
  if (!zodErrors || zodErrors.length === 0) {
    return 'Validation failed. Please check your input.';
  }

  const messages = zodErrors.map((err) => {
    const path = err.path.join('.');
    const fieldName = path || 'field';
    
    // Format field name to be more readable (e.g., "firstName" -> "First Name")
    const readableFieldName = fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    // Get specific error message
    let errorMessage = err.message;
    
    // Provide more specific messages based on error code
    if (err.code === 'invalid_type') {
      if (err.received === 'undefined') {
        errorMessage = `${readableFieldName} is required`;
      } else {
        errorMessage = `${readableFieldName} must be ${err.expected}, but received ${err.received}`;
      }
    } else if (err.code === 'invalid_string') {
      if (err.validation === 'email') {
        errorMessage = `${readableFieldName} must be a valid email address`;
      } else if (err.validation === 'datetime') {
        errorMessage = `${readableFieldName} must be a valid date`;
      } else if (err.validation === 'uuid') {
        errorMessage = `${readableFieldName} must be a valid ID`;
      } else {
        errorMessage = `${readableFieldName} is invalid: ${err.message}`;
      }
    } else if (err.code === 'too_small') {
      if (err.type === 'string') {
        errorMessage = `${readableFieldName} must be at least ${err.minimum} characters`;
      } else if (err.type === 'number') {
        errorMessage = `${readableFieldName} must be at least ${err.minimum}`;
      } else {
        errorMessage = `${readableFieldName} is too short`;
      }
    } else if (err.code === 'too_big') {
      if (err.type === 'string') {
        errorMessage = `${readableFieldName} must be no more than ${err.maximum} characters`;
      } else if (err.type === 'number') {
        errorMessage = `${readableFieldName} must be no more than ${err.maximum}`;
      } else {
        errorMessage = `${readableFieldName} is too long`;
      }
    } else if (err.code === 'invalid_enum_value') {
      errorMessage = `${readableFieldName} must be one of: ${err.options?.join(', ') || 'valid options'}`;
    } else if (err.code === 'custom') {
      errorMessage = err.message || `${readableFieldName} is invalid`;
    } else {
      // Use the original message but make it more readable
      errorMessage = `${readableFieldName}: ${err.message}`;
    }

    return errorMessage;
  });

  // If there's only one error, return it directly
  if (messages.length === 1) {
    return messages[0];
  }

  // If there are multiple errors, format them as a list
  return `Please fix the following errors:\n${messages.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n')}`;
}

/**
 * Create a user-friendly validation error response from Zod errors
 */
export function validationErrorResponse(zodErrors: any[]): ApiResponse {
  const message = formatValidationErrors(zodErrors);
  return errorResponse(message, 'VALIDATION_ERROR', zodErrors);
}

/**
 * Handle MongoDB errors and return user-friendly messages
 */
export function handleMongoError(error: any): ApiResponse {
  // Never return raw MongoDB errors
  if (error.name === 'ValidationError') {
    // Format Mongoose validation errors
    const errorMessages: string[] = [];
    for (const field in error.errors) {
      const fieldError = error.errors[field];
      const fieldName = field
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
      
      if (fieldError.kind === 'required') {
        errorMessages.push(`${fieldName} is required`);
      } else if (fieldError.kind === 'enum') {
        errorMessages.push(`${fieldName} must be one of the allowed values`);
      } else if (fieldError.kind === 'minlength') {
        errorMessages.push(`${fieldName} must be at least ${fieldError.properties.minlength} characters`);
      } else if (fieldError.kind === 'maxlength') {
        errorMessages.push(`${fieldName} must be no more than ${fieldError.properties.maxlength} characters`);
      } else {
        errorMessages.push(`${fieldName}: ${fieldError.message}`);
      }
    }
    
    const message = errorMessages.length === 1 
      ? errorMessages[0]
      : `Please fix the following errors:\n${errorMessages.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n')}`;
    
    return errorResponse(message, 'VALIDATION_ERROR', error.errors);
  }

  if (error.name === 'CastError') {
    const fieldName = error.path 
      ? error.path.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim()
      : 'Field';
    return errorResponse(`${fieldName} has an invalid format`, 'INVALID_FORMAT');
  }

  if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyPattern)[0];
    const fieldName = field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
    return errorResponse(
      `${fieldName} already exists. Please use a different value.`,
      'DUPLICATE_ERROR'
    );
  }

  // Generic error
  return errorResponse(
    error.message || 'An error occurred while processing your request',
    'INTERNAL_ERROR'
  );
}

