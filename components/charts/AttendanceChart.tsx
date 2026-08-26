import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme';

interface Props {
	attendance: { label: string; present: number; total: number }[];
}

export function AttendanceChart({ attendance }: Props) {
	const theme = useAppTheme();
	const styles = useMemo(() => makeStyles(theme), [theme]);

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

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
	StyleSheet.create({
		container: {
			padding: theme.spacing.md,
			borderWidth: 1,
			borderColor: theme.colors.border,
			borderRadius: theme.roundness ? theme.roundness / 1.5 : 8,
			backgroundColor: theme.colors.surface.primary,
		},
		title: {
			fontWeight: theme.typography.fontWeights.semibold,
			color: theme.colors.text.primary,
			marginBottom: theme.spacing.sm,
			fontSize: theme.typography.fontSizes.base,
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			marginBottom: theme.spacing.xs,
		},
		label: {
			flex: 1,
			color: theme.colors.text.secondary,
			fontSize: theme.typography.fontSizes.sm,
		},
		barBg: {
			flex: 3,
			height: 8,
			backgroundColor: theme.colors.surface.secondary,
			borderRadius: 4,
			marginHorizontal: theme.spacing.sm,
			overflow: 'hidden',
		},
		barFill: {
			height: 8,
			backgroundColor: theme.colors.success.base || theme.colors.success[500],
		},
		value: {
			width: 48,
			textAlign: 'right',
			color: theme.colors.text.secondary,
			fontSize: theme.typography.fontSizes.sm,
		},
	});

