/**
 * Company details for PT Abtekindo Primalestari.
 *
 * This is the single file to edit before launch. Everything the site shows
 * about the company comes from here, so nothing has to be hunted for across
 * components.
 *
 * Values marked TODO are placeholders. They are deliberately obvious rather
 * than plausible-looking, so an unfinished value cannot quietly ship and start
 * sending real customers to a made-up phone number.
 */

export const SITE = {
  /** Trading name used in headings and navigation. */
  name: "Abtekindo",
  /** Full legal name, used in the footer, metadata and structured data. */
  legalName: "PT Abtekindo Primalestari",
  tagline: "Spesialis AC: penjualan, pemasangan, dan perawatan",
  description:
    "PT Abtekindo Primalestari melayani penjualan AC, pemasangan, cuci AC, dan perbaikan " +
    "untuk rumah, kantor, dan tempat usaha. Distributor resmi Gree, Daikin, Panasonic, dan Midea.",

  /** Year the company was founded, shown on the about page. */
  // TODO: ganti dengan tahun berdiri perusahaan yang sebenarnya
  foundedYear: 2010,

  /**
   * WhatsApp number in international format without "+" or spaces.
   * This is the single most important value on the site: every call to action
   * routes through it.
   */
  // TODO: ganti dengan nomor WhatsApp resmi, contoh format: 6281234567890
  whatsapp: "628XXXXXXXXXX",

  // TODO: ganti dengan nomor telepon kantor
  phone: "(021) XXXX-XXXX",

  // TODO: ganti dengan email resmi perusahaan
  email: "info@abtekindo.co.id",

  address: {
    // TODO: ganti dengan alamat kantor atau showroom yang sebenarnya
    street: "Jl. Contoh Alamat No. XX",
    district: "Kecamatan",
    city: "Jakarta",
    province: "DKI Jakarta",
    postalCode: "XXXXX",
    country: "ID",
  },

  /**
   * Google Maps embed URL for the contact page.
   * Get it from Google Maps: Share, then Embed a map, then copy the src value.
   */
  // TODO: ganti dengan URL embed Google Maps lokasi kantor
  mapsEmbedUrl: "",

  /** Public Google Maps link for the "get directions" button. */
  // TODO: ganti dengan tautan Google Maps lokasi kantor
  mapsUrl: "",

  /** Operating hours, shown on the contact page and in structured data. */
  hours: [
    { days: "Senin - Jumat", open: "08:00", close: "17:00" },
    { days: "Sabtu", open: "08:00", close: "14:00" },
    { days: "Minggu", open: null, close: null },
  ],

  /** Areas the company serves, used on the contact page and for local SEO. */
  // TODO: sesuaikan dengan area layanan yang sebenarnya
  serviceAreas: [
    "Jakarta Pusat",
    "Jakarta Utara",
    "Jakarta Barat",
    "Jakarta Selatan",
    "Jakarta Timur",
    "Tangerang",
    "Bekasi",
    "Depok",
  ],

  /** Social profiles. Leave a value empty to hide that link. */
  social: {
    // TODO: isi jika perusahaan memiliki akun media sosial
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
  },

  /** Brands the company distributes. Order controls display order. */
  brands: [
    { slug: "gree", name: "Gree" },
    { slug: "daikin", name: "Daikin" },
    { slug: "panasonic", name: "Panasonic" },
    { slug: "midea", name: "Midea" },
  ],
} as const;

/** Canonical origin, used for metadata, sitemap and structured data. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** True when a placeholder is still in place, so the UI can avoid dead links. */
export const hasWhatsApp = !SITE.whatsapp.includes("X");
export const hasMaps = SITE.mapsEmbedUrl.length > 0;
export const hasPhone = !SITE.phone.includes("X");

/** Formatted single-line address. */
export function formatAddress(): string {
  const { street, district, city, province, postalCode } = SITE.address;
  return [street, district, city, province, postalCode]
    .filter(Boolean)
    .join(", ");
}

/** Main navigation, in display order. */
export const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/produk", label: "Produk" },
  { href: "/layanan", label: "Layanan" },
  { href: "/tentang-kami", label: "Tentang Kami" },
  { href: "/kontak", label: "Kontak" },
] as const;
