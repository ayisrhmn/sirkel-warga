# Sirkel — Rencana Pengembangan

Status: Fase 0 sampai 3 selesai. Fase 4: kode dan dokumen selesai; yang tersisa dilakukan pemilik proyek (QA manual, push ke GitHub, deploy ke Vercel, uji di HP sungguhan) mengikuti [RUNBOOK.md](RUNBOOK.md).

Sirkel adalah web info lingkungan (RT / gang / dasa wisma) untuk warga: pengumuman, agenda, kontak penting, dan laporan tabel hasil import Excel. Proyek volunteer, non-komersial, tanpa iklan. Warga tidak login; hanya pengurus yang punya akun.

## 1. Keputusan yang sudah diambil

| Topik | Keputusan | Catatan |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript + Tailwind CSS | Full-stack, tidak ada backend terpisah. TanStack Start dipertimbangkan, ditolak karena ISR dan revalidate on-demand harus diatur manual lewat header cache, sementara fitur `protected` rawan bocor bila cache salah. |
| Fetching data | Server Component untuk baca, Server Action untuk mutasi | Tidak memakai axios maupun TanStack Query pada MVP. Halaman publik tidak butuh fetch dari client. Bisa ditambahkan di area admin bila nanti diperlukan. |
| Database | Neon Postgres (Free), region Singapore | Satu database untuk semua komunitas, dipisah lewat `community_id`. |
| Akses DB | Prisma ORM 7 + `@prisma/adapter-pg` | Dipilih karena sudah familiar. Prisma 7 mewajibkan driver adapter. Adapter `pg` konek lewat TCP biasa, jadi kode yang sama jalan di Postgres lokal (development) dan Neon (production). Versi dikunci di 7.10.x (stabil), karena tag `latest` untuk CLI `prisma` saat ini masih 8.0 RC. |
| Auth | Better Auth (email+password dengan plugin `username`, sesi di database) | Auth.js dipertimbangkan, ditolak: mode maintenance, v5 masih beta, dan tidak punya role per komunitas. Plugin `organization` Better Auth tidak dipakai (role bawaannya tidak cocok dan bentrok dengan tabel `communities`); role disimpan di tabel `memberships` milik kita. |
| Parsing Excel | SheetJS di browser admin, dipasang dari tarball CDN resmi | `bun add https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`. Paket `xlsx` di npm tertinggal (0.18.5) dan memiliki CVE. Versi dicek ulang sebelum install. Alternatif cadangan: `read-excel-file`. |
| Password data `protected` | Disimpan di database per komunitas, dalam bentuk hash (`scrypt` dari `node:crypto`) | Menggantikan `PROTECTED_PASSWORD` di env. Tiap komunitas bisa punya password berbeda. |
| Bahasa | Kode, nama route, nama file, dan komentar dalam bahasa Inggris | Teks antarmuka untuk pengguna dan dokumen proyek tetap bahasa Indonesia. |
| Package manager | bun | `bun install`, `bun run <script>`, `bunx`. |
| Hosting | Vercel Hobby, region function `sin1` | Domain `*.vercel.app` untuk tahap awal. |
| Slug komunitas | Diturunkan dari nama, tanpa akhiran acak | Contoh: "Dawis Matahari - Sektor 3" menjadi `dawis-matahari-sektor-3`. Dapat diedit sebelum disimpan, terkunci sesudahnya. Slug bukan pengaman; data sensitif dijaga password `protected`. |
| Data nunggak | Dibuat apa adanya (nama + status), sesuai spesifikasi | Masih prototype. Akan ditinjau bersama pihak terkait sebelum dipakai warga. |

## 2. Environment variable

| Nama | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi Postgres (runtime). Production: URL Neon pooled. Development: Postgres lokal |
| `DIRECT_URL` | Opsional. URL Neon non-pooled untuk migrasi, dipakai bila `DATABASE_URL` adalah URL pooled |
| `BETTER_AUTH_SECRET` | Kunci sesi dan enkripsi Better Auth |
| `BETTER_AUTH_URL` | URL dasar aplikasi (`http://localhost:3000` di development) |
| `COOKIE_SECRET` | Kunci penandatangan cookie akses data `protected` (Fase 3) |

