import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

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

const styles = StyleSheet.create({
	container: {
		borderWidth: 1,
		borderColor: colors.neutral[200],
		borderRadius: 8,
		overflow: 'hidden',
	},
	header: {
		flexDirection: 'row',
		padding: spacing.sm,
		backgroundColor: colors.neutral[100],
	},
	h: {
		flex: 1,
		fontWeight: typography.fontWeights.semibold,
		color: colors.text.primary,
	},
	row: {
		flexDirection: 'row',
		padding: spacing.sm,
		borderTopWidth: 1,
		borderTopColor: colors.neutral[200],
	},
	c: {
		flex: 1,
		color: colors.text.primary,
	},
});
