# Distributor Management System (DMS)

Prototipe lokal berbahasa Indonesia untuk distributor mie dan pangsit. Implementasi saat ini adalah **Step 1–6: seluruh modul prototipe, dengan import dan integrasi dalam mode simulasi**. HTML5, CSS3, dan JavaScript ES Modules, tanpa framework, backend, atau dependency runtime.

## Menjalankan

Dari direktori proyek:

```bash
npm run dev
```

Buka http://127.0.0.1:5173. Dibutuhkan Python 3; npm hanya sebagai shortcut. Alternatif tanpa npm:

```bash
python3 -m http.server 5173 --bind 127.0.0.1
```

Jangan membuka `index.html` langsung melalui `file://` karena aplikasi menggunakan ES Modules. Tidak diperlukan `npm install`.

## Fitur yang tersedia (Step 1–6)

- Design system responsif, sidebar, topbar, navigasi hash, dan fallback halaman tidak ditemukan.
- Dashboard dengan enam KPI, grafik SVG penjualan/laba dan pembayaran, komposisi nilai produk, invoice belum lunas, aktivitas distribusi, dan stok asumsi.
- Filter periode/customer, pergantian metrik grafik, pencarian/filter status/paginasi invoice, preview invoice di dialog, notifikasi demo, dan ekspor ringkasan CSV.
- Semua menu navigasi memiliki modul interaktif, termasuk inventori, laporan, import simulasi, integrasi simulasi, dan pengaturan. Tombol Catat distribusi mengarah ke modul distribusi dengan input multiitem.
- Seed deterministik: 8 customer, 2 produk, 40 distribusi, 6 retur, 16 rekap final dan invoice dengan tiga status pembayaran.
- LocalStorage `dms-prototype-v1`, pemulihan seed bila JSON tidak valid, dan peringatan bila penyimpanan browser gagal.
- Reset data melalui **Pengaturan → Reset data demo**, dengan konfirmasi.

Inventori dan laporan memakai data transaksi. Pembacaan isi file Excel/CSV dan integrasi API nyata **tidak diimplementasikan**; kedua alurnya ditandai sebagai simulasi. Backend, database, autentikasi, dan sinkronisasi antarperangkat tetap di luar lingkup prototipe.

## Struktur

```text
index.html                 Shell dokumen
src/app.js                 Bootstrap, router, event, dialog, ekspor
src/styles.css             Token desain, komponen, responsivitas
src/components/shell.js    Sidebar, topbar, daftar route
src/pages/dashboard.js     UI dashboard dan state filter
src/pages/master.js        Customer, produk, form harga, dan detail
src/lib/master-data.js     Validasi dan mutasi master tanpa mengubah histori
src/pages/operations.js    UI distribusi, retur, filter, dan detail
src/lib/operations.js      Validasi transaksi dan penyesuaian retur
src/pages/billing.js       UI rekap, invoice, dan simulasi WhatsApp
src/lib/billing.js         Generate, finalisasi, dan penerbitan invoice
src/pages/payments.js      Form, konfirmasi, riwayat pembayaran dan piutang
src/lib/payments.js        Validasi alokasi, pembayaran dan alokasi otomatis
src/pages/inventory.js     Stok dan pencatatan barang masuk
src/pages/reports.js       Laporan, grafik, filter, dan ekspor CSV
src/pages/import.js        Upload metadata, mapping, validasi contoh, simulasi
src/pages/configuration.js Pengaturan dan integrasi simulasi
src/pages/supplemental.js  Router modul Step 6
src/lib/inventory.js       Perhitungan stok dan mutasi
src/lib/reports.js         Agregasi laporan dan CSV
src/lib/settings.js        Validasi pengaturan dan integrasi
src/lib/import-simulation.js Validasi data contoh tanpa impor transaksi
src/lib/support-state.js   Inisialisasi/migrasi additive Step 6
src/lib/dates.js           Tanggal Jakarta dan saran periode
src/data/seed.js           Seed deterministik
src/lib/calculations.js    Perhitungan murni, terpisah dari UI
src/lib/store.js           LocalStorage dan reset
src/lib/format.js          Rupiah, tanggal Indonesia, escaping
src/lib/icons.js           Ikon SVG lokal
tests/calculations.test.js Pengujian aturan data finansial
tests/master-data.test.js  Validasi master, harga, arsip, dan histori
```

