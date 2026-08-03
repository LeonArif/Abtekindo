"use client";

import Link from "next/link";

import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Remah roti" className="text-sm text-ink-500">
        <Link href="/admin/produk" className="hover:text-brand-600">
          Produk
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="font-medium text-ink-700">Tambah produk</span>
      </nav>

      <h1 className="mt-3 text-2xl font-bold text-ink-900">Tambah produk</h1>

      <div className="mt-6">
        <ProductForm />
      </div>
    </div>
  );
}
