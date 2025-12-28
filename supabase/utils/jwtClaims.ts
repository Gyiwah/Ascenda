export interface AscendaJWTClaims {
	role?: 'super_admin' | 'admin' | 'headmaster' | 'teacher' | 'student';
	school_id?: string | null;
}

export function parseClaims(token: any): AscendaJWTClaims {
	try {
		return (token?.user_metadata as AscendaJWTClaims) || {};
	} catch {
		return {};
	}
}
