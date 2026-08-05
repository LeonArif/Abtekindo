import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

type Variant = "cross" | "compass";

const VIEWBOX: Record<Variant, string> = {
  cross: "0 0 40 40",
  compass: "0 0 60 60",
};

/** Small deterministic hash so each instance drifts on its own rhythm instead
 * of every scribble on a page swaying in perfect unison. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Decorative line-art scattered lightly across section backgrounds: a
 * snowflake-like cross and a compass mark, both drifting slowly like falling
 * snow.
 *
 * Purely `aria-hidden` filler for the emptiness of a plain background — never
 * carries information, so it is safe to drop or duplicate anywhere a section
 * feels bare. Kept deliberately thin and low-opacity so it reads as texture,
 * not clutter. `prefers-reduced-motion` freezes the drift globally (see
 * globals.css).
 */
export function Scribble({
  variant,
  className,
  tone = "brand",
}: {
  variant: Variant;
  className?: string;
  tone?: "brand" | "gold";
}) {
  const stroke = tone === "gold" ? "var(--color-gold-300)" : "var(--color-brand-300)";

  // Several independent seeds off the same hash so amplitude, direction and
  // timing all vary per instance — otherwise every scribble on a page drifts
  // in identical lockstep, which reads as one shape rather than many flakes.
  const seed = hashString(`${variant}-${tone}-${className ?? ""}`);
  const duration = 6 + (seed % 5); // 6-10s
  const delay = -((seed % 700) / 100); // -0..-7s, so flakes start mid-cycle
  const driftX = (((seed >> 3) % 25) - 12) * (seed % 2 === 0 ? 1 : -1); // -12..12px, either direction
  const driftY = 16 + ((seed >> 6) % 14); // 16-29px
  const driftRot = (10 + ((seed >> 9) % 14)) * (seed % 4 < 2 ? 1 : -1); // 10-23deg, either direction

  return (
    <svg
      viewBox={VIEWBOX[variant]}
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className={cn("pointer-events-none absolute", className)}
      style={
        {
          animation: `snowflake-drift ${duration}s ease-in-out ${delay}s infinite`,
          "--drift-x": `${driftX}px`,
          "--drift-y": `${driftY}px`,
          "--drift-rot": `${driftRot}deg`,
        } as CSSProperties
      }
    >
      {variant === "cross" ? (
        <g transform="translate(20,20)">
          <line x1="-14" y1="0" x2="14" y2="0" />
          <line x1="0" y1="-14" x2="0" y2="14" />
          <line x1="-10" y1="-10" x2="10" y2="10" />
          <line x1="-10" y1="10" x2="10" y2="-10" />
        </g>
      ) : null}
      {variant === "compass" ? (
        <g transform="translate(30,30)">
          <circle cx="0" cy="0" r="5" />
          <line x1="0" y1="-26" x2="0" y2="-12" />
          <line x1="0" y1="12" x2="0" y2="26" />
          <line x1="-26" y1="0" x2="-12" y2="0" />
          <line x1="12" y1="0" x2="26" y2="0" />
        </g>
      ) : null}
    </svg>
  );
}
