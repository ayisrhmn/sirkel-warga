# Sirkel — Rencana Pengembangan

Status: **draft, menunggu persetujuan**. Belum ada kode yang ditulis.

Sirkel adalah web info lingkungan (RT / gang / dasa wisma) untuk warga: pengumuman, agenda, kontak penting, dan laporan tabel hasil import Excel. Proyek volunteer, non-komersial, tanpa iklan.

## 1. Keputusan yang sudah diambil

| Topik | Keputusan | Catatan |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript + Tailwind CSS | Full-stack, tidak ada backend terpisah. TanStack Start dipertimbangkan, ditolak karena ISR dan revalidate on-demand harus diatur manual lewat header cache, sementara fitur `protected` rawan bocor bila cache salah. |
| Fetching data | Server Component untuk baca, Server Action untuk mutasi | Tidak memakai axios maupun TanStack Query pada MVP. Halaman publik tidak butuh fetch dari client. Bisa ditambahkan di area admin bila nanti diperlukan. |
| Database | Neon Postgres (Free), region Singapore | Satu database untuk semua komunitas, dipisah lewat `community_id`. |
| Akses DB | Prisma ORM 7 + `@prisma/adapter-pg` | Dipilih karena sudah familiar. Prisma 7 mewajibkan driver adapter. Adapter `pg` konek lewat TCP biasa, jadi kode yang sama jalan di Postgres lokal (development) dan Neon (production). Versi dikunci di 7.10.x (stabil), karena tag `latest` untuk CLI `prisma` saat ini masih 8.0 RC. |
| Parsing Excel | SheetJS di browser admin, dipasang dari tarball CDN resmi | `npm i --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`. Paket `xlsx` di npm tertinggal (0.18.5) dan memiliki CVE. Versi dicek ulang sebelum install. Alternatif cadangan: `read-excel-file`. |
| Password data `protected` | Disimpan di database per komunitas, dalam bentuk hash (`scrypt` dari `node:crypto`) | Menggantikan `PROTECTED_PASSWORD` di env. Tiap komunitas bisa punya password berbeda. |
| Hosting | Vercel Hobby, region function `sin1` | Domain `*.vercel.app` untuk tahap awal. |
| Data nunggak | Dibuat apa adanya (nama + status), sesuai spesifikasi | Masih prototype. Akan ditinjau bersama pihak terkait sebelum dipakai warga. |

## 2. Environment variable

| Nama | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi Postgres (runtime). Production: URL Neon pooled. Development: Postgres lokal |
| `DIRECT_URL` | Opsional. URL Neon non-pooled untuk migrasi, dipakai bila `DATABASE_URL` adalah URL pooled |
| `ADMIN_PASSWORD` | Password login admin (lihat pertanyaan terbuka) |
| `COOKIE_SECRET` | Kunci penandatangan semua cookie |

Tidak ada variabel dengan prefix `NEXT_PUBLIC_`. `PROTECTED_PASSWORD` tidak dipakai lagi.

## 3. Skema database

```
communities  (id, slug UNIQUE, name, protected_password_hash NULL, created_at)
announcements(id, community_id FK, title, body, published_at, status draft|public, created_at, updated_at)
events       (id, community_id FK, title, starts_at, location, description, created_at, updated_at)
contacts     (id, community_id FK, name, role, phone, sort_order, created_at, updated_at)
datasets     (id, community_id FK, title, period, columns jsonb, rows jsonb,
              visibility draft|public|protected, created_at, updated_at)
```

Aturan:
- Semua tabel konten memiliki `community_id` dan di-index pada kolom itu.
- `slug` tidak dapat diubah setelah dibuat.
- Laporan yang berisi nama warga dipecah menjadi dua dataset: ringkasan (`public`) dan rincian per nama (`protected`). Ini lebih sederhana daripada visibilitas per kolom atau per baris.

## 4. Struktur route

| Route | Fungsi | Render |
|---|---|---|
| `/` | Landing page statis, teks persis sesuai spesifikasi | Static, cache penuh, tanpa DB |
| `/[communitySlug]` | Halaman komunitas: pengumuman, agenda, kontak, daftar laporan | ISR, revalidate saat admin mengubah data |
| `/[communitySlug]/laporan/[id]` | Tampilan dataset | `public`: ISR. `protected`: dynamic penuh, tanpa cache |
| `/login` | Login admin, `noindex`, tidak ada di navigasi publik | Dynamic |
| `/admin` dan `/admin/[communitySlug]/...` | Panel admin (daftar komunitas, CRUD, dataset) | Dynamic, dilindungi cookie admin |
| `/robots.txt` | `Disallow: /` untuk semua crawler | Static |
| slug tidak ditemukan | Halaman ramah "Komunitas tidak ditemukan" | — |

Slug yang dilarang (divalidasi di server saat membuat komunitas): `login`, `admin`, `api`, `robots.txt`, `favicon.ico`, `sitemap.xml`, `_next`, dan route sistem lain yang ditambahkan kemudian. Format slug: huruf kecil, angka, dan tanda hubung.

Struktur route di atas adalah usulan dan belum final, terutama pola URL untuk laporan dan panel admin.

## 5. Keamanan

