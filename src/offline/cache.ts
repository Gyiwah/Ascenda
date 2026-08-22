import { runSql, runSqlWrite } from './sqlite';
import { School, User } from '@/types/database';

// Sessions
export async function saveSession(session: {
	user_id: string | null;
	access_token: string | null;
	refresh_token: string | null;
	expires_at: number | null;
	payload: unknown;
}) {
	await runSqlWrite(`DELETE FROM sessions WHERE id = 1;`);
	await runSqlWrite(
		`INSERT INTO sessions (id, user_id, access_token, refresh_token, expires_at, payload) VALUES (1, ?, ?, ?, ?, ?);`,
		[
			session.user_id || null,
			session.access_token || null,
			session.refresh_token || null,
			session.expires_at ?? null,
			JSON.stringify(session.payload ?? null),
		]
	);
}

export async function loadSession(): Promise<
	| { user_id: string | null; access_token: string | null; refresh_token: string | null; expires_at: number | null; payload: any }
	| null
> {
	const rows = await runSql<any>(`SELECT * FROM sessions WHERE id = 1;`);
	if (!rows.length) return null;
	const row = rows[0];
	return {
		user_id: row.user_id,
		access_token: row.access_token,
		refresh_token: row.refresh_token,
		expires_at: row.expires_at,
		payload: row.payload ? JSON.parse(row.payload) : null,
	};
}

export async function clearSession() {
	await runSqlWrite(`DELETE FROM sessions WHERE id = 1;`);
}

// Schools cache
export async function cacheSchools(schools: School[]) {
	await runSqlWrite(`DELETE FROM schools_cache;`);
	for (const s of schools) {
		await runSqlWrite(
			`INSERT OR REPLACE INTO schools_cache (id, name, code, address, logo_url, created_at) VALUES (?, ?, ?, ?, ?, ?);`,
			[s.id, s.name, s.code || null, s.address || null, s.logo_url || null, s.created_at]
		);
	}
}

export async function getCachedSchools(): Promise<School[]> {
	const rows = await runSql<any>(`SELECT * FROM schools_cache ORDER BY name ASC;`);
	return rows as School[];
}

// Users cache
export async function cacheUsers(users: User[]) {
	await runSqlWrite(`DELETE FROM users_cache;`);
	for (const u of users) {
		await runSqlWrite(
			`INSERT OR REPLACE INTO users_cache (id, email, full_name, role, school_id, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
			[u.id, u.email, u.full_name, u.role, u.school_id || null, u.is_active ? 1 : 0, u.created_at]
		);
	}
}

export async function getCachedUsers(options?: { role?: string; schoolId?: string }): Promise<User[]> {
	let sql = `SELECT * FROM users_cache`;
	const params: (string | number | null)[] = [];

	const filters: string[] = [];
	if (options?.role) {
		filters.push(`role = ?`);
		params.push(options.role);
	}
	if (options?.schoolId) {
		filters.push(`school_id = ?`);
		params.push(options.schoolId);
	}
	if (filters.length) {
		sql += ` WHERE ` + filters.join(' AND ');
	}
	sql += ` ORDER BY created_at DESC`;

	const rows = await runSql<any>(sql, params);
	return rows.map((r) => ({ ...r, is_active: !!r.is_active })) as User[];
}


