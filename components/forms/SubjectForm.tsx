import React, { useState } from 'react';
import { View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Props {
	initial?: Partial<{ name: string; code: string }>;
	onSubmit: (values: any) => void;
	loading?: boolean;
}

export function SubjectForm({ initial, onSubmit, loading }: Props) {
	const [values, setValues] = useState({
		name: initial?.name || '',
		code: initial?.code || '',
	});

	return (
		<View>
			<Input label="Name" value={values.name} onChangeText={(v) => setValues({ ...values, name: v })} />
			<Input label="Code" value={values.code} onChangeText={(v) => setValues({ ...values, code: v })} />
			<Button title="Save" onPress={() => onSubmit(values)} loading={!!loading} />
		</View>
	);
}
