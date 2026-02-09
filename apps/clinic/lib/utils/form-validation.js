/**
 * Custom Form Validation Utility
 * Replaces browser default validation with custom toast notifications
 */

import { showError, showWarning, showInfo } from './toast';

/**
 * Validation rules
 */
const validationRules = {
  required: (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName || 'This field'} is required`;
    }
    return null;
  },
  email: (value, fieldName) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `Please enter a valid email address`;
    }
    return null;
  },
  minLength: (value, minLength, fieldName) => {
    if (value && value.length < minLength) {
      return `${fieldName || 'This field'} must be at least ${minLength} characters`;
    }
    return null;
  },
  maxLength: (value, maxLength, fieldName) => {
    if (value && value.length > maxLength) {
      return `${fieldName || 'This field'} must be no more than ${maxLength} characters`;
    }
    return null;
  },
  password: (value, fieldName) => {
    if (!value) {
      return `${fieldName || 'Password'} is required`;
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return null;
  },
  match: (value, matchValue, fieldName) => {
    if (value !== matchValue) {
      return `${fieldName || 'Fields'} do not match`;
    }
    return null;
  },
  phone: (value, fieldName) => {
    if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
      return `Please enter a valid phone number`;
    }
    return null;
  },
  number: (value, fieldName) => {
    if (value && isNaN(value)) {
      return `${fieldName || 'This field'} must be a number`;
    }
    return null;
  },
  min: (value, min, fieldName) => {
    if (value && parseFloat(value) < min) {
      return `${fieldName || 'This field'} must be at least ${min}`;
    }
    return null;
  },
  max: (value, max, fieldName) => {
    if (value && parseFloat(value) > max) {
      return `${fieldName || 'This field'} must be no more than ${max}`;
    }
    return null;
  },
};

/**
 * Validate a single field
 */
export function validateField(value, rules, fieldName) {
  if (!rules || rules.length === 0) return null;

  for (const rule of rules) {
    let error = null;
    
    if (typeof rule === 'function') {
      error = rule(value, fieldName);
    } else if (typeof rule === 'string') {
      error = validationRules[rule]?.(value, fieldName);
    } else if (typeof rule === 'object' && rule.type) {
      const ruleFunc = validationRules[rule.type];
      if (ruleFunc) {
        error = ruleFunc(value, rule.value || rule.min || rule.max, fieldName);
      }
    }

    if (error) {
      return error;
    }
  }

  return null;
}

/**
 * Validate a form and show custom toast notifications
 */
export function validateForm(formElement, showToasts = true) {
  const errors = {};
  const fields = formElement.querySelectorAll('input[data-validate], textarea[data-validate], select[data-validate]');
  
  let firstError = null;
  let firstErrorField = null;

  fields.forEach((field) => {
    const rules = field.getAttribute('data-validate')?.split(',') || [];
    const fieldName = field.getAttribute('data-field-name') || field.getAttribute('name') || field.getAttribute('id') || 'Field';
    const isRequired = field.hasAttribute('data-required') || field.hasAttribute('required');
    
    let fieldRules = [...rules];
    
    // Add required rule if field has required attribute
    if (isRequired && !rules.includes('required')) {
      fieldRules.unshift('required');
    }

    // Add email validation if type is email
    if (field.type === 'email' && !rules.includes('email')) {
      fieldRules.push('email');
    }

    // Add password validation if type is password
    if (field.type === 'password' && !rules.includes('password')) {
      fieldRules.push('password');
    }

    const error = validateField(field.value, fieldRules, fieldName);
    
    if (error) {
      errors[field.name || field.id] = error;
      
      // Track first error for focus
      if (!firstError) {
        firstError = error;
        firstErrorField = field;
      }

      // Show toast notification
      if (showToasts) {
        showError(error);
      }
    }
  });

  // Focus on first error field
  if (firstErrorField) {
    firstErrorField.focus();
    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError,
  };
}

/**
 * Validate form on submit and prevent default if invalid
 */
export function handleFormSubmit(e, customValidation, showToasts = true) {
  e.preventDefault();
  
  const form = e.target;
  
  // Run custom validation if provided
  if (customValidation) {
    const customResult = customValidation();
    if (!customResult.isValid) {
      if (showToasts && customResult.firstError) {
        showError(customResult.firstError);
      }
      return false;
    }
  }

  // Run standard validation
  const validationResult = validateForm(form, showToasts);
  
  if (!validationResult.isValid) {
    return false;
  }

  // If validation passes, allow form submission
  return true;
}

/**
 * Setup form to use custom validation
 */
export function setupCustomValidation(formElement) {
  // Prevent browser default validation
  formElement.setAttribute('novalidate', 'novalidate');
  
  // Add submit handler
  formElement.addEventListener('submit', (e) => {
    const isValid = validateForm(formElement, true).isValid;
    if (!isValid) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });

  // Optional: Validate on blur for better UX
  const fields = formElement.querySelectorAll('input, textarea, select');
  fields.forEach((field) => {
    field.addEventListener('blur', () => {
      if (field.hasAttribute('data-validate') || field.hasAttribute('required')) {
        const rules = field.getAttribute('data-validate')?.split(',') || [];
        const fieldName = field.getAttribute('data-field-name') || field.getAttribute('name') || field.getAttribute('id') || 'Field';
        const isRequired = field.hasAttribute('data-required') || field.hasAttribute('required');
        
        let fieldRules = [...rules];
        if (isRequired && !rules.includes('required')) {
          fieldRules.unshift('required');
        }
        if (field.type === 'email' && !rules.includes('email')) {
          fieldRules.push('email');
        }

        const error = validateField(field.value, fieldRules, fieldName);
        if (error) {
          // Show error in field (if using Input component)
          const inputComponent = field.closest('[data-input-wrapper]');
          if (inputComponent) {
            // Update error state
            field.setAttribute('data-error', error);
          }
        } else {
          field.removeAttribute('data-error');
        }
      }
    });
  });
}

export default {
  validateField,
  validateForm,
  handleFormSubmit,
  setupCustomValidation,
  rules: validationRules,
};
