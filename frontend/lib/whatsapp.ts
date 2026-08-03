import { SITE, hasWhatsApp } from "./site";

/**
 * WhatsApp deep links.
 *
 * WhatsApp is how this business actually converts, so every call to action on
 * the site funnels through here. Each link carries a prefilled Indonesian
 * message naming what the visitor was looking at, which means the owner opens
 * a chat that already has context instead of "halo".
 */

/** Builds a wa.me link with a prefilled message. */
export function buildWhatsAppUrl(message: string): string {
  const base = `https://wa.me/${SITE.whatsapp}`;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** Generic enquiry, used by the header and floating buttons. */
export function generalEnquiry(): string {
  return buildWhatsAppUrl(
    `Halo ${SITE.name}, saya ingin bertanya tentang produk dan layanan AC.`,
  );
}

/**
 * Enquiry about a specific product.
 *
 * The capacity is appended only when the product name does not already state
 * it. Most catalog names end in "1 PK" or similar, and repeating it produced
 * messages like "FTKC25UVM 1 PK (1 PK)"; a product named without its capacity
 * still gets the detail the owner needs to quote.
 */
export function productEnquiry(product: {
  name: string;
  capacityPk: number;
}): string {
  const capacity = `${formatPk(product.capacityPk)} PK`;
  const mentionsCapacity = product.name
    .toLowerCase()
    .includes(capacity.toLowerCase());

  const subject = mentionsCapacity
    ? product.name
    : `${product.name} (${capacity})`;

  return buildWhatsAppUrl(
    `Halo ${SITE.name}, saya tertarik dengan produk ${subject}. Boleh minta penawaran?`,
  );
}

/** Enquiry about a specific service. */
export function serviceEnquiry(serviceName: string): string {
  return buildWhatsAppUrl(
    `Halo ${SITE.name}, saya ingin memesan layanan ${serviceName}. ` +
      `Boleh dibantu informasi jadwal dan biayanya?`,
  );
}

/** Enquiry about a specific service rate line. */
export function serviceRateEnquiry(
  serviceName: string,
  rateLabel: string,
): string {
  return buildWhatsAppUrl(
    `Halo ${SITE.name}, saya ingin memesan layanan ${serviceName} ` +
      `untuk ${rateLabel}. Boleh dibantu?`,
  );
}

/**
 * Formats a PK value the Indonesian way, with a comma as the decimal mark and
 * no trailing zeros: 0,5 PK and 1 PK rather than 0.50 PK and 1.0 PK.
 */
export function formatPk(pk: number): string {
  return Number.isInteger(pk)
    ? String(pk)
    : pk.toString().replace(".", ",");
}

/** Whether WhatsApp links should render at all. */
export { hasWhatsApp };
