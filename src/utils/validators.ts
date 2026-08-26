/**
 * Validation utilities for Ascenda forms and inputs
 */

export interface ValidationResult {
  isValid: boolean;
  valid?: boolean;
  error?: string;
}


export const validators = {
  email(value: string): ValidationResult {
    if (!value || !value.trim()) {
      return { isValid: false, error: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
  },

  password(value: string, minLength = 8): ValidationResult {
    if (!value) {
      return { isValid: false, error: 'Password is required' };
    }
    if (value.length < minLength) {
      return { isValid: false, error: `Password must be at least ${minLength} characters` };
    }
    return { isValid: true };
  },

  required(value: string, fieldName = 'Field'): ValidationResult {
    if (!value || !value.trim()) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
  },

  academicYear(value: string): ValidationResult {
    if (!value || !value.trim()) {
      return { isValid: false, error: 'Academic year is required' };
    }
    const yearRegex = /^\d{4}\/\d{4}$/;
    if (!yearRegex.test(value.trim())) {
      return { isValid: false, error: 'Academic year must be in format YYYY/YYYY (e.g. 2024/2025)' };
    }
    const [startYear, endYear] = value.trim().split('/').map(Number);
    if (endYear !== startYear + 1) {
      return { isValid: false, error: 'Academic year must span consecutive years (e.g. 2024/2025)' };
    }
    return { isValid: true };
  },

  score(value: number | string, maxScore: number, label = 'Score'): ValidationResult {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
      return { isValid: false, error: `${label} must be a number` };
    }
    if (num < 0 || num > maxScore) {
      return { isValid: false, error: `${label} must be between 0 and ${maxScore}` };
    }
    return { isValid: true };
  },

  classroom(data: { name: string; level: number | string; academicYear: string }): ValidationResult {
    const nameRes = this.required(data.name, 'Classroom name');
    if (!nameRes.isValid) return nameRes;

    const levelNum = typeof data.level === 'string' ? parseInt(data.level, 10) : data.level;
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 3) {
      return { isValid: false, error: 'Classroom level must be 1 (Primary), 2 (JHS), or 3 (SHS)' };
    }

    const yearRes = this.academicYear(data.academicYear);
    if (!yearRes.isValid) return yearRes;

    return { isValid: true };
  },
};

export function validateAssessmentSubmission(assessments: any[]): ValidationResult {
  if (!assessments || assessments.length === 0) {
    return { isValid: false, valid: false, error: 'No assessment scores to submit' };
  }
  for (const item of assessments) {
    const ca = parseFloat(item.class_score ?? item.caScore ?? item.ca_score);
    const exam = parseFloat(item.exam_score ?? item.examScore ?? item.exam_score);
    if (isNaN(ca) || ca < 0 || ca > 30) {
      return { isValid: false, valid: false, error: `Invalid class score: ${ca}. Must be between 0 and 30.` };
    }
    if (isNaN(exam) || exam < 0 || exam > 70) {
      return { isValid: false, valid: false, error: `Invalid exam score: ${exam}. Must be between 0 and 70.` };
    }
  }
  return { isValid: true, valid: true };
}


