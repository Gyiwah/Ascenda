import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/theme';

export default function SplashScreen() {
	const theme = useAppTheme();
	const styles = useMemo(() => makeStyles(theme), [theme]);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Ascenda</Text>
			<ActivityIndicator size="large" color={theme.colors.primary.base} />
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
			color: theme.colors.primary.base,
			marginBottom: theme.spacing.lg,
		},
	});

