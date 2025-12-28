import React, { useState } from 'react';
import { View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Props {
	initial?: Partial<{ name: string; code: string; address: string; contact_email: string; contact_phone: string }>;
	onSubmit: (values: any) => void;
	loading?: boolean;
}

export function SchoolForm({ initial, onSubmit, loading }: Props) {
	const [values, setValues] = useState({
		name: initial?.name || '',
		code: initial?.code || '',
		address: initial?.address || '',
		contact_email: initial?.contact_email || '',
		contact_phone: initial?.contact_phone || '',
	});

	return (
		<View>
			<Input label="Name" value={values.name} onChangeText={(v) => setValues({ ...values, name: v })} />
			<Input label="Code" value={values.code} onChangeText={(v) => setValues({ ...values, code: v })} />
			<Input label="Address" value={values.address} onChangeText={(v) => setValues({ ...values, address: v })} />
			<Input label="Contact Email" value={values.contact_email} onChangeText={(v) => setValues({ ...values, contact_email: v })} />
			<Input label="Contact Phone" value={values.contact_phone} onChangeText={(v) => setValues({ ...values, contact_phone: v })} />
			<Button title="Save" onPress={() => onSubmit(values)} loading={!!loading} />
		</View>
	);
}
