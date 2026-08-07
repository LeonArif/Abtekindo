import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SITE, hasWhatsApp } from "@/lib/site";
import { generalEnquiry } from "@/lib/whatsapp";
import { Container, Section, SectionHeading } from "@/components/ui/Container";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/Button";
import { Scribble } from "@/components/ui/Scribble";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsAppIcon } from "@/components/layout/MobileNav";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description:
    `${SITE.legalName} adalah perusahaan yang bergerak di bidang penjualan, ` +
    "pemasangan, dan perawatan AC untuk kebutuhan rumah tangga, kantor, dan tempat usaha.",
  alternates: { canonical: "/tentang-kami" },
};

const VALUES = [
  {
    title: "Harga transparan",
    body: "Daftar harga layanan kami terbuka di website. Estimasi biaya disampaikan sebelum pengerjaan, dan tidak ada tambahan di luar kesepakatan.",
    tone: "brand" as const,
  },
  {
    title: "Teknisi berpengalaman",
    body: "Pemasangan yang keliru adalah penyebab paling umum AC cepat rusak dan boros listrik. Teknisi kami bekerja sesuai standar pabrikan.",
    tone: "gold" as const,
  },
  {
    title: "Produk resmi bergaransi",
    body: `Kami menyediakan unit resmi dari ${SITE.brands.map((b) => b.name).join(", ")} lengkap dengan garansi pabrikan.`,
    tone: "gold" as const,
  },
  {
    title: "Layanan purna jual",
    body: "Hubungan kami tidak berhenti setelah unit terpasang. Perawatan berkala dan perbaikan tetap kami layani.",
    tone: "brand" as const,
  },
];