## Aturan dan asumsi prototipe

1. Tanggal acuan demo tetap **9 November 2026**. Data berada pada 12 Oktober–8 November 2026. Dua periode masing-masing 14 hari. Bantuan menyebut periode seed. Notifikasi dan aktivitas baru menggunakan tanggal Asia/Jakarta saat aplikasi dijalankan.
2. Nilai uang berupa bilangan bulat Rupiah. Harga jual dan modal disalin ke item transaksi sehingga perubahan master tidak mengubah histori.
3. Retur terhubung ke distribusi asal dan mengurangi periode asal, terlepas dari tanggal retur. Nilai retur memakai harga transaksi asal. Diasumsikan barang retur rusak dan biaya barang retur dikembalikan pada kalkulasi estimasi laba; kebijakan biaya aktual perlu divalidasi sebelum tahap berikutnya.
4. Neto = bruto − nilai retur. Estimasi laba = neto − modal bersih setelah penyesuaian retur. Belum mencakup pajak, ongkos kirim, biaya operasional, atau diskon.
5. Invoice seed berasal dari rekap final. Distribusi hanya termasuk satu rekap final. Invoice tidak ditambahkan sebagai penjualan baru.
6. Pembayaran periode dihitung berdasarkan tanggal pembayaran. Piutang outstanding adalah **seluruh periode** untuk customer terpilih, dihitung sekali sebagai total sisa per invoice. KPI lain mengikuti periode yang dipilih. Pembayaran manual dapat dialokasikan ke beberapa invoice melalui UI Step 5.
7. Stok 240 kg mie dan 180 pak kulit pangsit menjadi baseline saat aktivasi Step 6. Barang masuk/distribusi selanjutnya mengubah stok melalui ledger; retur rusak tidak menambah stok jual. Produk memiliki satuan berbeda sehingga kuantitas tidak dijumlahkan lintas produk. Donut menunjukkan komposisi **nilai bruto**, bukan jumlah fisik.
8. Akses pengguna sama; autentikasi belum ada. Tidak ada API eksternal, pengiriman WhatsApp, atau pemrosesan pembayaran. Google Fonts bersifat opsional, dengan fallback font sistem.
9. LocalStorage terikat origin/browser. Tidak ada sinkronisasi antarperangkat. Reset mengganti semua data demo; belum ada penghapusan transaksi finansial individual.

## Validasi

Node.js 18+:

```bash
npm test
```

Menguji determinisme seed, nilai Rupiah bulat, retur periode asal, alokasi pembayaran lintas invoice, konsistensi rekap/invoice, harga historis, dan filter/agregasi grafik.

Pemeriksaan UI: buka seluruh menu, ubah filter periode/customer, ganti grafik, cari invoice, filter status, pindah halaman tabel, buka detail, ekspor CSV, refresh untuk memastikan data tetap ada, dan reset lewat Pengaturan. Uji lebar desktop dan ponsel; navigasi ponsel melalui tombol menu kiri atas.


## Step 2: master data

- **Customer:** cari berdasarkan usaha, ID, kontak, atau wilayah; tambah/edit nama usaha, nama kontak, wilayah, telepon, dan alamat. Detail berisi tab informasi, harga, distribusi, dan invoice dengan sisa piutang. Nomor telepon dan alamat opsional sehingga data lama tetap kompatibel.
- **Produk & Harga:** katalog dengan tambah/edit nama produk, satuan, harga modal, dan harga jual default. Produk baru memiliki stok nol; stok dapat ditambahkan melalui modul Inventori.
- **Harga khusus:** melalui tombol Harga pada customer atau tab Harga per customer. Kosong berarti mengikuti default secara dinamis; angka 0 berarti harga khusus nol yang eksplisit. Harga maksimal Rp1 miliar, bilangan bulat tanpa pemisah ribuan. Default boleh lebih rendah dari modal karena kebijakan margin belum ditentukan.
- **Arsip:** pengganti penghapusan master. Dialog konfirmasi tersedia, data arsip bisa diaktifkan kembali melalui filter Diarsipkan. Tidak ada penghapusan transaksi, invoice, atau piutang. Pilihan distribusi baru dibatasi ke master aktif.
- Satuan produk dengan transaksi historis dikunci. Membutuhkan satuan berbeda berarti membuat produk baru. Harga dan modal pada item distribusi tetap berupa snapshot. Mengubah nama/kontak master memperbarui tampilan identitas; nilai uang histori tidak berubah.
- Format LocalStorage tetap versi 1 dan kompatibel dengan Step 1. Perubahan disimpan saat tombol Simpan ditekan, bukan setiap ketikan. Jika penyimpanan gagal, toast menyatakan bahwa perubahan hanya ada dalam sesi.
- Reset demo tetap mengembalikan seed asli (8 customer, 2 produk). Tidak ada perubahan data pengguna yang dilakukan otomatis saat pembaruan Step 2.

