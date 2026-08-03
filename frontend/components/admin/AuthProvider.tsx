"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import * as api from "@/lib/api/browser";
import type { AdminUser } from "@/lib/api/types";

/**
 * Admin session state.
 *
 * The session lives entirely in HttpOnly cookies, which JavaScript cannot read.
 * This provider therefore asks the API who the caller is on mount rather than
 * decoding a token client-side, which also means a revoked session is detected
 * on the next page load instead of when the token happens to expire.
 */

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: AdminUser }
  | { status: "anonymous" };

type AuthContextValue = {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const router = useRouter();

  const check = useCallback(async () => {
    try {
      const { user } = await api.currentUser();
      setState({ status: "authenticated", user });
    } catch {
      // The 15-minute access token may simply have expired while the longer
      // lived refresh cookie is still good, so try one rotation before
      // declaring the visitor logged out.
      try {
        const { user } = await api.refreshSession();
        setState({ status: "authenticated", user });
      } catch {
        setState({ status: "anonymous" });
      }
    }
  }, []);

  useEffect(() => {
    // The session lives in HttpOnly cookies that JavaScript cannot read, so the
    // only way to learn who the caller is, is to ask the API. `check` awaits
    // that request before touching state, so nothing is set synchronously here;
    // the rule cannot see past the async boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void check();
  }, [check]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user } = await api.login(email, password);
    setState({ status: "authenticated", user });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      // Local state is cleared even if the call failed, so a network problem
      // cannot leave someone stuck in a session they asked to end.
      setState({ status: "anonymous" });
      router.push("/admin/masuk");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