export default function AboutPage() {
  const yearsActive = new Date().getFullYear() - SITE.foundedYear;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Beranda", href: "/" },
          { name: "Tentang Kami", href: "/tentang-kami" },
        ]}
      />

      {/* Dark intro band, echoing the CTA bands elsewhere: the about page is
          where the brand gets to make an impression, not just report facts. */}
      <div className="relative overflow-hidden bg-brand-900 text-white">
        <Scribble variant="compass" className="right-16 top-10 h-28 w-28 opacity-40" />
        <Scribble variant="cross" className="right-[28%] bottom-8 h-12 w-12 opacity-35" />
        <Container>
          <div className="animate-slide-in-left relative flex min-h-[19rem] flex-col justify-center py-10 sm:min-h-[24rem] sm:py-14">
            <nav aria-label="Remah roti" className="text-sm text-ink-400">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-white">
                    Beranda
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="font-medium text-white">Tentang Kami</li>
              </ol>
            </nav>
            <span className="mt-6 inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand-300">
              Sejak {SITE.foundedYear}
            </span>
            <h1 className="mt-3 max-w-2xl text-3xl sm:text-4xl">{SITE.legalName}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-300">
              {yearsActive}+ tahun melayani kebutuhan pendingin ruangan untuk
              rumah, kantor, dan tempat usaha di {SITE.address.city} dan
              sekitarnya.
            </p>
          </div>
        </Container>
      </div>

      <Reveal delay={80}>
      <Container>
        <div className="grid gap-10 py-12 lg:grid-cols-2 lg:items-stretch lg:gap-16">
          <div>
            <p className="text-lg leading-relaxed text-ink-700">
              {SITE.legalName} adalah perusahaan yang bergerak di bidang
              peralatan rumah tangga dengan fokus utama pada pendingin udara.
              Kami melayani penjualan unit AC, pemasangan, serta perawatan dan
              perbaikan untuk pelanggan rumah tangga, kantor, dan tempat usaha.
            </p>
            <p className="mt-4 leading-relaxed text-ink-600">
              Sebagai distributor {SITE.brands.map((b) => b.name).join(", ")},
              kami menyediakan pilihan unit yang sesuai dengan kebutuhan dan
              anggaran Anda, bukan sekadar yang paling mahal. Tim kami membantu
              menentukan kapasitas yang tepat supaya ruangan dingin optimal tanpa
              tagihan listrik yang berlebihan.
            </p>
            <p className="mt-4 leading-relaxed text-ink-600">
              Kami percaya pekerjaan yang rapi lebih berharga daripada pekerjaan
              yang cepat. Setiap pemasangan melalui proses vakum sesuai standar
              pabrikan dan diuji sebelum kami meninggalkan lokasi.
            </p>
          </div>

          <div className="relative min-h-[20rem] overflow-hidden border border-ink-200">
            <Image
              src="/office.png"
              alt={`Kantor ${SITE.legalName}`}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* Stat strip echoing the hero's — the same three real numbers, given
            more room to read as a deliberate statement here. */}
        <div className="grid grid-cols-1 divide-y divide-ink-200 border-y border-ink-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Stat value={String(SITE.foundedYear)} label="Berdiri sejak" />
          <Stat value={`${yearsActive}+`} label="Tahun pengalaman" />
          <Stat value={String(SITE.brands.length)} label="Merek resmi" />
        </div>
      </Container>
      </Reveal>

      <Reveal delay={160}>
        <Section tone="muted" className="relative overflow-hidden">
          <Scribble variant="cross" className="right-10 top-6 h-16 w-16 opacity-65" />
          <Scribble variant="compass" className="left-[6%] bottom-4 h-11 w-11 opacity-40" tone="gold" />
          <SectionHeading
            eyebrow="Nilai kami"
            title="Kenapa memilih kami"
            description="Empat hal yang menjadi pegangan kami dalam melayani setiap pelanggan."
          />
          <ul className="relative mt-10 grid gap-5 sm:grid-cols-2">
            {VALUES.map((value) => (
              <li
                key={value.title}
                className={
                  value.tone === "brand"
                    ? "border-t-2 border-brand-500 bg-white p-6"
                    : "border-t-2 border-gold-300 bg-white p-6"
                }
              >
                <h3 className="text-lg font-semibold text-ink-900">{value.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-600">{value.body}</p>
              </li>
            ))}
          </ul>
        </Section>
      </Reveal>

      <Reveal delay={240}>
        <Section className="relative overflow-hidden">
          <SectionHeading
            eyebrow="Jangkauan"
            title="Area layanan kami"
            description="Kami melayani pemasangan dan perawatan di wilayah berikut. Di luar area ini, silakan hubungi kami untuk konfirmasi."
          />
          <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
            {SITE.serviceAreas.map((area) => (
              <li
                key={area}
                className="rounded-[2px] bg-ink-100 px-4 py-2 text-sm font-medium text-ink-700"
              >
                {area}
              </li>
            ))}
          </ul>
        </Section>
      </Reveal>

      <Reveal delay={320}>
        <Section tone="brand" className="relative overflow-hidden">
          <Scribble variant="compass" className="right-10 top-8 h-20 w-20 opacity-55" />
          <Scribble variant="cross" className="left-[8%] bottom-6 h-12 w-12 opacity-45" tone="gold" />
          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl">Mari bicarakan kebutuhan AC Anda</h2>
            <p className="mt-4 text-lg text-ink-300">
              Konsultasi gratis, tanpa kewajiban membeli. Kami bantu tentukan unit
              dan kapasitas yang paling sesuai.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {hasWhatsApp ? (
                <ExternalButtonLink href={generalEnquiry()} variant="invert" size="lg">
                  <WhatsAppIcon className="h-5 w-5" />
                  Chat WhatsApp
                </ExternalButtonLink>
              ) : null}
              <ButtonLink href="/produk" variant="outline-invert" size="lg">
                Lihat katalog produk
              </ButtonLink>
            </div>
          </div>
        </Section>
      </Reveal>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="py-8 text-center">
      <div className="font-display text-3xl font-semibold text-ink-900">{value}</div>
      <div className="mt-1 text-sm text-ink-500">{label}</div>
    </div>
  );
}
