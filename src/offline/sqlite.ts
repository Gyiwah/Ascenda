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
    CREATE TABLE IF NOT EXISTS classes_cache (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      level INTEGER,
      academic_year TEXT,
      school_id TEXT,
      created_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_classes_school ON classes_cache (school_id);
    CREATE TABLE IF NOT EXISTS subjects_cache (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      code TEXT,
      school_id TEXT,
      created_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_subjects_school ON subjects_cache (school_id);
    CREATE TABLE IF NOT EXISTS students_cache (
      id TEXT PRIMARY KEY NOT NULL,
      full_name TEXT,
      admission_number TEXT,
      class_id TEXT,
      school_id TEXT,
      created_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_students_class ON students_cache (class_id);
    CREATE INDEX IF NOT EXISTS idx_students_school ON students_cache (school_id);
    CREATE TABLE IF NOT EXISTS offline_score_drafts (
      id TEXT PRIMARY KEY NOT NULL,
      student_id TEXT,
      subject_id TEXT,
      class_id TEXT,
      class_score REAL,
      exam_score REAL,
      synced INTEGER DEFAULT 0,
      updated_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_offline_scores_synced ON offline_score_drafts (synced);
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
