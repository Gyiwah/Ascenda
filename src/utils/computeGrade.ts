/**
 * Grade band configuration type
 */
export type GradeBandConfig = {
  min: number;
  max: number;
  label: string;
};

/**
 * Default grade bands (WAEC-style numeric grades)
 * Used when school hasn't configured custom grade bands
 */
export const DEFAULT_GRADE_BANDS: GradeBandConfig[] = [
  { min: 80, max: 100, label: '1' },
  { min: 70, max: 79, label: '2' },
  { min: 65, max: 69, label: '3' },
  { min: 60, max: 64, label: '4' },
  { min: 55, max: 59, label: '5' },
  { min: 50, max: 54, label: '6' },
  { min: 45, max: 49, label: '7' },
  { min: 40, max: 44, label: '8' },
  { min: 0, max: 39, label: '9' },
];

/**
 * Compute grade from total score using configurable grade bands
 * @param total - Total score (0-100)
 * @param gradeBands - Optional custom grade bands. If not provided, uses default bands
 * @returns Grade label (e.g., '1', '2', '3', etc. or custom labels like 'A1', 'B2')
 */
import { DEFAULT_FAIL_LABEL } from '@/constants/grades';
import { colors } from '@/theme';

export function computeGrade(total: number, gradeBands?: GradeBandConfig[] | null): string {
  // Use provided grade bands or default
  const bands = gradeBands && gradeBands.length > 0 ? gradeBands : DEFAULT_GRADE_BANDS;
  
  // Find the matching grade band
  const band = bands.find((b) => total >= b.min && total <= b.max);
  
  // Return the label if found, otherwise return the lowest grade
  return band ? band.label : bands[bands.length - 1]?.label || DEFAULT_FAIL_LABEL;
}

/**
 * Get grade color for UI display
 * Supports both numeric grades (1-9) and letter grades (A-F, A1-F9, etc.)
 * @param grade - Grade label (e.g., '1', '2', 'A1', 'B2', 'A', 'B', etc.)
 * @returns Color hex code
 */
export function getGradeColor(grade: string): string {
  if (!grade) return colors.neutral?.[600] ?? '#6b7280'; // gray for empty
  
  const normalized = grade.toUpperCase().trim();
  
  // Handle numeric grades (1-9) - WAEC-style
  const numericGrade = parseInt(normalized, 10);
  if (!isNaN(numericGrade) && numericGrade >= 1 && numericGrade <= 9) {
    if (numericGrade <= 2) return colors.success?.[500] ?? '#10b981'; // green
    if (numericGrade <= 4) return colors.secondary?.[500] ?? '#3b82f6'; // accent/blue
    if (numericGrade <= 6) return colors.warning?.[500] ?? '#f59e0b'; // yellow
    return colors.error?.[500] ?? '#ef4444'; // red
  }
  
  // Handle letter grades (A-F) - legacy support
  if (normalized === 'A' || normalized.startsWith('A')) {
    return colors.success?.[500] ?? '#10b981'; // green
  }
  if (normalized === 'B' || normalized.startsWith('B')) {
    return colors.secondary?.[500] ?? '#3b82f6'; // blue/accent
  }
  if (normalized === 'C' || normalized.startsWith('C')) {
    return colors.secondary?.[500] ?? '#3b82f6'; // blue/accent
  }
  if (normalized === 'D' || normalized.startsWith('D')) {
    return colors.warning?.[500] ?? '#f59e0b'; // yellow
  }
  if (normalized === 'E' || normalized.startsWith('E')) {
    return colors.warning?.[500] ?? '#f59e0b'; // yellow
  }
  if (normalized === 'F' || normalized.startsWith('F')) {
    return colors.error?.[500] ?? '#ef4444'; // red
  }
  
  // Default gray for unknown grades
  return colors.neutral?.[600] ?? '#6b7280';
}

/**
 * Get grade background color (with opacity) for badges
 * @param grade - Grade letter
 * @returns Color hex code with opacity
 */
export function getGradeBgColor(grade: string): string {
  const color = getGradeColor(grade);
  // Add 1A opacity suffix (10% opacity)
  return color + '1A';
}

