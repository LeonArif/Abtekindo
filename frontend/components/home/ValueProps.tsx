import { Container } from "@/components/ui/Container";
import { Scribble } from "@/components/ui/Scribble";

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
 * first few seconds before deciding whether to keep reading. Set as a
 * hairline-divided editorial strip rather than icon cards, so it reads as a
 * quiet fact list instead of another row of decoration.
 */
export function ValueProps() {
  return (
    <div className="relative overflow-hidden border-y border-ink-200 bg-white">
      <Scribble variant="cross" className="right-1 top-2 h-7 w-7 opacity-30" />
      <Scribble variant="compass" className="left-1 bottom-2 h-8 w-8 opacity-25" tone="gold" />
      <Container>
        <ul className="grid grid-cols-1 divide-y divide-ink-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {PROPS.map((item) => (
            <li key={item.title} className="py-6 sm:px-8 sm:py-8">
              <h2 className="text-sm font-semibold text-ink-900">{item.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{item.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