Verifikasi tambahan: tambah customer, ubah harga khusus, kosongkan harga untuk kembali ke default, tambah/edit produk, cari/filter data, arsipkan dan aktifkan kembali, lalu refresh. Dashboard harus tetap menunjukkan angka historis yang sama setelah harga master berubah.


## Step 3: distribusi harian & retur

### Alur

1. Buka **Pencatatan Distribusi → Catat distribusi**. Pilih customer aktif terlebih dahulu, lalu pilih Per hari atau Lebih dari 1 hari dan tentukan tanggal/rentangnya. Semua produk aktif langsung tersedia, dengan jumlah awal 0. Harga otomatis memakai harga khusus customer atau default; dapat disesuaikan sebelum disimpan. Perubahan customer mengganti semua harga draft dengan harga customer baru.
2. Pada form pencatatan baru, jumlah bilangan bulat 0–1.000.000; harga 0–Rp1 miliar. Produk berjumlah 0 dilewati; hari tanpa pengiriman tidak membuat transaksi. Produk tidak boleh duplikat pada satu transaksi. Form menampilkan total bruto. Catatan opsional.
3. Simpan transaksi. Harga, modal, nama produk/customer, dan satuan disimpan sebagai snapshot untuk transaksi baru. Histori tidak diedit atau dihapus pada tahap ini. Pengiriman ke periode customer yang sudah final ditolak untuk mencegah transaksi lolos dari invoice periode tersebut.
4. Buka detail distribusi → **Catat retur**, atau buka **Retur Produk → Catat retur**. Pilih distribusi asal, produk, jumlah, tanggal, dan alasan. Retur tidak boleh mendahului tanggal distribusi atau melampaui sisa jumlah setelah seluruh retur sebelumnya.
5. Periksa penjelasan dampak retur, centang konfirmasi, lalu simpan. Harga retur menggunakan harga asal. Detail retur menampilkan perubahan nilai rekap/invoice dan waktu pencatatannya dalam zona Asia/Jakarta.
6. Kedua daftar menyediakan pencarian, filter customer/rentang tanggal, ringkasan nilai sesuai filter, detail transaksi, dan reset filter. Riwayat retur tetap bisa dicatat untuk master yang kini diarsipkan.

### Konsistensi dan asumsi tambahan

- Semua perubahan transaksi bersifat append-only. Tidak ada edit/hapus transaksi finansial; koreksi/pembatalan distribusi memerlukan alur lanjutan yang belum diimplementasikan.
- Retur pada distribusi belum direkap mengurangi penjualan periode asal, tanpa menciptakan invoice atau piutang baru.
- **Asumsi simulasi untuk retur setelah final:** rekap final dan invoice terkait disesuaikan pada periode asal secara atomik. Alokasi pembayaran tidak berubah. Jejak `adjustments` menyimpan ID retur, kredit, waktu, serta nilai sebelum/sesudah untuk setiap rekap/invoice yang berubah. Ini bukan penerbitan credit note legal atau pengiriman ulang invoice.
- Retur ditolak seluruhnya jika tagihan baru lebih kecil dari pembayaran yang sudah dialokasikan. Refund/kredit customer belum didukung. Retur pada invoice lunas karena itu dapat ditolak. Penjelasan ditampilkan dalam form.
- Daftar retur memakai **tanggal retur** untuk filternya, sedangkan KPI penjualan/retur dashboard memakai **tanggal distribusi asal**. Keduanya sengaja berbeda sesuai aturan periode asal.
- Dashboard mempertahankan periode demo dan menambahkan pilihan **14 hari terakhir** berdasarkan tanggal Asia/Jakarta untuk melihat pengiriman baru. Piutang tetap hanya berasal dari invoice; distribusi baru belum menambah piutang sebelum Step 4.
- Sejak Step 6, inventori menggunakan ledger asumsi: distribusi mengurangi stok dan retur rusak dicatat tanpa menambah stok jual. Tidak ada integrasi eksternal atau pengiriman/pembayaran nyata.
- LocalStorage tetap kompatibel versi 1; `adjustments` baru dibuat saat retur pertama dicatat. Data lama tidak direset otomatis.

