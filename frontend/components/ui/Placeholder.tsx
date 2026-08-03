import Image from "next/image";

import { cn } from "@/lib/cn";

/**
 * Stand-in for imagery the company has not supplied yet.
 *
 * It renders a branded panel at the correct aspect ratio and names the intended
 * subject, so an unfinished page still looks deliberate and it is obvious what
 * photo belongs there. Once a real image exists, `ProductImage` below swaps to
 * it with no layout shift.
 */
export function Placeholder({
  label,
  className,
  aspect = "aspect-[4/3]",
}: {
  label: string;
  className?: string;
  aspect?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        "bg-gradient-to-br from-brand-50 via-ink-50 to-brand-100",
        aspect,
        className,
      )}
      role="img"
      aria-label={label}
    >
      <AirConditionerGlyph className="absolute h-24 w-24 text-brand-200" />
      <span className="relative z-10 px-4 text-center text-xs font-medium text-brand-700/70">
        {label}
      </span>
    </div>
  );
}

/**
 * Product image with a placeholder fallback.
 *
 * The real <Image> carries explicit dimensions and `sizes` from the start, so
 * replacing placeholder content with real photography needs no further work.
 */
export function ProductImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  // A rooted path means the API had no public image origin configured, so the
  // key would not resolve to anything a browser can load.
  const usable = src && /^https?:\/\//.test(src);

  if (!usable) {
    return <Placeholder label={alt} className={className} />;
  }

  return (
    <div className={cn("relative aspect-[4/3] overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}

/** Simple wall-mounted split unit outline, used as placeholder decoration. */
export function AirConditionerGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="6" y="16" width="52" height="20" rx="5" />
      <path d="M12 30h40" />
      <path d="M18 42c0 3 3 3 3 6" />
      <path d="M30 42c0 3 3 3 3 6" />
      <path d="M42 42c0 3 3 3 3 6" />
    </svg>
  );
}
