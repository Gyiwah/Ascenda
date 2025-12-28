import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '@/app/(auth)/login';
import ForgotPassword from '@/app/(auth)/forgot-password';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Login" component={Login as any} />
			<Stack.Screen name="ForgotPassword" component={ForgotPassword as any} />
		</Stack.Navigator>
	);
}