Pengujian `tests/operations.test.js` mencakup multiitem, harga historis, periode tertutup, master arsip, validasi tanggal/jumlah, retur kumulatif, atribusi periode asal, penyesuaian invoice, dan kegagalan atomik bila membutuhkan refund. Pengujian browser dilakukan pada origin demo terpisah dari preview utama.


## Step 4: rekapitulasi & invoice

### Alur penggunaan

1. Catat distribusi pada periode yang belum final (seed sudah memiliki rekap/invoice untuk 12 Oktober–8 November 2026). Contoh: distribusi customer pada 9 November 2026.
2. **Rekapitulasi → Generate rekap**. Pilih customer dan tanggal awal. Tanggal akhir otomatis awal + 13 hari, sehingga rentang inklusif tepat 14 hari. Contoh 9–22 November 2026.
3. Periksa detail: distribusi harian, kuantitas per produk/satuan, bruto, retur periode asal, serta neto. Generate ulang customer/periode yang sama memperbarui draft; tidak membuat salinan baru.
4. **Finalisasi → Ya, finalisasi** mengunci periode dan ID distribusi. Finalisasi ditolak jika transaksi atau retur berubah sejak generate; gunakan Generate ulang. Rekap tidak bisa dibuka kembali pada tahap ini.
5. **Buat invoice** dari detail rekap final, atau melalui **Tagihan & Invoice → Buat invoice**. Hanya rekap final yang belum ditagihkan yang tersedia. Isi tanggal terbit dan jatuh tempo, kemudian terbitkan.
6. Preview menampilkan nomor invoice, snapshot identitas penerbit/customer untuk invoice baru, periode, rincian produk/harga transaksi, retur, total, pembayaran, dan sisa. Preview ini juga dipakai dari dashboard dan detail customer.
7. **Simulasi WhatsApp → Jalankan simulasi** menyimpan log lokal dengan pesan bertanda SIMULASI. Tidak membuka WhatsApp, memanggil API, atau mengirim pesan. Jumlah simulasi tersimpan ditampilkan saat dialog dibuka lagi.
8. Kedua halaman menyediakan pencarian nomor/customer, filter customer/status, dan detail. Pencarian invoice juga mengenali ID rekap.

### Aturan dan asumsi

- Periode 14 hari dapat dimulai pada tanggal pilihan pengguna, belum memakai kalender periode global distributor. Periode final customer yang sama tidak boleh bertumpang tindih, sekalipun ID distribusinya berbeda. Customer arsip tetap tersedia untuk penagihan historis.
- Draft tumpang tindih diperbolehkan sebagai pratinjau; hanya satu yang dapat difinalisasi jika melibatkan distribusi/periode yang sama. Generate pada periode kosong ditolak.
- Finalisasi memeriksa ulang data asal beserta fingerprint draft. Tidak ada invoice atau penambahan penjualan/piutang pada generate/finalisasi.
- **Asumsi simulasi:** finalisasi sebelum akhir periode diperbolehkan setelah konfirmasi. Tanggal terbit invoice harus paling awal tanggal akhir periode. Default tanggal terbit adalah maksimum tanggal hari ini dan akhir periode; jatuh tempo default tujuh hari sesudahnya, dapat diubah. Karena simulasi mendukung invoice bertanggal mendatang, piutang dashboard mencakup semua invoice yang sudah diterbitkan tanpa filter tanggal terbit.
- Satu rekap final hanya boleh memiliki satu invoice. Nomor invoice unik berformat INV/tahun/urutan. Invoice menambah piutang satu kali, tidak menambah penjualan baru. Nilai nol diperbolehkan dan otomatis berstatus lunas.
- Retur setelah final/penerbitan tetap mengikuti aturan Step 3: menyesuaikan rekap dan invoice asal dengan audit. Preview dihitung dari rincian distribusi/retur terkini agar tidak menampilkan rincian lama setelah penyesuaian. Snapshot identitas seed lama memakai fallback master.
- `simulations` berisi log simulasi WhatsApp dan snapshot isi pesan pada saat simulasi. Log lama tidak berubah jika invoice kemudian disesuaikan; pesan baru menggunakan nilai terkini.
- LocalStorage tetap kompatibel versi 1. Data existing tidak direset saat upgrade. Pembayaran manual, pembayaran sebagian, dan alokasi lintas invoice tersedia pada Step 5.

