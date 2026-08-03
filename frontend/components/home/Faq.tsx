import { Section, SectionHeading } from "@/components/ui/Container";
import { FaqJsonLd } from "@/components/seo/JsonLd";

/**
 * Questions real customers ask before booking.
 *
 * Built on native <details>, so it expands with no JavaScript at all and is
 * keyboard accessible and screen-reader friendly for free. It is also paired
 * with FAQ structured data, which can surface these answers directly in a
 * search listing.
 */
export const FAQ_ITEMS = [
  {
    question: "Berapa biaya cuci AC?",
    answer:
      "Cuci AC split 0,5 sampai 1 PK mulai dari Rp 65.000 per unit, dan 1,5 sampai 2 PK mulai dari Rp 85.000 per unit. Untuk AC cassette dan floor standing, biayanya berbeda karena pengerjaannya lebih rumit. Daftar harga lengkap tersedia di halaman Layanan.",
  },
  {
    question: "Seberapa sering AC perlu dicuci?",
    answer:
      "Untuk pemakaian rumah tangga normal, setiap 3 bulan sekali sudah cukup. Untuk kantor, restoran, atau ruangan berdebu, sebaiknya setiap 2 bulan. AC yang jarang dicuci akan kehilangan daya dingin dan konsumsi listriknya naik.",
  },
  {
    question: "Berapa PK yang cocok untuk ruangan saya?",
    answer:
      "Sebagai patokan, 0,5 PK untuk ruangan 8 sampai 12 m², 1 PK untuk 14 sampai 18 m², 1,5 PK untuk 18 sampai 24 m², dan 2 PK untuk 24 sampai 32 m². Ruangan yang terkena sinar matahari langsung atau berpenghuni banyak biasanya perlu satu tingkat lebih besar. Kirimkan ukuran ruangan Anda dan kami bantu hitungkan.",
  },
  {
    question: "Apa bedanya AC inverter dan non-inverter?",
    answer:
      "AC inverter mengatur kecepatan kompresor sesuai kebutuhan, sehingga lebih hemat listrik untuk pemakaian panjang, di atas 8 jam per hari. AC non-inverter harganya lebih murah dan cocok untuk pemakaian singkat atau ruangan yang jarang dipakai.",
  },
  {
    question: "Apakah harga sudah termasuk pemasangan?",
    answer:
      "Harga produk di katalog adalah harga unit saja, belum termasuk pemasangan. Biaya instalasi mulai dari Rp 350.000 per unit untuk AC split 0,5 sampai 1 PK, sudah termasuk pipa 3 meter. Kami akan sampaikan total biaya sebelum pengerjaan dimulai.",
  },
  {
    question: "Apakah ada garansi?",
    answer:
      "Unit yang kami jual bergaransi resmi dari pabrikan. Untuk jasa, kami memberikan garansi pengerjaan 30 hari untuk perbaikan dan 90 hari untuk pemasangan baru.",
  },
  {
    question: "Berapa lama proses pemasangan AC baru?",
    answer:
      "Pemasangan satu unit AC split umumnya selesai dalam 2 sampai 3 jam, tergantung kondisi lokasi dan panjang jalur pipa. Kami akan konfirmasi estimasi waktunya saat survei atau saat pemesanan.",
  },
  {
    question: "Bagaimana cara memesan?",
    answer:
      "Cara tercepat adalah mengirim pesan melalui WhatsApp. Anda juga bisa menelepon kantor kami atau mengisi form di halaman Kontak, dan tim kami akan menghubungi kembali pada jam kerja.",
  },
];

export function Faq() {
  return (
    <>
      <FaqJsonLd items={FAQ_ITEMS} />
      <Section tone="muted" id="faq">
        <SectionHeading
          eyebrow="FAQ"
          title="Pertanyaan yang sering diajukan"
          description="Belum terjawab? Kirim pertanyaan Anda lewat WhatsApp, kami balas pada jam kerja."
        />
        <ul className="mx-auto mt-10 max-w-3xl space-y-3">
          {FAQ_ITEMS.map((item) => (
            <li key={item.question}>
              <details className="group rounded-card border border-ink-200 bg-white [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-ink-900">
                  {item.question}
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5 shrink-0 text-ink-400 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.58l3.3-3.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.42Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </summary>
                <p className="border-t border-ink-200 px-5 py-4 leading-relaxed text-ink-600">
                  {item.answer}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
