"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import * as api from "@/lib/api/browser";
import type { Service } from "@/lib/api/types";
import { formatRupiah } from "@/lib/format";
import { useAsyncData } from "@/lib/useAsyncData";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";

export default function AdminServicesPage() {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { services } = await api.listServices();
    return services;
  }, []);

  const { state, reload, setError } = useAsyncData(load);

  const services = state.status === "ready" ? state.data : null;
  const error = state.status === "error" ? state.message : null;

  async function handleDelete(service: Service) {
    if (
      !window.confirm(
        `Hapus layanan "${service.name}" beserta daftar harganya? Tindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      return;
    }

    setDeletingId(service.id);
    try {
      await api.deleteService(service.id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus layanan");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Layanan</h1>
          <p className="mt-1 text-sm text-ink-500">
            {services ? `${services.length} layanan` : "Memuat..."}
          </p>
        </div>
        <ButtonLink href="/admin/layanan/baru">Tambah layanan</ButtonLink>
      </div>

      {error ? (
        <p
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {services === null ? (
        <p className="mt-6 text-sm text-ink-500">Memuat...</p>
      ) : services.length === 0 ? (
        <p className="mt-6 rounded-card border border-dashed border-ink-300 bg-white px-6 py-12 text-center text-sm text-ink-500">
          Belum ada layanan.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {services.map((service) => {
            const lowest = service.rates.length
              ? Math.min(...service.rates.map((r) => r.priceFrom))
              : null;

            return (
              <li
                key={service.id}
                className="flex flex-wrap items-start justify-between gap-4 rounded-card border border-ink-200 bg-white p-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-ink-900">{service.name}</h2>
                    {!service.published ? <Badge tone="warning">Disembunyikan</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-ink-400">{service.slug}</p>
                  {service.summary ? (
                    <p className="mt-2 max-w-2xl text-sm text-ink-600">{service.summary}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-ink-500">
                    {service.rates.length} baris harga
                    {lowest !== null ? `, mulai dari ${formatRupiah(lowest)}` : ""}
                  </p>
                </div>

                <div className="flex gap-1">
                  <Link
                    href={`/admin/layanan/${service.id}`}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-brand-600 hover:bg-brand-50"
                  >
                    Ubah
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete(service)}
                    disabled={deletingId === service.id}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === service.id ? "Menghapus..." : "Hapus"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
