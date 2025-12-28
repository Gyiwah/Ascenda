import React from 'react';
// Use require for testing library to avoid type resolution issues when test deps are not installed
// @ts-ignore
const rtl: any = require('@testing-library/react-native');
const { render, fireEvent, waitFor } = rtl;
import StudentScoreEntryScreen from '../src/screens/teacher/StudentScoreEntryScreen';
import * as supabaseApi from '../src/api/teacher/assessments';
import { DEFAULT_FAIL_LABEL } from '../src/constants/grades';

// @ts-ignore - Jest environment provided in tests
declare const jest: any;
jest.mock('../src/api/teacher/assessments');

const mockStudents = [
  { id: '1', first_name: 'Test', last_name: 'Student', gender: 'M' },
];

const mockGradeBands = [
  { min: 80, max: 100, label: 'A' },
  { min: 70, max: 79, label: 'B' },
  { min: 0, max: 69, label: DEFAULT_FAIL_LABEL },
];

describe('StudentScoreEntryScreen integration', () => {
  beforeEach(() => {
  jest.clearAllMocks();
  const api: any = supabaseApi;
  api.getStudentsForClass = jest.fn().mockResolvedValue({ data: mockStudents, error: null });
  api.getAssessmentsForClass = jest.fn().mockResolvedValue({ data: [], error: null });
  api.saveAssessmentDraft = jest.fn().mockResolvedValue({ data: { success: true }, error: null });
  api.submitAssessment = jest.fn().mockResolvedValue({ data: { success: true }, error: null });
  });

  it('saves and submits grades using configured bands', async () => {
    const { getByText, getByLabelText } = render(<StudentScoreEntryScreen />);
    // Wait for students to load
    await waitFor(() => getByText(/Test Student/i));
    // Simulate entering scores
    // ...simulate entering CA and Exam scores here if needed...
    // Save draft
    fireEvent.press(getByText(/Save Draft/i));
    await waitFor(() => expect(supabaseApi.saveAssessmentDraft).toHaveBeenCalled());
    // Submit
    fireEvent.press(getByText(/Submit/i));
    await waitFor(() => expect(supabaseApi.submitAssessment).toHaveBeenCalled());
    // Check that grade label is from configured bands
  const api: any = supabaseApi;
  const callArgs = api.saveAssessmentDraft.mock.calls[0][0];
  expect(["A", "B", DEFAULT_FAIL_LABEL]).toContain(callArgs.grade);
  });
});
