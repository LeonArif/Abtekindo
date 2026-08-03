"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import * as api from "@/lib/api/browser";
import { AdminApiError } from "@/lib/api/browser";
import {
  BRANDS,
  PRODUCT_TYPES,
  type Product,
  type ProductWrite,
} from "@/lib/api/types";
import { brandLabel, productTypeLabel } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Field, Fieldset, Checkbox, Select, TextArea } from "./FormControls";
import { ImageUploader } from "./ImageUploader";

/**
 * Create and edit form for a product.
 *
 * One component serves both cases because the API replaces the whole row on
 * write: there is no partial-update path, so a create is just an edit starting
 * from defaults.
 */
export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<Array<{ objectKey: string; alt: string; url?: string }>>(
    // An existing product's images arrive as public URLs; the object key is
    // recovered from the path so an unchanged image survives a save.
    product?.images.map((img) => ({
      objectKey: new URL(img.url, "http://placeholder.local").pathname.replace(/^\//, ""),
      alt: img.alt,
      url: img.url,
    })) ?? [],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setSaving(true);
    setError(null);

    const payload: ProductWrite = {
      slug: String(data.get("slug") ?? "").trim(),
      name: String(data.get("name") ?? "").trim(),
      brand: String(data.get("brand")) as ProductWrite["brand"],
      type: String(data.get("type")) as ProductWrite["type"],
      capacityPk: Number(data.get("capacityPk")),
      btu: Number(data.get("btu")),
      startingPrice: Number(data.get("startingPrice")),
      inverter: data.get("inverter") === "on",
      refrigerant: String(data.get("refrigerant") ?? "").trim(),
      powerWatt: Number(data.get("powerWatt")),
      roomSize: String(data.get("roomSize") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      // One feature per line is far easier to edit than comma separation, since
      // feature text itself often contains commas.
      features: String(data.get("features") ?? "")
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      featured: data.get("featured") === "on",
      published: data.get("published") === "on",
      sortOrder: Number(data.get("sortOrder")) || 0,
      images: images.map((img) => ({ objectKey: img.objectKey, alt: img.alt })),
    };

    try {
      if (product) {
        await api.updateProduct(product.id, payload);
      } else {
        await api.createProduct(payload);
      }
      router.push("/admin/produk");
      // Discards the cached admin list so the change is visible immediately.
      router.refresh();
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : "Gagal menyimpan produk. Periksa koneksi Anda.",
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Fieldset legend="Informasi dasar">
        <Field
          label="Nama produk"
          name="name"
          required
          defaultValue={product?.name}
          maxLength={200}
          placeholder="Daikin Smile Inverter FTKC25UVM 1 PK"
        />
        <Field
          label="Slug"
          name="slug"
          required
          defaultValue={product?.slug}
          maxLength={200}
          pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
          placeholder="daikin-smile-inverter-ftkc25uvm-1pk"
          hint="Bagian alamat URL. Huruf kecil dan tanda hubung saja."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Merek"
            name="brand"
            required
            defaultValue={product?.brand}
            options={BRANDS.map((b) => ({ value: b, label: brandLabel(b) }))}
          />
          <Select
            label="Tipe"
            name="type"
            required
            defaultValue={product?.type}
            options={PRODUCT_TYPES.map((t) => ({ value: t, label: productTypeLabel(t) }))}
          />
        </div>
      </Fieldset>

      <Fieldset legend="Spesifikasi">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Kapasitas (PK)"
            name="capacityPk"
            type="number"
            step="0.05"
            min="0.1"
            max="99"
            required
            defaultValue={product?.capacityPk ?? 1}
          />
          <Field
            label="BTU/h"
            name="btu"
            type="number"
            min="1"
            max="200000"
            required
            defaultValue={product?.btu ?? 9000}
          />
          <Field
            label="Daya (watt)"
            name="powerWatt"
            type="number"
            min="1"
            max="100000"
            required
            defaultValue={product?.powerWatt ?? 660}
          />
          <Field
            label="Refrigeran"
            name="refrigerant"
            defaultValue={product?.refrigerant ?? "R32"}
            maxLength={50}
            placeholder="R32"
          />
        </div>
        <Field
          label="Luas ruangan"
          name="roomSize"
          defaultValue={product?.roomSize}
          maxLength={100}
          placeholder="14 - 18 m²"
        />
        <Checkbox
          label="Teknologi inverter"
          name="inverter"
          defaultChecked={product?.inverter ?? false}
        />
      </Fieldset>

      <Fieldset legend="Harga dan tampilan">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Harga mulai (Rp)"
            name="startingPrice"
            type="number"
            min="1"
            step="1000"
            required
            defaultValue={product?.startingPrice ?? 3000000}
            hint="Rupiah penuh, tanpa titik atau koma"
          />
          <Field
            label="Urutan tampil"
            name="sortOrder"
            type="number"
            defaultValue={product?.sortOrder ?? 0}
            hint="Angka lebih kecil tampil lebih dulu"
          />
        </div>
        <Checkbox
          label="Tampilkan di katalog publik"
          name="published"
          defaultChecked={product?.published ?? true}
          hint="Jika dimatikan, produk tersimpan tetapi tidak terlihat pengunjung"
        />
        <Checkbox
          label="Tampilkan sebagai produk unggulan di beranda"
          name="featured"
          defaultChecked={product?.featured ?? false}
        />
      </Fieldset>

      <Fieldset legend="Deskripsi dan fitur">
        <TextArea
          label="Deskripsi"
          name="description"
          rows={4}
          defaultValue={product?.description}
          maxLength={5000}
          placeholder="Jelaskan keunggulan dan kegunaan produk ini."
        />
        <TextArea
          label="Fitur"
          name="features"
          rows={6}
          defaultValue={product?.features.join("\n")}
          placeholder={"Kompresor inverter hemat listrik\nRefrigeran R32\nMode tidur"}
          hint="Satu fitur per baris"
        />
      </Fieldset>

      <Fieldset legend="Foto produk">
        <ImageUploader images={images} onChange={setImages} />
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
          {saving ? "Menyimpan..." : product ? "Simpan perubahan" : "Buat produk"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/admin/produk")}
          disabled={saving}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
