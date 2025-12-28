import React, { useState } from 'react';
import { View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Props {
	initial?: Partial<{ name: string; level: number; academic_year: string }>;
	onSubmit: (values: any) => void;
	loading?: boolean;
}

export function ClassForm({ initial, onSubmit, loading }: Props) {
	const [values, setValues] = useState({
		name: initial?.name || '',
		level: initial?.level?.toString() || '',
		academic_year: initial?.academic_year || '',
	});

	return (
		<View>
			<Input label="Name" value={values.name} onChangeText={(v) => setValues({ ...values, name: v })} />
			<Input label="Level" value={values.level} onChangeText={(v) => setValues({ ...values, level: v })} />
			<Input label="Academic Year" value={values.academic_year} onChangeText={(v) => setValues({ ...values, academic_year: v })} />
			<Button title="Save" onPress={() => onSubmit({ ...values, level: Number(values.level) })} loading={!!loading} />
		</View>
	);
}
