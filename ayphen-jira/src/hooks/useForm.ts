import { useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { validate } from '../utils/validation';
import type { ValidationRules, ValidationErrors } from '../utils/validation';

interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: ValidationRules;
  onSubmit: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface UseFormReturn<T> {
  values: T;
  errors: ValidationErrors;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (field: keyof T) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  resetForm: () => void;
  validateField: (field: keyof T) => void;
  validateForm: () => boolean;
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
}: UseFormOptions<T>): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((field: keyof T) => {
    if (!validationRules[field as string]) return;

    const fieldErrors = validate(
      { [field]: values[field] },
      { [field]: validationRules[field as string] }
    );

    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors[field as string] || '',
    }));
  }, [values, validationRules]);

  const validateForm = useCallback((): boolean => {
    const formErrors = validate(values, validationRules);
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  }, [values, validationRules]);

  const handleChange = useCallback((field: keyof T) => {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : e.target.value;

      setValues(prev => ({
        ...prev,
        [field]: value,
      }));

      if (validateOnChange) {
        setTimeout(() => validateField(field), 0);
      }
    };
  }, [validateOnChange, validateField]);

  const handleBlur = useCallback((field: keyof T) => {
    return () => {
      setTouched(prev => ({
        ...prev,
        [field]: true,
      }));

      if (validateOnBlur) {
        validateField(field);
      }
    };
  }, [validateOnBlur, validateField]);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));

    if (validateOnChange) {
      setTimeout(() => validateField(field), 0);
    }
  }, [validateOnChange, validateField]);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean) => {
    setTouched(prev => ({
      ...prev,
      [field]: isTouched,
    }));
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => ({
      ...acc,
      [key]: true,
    }), {} as Record<keyof T, boolean>);
    setTouched(allTouched);

    // Validate form
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    // Submit
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({} as Record<keyof T, boolean>);
    setIsSubmitting(false);
  }, [initialValues]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    validateField,
    validateForm,
  };
};