Tidak ada variabel dengan prefix `NEXT_PUBLIC_`. `ADMIN_PASSWORD` dan `PROTECTED_PASSWORD` tidak dipakai lagi.

## 3. Skema database

Tabel konten:

```
communities  (id, slug UNIQUE, name, protected_password_hash NULL, created_at)
announcements(id, community_id FK, title, body, published_at, status draft|public, created_at, updated_at)
events       (id, community_id FK, title, starts_at, location, description, created_at, updated_at)
contacts     (id, community_id FK, name, role, phone, sort_order, created_at, updated_at)
datasets     (id, community_id FK, title, period, columns jsonb, rows jsonb,
              visibility draft|public|protected, created_at, updated_at)
```

Tabel akun (Fase 1A dan 1B):

```
user         (dikelola Better Auth: id, name, email sintetis, username, ...
              + approved bool default false,
              + isPlatformAdmin bool default false,
              + mustChangePassword bool default false)
session, account, verification, rateLimit   (dikelola Better Auth)
memberships  (id, user_id FK, community_id FK, role owner|admin, created_at,
              UNIQUE(user_id, community_id))
```

Aturan:
- Semua tabel konten memiliki `community_id` dan di-index pada kolom itu.
- `slug` tidak dapat diubah setelah dibuat.
- Laporan yang berisi nama warga dipecah menjadi dua dataset: ringkasan (`public`) dan rincian per nama (`protected`). Ini lebih sederhana daripada visibilitas per kolom atau per baris.
- Better Auth mewajibkan kolom email. Karena login memakai username, email diisi sintetis (`<username>@users.sirkel.local`) dan tidak pernah dipakai.
- Username unik secara global, huruf kecil.

## 4. Struktur route

| Route | Fungsi | Render |
|---|---|---|
| `/` | Landing page statis, teks persis sesuai spesifikasi | Static, cache penuh, tanpa DB |
| `/[communitySlug]` | Halaman komunitas: pengumuman, agenda, kontak, daftar laporan | ISR, revalidate saat admin mengubah data |
| `/[communitySlug]/datasets/[id]` | Tampilan dataset `public` (tabel). Untuk `protected` hanya pemberitahuan, barisnya tidak pernah dimuat. Draft: 404 | ISR |
| `/[communitySlug]/protected/[id]` (Fase 3) | Tampilan dataset `protected` setelah password benar | Dynamic penuh, `no-store`. Dipisah dari route publik supaya route publik tetap bisa di-cache (membaca cookie membuat seluruh route dinamis) |
| `/register` | Pendaftaran akun (status menunggu persetujuan) | Dynamic, `noindex` |
| `/login` | Login, tidak ada di navigasi publik | Dynamic, `noindex` |
| `/change-password` | Wajib dilalui bila `must_change_password` | Dynamic |
| `/create-community` | Membuat komunitas (user yang sudah disetujui dan belum punya komunitas) | Dynamic |
| `/admin` | Daftar komunitas milik user; langsung diteruskan bila hanya satu | Dynamic |
| `/admin/[communitySlug]` | Ringkasan dan menu | Dynamic |
| `/admin/[communitySlug]/announcements`, `/events`, `/contacts`, `/datasets` | CRUD konten (super admin dan admin) | Dynamic |
| `/admin/[communitySlug]/datasets/import`, `/datasets/[id]`, `/datasets/export`, `/datasets/[id]/export` | Impor Excel dengan pratinjau, detail dan ubah metadata, cadangan JSON semua laporan, CSV satu laporan | Dynamic |
| `/admin/[communitySlug]/users` | Tambah, reset password, hapus admin (hanya super admin) | Dynamic |
| `/admin/[communitySlug]/settings` | Nama komunitas dan password `protected` (hanya super admin) | Dynamic |
| `/platform` | Persetujuan akun baru (hanya `is_platform_admin`, yaitu pemilik proyek) | Dynamic |
| `/api/auth/[...all]` | Endpoint Better Auth | Dynamic |
| `/robots.txt` | `Disallow: /` untuk semua crawler | Static |
| slug tidak ditemukan | Halaman ramah "Komunitas tidak ditemukan" | — |

