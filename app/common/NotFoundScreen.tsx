import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme';

export default function NotFoundScreen() {
	const theme = useAppTheme();
	const styles = useMemo(() => makeStyles(theme), [theme]);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>404</Text>
			<Text style={styles.subtitle}>Screen not found</Text>
		</View>
	);
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
	StyleSheet.create({
		container: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: theme.colors.background.primary,
			padding: theme.spacing.xl,
		},
		title: {
			fontSize: theme.typography.fontSizes['3xl'],
			fontWeight: theme.typography.fontWeights.bold,
			color: theme.colors.error.base,
			marginBottom: theme.spacing.xs,
		},
		subtitle: {
			fontSize: theme.typography.fontSizes.base,
			color: theme.colors.text.secondary,
		},
	});

