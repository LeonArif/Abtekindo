import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "outline-invert"
  | "whatsapp"
  | "invert"
  | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary: "bg-ink-900 text-white hover:bg-ink-800 shadow-sm",
  outline: "border border-ink-300 bg-white text-ink-800 hover:bg-ink-50",
  // Outline button for a dark section. A separate variant rather than an
  // override className on "outline": two same-specificity utility classes
  // (e.g. its bg-white vs an override's bg-transparent) resolve by Tailwind's
  // stylesheet order, not by className position, so overriding is unreliable.
  "outline-invert": "border border-white/40 text-white hover:bg-white/10",
  whatsapp: "bg-whatsapp text-white hover:bg-whatsapp-dark shadow-sm",
  // For a call to action sitting on a dark section: the theme's CTA colour is
  // near-black, so a light surface needs to flip instead of disappearing.
  invert: "bg-white text-ink-900 hover:bg-ink-100 shadow-sm",
  ghost: "text-ink-700 hover:bg-ink-100",
};

const sizes: Record<Size, string> = {
  // Every size clears the 44px minimum touch target, which matters because most
  // of this site's traffic will be on a phone.
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-7 text-base sm:text-lg",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[2px] font-semibold " +
  "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60";

function classesFor(variant: Variant, size: Size, fullWidth: boolean, className?: string) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

type SharedProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
};

/** Button rendered as a real <button>. */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: SharedProps & ComponentProps<"button">) {
  return (
    <button className={classesFor(variant, size, fullWidth, className)} {...props}>
      {children}
    </button>
  );
}

/** Button-styled internal link. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: SharedProps & ComponentProps<typeof Link>) {
  return (
    <Link className={classesFor(variant, size, fullWidth, className)} {...props}>
      {children}
    </Link>
  );
}

/**
 * Button-styled external link.
 *
 * `rel="noopener"` is required alongside target="_blank": without it the opened
 * page gets a handle on this one through window.opener.
 */
export function ExternalButtonLink({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: SharedProps & ComponentProps<"a">) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={classesFor(variant, size, fullWidth, className)}
      {...props}
    >
      {children}
    </a>
  );
}