Slug yang dilarang (divalidasi di server saat membuat komunitas): `login`, `register`, `change-password`, `create-community`, `admin`, `platform`, `api`, `robots.txt`, `favicon.ico`, `sitemap.xml`, `_next`, dan route sistem lain yang ditambahkan kemudian. Format slug: huruf kecil, angka, dan tanda hubung.

## 5. Akun, role, dan isolasi komunitas

Alur:
1. Calon pengurus mendaftar di `/register` (nama, username, password). Akun berstatus **menunggu persetujuan** dan belum bisa login.
2. Pemilik proyek (platform admin) menyetujui di `/platform`. Platform admin ditandai lewat kolom `isPlatformAdmin` yang diisi lewat `bun run user:promote <username>` (tanpa UI).
3. Setelah disetujui, user login dan membuat komunitas di `/create-community`. Pembuat otomatis menjadi **super admin** (`owner`) komunitas itu. Batas awal: satu komunitas per user.
4. Super admin menambah pengurus lain dengan **membuatkan akun langsung** (username, nama, password awal), berperan `admin` di komunitas itu saja. Akun baru wajib ganti password saat login pertama. Password awal dikirim super admin lewat chat.

Hak akses:

| | Super admin | Admin |
|---|---|---|
| Lihat dan ubah konten (pengumuman, agenda, kontak, dataset) | ya | ya |
| Ubah info komunitas (nama, password `protected`) | ya | tidak |
| Tambah user, reset password user, hapus user | ya | tidak |
| Hapus komunitas | ya | tidak |
| Akses komunitas lain | tidak | tidak |

**Platform admin** (operator layanan, bukan pengurus komunitas): tidak bisa membuat atau memulihkan komunitas, dan setelah login dialihkan ke `/platform` yang memuat persetujuan akun dan daftar semua komunitas (nama, slug, super admin, jumlah anggota). Dari daftar itu ia bisa masuk ke komunitas mana pun dengan **akses paksa**: hak setara super admin (ubah info, kelola pengguna, ubah zona waktu, unduh cadangan, hapus), dengan banner di panel admin yang menyatakan ia bukan anggota. Satu-satunya jalan ke akses ini adalah pengecekan `requireMember`, yang memberi `forced: true`. Konsekuensinya platform admin dapat melihat seluruh data komunitas, termasuk laporan dilindungi, jadi akun ini harus dijaga ketat.

Aturan implementasi:
- Semua halaman dan Server Action admin lewat satu pengecekan `requireMember(slug, role?)`: sesi valid, akun disetujui, dan ada membership di komunitas itu dengan role yang cukup. Semua query konten selalu memakai `community_id` hasil pengecekan itu, tidak pernah dari input mentah.
- Data per komunitas hanya bisa diakses anggotanya. Pengecualian: data yang sudah dipublikasikan di halaman publik dapat dilihat siapa saja.
- Menghapus user menghapus sesinya, sehingga aksesnya langsung hilang.
- Satu komunitas memiliki satu super admin. Transfer kepemilikan dan penghapusan super admin di luar cakupan MVP.
- Login diblokir bila akun belum disetujui.
- Pendaftaran dibatasi (rate limit) dan menunggu persetujuan manual, sehingga halaman daftar yang publik tidak bisa disalahgunakan untuk membuat komunitas sembarangan.

## 6. Keamanan

