import { create } from 'zustand';
import { Student } from '@/types/database';

interface StudentState {
  students: Student[];
  setStudents: (students: Student[]) => void;
  addStudent: (student: Student) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  removeStudent: (id: string) => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  students: [],
  setStudents: (students) => set({ students }),
  addStudent: (student) => set((state) => ({ students: [...state.students, student] })),
  updateStudent: (id, updates) =>
    set((state) => ({
      students: state.students.map((s) => (s.id === id ? { ...s, ...(updates ?? {}) } : s)),
    })),
  removeStudent: (id) =>
    set((state) => ({ students: state.students.filter((s) => s.id !== id) })),
}));

