"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import * as api from "@/lib/api/browser";
import type { Service } from "@/lib/api/types";
import { ServiceForm } from "@/components/admin/ServiceForm";

export default function EditServicePage() {
  const params = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { service } = await api.getService(params.id);
        if (!cancelled) setService(service);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat layanan");
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
        <Link href="/admin/layanan" className="hover:text-brand-600">
          Layanan
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="font-medium text-ink-700">
          {service ? service.name : "Ubah layanan"}
        </span>
      </nav>

      <h1 className="mt-3 text-2xl font-bold text-ink-900">Ubah layanan</h1>

      {error ? (
        <p
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : !service ? (
        <p className="mt-6 text-sm text-ink-500">Memuat...</p>
      ) : (
        <div className="mt-6">
          <ServiceForm service={service} />
        </div>
      )}
    </div>
  );
}
