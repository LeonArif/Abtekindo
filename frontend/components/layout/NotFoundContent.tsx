import { hasWhatsApp } from "@/lib/site";
import { generalEnquiry } from "@/lib/whatsapp";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WhatsAppIcon } from "@/components/layout/MobileNav";

/**
 * 404 body content, shared between the two places a visitor can land on a
 * not-found page:
 *
 * - `app/(situs)/not-found.tsx`, reached when `notFound()` is thrown inside
 *   the public route group (e.g. a product slug that does not exist). This
 *   one is wrapped by `app/(situs)/layout.tsx`, which already supplies
 *   Header/Footer/FloatingWhatsApp.
 * - `app/not-found.tsx`, reached for a URL that matches no route at all
 *   (e.g. a typo). Next.js resolves unmatched URLs against the root
 *   `not-found.js` only, bypassing any route group layout, so that file
 *   renders Header/Footer/FloatingWhatsApp around this same content itself.
 *
 * A dead end is a lost customer, so this offers the two things a visitor who
 * mistyped a product URL most likely wants: the catalog, or a way to just ask.
 */
export function NotFoundContent() {
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
