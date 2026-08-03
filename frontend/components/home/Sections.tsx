import Link from "next/link";

import type { Product, Service } from "@/lib/api/types";
import { SITE, hasWhatsApp } from "@/lib/site";
import { generalEnquiry } from "@/lib/whatsapp";
import { Section, SectionHeading } from "@/components/ui/Container";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/Button";
import { ProductCard } from "@/components/product/ProductCard";
import { ServiceSummaryCard } from "@/components/service/ServiceCard";
import { WhatsAppIcon } from "@/components/layout/MobileNav";

/** Services offered, linking through to the full price list. */
export function ServiceHighlights({ services }: { services: Service[] }) {
  if (services.length === 0) return null;

  return (
    <Section tone="muted">
      <SectionHeading
        eyebrow="Layanan"
        title="Apa yang bisa kami kerjakan"
        description="Dari cuci AC rutin sampai pemasangan unit baru, semua dikerjakan oleh tim kami sendiri."
      />
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.slice(0, 6).map((service) => (
          <li key={service.id} className="flex">
            <ServiceSummaryCard service={service} />
          </li>
        ))}
      </ul>
      <div className="mt-10 text-center">
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
    <Section>
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
              className="flex min-h-24 items-center justify-center rounded-card border border-ink-200 bg-white px-4 text-xl font-bold tracking-tight text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
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
    <Section tone="muted">
      <SectionHeading
        eyebrow="Produk pilihan"
        title="Unit yang paling banyak dicari"
        description="Harga yang tercantum adalah harga mulai. Hubungi kami untuk penawaran terbaik."
      />
      <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <li key={product.id} className="flex">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
      <div className="mt-10 text-center">
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
    <Section>
      <SectionHeading
        eyebrow="Cara pesan"
        title="Prosesnya sederhana"
        description="Tiga langkah dari pesan pertama sampai pekerjaan selesai."
      />
      <ol className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="rounded-card border border-ink-200 bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-base font-bold text-white">
              {index + 1}
            </span>
            <h3 className="mt-4 text-base font-semibold text-ink-900">{step.title}</h3>
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
    <Section tone="brand">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          AC bermasalah, atau mau pasang baru?
        </h2>
        <p className="mt-4 text-lg text-brand-100">
          Konsultasi gratis tanpa kewajiban membeli. Kirim pesan sekarang dan tim
          kami akan membantu.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {hasWhatsApp ? (
            <ExternalButtonLink href={generalEnquiry()} variant="whatsapp" size="lg">
              <WhatsAppIcon className="h-5 w-5" />
              Chat WhatsApp
            </ExternalButtonLink>
          ) : null}
          <ButtonLink href="/kontak" variant="outline" size="lg">
            Kirim pesan
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
