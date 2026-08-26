import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme';

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
	const theme = useAppTheme();
	const styles = useMemo(() => makeStyles(theme), [theme]);

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