Pengujian `tests/billing.test.js`: periode lintas bulan/tahun, generate idempoten, rekap setelah retur, draft basi, overlap rekap final, larangan transaksi ganda, batas tanggal invoice, invoice ganda, neto/penjualan yang tidak terhitung ulang, penyesuaian retur setelah invoice baru, serta simulasi tanpa mutasi finansial.


## Step 5: pembayaran manual & piutang

### Alur penggunaan

1. **Pembayaran & Piutang** menampilkan ringkasan total tagihan, terbayar, dan sisa piutang seluruh periode. Filter customer memengaruhi ringkasan; pencarian dan status hanya memengaruhi tabel.
2. Tab **Piutang per invoice** menampilkan nilai tagihan, pembayaran teralokasi, sisa, dan status Lunas/Sebagian/Belum dibayar. Tombol **Catat pembayaran** juga tersedia pada preview invoice dari dashboard, detail customer, dan daftar invoice.
3. Form dari invoice mengisi nominal dan alokasi sebesar sisa invoice (maksimum Rp1 miliar per pembayaran). Untuk sebagian, sesuaikan nominal dan alokasi. Form umum dimulai tanpa nominal/alokasi.
4. Pilih customer, tanggal, metode **Transfer bank** atau **Tunai**, nominal, referensi opsional, dan catatan opsional. Semua input Rupiah berupa bilangan bulat, bukan format berseparator ribuan.
5. Isi alokasi pada satu atau beberapa invoice customer yang sama. Nilai kosong/nol berarti tidak dialokasikan. **Alokasi otomatis** memakai invoice dengan jatuh tempo terlama terlebih dahulu, lalu nomor invoice. Pengguna dapat mengubah hasilnya sebelum menyimpan.
6. **Tinjau pembayaran** memvalidasi nominal dan menunjukkan total beserta saldo setiap invoice sebelum/sesudah. **Kembali** mempertahankan semua isian. **Simpan pembayaran** memvalidasi ulang saldo dan mencatat satu pembayaran dengan beberapa alokasi secara atomik.
7. Tab **Riwayat pembayaran** menyediakan pencarian ID/customer/referensi/invoice, detail metode/tanggal, nominal, alokasi, dan waktu pencatatan. Detail menampilkan saldo sebelum/sesudah saat pencatatan beserta sisa invoice terkini. Preview invoice juga menampilkan riwayat alokasi yang khusus untuk invoice tersebut.

### Aturan dan asumsi

