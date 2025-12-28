import { create } from 'zustand';
import { School } from '@/types/database';

interface SchoolState {
	schools: School[];
	setSchools: (schools: School[]) => void;
}

export const useSchoolStore = create<SchoolState>((set) => ({
	schools: [],
	setSchools: (schools) => set({ schools }),
}));
