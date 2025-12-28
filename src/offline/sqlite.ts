import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

let databasePromise: Promise<SQLiteDatabase> | null = null;

function getDb(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync('ascenda.db');
  }
  return databasePromise;
}

export async function initOfflineDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY NOT NULL,
      user_id TEXT,
      access_token TEXT,
      refresh_token TEXT,
      expires_at INTEGER,
      payload TEXT
    );
    CREATE TABLE IF NOT EXISTS users_cache (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT,
      full_name TEXT,
      role TEXT,
      school_id TEXT,
      is_active INTEGER,
      created_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_users_role ON users_cache (role);
    CREATE INDEX IF NOT EXISTS idx_users_school ON users_cache (school_id);
    CREATE TABLE IF NOT EXISTS schools_cache (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      code TEXT,
      address TEXT,
      logo_url TEXT,
      created_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_schools_name ON schools_cache (name);
    CREATE INDEX IF NOT EXISTS idx_schools_code ON schools_cache (code);
  `);
}

export async function runSql<T = unknown>(
  sql: string,
  params: (string | number | null)[] = []
): Promise<T[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<T>(sql, params);
  return rows ?? [];
}

export async function runSqlWrite(
  sql: string,
  params: (string | number | null)[] = []
): Promise<void> {
  const db = await getDb();
  await db.runAsync(sql, params);
}
