import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme';

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
	const theme = useAppTheme();
	const styles = useMemo(() => makeStyles(theme), [theme]);

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

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
	StyleSheet.create({
		container: {
			borderWidth: 1,
			borderColor: theme.colors.border,
			borderRadius: theme.roundness ? theme.roundness / 1.5 : 8,
			overflow: 'hidden',
			backgroundColor: theme.colors.surface.primary,
		},
		headerRow: {
			flexDirection: 'row',
			backgroundColor: theme.colors.surface.secondary,
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
		},
		headerCell: {
			flex: 1,
			fontWeight: theme.typography.fontWeights.semibold,
			color: theme.colors.text.primary,
			fontSize: theme.typography.fontSizes.sm,
		},
		row: {
			flexDirection: 'row',
			borderTopWidth: 1,
			borderTopColor: theme.colors.divider,
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
		},
		cell: {
			flex: 1,
			justifyContent: 'center',
		},
		cellText: {
			color: theme.colors.text.primary,
			fontSize: theme.typography.fontSizes.sm,
		},
		empty: {
			padding: theme.spacing.lg,
			alignItems: 'center',
			backgroundColor: theme.colors.surface.primary,
			borderRadius: theme.roundness ? theme.roundness / 1.5 : 8,
		},
		emptyText: {
			color: theme.colors.text.secondary,
			fontSize: theme.typography.fontSizes.sm,
		},
	});

