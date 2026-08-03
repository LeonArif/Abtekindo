"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Loads data on mount, with reload and cancellation handled once.
 *
 * The admin CMS is client-rendered and reads everything from the API at
 * runtime, so several pages need the same "fetch on mount, show a spinner, then
 * show data or an error" shape. Putting it here means that logic, and the one
 * lint exemption it needs, exists in a single place rather than in every page.
 */

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; message: string };

export function useAsyncData<T>(load: () => Promise<T>): {
  state: AsyncState<T>;
  /** Re-runs the loader, for use after a mutation. */
  reload: () => Promise<void>;
  /** Replaces the error message, so callers can surface mutation failures. */
  setError: (message: string) => void;
} {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  // Flipped on unmount so a response that arrives late cannot update a
  // component that is already gone. A ref, not state: it must be mutable
  // without triggering a render.
  const unmounted = useRef(false);

  useEffect(() => {
    // Reset on mount as well as clearing on unmount, because React can remount
    // the same component instance and a stale `true` would silently discard
    // every subsequent result.
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  const run = useCallback(async () => {
    try {
      const data = await load();
      if (!unmounted.current) setState({ status: "ready", data });
    } catch (err) {
      if (!unmounted.current) {
        setState({
          status: "error",
          message:
            err instanceof Error
              ? err.message
              : "Gagal memuat data. Periksa koneksi Anda.",
        });
      }
    }
  }, [load]);

  useEffect(() => {
    // The loader awaits a network request before touching state, so nothing is
    // set synchronously here; the rule cannot see past the async boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run();
  }, [run]);

  const setError = useCallback((message: string) => {
    setState({ status: "error", message });
  }, []);

  return { state, reload: run, setError };
}
