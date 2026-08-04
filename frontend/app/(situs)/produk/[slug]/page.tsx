import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, getProduct, getSitemapEntries } from "@/lib/api/server";
import { brandLabel, formatNumber, formatRupiah, productTypeLabel } from "@/lib/format";
import { formatPk, productEnquiry } from "@/lib/whatsapp";
import { hasWhatsApp } from "@/lib/site";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ProductImage } from "@/components/ui/Placeholder";
import { ProductCard } from "@/components/product/ProductCard";
import { WhatsAppIcon } from "@/components/layout/MobileNav";
import { BreadcrumbJsonLd, ProductJsonLd } from "@/components/seo/JsonLd";

/**
 * Pre-renders every product at build time.
 *
 * A missed slug still works: the page renders on demand and is then cached, so
 * a product added through the CMS after a deploy is reachable immediately.
 */
export async function generateStaticParams() {
  try {
    const { products } = await getSitemapEntries();
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    // Never fail a build because the API was briefly unreachable; the pages
    // simply render on first request instead.
    return [];
  }
}

export async function generateMetadata(
  props: PageProps<"/produk/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;

  try {
    const { product } = await getProduct(slug);
    const title = `${product.name} - Harga ${formatRupiah(product.startingPrice)}`;
    const description =
      product.description ||
      `${product.name}, ${formatPk(product.capacityPk)} PK, ${formatNumber(product.btu)} BTU. ` +
        `Harga mulai ${formatRupiah(product.startingPrice)}. Hubungi kami untuk penawaran.`;

    return {
      title,
      description,
      alternates: { canonical: `/produk/${product.slug}` },
      openGraph: {
        title,
        description,
        type: "website",
        url: `/produk/${product.slug}`,
        ...(product.images.length > 0
          ? { images: product.images.map((i) => ({ url: i.url, alt: i.alt })) }
          : {}),
      },
    };
  } catch {
    return { title: "Produk tidak ditemukan" };
  }
}

export default async function ProductPage(props: PageProps<"/produk/[slug]">) {
  // Next 16 removed synchronous access: params is a Promise.
  const { slug } = await props.params;

  let data;
  try {
    data = await getProduct(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const { product, related } = data;
  const enquiryUrl = productEnquiry(product);

  const specs = [
    { label: "Merek", value: brandLabel(product.brand) },
    { label: "Tipe", value: productTypeLabel(product.type) },
    { label: "Kapasitas", value: `${formatPk(product.capacityPk)} PK` },
    { label: "Daya pendingin", value: `${formatNumber(product.btu)} BTU/h` },
    { label: "Konsumsi daya", value: `${formatNumber(product.powerWatt)} watt` },
    { label: "Teknologi", value: product.inverter ? "Inverter" : "Standar (non-inverter)" },
    { label: "Refrigeran", value: product.refrigerant || "-" },
    { label: "Luas ruangan", value: product.roomSize || "-" },
  ];

  return (
    <>
      <ProductJsonLd product={product} />
      <BreadcrumbJsonLd
        items={[
          { name: "Beranda", href: "/" },
          { name: "Produk", href: "/produk" },
          { name: product.name, href: `/produk/${product.slug}` },
        ]}
      />

      <Container>
        <nav aria-label="Remah roti" className="py-6 text-sm text-ink-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-brand-600">
                Beranda
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/produk" className="hover:text-brand-600">
                Produk
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink-700">{product.name}</li>
          </ol>
        </nav>

        <div className="grid gap-8 pb-12 lg:grid-cols-2 lg:gap-12">
          <div>
            <ProductImage
              src={product.images[0]?.url}
              alt={product.images[0]?.alt || product.name}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="rounded-card border border-ink-200"
            />
            {product.images.length > 1 ? (
              <ul className="mt-4 grid grid-cols-4 gap-3">
                {product.images.slice(1, 5).map((image) => (
                  <li key={image.url}>
                    <ProductImage
                      src={image.url}
                      alt={image.alt || product.name}
                      sizes="15vw"
                      className="rounded-lg border border-ink-200"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              {brandLabel(product.brand)}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="brand">{formatPk(product.capacityPk)} PK</Badge>
              <Badge>{productTypeLabel(product.type)}</Badge>
              {product.inverter ? <Badge tone="success">Inverter</Badge> : null}
              {product.refrigerant ? <Badge>{product.refrigerant}</Badge> : null}
            </div>

            <div className="mt-6 rounded-card bg-ink-50 p-5">
              <p className="text-sm text-ink-500">Harga mulai dari</p>
              <p className="mt-1 text-3xl font-bold text-ink-900">
                {formatRupiah(product.startingPrice)}
              </p>
              <p className="mt-2 text-sm text-ink-600">
                Belum termasuk biaya pemasangan. Hubungi kami untuk penawaran
                lengkap sesuai kebutuhan Anda.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {hasWhatsApp ? (
                <ExternalButtonLink href={enquiryUrl} variant="whatsapp" size="lg" fullWidth>
                  <WhatsAppIcon className="h-5 w-5" />
                  Pesan via WhatsApp
                </ExternalButtonLink>
              ) : null}
              <ButtonLink href="/kontak" variant="outline" size="lg" fullWidth>
                Minta penawaran
              </ButtonLink>
            </div>

            {product.description ? (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-ink-900">Deskripsi</h2>
                <p className="mt-2 leading-relaxed text-ink-600">
                  {product.description}
                </p>
              </div>
            ) : null}

            {product.features.length > 0 ? (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-ink-900">Fitur</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-ink-700">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <section className="pb-12" aria-labelledby="spesifikasi">
          <h2 id="spesifikasi" className="text-2xl font-bold text-ink-900">
            Spesifikasi
          </h2>
          {/* Wrapped so the table scrolls inside its own box on a narrow screen
              rather than making the whole page scroll sideways. */}
          <div className="scroll-x mt-5 rounded-card border border-ink-200">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Spesifikasi teknis {product.name}</caption>
              <tbody className="divide-y divide-ink-200">
                {specs.map((spec) => (
                  <tr key={spec.label}>
                    <th scope="row" className="w-1/3 bg-ink-50 px-4 py-3 font-medium text-ink-700">
                      {spec.label}
                    </th>
                    <td className="px-4 py-3 text-ink-900">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {related.length > 0 ? (
          <section className="border-t border-ink-200 py-12" aria-labelledby="terkait">
            <h2 id="terkait" className="text-2xl font-bold text-ink-900">
              Produk serupa
            </h2>
            <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.id} className="flex">
                  <ProductCard product={item} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
