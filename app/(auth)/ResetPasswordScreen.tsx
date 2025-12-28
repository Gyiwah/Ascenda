import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography } from '@/theme';
import { authService } from '@/services/supabase/auth';

export default function ResetPasswordScreen() {
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);

	const handleReset = async () => {
		if (!password || password !== confirm) {
			setMessage('Passwords do not match');
			return;
		}
		setLoading(true);
		const { error } = await authService.updatePassword(password);
		setLoading(false);
		setMessage(error ? error.message : 'Password updated successfully');
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Reset Password</Text>
			{message ? <Text style={styles.message}>{message}</Text> : null}
			<Input label="New Password" value={password} onChangeText={setPassword} secureTextEntry />
			<Input label="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry />
			<Button title="Update Password" onPress={handleReset} loading={loading} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background.light,
		padding: spacing.xl,
		justifyContent: 'center',
	},
	title: {
		fontSize: typography.fontSizes['2xl'],
		fontWeight: typography.fontWeights.bold,
		color: colors.text.primary,
		marginBottom: spacing.lg,
	},
	message: {
		fontSize: typography.fontSizes.sm,
		color: colors.text.secondary,
		marginBottom: spacing.md,
	},
});
