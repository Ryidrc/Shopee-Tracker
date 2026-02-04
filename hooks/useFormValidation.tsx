
import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null; // Return error message or null if valid
}

export interface FieldError {
  message: string;
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'custom';
}

export interface FormErrors {
  [key: string]: FieldError | undefined;
}

export interface UseFormValidationResult<T> {
  values: T;
  errors: FormErrors;
  touched: { [key: string]: boolean };
  isValid: boolean;
  setValue: (field: keyof T, value: any) => void;
  setTouched: (field: keyof T) => void;
  validateField: (field: keyof T) => FieldError | undefined;
  validateAll: () => boolean;
  reset: () => void;
  getFieldProps: (field: keyof T) => {
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    className: string;
  };
  getErrorMessage: (field: keyof T) => string | undefined;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule>>
): UseFormValidationResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouchedState] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback((field: keyof T): FieldError | undefined => {
    const rules = validationRules[field];
    const value = values[field];

    if (!rules) return undefined;

    // Required check
    if (rules.required) {
      const isEmpty = value === undefined || value === null || value === '' || 
                      (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        return { message: 'This field is required', type: 'required' };
      }
    }

    // String length checks
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return { message: `Minimum ${rules.minLength} characters required`, type: 'minLength' };
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return { message: `Maximum ${rules.maxLength} characters allowed`, type: 'maxLength' };
      }
    }

    // Number range checks
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return { message: `Minimum value is ${rules.min}`, type: 'min' };
      }
      if (rules.max !== undefined && value > rules.max) {
        return { message: `Maximum value is ${rules.max}`, type: 'max' };
      }
    }

    // Pattern check
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      return { message: 'Invalid format', type: 'pattern' };
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return { message: customError, type: 'custom' };
      }
    }

    return undefined;
  }, [values, validationRules]);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user types
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const setTouched = useCallback((field: keyof T) => {
    setTouchedState(prev => ({ ...prev, [field]: true }));
    
    // Validate on blur
    const error = validateField(field);
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, [validateField]);

  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(validationRules) as Array<keyof T>).forEach(field => {
      const error = validateField(field);
      if (error) {
        newErrors[field as string] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    
    // Mark all fields as touched
    const allTouched: { [key: string]: boolean } = {};
    Object.keys(validationRules).forEach(field => {
      allTouched[field] = true;
    });
    setTouchedState(allTouched);

    return isValid;
  }, [validationRules, validateField]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedState({});
  }, [initialValues]);

  const getFieldProps = useCallback((field: keyof T) => ({
    value: values[field] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
      setValue(field, value);
    },
    onBlur: () => setTouched(field),
    className: touched[field as string] && errors[field as string] ? 'input-error' : '',
  }), [values, touched, errors, setValue, setTouched]);

  const getErrorMessage = useCallback((field: keyof T): string | undefined => {
    return touched[field as string] ? errors[field as string]?.message : undefined;
  }, [touched, errors]);

  const isValid = Object.keys(errors).every(key => !errors[key]);

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setTouched,
    validateField,
    validateAll,
    reset,
    getFieldProps,
    getErrorMessage,
  };
}

// Helper component for displaying field errors
export const FieldError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="error-message animate-fade-in">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </div>
  );
};

// Import React for the FieldError component
import React from 'react';

export default useFormValidation;
