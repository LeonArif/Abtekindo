"use client";

import { useState } from "react";

import type { LeadSource } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";

/**
 * Contact form.
 *
 * WhatsApp is the primary conversion path, but a message sent when nobody is
 * watching the phone is easy to lose. This form is the durable backup: every
 * submission becomes a database row that survives until someone marks it
 * handled.
 *
 * It posts straight to the Go API rather than through a Next route handler, so
 * there is one place where lead validation, rate limiting and spam checks live.
 */

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

export function ContactForm({
  source = "contact",
  productId,
  serviceId,
  compact = false,
}: {
  source?: LeadSource;
  productId?: string;
  serviceId?: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    // Honeypot: a field hidden from people but filled in by naive bots. When it
    // has a value, pretend the submission succeeded so the bot does not learn
    // it was caught, and send nothing.
    if (data.get("website")) {
      setStatus({ state: "success", message: "Terima kasih, pesan Anda sudah kami terima." });
      form.reset();
      return;
    }

    setStatus({ state: "submitting" });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

    try {
      const response = await fetch(`${apiUrl}/v1/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          phone: String(data.get("phone") ?? ""),
          email: String(data.get("email") ?? ""),
          message: String(data.get("message") ?? ""),
          source,
          productId: productId ?? "",
          serviceId: serviceId ?? "",
          turnstileToken: String(data.get("cf-turnstile-response") ?? ""),
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
        detail?: string;
      };

      if (!response.ok) {
        setStatus({
          state: "error",
          // The API already returns visitor-facing Indonesian messages.
          message:
            body.detail ??
            "Maaf, pesan gagal dikirim. Silakan coba lagi atau hubungi kami via WhatsApp.",
        });
        return;
      }

      setStatus({
        state: "success",
        message: body.message ?? "Terima kasih, pesan Anda sudah kami terima.",
      });
      form.reset();
    } catch {
      setStatus({
        state: "error",
        message:
          "Tidak dapat terhubung ke server. Periksa koneksi Anda, atau hubungi kami via WhatsApp.",
      });
    }
  }

  if (status.state === "success") {
    return (
      <div
        className="rounded-card border border-emerald-200 bg-emerald-50 p-6 text-center"
        role="status"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-6 w-6 text-emerald-600"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="mt-4 font-semibold text-emerald-900">{status.message}</p>
        <button
          type="button"
          onClick={() => setStatus({ state: "idle" })}
          className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-emerald-700 underline hover:text-emerald-800"
        >
          Kirim pesan lain
        </button>
      </div>
    );
  }

  const submitting = status.state === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
        <Field
          label="Nama"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Nama lengkap Anda"
          maxLength={120}
        />
        <Field
          label="Nomor WhatsApp"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="0812xxxxxxxx"
          maxLength={30}
          hint="Kami akan menghubungi nomor ini"
        />
      </div>

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="nama@email.com"
        maxLength={255}
        hint="Opsional"
      />

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-ink-800">
          Pesan <span className="text-red-600">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          minLength={10}
          maxLength={2000}
          placeholder="Ceritakan kebutuhan Anda: jenis layanan atau produk, jumlah unit, dan lokasi."
          className="mt-1.5 w-full rounded-lg border border-ink-300 px-3.5 py-2.5 text-base text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Honeypot. Hidden from assistive technology and keyboard users, so only
          a script that fills every field will trip it. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status.state === "error" ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {status.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" fullWidth disabled={submitting}>
        {submitting ? "Mengirim..." : "Kirim pesan"}
      </Button>

      <p className="text-xs leading-relaxed text-ink-500">
        Data yang Anda kirim hanya kami gunakan untuk menindaklanjuti permintaan
        ini dan tidak dibagikan ke pihak lain.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  hint,
  required = false,
  ...props
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
} & React.ComponentProps<"input">) {
  const hintId = hint ? `${name}-hint` : undefined;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink-800">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        aria-describedby={hintId}
        className="mt-1.5 w-full rounded-lg border border-ink-300 px-3.5 py-2.5 text-base text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        {...props}
      />
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
