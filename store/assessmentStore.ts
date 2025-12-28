import { create } from 'zustand';
import { Assessment } from '@/types/database';

interface AssessmentState {
	assessments: Assessment[];
	setAssessments: (assessments: Assessment[]) => void;
}

export const useAssessmentStore = create<AssessmentState>((set) => ({
	assessments: [],
	setAssessments: (assessments) => set({ assessments }),
}));