- Satu pembayaran hanya untuk **satu customer**, termasuk customer yang kini diarsipkan. Beberapa invoice berbeda milik customer tersebut dapat menerima bagian pembayaran yang sama.
- Nominal pembayaran > 0 dan maksimal Rp1 miliar. Alokasi positif tidak boleh melebihi sisa invoice terkini; total alokasi harus **sama persis** dengan nominal pembayaran. Deposit/kelebihan, kredit customer, refund, pembatalan, edit, dan hapus pembayaran belum didukung.
- Tanggal pembayaran tidak boleh mendahului tanggal terbit invoice tujuan. Tanggal mendatang diperbolehkan untuk simulasi, sesuai dukungan invoice mendatang pada Step 4. Alokasi otomatis tidak mengubah tanggal; jika invoice tujuan belum terbit pada tanggal pilihan, pengguna harus memperbaiki tanggal/alokasi.
- Setiap pembukaan form menghasilkan ID pencatatan unik untuk mencegah penyimpanan form yang sama dua kali. Referensi nonkosong yang sama (tanpa membedakan huruf besar/kecil) ditolak untuk customer/metode yang sama. Referensi opsional; transaksi baru tanpa referensi tidak dianggap duplikat hanya karena nominalnya sama.
- Pembayaran hanya menambah `payments` dengan alokasi dan saldo sebelum/sesudah. Tidak mengubah nilai invoice, distribusi, rekap, maupun penjualan neto. Sisa piutang dihitung dari nilai invoice dikurangi alokasi, bukan dari saldo gabungan penjualan.
- Status invoice dihitung langsung: lunas bila sisa nol, sebagian bila sudah menerima pembayaran dan masih tersisa, belum dibayar bila belum ada alokasi. Tidak boleh terjadi sisa negatif.
- Retur setelah pembayaran tetap mengikuti validasi Step 3: ditolak jika membuat total tagihan di bawah pembayaran teralokasi karena refund belum tersedia.
- Seed pembayaran lama yang belum memiliki metadata customer/metode/referensi tetap kompatibel: customer diturunkan dari invoice alokasinya, sedangkan metadata ditandai Data demo. LocalStorage tetap versi 1, tanpa reset/migrasi destruktif.
- Pembayaran diterima pada dashboard mengikuti **tanggal pembayaran** dan customer terpilih. Piutang mencakup seluruh invoice. Pembayaran tidak memengaruhi KPI penjualan atau laba.
- Ini adalah pencatatan internal simulasi, bukan transaksi keuangan. Tidak ada panggilan bank/payment gateway atau pemindahan uang. Dukungan sinkronisasi lintas tab/perangkat dan konflik bersamaan memerlukan backend pada tahap produksi.

Pengujian `tests/payments.test.js`: pembayaran sebagian dan lunas, beberapa invoice dalam satu pembayaran, keseimbangan alokasi, batas nominal/tanggal/metode, penolakan lintas customer/duplikat/lunas/berlebih, pencegahan pengiriman form berulang, validasi ulang saldo, urutan alokasi otomatis, master arsip, kompatibilitas seed, persistensi serialisasi, dan interaksi retur setelah pelunasan.


## Step 6: modul pendukung lengkap

### Inventori

- Kartu per produk: saldo awal asumsi, barang masuk, distribusi keluar, retur rusak nonjual, dan stok siap jual. Satuan berbeda tidak dijumlahkan.
- **Catat barang masuk** menerima produk aktif, tanggal, jumlah bilangan bulat 1–1.000.000, pemasok, dan catatan. Penerimaan disimpan permanen dalam riwayat prototipe tanpa edit/hapus.
- Riwayat mutasi dapat difilter per produk dan jenis. Retur rusak memiliki efek stok jual nol karena barang sudah keluar pada distribusi asal.
- **Migrasi additive:** saat Step 6 pertama dimuat, saldo awal asumsi = stok master yang tersimpan + jumlah seluruh distribusi produk yang sudah tercatat. Dengan demikian stok saat aktivasi tetap 240/180 atau nilai master lama, dan semua transaksi lama tetap utuh. Saldo pembukaan ditampilkan pada tanggal distribusi pertama sebagai rekonstruksi asumsi, bukan bukti penerimaan nyata. Tanggal aktivasi dicatat pada `inventory.baselineDate`.
- Setelah baseline tersimpan, stok = saldo awal + seluruh penerimaan − seluruh distribusi. Saldo tidak dikalibrasi ulang saat refresh. Produk baru memperoleh baseline nol sampai barang masuk dicatat.
- Distribusi baru ditolak bila jumlah melebihi stok siap jual. Pengecekan memakai seluruh mutasi yang sudah dicatat, termasuk tanggal mendatang; belum ada perhitungan ketersediaan historis per tanggal pengiriman. Penerimaan tidak membukukan utang pemasok atau mengubah modal transaksi lama.
- Satuan dikunci jika produk sudah mempunyai distribusi **atau penerimaan**. Ambang indikator stok menipis adalah ≤20 satuan per produk, sebagai asumsi.

### Laporan & analitik

