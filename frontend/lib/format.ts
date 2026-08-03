/**
 * Indonesian formatting helpers.
 *
 * Formatters are created once at module scope rather than per call: building an
 * Intl.NumberFormat is comparatively expensive, and price formatting runs for
 * every card in the catalog.
 */

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  // Rupiah has no practical minor unit, and "Rp 3.150.000,00" looks wrong to an
  // Indonesian reader.
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const compactNumber = new Intl.NumberFormat("id-ID");

const longDate = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTime = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Formats whole rupiah, e.g. "Rp 3.150.000". */
export function formatRupiah(amount: number): string {
  return rupiah.format(amount);
}

/** Formats a number with Indonesian thousand separators, e.g. "9.000". */
export function formatNumber(value: number): string {
  return compactNumber.format(value);
}

/** Formats a date as "3 Agustus 2026". */
export function formatDate(value: string | Date): string {
  return longDate.format(new Date(value));
}

/** Formats a timestamp as "3 Agu 2026, 14.30". */
export function formatDateTime(value: string | Date): string {
  return dateTime.format(new Date(value));
}

/** Human label for a product type. */
export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  "split-wall": "AC Split Wall",
  cassette: "AC Cassette",
  "floor-standing": "AC Floor Standing",
  "ceiling-suspended": "AC Ceiling Suspended",
  portable: "AC Portable",
};

/** Human label for a brand. */
export const BRAND_LABELS: Record<string, string> = {
  gree: "Gree",
  daikin: "Daikin",
  panasonic: "Panasonic",
  midea: "Midea",
};

/** Falls back to the raw value so an unmapped enum still renders something. */
export function productTypeLabel(type: string): string {
  return PRODUCT_TYPE_LABELS[type] ?? type;
}

export function brandLabel(brand: string): string {
  return BRAND_LABELS[brand] ?? brand;
}
