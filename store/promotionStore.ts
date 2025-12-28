import { create } from 'zustand';

interface PromotionState {
	promotions: any[];
	setPromotions: (promotions: any[]) => void;
}

export const usePromotionStore = create<PromotionState>((set) => ({
	promotions: [],
	setPromotions: (promotions) => set({ promotions }),
}));
