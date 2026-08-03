import { SITE, SITE_URL, hasWhatsApp } from "@/lib/site";
import type { Product, Service } from "@/lib/api/types";
import { brandLabel, productTypeLabel } from "@/lib/format";

/**
 * Structured data.
 *
 * The stated goal of this site is exposure, so telling Google what the business
 * is, where it operates and what a product costs is not decoration: it is what
 * produces a rich result with a price and opening hours in the search listing
 * rather than a plain blue link.
 *
 * JSON.stringify handles escaping, and none of this data is attacker-controlled
 * (it comes from the CMS), so dangerouslySetInnerHTML is safe here. It is the
 * only way to emit a script body in React.
 */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Day names Schema.org expects, matched to the entries in SITE.hours. */
const DAY_MAP: Record<string, string[]> = {
  "Senin - Jumat": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  Sabtu: ["Saturday"],
  Minggu: ["Sunday"],
};

/** Business identity, emitted once on every page from the root layout. */
export function LocalBusinessJsonLd() {
  const openingHours = SITE.hours
    .filter((h) => h.open && h.close)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_MAP[h.days] ?? [h.days],
      opens: h.open,
      closes: h.close,
    }));

  const sameAs = Object.values(SITE.social).filter(Boolean);

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "HVACBusiness",
        "@id": `${SITE_URL}/#business`,
        name: SITE.legalName,
        alternateName: SITE.name,
        description: SITE.description,
        url: SITE_URL,
        telephone: SITE.phone,
        email: SITE.email,
        foundingDate: String(SITE.foundedYear),
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.address.street,
          addressLocality: SITE.address.city,
          addressRegion: SITE.address.province,
          postalCode: SITE.address.postalCode,
          addressCountry: SITE.address.country,
        },
        areaServed: SITE.serviceAreas.map((area) => ({
          "@type": "City",
          name: area,
        })),
        openingHoursSpecification: openingHours,
        ...(sameAs.length > 0 ? { sameAs } : {}),
        ...(hasWhatsApp
          ? { contactPoint: [{
              "@type": "ContactPoint",
              contactType: "customer service",
              telephone: `+${SITE.whatsapp}`,
              availableLanguage: ["id"],
            }] }
          : {}),
      }}
    />
  );
}

/**
 * Product offer.
 *
 * `lowPrice` with a PriceSpecification is the correct shape for a "mulai dari"
 * price: claiming a firm `price` would be a misrepresentation, since the final
 * figure is quoted over WhatsApp.
 */
export function ProductJsonLd({ product }: { product: Product }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description:
          product.description ||
          `${productTypeLabel(product.type)} ${brandLabel(product.brand)} ${product.capacityPk} PK`,
        sku: product.slug,
        category: productTypeLabel(product.type),
        brand: { "@type": "Brand", name: brandLabel(product.brand) },
        ...(product.images.length > 0
          ? { image: product.images.map((i) => i.url) }
          : {}),
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "IDR",
          lowPrice: product.startingPrice,
          offerCount: 1,
          availability: "https://schema.org/InStock",
          seller: { "@id": `${SITE_URL}/#business` },
          url: `${SITE_URL}/produk/${product.slug}`,
        },
        additionalProperty: [
          { "@type": "PropertyValue", name: "Kapasitas", value: `${product.capacityPk} PK` },
          { "@type": "PropertyValue", name: "BTU", value: String(product.btu) },
          { "@type": "PropertyValue", name: "Daya", value: `${product.powerWatt} watt` },
          { "@type": "PropertyValue", name: "Refrigeran", value: product.refrigerant },
          { "@type": "PropertyValue", name: "Inverter", value: product.inverter ? "Ya" : "Tidak" },
        ],
      }}
    />
  );
}

/** Offered service with its published starting rate. */
export function ServiceJsonLd({ service }: { service: Service }) {
  const lowest = service.rates.length
    ? Math.min(...service.rates.map((r) => r.priceFrom))
    : undefined;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name: service.name,
        description: service.summary || service.description,
        serviceType: service.name,
        provider: { "@id": `${SITE_URL}/#business` },
        areaServed: SITE.serviceAreas.map((area) => ({ "@type": "City", name: area })),
        ...(lowest !== undefined
          ? {
              offers: {
                "@type": "Offer",
                priceCurrency: "IDR",
                price: lowest,
                priceSpecification: {
                  "@type": "PriceSpecification",
                  priceCurrency: "IDR",
                  minPrice: lowest,
                  valueAddedTaxIncluded: false,
                },
              },
            }
          : {}),
      }}
    />
  );
}

/** Breadcrumb trail, so search results show the site's hierarchy. */
export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; href: string }>;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${SITE_URL}${item.href}`,
        })),
      }}
    />
  );
}

/** FAQ pairs, eligible for a rich result under the search listing. */
export function FaqJsonLd({
  items,
}: {
  items: Array<{ question: string; answer: string }>;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }}
    />
  );
}
