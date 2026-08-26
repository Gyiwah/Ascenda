import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { School } from '@/types/database';
import { ChevronDown } from 'lucide-react-native';
import { useAppTheme, hexToRgba } from '@/theme';

interface Props {
	initial?: Partial<{ full_name: string; email: string; role: string; school_id?: string }>;
	onSubmit: (values: any) => void;
	loading?: boolean;
	schools?: School[];
}

export function UserForm({ initial, onSubmit, loading, schools = [] }: Props) {
	const theme = useAppTheme();
	const styles = useMemo(() => makeStyles(theme), [theme]);

	const [values, setValues] = useState({
		full_name: initial?.full_name || '',
		email: initial?.email || '',
		role: initial?.role || 'teacher',
		school_id: initial?.school_id || '',
	});
	const [showRoleModal, setShowRoleModal] = useState(false);
	const [showSchoolModal, setShowSchoolModal] = useState(false);

	const roles = ['teacher', 'admin', 'headmaster', 'student'];
	const selectedSchoolName = schools.find((s) => s.id === values.school_id)?.name || 'Select School';

	return (
		<View>
			<Input 
				label="Full Name" 
				value={values.full_name} 
				onChangeText={(v) => setValues({ ...values, full_name: v })} 
				editable={!!initial}
			/>
			<Input 
				label="Email" 
				value={values.email} 
				onChangeText={(v) => setValues({ ...values, email: v })} 
				editable={!!initial}
				keyboardType="email-address"
			/>
			
			{schools.length > 0 && (
				<View style={styles.container}>
					<Text style={styles.label}>School</Text>
					<TouchableOpacity
						style={styles.selector}
						onPress={() => setShowSchoolModal(true)}
					>
						<Text style={styles.selectorText}>{selectedSchoolName}</Text>
						<ChevronDown size={20} color={theme.colors.text.secondary} />
					</TouchableOpacity>
				</View>
			)}

			<View style={styles.container}>
				<Text style={styles.label}>Role</Text>
				<TouchableOpacity
					style={styles.selector}
					onPress={() => setShowRoleModal(true)}
				>
					<Text style={styles.selectorText}>{values.role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</Text>
					<ChevronDown size={20} color={theme.colors.text.secondary} />
				</TouchableOpacity>
			</View>

			<Button title="Save" onPress={() => onSubmit(values)} loading={!!loading} />

			{/* Role Modal */}
			<RNModal
				visible={showRoleModal}
				transparent
				animationType="slide"
				onRequestClose={() => setShowRoleModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Select Role</Text>
						{roles.map((role) => (
							<TouchableOpacity
								key={role}
								style={[styles.modalOption, values.role === role && styles.modalOptionActive]}
								onPress={() => {
									setValues({ ...values, role });
									setShowRoleModal(false);
								}}
							>
								<Text style={[styles.modalOptionText, values.role === role && styles.modalOptionTextActive]}>
									{role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
								</Text>
							</TouchableOpacity>
						))}
						<TouchableOpacity
							style={styles.modalCloseButton}
							onPress={() => setShowRoleModal(false)}
						>
							<Text style={styles.modalCloseText}>Close</Text>
						</TouchableOpacity>
					</View>
				</View>
			</RNModal>

			{/* School Modal */}
			{schools.length > 0 && (
				<RNModal
					visible={showSchoolModal}
					transparent
					animationType="slide"
					onRequestClose={() => setShowSchoolModal(false)}
				>
					<View style={styles.modalOverlay}>
						<View style={styles.modalContent}>
							<Text style={styles.modalTitle}>Select School</Text>
							{schools.map((school) => (
								<TouchableOpacity
									key={school.id}
									style={[styles.modalOption, values.school_id === school.id && styles.modalOptionActive]}
									onPress={() => {
										setValues({ ...values, school_id: school.id });
										setShowSchoolModal(false);
									}}
								>
									<Text style={[styles.modalOptionText, values.school_id === school.id && styles.modalOptionTextActive]}>
										{school.name}
									</Text>
								</TouchableOpacity>
							))}
							<TouchableOpacity
								style={styles.modalCloseButton}
								onPress={() => setShowSchoolModal(false)}
							>
								<Text style={styles.modalCloseText}>Close</Text>
							</TouchableOpacity>
						</View>
					</View>
				</RNModal>
			)}
		</View>
	);
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
	StyleSheet.create({
		container: {
			marginBottom: theme.spacing.md,
		},
		label: {
			fontSize: theme.typography.fontSizes.sm,
			fontWeight: theme.typography.fontWeights.medium,
			color: theme.colors.text.label || theme.colors.text.primary,
			marginBottom: theme.spacing.xs,
		},
		selector: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			borderWidth: 1,
			borderColor: theme.colors.border,
			borderRadius: theme.roundness ? theme.roundness / 1.5 : 8,
			paddingVertical: theme.spacing.sm,
			paddingHorizontal: theme.spacing.md,
			backgroundColor: theme.colors.surface.primary,
			minHeight: 44,
		},
		selectorText: {
			fontSize: theme.typography.fontSizes.base,
			color: theme.colors.text.primary,
			flex: 1,
		},
		modalOverlay: {
			flex: 1,
			backgroundColor: hexToRgba(theme.colors.background.dark ?? '#000000', 0.6),
			justifyContent: 'flex-end',
		},
		modalContent: {
			backgroundColor: theme.colors.surface.primary,
			borderTopLeftRadius: 20,
			borderTopRightRadius: 20,
			padding: theme.spacing.xl,
			maxHeight: '70%',
			borderWidth: 1,
			borderColor: theme.colors.border,
		},
		modalTitle: {
			fontSize: theme.typography.fontSizes.lg,
			fontWeight: theme.typography.fontWeights.bold,
			color: theme.colors.text.primary,
			marginBottom: theme.spacing.md,
		},
		modalOption: {
			padding: theme.spacing.md,
			borderRadius: theme.roundness ? theme.roundness / 1.5 : 8,
			marginBottom: theme.spacing.xs,
			backgroundColor: theme.colors.surface.secondary,
		},
		modalOptionActive: {
			backgroundColor: theme.colors.primary.base + '20',
			borderWidth: 1,
			borderColor: theme.colors.primary.base,
		},
		modalOptionText: {
			fontSize: theme.typography.fontSizes.base,
			color: theme.colors.text.primary,
		},
		modalOptionTextActive: {
			color: theme.colors.primary.base,
			fontWeight: theme.typography.fontWeights.semibold,
		},
		modalCloseButton: {
			marginTop: theme.spacing.md,
			padding: theme.spacing.md,
			alignItems: 'center',
			borderTopWidth: 1,
			borderTopColor: theme.colors.divider,
		},
		modalCloseText: {
			fontSize: theme.typography.fontSizes.base,
			color: theme.colors.primary.base,
			fontWeight: theme.typography.fontWeights.semibold,
		},
	});

