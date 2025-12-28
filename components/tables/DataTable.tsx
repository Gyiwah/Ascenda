import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface Column<T> {
	key: keyof T | string;
	header: string;
	render?: (row: T) => React.ReactNode;
}

interface Props<T> {
	columns: Column<T>[];
	rows: T[];
	emptyText?: string;
}

export function DataTable<T extends Record<string, any>>({ columns, rows, emptyText = 'No data' }: Props<T>) {
	if (!rows || rows.length === 0) {
		return (
			<View style={styles.empty}> 
				<Text style={styles.emptyText}>{emptyText}</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.headerRow}>
				{columns.map((col) => (
					<Text key={String(col.key)} style={styles.headerCell}>{col.header}</Text>
				))}
			</View>
			{rows.map((row, idx) => (
				<View key={idx} style={styles.row}>
					{columns.map((col) => (
						<View key={String(col.key)} style={styles.cell}>
							{col.render ? col.render(row) : <Text style={styles.cellText}>{String(row[col.key as string] ?? '')}</Text>}
						</View>
					))}
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
	headerRow: {
		flexDirection: 'row',
		backgroundColor: colors.neutral[100],
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	headerCell: {
		flex: 1,
		fontWeight: typography.fontWeights.semibold,
		color: colors.text.primary,
	},
	row: {
		flexDirection: 'row',
		borderTopWidth: 1,
		borderTopColor: colors.neutral[200],
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	cell: {
		flex: 1,
	},
	cellText: {
		color: colors.text.primary,
	},
	empty: {
		padding: spacing.lg,
		alignItems: 'center',
	},
	emptyText: {
		color: colors.text.secondary,
	},
});