1. Password hash, sesi, dan cookie sesi dikelola Better Auth (cookie `httpOnly`, `secure`, `sameSite=lax`). Sesi disimpan di database.
2. Rate limit login dan pendaftaran memakai fitur bawaan Better Auth dengan penyimpanan di database (agar bekerja di serverless). Header IP dari Vercel dikonfigurasi eksplisit.
3. Password `protected` diverifikasi di server terhadap hash di database. Cookie dibuat **per komunitas**, memuat `community_id`, waktu kedaluwarsa (5 menit), dan sidik jari hash password. Mengganti password otomatis membatalkan cookie lama, dan cookie komunitas A tidak membuka komunitas B.
4. Data `protected` hanya di-query di server setelah cookie valid. Tidak ada pengiriman data ke browser lalu disembunyikan dengan CSS.
5. Halaman `protected` memakai dynamic rendering tanpa cache apa pun (`force-dynamic` dan header `Cache-Control: no-store`).
6. `noindex` lewat meta robots dan header `X-Robots-Tag` untuk semua halaman, ditambah `robots.txt`.
7. Tidak ada secret yang terekspos ke client.
8. Perbandingan password `protected` memakai `timingSafeEqual`.
9. Status nunggak: hanya nama dan status, tanpa nominal dan rincian bulan. Permintaan lebih dari itu perlu peringatan risiko terlebih dahulu.
10. Rate limit percobaan password `protected`: 5 percobaan salah per 10 menit untuk tiap pasangan komunitas dan alamat IP, dihitung sebelum password diperiksa (satu pernyataan SQL atomik) sehingga tebakan paralel ikut terbatas. Password benar mereset hitungan. Risiko yang tersisa: serangan dari banyak IP sekaligus.

## 7. Fase pengembangan

Setiap fase diakhiri dengan berhenti, ringkasan hasil, dan review kode dengan temuan dikelompokkan Critical / High / Medium / Low. Setiap perubahan di-commit; push dilakukan manual oleh pemilik proyek.

### Fase 0 — Fondasi (selesai)
Scaffold Next.js, Prisma + Postgres, skema konten, landing page, route komunitas, halaman "tidak ditemukan", `robots.txt`, header `noindex`.

### Fase 1A — Fondasi akun (selesai)
- Pasang Better Auth, plugin `username`, kolom tambahan user (`approved`, `is_platform_admin`, `must_change_password`), tabel akun di skema Prisma, migrasi.
- Register (`/register`), login (`/login`), logout. Login ditolak bila belum disetujui.
- Halaman `/platform` untuk menyetujui akun (hanya platform admin).
- Rate limit di database, konfigurasi header IP.
- Selesai bila: user baru tidak bisa login sebelum disetujui, setelah disetujui bisa login dan logout, dan percobaan login berulang kena rate limit.

### Fase 1B — Komunitas, role, dan pengguna (selesai)
- Tabel `memberships`, pengecekan `requireMember(slug, role?)`.
- `/create-community` dengan slug otomatis dari nama, validasi slug termasuk daftar terlarang, pembuat menjadi super admin. `revalidateTag` dan `revalidatePath` saat komunitas dibuat (agar 404 yang ter-cache tidak menetap).
- `/admin` (daftar komunitas milik user), `/admin/[slug]/settings` (ubah nama), `/admin/[slug]/users` (tambah admin, reset password, hapus user), `/change-password`.
- Selesai bila: admin komunitas A tidak bisa membuka atau memanipulasi komunitas B (diuji lewat URL dan Server Action), admin biasa ditolak di halaman pengaturan dan pengguna, dan user yang dihapus langsung kehilangan akses.

### Fase 1C — Konten dan halaman publik (selesai)
- CRUD pengumuman (draft/publik), agenda, dan kontak penting, semua dibatasi `community_id`.
- Halaman publik menampilkan ketiganya dengan ISR, dan revalidate saat data berubah.
- Selesai bila: pengurus dapat mengelola konten, halaman publik langsung terbarui, dan data draft tidak tampil di publik.

### Fase 2 — Dataset dari Excel (selesai)
- Pasang SheetJS dari tarball resmi (versi 0.20.3, diverifikasi di docs SheetJS).
- Alur import di browser admin: unggah file, pilih sheet, pilih baris header, lihat preview, simpan. Membaca nilai hasil formula, bukan teksnya. Menangani merged cell dan header yang bukan di baris 1.
- Simpan ke `datasets` (`columns` dan `rows` sebagai JSONB), dengan validasi ukuran payload dan pesan error yang jelas (batas body Vercel sekitar 4.5MB).
- Tampilan tabel publik dengan scroll horizontal di dalam container.
- Tombol export dataset (cadangan, karena Free plan tidak punya backup yang bisa diandalkan).
- Selesai bila: file Excel contoh yang berantakan berhasil diimport dengan preview benar dan tampil di halaman publik.

