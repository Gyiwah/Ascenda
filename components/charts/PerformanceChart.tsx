import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface Props {
	series: { label: string; value: number }[];
}

export function PerformanceChart({ series }: Props) {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Performance</Text>
			{series.map((s, i) => (
				<View key={i} style={styles.row}>
					<Text style={styles.label}>{s.label}</Text>
					<View style={styles.barBg}>
						<View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, s.value))}%` }]} />
					</View>
					<Text style={styles.value}>{s.value}%</Text>
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: spacing.md,
		borderWidth: 1,
		borderColor: colors.neutral[200],
		borderRadius: 8,
	},
	title: {
		fontWeight: typography.fontWeights.semibold,
		color: colors.text.primary,
		marginBottom: spacing.sm,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: spacing.xs,
	},
	label: {
		flex: 1,
		color: colors.text.secondary,
	},
	barBg: {
		flex: 3,
		height: 8,
		backgroundColor: colors.neutral[200],
		borderRadius: 4,
		marginHorizontal: spacing.sm,
		overflow: 'hidden',
	},
	barFill: {
		height: 8,
		backgroundColor: colors.primary[600],
	},
	value: {
		width: 48,
		textAlign: 'right',
		color: colors.text.secondary,
	},
});
