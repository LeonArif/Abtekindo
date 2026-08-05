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
  const barColor = inverted ? "#ffffff" : "#9DC6E8";
  const diamondColor = "#FBC94C";

  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label={`${SITE.legalName}, ke beranda`}
    >
      {/* "Crystal mark": a six-point snowflake built from three crossing bars
          plus six tip bars, with a small diamond at the center. */}
      <svg width="30" height="30" viewBox="0 0 40 40" aria-hidden="true">
        <g stroke={barColor} strokeWidth="3.2" strokeLinecap="round">
          <line x1="4" y1="20" x2="36" y2="20" />
          <line x1="12" y1="6.14" x2="28" y2="33.86" />
          <line x1="24" y1="6.14" x2="16" y2="33.86" />
          <line x1="34.4" y1="16.1" x2="34.4" y2="23.9" />
          <line x1="23.82" y1="34.42" x2="30.58" y2="30.52" />
          <line x1="9.42" y1="30.52" x2="16.18" y2="34.42" />
          <line x1="5.6" y1="16.1" x2="5.6" y2="23.9" />
          <line x1="16.18" y1="5.58" x2="9.42" y2="9.48" />
          <line x1="30.58" y1="9.48" x2="23.82" y2="5.58" />
        </g>
        <rect
          x="16.4"
          y="16.4"
          width="7.2"
          height="7.2"
          fill={diamondColor}
          transform="rotate(45 20 20)"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-lg font-semibold uppercase tracking-wide",
            inverted ? "text-white" : "text-ink-900",
          )}
        >
          {SITE.name}
        </span>
        <span
          className={cn(
            "text-[0.65rem] font-medium uppercase tracking-wider",
            inverted ? "text-white/60" : "text-ink-500",
          )}
        >
          Primalestari
        </span>
      </span>
    </Link>
  );
}
