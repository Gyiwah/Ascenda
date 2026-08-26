import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme';

interface Props {
	series: { label: string; value: number }[];
}

export function PerformanceChart({ series }: Props) {
	const theme = useAppTheme();
	const styles = useMemo(() => makeStyles(theme), [theme]);

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
			backgroundColor: theme.colors.primary.base,
		},
		value: {
			width: 48,
			textAlign: 'right',
			color: theme.colors.text.secondary,
			fontSize: theme.typography.fontSizes.sm,
		},
	});

