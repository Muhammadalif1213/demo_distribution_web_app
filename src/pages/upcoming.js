import { icon } from "../lib/icons.js";
const content = {
  customers: [
    "Tahap 2",
    "Master data customer",
    "Pencarian, tambah, edit, detail customer, dan harga khusus per produk.",
  ],
  products: [
    "Tahap 2",
    "Produk & harga",
    "Harga modal, harga jual default, satuan, dan harga khusus setiap customer.",
  ],
  distribution: [
    "Tahap 3",
    "Distribusi harian",
    "Pencatatan distribusi beberapa produk dengan harga transaksi historis.",
  ],
  returns: [
    "Tahap 3",
    "Retur produk",
    "Retur terkait distribusi asal untuk mengurangi penjualan pada periode yang tepat.",
  ],
  recapitulation: [
    "Tahap 4",
    "Rekapitulasi dua mingguan",
    "Generate dan finalisasi rekap dengan pencegahan transaksi terhitung ganda.",
  ],
  invoices: [
    "Tahap 4",
    "Tagihan & invoice",
    "Pembuatan invoice dari rekap final, preview, dan simulasi WhatsApp.",
  ],
  payments: [
    "Tahap 5",
    "Pembayaran & piutang",
    "Pencatatan pembayaran sebagian dan alokasi ke beberapa invoice.",
  ],
  reports: [
    "Tahap 6",
    "Laporan & analitik",
    "Analisis penjualan, laba kotor, retur, dan piutang per customer.",
  ],
  import: [
    "Tahap 6",
    "Import Excel",
    "Simulasi upload, mapping kolom, validasi, dan preview.",
  ],
  integrations: [
    "Tahap 6",
    "Integrasi",
    "Konfigurasi WhatsApp dan payment gateway dalam mode simulasi.",
  ],
  settings: [
    "Tahap 6",
    "Pengaturan",
    "Profil distributor, rekening, periode rekap, dan pengguna internal.",
  ],
};
export function upcoming(route, info, data) {
  const [step, title, desc] = content[route];
  return `<div class="page-heading"><div><div class="eyebrow">PENGEMBANGAN BERTAHAP</div><h1>${info.label}</h1><p>Fondasi siap. Modul ini akan dilanjutkan pada ${step.toLowerCase()}.</p></div><a class="button secondary" href="#/dashboard">Kembali ke dashboard</a></div><section class="panel upcoming"><div class="upcoming-icon">${icon(info.icon)}</div><span class="badge blue-badge">${step} · Belum diimplementasikan</span><h2>${title}</h2><p>${desc}</p><div class="upcoming-info">${icon("check")} ${data.customers.length} customer, ${data.products.length} produk, dan ${data.distributions.length} distribusi demo sudah tersedia sebagai fondasi data.</div><a href="#/dashboard" class="button primary">Buka dashboard ${icon("chevron")}</a></section><section class="panel roadmap"><h2>Progres prototipe</h2>${["Fondasi aplikasi & dashboard", "Master data customer & produk", "Distribusi & retur produk", "Rekapitulasi & invoice", "Pembayaran sebagian & piutang", "Laporan & modul pendukung"].map((s, i) => `<div class="roadmap-row"><span class="${i < 5 ? "done" : ""}">${i < 5 ? icon("check") : i + 1}</span><strong>${s}</strong><small>${i < 5 ? "Selesai" : "Direncanakan"}</small></div>`).join("")}</section>${route === "settings" ? `<section class="panel reset-panel"><div><h2>Reset data demo</h2><p>Kembalikan data LocalStorage ke seed awal yang deterministik.</p></div><button class="button danger" id="reset-demo">${icon("return")} Reset data demo</button></section>` : ""}`;
}
