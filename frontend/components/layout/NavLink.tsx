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
        "inline-flex min-h-11 items-center px-3.5 text-sm font-medium transition-colors",
        active
          ? "border-b-2 border-ink-900 text-ink-900"
          : "border-b-2 border-transparent text-ink-600 hover:text-ink-900",
      )}
    >
      {children}
    </Link>
  );
}
