export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  HEADMASTER: 'headmaster',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;

export const TERMS = [
  { value: 1, label: 'First Term' },
  { value: 2, label: 'Second Term' },
  { value: 3, label: 'Third Term' },
];

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const CLASS_LEVELS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `Class ${i + 1}`,
}));

export const PROMOTION_STATUSES = [
  { value: 'promoted', label: 'Promoted' },
  { value: 'repeated', label: 'Repeated' },
  { value: 'graduated', label: 'Graduated' },
];

export const GRADE_SCALE = {
  A: { min: 80, max: 100, color: '#4caf50' },
  B: { min: 70, max: 79, color: '#8bc34a' },
  C: { min: 60, max: 69, color: '#ffc107' },
  D: { min: 50, max: 59, color: '#ff9800' },
  E: { min: 40, max: 49, color: '#ff5722' },
  F: { min: 0, max: 39, color: '#f44336' },
};

export const MAX_CA_SCORE = 40;
export const MAX_EXAM_SCORE = 60;
export const MAX_TOTAL_SCORE = 100;
