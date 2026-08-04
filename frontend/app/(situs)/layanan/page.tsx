import type { Metadata } from "next";
import Link from "next/link";

import { getServices } from "@/lib/api/server";
import { SITE, hasWhatsApp } from "@/lib/site";
import { generalEnquiry } from "@/lib/whatsapp";
import { Container, Section, SectionHeading } from "@/components/ui/Container";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/Button";
import { ServiceDetail } from "@/components/service/ServiceCard";
import { WhatsAppIcon } from "@/components/layout/MobileNav";
import { BreadcrumbJsonLd, ServiceJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Layanan dan Daftar Harga Service AC",
  description:
    "Daftar harga cuci AC, service dan perbaikan, instalasi AC baru, bongkar pasang, " +
    "isi freon, dan kontrak perawatan berkala. Teknisi berpengalaman, harga transparan.",
  alternates: { canonical: "/layanan" },
};

const STEPS = [
  {
    title: "Hubungi kami",
    body: "Kirim pesan lewat WhatsApp atau isi form kontak. Sampaikan jenis layanan, jumlah unit, dan lokasi Anda.",
  },
  {
    title: "Konfirmasi jadwal dan biaya",
    body: "Kami sampaikan estimasi biaya dan jadwal kunjungan. Tidak ada biaya yang muncul di luar kesepakatan.",
  },
  {
    title: "Pengerjaan oleh teknisi",
    body: "Teknisi datang sesuai jadwal, mengerjakan sampai tuntas, dan menguji hasilnya bersama Anda.",
  },
];

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Beranda", href: "/" },
          { name: "Layanan", href: "/layanan" },
        ]}
      />
      {services.map((service) => (
        <ServiceJsonLd key={service.id} service={service} />
      ))}

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
                <li className="font-medium text-ink-700">Layanan</li>
              </ol>
            </nav>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Layanan dan Daftar Harga
            </h1>
            <p className="mt-3 max-w-2xl text-base text-ink-600 sm:text-lg">
              Kami mencantumkan harga secara terbuka supaya Anda bisa
              memperkirakan biaya sebelum menghubungi kami. Harga di bawah adalah
              harga mulai per unit.
            </p>

            {services.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {services.map((service) => (
                  <li key={service.id}>
                    <a
                      href={`#${service.slug}`}
                      className="inline-flex min-h-11 items-center rounded-full border border-ink-300 bg-white px-4 text-sm font-medium text-ink-700 hover:border-brand-400 hover:text-brand-700"
                    >
                      {service.name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </Container>
      </div>

      <Container>
        <div className="space-y-6 py-10 sm:space-y-8">
          {services.length === 0 ? (
            <p className="rounded-card border border-dashed border-ink-300 bg-ink-50 px-6 py-14 text-center text-ink-600">
              Daftar layanan sedang diperbarui. Silakan hubungi kami langsung
              untuk informasi harga.
            </p>
          ) : (
            services.map((service) => (
              <ServiceDetail key={service.id} service={service} />
            ))
          )}
        </div>
      </Container>

      <Section tone="muted" id="cara-pesan">
        <SectionHeading
          eyebrow="Cara pesan"
          title="Tiga langkah, tanpa ribet"
          description="Dari pesan pertama sampai teknisi datang, prosesnya sederhana dan jelas."
        />
        <ol className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-card bg-white p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-base font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="brand">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Butuh penanganan hari ini?
          </h2>
          <p className="mt-4 text-lg text-brand-100">
            Kami melayani {SITE.serviceAreas.slice(0, 4).join(", ")}, dan
            sekitarnya. Hubungi kami untuk ketersediaan jadwal hari ini.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {hasWhatsApp ? (
              <ExternalButtonLink href={generalEnquiry()} variant="whatsapp" size="lg">
                <WhatsAppIcon className="h-5 w-5" />
                Chat WhatsApp
              </ExternalButtonLink>
            ) : null}
            <ButtonLink href="/kontak" variant="outline" size="lg">
              Kirim pesan
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