- Filter rentang tanggal dan customer, maksimum 366 hari. Tersedia grafik penjualan neto, estimasi laba kotor, retur, umur piutang, ringkasan per customer, dan ekspor CSV.
- Penjualan/laba/retur dihitung dari distribusi periode asal; penerimaan pembayaran memakai tanggal pembayaran.
- **Sisa piutang laporan** hanya mencakup invoice yang terbit dalam rentang pilihan, dengan sisa terkini setelah seluruh pembayaran. Umur piutang memakai tanggal hari ini Jakarta. Laporan ini bukan neraca piutang historis pada tanggal akhir pilihan. Dashboard/Pembayaran & Piutang tetap menunjukkan outstanding seluruh periode.
- CSV menggunakan Rupiah bulat tanpa simbol pada kolom nilai, separator titik koma, UTF-8 BOM, escaping kutip, dan pencegahan formula dari nama customer. Nilai tampilan UI menggunakan Rupiah/tanggal Indonesia.

### Import Excel (simulasi eksplisit)

1. Pilih file lokal `.xlsx`, `.xls`, atau `.csv`, maksimal 5 MB, atau gunakan contoh simulasi.
2. File **tidak dibaca isinya dan tidak dikirim ke server**. Hanya nama/ukuran/ekstensi dipakai; preview selalu berisi fixture contoh, bukan data file pengguna.
3. Petakan lima kolom wajib contoh: tanggal, customer, produk, jumlah, harga. Mapping wajib lengkap dan unik.
4. Validasi memakai salinan data aplikasi: customer/produk harus aktif, tanggal/jumlah/harga valid, periode belum final, dan stok mencukupi secara kumulatif antarbaris. Baris gagal diberi alasan; fixture sengaja mengandung customer tidak terdaftar dan jumlah negatif.
5. Konfirmasikan simulasi jika minimal satu baris valid. Hanya log `importRuns` (nama file, jumlah valid/tidak valid, waktu, mode simulasi) yang disimpan. Tidak ada perubahan customer, stok, distribusi, rekap, invoice, atau pembayaran.
6. Preview/mapping adalah state sesi; log hasil tetap tersimpan setelah refresh. Memilih file/contoh baru mengulang proses.

### Integrasi (simulasi saja)

- Konfigurasi WhatsApp: aktif/nonaktif dan nomor pengirim demo. Payment gateway: aktif/nonaktif serta penyedia demo/sandbox fiktif.
- Simpan konfigurasi sebelum uji. Uji hanya memvalidasi status lokal dan menambah `integrationTests`; tidak memakai endpoint, token, API key, HTTP request, atau gateway sungguhan.
- WhatsApp yang dinonaktifkan memblokir simulasi kirim baru pada invoice, tanpa menghapus log lama. Gateway yang nonaktif tidak memblokir pencatatan pembayaran manual.

### Pengaturan

- Nama, alamat, telepon distributor, informasi rekening lengkap atau kosong seluruhnya, dua nama pengguna dengan akses Administrator, tanggal acuan periode, serta tempo default invoice 0–90 hari.
- Durasi rekap tetap **14 hari** sesuai brief. Tanggal acuan hanya memberi saran periode saat Generate Rekap dibuka; pengguna tetap dapat memilih tanggal awal lain. Tempo baru hanya memengaruhi default invoice baru.
- Nama distributor/pengguna tersimpan ditampilkan pada sidebar/topbar/dashboard/profil. Invoice baru menyimpan snapshot nama distributor dan rekening; mengubah pengaturan tidak menulis ulang invoice lama. Invoice seed yang belum memiliki snapshot identitas memakai fallback nama master; rekening yang tidak diketahui tidak ditampilkan.
- Dua profil ini belum merupakan akun login. Seluruh perubahan berada di LocalStorage browser yang sama.
- Reset demo dengan dialog konfirmasi tersedia pada Pengaturan. Reset mengembalikan seed deterministik, stok awal, pengaturan default, dan menghapus log/entri demo tambahan. State filter modul pendukung juga dikembalikan.

### Verifikasi Step 6

