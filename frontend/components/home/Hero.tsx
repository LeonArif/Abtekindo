import { SITE, hasWhatsApp } from "@/lib/site";
import { generalEnquiry } from "@/lib/whatsapp";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Scribble } from "@/components/ui/Scribble";
import { WhatsAppIcon } from "@/components/layout/MobileNav";
import { HeroCarousel } from "./HeroCarousel";

/**
 * Homepage hero.
 *
 * Two calls to action, in priority order: chat, which is how this business
 * actually converts, then browse the catalog for visitors who want to look
 * before talking. The headline names the service rather than the company,
 * because a visitor arriving from a search for "service AC Jakarta" needs to
 * see their own words first.
 *
 * The stat row only shows numbers this codebase can actually stand behind —
 * years active, brand count and service-area count are all derived from
 * `SITE`, not invented marketing figures.
 */
export function Hero() {
  const yearsActive = new Date().getFullYear() - SITE.foundedYear;

  return (
    <section className="relative overflow-hidden bg-brand-900 text-white">
      {/* Pinned to the section's own edges, well outside the text and stat
          columns on every breakpoint. */}
      <Scribble variant="cross" className="right-3 top-3 h-12 w-12 opacity-45" />
      <Scribble variant="compass" className="left-3 bottom-3 h-14 w-14 opacity-40" tone="gold" />
      <Scribble variant="compass" className="right-[3%] top-1/3 hidden h-11 w-11 opacity-35 lg:block" />
      <Scribble
        variant="cross"
        className="left-[2%] top-1/2 hidden h-10 w-10 opacity-35 lg:block"
        tone="gold"
      />

      <Container>
        <div className="grid gap-10 py-14 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-20">
          <div className="animate-slide-in-left relative">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-300">
              Jual &middot; Pasang &middot; Servis AC
            </span>

            <h1 className="mt-4 text-4xl leading-[1.05] sm:text-5xl lg:text-[3.25rem]">
              Service, pasang, dan beli AC dalam satu tempat
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-300">
              Cuci AC, perbaikan, pemasangan unit baru, sampai penjualan AC
              resmi bergaransi. Harga kami tercantum terbuka, dikerjakan
              teknisi berpengalaman.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {hasWhatsApp ? (
                <ExternalButtonLink href={generalEnquiry()} variant="invert" size="lg">
                  <WhatsAppIcon className="h-5 w-5" />
                  Chat WhatsApp
                </ExternalButtonLink>
              ) : (
                <ButtonLink href="/kontak" variant="invert" size="lg">
                  Hubungi kami
                </ButtonLink>
              )}
              <ButtonLink href="/produk" variant="outline-invert" size="lg">
                Lihat katalog produk
              </ButtonLink>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/10 pt-6">
              <Stat value={`${yearsActive}+`} label="Tahun beroperasi" />
              <Stat value={String(SITE.brands.length)} label="Brand resmi" />
              <Stat value={`${SITE.serviceAreas.length}+`} label="Area layanan" />
            </div>
          </div>

          <div className="animate-reveal relative" style={{ animationDelay: "200ms" }}>
            <Scribble
              variant="cross"
              className="-right-2 -top-2 h-11 w-11 opacity-55"
              tone="gold"
            />
            <Scribble variant="compass" className="-bottom-3 -left-3 h-12 w-12 opacity-50" />
            <HeroCarousel />
          </div>
        </div>
      </Container>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-semibold text-white">{value}</div>
      <div className="text-xs text-ink-400">{label}</div>
    </div>
  );
}
