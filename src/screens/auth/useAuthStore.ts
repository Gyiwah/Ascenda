import { create } from 'zustand';
import { authService } from '@/api/auth';
import { userService } from '@/api/users';
import { User } from '@/types/database';

type AuthState = {
	user: User | null;
	loading: boolean;
	error: string | null;

	signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
	signOut: () => Promise<{ success: boolean; error?: string }>;
	resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
	refreshUser: () => Promise<User | null>;
	setUser: (u: User | null) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
	user: null,
	loading: false,
	error: null,

	setUser: (u) => set({ user: u }),

	refreshUser: async () => {
		try {
			const { data, error } = await userService.getCurrentUser();
			if (error) throw error;
			set({ user: data });
			return data;
		} catch (e: any) {
			set({ user: null, error: e?.message ?? 'Failed to load user' });
			return null;
		}
	},

	signIn: async (email, password) => {
		try {
			set({ error: null, loading: true });
			const { error } = await authService.signIn(email, password);
			if (error) throw error;
			await get().refreshUser();
			set({ loading: false });
			return { success: true };
		} catch (e: any) {
			set({ loading: false, error: e?.message ?? 'Login failed' });
			return { success: false, error: e?.message ?? 'Login failed' };
		}
	},

	signOut: async () => {
		try {
			set({ error: null, loading: true });
			const { error } = await authService.signOut();
			if (error) throw error;
			set({ user: null, loading: false });
			return { success: true };
		} catch (e: any) {
			set({ loading: false, error: e?.message ?? 'Sign out failed' });
			return { success: false, error: e?.message ?? 'Sign out failed' };
		}
	},

	resetPassword: async (email) => {
		try {
			set({ error: null, loading: true });
			const { error } = await authService.resetPassword(email);
			if (error) throw error;
			set({ loading: false });
			return { success: true };
		} catch (e: any) {
			set({ loading: false, error: e?.message ?? 'Reset failed' });
			return { success: false, error: e?.message ?? 'Reset failed' };
		}
	},
}));


