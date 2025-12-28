import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useCallback, useState } from 'react';
import { offlineService } from './offlineService';

/**
 * Hook to fetch data with automatic offline fallback
 * Tries online first, falls back to offline cache if network error occurs
 */
export function useFetchWithOffline<T>(
  onlineFetchFn: () => Promise<{ data: T | null; error?: any }>,
  offlineFetchFn?: () => Promise<T | null>
) {
  const { isOnline } = useNetworkStatus();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsOfflineData(false);

    try {
      if (isOnline) {
        // Try to fetch from online source
        console.log('[useFetchWithOffline] Fetching from online source...');
        const result = await onlineFetchFn();

        if (result.error) {
          throw result.error;
        }

        setData(result.data);
        setIsOfflineData(false);
      } else {
        // Network is offline, use offline data
        console.log('[useFetchWithOffline] Offline - using cached data...');
        if (offlineFetchFn) {
          const offlineData = await offlineFetchFn();
          setData(offlineData);
          setIsOfflineData(true);
        } else {
          throw new Error('No offline data available');
        }
      }
    } catch (err) {
      console.log(
        '[useFetchWithOffline] Online fetch failed, attempting offline fallback...'
      );
      setError(err);

      // Try offline fallback if online fetch failed
      if (offlineFetchFn) {
        try {
          const offlineData = await offlineFetchFn();
          setData(offlineData);
          setIsOfflineData(true);
          setError(null); // Clear error since we have offline data
        } catch (offlineErr) {
          console.error('[useFetchWithOffline] Offline fallback failed:', offlineErr);
          setData(null);
        }
      } else {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, onlineFetchFn, offlineFetchFn]);

  return { data, loading, error, isOfflineData, fetch, isOnline };
}

/**
 * Wrapper for user service with offline support
 * Automatically caches and retrieves user data
 */
export const offlineUserService = {
  async getAll() {
    try {
      // Always try online first
      const { data, error } = await import('@/api/users').then((m) =>
        m.userService.getAll()
      );

      if (!error && data) {
        // Cache successful response
        await offlineService.cacheUsers(data);
        return { data, error: null };
      }

      // Fall back to offline
      const offlineData = await offlineService.getOfflineUsers();
      return { data: offlineData, error: error ? 'Offline - using cached data' : null };
    } catch (error) {
      console.error('[offlineUserService] Error fetching users:', error);
      const offlineData = await offlineService.getOfflineUsers();
      return { data: offlineData, error };
    }
  },

  async getByRole(role: string, schoolId?: string) {
    try {
      const { data, error } = await import('@/api/users').then((m) =>
        m.userService.getByRole(role, schoolId)
      );

      if (!error && data) {
        // Cache successful response
        await offlineService.cacheUsers(data);
        return { data, error: null };
      }

      // Fall back to offline
      const offlineData =
        schoolId && role !== 'super_admin'
          ? await offlineService.getOfflineUsersBySchool(schoolId)
          : await offlineService.getOfflineUsersByRole(role);

      return {
        data: offlineData.filter((u) => u.role === role),
        error: error ? 'Offline - using cached data' : null,
      };
    } catch (error) {
      console.error('[offlineUserService] Error fetching users by role:', error);
      const offlineData =
        schoolId && role !== 'super_admin'
          ? await offlineService.getOfflineUsersBySchool(schoolId)
          : await offlineService.getOfflineUsersByRole(role);
      return {
        data: offlineData.filter((u) => u.role === role),
        error,
      };
    }
  },
};

/**
 * Wrapper for school service with offline support
 */
export const offlineSchoolService = {
  async getAll() {
    try {
      const { data, error } = await import('@/api/schools').then((m) =>
        m.schoolService.getAll()
      );

      if (!error && data) {
        // Cache successful response
        await offlineService.cacheSchools(data);
        return { data, error: null };
      }

      // Fall back to offline
      const offlineData = await offlineService.getOfflineSchools();
      return { data: offlineData, error: error ? 'Offline - using cached data' : null };
    } catch (error) {
      console.error('[offlineSchoolService] Error fetching schools:', error);
      const offlineData = await offlineService.getOfflineSchools();
      return { data: offlineData, error };
    }
  },
};