### Fase 3 — Mode `protected` (selesai)
- Pengaturan password `protected` per komunitas di admin (hanya super admin, disimpan sebagai hash).
- Form password, verifikasi di server, cookie bertanda tangan per komunitas (5 menit). Super admin, admin, dan platform admin membuka tanpa password.
- Halaman dataset `protected` di route dinamis terpisah (`/[communitySlug]/protected/[id]`) dengan `no-store`. Route publik `/datasets/[id]` untuk dataset `protected` mengarahkan ke sana.
- Rate limit percobaan password.
- Selesai bila: tanpa cookie yang valid tidak ada satu pun data `protected` di HTML maupun respons jaringan, password komunitas A tidak membuka B, dan mengganti password membatalkan akses lama.

### Fase 4 — Polishing dan deploy (kode dan dokumen selesai, deploy menunggu)
- Pengecekan mobile-first (HP kecil dan koneksi lambat), aksesibilitas dasar.
- Deploy ke Vercel Hobby dan verifikasi region `sin1`.
- Panduan satu halaman: akses darurat (reset password super admin yang lupa lewat platform admin) dan cara mengelola akun.
- Review akhir (Critical / High / Medium / Low).

## 8. Di luar cakupan MVP

Login warga, pembayaran iuran, chart, notifikasi, role selain super admin dan admin, transfer kepemilikan komunitas, reset password lewat email, penyimpanan file `.xlsx` asli, surat pengantar. Tidak dikerjakan tanpa persetujuan.

## 9. Risiko

- **Excel bendahara berantakan.** Struktur bisa berubah tiap bulan. Preview dan pemilihan header manual adalah mitigasinya.
- **Pemindaian alamat oleh bot.** Alamat tak dikenal berformat wajar memicu satu query ke database (di-cache satu jam). Mitigasi di kode: validasi format, cache terbatas. Pembatasan laju per IP untuk halaman publik dipasang di platform (lihat RUNBOOK bagian 7).
- **Cold start Neon Free.** Compute tertidur setelah 5 menit idle, sehingga request pertama bisa lambat. ISR mengurangi dampaknya untuk halaman publik.
- **Tanpa backup otomatis.** Pengaman yang ada: cadangan lengkap per komunitas (JSON, super admin) yang bisa dipulihkan lewat `/create-community`, plus ekspor laporan. Cadangan tidak berisi password dan akun, dan tetap manual: perlu kebiasaan mengunduh secara berkala. Penjadwalan otomatis belum ada.
- **Kebocoran data `protected` lewat cache.** Dimitigasi dengan dynamic rendering, `no-store`, dan pengujian eksplisit di Fase 3.
- **Kebocoran data antar komunitas.** Risiko terbesar dari sistem multi-komunitas: satu query tanpa filter `community_id` membocorkan data. Dimitigasi dengan satu pintu `requireMember` dan pengujian lintas komunitas di Fase 1B.
- **Tidak ada reset password lewat email.** Super admin yang lupa password harus direset manual oleh platform admin. Password awal admin dikirim lewat chat, sehingga wajib diganti saat login pertama.
- **Platform admin hanya lewat database.** Tidak ada UI untuk menandai platform admin; dilakukan manual lewat SQL.
- **Ketergantungan pada Better Auth.** Library masih aktif berkembang (1.x). Versi dikunci dan diperbarui secara sadar.
- **Data nama warga dan status nunggak.** Perlu ditinjau bersama ketua RT dan pihak terkait sebelum dipakai warga.

## 10. Pertanyaan terbuka

1. Apakah struktur file Excel bendahara seragam tiap bulan atau berubah-ubah? (Menentukan apakah perlu template.)
2. Konfirmasi persetujuan ketua RT untuk menampilkan nama penunggak (ditinjau bersama pihak terkait).
3. Domain: `*.vercel.app` dulu. Siapa yang membayar domain tahunan dan atas nama siapa belum diputuskan.
4. Batas satu komunitas per user: cukup, atau perlu lebih?
