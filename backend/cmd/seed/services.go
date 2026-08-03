package main

import "github.com/LeonArif/Abtekindo/backend/internal/store"

// seedService pairs a service with its published rate table. The rates are
// what make the services page useful: a visitor who can see a starting price
// is far likelier to make contact than one who has to ask for every number.
type seedService struct {
	Service store.CreateServiceParams
	Rates   []store.AddServiceRateParams
}

// seedServices is the starting service catalogue.
//
// TODO(abtekindo): Every price below is a realistic placeholder for the
// Jabodetabek market, not a confirmed rate card. Confirm with the owner before
// launch, then maintain these through the admin CMS.
var seedServices = []seedService{
	{
		Service: store.CreateServiceParams{
			Slug:        "cuci-ac",
			Name:        "Cuci AC",
			Summary:     "Pembersihan menyeluruh unit indoor dan outdoor agar dingin kembali maksimal dan tagihan listrik turun.",
			Description: "AC yang jarang dicuci akan kehilangan daya dingin dan menaikkan konsumsi listrik. Kami membersihkan evaporator, blower, filter, dan unit outdoor menggunakan mesin steam bertekanan, lalu memeriksa tekanan freon dan arus kompresor sebagai bagian dari layanan.",
			Bullets: []string{
				"Pencucian dengan mesin steam bertekanan",
				"Pembersihan unit indoor dan outdoor",
				"Pemeriksaan tekanan freon dan arus listrik",
				"Area kerja ditutup terpal, ruangan tetap bersih",
				"Disarankan setiap 3 bulan untuk pemakaian harian",
			},
			Icon:      "sparkles",
			SortOrder: 1,
		},
		Rates: []store.AddServiceRateParams{
			{Label: "AC Split 0,5 - 1 PK", Unit: "unit", PriceFrom: 65_000, SortOrder: 1},
			{Label: "AC Split 1,5 - 2 PK", Unit: "unit", PriceFrom: 85_000, SortOrder: 2},
			{Label: "AC Split 2,5 PK ke atas", Unit: "unit", PriceFrom: 120_000, SortOrder: 3},
			{Label: "AC Cassette", Unit: "unit", PriceFrom: 250_000, SortOrder: 4},
			{Label: "AC Floor Standing", Unit: "unit", PriceFrom: 275_000, SortOrder: 5},
		},
	},
	{
		Service: store.CreateServiceParams{
			Slug:        "service-perbaikan",
			Name:        "Service dan Perbaikan",
			Summary:     "Diagnosa dan perbaikan AC yang tidak dingin, bocor, berisik, atau mati total.",
			Description: "Teknisi kami memeriksa penyebab kerusakan terlebih dahulu dan menyampaikan estimasi biaya sebelum pekerjaan dimulai. Tidak ada biaya tambahan yang muncul di luar kesepakatan awal.",
			Bullets: []string{
				"Estimasi biaya disampaikan sebelum pengerjaan",
				"Penggantian sparepart bergaransi",
				"Penanganan kebocoran freon sampai ke titik bocor",
				"Perbaikan modul PCB dan kelistrikan",
				"Garansi pengerjaan 30 hari",
			},
			Icon:      "wrench",
			SortOrder: 2,
		},
		Rates: []store.AddServiceRateParams{
			{Label: "Pemeriksaan dan diagnosa", Unit: "kunjungan", PriceFrom: 75_000, Note: "Gratis apabila dilanjutkan ke perbaikan", SortOrder: 1},
			{Label: "Penggantian kapasitor", Unit: "unit", PriceFrom: 175_000, SortOrder: 2},
			{Label: "Perbaikan kebocoran freon", Unit: "titik", PriceFrom: 350_000, Note: "Sudah termasuk pengisian ulang freon", SortOrder: 3},
			{Label: "Penggantian modul PCB", Unit: "unit", PriceFrom: 650_000, Note: "Harga menyesuaikan merek dan tipe", SortOrder: 4},
			{Label: "Penggantian kompresor", Unit: "unit", PriceFrom: 1_500_000, Note: "Harga menyesuaikan kapasitas", SortOrder: 5},
		},
	},
	{
		Service: store.CreateServiceParams{
			Slug:        "instalasi-ac-baru",
			Name:        "Instalasi AC Baru",
			Summary:     "Pemasangan AC baru lengkap dengan pipa, bracket, dan pengujian sampai unit berjalan normal.",
			Description: "Instalasi yang keliru adalah penyebab paling umum AC cepat rusak dan boros listrik. Kami memasang sesuai standar pabrikan, melakukan vakum pipa sebelum pengisian, dan menguji tekanan serta suhu keluaran sebelum meninggalkan lokasi.",
			Bullets: []string{
				"Termasuk pipa tembaga 3 meter dan bracket",
				"Proses vakum pipa sesuai standar pabrikan",
				"Pengujian tekanan dan suhu keluaran",
				"Perapian jalur pipa dan kabel",
				"Garansi pemasangan 90 hari",
			},
			Icon:      "plug",
			SortOrder: 3,
		},
		Rates: []store.AddServiceRateParams{
			{Label: "AC Split 0,5 - 1 PK", Unit: "unit", PriceFrom: 350_000, Note: "Termasuk pipa 3 meter", SortOrder: 1},
			{Label: "AC Split 1,5 - 2 PK", Unit: "unit", PriceFrom: 450_000, Note: "Termasuk pipa 3 meter", SortOrder: 2},
			{Label: "AC Floor Standing", Unit: "unit", PriceFrom: 1_000_000, SortOrder: 3},
			{Label: "AC Cassette", Unit: "unit", PriceFrom: 1_200_000, Note: "Belum termasuk pekerjaan plafon", SortOrder: 4},
			{Label: "Tambahan pipa", Unit: "meter", PriceFrom: 110_000, SortOrder: 5},
		},
	},
	{
		Service: store.CreateServiceParams{
			Slug:        "bongkar-pasang",
			Name:        "Bongkar Pasang AC",
			Summary:     "Pemindahan AC ke lokasi baru, termasuk pengamanan freon agar tidak terbuang.",
			Description: "Kami melakukan pump down terlebih dahulu supaya freon tersimpan di unit outdoor dan tidak perlu diisi ulang sepenuhnya di lokasi baru. Cara ini menghemat biaya pemindahan secara signifikan.",
			Bullets: []string{
				"Pump down agar freon tidak terbuang",
				"Pembongkaran rapi tanpa merusak dinding",
				"Pemasangan kembali di lokasi baru",
				"Pengujian ulang setelah terpasang",
				"Bisa dijadwalkan di hari yang sama",
			},
			Icon:      "truck",
			SortOrder: 4,
		},
		Rates: []store.AddServiceRateParams{
			{Label: "AC Split 0,5 - 1 PK", Unit: "unit", PriceFrom: 400_000, SortOrder: 1},
			{Label: "AC Split 1,5 - 2 PK", Unit: "unit", PriceFrom: 500_000, SortOrder: 2},
			{Label: "AC Cassette", Unit: "unit", PriceFrom: 1_500_000, SortOrder: 3},
			{Label: "Tambahan pipa", Unit: "meter", PriceFrom: 110_000, SortOrder: 4},
		},
	},
	{
		Service: store.CreateServiceParams{
			Slug:        "isi-freon",
			Name:        "Isi Freon",
			Summary:     "Pengisian ulang freon R32 dan R410A disertai pemeriksaan kebocoran terlebih dahulu.",
			Description: "Freon tidak habis dengan sendirinya. Bila AC kekurangan freon, hampir selalu ada kebocoran. Kami memeriksa dan menambal titik bocor lebih dahulu agar pengisian ulang tidak terbuang percuma dalam hitungan minggu.",
			Bullets: []string{
				"Pemeriksaan kebocoran sebelum pengisian",
				"Tersedia freon R32 dan R410A",
				"Pengukuran tekanan sesuai spesifikasi pabrikan",
				"Pengecekan arus kompresor setelah pengisian",
			},
			Icon:      "gauge",
			SortOrder: 5,
		},
		Rates: []store.AddServiceRateParams{
			{Label: "Freon R32, 0,5 - 1 PK", Unit: "unit", PriceFrom: 250_000, SortOrder: 1},
			{Label: "Freon R32, 1,5 - 2 PK", Unit: "unit", PriceFrom: 350_000, SortOrder: 2},
			{Label: "Freon R410A, 0,5 - 1 PK", Unit: "unit", PriceFrom: 275_000, SortOrder: 3},
			{Label: "Freon R410A, 1,5 - 2 PK", Unit: "unit", PriceFrom: 400_000, SortOrder: 4},
		},
	},
	{
		Service: store.CreateServiceParams{
			Slug:        "kontrak-perawatan",
			Name:        "Kontrak Perawatan Berkala",
			Summary:     "Jadwal perawatan rutin untuk kantor, ruko, dan rumah dengan banyak unit AC.",
			Description: "Dengan kontrak berkala, jadwal perawatan kami yang mengingatkan, bukan Anda. Biaya per unit lebih murah dibanding memesan satu per satu, dan unit yang terawat jarang berujung pada perbaikan besar.",
			Bullets: []string{
				"Penjadwalan otomatis, tanpa perlu diingat",
				"Biaya per unit lebih hemat",
				"Prioritas penanganan bila terjadi kerusakan",
				"Laporan kondisi setiap unit",
				"Cocok untuk kantor, ruko, kos, dan restoran",
			},
			Icon:      "calendar",
			SortOrder: 6,
		},
		Rates: []store.AddServiceRateParams{
			{Label: "Kontrak 3 bulan", Unit: "unit", PriceFrom: 180_000, Note: "1 kali kunjungan perawatan", SortOrder: 1},
			{Label: "Kontrak 6 bulan", Unit: "unit", PriceFrom: 330_000, Note: "2 kali kunjungan perawatan", SortOrder: 2},
			{Label: "Kontrak 12 bulan", Unit: "unit", PriceFrom: 600_000, Note: "4 kali kunjungan perawatan", SortOrder: 3},
		},
	},
}
