"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { SITE } from "@/lib/site";
import { cn } from "@/lib/cn";
import { useAuth } from "./AuthProvider";

const ADMIN_NAV = [
  { href: "/admin", label: "Ringkasan", exact: true },
  { href: "/admin/produk", label: "Produk" },
  { href: "/admin/layanan", label: "Layanan" },
  { href: "/admin/prospek", label: "Prospek" },
];

/**
 * Chrome and access gate for the CMS.
 *
 * The gate here is a convenience so an unauthenticated visitor sees the login
 * screen rather than a page of failing requests. It is not the security
 * boundary: the API rejects every admin request without a valid session cookie,
 * which is what actually protects the data.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { state, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/admin/masuk";

  useEffect(() => {
    if (state.status === "anonymous" && !isLoginPage) {
      router.replace("/admin/masuk");
    }
  }, [state.status, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-ink-500" role="status">
          Memuat...
        </p>
      </div>
    );
  }

  if (state.status === "anonymous") {
    // The redirect above is in flight; rendering nothing avoids a flash of the
    // admin layout for someone who is not allowed to see it.
    return null;
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              A
            </span>
            <div>
              <p className="text-sm font-bold text-ink-900">Panel Admin</p>
              <p className="text-xs text-ink-500">{SITE.legalName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-600 hover:bg-ink-100"
            >
              Lihat situs
            </Link>
            <span className="hidden text-sm text-ink-500 sm:inline">
              {state.user.name}
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex min-h-11 items-center rounded-lg border border-ink-300 px-3.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
            >
              Keluar
            </button>
          </div>
        </div>

        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Navigasi admin">
          <ul className="flex gap-1 overflow-x-auto">
            {ADMIN_NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-12 items-center whitespace-nowrap border-b-2 px-4 text-sm font-medium",
                      active
                        ? "border-brand-600 text-brand-700"
                        : "border-transparent text-ink-600 hover:text-ink-900",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
