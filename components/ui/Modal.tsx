import React from 'react';
import { Modal as RNModal, View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, hexToRgba } from '@/theme';

interface ModalProps {
	visible: boolean;
	onRequestClose: () => void;
	children: React.ReactNode;
	contentStyle?: ViewStyle;
}

export function Modal({ visible, onRequestClose, children, contentStyle }: ModalProps) {
	return (
		<RNModal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
			<View style={styles.overlay}>
				<View style={[styles.content, contentStyle]}>{children}</View>
			</View>
		</RNModal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: hexToRgba(colors.background.dark ?? '#000000', 0.5),
		justifyContent: 'flex-end',
	},
	content: {
		backgroundColor: colors.background.light,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: spacing.xl,
		maxHeight: '80%',
	},
});
