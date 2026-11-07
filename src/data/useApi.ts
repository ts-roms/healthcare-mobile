import { useFocusEffect } from 'expo-router';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

type State<T> = { data: T | undefined; error: Error | undefined; loading: boolean };

/**
 * Loads data when the screen gains focus and keeps it in component memory only.
 * Nothing is cached on the device (decision D10).
 * `deps` are the request's inputs (e.g. a route id); the request re-runs when they change.
 */
export function useApi<T>(load: () => Promise<T>, deps: readonly unknown[] = []) {
  const [state, setState] = useState<State<T>>({ data: undefined, error: undefined, loading: true });
  const seq = useRef(0);
  const loadRef = useRef(load);
  // Runs before the focus effect below, so the newest loader is always used.
  useLayoutEffect(() => {
    loadRef.current = load;
  });
  const key = JSON.stringify(deps);

  const run = useCallback(() => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: undefined }));
    loadRef.current().then(
      (data) => id === seq.current && setState({ data, error: undefined, loading: false }),
      (error: Error) => id === seq.current && setState((s) => ({ ...s, error, loading: false })),
    );
    // `key` stands for `deps`; re-create the loader when the inputs change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useFocusEffect(run);

  return { ...state, reload: run, setData: (data: T) => setState((s) => ({ ...s, data })) };
}
