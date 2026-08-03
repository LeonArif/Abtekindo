import Link from "next/link";

import { SITE } from "@/lib/site";
import { cn } from "@/lib/cn";

/**
 * Wordmark used until the company supplies a real logo file.
 *
 * A typeset wordmark is the honest placeholder here: inventing a logo would
 * mean shipping fake brand identity that looks finished and quietly stays.
 * Drop a real file into /public and replace this component's contents.
 */
export function Logo({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label={`${SITE.legalName}, ke beranda`}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold",
          inverted ? "bg-white text-brand-700" : "bg-brand-600 text-white",
        )}
        aria-hidden="true"
      >
        A
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-lg font-bold tracking-tight",
            inverted ? "text-white" : "text-ink-900",
          )}
        >
          {SITE.name}
        </span>
        <span
          className={cn(
            "text-[0.65rem] font-medium uppercase tracking-wider",
            inverted ? "text-brand-200" : "text-ink-500",
          )}
        >
          Primalestari
        </span>
      </span>
    </Link>
  );
}
