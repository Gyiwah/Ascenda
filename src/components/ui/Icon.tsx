import React from 'react';
import { useThemeMode } from '@/theme/@ThemeProvider';
import type { LucideIcon } from 'lucide-react-native';

type IconProps = {
	name: LucideIcon;
	size?: number;
	color?: string;
	secondary?: boolean;
};

export function Icon({ name: IconComponent, size = 20, color, secondary }: IconProps) {
	const { theme } = useThemeMode();
	const resolved = color || (secondary ? theme.colors.accent.base : theme.colors.primary.base);
	return <IconComponent size={size} color={resolved} />;
}


