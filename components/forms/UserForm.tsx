import React, { useState } from 'react';
import { View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

import { School } from '@/types/database';
import { TouchableOpacity, Modal as RNModal } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { colors, spacing, typography, hexToRgba } from '@/theme';
import { StyleSheet, Text } from 'react-native';

interface Props {
	initial?: Partial<{ full_name: string; email: string; role: string; school_id?: string }>;
	onSubmit: (values: any) => void;
	loading?: boolean;
	schools?: School[];
}

export function UserForm({ initial, onSubmit, loading, schools = [] }: Props) {
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
				<View style={formStyles.container}>
					<Text style={formStyles.label}>School</Text>
					<TouchableOpacity
						style={formStyles.selector}
						onPress={() => setShowSchoolModal(true)}
					>
						<Text style={formStyles.selectorText}>{selectedSchoolName}</Text>
						<ChevronDown size={20} color={colors.text.secondary} />
					</TouchableOpacity>
				</View>
			)}

			<View style={formStyles.container}>
				<Text style={formStyles.label}>Role</Text>
				<TouchableOpacity
					style={formStyles.selector}
					onPress={() => setShowRoleModal(true)}
				>
					<Text style={formStyles.selectorText}>{values.role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</Text>
					<ChevronDown size={20} color={colors.text.secondary} />
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
				<View style={formStyles.modalOverlay}>
					<View style={formStyles.modalContent}>
						<Text style={formStyles.modalTitle}>Select Role</Text>
						{roles.map((role) => (
							<TouchableOpacity
								key={role}
								style={[formStyles.modalOption, values.role === role && formStyles.modalOptionActive]}
								onPress={() => {
									setValues({ ...values, role });
									setShowRoleModal(false);
								}}
							>
								<Text style={[formStyles.modalOptionText, values.role === role && formStyles.modalOptionTextActive]}>
									{role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
								</Text>
							</TouchableOpacity>
						))}
						<TouchableOpacity
							style={formStyles.modalCloseButton}
							onPress={() => setShowRoleModal(false)}
						>
							<Text style={formStyles.modalCloseText}>Close</Text>
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
					<View style={formStyles.modalOverlay}>
						<View style={formStyles.modalContent}>
							<Text style={formStyles.modalTitle}>Select School</Text>
							{schools.map((school) => (
								<TouchableOpacity
									key={school.id}
									style={[formStyles.modalOption, values.school_id === school.id && formStyles.modalOptionActive]}
									onPress={() => {
										setValues({ ...values, school_id: school.id });
										setShowSchoolModal(false);
									}}
								>
									<Text style={[formStyles.modalOptionText, values.school_id === school.id && formStyles.modalOptionTextActive]}>
										{school.name}
									</Text>
								</TouchableOpacity>
							))}
							<TouchableOpacity
								style={formStyles.modalCloseButton}
								onPress={() => setShowSchoolModal(false)}
							>
								<Text style={formStyles.modalCloseText}>Close</Text>
							</TouchableOpacity>
						</View>
					</View>
				</RNModal>
			)}
		</View>
	);
}

const formStyles = StyleSheet.create({
	container: {
		marginBottom: spacing.md,
	},
	label: {
		fontSize: typography.fontSizes.sm,
		fontWeight: typography.fontWeights.medium,
		color: colors.text.primary,
		marginBottom: spacing.xs,
	},
	selector: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderWidth: 1,
		borderColor: colors.neutral[300],
		borderRadius: 8,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		backgroundColor: colors.background.light,
		minHeight: 44,
	},
	selectorText: {
		fontSize: typography.fontSizes.base,
		color: colors.text.primary,
		flex: 1,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: hexToRgba(colors.background.dark ?? '#000000', 0.5),
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: colors.background.light,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: spacing.xl,
		maxHeight: '70%',
	},
	modalTitle: {
		fontSize: typography.fontSizes.lg,
		fontWeight: typography.fontWeights.bold,
		color: colors.text.primary,
		marginBottom: spacing.md,
	},
	modalOption: {
		padding: spacing.md,
		borderRadius: 8,
		marginBottom: spacing.xs,
		backgroundColor: colors.neutral[50],
	},
	modalOptionActive: {
		backgroundColor: colors.primary[50],
		borderWidth: 1,
		borderColor: colors.primary[600],
	},
	modalOptionText: {
		fontSize: typography.fontSizes.base,
		color: colors.text.primary,
	},
	modalOptionTextActive: {
		color: colors.primary[600],
		fontWeight: typography.fontWeights.semibold,
	},
	modalCloseButton: {
		marginTop: spacing.md,
		padding: spacing.md,
		alignItems: 'center',
		borderTopWidth: 1,
		borderTopColor: colors.neutral[200],
	},
	modalCloseText: {
		fontSize: typography.fontSizes.base,
		color: colors.primary[600],
		fontWeight: typography.fontWeights.semibold,
	},
});
