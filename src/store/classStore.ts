import { create } from 'zustand';
import { Class } from '@/types/database';

interface ClassState {
  classes: Class[];
  setClasses: (classes: Class[]) => void;
  addClass: (classItem: Class) => void;
  updateClass: (id: string, updates: Partial<Class>) => void;
  removeClass: (id: string) => void;
}

export const useClassStore = create<ClassState>((set) => ({
  classes: [],
  setClasses: (classes) => set({ classes }),
  addClass: (classItem) => set((state) => ({ classes: [...state.classes, classItem] })),
  updateClass: (id, updates) =>
    set((state) => ({
      classes: state.classes.map((c) => (c.id === id ? { ...c, ...(updates ?? {}) } : c)),
    })),
  removeClass: (id) =>
    set((state) => ({ classes: state.classes.filter((c) => c.id !== id) })),
}));

