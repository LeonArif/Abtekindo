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
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-whatsapp px-4 text-sm font-semibold text-white hover:bg-whatsapp-dark"
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
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-ink-800 capitalize hover:bg-ink-700 hover:text-white"
                      aria-label={name}
                    >
                      {name.charAt(0).toUpperCase()}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-800 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {SITE.legalName}. Seluruh hak cipta dilindungi.
          </p>
          <p className="text-ink-400">
            Distributor {SITE.brands.map((b) => b.name).join(", ")}
          </p>
        </div>
      </div>
    </footer>
  );
}
