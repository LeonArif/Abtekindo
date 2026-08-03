"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import * as api from "@/lib/api/browser";
import type { Product } from "@/lib/api/types";
import { brandLabel, formatRupiah, productTypeLabel } from "@/lib/format";
import { formatPk } from "@/lib/whatsapp";
import { useAsyncData } from "@/lib/useAsyncData";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";

export default function AdminProductsPage() {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { products } = await api.listProducts(1, 100);
    return products;
  }, []);

  const { state, reload, setError } = useAsyncData(load);

  const products = state.status === "ready" ? state.data : null;
  const error = state.status === "error" ? state.message : null;

  async function handleDelete(product: Product) {
    // Deleting a product is irreversible and removes it from the public
    // catalog immediately, so it is worth one explicit confirmation.
    if (
      !window.confirm(
        `Hapus produk "${product.name}"? Tindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      return;
    }

    setDeletingId(product.id);
    try {
      await api.deleteProduct(product.id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus produk");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Produk</h1>
          <p className="mt-1 text-sm text-ink-500">
            {products ? `${products.length} produk` : "Memuat..."}
          </p>
        </div>
        <ButtonLink href="/admin/produk/baru">Tambah produk</ButtonLink>
      </div>

      {error ? (
        <p
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {products === null ? (
        <p className="mt-6 text-sm text-ink-500">Memuat...</p>
      ) : products.length === 0 ? (
        <p className="mt-6 rounded-card border border-dashed border-ink-300 bg-white px-6 py-12 text-center text-sm text-ink-500">
          Belum ada produk. Klik &quot;Tambah produk&quot; untuk membuat yang pertama.
        </p>
      ) : (
        <div className="scroll-x mt-6 rounded-card border border-ink-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Daftar produk</caption>
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Nama</th>
                <th scope="col" className="px-4 py-3 font-medium">Merek</th>
                <th scope="col" className="px-4 py-3 font-medium">Tipe</th>
                <th scope="col" className="px-4 py-3 font-medium">Kapasitas</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Harga mulai</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <th scope="row" className="px-4 py-3 font-medium text-ink-900">
                    {product.name}
                    <span className="mt-0.5 block text-xs font-normal text-ink-400">
                      {product.slug}
                    </span>
                  </th>
                  <td className="px-4 py-3 text-ink-700">{brandLabel(product.brand)}</td>
                  <td className="px-4 py-3 text-ink-700">{productTypeLabel(product.type)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-700">
                    {formatPk(product.capacityPk)} PK
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-900">
                    {formatRupiah(product.startingPrice)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.featured ? <Badge tone="brand">Unggulan</Badge> : null}
                      {product.inverter ? <Badge tone="success">Inverter</Badge> : null}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link
                      href={`/admin/produk/${product.id}`}
                      className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      Ubah
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(product)}
                      disabled={deletingId === product.id}
                      className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {deletingId === product.id ? "Menghapus..." : "Hapus"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
