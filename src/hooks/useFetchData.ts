import { useCallback, useState, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';

type FetchResult<T> = { data: T | null; error?: any };

export function useFetchData<T>(
  fetchFn: () => Promise<FetchResult<T>>
): { data: T | null; loading: boolean; error: any; refresh: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Keep a ref to the latest fetchFn so refresh can be stable between renders
  const fetchFnRef = useRef(fetchFn);
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current();
      if (result?.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result?.data ?? null);
      }
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run refresh when the screen comes into focus. `refresh` is stable.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return { data, loading, error, refresh };
}

type FetchFunctions = Record<string, () => Promise<FetchResult<any>>>;

export function useFetchMultiple<T extends Record<string, any>>(
  fetchFunctions: FetchFunctions
): {
  data: Partial<T>;
  loading: boolean;
  errors: Record<string, any>;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<Partial<T>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, any>>({});

  // Keep a ref to the latest fetchFunctions so refresh remains stable
  const fetchFunctionsRef = useRef<FetchFunctions>(fetchFunctions);
  useEffect(() => {
    fetchFunctionsRef.current = fetchFunctions;
  }, [fetchFunctions]);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setErrors({});

    const results: Partial<T> = {};
    const newErrors: Record<string, any> = {};

    const entries = Object.entries(fetchFunctionsRef.current || {});
    try {
      const promises = entries.map(async ([key, fn]) => {
        try {
          const result = await fn();
          if (result?.error) {
            newErrors[key] = result.error;
            results[key as keyof T] = null as any;
          } else {
            results[key as keyof T] = result?.data;
          }
        } catch (err) {
          newErrors[key] = err;
          results[key as keyof T] = null as any;
        }
      });

      await Promise.all(promises);
      setData(results);
      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return { data, loading, errors, refresh };
}
