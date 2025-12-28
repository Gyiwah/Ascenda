import { create, type StateCreator } from 'zustand';
import { Class } from '@/types/database';

interface ClassState {
	classes: Class[];
	setClasses: (classes: Class[]) => void;
}

const creator: StateCreator<ClassState> = (set) => ({
	classes: [],
	setClasses: (classes: Class[]) => set({ classes }),
});

export const useClassStore = create<ClassState>(creator);
