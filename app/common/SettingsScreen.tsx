import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme';

export default function SettingsScreen() {
	const theme = useAppTheme();
	const styles = useMemo(() => makeStyles(theme), [theme]);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Settings</Text>
			<Text style={styles.subtitle}>App preferences and configuration</Text>
		</View>
	);
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background.primary,
			padding: theme.spacing.xl,
		},
		title: {
			fontSize: theme.typography.fontSizes['2xl'],
			fontWeight: theme.typography.fontWeights.bold,
			color: theme.colors.text.primary,
			marginBottom: theme.spacing.sm,
		},
		subtitle: {
			fontSize: theme.typography.fontSizes.base,
			color: theme.colors.text.secondary,
		},
	});

