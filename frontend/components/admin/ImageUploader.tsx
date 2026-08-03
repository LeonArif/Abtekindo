"use client";

import { useRef, useState } from "react";

import * as api from "@/lib/api/browser";
import { AdminApiError } from "@/lib/api/browser";
import { Button } from "@/components/ui/Button";

export type UploadedImage = {
  objectKey: string;
  alt: string;
  url?: string;
};

/**
 * Product photo manager.
 *
 * Files go straight from the browser to object storage using a presigned URL,
 * so the API never handles the bytes. The parent form holds the resulting
 * object keys and submits them with the rest of the product.
 *
 * When storage is not configured, which is normal in development, the API
 * answers 503 and this surfaces that as a plain explanation rather than an
 * error the operator cannot act on.
 */
export function ImageUploader({
  images,
  onChange,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploaded: UploadedImage[] = [];
      for (const file of Array.from(files)) {
        const { objectKey, publicUrl } = await api.uploadImage(file);
        uploaded.push({ objectKey, alt: "", url: publicUrl });
      }
      onChange([...images, ...uploaded]);
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 503) {
        setError(
          "Penyimpanan gambar belum dikonfigurasi. Isi kredensial R2 di environment " +
            "server untuk mengaktifkan unggah foto.",
        );
      } else {
        setError(err instanceof Error ? err.message : "Gagal mengunggah gambar");
      }
    } finally {
      setUploading(false);
      // Clearing the input allows re-selecting the same file after an error.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function updateAlt(index: number, alt: string) {
    onChange(images.map((img, i) => (i === index ? { ...img, alt } : img)));
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;

    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(e) => void handleFiles(e.target.files)}
          className="sr-only"
          id="product-images"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Mengunggah..." : "Pilih foto"}
        </Button>
        <p className="mt-2 text-xs text-ink-500">
          Format JPG, PNG, WebP, atau AVIF. Foto pertama dipakai sebagai gambar
          utama di katalog.
        </p>
      </div>

      {error ? (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed border-ink-300 px-4 py-8 text-center text-sm text-ink-500">
          Belum ada foto. Produk tanpa foto tetap tampil, dengan gambar
          pengganti berlabel nama produk.
        </p>
      ) : (
        <ul className="space-y-3">
          {images.map((image, index) => (
            <li
              key={image.objectKey}
              className="flex flex-wrap items-start gap-4 rounded-lg border border-ink-200 p-3"
            >
              {image.url ? (
                // A plain img, not next/image: these are freshly uploaded URLs
                // on a bucket domain that the image optimiser is not configured
                // for, and they are only ever seen by the admin.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.url}
                  alt={image.alt || "Pratinjau foto produk"}
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-xs text-ink-500">
                  Foto
                </div>
              )}

              <div className="min-w-48 flex-1">
                <label
                  htmlFor={`alt-${index}`}
                  className="block text-xs font-medium text-ink-700"
                >
                  Teks alternatif
                </label>
                <input
                  id={`alt-${index}`}
                  type="text"
                  value={image.alt}
                  onChange={(e) => updateAlt(index, e.target.value)}
                  maxLength={300}
                  placeholder="Deskripsi singkat foto untuk pembaca layar"
                  className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
                />
                {index === 0 ? (
                  <p className="mt-1 text-xs text-brand-600">Gambar utama</p>
                ) : null}
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 disabled:opacity-30"
                  aria-label={`Pindahkan foto ${index + 1} ke atas`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 disabled:opacity-30"
                  aria-label={`Pindahkan foto ${index + 1} ke bawah`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                  aria-label={`Hapus foto ${index + 1}`}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
