"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import * as api from "@/lib/api/browser";
import { formatDateTime } from "@/lib/format";

type Summary = {
  products: number;
  published: number;
  services: number;
  newLeads: number;
  totalLeads: number;
  recent: Array<{ id: string; name: string; phone: string; createdAt: string }>;
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Independent reads, so they run together rather than in sequence.
        const [products, services, leads] = await Promise.all([
          api.listProducts(1, 100),
          api.listServices(),
          api.listLeads(),
        ]);

        if (cancelled) return;

        setSummary({
          products: products.pagination.total,
          published: products.products.filter((p) => p.featured).length,
          services: services.services.length,
          newLeads: leads.counts.new ?? 0,
          totalLeads: leads.pagination.total,
          recent: leads.leads.slice(0, 5).map((l) => ({
            id: l.id,
            name: l.name,
            phone: l.phone,
            createdAt: l.createdAt,
          })),
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat data");
        }
      }
    }

    void load();
    // Guards against setting state after the component unmounts, which happens
    // if the operator navigates away while these requests are still running.
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <ErrorBox message={error} />;
  }

  if (!summary) {
    return <p className="text-sm text-ink-500">Memuat...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Ringkasan</h1>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total produk" value={summary.products} href="/admin/produk" />
        <Stat label="Produk unggulan" value={summary.published} href="/admin/produk" />
        <Stat label="Layanan" value={summary.services} href="/admin/layanan" />
        <Stat
          label="Prospek baru"
          value={summary.newLeads}
          href="/admin/prospek?status=new"
          highlight={summary.newLeads > 0}
        />
      </dl>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Prospek terbaru</h2>
          <Link
            href="/admin/prospek"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Lihat semua
          </Link>
        </div>

        {summary.recent.length === 0 ? (
          <p className="mt-4 rounded-card border border-dashed border-ink-300 bg-white px-6 py-10 text-center text-sm text-ink-500">
            Belum ada prospek masuk.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink-200 rounded-card border border-ink-200 bg-white">
            {summary.recent.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <div>
                  <p className="font-medium text-ink-900">{lead.name}</p>
                  <p className="text-sm text-ink-500">{lead.phone}</p>
                </div>
                <p className="text-sm text-ink-500">{formatDateTime(lead.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  highlight = false,
}: {
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        highlight
          ? "rounded-card border border-brand-300 bg-brand-50 p-5 transition-shadow hover:shadow-md"
          : "rounded-card border border-ink-200 bg-white p-5 transition-shadow hover:shadow-md"
      }
    >
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="mt-1 text-3xl font-bold text-ink-900">{value}</dd>
    </Link>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <p
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      {message}
    </p>
  );
}
