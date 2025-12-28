import { initOfflineDb, runSql, runSqlWrite } from './sqlite';
import { userService } from '@/api/users';
import { schoolService } from '@/api/schools';
import { classService } from '@/api/classes';
import { User, School } from '@/types/database';

/**
 * OfflineService - Manages offline-first data synchronization
 * Provides methods to:
 * 1. Cache data from Supabase to SQLite
 * 2. Fetch from cache when offline
 * 3. Sync data when connection is restored
 */

export const offlineService = {
  /**
   * Initialize offline database and sync cached data
   */
  async initialize() {
    try {
      console.log('[offlineService] Initializing offline database...');
      await initOfflineDb();
      console.log('[offlineService] Offline database initialized');
    } catch (error) {
      console.error('[offlineService] Failed to initialize offline db:', error);
    }
  },

  /**
   * Sync all critical data from Supabase to SQLite cache
   * Called on app startup and when connection is restored
   */
  async syncAllData() {
    try {
      console.log('[offlineService] Starting full data sync...');
      const start = Date.now();

      // Fetch all data in parallel
      const [usersRes, schoolsRes] = await Promise.all([
        userService.getAll(),
        schoolService.getAll(),
      ]);

      // Cache users
      if (usersRes.data?.length) {
        await this.cacheUsers(usersRes.data);
        console.log(`[offlineService] Cached ${usersRes.data.length} users`);
      }

      // Cache schools
      if (schoolsRes.data?.length) {
        await this.cacheSchools(schoolsRes.data);
        console.log(`[offlineService] Cached ${schoolsRes.data.length} schools`);
      }

      const duration = Date.now() - start;
      console.log(`[offlineService] Full data sync completed in ${duration}ms`);
      return true;
    } catch (error) {
      console.error('[offlineService] Error during full sync:', error);
      return false;
    }
  },

  /**
   * Cache users to SQLite
   */
  async cacheUsers(users: User[]) {
    try {
      // Clear existing cache
      await runSqlWrite('DELETE FROM users_cache;');

      // Insert new users
      for (const user of users) {
        await runSqlWrite(
          `INSERT OR REPLACE INTO users_cache 
           (id, email, full_name, role, school_id, is_active, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            user.id,
            user.email,
            user.full_name,
            user.role,
            user.school_id || null,
            user.is_active ? 1 : 0,
            user.created_at,
          ]
        );
      }

      console.log(`[offlineService] Successfully cached ${users.length} users`);
    } catch (error) {
      console.error('[offlineService] Error caching users:', error);
      throw error;
    }
  },

  /**
   * Cache schools to SQLite
   */
  async cacheSchools(schools: School[]) {
    try {
      // Clear existing cache
      await runSqlWrite('DELETE FROM schools_cache;');

      // Insert new schools
      for (const school of schools) {
        await runSqlWrite(
          `INSERT OR REPLACE INTO schools_cache 
           (id, name, code, address, logo_url, created_at) 
           VALUES (?, ?, ?, ?, ?, ?);`,
          [
            school.id,
            school.name,
            school.code,
            school.address || null,
            school.logo_url || null,
            school.created_at,
          ]
        );
      }

      console.log(`[offlineService] Successfully cached ${schools.length} schools`);
    } catch (error) {
      console.error('[offlineService] Error caching schools:', error);
      throw error;
    }
  },

  /**
   * Get users from offline cache
   */
  async getOfflineUsers(): Promise<User[]> {
    try {
      const rows = await runSql<any>(
        `SELECT * FROM users_cache ORDER BY full_name ASC;`
      );

      return rows.map((row) => ({
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        role: row.role,
        school_id: row.school_id,
        is_active: row.is_active === 1,
        created_at: row.created_at,
      }));
    } catch (error) {
      console.error('[offlineService] Error reading offline users:', error);
      return [];
    }
  },

  /**
   * Get schools from offline cache
   */
  async getOfflineSchools(): Promise<School[]> {
    try {
      const rows = await runSql<any>(
        `SELECT * FROM schools_cache ORDER BY name ASC;`
      );

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        address: row.address,
        logo_url: row.logo_url,
        is_active: true,
        created_at: row.created_at,
      }));
    } catch (error) {
      console.error('[offlineService] Error reading offline schools:', error);
      return [];
    }
  },

  /**
   * Get offline users by role
   */
  async getOfflineUsersByRole(role: string): Promise<User[]> {
    try {
      const rows = await runSql<any>(
        `SELECT * FROM users_cache WHERE role = ? ORDER BY full_name ASC;`,
        [role]
      );

      return rows.map((row) => ({
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        role: row.role,
        school_id: row.school_id,
        is_active: row.is_active === 1,
        created_at: row.created_at,
      }));
    } catch (error) {
      console.error(
        `[offlineService] Error reading offline users by role ${role}:`,
        error
      );
      return [];
    }
  },

  /**
   * Get offline schools for a school
   */
  async getOfflineUsersBySchool(schoolId: string): Promise<User[]> {
    try {
      const rows = await runSql<any>(
        `SELECT * FROM users_cache WHERE school_id = ? ORDER BY full_name ASC;`,
        [schoolId]
      );

      return rows.map((row) => ({
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        role: row.role,
        school_id: row.school_id,
        is_active: row.is_active === 1,
        created_at: row.created_at,
      }));
    } catch (error) {
      console.error(
        `[offlineService] Error reading offline users for school ${schoolId}:`,
        error
      );
      return [];
    }
  },

  /**
   * Clear all offline cache
   */
  async clearCache() {
    try {
      console.log('[offlineService] Clearing all offline cache...');
      await runSqlWrite('DELETE FROM users_cache;');
      await runSqlWrite('DELETE FROM schools_cache;');
      console.log('[offlineService] Offline cache cleared');
    } catch (error) {
      console.error('[offlineService] Error clearing cache:', error);
      throw error;
    }
  },
};
