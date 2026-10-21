"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** False during the server render and hydration, true once running in the browser. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

const STORE_EVENT = "mizan-storage";

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * A localStorage value as React state: null on the server, the stored value in
 * the browser, and kept in sync across components and tabs.
 */
export function useStoredValue(key: string): string | null {
  return useSyncExternalStore(
    (onChange) => {
      const handler = (e: Event) => {
        if (e instanceof StorageEvent ? e.key === key : (e as CustomEvent).detail === key) {
          onChange();
        }
      };
      window.addEventListener("storage", handler);
      window.addEventListener(STORE_EVENT, handler);
      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener(STORE_EVENT, handler);
      };
    },
    () => readStored(key),
    () => null,
  );
}

/** Write (or with null, remove) a stored value and notify useStoredValue readers. */
export function setStoredValue(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage blocked or full: the preference just is not kept */
  }
  window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: key }));
}

/** Read once, outside React (for lazy initial state after hydration). */
export function readStoredValue(key: string): string | null {
  return readStored(key);
}

/**
 * A JSON value kept in this browser, read through `parse` (which must accept
 * null and nonsense), with a setter that keeps every reader in step.
 */
export function useStoredState<T>(key: string, parse: (raw: string | null) => T): [T, (next: T) => void] {
  const value = parse(useStoredValue(key));
  return [value, (next: T) => setStoredValue(key, JSON.stringify(next))];
}

/**
 * Several stored values at once, as a reader for them: for lists of keys that
 * do not change, such as every tool in the phone registry.
 */
export function useStoredValues(keys: readonly string[]): (key: string) => string | null {
  // One string for all of them, so React can tell when any changed.
  const joined = useSyncExternalStore(
    (onChange) => {
      const handler = (e: Event) => {
        const changed = e instanceof StorageEvent ? e.key : (e as CustomEvent).detail;
        if (changed === null || keys.includes(changed)) onChange();
      };
      window.addEventListener("storage", handler);
      window.addEventListener(STORE_EVENT, handler);
      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener(STORE_EVENT, handler);
      };
    },
    () => JSON.stringify(keys.map(readStored)),
    () => "[]",
  );
  const values = JSON.parse(joined) as (string | null)[];
  return (key) => values[keys.indexOf(key)] ?? null;
}
