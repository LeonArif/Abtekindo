import Link from "next/link";

import { NAV_LINKS, SITE, formatAddress, hasWhatsApp } from "@/lib/site";
import { generalEnquiry } from "@/lib/whatsapp";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "./MobileNav";

const SERVICE_LINKS = [
  { href: "/layanan#cuci-ac", label: "Cuci AC" },
  { href: "/layanan#service-perbaikan", label: "Service dan Perbaikan" },
  { href: "/layanan#instalasi-ac-baru", label: "Instalasi AC Baru" },
  { href: "/layanan#bongkar-pasang", label: "Bongkar Pasang AC" },
  { href: "/layanan#isi-freon", label: "Isi Freon" },
  { href: "/layanan#kontrak-perawatan", label: "Kontrak Perawatan" },
];

export function Footer() {
  const year = new Date().getFullYear();
  const socials = Object.entries(SITE.social).filter(([, url]) => url);

  return (
    <footer className="mt-auto bg-ink-900 text-ink-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo inverted />
            <p className="mt-4 text-sm leading-relaxed">
              Melayani penjualan, pemasangan, dan perawatan AC untuk rumah,
              kantor, dan tempat usaha.
            </p>
            {hasWhatsApp ? (
              <a
                href={generalEnquiry()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-[2px] bg-white px-4 text-sm font-semibold text-ink-900 hover:bg-ink-100"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Chat WhatsApp
              </a>
            ) : null}
          </div>

          <nav aria-labelledby="footer-nav">
            <h2 id="footer-nav" className="text-sm font-semibold uppercase tracking-wide text-white">
              Navigasi
            </h2>
            <ul className="mt-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-9 items-center text-sm hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-services">
            <h2 id="footer-services" className="text-sm font-semibold uppercase tracking-wide text-white">
              Layanan
            </h2>
            <ul className="mt-4 space-y-1">
              {SERVICE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-9 items-center text-sm hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
              Hubungi Kami
            </h2>
            <address className="mt-4 space-y-3 text-sm not-italic">
              <p className="leading-relaxed">{formatAddress()}</p>
              <p>
                <a
                  href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex min-h-9 items-center hover:text-white"
                >
                  {SITE.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex min-h-9 items-center break-all hover:text-white"
                >
                  {SITE.email}
                </a>
              </p>
            </address>

            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-white">
              Jam Operasional
            </h3>
            <ul className="mt-3 space-y-1 text-sm">
              {SITE.hours.map((h) => (
                <li key={h.days} className="flex justify-between gap-4">
                  <span>{h.days}</span>
                  <span className="text-ink-400">
                    {h.open && h.close ? `${h.open} - ${h.close}` : "Tutup"}
                  </span>
                </li>
              ))}
            </ul>

            {socials.length > 0 ? (
              <ul className="mt-6 flex gap-3">
                {socials.map(([name, url]) => (
                  <li key={name}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-[2px] bg-ink-800 hover:bg-ink-700 hover:text-white"
                      aria-label={name}
                    >
                      <SocialIcon name={name} className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-800 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          {/* <p className="text-ink-400">
            Distributor {SITE.brands.map((b) => b.name).join(", ")}
          </p> */}
            <p>
            &copy; {year} {SITE.legalName}. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Small monoline glyph per social/marketplace platform, falling back to the
 * platform's initial for anything not explicitly drawn. */
function SocialIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "instagram":
      return (
        <svg {...iconProps} className={className}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...iconProps} className={className}>
          <path d="M15 3h-2a4 4 0 0 0-4 4v3H6v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3V3Z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...iconProps} className={className}>
          <path d="M13 3v11.5a2.5 2.5 0 1 1-2.5-2.5" />
          <path d="M13 3c.3 2 1.9 3.6 4 4v3c-1.5 0-2.9-.5-4-1.3" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...iconProps} className={className}>
          <rect x="2.5" y="6" width="19" height="12" rx="3" />
          <path d="m10.5 9.5 5 2.5-5 2.5Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "tokopedia":
      return (
        <svg {...iconProps} className={className}>
          <path d="M4 9h16l-1.5 11h-13L4 9Z" />
          <path d="M9 9V7a3 3 0 0 1 6 0v2" />
        </svg>
      );
    default:
      return <span className="text-xs font-semibold uppercase">{name.charAt(0)}</span>;
  }
}
