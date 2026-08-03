"use client";

import Link from "next/link";

import { ServiceForm } from "@/components/admin/ServiceForm";

export default function NewServicePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Remah roti" className="text-sm text-ink-500">
        <Link href="/admin/layanan" className="hover:text-brand-600">
          Layanan
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="font-medium text-ink-700">Tambah layanan</span>
      </nav>

      <h1 className="mt-3 text-2xl font-bold text-ink-900">Tambah layanan</h1>

      <div className="mt-6">
        <ServiceForm />
      </div>
    </div>
  );
}
