import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Fades and lifts its content in once, on first paint.
 *
 * Pure CSS (see `.animate-reveal` in globals.css), so this stays a server
 * component — no observer or client-side mount logic needed for a one-time
 * page-load effect. `prefers-reduced-motion` disables it globally.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={cn("animate-reveal", className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
