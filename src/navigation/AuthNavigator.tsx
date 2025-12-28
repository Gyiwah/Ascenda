import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import AccountDeactivatedScreen from '../screens/auth/AccountDeactivatedScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen 
        name="AccountDeactivated" 
        component={AccountDeactivatedScreen}
        options={{ title: 'Account Deactivated' }}
      />
    </Stack.Navigator>
  );
}

