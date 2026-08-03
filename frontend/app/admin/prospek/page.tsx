"use client";

import { useCallback, useState } from "react";

import * as api from "@/lib/api/browser";
import type { Lead, LeadStatus } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useAsyncData } from "@/lib/useAsyncData";

/**
 * Lead inbox.
 *
 * This is the safety net behind WhatsApp: every enquiry that came through the
 * contact form stays here until someone marks it handled, so a message missed
 * on the phone is not a customer lost.
 */

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Baru",
  contacted: "Dihubungi",
  closed: "Selesai",
};

const STATUS_TONES: Record<LeadStatus, string> = {
  new: "bg-brand-50 text-brand-700 ring-brand-200",
  contacted: "bg-amber-50 text-amber-700 ring-amber-200",
  closed: "bg-ink-100 text-ink-600 ring-ink-200",
};

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "Semua" },
  { value: "new", label: "Baru" },
  { value: "contacted", label: "Dihubungi" },
  { value: "closed", label: "Selesai" },
];

export default function LeadsPage() {
  const [filter, setFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Re-created whenever the filter changes, which is what makes the hook
  // re-fetch: the effect inside it depends on this callback's identity.
  const load = useCallback(
    () => api.listLeads(filter || undefined),
    [filter],
  );

  const { state, reload, setError } = useAsyncData(load);

  const leads = state.status === "ready" ? state.data.leads : null;
  const counts = state.status === "ready" ? state.data.counts : {};
  const error = state.status === "error" ? state.message : null;

  async function changeStatus(lead: Lead, status: LeadStatus) {
    setUpdatingId(lead.id);
    try {
      await api.updateLeadStatus(lead.id, status);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Prospek</h1>
      <p className="mt-1 text-sm text-ink-500">
        Pesan yang masuk melalui form kontak di website.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((option) => {
          const count = option.value ? counts[option.value] : undefined;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium",
                filter === option.value
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-ink-300 bg-white text-ink-700 hover:bg-ink-50",
              )}
            >
              {option.label}
              {count !== undefined ? (
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-600">
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {error ? (
        <p
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {leads === null ? (
        <p className="mt-6 text-sm text-ink-500">Memuat...</p>
      ) : leads.length === 0 ? (
        <p className="mt-6 rounded-card border border-dashed border-ink-300 bg-white px-6 py-12 text-center text-sm text-ink-500">
          Tidak ada prospek pada filter ini.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className="rounded-card border border-ink-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-ink-900">{lead.name}</h2>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                        STATUS_TONES[lead.status],
                      )}
                    >
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    {formatDateTime(lead.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/${lead.phone.replace(/^0/, "62").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center rounded-lg bg-whatsapp px-3.5 text-sm font-semibold text-white hover:bg-whatsapp-dark"
                  >
                    Balas WhatsApp
                  </a>
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex min-h-11 items-center rounded-lg border border-ink-300 px-3.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
                  >
                    Telepon
                  </a>
                </div>
              </div>

              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div className="flex gap-2">
                  <dt className="text-ink-500">Telepon</dt>
                  <dd className="font-medium text-ink-900">{lead.phone}</dd>
                </div>
                {lead.email ? (
                  <div className="flex min-w-0 gap-2">
                    <dt className="text-ink-500">Email</dt>
                    <dd className="truncate font-medium text-ink-900">
                      <a href={`mailto:${lead.email}`} className="hover:text-brand-600">
                        {lead.email}
                      </a>
                    </dd>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <dt className="text-ink-500">Sumber</dt>
                  <dd className="font-medium text-ink-900">{lead.source}</dd>
                </div>
              </dl>

              <p className="mt-4 whitespace-pre-wrap rounded-lg bg-ink-50 px-4 py-3 text-sm leading-relaxed text-ink-700">
                {lead.message}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink-500">Ubah status:</span>
                {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => void changeStatus(lead, status)}
                    disabled={lead.status === status || updatingId === lead.id}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-lg border px-3.5 text-sm font-medium",
                      lead.status === status
                        ? "border-ink-200 bg-ink-100 text-ink-400"
                        : "border-ink-300 text-ink-700 hover:bg-ink-50",
                      "disabled:cursor-not-allowed",
                    )}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
