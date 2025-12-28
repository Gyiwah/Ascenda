import { DEFAULT_FAIL_LABEL } from '@/constants/grades';
import { colors } from '@/theme';

export const computeGrade = (caScore: number, examScore: number) => {
  const total = caScore + examScore;
  let grade = DEFAULT_FAIL_LABEL;

  if (total >= 80) grade = 'A';
  else if (total >= 70) grade = 'B';
  else if (total >= 60) grade = 'C';
  else if (total >= 50) grade = 'D';
  else if (total >= 40) grade = 'E';

  return { total, grade };
};

export const validateScores = (caScore: number, examScore: number) => {
  const errors: string[] = [];

  if (caScore < 0 || caScore > 40) {
    errors.push('CA score must be between 0 and 40');
  }

  if (examScore < 0 || examScore > 60) {
    errors.push('Exam score must be between 0 and 60');
  }

  return errors;
};

export const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'A':
      return colors.success?.[500] ?? '#4caf50';
    case 'B':
      return colors.secondary?.[500] ?? '#8bc34a';
    case 'C':
      return colors.warning?.[500] ?? '#ffc107';
    case 'D':
      return colors.warning?.[500] ?? '#ff9800';
    case 'E':
      return colors.primary?.[500] ?? '#ff5722';
    case 'F':
      return colors.error?.[500] ?? '#f44336';
    default:
      return colors.neutral?.[500] ?? '#9e9e9e';
  }
};

export const getGradeRemark = (grade: string) => {
  switch (grade) {
    case 'A':
      return 'Excellent';
    case 'B':
      return 'Very Good';
    case 'C':
      return 'Good';
    case 'D':
      return 'Pass';
    case 'E':
      return 'Poor';
    case 'F':
      return 'Fail';
    default:
      return 'N/A';
  }
};
