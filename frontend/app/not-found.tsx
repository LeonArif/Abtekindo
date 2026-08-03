import type { Metadata } from "next";

import { hasWhatsApp } from "@/lib/site";
import { generalEnquiry } from "@/lib/whatsapp";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WhatsAppIcon } from "@/components/layout/MobileNav";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false, follow: true },
};

/**
 * 404 page.
 *
 * A dead end is a lost customer, so this offers the two things a visitor who
 * mistyped a product URL most likely wants: the catalog, or a way to just ask.
 */
export default function NotFound() {
  return (
    <Container>
      <div className="mx-auto max-w-xl py-24 text-center sm:py-32">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Error 404
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-600">
          Halaman yang Anda cari mungkin sudah dipindahkan atau tidak lagi
          tersedia. Coba lihat katalog produk kami, atau hubungi kami langsung
          jika Anda mencari unit tertentu.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/produk" size="lg">
            Lihat katalog produk
          </ButtonLink>
          {hasWhatsApp ? (
            <ExternalButtonLink href={generalEnquiry()} variant="whatsapp" size="lg">
              <WhatsAppIcon className="h-5 w-5" />
              Tanya via WhatsApp
            </ExternalButtonLink>
          ) : (
            <ButtonLink href="/kontak" variant="outline" size="lg">
              Hubungi kami
            </ButtonLink>
          )}
        </div>
      </div>
    </Container>
  );
}
