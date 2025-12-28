import { create } from 'zustand';

interface RemarkState {
	remarks: any[];
	setRemarks: (remarks: any[]) => void;
}

export const useRemarkStore = create<RemarkState>((set) => ({
	remarks: [],
	setRemarks: (remarks) => set({ remarks }),
}));
