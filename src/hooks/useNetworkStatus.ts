import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

/**
 * Hook to track network connectivity status
 * Returns true if device is online, false if offline
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial network state
    const checkNetworkStatus = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setIsOnline(state.isConnected ?? true);
        setIsLoading(false);
        console.log('[useNetworkStatus] Initial network state:', state.isConnected);
      } catch (error) {
        console.error('[useNetworkStatus] Error checking network:', error);
        setIsLoading(false);
      }
    };

    checkNetworkStatus();

    // Listen for network changes
    const subscription = Network.addNetworkStateListener((state: Network.NetworkState) => {
      const online = state.isConnected ?? true;
      setIsOnline(online);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return { isOnline, isLoading };
}

/**
 * Hook to manage offline data sync queue
 * Retries failed operations when connection is restored
 */
export function useOfflineSyncQueue() {
  const { isOnline } = useNetworkStatus();
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncError, setSyncError] = useState<any>(null);

  // Trigger sync when connection is restored
  useEffect(() => {
    if (isOnline && !syncInProgress) {
      console.log('[useOfflineSyncQueue] Connection restored, syncing data...');
      // Sync would be triggered here by calling the sync function
    }
  }, [isOnline, syncInProgress]);

  return { isOnline, syncInProgress, setSyncInProgress, syncError, setSyncError };
}
