import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme';

interface Row {
	student: string;
	admission: string;
	ca: number;
	exam: number;
	total: number;
	grade: string;
}

interface Props {
	rows: Row[];
}

export function ScoreTable({ rows }: Props) {
	const theme = useAppTheme();
	const styles = useMemo(() => makeStyles(theme), [theme]);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.h}>Student</Text>
				<Text style={styles.h}>CA</Text>
				<Text style={styles.h}>Exam</Text>
				<Text style={styles.h}>Total</Text>
				<Text style={styles.h}>Grade</Text>
			</View>
			{rows.map((r, i) => (
				<View key={i} style={styles.row}>
					<Text style={[styles.c, { flex: 2 }]}>{r.student}</Text>
					<Text style={styles.c}>{r.ca}</Text>
					<Text style={styles.c}>{r.exam}</Text>
					<Text style={styles.c}>{r.total}</Text>
					<Text style={styles.c}>{r.grade}</Text>
				</View>
			))}
		</View>
	);
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
	StyleSheet.create({
		container: {
			borderWidth: 1,
			borderColor: theme.colors.border,
			borderRadius: theme.roundness ? theme.roundness / 1.5 : 8,
			overflow: 'hidden',
			backgroundColor: theme.colors.surface.primary,
		},
		header: {
			flexDirection: 'row',
			padding: theme.spacing.sm,
			backgroundColor: theme.colors.surface.secondary,
		},
		h: {
			flex: 1,
			fontWeight: theme.typography.fontWeights.semibold,
			color: theme.colors.text.primary,
			fontSize: theme.typography.fontSizes.sm,
		},
		row: {
			flexDirection: 'row',
			padding: theme.spacing.sm,
			borderTopWidth: 1,
			borderTopColor: theme.colors.divider,
		},
		c: {
			flex: 1,
			color: theme.colors.text.primary,
			fontSize: theme.typography.fontSizes.sm,
		},
	});

