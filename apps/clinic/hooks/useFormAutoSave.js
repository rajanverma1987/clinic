import { useEffect, useRef } from 'react';

/**
 * Custom hook to auto-save form data to localStorage
 * @param {Object} options Configuration options
 * @param {Object} options.formData Form data to save
 * @param {string} options.formKey Unique key for this form
 * @param {boolean} options.enabled Whether auto-save is enabled
 * @param {number} options.debounceMs Debounce delay in milliseconds
 */
export function useFormAutoSave({
  formData,
  formKey,
  enabled = true,
  debounceMs = 1000,
}) {
  const timeoutRef = useRef(null);
  const isSubmittingRef = useRef(false);

  // Save form data to localStorage with debounce
  useEffect(() => {
    if (!enabled || isSubmittingRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`form_draft_${formKey}`, JSON.stringify(formData));
      } catch (_error) {
        // Draft save failed
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, formKey, enabled, debounceMs]);

  // Load form data from localStorage
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(`form_draft_${formKey}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_error) {
      // Draft load failed
    }
    return null;
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    try {
      localStorage.removeItem(`form_draft_${formKey}`);
    } catch (_error) {
      // Draft clear failed
    }
  };

  // Mark form as submitting (to prevent saving during submit)
  const setSubmitting = (value) => {
    isSubmittingRef.current = value;
    if (value) {
      clearDraft();
    }
  };

  return {
    loadDraft,
    clearDraft,
    setSubmitting,
  };
}

