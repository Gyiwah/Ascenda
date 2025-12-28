import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { navigationRef } from '@/navigation/navigationService';

type ProtectedRouteProps = {
	children: React.ReactNode;
	roles?: ('super_admin' | 'admin' | 'headmaster' | 'teacher' | 'student')[];
};

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
	const user = useAuthStore((state) => state.user);

	useEffect(() => {
		if (!user && navigationRef.current?.isReady()) {
			navigationRef.current.reset({ index: 0, routes: [{ name: 'Auth' as never }] });
		}
	}, [user]);

	useEffect(() => {
		if (user && roles && roles.length > 0 && !roles.includes(user.role as any)) {
			// If user exists but lacks role, push them to their dashboard root
			const roleToRoute: Record<string, string> = {
				'super_admin': 'SuperAdmin',
				'admin': 'Admin',
				'headmaster': 'Headmaster',
				'teacher': 'Teacher',
				'student': 'Auth',
			};
			const route = roleToRoute[user.role] || 'Auth';
			if (navigationRef.current?.isReady()) {
				navigationRef.current.reset({ index: 0, routes: [{ name: route as never }] });
			}
		}
	}, [user, roles]);

	if (!user) return <View />;
	if (roles && roles.length > 0 && !roles.includes(user.role as any)) return <View />;

	return <>{children}</>;
}