`tests/supporting-modules.test.js` meliputi migrasi idempoten tanpa perubahan transaksi lama, konsistensi ledger, stok tidak mencukupi, retur nonjual, satuan setelah penerimaan, laporan dan umur piutang, pengaturan atomik, tanggal acuan, integrasi nonaktif, validasi mapping/import tanpa efek finansial, stok kumulatif simulasi, serta CSV.

Uji browser dilakukan pada origin demo terpisah: penerimaan → distribusi → retur → laporan, ekspor CSV, simpan/refresh profil, tempo invoice baru dan snapshot rekening, konfigurasi/uji gateway lokal, WhatsApp nonaktif, pemilihan file CSV lokal, mapping invalid/valid, dan persistensi log simulasi.


## Pembaruan pencatatan distribusi: satu hari & rentang tanggal

- Nama menu dan judul halaman menjadi **Pencatatan Distribusi**, dengan tab **Catat distribusi** dan **Riwayat distribusi**. Hash `#/distribution` tetap kompatibel.
- Saat masuk menu, pengguna memilih customer aktif terlebih dahulu. Pilihan waktu dan input produk baru ditampilkan sesudah customer dipilih.
- **Per hari** memilih satu tanggal. **Lebih dari 1 hari** memilih tanggal awal dan akhir secara inklusif (minimal dua hari, maksimal 366 hari per pencatatan). Mode ini menyediakan jumlah per produk untuk **setiap tanggal**, bukan satu total yang dibagi rata ke seluruh rentang.
- Seluruh produk aktif otomatis tampil, tanpa tombol Tambah item/hapus item. Jumlah awal adalah **0**. Pengguna mengisi jumlah berbeda per tanggal; produk yang tidak dikirim tetap 0. Produk berjumlah 0 tidak menimbulkan item transaksi, stok keluar, atau penjualan. Hari dengan semua jumlah 0 dilewati dan disebutkan pada pratinjau. Form yang seluruhnya 0 ditolak karena tidak ada pengiriman.
- Harga per produk otomatis mengikuti harga customer/default, dapat disesuaikan, dan berlaku pada seluruh tanggal dalam satu pencatatan. Harga dan modal tetap disalin ke transaksi harian sebagai snapshot.
- Mengganti customer mengosongkan jumlah, catatan, dan harga draft untuk mencegah data customer sebelumnya terpakai. Mengubah mode/rentang mempertahankan jumlah pada tanggal yang sudah diisi selama draft sesi tersebut. Tombol Kosongkan form mengembalikan pilihan awal.
- **Tinjau catatan distribusi** menampilkan transaksi harian yang akan dibuat, total Rupiah, serta hari nol yang dilewati. Kembali dari pratinjau mempertahankan isian.
- Penyimpanan seluruh rentang bersifat atomik: semua hari berpengiriman divalidasi terhadap stok **kumulatif** dan periode customer yang sudah final pada salinan data. Jika satu hari gagal, tidak ada transaksi dalam pencatatan itu yang disimpan. Validasi diulang saat konfirmasi. ID pencatatan mencegah penyimpanan form yang sama dua kali.
- Hari nol boleh dilewati walaupun tanggal tersebut berada dalam periode final, karena tidak ada transaksi yang dibuat. Hari berpengiriman pada periode final tetap ditolak.
- Setiap tanggal berpengiriman tetap mendapat ID distribusi tersendiri agar retur, rekap, invoice, inventori, dan laporan memakai tanggal asal yang benar. Metadata kelompok disimpan pada `distributionBatches` dengan ID, customer, rentang, daftar ID distribusi, daftar tanggal nol, dan waktu pencatatan. Data lama tidak diubah.
- Setelah disimpan, halaman membuka Riwayat distribusi yang difilter sesuai customer/rentang tadi. Form dan grid responsif: tabel di desktop, kartu tanggal dengan input produk di ponsel.

Kode UI berada di `src/pages/distribution.js`. Validasi batch dan penyimpanan atomik berada di `src/lib/operations.js`; aturan transaksi positif tunggal sebelumnya tetap dipakai oleh import simulasi dan domain lain. Pengujian `tests/distribution-batch.test.js` mencakup rentang tanggal, input nol, hari kosong, atomisitas stok/periode final, anti-duplikasi, harga historis, retur, serta rekap/invoice dari transaksi multi-hari.
# demo_distribution_web_app
