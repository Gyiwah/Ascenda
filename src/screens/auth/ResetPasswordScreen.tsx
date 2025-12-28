import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography } from '@/theme';
import { useAuthStore } from './useAuthStore';
import { useToast } from '@/components/ToastContext';
import { SafeAreaView } from 'react-native-safe-area-context'; 

export default function ResetPasswordScreen() {
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
				<Button title="Send Reset Email" onPress={handleSubmit} loading={loading} disabled={loading || !email} style={{ marginTop: spacing.md }} />
			</View>
			</SafeAreaView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background.light, justifyContent: 'center', padding: spacing.lg },
	card: { backgroundColor: colors.background.light, borderRadius: 12, padding: spacing.xl, elevation: 4 },
	title: { fontSize: typography.fontSizes['2xl'], fontWeight: typography.fontWeights.bold, color: colors.text.primary, marginBottom: spacing.xs },
	subtitle: { fontSize: typography.fontSizes.base, color: colors.text.secondary, marginBottom: spacing.lg },
	error: { marginTop: spacing.sm, color: colors.error[600] },
});


