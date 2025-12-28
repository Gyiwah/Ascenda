import { useState, useEffect } from 'react';
import { computeGrade, validateScores } from '@/services/helpers/grading';
import { DEFAULT_FAIL_LABEL } from '@/constants/grades';

interface GradeCalculation {
  caScore: number;
  examScore: number;
  total: number;
  grade: string;
  errors: string[];
}

export function useGradeCalculation(initialCA: number = 0, initialExam: number = 0) {
  const [calculation, setCalculation] = useState<GradeCalculation>({
    caScore: initialCA,
    examScore: initialExam,
    total: 0,
  grade: DEFAULT_FAIL_LABEL,
    errors: [],
  });

  useEffect(() => {
    updateCalculation(calculation.caScore, calculation.examScore);
  }, []);

  const updateCalculation = (caScore: number, examScore: number) => {
    const errors = validateScores(caScore, examScore);
    const { total, grade } = computeGrade(caScore, examScore);

    setCalculation({
      caScore,
      examScore,
      total,
      grade,
      errors,
    });
  };

  const setCAScore = (score: number) => {
    updateCalculation(score, calculation.examScore);
  };

  const setExamScore = (score: number) => {
    updateCalculation(calculation.caScore, score);
  };

  const reset = () => {
    updateCalculation(0, 0);
  };

  return {
    ...calculation,
    setCAScore,
    setExamScore,
    reset,
    isValid: calculation.errors.length === 0,
  };
}
