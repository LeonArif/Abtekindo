"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import * as api from "@/lib/api/browser";
import type { Product } from "@/lib/api/types";
import { ProductForm } from "@/components/admin/ProductForm";

export default function EditProductPage() {
  // useParams rather than the async params prop: this is a client component,
  // so it reads the route from the client router.
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { product } = await api.getProduct(params.id);
        if (!cancelled) setProduct(product);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat produk");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Remah roti" className="text-sm text-ink-500">
        <Link href="/admin/produk" className="hover:text-brand-600">
          Produk
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="font-medium text-ink-700">
          {product ? product.name : "Ubah produk"}
        </span>
      </nav>

      <h1 className="mt-3 text-2xl font-bold text-ink-900">Ubah produk</h1>

      {error ? (
        <p
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : !product ? (
        <p className="mt-6 text-sm text-ink-500">Memuat...</p>
      ) : (
        <div className="mt-6">
          <ProductForm product={product} />
        </div>
      )}
    </div>
  );
}
