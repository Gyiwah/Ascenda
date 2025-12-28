/**
 * Validation utilities for assessment scores
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate CA score
 * @param score - CA score
 * @param maxScore - Maximum allowed CA score (default: 30)
 * @returns Validation result
 */
export function validateCAScore(score: number | string, maxScore: number = 30): ValidationResult {
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  
  if (isNaN(numScore)) {
    return { valid: false, error: 'CA score must be a number' };
  }
  
  if (numScore < 0) {
    return { valid: false, error: 'CA score cannot be negative' };
  }
  
  if (numScore > maxScore) {
    return { valid: false, error: `CA score cannot exceed ${maxScore}` };
  }
  
  return { valid: true };
}

/**
 * Validate Exam score
 * @param score - Exam score
 * @param maxScore - Maximum allowed Exam score (default: 70)
 * @returns Validation result
 */
export function validateExamScore(score: number | string, maxScore: number = 70): ValidationResult {
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  
  if (isNaN(numScore)) {
    return { valid: false, error: 'Exam score must be a number' };
  }
  
  if (numScore < 0) {
    return { valid: false, error: 'Exam score cannot be negative' };
  }
  
  if (numScore > maxScore) {
    return { valid: false, error: `Exam score cannot exceed ${maxScore}` };
  }
  
  return { valid: true };
}

/**
 * Validate that all required fields are filled before submission
 * @param assessments - Array of assessment objects with ca_score and exam_score
 * @returns Validation result
 */
export function validateAssessmentSubmission(assessments: Array<{ ca_score?: number | string; exam_score?: number | string }>): ValidationResult {
  for (const assessment of assessments) {
    const ca = assessment.ca_score;
    const exam = assessment.exam_score;
    
    if (ca === undefined || ca === null || ca === '') {
      return { valid: false, error: 'All CA scores must be filled' };
    }
    
    if (exam === undefined || exam === null || exam === '') {
      return { valid: false, error: 'All Exam scores must be filled' };
    }
    
    const caValidation = validateCAScore(ca);
    if (!caValidation.valid) {
      return caValidation;
    }
    
    const examValidation = validateExamScore(exam);
    if (!examValidation.valid) {
      return examValidation;
    }
  }
  
  return { valid: true };
}

