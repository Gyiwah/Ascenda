import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export default function NotFoundScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>404</Text>
			<Text style={styles.subtitle}>Screen not found</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.background.light,
		padding: spacing.xl,
	},
	title: {
		fontSize: typography.fontSizes['3xl'],
		fontWeight: typography.fontWeights.bold,
		color: colors.error[500],
		marginBottom: spacing.xs,
	},
	subtitle: {
		fontSize: typography.fontSizes.base,
		color: colors.text.secondary,
	},
});
