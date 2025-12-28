import { create } from 'zustand';
import { Student } from '@/types/database';

interface StudentState {
	students: Student[];
	setStudents: (students: Student[]) => void;
}

export const useStudentStore = create<StudentState>((set) => ({
	students: [],
	setStudents: (students) => set({ students }),
}));
