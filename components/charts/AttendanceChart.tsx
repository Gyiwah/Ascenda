import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface Props {
	attendance: { label: string; present: number; total: number }[];
}

export function AttendanceChart({ attendance }: Props) {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Attendance</Text>
			{attendance.map((a, i) => {
				const pct = a.total > 0 ? Math.round((a.present / a.total) * 100) : 0;
				return (
					<View key={i} style={styles.row}>
						<Text style={styles.label}>{a.label}</Text>
						<View style={styles.barBg}>
							<View style={[styles.barFill, { width: `${pct}%` }]} />
						</View>
						<Text style={styles.value}>{pct}%</Text>
					</View>
				);
			})}
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
		backgroundColor: colors.success[600],
	},
	value: {
		width: 48,
		textAlign: 'right',
		color: colors.text.secondary,
	},
});
