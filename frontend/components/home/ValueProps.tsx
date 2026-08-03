import { Container } from "@/components/ui/Container";

const PROPS = [
  {
    title: "Harga transparan",
    body: "Daftar harga layanan tercantum di website, bukan rahasia.",
  },
  {
    title: "Teknisi berpengalaman",
    body: "Dikerjakan sesuai standar pabrikan, bukan asal cepat.",
  },
  {
    title: "Produk resmi bergaransi",
    body: "Unit resmi dengan garansi pabrikan yang berlaku.",
  },
  {
    title: "Respons cepat",
    body: "Balasan WhatsApp pada jam kerja, jadwal fleksibel.",
  },
];

/**
 * Trust strip directly under the hero.
 *
 * Placed here because the four objections it answers, price, competence,
 * authenticity and responsiveness, are exactly what a visitor weighs in the
 * first few seconds before deciding whether to keep reading.
 */
export function ValueProps() {
  return (
    <div className="border-b border-ink-200 bg-white">
      <Container>
        <ul className="grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {PROPS.map((item) => (
            <li key={item.title} className="flex gap-3">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"
                aria-hidden="true"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink-900">{item.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
