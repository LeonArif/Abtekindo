import { hasWhatsApp } from "@/lib/site";
import { generalEnquiry } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./MobileNav";

/**
 * Persistent WhatsApp button.
 *
 * The expected pattern for an Indonesian SMB site and the single highest-impact
 * conversion element here: a visitor anywhere on the site is one tap from a
 * chat that already has a prefilled message.
 *
 * It sits bottom-right on desktop and bottom-left on mobile, because the
 * bottom-right corner on a phone is where the browser's own UI and a thumb
 * naturally land, and covering a page's primary button there would cost more
 * conversions than this button wins.
 */
export function FloatingWhatsApp() {
  if (!hasWhatsApp) return null;

  return (
    <a
      href={generalEnquiry()}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "fixed bottom-5 left-4 z-30 inline-flex h-14 w-14 items-center justify-center " +
        "rounded-full bg-whatsapp text-white shadow-lg shadow-ink-900/20 " +
        "transition-transform hover:scale-105 hover:bg-whatsapp-dark " +
        "sm:bottom-6 sm:left-auto sm:right-6"
      }
      aria-label="Hubungi kami melalui WhatsApp"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
