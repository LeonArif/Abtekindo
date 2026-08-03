"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SITE } from "@/lib/site";
import { AdminApiError } from "@/lib/api/browser";
import { useAuth } from "@/components/admin/AuthProvider";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const { state, signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Someone who is already signed in has no business on the login screen.
  useEffect(() => {
    if (state.status === "authenticated") {
      router.replace("/admin");
    }
  }, [state.status, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setSubmitting(true);
    setError(null);

    try {
      await signIn(String(data.get("email") ?? ""), String(data.get("password") ?? ""));
      router.replace("/admin");
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            A
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink-900">Panel Admin</h1>
          <p className="mt-1 text-sm text-ink-500">{SITE.legalName}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-card border border-ink-200 bg-white p-6"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-800">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              autoFocus
              className="mt-1.5 w-full rounded-lg border border-ink-300 px-3.5 py-2.5 text-base focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-800">
              Kata sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-lg border border-ink-300 px-3.5 py-2.5 text-base focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {error ? (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? "Memproses..." : "Masuk"}
          </Button>
        </form>
      </div>
    </div>
  );
}
