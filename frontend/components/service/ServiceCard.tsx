import type { Service } from "@/lib/api/types";
import { formatRupiah } from "@/lib/format";
import { hasWhatsApp } from "@/lib/site";
import { serviceEnquiry, serviceRateEnquiry } from "@/lib/whatsapp";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/layout/MobileNav";
import { ServiceIcon } from "./ServiceIcon";

/**
 * Full service entry with its published rate table.
 *
 * Publishing rates is the point of this page. Most competitors make customers
 * ask, so showing a starting price per job type is the clearest differentiator
 * available and removes the main reason a visitor leaves without contacting.
 */
export function ServiceDetail({ service }: { service: Service }) {
  const lowest = service.rates.length
    ? Math.min(...service.rates.map((r) => r.priceFrom))
    : null;

  return (
    <article
      id={service.slug}
      className="scroll-mt-24 overflow-hidden rounded-card border border-ink-200 bg-white"
    >
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        <div>
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <ServiceIcon name={service.icon} className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">
                {service.name}
              </h2>
              {lowest !== null ? (
                <p className="mt-1 text-sm text-ink-600">
                  Mulai dari{" "}
                  <span className="font-semibold text-ink-900">
                    {formatRupiah(lowest)}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          {service.summary ? (
            <p className="mt-4 leading-relaxed text-ink-600">{service.summary}</p>
          ) : null}

          {service.description ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              {service.description}
            </p>
          ) : null}

          {service.bullets.length > 0 ? (
            <ul className="mt-5 space-y-2">
              {service.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {hasWhatsApp ? (
              <ExternalButtonLink
                href={serviceEnquiry(service.name)}
                variant="whatsapp"
                fullWidth
              >
                <WhatsAppIcon className="h-5 w-5" />
                Pesan sekarang
              </ExternalButtonLink>
            ) : (
              <ButtonLink href="/kontak" fullWidth>
                Pesan sekarang
              </ButtonLink>
            )}
          </div>
        </div>

        {service.rates.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
              Daftar harga
            </h3>
            <div className="scroll-x mt-3 rounded-xl border border-ink-200">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Daftar harga {service.name}</caption>
                <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Layanan
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Mulai dari
                    </th>
                    {hasWhatsApp ? <th scope="col" className="sr-only">Aksi</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {service.rates.map((rate) => (
                    <tr key={rate.label}>
                      <th scope="row" className="px-4 py-3 font-normal text-ink-800">
                        {rate.label}
                        {rate.note ? (
                          <span className="mt-0.5 block text-xs text-ink-500">
                            {rate.note}
                          </span>
                        ) : null}
                      </th>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-ink-900">
                        {formatRupiah(rate.priceFrom)}
                        <span className="block text-xs font-normal text-ink-500">
                          / {rate.unit}
                        </span>
                      </td>
                      {hasWhatsApp ? (
                        <td className="whitespace-nowrap py-3 pr-4">
                          <a
                            href={serviceRateEnquiry(service.name, rate.label)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-brand-600 hover:bg-brand-50"
                          >
                            Pesan
                          </a>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink-500">
              Harga dapat berubah sesuai kondisi unit dan lokasi. Konfirmasi
              akhir diberikan sebelum pengerjaan dimulai.
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

/** Compact service card for the homepage. */
export function ServiceSummaryCard({ service }: { service: Service }) {
  const lowest = service.rates.length
    ? Math.min(...service.rates.map((r) => r.priceFrom))
    : null;

  return (
    <a
      href={`/layanan#${service.slug}`}
      className="group flex h-full flex-col rounded-card border border-ink-200 bg-white p-6 transition-shadow hover:shadow-lg"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <ServiceIcon name={service.icon} className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-ink-900 group-hover:text-brand-700">
        {service.name}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">
        {service.summary}
      </p>
      {lowest !== null ? (
        <p className="mt-4 text-sm text-ink-500">
          Mulai dari{" "}
          <span className="font-semibold text-ink-900">{formatRupiah(lowest)}</span>
        </p>
      ) : null}
    </a>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
