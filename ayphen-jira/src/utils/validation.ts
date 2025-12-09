export interface ValidationRule {
  required?: boolean | string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  min?: { value: number; message: string };
  max?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  email?: boolean | string;
  url?: boolean | string;
  custom?: (value: any) => string | undefined;
}

export interface ValidationRules {
  [field: string]: ValidationRule;
}

export interface ValidationErrors {
  [field: string]: string;
}

export const validate = (
  values: Record<string, any>,
  rules: ValidationRules
): ValidationErrors => {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach(field => {
    const value = values[field];
    const rule = rules[field];

    // Required validation
    if (rule.required) {
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        errors[field] = typeof rule.required === 'string' 
          ? rule.required 
          : 'This field is required';
        return;
      }
    }

    // Skip other validations if value is empty and not required
    if (!value && !rule.required) return;

    // MinLength validation
    if (rule.minLength && typeof value === 'string') {
      if (value.length < rule.minLength.value) {
        errors[field] = rule.minLength.message;
        return;
      }
    }

    // MaxLength validation
    if (rule.maxLength && typeof value === 'string') {
      if (value.length > rule.maxLength.value) {
        errors[field] = rule.maxLength.message;
        return;
      }
    }

    // Min validation (for numbers)
    if (rule.min && typeof value === 'number') {
      if (value < rule.min.value) {
        errors[field] = rule.min.message;
        return;
      }
    }

    // Max validation (for numbers)
    if (rule.max && typeof value === 'number') {
      if (value > rule.max.value) {
        errors[field] = rule.max.message;
        return;
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.value.test(value)) {
        errors[field] = rule.pattern.message;
        return;
      }
    }

    // Email validation
    if (rule.email && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[field] = typeof rule.email === 'string' 
          ? rule.email 
          : 'Please enter a valid email address';
        return;
      }
    }

    // URL validation
    if (rule.url && typeof value === 'string') {
      try {
        new URL(value);
      } catch {
        errors[field] = typeof rule.url === 'string' 
          ? rule.url 
          : 'Please enter a valid URL';
        return;
      }
    }

    // Custom validation
    if (rule.custom) {
      const error = rule.custom(value);
      if (error) {
        errors[field] = error;
      }
    }
  });

  return errors;
};

// Common validation rules
export const commonRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    required: message,
  }),

  email: (message = 'Please enter a valid email'): ValidationRule => ({
    email: message,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    minLength: {
      value: length,
      message: message || `Must be at least ${length} characters`,
    },
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    maxLength: {
      value: length,
      message: message || `Must be no more than ${length} characters`,
    },
  }),

  min: (value: number, message?: string): ValidationRule => ({
    min: {
      value,
      message: message || `Must be at least ${value}`,
    },
  }),

  max: (value: number, message?: string): ValidationRule => ({
    max: {
      value,
      message: message || `Must be no more than ${value}`,
    },
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    pattern: {
      value: regex,
      message,
    },
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    url: message,
  }),

  custom: (validator: (value: any) => string | undefined): ValidationRule => ({
    custom: validator,
  }),
};

// Combine multiple rules
export const combineRules = (...rules: ValidationRule[]): ValidationRule => {
  return rules.reduce((acc, rule) => ({ ...acc, ...rule }), {});
};

// Preset validation rules for common fields
export const presetRules = {
  issueTitle: combineRules(
    commonRules.required('Title is required'),
    commonRules.minLength(3, 'Title must be at least 3 characters'),
    commonRules.maxLength(200, 'Title must be less than 200 characters')
  ),

  issueDescription: combineRules(
    commonRules.maxLength(5000, 'Description must be less than 5000 characters')
  ),

  projectName: combineRules(
    commonRules.required('Project name is required'),
    commonRules.minLength(2, 'Project name must be at least 2 characters'),
    commonRules.maxLength(100, 'Project name must be less than 100 characters')
  ),

  projectKey: combineRules(
    commonRules.required('Project key is required'),
    commonRules.pattern(/^[A-Z]{2,10}$/, 'Project key must be 2-10 uppercase letters')
  ),

  email: combineRules(
    commonRules.required('Email is required'),
    commonRules.email()
  ),

  password: combineRules(
    commonRules.required('Password is required'),
    commonRules.minLength(8, 'Password must be at least 8 characters'),
    commonRules.pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    )
  ),

  url: combineRules(
    commonRules.url()
  ),

  storyPoints: combineRules(
    commonRules.min(0, 'Story points cannot be negative'),
    commonRules.max(100, 'Story points cannot exceed 100')
  ),
};
