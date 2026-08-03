import type { Metadata } from "next";
import Link from "next/link";

import { SITE, formatAddress, hasMaps, hasWhatsApp } from "@/lib/site";
import { generalEnquiry } from "@/lib/whatsapp";
import { Container, Section, SectionHeading } from "@/components/ui/Container";
import { ExternalButtonLink } from "@/components/ui/Button";
import { ContactForm } from "@/components/contact/ContactForm";
import { WhatsAppIcon } from "@/components/layout/MobileNav";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    `Hubungi ${SITE.legalName} untuk pemesanan produk AC, jadwal service, ` +
    "cuci AC, atau konsultasi kebutuhan pendingin ruangan.",
  alternates: { canonical: "/kontak" },
};

export default function ContactPage() {
  const telHref = `tel:${SITE.phone.replace(/[^\d+]/g, "")}`;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Beranda", href: "/" },
          { name: "Kontak", href: "/kontak" },
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
                <li className="font-medium text-ink-700">Kontak</li>
              </ol>
            </nav>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Hubungi Kami
            </h1>
            <p className="mt-3 max-w-2xl text-base text-ink-600 sm:text-lg">
              Untuk respons paling cepat, hubungi kami melalui WhatsApp. Anda
              juga bisa menelepon, mengirim email, atau mengisi form di bawah.
            </p>
          </div>
        </Container>
      </div>

      <Container>
        <div className="grid gap-10 py-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="text-xl font-bold text-ink-900">Informasi kontak</h2>

            <ul className="mt-6 space-y-5">
              {hasWhatsApp ? (
                <ContactRow
                  icon={<WhatsAppIcon className="h-5 w-5" />}
                  label="WhatsApp"
                  tone="whatsapp"
                >
                  <a
                    href={generalEnquiry()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-ink-900 hover:text-brand-700"
                  >
                    +{SITE.whatsapp}
                  </a>
                  <span className="mt-0.5 block text-sm text-ink-500">
                    Cara tercepat menghubungi kami
                  </span>
                </ContactRow>
              ) : null}

              <ContactRow icon={<PhoneIcon className="h-5 w-5" />} label="Telepon">
                <a href={telHref} className="font-medium text-ink-900 hover:text-brand-700">
                  {SITE.phone}
                </a>
              </ContactRow>

              <ContactRow icon={<MailIcon className="h-5 w-5" />} label="Email">
                <a
                  href={`mailto:${SITE.email}`}
                  className="break-all font-medium text-ink-900 hover:text-brand-700"
                >
                  {SITE.email}
                </a>
              </ContactRow>

              <ContactRow icon={<PinIcon className="h-5 w-5" />} label="Alamat">
                <address className="not-italic font-medium leading-relaxed text-ink-900">
                  {formatAddress()}
                </address>
                {SITE.mapsUrl ? (
                  <a
                    href={SITE.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex min-h-9 items-center text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    Lihat di Google Maps
                  </a>
                ) : null}
              </ContactRow>

              <ContactRow icon={<ClockIcon className="h-5 w-5" />} label="Jam operasional">
                <ul className="space-y-1">
                  {SITE.hours.map((h) => (
                    <li key={h.days} className="flex justify-between gap-6 text-sm">
                      <span className="text-ink-700">{h.days}</span>
                      <span className="font-medium text-ink-900">
                        {h.open && h.close ? `${h.open} - ${h.close}` : "Tutup"}
                      </span>
                    </li>
                  ))}
                </ul>
              </ContactRow>
            </ul>

            {hasWhatsApp ? (
              <ExternalButtonLink
                href={generalEnquiry()}
                variant="whatsapp"
                size="lg"
                fullWidth
                className="mt-8"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Chat via WhatsApp
              </ExternalButtonLink>
            ) : null}
          </div>

          <div className="rounded-card border border-ink-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold text-ink-900">Kirim pesan</h2>
            <p className="mt-2 text-sm text-ink-600">
              Isi form berikut dan tim kami akan menghubungi Anda kembali pada
              jam kerja.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </Container>

      {hasMaps ? (
        <section aria-labelledby="lokasi" className="border-t border-ink-200">
          <h2 id="lokasi" className="sr-only">
            Lokasi kami
          </h2>
          <iframe
            src={SITE.mapsEmbedUrl}
            title={`Peta lokasi ${SITE.legalName}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[24rem] w-full border-0"
          />
        </section>
      ) : null}

      <Section tone="muted">
        <SectionHeading
          eyebrow="Jangkauan"
          title="Area yang kami layani"
          description="Berada di luar daftar ini? Hubungi kami, sebagian area sekitarnya tetap dapat kami layani."
        />
        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
          {SITE.serviceAreas.map((area) => (
            <li
              key={area}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-700"
            >
              {area}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

function ContactRow({
  icon,
  label,
  children,
  tone = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  tone?: "brand" | "whatsapp";
}) {
  return (
    <li className="flex gap-4">
      <span
        className={
          tone === "whatsapp"
            ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-whatsapp/10 text-whatsapp-dark"
            : "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"
        }
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm text-ink-500">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </li>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
