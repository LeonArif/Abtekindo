import Link from "next/link";

import type { Product } from "@/lib/api/types";
import { brandLabel, formatRupiah, productTypeLabel } from "@/lib/format";
import { formatPk } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/Badge";
import { ProductImage } from "@/components/ui/Placeholder";

/**
 * Catalog card.
 *
 * The whole card is one link rather than a card with a nested button, which
 * keeps the tap target large on a phone and avoids nesting interactive
 * elements. The price is the most prominent element after the name, because
 * "how much" is the question that brings people to this catalog.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/produk/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-ink-200 bg-white transition-shadow hover:shadow-lg focus-visible:shadow-lg"
    >
      <div className="relative">
        <ProductImage
          src={product.images[0]?.url}
          alt={product.images[0]?.alt || product.name}
          priority={priority}
        />
        {product.inverter ? (
          <span className="absolute left-3 top-3 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">
            Inverter
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          {brandLabel(product.brand)}
        </p>
        <h3 className="mt-1 line-clamp-2 text-base font-semibold text-ink-900 group-hover:text-brand-700">
          {product.name}
        </h3>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge>{formatPk(product.capacityPk)} PK</Badge>
          <Badge>{productTypeLabel(product.type)}</Badge>
        </div>

        {/* mt-auto pins the price to the bottom so prices line up across a row
            of cards with different title lengths. */}
        <div className="mt-auto pt-4">
          <p className="text-xs text-ink-500">Mulai dari</p>
          <p className="text-lg font-bold text-ink-900">
            {formatRupiah(product.startingPrice)}
          </p>
        </div>
      </div>
    </Link>
  );
}

/** Responsive grid of product cards. */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id} className="flex">
          {/* The first row is above the fold, so those images are eager. */}
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
