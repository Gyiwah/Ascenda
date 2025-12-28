import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react-native';

interface ToastProps {
	message: string;
	type?: 'info' | 'success' | 'error' | 'warning';
}

export function Toast({ message, type = 'info' }: ToastProps) {
	const getColors = () => {
		switch (type) {
			case 'success':
				return {
					bg: colors.success[50],
					border: colors.success[500],
					text: colors.success[700],
					icon: colors.success[600],
				};
			case 'error':
				return {
					bg: colors.error[50],
					border: colors.error[500],
					text: colors.error[700],
					icon: colors.error[600],
				};
			case 'warning':
				return {
					bg: '#fef3c7',
					border: colors.warning[500],
					text: colors.warning[700],
					icon: colors.warning[600],
				};
			default:
				return {
					bg: colors.primary[50],
					border: colors.primary[500],
					text: colors.primary[700],
					icon: colors.primary[600],
				};
		}
	};

	const colors_ = getColors();
	const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : type === 'warning' ? AlertCircle : Info;

	return (
		<View style={[styles.container, { backgroundColor: colors_.bg, borderLeftColor: colors_.border }]}>
			<Icon size={20} color={colors_.icon} style={styles.icon} />
			<Text style={[styles.text, { color: colors_.text }]}>{message}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: spacing.md,
		borderRadius: 8,
		borderLeftWidth: 4,
		shadowColor: colors.background.dark ?? '#000',
		shadowOpacity: 0.1,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 4,
	},
	icon: {
		marginRight: spacing.sm,
	},
	text: {
		flex: 1,
		fontSize: typography.fontSizes.sm,
		fontWeight: typography.fontWeights.medium,
	},
});
