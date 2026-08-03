import type { Metadata } from "next";
import Link from "next/link";

import { SITE, hasWhatsApp } from "@/lib/site";
import { generalEnquiry } from "@/lib/whatsapp";
import { Container, Section, SectionHeading } from "@/components/ui/Container";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/Button";
import { Placeholder } from "@/components/ui/Placeholder";
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
  },
  {
    title: "Teknisi berpengalaman",
    body: "Pemasangan yang keliru adalah penyebab paling umum AC cepat rusak dan boros listrik. Teknisi kami bekerja sesuai standar pabrikan.",
  },
  {
    title: "Produk resmi bergaransi",
    body: `Kami menyediakan unit resmi dari ${SITE.brands.map((b) => b.name).join(", ")} lengkap dengan garansi pabrikan.`,
  },
  {
    title: "Layanan purna jual",
    body: "Hubungan kami tidak berhenti setelah unit terpasang. Perawatan berkala dan perbaikan tetap kami layani.",
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

      <div className="border-b border-ink-200 bg-ink-50">
        <Container>
          <div className="py-10 sm:py-14">
            <nav aria-label="Remah roti" className="text-sm text-ink-500">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-brand-600">
                    Beranda
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="font-medium text-ink-700">Tentang Kami</li>
              </ol>
            </nav>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Tentang {SITE.legalName}
            </h1>
          </div>
        </Container>
      </div>

      <Container>
        <div className="grid gap-10 py-12 lg:grid-cols-2 lg:items-center lg:gap-16">
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

            <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-ink-500">Berdiri sejak</dt>
                <dd className="mt-1 text-2xl font-bold text-ink-900">
                  {SITE.foundedYear}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink-500">Pengalaman</dt>
                <dd className="mt-1 text-2xl font-bold text-ink-900">
                  {yearsActive}+ tahun
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink-500">Merek resmi</dt>
                <dd className="mt-1 text-2xl font-bold text-ink-900">
                  {SITE.brands.length}
                </dd>
              </div>
            </dl>
          </div>

          <Placeholder
            label="Foto tim atau showroom Abtekindo"
            aspect="aspect-[4/3]"
            className="rounded-card border border-ink-200"
          />
        </div>
      </Container>

      <Section tone="muted">
        <SectionHeading
          eyebrow="Nilai kami"
          title="Kenapa memilih kami"
          description="Empat hal yang menjadi pegangan kami dalam melayani setiap pelanggan."
        />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {VALUES.map((value) => (
            <li key={value.title} className="rounded-card bg-white p-6">
              <h3 className="text-lg font-semibold text-ink-900">{value.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-600">{value.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Jangkauan"
          title="Area layanan kami"
          description="Kami melayani pemasangan dan perawatan di wilayah berikut. Di luar area ini, silakan hubungi kami untuk konfirmasi."
        />
        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
          {SITE.serviceAreas.map((area) => (
            <li
              key={area}
              className="rounded-full bg-ink-100 px-4 py-2 text-sm font-medium text-ink-700"
            >
              {area}
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="brand">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Mari bicarakan kebutuhan AC Anda
          </h2>
          <p className="mt-4 text-lg text-brand-100">
            Konsultasi gratis, tanpa kewajiban membeli. Kami bantu tentukan unit
            dan kapasitas yang paling sesuai.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {hasWhatsApp ? (
              <ExternalButtonLink href={generalEnquiry()} variant="whatsapp" size="lg">
                <WhatsAppIcon className="h-5 w-5" />
                Chat WhatsApp
              </ExternalButtonLink>
            ) : null}
            <ButtonLink href="/produk" variant="outline" size="lg">
              Lihat katalog produk
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
