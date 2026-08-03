import Link from "next/link";

import { NAV_LINKS, SITE, hasWhatsApp } from "@/lib/site";
import { generalEnquiry } from "@/lib/whatsapp";
import { ExternalButtonLink } from "@/components/ui/Button";
import { Logo } from "./Logo";
import { MobileNav, WhatsAppIcon } from "./MobileNav";
import { NavLink } from "./NavLink";

/**
 * Site header.
 *
 * Rendered on the server apart from the mobile drawer, so a visitor on a slow
 * connection sees the whole navigation before any JavaScript loads.
 */
export function Header() {
  // Computed only when usable, so a placeholder number never reaches the page.
  const whatsappUrl = hasWhatsApp ? generalEnquiry() : null;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {/* Utility bar: on a phone, calling is often faster than typing, so the
          phone number stays visible above the fold. */}
      <div className="hidden bg-brand-900 text-brand-50 sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-sm sm:px-6 lg:px-8">
          <p className="truncate">{SITE.tagline}</p>
          <div className="flex shrink-0 items-center gap-5">
            <a
              href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`}
              className="inline-flex items-center gap-1.5 hover:text-white"
            >
              <PhoneIcon className="h-4 w-4" />
              {SITE.phone}
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className="hidden items-center gap-1.5 hover:text-white md:inline-flex"
            >
              <MailIcon className="h-4 w-4" />
              {SITE.email}
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden lg:block" aria-label="Navigasi utama">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <NavLink href={link.href}>{link.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {whatsappUrl ? (
            <ExternalButtonLink
              href={whatsappUrl}
              variant="whatsapp"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Chat WhatsApp
            </ExternalButtonLink>
          ) : (
            <Link
              href="/kontak"
              className="hidden min-h-11 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 sm:inline-flex"
            >
              Hubungi Kami
            </Link>
          )}
          <MobileNav whatsappUrl={whatsappUrl} />
        </div>
      </div>
    </header>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}
