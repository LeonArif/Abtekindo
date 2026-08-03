"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import * as api from "@/lib/api/browser";
import { AdminApiError } from "@/lib/api/browser";
import type { Service, ServiceWrite } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Field, Fieldset, Checkbox, Select, TextArea } from "./FormControls";

const ICONS = [
  { value: "sparkles", label: "Cuci / bersih" },
  { value: "wrench", label: "Perbaikan" },
  { value: "plug", label: "Instalasi" },
  { value: "truck", label: "Bongkar pasang" },
  { value: "gauge", label: "Freon" },
  { value: "calendar", label: "Kontrak berkala" },
];

type RateRow = {
  label: string;
  unit: string;
  priceFrom: number;
  note: string;
};

/**
 * Create and edit form for a service and its price list.
 *
 * The rate table is the reason this form exists: publishing prices is the
 * site's main differentiator, so editing them has to be as easy as adding a row.
 */
export function ServiceForm({ service }: { service?: Service }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState<RateRow[]>(
    service?.rates.map((r) => ({
      label: r.label,
      unit: r.unit,
      priceFrom: r.priceFrom,
      note: r.note,
    })) ?? [{ label: "", unit: "unit", priceFrom: 0, note: "" }],
  );

  function updateRate(index: number, patch: Partial<RateRow>) {
    setRates(rates.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRate() {
    setRates([...rates, { label: "", unit: "unit", priceFrom: 0, note: "" }]);
  }

  function removeRate(index: number) {
    setRates(rates.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setSaving(true);
    setError(null);

    const payload: ServiceWrite = {
      slug: String(data.get("slug") ?? "").trim(),
      name: String(data.get("name") ?? "").trim(),
      summary: String(data.get("summary") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      bullets: String(data.get("bullets") ?? "")
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean),
      icon: String(data.get("icon") ?? "wrench"),
      published: data.get("published") === "on",
      sortOrder: Number(data.get("sortOrder")) || 0,
      // Blank rows are dropped rather than rejected: an operator who adds a row
      // and changes their mind should be able to just save.
      rates: rates
        .filter((r) => r.label.trim() && r.priceFrom > 0)
        .map((r) => ({
          label: r.label.trim(),
          unit: r.unit.trim() || "unit",
          priceFrom: r.priceFrom,
          note: r.note.trim(),
        })),
    };

    try {
      if (service) {
        await api.updateService(service.id, payload);
      } else {
        await api.createService(payload);
      }
      router.push("/admin/layanan");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : "Gagal menyimpan layanan. Periksa koneksi Anda.",
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Fieldset legend="Informasi layanan">
        <Field
          label="Nama layanan"
          name="name"
          required
          defaultValue={service?.name}
          maxLength={200}
          placeholder="Cuci AC"
        />
        <Field
          label="Slug"
          name="slug"
          required
          defaultValue={service?.slug}
          maxLength={200}
          pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
          placeholder="cuci-ac"
          hint="Bagian alamat URL. Huruf kecil dan tanda hubung saja."
        />
        <TextArea
          label="Ringkasan"
          name="summary"
          rows={2}
          defaultValue={service?.summary}
          maxLength={500}
          hint="Satu kalimat yang tampil di kartu layanan"
        />
        <TextArea
          label="Deskripsi lengkap"
          name="description"
          rows={4}
          defaultValue={service?.description}
          maxLength={5000}
        />
        <TextArea
          label="Poin keunggulan"
          name="bullets"
          rows={5}
          defaultValue={service?.bullets.join("\n")}
          hint="Satu poin per baris"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Ikon"
            name="icon"
            defaultValue={service?.icon ?? "wrench"}
            options={ICONS}
          />
          <Field
            label="Urutan tampil"
            name="sortOrder"
            type="number"
            defaultValue={service?.sortOrder ?? 0}
            hint="Angka lebih kecil tampil lebih dulu"
          />
        </div>
        <Checkbox
          label="Tampilkan di halaman layanan"
          name="published"
          defaultChecked={service?.published ?? true}
        />
      </Fieldset>

      <Fieldset legend="Daftar harga">
        <div className="space-y-3">
          {rates.map((rate, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-lg border border-ink-200 p-3 sm:grid-cols-[2fr_1fr_1fr_auto]"
            >
              <div>
                <label
                  htmlFor={`rate-label-${index}`}
                  className="block text-xs font-medium text-ink-700"
                >
                  Keterangan
                </label>
                <input
                  id={`rate-label-${index}`}
                  type="text"
                  value={rate.label}
                  onChange={(e) => updateRate(index, { label: e.target.value })}
                  maxLength={200}
                  placeholder="AC Split 0,5 - 1 PK"
                  className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor={`rate-price-${index}`}
                  className="block text-xs font-medium text-ink-700"
                >
                  Harga mulai (Rp)
                </label>
                <input
                  id={`rate-price-${index}`}
                  type="number"
                  min={0}
                  step={5000}
                  value={rate.priceFrom || ""}
                  onChange={(e) =>
                    updateRate(index, { priceFrom: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor={`rate-unit-${index}`}
                  className="block text-xs font-medium text-ink-700"
                >
                  Satuan
                </label>
                <input
                  id={`rate-unit-${index}`}
                  type="text"
                  value={rate.unit}
                  onChange={(e) => updateRate(index, { unit: e.target.value })}
                  maxLength={50}
                  placeholder="unit"
                  className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeRate(index)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                  aria-label={`Hapus baris harga ${index + 1}`}
                >
                  ×
                </button>
              </div>

              <div className="sm:col-span-4">
                <label
                  htmlFor={`rate-note-${index}`}
                  className="block text-xs font-medium text-ink-700"
                >
                  Catatan
                </label>
                <input
                  id={`rate-note-${index}`}
                  type="text"
                  value={rate.note}
                  onChange={(e) => updateRate(index, { note: e.target.value })}
                  maxLength={300}
                  placeholder="Opsional, misalnya: sudah termasuk pipa 3 meter"
                  className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addRate}>
          Tambah baris harga
        </Button>
      </Fieldset>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Menyimpan..." : service ? "Simpan perubahan" : "Buat layanan"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/admin/layanan")}
          disabled={saving}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
