import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppTheme } from '@/theme';
import { useAuthStore } from './useAuthStore';
import { useToast } from '@/components/ToastContext';
import { SafeAreaView } from 'react-native-safe-area-context'; 

export default function ResetPasswordScreen() {
	const theme = useAppTheme();
	const styles = useMemo(() => makeStyles(theme), [theme]);
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const { resetPassword } = useAuthStore();
	const { showToast } = useToast();

	const handleSubmit = async () => {
		setError('');
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError('Please enter a valid email address');
			return;
		}
		setLoading(true);
		const res = await resetPassword(email);
		setLoading(false);
		if (res.success) {
			showToast('Password reset email sent', 'success');
		} else {
			setError(res.error || 'Failed to send reset email');
			showToast(res.error || 'Failed to send reset email', 'error');
		}
	};

	return (
		<KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
			<SafeAreaView>
			<View style={styles.card}>
				<Text style={styles.title}>Reset Password</Text>
				<Text style={styles.subtitle}>Enter your email to receive a reset link.</Text>
				<Input label="Email" value={email} onChangeText={(t) => { setEmail(t); setError(''); }} keyboardType="email-address" autoCapitalize="none" />
				{error ? <Text style={styles.error}>{error}</Text> : null}
				<Button title="Send Reset Email" onPress={handleSubmit} loading={loading} disabled={loading || !email} style={{ marginTop: theme.spacing.md }} />
			</View>
			</SafeAreaView>
		</KeyboardAvoidingView>
	);
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background.primary,
			justifyContent: 'center',
			padding: theme.spacing.lg,
		},
		card: {
			backgroundColor: theme.colors.surface.primary,
			borderRadius: 12,
			padding: theme.spacing.xl,
			borderWidth: 1,
			borderColor: theme.colors.border,
			elevation: 4,
		},
		title: {
			fontSize: theme.typography.fontSizes['2xl'],
			fontWeight: theme.typography.fontWeights.bold,
			color: theme.colors.text.primary,
			marginBottom: theme.spacing.xs,
		},
		subtitle: {
			fontSize: theme.typography.fontSizes.base,
			color: theme.colors.text.secondary,
			marginBottom: theme.spacing.lg,
		},
		error: {
			marginTop: theme.spacing.sm,
			color: theme.colors.error.base,
		},
	});



