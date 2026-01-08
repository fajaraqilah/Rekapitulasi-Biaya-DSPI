# Dokumentasi Proyek DSPI Internal Cost Report Dashboard

## Daftar Isi
1. [Pendahuluan](#pendahuluan)
2. [Arsitektur dan Struktur Proyek](#arsitektur-dan-struktur-proyek)
3. [Modul-modul Aplikasi](#modul-modul-aplikasi)
4. [Database Schema](#database-schema)
5. [Instalasi dan Konfigurasi](#instalasi-dan-konfigurasi)
6. [Penggunaan dan Fitur-fitur](#penggunaan-dan-fitur-fitur)
7. [Implementasi dan Perbaikan](#implementasi-dan-perbaikan)
8. [Permasalahan dan Solusi](#permasalahan-dan-solusi)
9. [Best Practices](#best-practices)
10. [Catatan Tambahan](#catatan-tambahan)

## Pendahuluan

### Latar Belakang
Dashboard ini dibuat untuk Divisi Audit Internal (DSPI) untuk menampilkan laporan keuangan dan detail biaya operasional. Dashboard menyediakan situs web yang bersih dan fokus pada data untuk DSPI untuk menampilkan laporan keuangan dan detail biaya operasional untuk tahun 2025 dan 2026. Sistem menawarkan antarmuka yang jelas, minimal, dan responsif yang dioptimalkan untuk visibilitas data dan usabilitas oleh petugas internal dan administrator.

### Tujuan Proyek
Tujuan dari proyek ini adalah untuk menyediakan sistem pelaporan biaya internal yang efisien bagi DSPI dengan fitur-fitur berikut:
- Visualisasi data biaya yang jelas dan interaktif
- Sistem manajemen anggaran yang akurat
- Antarmuka yang responsif untuk berbagai perangkat
- Dukungan untuk beberapa tahun dan kategori biaya

### Teknologi yang Digunakan
- **Frontend:** HTML5, TailwindCSS, Vanilla JavaScript (ES6)
- **Backend / Database:** Supabase (PostgreSQL + Realtime API)
- **Chart Library:** Chart.js (untuk Pie Chart di modul BPD)
- **Export Library:** SheetJS (Excel) & jsPDF (PDF)
- **Authentication:** Supabase Auth

## Arsitektur dan Struktur Proyek

### Struktur Direktori
```
dspi-dashboard/
│
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── supabaseClient.js
│   ├── bpd.js
│   ├── bebanBiaya.js
│   ├── login.js
│   ├── menuGenerator.js
│   └── utils.js
├── assets/
│   └── logo ptpn1.png
├── public/
│   ├── favicon.ico
│   └── favicon.png
└── login.html
```

### File-file Utama

#### index.html
File utama dashboard yang berisi kerangka halaman utama dengan navigasi header dan area konten. Ini adalah halaman yang digunakan oleh semua pengguna setelah login, baik admin maupun pengguna biasa.

#### login.html
Halaman formulir login yang memungkinkan pengguna untuk masuk ke sistem menggunakan kredensial Supabase Auth.

#### File JavaScript
- `supabaseClient.js`: Konfigurasi klien Supabase
- `bpd.js`: Modul untuk menangani catatan biaya perjalanan dinas
- `bebanBiaya.js`: Modul untuk kategori biaya lainnya
- `login.js`: Menangani proses login dan otentikasi
- `menuGenerator.js`: Menghasilkan menu dinamis berdasarkan data dari database
- `utils.js`: Fungsi utilitas untuk pemformatan, ekspor, dan filter

#### File CSS
- `style.css`: Gaya kustom untuk dashboard

### Teknologi Backend (Supabase)
Supabase digunakan sebagai backend untuk menyimpan dan mengelola data. Ini menyediakan layanan real-time dan otentikasi yang terintegrasi dengan baik.

## Modul-modul Aplikasi

### BPD (Biaya Perjalanan Dinas)
Modul ini digunakan untuk mengelola biaya perjalanan dinas dengan fitur-fitur:

#### Fungsi Utama
- Menampilkan ringkasan data dari `vw_bpd_summary_by_auditor`
- Termasuk grafik lingkaran (Top 3 Auditors) berdasarkan total biaya akomodasi
- Menampilkan detail per rekaman
- Fitur manajemen anggaran untuk perjalanan dinas
- Grafik pie untuk menampilkan 3 auditor dengan biaya tertinggi

#### Fitur Admin
- Formulir untuk menambah data BPD baru
- Kemampuan mengedit dan menghapus catatan BPD
- Fungsi ekspor data ke Excel dan PDF
- Fitur pencarian dan filter data

### Beban Biaya
Modul ini digunakan untuk mengelola berbagai kategori biaya lainnya:

#### Kategori Biaya
- Beban Biaya Audit
- Beban Biaya Jasa Profesional (Konsultan)
- Beban Biaya Iuran, Sumbangan & Retribusi
- Beban Biaya Tamu
- Beban Biaya Rapat

#### Fitur Utama
- Tampilan kartu ringkasan (Jumlah Awal, Jumlah Akhir)
- Dropdown subkategori dinamis
- Formulir untuk menambah transaksi (untuk admin)
- Fitur ekspor data ke Excel dan PDF

#### Fitur Admin
- Formulir untuk menambah transaksi baru
- Fitur manajemen anggaran per subkategori
- Pembaruan data secara real-time
- Fungsi pencarian dan filter data

## Database Schema

### Tabel-tabel Utama

#### beban_biaya_master
Menyimpan jumlah total tahunan dan ringkasan per jenis biaya.

| Kolom | Tipe Data | Nullable | Default |
|-------|-----------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| tahun | integer | NO | - |
| kategori | text | NO | - |
| subkategori | text | NO | - |
| jumlah_awal | numeric | YES | 0 |
| jumlah_akhir | numeric | YES | 0 |
| created_at | timestamp with time zone | YES | now() |
| updated_at | timestamp with time zone | YES | now() |

#### beban_biaya_transaksi
Menyimpan log transaksi untuk setiap kategori biaya.

| Kolom | Tipe Data | Nullable | Default |
|-------|-----------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| master_id | uuid | NO | - |
| tanggal_kegiatan | date | NO | - |
| nama_kegiatan | text | NO | - |
| jumlah_orang | integer | YES | 1 |
| biaya_kegiatan | numeric | NO | 0 |
| created_at | timestamp with time zone | YES | now() |

#### bpd_budget_master
Menyimpan informasi anggaran perjalanan dinas per tahun.

| Kolom | Tipe Data | Nullable | Default |
|-------|-----------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| tahun | integer | NO | - |
| kategori | text | NO | - |
| budget_awal | numeric | NO | 0 |
| budget_sisa | numeric | NO | 0 |
| created_at | timestamp with time zone | YES | now() |
| updated_at | timestamp with time zone | YES | now() |

#### bpd_budget_transactions
Menyimpan transaksi anggaran perjalanan dinas.

| Kolom | Tipe Data | Nullable | Default |
|-------|-----------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| bpd_budget_id | uuid | NO | - |
| transaction_type | text | NO | - |
| amount | numeric | NO | - |
| description | text | YES | - |
| created_by | uuid | YES | auth.uid() |
| created_at | timestamp with time zone | YES | now() |

#### beban_biaya_budget_transactions
Menyimpan transaksi anggaran beban biaya.

| Kolom | Tipe Data | Nullable | Default |
|-------|-----------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| beban_biaya_master_id | uuid | NO | - |
| transaction_type | text | NO | - |
| amount | numeric | NO | - |
| saldo_sebelum | numeric | NO | - |
| saldo_sesudah | numeric | NO | - |
| description | text | YES | - |
| created_by | uuid | YES | auth.uid() |
| created_at | timestamp with time zone | YES | now() |

#### profiles
Menyimpan profil pengguna dan peran (admin/pengguna).

| Kolom | Tipe Data | Nullable | Default |
|-------|-----------|----------|---------|
| id | uuid | NO | - |
| full_name | text | NO | - |
| role | text | NO | - |
| created_at | timestamp with time zone | YES | - |

## Instalasi dan Konfigurasi

### Prasyarat
- Node.js (opsional untuk server lokal)
- Akses ke layanan Supabase

### Langkah-langkah Instalasi

1. Clone atau download repositori ini
2. Siapkan proyek Supabase:
   - Kunjungi [Supabase](https://app.supabase.io/)
   - Buat proyek baru
   - Dapatkan Project URL dan API Key (anon key)
3. Konfigurasi Supabase:
   - Perbarui `js/supabaseClient.js` dengan Project URL dan anon key Supabase Anda
4. Buat tabel dan view database:
   - Jalankan perintah SQL di `supabase_setup_updated.sql` di editor SQL Supabase Anda
5. Jalankan server lokal (karena proyek menggunakan ES modules):
   - Opsi 1: Menggunakan Python (jika Anda memiliki Python terinstall)
     ```bash
     # Untuk Python 3
     python -m http.server 8000
     ```
   - Opsi 2: Menggunakan Node.js (jika Anda memiliki Node.js terinstall)
     ```bash
     # Install live-server secara global (jika belum terinstall)
     npm install -g live-server
     
     # Jalankan live-server di direktori proyek
     live-server
     ```
   - Opsi 3: Menggunakan ekstensi Live Server di VS Code
     - Jika Anda menggunakan Visual Studio Code, Anda dapat menginstall ekstensi "Live Server" dan menggunakannya untuk menyajikan file-file tersebut.

Setelah menjalankan server, buka browser dan arahkan ke `http://localhost:8000` (atau port yang digunakan server Anda).

## Penggunaan dan Fitur-fitur

### Fitur Utama
- **Auto-refresh:** Pembaruan real-time melalui Supabase Realtime API
- **Ekspor Data:** Ekspor data tabel ke Excel dan PDF
- **Filter Tanggal:** Filter transaksi berdasarkan rentang tanggal
- **Perhitungan Otomatis:** Jumlah akhir otomatis diperbarui saat input data
- **Grafik Lingkaran:** Tampilkan 3 pengguna teratas (auditor) secara dinamis
- **UI Responsif:** Tata letak menyesuaikan secara bersih ke layar desktop/tablet

### Peran Pengguna
- **Pengguna:** Melihat kartu ringkasan (Jumlah Awal, Jumlah Akhir). Klik sub-item untuk melihat detail saja.
- **Admin:** Melihat kartu ringkasan dan akses ke formulir input untuk mencatat transaksi baru (tanggal, nama aktivitas, jumlah orang, dan biaya). Sistem secara otomatis menghitung ulang Jumlah Akhir = Jumlah Awal - Total Biaya.

### Navigasi
Dashboard menggunakan struktur navigasi SPA (Single Page Application):
- Menu header dengan tombol 2025 dan 2026
- Submenu dropdown untuk kategori biaya
- Pemuatan konten tanpa reload halaman

## Implementasi dan Perbaikan

### Konsolidasi Kode
- Membuat template `dashboard.html` terpadu
- Mengalihkan pengguna admin dan reguler ke dashboard terkonsolidasi
- Memperbarui `login.js` untuk mengarahkan semua pengguna ke `dashboard.html`

### Peningkatan Status Pemuatan
- Menerapkan layar skeleton pemuatan dengan placeholder animasi
- Menambahkan spasi dan hierarki visual yang tepat ke status pemuatan
- Menggunakan animasi CSS untuk transisi pemuatan yang halus

### Peningkatan Aksesibilitas
- Menambahkan indikator fokus yang tepat untuk navigasi keyboard
- Menerapkan atribut ARIA untuk dukungan pembaca layar
- Memperbarui JavaScript untuk mengelola status ARIA secara dinamis
- Menambahkan atribut `aria-expanded` untuk menu dropdown
- Menambahkan atribut `aria-selected` untuk navigasi tab

### Peningkatan Navigasi Mobile
- Menyatukan penanganan menu mobile di `utils.js`
- Memperbaiki pengelolaan atribut ARIA untuk menu mobile
- Menangani breakpoint secara konsisten di semua halaman

### Optimasi SEO
- Menambahkan tag meta komprehensif ke semua file HTML
- Menerapkan tag Open Graph untuk berbagi sosial
- Menambahkan metadata penulis dan deskripsi
- Menyertakan kata kunci untuk pengindeksan pencarian yang lebih baik

### Peningkatan Penanganan Kesalahan
- Menambahkan tampilan kesalahan visual dengan ikon
- Menerapkan tombol muat ulang untuk pemulihan kesalahan
- Memperbaiki pesan kesalahan untuk pemahaman pengguna yang lebih baik

## Permasalahan dan Solusi

### Masalah 1: Anggaran Tersisa Tidak Dipulihkan Setelah Penghapusan Data
#### Deskripsi
Saat anggaran ditambahkan, data berhasil tercermin di frontend. Namun, masalah muncul dalam perhitungan Anggaran Tersisa. Jika catatan dihapus dari database (misalnya, karena input data yang salah), Anggaran Tersisa tidak kembali ke nilai sebelumnya dan tidak diperbarui dengan benar.

#### Solusi
- Menambahkan logika untuk menangani rollback anggaran saat data BPD dihapus
- Memastikan bahwa anggaran yang tersisa dikurangi saat insert tetapi juga dipulihkan saat delete
- Menyinkronkan perubahan anggaran dengan database menggunakan trigger

### Masalah 2: Data BPD 2025 dan BPD 2026 Tidak Terpisah dengan Benar
#### Deskripsi
Logika tampilan untuk menu BPD 2025 dan BPD 2026 tidak dipisahkan dengan benar berdasarkan tahun. Selama pengujian, saat data baru ditambahkan untuk tahun 2026, grafik, filter, dan tabel Daftar Data BPD di halaman BPD 2025 juga meningkat dan mencerminkan data baru.

#### Solusi
- Memperbaiki logika filter berbasis tahun
- Memastikan bahwa periode_awal dan periode_akhir dievaluasi dengan benar terhadap tahun yang dipilih
- Mengisolasi data per tahun dengan filter yang ketat

### Masalah 3: Validasi Anggaran di Frontend
#### Deskripsi
Frontend JavaScript memblokir transaksi dengan pesan kesalahan seperti "Insufficient budget!", padahal sistem database menggunakan trigger untuk mengelola anggaran dan memperbolehkan anggaran minus.

#### Solusi
- Menghapus validasi anggaran yang memblokir di frontend
- Mengganti dengan peringatan non-blokir seperti `showToast("⚠️ Budget exceeded. Remaining budget will be negative.")`
- Memastikan bahwa penyisipan transaksi selalu berjalan ke database
- Menyegarkan data setelah insert/update/delete

## Best Practices

### Prinsip Desain
- Frontend = UX, Backend = Rules
- Database adalah sumber kebenaran tunggal untuk logika anggaran
- Frontend tidak boleh memberlakukan kendala anggaran
- Gunakan ES modules untuk manajemen dependensi
- Gunakan Tailwind CSS untuk styling konsisten

### Pengembangan
- Semua file JavaScript ditulis sebagai ES modules
- Chart.js digunakan untuk visualisasi data
- SheetJS dan jsPDF digunakan untuk ekspor data
- Dashboard dirancang responsif dan ramah mobile
- Gunakan komentar dokumentasi yang jelas
- Ikuti prinsip DRY (Don't Repeat Yourself)

### Keamanan
- Gunakan otentikasi Supabase Auth
- Kelola peran pengguna (admin/pengguna biasa)
- Validasi input di sisi server
- Gunakan UUID untuk ID unik

## Catatan Tambahan

### Fitur Masa Depan
1. Implementasi otentikasi pengguna lengkap dengan Supabase Auth
2. Tambahkan fungsi filter tanggal ke UI
3. Implementasi pembaruan real-time menggunakan Supabase Realtime API
4. Tambahkan validasi dan penanganan kesalahan untuk pengiriman formulir
5. Implementasi pagination untuk dataset besar
6. Tambahkan unit test untuk fungsi JavaScript

### Catatan Pengembangan
- Dashboard menggunakan ES modules, jadi harus disajikan melalui server lokal daripada membuka index.html secara langsung
- Skrip setup SQL menyediakan titik awal untuk struktur database tetapi mungkin perlu penyesuaian berdasarkan kebutuhan spesifik
- Otentikasi pengguna disimulasikan dalam implementasi ini - di lingkungan produksi, integrasikan dengan Supabase Auth

### Panduan Kontribusi
1. Fork repositori
2. Buat branch fitur (`git checkout -b fitur/NamaFitur`)
3. Commit perubahan Anda (`git commit -m 'Tambahkan beberapa NamaFitur'`)
4. Push ke branch (`git push origin fitur/NamaFitur`)
5. Buka Pull Request