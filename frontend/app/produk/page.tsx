import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getProducts } from "@/lib/api/server";
import { isBrand, isProductType } from "@/lib/api/types";
import { SITE } from "@/lib/site";
import { ProductGrid } from "@/components/product/ProductCard";
import { ProductFilters } from "@/components/product/ProductFilters";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Scribble } from "@/components/ui/Scribble";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Katalog Produk AC",
  description:
    `Katalog AC ${SITE.brands.map((b) => b.name).join(", ")} lengkap dengan spesifikasi ` +
    "dan harga mulai. AC split, cassette, floor standing, ceiling suspended, dan portable.",
  alternates: { canonical: "/produk" },
};

const PAGE_SIZE = 12;

/**
 * Parses a comma-separated facet from the URL, dropping anything that is not a
 * known value. A stale bookmark naming a removed brand still renders results
 * rather than an error.
 */
function parseList(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  const value = Array.isArray(raw) ? raw.join(",") : raw;
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

function parseNumbers(raw: string | string[] | undefined): number[] {
  return parseList(raw)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);
}

export default async function ProductsPage(props: PageProps<"/produk">) {
  // Next 16 removed synchronous access: searchParams is a Promise.
  const params = await props.searchParams;

  const brand = parseList(params.brand).filter(isBrand);
  const type = parseList(params.type).filter(isProductType);
  const pk = parseNumbers(params.pk);
  const page = Math.max(1, Number(params.page) || 1);

  const { products, pagination } = await getProducts({
    brand,
    type,
    pk,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Beranda", href: "/" },
          { name: "Produk", href: "/produk" },
        ]}
      />

      <div className="relative overflow-hidden bg-brand-900 text-white">
        <Scribble variant="cross" className="right-[10%] top-8 h-16 w-16 opacity-30" />
        <Scribble variant="compass" className="right-[22%] bottom-10 h-10 w-10 opacity-20" />
        <Container>
          <div className="relative flex min-h-[19rem] flex-col justify-center py-10 sm:min-h-[24rem] sm:py-14">
            <nav aria-label="Remah roti" className="text-sm text-ink-400">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-white">
                    Beranda
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="font-medium text-white">Produk</li>
              </ol>
            </nav>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl sm:text-4xl">Katalog Produk AC</h1>
              {pagination.total > 0 ? (
                <Badge tone="brand" className="text-sm">
                  {pagination.total} produk tersedia
                </Badge>
              ) : null}
            </div>
            <p className="mt-3 max-w-2xl text-base text-ink-300 sm:text-lg">
              Kami menyediakan AC {SITE.brands.map((b) => b.name).join(", ")} untuk
              kebutuhan rumah, kantor, dan tempat usaha.{" "}
              <span className="font-semibold text-white">
                Harga yang tercantum adalah harga mulai
              </span>
              , hubungi kami untuk penawaran terbaik.
            </p>
          </div>
        </Container>
      </div>

      <Container>
        <div className="grid gap-8 py-10 lg:grid-cols-[16rem_1fr] lg:gap-10">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            {/* useSearchParams needs a Suspense boundary during prerendering. */}
            <Suspense fallback={<FiltersSkeleton />}>
              <ProductFilters total={pagination.total} />
            </Suspense>
          </aside>

          <div>
            {products.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <ProductGrid products={products} />
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  searchParams={params}
                />
              </>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}

function FiltersSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-20 rounded bg-ink-200" />
          <div className="h-9 rounded bg-ink-100" />
          <div className="h-9 rounded bg-ink-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-card border border-dashed border-ink-300 bg-ink-50 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-ink-900">
        Tidak ada produk yang cocok
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
        Coba kurangi filter yang dipilih, atau hubungi kami langsung. Kami dapat
        memesankan unit yang tidak tercantum di katalog.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/produk" variant="outline">
          Lihat semua produk
        </ButtonLink>
        <ButtonLink href="/kontak">Hubungi kami</ButtonLink>
      </div>
    </div>
  );
}

/**
 * Pagination that preserves the active filters.
 *
 * Real links rather than buttons, so they are crawlable and can be opened in a
 * new tab.
 */
function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || value === undefined) continue;
      params.set(key, Array.isArray(value) ? value.join(",") : value);
    }
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `/produk?${query}` : "/produk";
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Halaman">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          className="inline-flex min-h-11 items-center rounded-[2px] border border-ink-300 px-4 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          Sebelumnya
        </Link>
      ) : null}

      <ul className="flex items-center gap-1">
        {pages.map((p) => (
          <li key={p}>
            <Link
              href={hrefFor(p)}
              aria-current={p === page ? "page" : undefined}
              className={
                p === page
                  ? "inline-flex h-11 min-w-11 items-center justify-center rounded-[2px] bg-brand-600 px-3 text-sm font-semibold text-white"
                  : "inline-flex h-11 min-w-11 items-center justify-center rounded-[2px] px-3 text-sm font-medium text-ink-700 hover:bg-ink-100"
              }
            >
              {p}
            </Link>
          </li>
        ))}
      </ul>

      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          className="inline-flex min-h-11 items-center rounded-[2px] border border-ink-300 px-4 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          Berikutnya
        </Link>
      ) : null}
    </nav>
  );
}
