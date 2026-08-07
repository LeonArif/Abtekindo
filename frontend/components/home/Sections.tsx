import Link from "next/link";

import type { Product, Service } from "@/lib/api/types";
import { formatRupiah } from "@/lib/format";
import { SITE, hasWhatsApp } from "@/lib/site";
import { generalEnquiry } from "@/lib/whatsapp";
import { Container, Section, SectionHeading } from "@/components/ui/Container";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/Button";
import { Scribble } from "@/components/ui/Scribble";
import { ProductCard } from "@/components/product/ProductCard";
import { ServiceSummaryCard } from "@/components/service/ServiceCard";
import { WhatsAppIcon } from "@/components/layout/MobileNav";

/**
 * Slim price ticker directly under the hero.
 *
 * The homepage's job is exposure and promotion, so the most concrete thing it
 * can show above the fold is what things actually cost. This pulls the lowest
 * featured-product price live from the catalog rather than hardcoding it, so
 * it never drifts out of sync with real prices.
 */
export function PriceHighlights({ products }: { products: Product[] }) {
  const lowestUnitPrice = products.length
    ? Math.min(...products.map((p) => p.startingPrice))
    : null;

  const items = [
    { label: "Cuci AC mulai dari", price: "Rp 65.000" },
    { label: "Pasang AC baru mulai dari", price: "Rp 350.000" },
    ...(lowestUnitPrice !== null
      ? [{ label: "Unit AC baru mulai dari", price: formatRupiah(lowestUnitPrice) }]
      : []),
    { label: "Konsultasi kebutuhan", price: "Gratis" },
  ];

  return (
    <div className="relative overflow-hidden border-b border-ink-200 bg-brand-50">
      <Scribble variant="cross" className="right-2 top-1 h-8 w-8 opacity-45" />
      <Scribble variant="compass" className="left-2 bottom-1 h-9 w-9 opacity-40" tone="gold" />
      <Container>
        <ul className="grid grid-cols-2 divide-x divide-y divide-ink-200 sm:grid-cols-4 sm:divide-y-0">
          {items.map((item) => (
            <li key={item.label} className="px-4 py-4 text-center sm:px-2">
              <p className="text-xs font-medium text-ink-500">{item.label}</p>
              <p className="font-display mt-1 text-lg font-semibold text-brand-700 sm:text-xl">
                {item.price}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}

/** Services offered, linking through to the full price list. */
export function ServiceHighlights({ services }: { services: Service[] }) {
  if (services.length === 0) return null;

  return (
    <Section tone="muted" className="relative overflow-hidden">
      <Scribble variant="cross" className="bottom-6 left-6 h-14 w-14 opacity-60" />
      <Scribble variant="compass" className="left-[8%] top-10 h-16 w-16 opacity-55" />
      <Scribble variant="cross" className="right-[6%] bottom-10 h-11 w-11 opacity-55" tone="gold" />

      <SectionHeading
        eyebrow="Layanan"
        title="Apa yang bisa kami kerjakan"
        description="Dari cuci AC rutin sampai pemasangan unit baru, semua dikerjakan oleh tim kami sendiri."
      />
      <ul className="relative mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.slice(0, 6).map((service) => (
          <li key={service.id} className="flex">
            <ServiceSummaryCard service={service} />
          </li>
        ))}
      </ul>
      <div className="relative mt-10 text-center">
        <ButtonLink href="/layanan" variant="outline" size="lg">
          Lihat semua layanan dan harga
        </ButtonLink>
      </div>
    </Section>
  );
}

/**
 * Brand strip.
 *
 * Typeset wordmarks rather than logo files. Reproducing manufacturer logos
 * without the assets would mean shipping approximations of other companies'
 * trademarks; a clean wordmark is honest and looks deliberate.
 */
export function BrandStrip() {
  return (
    <Section className="relative overflow-hidden">
      <Scribble variant="compass" className="left-[6%] top-6 h-14 w-14 opacity-50" />
      <Scribble variant="cross" className="right-[6%] bottom-6 h-12 w-12 opacity-50" tone="gold" />
      <SectionHeading
        eyebrow="Merek resmi"
        title="Merek yang kami sediakan"
        description="Kami distributor resmi untuk merek berikut, lengkap dengan garansi pabrikan."
      />
      <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {SITE.brands.map((brand) => (
          <li key={brand.slug}>
            <Link
              href={`/produk?brand=${brand.slug}`}
              className="font-display flex min-h-24 items-center justify-center rounded-card border border-ink-200 bg-white px-4 text-xl font-semibold uppercase tracking-tight text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              {brand.name}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Featured products from the CMS. */
export function FeaturedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <Section className="relative overflow-hidden">
      <Scribble variant="cross" className="right-16 top-4 h-20 w-20 opacity-70" />
      <Scribble variant="compass" className="left-[6%] bottom-6 h-12 w-12 opacity-45" tone="gold" />

      <SectionHeading
        eyebrow="Produk pilihan"
        title="Unit yang paling banyak dicari"
        description="Harga yang tercantum adalah harga mulai. Hubungi kami untuk penawaran terbaik."
      />
      <ul className="relative mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <li key={product.id} className="flex">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
      <div className="relative mt-10 text-center">
        <ButtonLink href="/produk" variant="outline" size="lg">
          Lihat katalog lengkap
        </ButtonLink>
      </div>
    </Section>
  );
}

const STEPS = [
  {
    title: "Hubungi kami",
    body: "Kirim pesan lewat WhatsApp atau isi form kontak. Sampaikan kebutuhan, jumlah unit, dan lokasi Anda.",
  },
  {
    title: "Terima penawaran",
    body: "Kami sampaikan rekomendasi unit atau estimasi biaya layanan, beserta jadwal yang tersedia.",
  },
  {
    title: "Pengerjaan dan garansi",
    body: "Teknisi datang sesuai jadwal dan mengerjakan sampai tuntas, dengan garansi pengerjaan.",
  },
];

export function HowToOrder() {
  return (
    <Section tone="muted" className="relative overflow-hidden">
      <Scribble variant="cross" className="left-[10%] top-8 h-14 w-14 opacity-50" />
      <Scribble variant="compass" className="right-[10%] bottom-8 h-16 w-16 opacity-50" tone="gold" />
      <SectionHeading
        eyebrow="Cara pesan"
        title="Prosesnya sederhana"
        description="Tiga langkah dari pesan pertama sampai pekerjaan selesai."
      />
      <ol className="mx-auto mt-10 grid max-w-4xl gap-px overflow-hidden border border-ink-900 bg-ink-900 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="bg-white p-6">
            <span className="font-display text-sm font-semibold text-brand-600">
              0{index + 1}
            </span>
            <h3 className="mt-2 text-base font-semibold text-ink-900">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/** Closing call to action. */
export function CtaBand() {
  return (
    <Section tone="brand" className="relative overflow-hidden">
      <Scribble variant="compass" className="right-10 top-8 h-20 w-20 opacity-55" />
      <Scribble variant="cross" className="left-[8%] bottom-6 h-12 w-12 opacity-45" tone="gold" />
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-3xl sm:text-4xl">AC bermasalah, atau mau pasang baru?</h2>
        <p className="mt-4 text-lg text-ink-300">
          Konsultasi gratis tanpa kewajiban membeli. Kirim pesan sekarang dan tim
          kami akan membantu.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {hasWhatsApp ? (
            <ExternalButtonLink href={generalEnquiry()} variant="invert" size="lg">
              <WhatsAppIcon className="h-5 w-5" />
              Chat WhatsApp
            </ExternalButtonLink>
          ) : null}
          <ButtonLink href="/kontak" variant="outline-invert" size="lg">
            Kirim pesan
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
