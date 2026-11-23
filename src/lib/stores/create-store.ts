import * as React from "react";

export type SetStateAction<T> = Partial<T> | ((prevState: T) => Partial<T>);

export interface StoreApi<T> {
  getState: () => T;
  setState: (updater: SetStateAction<T>) => void;
  subscribe: (listener: () => void) => () => void;
}

export type UseStore<T> = {
  (): T;
  <U>(selector: (state: T) => U): U;
  getState: () => T;
  setState: (updater: SetStateAction<T>) => void;
  subscribe: (listener: () => void) => () => void;
};

/**
 * Creates a reactive, React 19 concurrent-safe client store backed by useSyncExternalStore.
 * Provides the same ergonomic API as Zustand without requiring an external dependency.
 */
export function createStore<T extends object>(
  initializer: (
    set: (updater: SetStateAction<T>) => void,
    get: () => T
  ) => T,
  options?: {
    persistKey?: string;
  }
): UseStore<T> {
  let state: T;
  const listeners = new Set<() => void>();

  const getState = () => state;

  const setState = (updater: SetStateAction<T>) => {
    const nextPartial = typeof updater === "function" ? updater(state) : updater;
    const nextState = { ...state, ...nextPartial };

    if (Object.is(state, nextState)) return;
    state = nextState;

    // Optional localStorage persistence
    if (options?.persistKey && typeof window !== "undefined") {
      try {
        localStorage.setItem(options.persistKey, JSON.stringify(state));
      } catch {
        // Ignore storage write quota exceptions
      }
    }

    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  // Initialize state
  const initialValue = initializer(setState, getState);
  state = initialValue;

  // Hydrate from localStorage if persistent
  if (options?.persistKey && typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(options.persistKey);
      if (saved) {
        state = { ...initialValue, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback to initialValue
    }
  }

  function useStore<U>(selector?: (state: T) => U): U | T {
    const getSnapshot = React.useCallback(() => {
      return selector ? selector(state) : state;
    }, [selector]);

    const getServerSnapshot = React.useCallback(() => {
      return selector ? selector(initialValue) : initialValue;
    }, [selector]);

    return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  }

  useStore.getState = getState;
  useStore.setState = setState;
  useStore.subscribe = subscribe;

  return useStore as UseStore<T>;
}
