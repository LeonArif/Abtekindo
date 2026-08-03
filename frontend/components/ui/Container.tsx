import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Standard page gutter and max width, shared by every section. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

/**
 * A vertical page section with consistent rhythm.
 *
 * `tone` switches the background: alternating plain and muted sections is what
 * gives a long marketing page visible structure without extra dividers.
 */
export function Section({
  children,
  className,
  tone = "plain",
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: "plain" | "muted" | "brand";
  id?: string;
}) {
  const tones = {
    plain: "bg-white",
    muted: "bg-ink-50",
    brand: "bg-brand-900 text-white",
  } as const;

  return (
    <section id={id} className={cn("py-14 sm:py-20", tones[tone], className)}>
      <Container>{children}</Container>
    </section>
  );
}

/** Section heading with an optional eyebrow and supporting line. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  inverted = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  inverted?: boolean;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-sm font-semibold uppercase tracking-wide",
            inverted ? "text-brand-300" : "text-brand-600",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "mt-2 text-3xl font-bold tracking-tight sm:text-4xl",
          inverted ? "text-white" : "text-ink-900",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg",
            inverted ? "text-brand-100" : "text-ink-600",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