1. Password admin dibandingkan di server (Server Action). Cookie `httpOnly`, `secure`, `sameSite=lax`, bertanda tangan HMAC dengan `COOKIE_SECRET`.
2. Password `protected` diverifikasi di server terhadap hash di database. Cookie dibuat **per komunitas**, memuat `community_id`, waktu kedaluwarsa (7 hari), dan sidik jari hash password. Mengganti password otomatis membatalkan cookie lama, dan cookie komunitas A tidak membuka komunitas B.
3. Data `protected` hanya di-query di server setelah cookie valid. Tidak ada pengiriman data ke browser lalu disembunyikan dengan CSS.
4. Halaman `protected` memakai dynamic rendering tanpa cache apa pun (`force-dynamic` dan header `Cache-Control: no-store`).
5. `noindex` lewat meta robots dan header `X-Robots-Tag` untuk semua halaman, ditambah `robots.txt`.
6. Tidak ada secret yang terekspos ke client.
7. Perbandingan password memakai `timingSafeEqual`.
8. Status nunggak: hanya nama dan status, tanpa nominal dan rincian bulan. Permintaan lebih dari itu perlu peringatan risiko terlebih dahulu.
9. **TODO (fase lanjutan): rate limit percobaan password** untuk login admin dan password `protected`. Ditandai dengan komentar `TODO(rate-limit)` di kode.

## 6. Fase pengembangan

Setiap fase diakhiri dengan berhenti, ringkasan hasil, dan review kode dengan temuan dikelompokkan Critical / High / Medium / Low. Fase berikutnya dimulai setelah ada persetujuan.

### Fase 0 — Fondasi
- Scaffold Next.js + TypeScript + Tailwind, ESLint, struktur folder.
- Koneksi Neon, Prisma, skema database, migrasi pertama, seed satu komunitas contoh.
- `vercel.json` dengan region `sin1`. Pastikan database Neon di Singapore.
- Landing page `/` (statis, teks sesuai spesifikasi).
- Route `/[communitySlug]` (kerangka, membaca komunitas dari DB), halaman "Komunitas tidak ditemukan".
- `robots.txt`, header `X-Robots-Tag` global, validasi env saat start.
- Selesai bila: `/` dan `/slug-contoh` tampil, slug tak dikenal menampilkan halaman ramah, `/robots.txt` benar, build produksi lolos.

### Fase 1 — Admin dan konten dasar
- Login admin (password env + cookie bertanda tangan), logout, proteksi route `/admin`. Desain dibuat mudah diganti ke akun per pengurus.
- Pembuatan komunitas dengan validasi slug di server, termasuk daftar slug terlarang.
- CRUD pengumuman (draft/publik), agenda, dan kontak penting.
- Halaman publik menampilkan ketiganya dengan ISR, dan revalidate saat admin mengubah data.
- Selesai bila: admin dapat membuat komunitas dan mengelola konten, halaman publik langsung terbarui, slug terlarang ditolak di server.

### Fase 2 — Dataset dari Excel
- Pasang SheetJS (versi dan cara install diverifikasi ulang).
- Alur import di browser admin: unggah file, pilih sheet, pilih baris header, lihat preview, simpan. Membaca nilai hasil formula, bukan teksnya. Menangani merged cell dan header yang bukan di baris 1.
- Simpan ke `datasets` (`columns` dan `rows` sebagai JSONB), dengan validasi ukuran payload dan pesan error yang jelas (batas body Vercel sekitar 4.5MB).
- Tampilan tabel publik dengan scroll horizontal di dalam container.
- Tombol export dataset (cadangan, karena Free plan tidak punya backup yang bisa diandalkan).
- Selesai bila: file Excel contoh yang berantakan berhasil diimport dengan preview benar dan tampil di halaman publik.

### Fase 3 — Mode `protected`
- Pengaturan password `protected` per komunitas di admin (disimpan sebagai hash).
- Form password, verifikasi di server, cookie bertanda tangan per komunitas (7 hari).
- Halaman dataset `protected` dengan dynamic rendering dan `no-store`.
- Selesai bila: tanpa cookie yang valid tidak ada satu pun data `protected` di HTML maupun respons jaringan, password komunitas A tidak membuka B, dan mengganti password membatalkan akses lama.

### Fase 4 — Polishing dan deploy
- Pengecekan mobile-first (HP kecil dan koneksi lambat), aksesibilitas dasar.
- Deploy ke Vercel Hobby dan verifikasi region `sin1`.
- Panduan satu halaman: cara mengganti password dan akses darurat.
- Review akhir (Critical / High / Medium / Low).

## 7. Di luar cakupan MVP

Login warga, pembayaran iuran, chart, notifikasi, sistem role yang rumit, penyimpanan file `.xlsx` asli, surat pengantar. Tidak dikerjakan tanpa persetujuan.

## 8. Risiko

- **Excel bendahara berantakan.** Struktur bisa berubah tiap bulan. Preview dan pemilihan header manual adalah mitigasinya.
- **Cold start Neon Free.** Compute tertidur setelah 5 menit idle, sehingga request pertama bisa lambat. ISR mengurangi dampaknya untuk halaman publik.
- **Tanpa backup otomatis.** Tombol export di Fase 2 adalah satu-satunya cadangan. Perlu rutinitas manual atau penjadwalan di kemudian hari.
- **Kebocoran data `protected` lewat cache.** Dimitigasi dengan dynamic rendering, `no-store`, dan pengujian eksplisit di Fase 3.
- **Data nama warga dan status nunggak.** Perlu ditinjau bersama ketua RT dan pihak terkait sebelum dipakai warga.

## 9. Pertanyaan terbuka

1. Berapa admin, dan apakah perlu akun per pengurus? Dengan satu `ADMIN_PASSWORD`, semua admin dapat mengelola semua komunitas.
2. Apakah struktur file Excel bendahara seragam tiap bulan atau berubah-ubah? (Menentukan apakah perlu template.)
3. Konfirmasi persetujuan ketua RT untuk menampilkan nama penunggak (ditinjau bersama pihak terkait).
4. Domain: `*.vercel.app` dulu. Siapa yang membayar domain tahunan dan atas nama siapa belum diputuskan.
5. Pola URL laporan dan panel admin (lihat bagian 4).
