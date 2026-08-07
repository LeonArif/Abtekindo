"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Desktop navigation link that marks the current section.
 *
 * A client component only because it reads the pathname; it renders no state of
 * its own and adds a negligible amount to the bundle.
 */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // The home link must match exactly, or it would highlight on every page.
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative inline-flex min-h-11 items-center border-b-2 px-3.5 text-sm font-medium transition-colors",
        active ? "border-ink-900 text-ink-900" : "border-transparent text-ink-600 hover:text-ink-900",
      )}
    >
      {children}
      {/* Hover-only underline, light grey, sliding in from the left. The
          active page's border-b above is static, so this never renders
          alongside it. */}
      {!active ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-3.5 bottom-0 h-0.5 origin-left scale-x-0 bg-ink-300 transition-transform duration-300 ease-out group-hover:scale-x-100"
        />
      ) : null}
    </Link>
  );
}
