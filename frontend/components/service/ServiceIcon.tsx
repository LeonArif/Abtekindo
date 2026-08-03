/**
 * Maps the CMS `icon` string to a glyph.
 *
 * Icons are inline SVG rather than an icon library: the site needs about six of
 * them, and a dependency would ship far more bytes than the whole set costs.
 * An unknown name falls back to the wrench so a newly added service still
 * renders rather than leaving a hole in the layout.
 */
export function ServiceIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (name) {
    case "sparkles":
      return (
        <svg {...common}>
          <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z" />
          <path d="M19 14l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9L19 14Z" />
        </svg>
      );
    case "plug":
      return (
        <svg {...common}>
          <path d="M9 2v6M15 2v6" />
          <path d="M6 8h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8Z" />
          <path d="M12 17v5" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <path d="M2 7h11v10H2z" />
          <path d="M13 10h4l4 4v3h-8z" />
          <circle cx="6.5" cy="18.5" r="1.8" />
          <circle cx="17" cy="18.5" r="1.8" />
        </svg>
      );
    case "gauge":
      return (
        <svg {...common}>
          <path d="M12 14l4-4" />
          <circle cx="12" cy="14" r="1" />
          <path d="M3.5 17a9 9 0 1 1 17 0" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );
    case "wrench":
    default:
      return (
        <svg {...common}>
          <path d="M14.7 6.3a4 4 0 0 0 5 5l-8.4 8.4a2.8 2.8 0 0 1-4-4l7.4-9.4Z" />
          <path d="M14.7 6.3 17.5 3.5a4 4 0 0 1 3 6.8" />
        </svg>
      );
  }
}
