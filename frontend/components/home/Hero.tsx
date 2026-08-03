import { SITE, hasWhatsApp } from "@/lib/site";
import { generalEnquiry } from "@/lib/whatsapp";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { AirConditionerGlyph } from "@/components/ui/Placeholder";
import { WhatsAppIcon } from "@/components/layout/MobileNav";

/**
 * Homepage hero.
 *
 * Two calls to action, in priority order: chat, which is how this business
 * actually converts, then browse the catalog for visitors who want to look
 * before talking. The headline names the service rather than the company,
 * because a visitor arriving from a search for "service AC Jakarta" needs to
 * see their own words first.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-900 text-white">
      {/* Decorative background. aria-hidden so it is never announced. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-700/40 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
      </div>

      <Container>
        <div className="relative grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-brand-100 ring-1 ring-inset ring-white/20">
              Distributor {SITE.brands.map((b) => b.name).join(" · ")}
            </p>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Service, pasang, dan beli AC dalam satu tempat
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-100">
              Cuci AC, perbaikan, pemasangan unit baru, sampai penjualan AC resmi
              bergaransi. Harga kami tercantum terbuka, dikerjakan teknisi
              berpengalaman.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {hasWhatsApp ? (
                <ExternalButtonLink href={generalEnquiry()} variant="whatsapp" size="lg">
                  <WhatsAppIcon className="h-5 w-5" />
                  Pesan via WhatsApp
                </ExternalButtonLink>
              ) : (
                <ButtonLink href="/kontak" size="lg">
                  Hubungi kami
                </ButtonLink>
              )}
              <ButtonLink
                href="/produk"
                size="lg"
                className="border border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                Lihat katalog produk
              </ButtonLink>
            </div>

            <p className="mt-6 text-sm text-brand-200">
              Melayani {SITE.serviceAreas.slice(0, 4).join(", ")}, dan sekitarnya
            </p>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-gradient-to-br from-brand-700 to-brand-800 ring-1 ring-inset ring-white/20">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
                <AirConditionerGlyph className="h-28 w-28 text-brand-300" />
                <p className="max-w-xs px-6 text-sm text-brand-200">
                  Foto pemasangan atau showroom Abtekindo
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
