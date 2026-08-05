"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { NAV_LINKS } from "@/lib/site";
import { cn } from "@/lib/cn";
import { ExternalButtonLink } from "@/components/ui/Button";

/**
 * Mobile navigation drawer.
 *
 * This is the only client component in the site chrome. Everything else in the
 * header renders on the server, so opening the menu is the only thing that
 * costs the visitor any JavaScript.
 */
export function MobileNav({
  whatsappUrl,
}: {
  /**
   * Null when no WhatsApp number is configured.
   *
   * Passing null rather than a URL plus a separate boolean matters here: props
   * of a client component are serialised into the page's payload whether the
   * component renders them or not, so an unused URL would still ship to the
   * browser and appear in view-source.
   */
  whatsappUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  // Close on navigation, or the drawer stays open over the new page: the route
  // changes without unmounting this component.
  //
  // Adjusted during render rather than in an effect. React re-runs this
  // component immediately without painting the intermediate state, so there is
  // no flash of an open drawer on the new page, and unlike an onClick handler
  // on each link it also covers browser back and forward navigation.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Lock background scrolling while the drawer covers the screen, trap
  // keyboard focus inside it (so Tab can't reach content hidden behind the
  // overlay), and return focus to the toggle button on close.
  useEffect(() => {
    if (!open) return;

    const openButton = openButtonRef.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableSelector =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      panelRef.current
        ? Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector))
        : [];

    getFocusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
      openButton?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={openButtonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100 lg:hidden"
        aria-label="Buka menu navigasi"
        aria-expanded={open}
        aria-controls="mobile-nav"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-900/50"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu navigasi"
            tabIndex={-1}
          />

          <nav
            ref={panelRef}
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            className="absolute right-0 top-0 flex h-full w-[min(20rem,85vw)] flex-col bg-white shadow-xl"
            aria-label="Navigasi utama"
          >
            <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
              <span className="text-sm font-semibold text-ink-500">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100"
                aria-label="Tutup menu"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <ul className="flex-1 overflow-y-auto px-3 py-4">
              {NAV_LINKS.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center rounded-lg px-4 text-base font-medium",
                        active
                          ? "bg-brand-50 text-brand-700"
                          : "text-ink-700 hover:bg-ink-100",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {whatsappUrl ? (
              <div className="border-t border-ink-200 p-4">
                <ExternalButtonLink href={whatsappUrl} variant="whatsapp" fullWidth>
                  <WhatsAppIcon className="h-5 w-5" />
                  Chat WhatsApp
                </ExternalButtonLink>
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </>
  );
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}
