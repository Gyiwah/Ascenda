import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface Row {
	student: string;
	fromClass: string;
	toClass?: string;
	status: 'promoted' | 'repeated' | 'graduated';
	date: string;
}

interface Props {
	rows: Row[];
}

export function PromotionTable({ rows }: Props) {
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={[styles.h, { flex: 2 }]}>Student</Text>
				<Text style={styles.h}>From</Text>
				<Text style={styles.h}>To</Text>
				<Text style={styles.h}>Status</Text>
				<Text style={styles.h}>Date</Text>
			</View>
			{rows.map((r, i) => (
				<View key={i} style={styles.row}>
					<Text style={[styles.c, { flex: 2 }]}>{r.student}</Text>
					<Text style={styles.c}>{r.fromClass}</Text>
					<Text style={styles.c}>{r.toClass || '-'}</Text>
					<Text style={styles.c}>{r.status}</Text>
					<Text style={styles.c}>{r.date}</Text>
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
