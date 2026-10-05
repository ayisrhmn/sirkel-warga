# Runbook Sirkel — deploy, password, dan akses darurat

Panduan operasional untuk pemilik proyek (platform admin). Semua perintah dijalankan dari folder proyek.

## 1. Rangkuman variabel environment

| Variabel | Isi | Di mana |
|---|---|---|
| `DATABASE_URL` | URL Neon **pooled** (host berakhiran `-pooler`) | Vercel |
| `DIRECT_URL` | URL Neon **direct** (tanpa `-pooler`), hanya untuk migrasi | Komputermu saat migrasi |
| `BETTER_AUTH_URL` | Alamat aplikasi, mis. `https://sirkel-warga.vercel.app` (tanpa garis miring di akhir) | Vercel |
| `BETTER_AUTH_SECRET` | Acak, `openssl rand -base64 32` | Vercel |
| `COOKIE_SECRET` | Acak, `openssl rand -base64 32`, minimal 16 karakter | Vercel |

Jangan pernah memakai awalan `NEXT_PUBLIC_` untuk variabel apa pun. Jangan simpan secret di repo.

## 2. Deploy pertama

### 2.1 Database di Neon (Free)
1. Buat project di Neon, pilih region **Singapore** (`aws-ap-southeast-1`).
2. Salin dua connection string dari tombol **Connect**: yang **pooled** (untuk `DATABASE_URL`) dan yang **direct** (untuk `DIRECT_URL`).
3. Jalankan migrasi sekali (dari komputermu, ganti dengan URL direct dari Neon):
   ```bash
   DIRECT_URL='postgresql://...direct...' bun run db:deploy
   ```
   Perintah ini juga dijalankan setiap kali ada migrasi baru di `prisma/migrations`.
4. Jika muncul error koneksi, coba hapus parameter `channel_binding=require` dari connection string.

### 2.2 Aplikasi di Vercel (Hobby)
1. Push repo ke GitHub (kamu yang melakukannya), lalu **Add New → Project** di Vercel dan impor repo itu. Framework terdeteksi sebagai Next.js dan bun terdeteksi dari `bun.lock`.
2. Isi environment variable dari tabel di atas (kecuali `DIRECT_URL`).
3. Deploy. Region fungsi sudah diatur ke Singapore (`sin1`) lewat `vercel.json`. Paket Hobby hanya mengizinkan satu region.
4. Setelah `BETTER_AUTH_URL` sesuai alamat produksi, deploy ulang bila perlu (perubahan env baru berlaku setelah deploy baru).

**Preview deployment (branch lain, pull request).** Setiap preview punya alamat sendiri. Isi `BETTER_AUTH_URL` hanya untuk lingkungan **Production** di Vercel, sehingga preview memakai alamatnya sendiri (otomatis lewat `VERCEL_URL`) dan login tetap jalan. Build tidak butuh `DATABASE_URL`, tapi aplikasi yang berjalan butuh `DATABASE_URL`, `BETTER_AUTH_SECRET`, dan `COOKIE_SECRET` untuk lingkungan Preview. **Jangan** mengarahkan preview ke database produksi: buat *branch* Neon terpisah untuk preview, supaya uji coba tidak menyentuh data warga.

### 2.3 Memeriksa region
Buka halaman yang dinamis, mis. `https://<alamat>/admin`, dan lihat header `x-vercel-id`:
```bash
curl -sI https://<alamat>/admin | grep -i x-vercel-id
```
Bagian kedua harus `sin1` (bentuknya `xxx1::sin1::...`). Bagian pertama adalah lokasi edge terdekat dan boleh berbeda. Region fungsi juga tampil di ringkasan deployment di dashboard Vercel.

### 2.4 Akun pertama
1. Buka `/register` di alamat produksi dan daftarkan akunmu.
2. Jadikan akun itu platform admin (dari komputermu, dengan `DATABASE_URL` Neon):
   ```bash
   DATABASE_URL='postgresql://...pooled-atau-direct...' bun run user:promote <username>
   ```
3. Login. Kamu langsung masuk ke halaman **Platform**: di sana kamu menyetujui akun lain dan melihat daftar semua komunitas. Akun platform admin tidak bisa membuat komunitas; kalau kamu juga ingin mengelola komunitas sendiri, daftarkan akun biasa kedua untuk itu. Bila perlu, **Kelola (akses paksa)** membuka panel komunitas mana pun dengan hak super admin (untuk membantu, mengubah, atau menghapus).

### 2.5 Sebelum link dibagikan ke warga
- [ ] Jalankan skenario di [QA.md](QA.md), terutama yang bertanda Prioritas.
- [ ] Buka halaman komunitas di HP sungguhan lewat sinyal biasa.
- [ ] Pastikan password laporan dilindungi sudah diatur (Pengaturan) bila ada laporan berstatus Dilindungi.
- [ ] `https://<alamat>/robots.txt` berisi `Disallow: /` dan tidak ada halaman yang muncul di Google.
- [ ] Cadangan pertama sudah diunduh (lihat bagian 5).

## 3. Mengganti password

| Siapa | Cara |
|---|---|
| Diri sendiri (semua pengurus) | Menu **Ganti password** di panel admin (`/change-password`). Perlu password lama. |
| Admin yang lupa password | Super admin komunitasnya: menu **Pengguna**, buka **Reset password** pada akun itu, isi password sementara. Admin akan keluar dari semua perangkat dan wajib memilih password baru saat login berikutnya. |
| Super admin yang lupa password | Platform admin: lihat bagian 4. |
| Password laporan dilindungi (untuk warga) | Super admin: menu **Pengaturan**, bagian **Password laporan dilindungi**. Mengganti password mengeluarkan semua pengunjung yang sebelumnya sudah membuka laporan. |

Bagikan password sementara hanya lewat pesan pribadi, bukan grup.

## 4. Akses darurat

Untuk akun mana pun yang tidak bisa login (super admin, admin, atau platform admin sendiri). Perlu akses ke `DATABASE_URL` produksi.

```bash
DATABASE_URL='postgresql://...neon...' bun run user:reset-password <username>
```

- Password sementara dibuat acak dan ditampilkan **sekali** di layar. Sampaikan ke pemilik akun secara pribadi.
- Akun keluar dari semua perangkat dan wajib mengganti password saat login berikutnya.
- Jika kamu memberi password sendiri: `bun run user:reset-password <username> <password>` (minimal 8 karakter). Cara ini meninggalkan password di riwayat shell, jadi sebaiknya biarkan dibuat acak.

Hal lain yang bisa dilakukan lewat database bila perlu:

| Kebutuhan | Cara |
|---|---|
| Menyetujui akun yang menunggu | Halaman `/platform`, atau `bun run user:promote <username>` (ini sekaligus menjadikannya platform admin, jadi pakai `/platform` untuk akun biasa). |
| Melihat apakah migrasi sudah diterapkan | `DIRECT_URL='...' bunx prisma migrate status` |

## 5. Cadangan dan pemulihan

Paket Free Neon tidak bisa diandalkan sebagai cadangan, jadi cadangan dari aplikasi adalah satu-satunya pengaman.

| Cadangan | Siapa | Di mana | Isi |
|---|---|---|---|
| **Cadangan lengkap (JSON)** | Super admin | Menu **Pengaturan**, atau link di ringkasan admin | Info komunitas, pengumuman (termasuk draft), agenda, kontak, semua laporan (termasuk Dilindungi dan draft), dan daftar nama anggota |
| Cadangan laporan (JSON) | Semua pengurus | Menu **Laporan** | Semua laporan komunitas |
| CSV satu laporan | Semua pengurus | Detail laporan | Satu tabel, bisa dibuka di Excel |

Yang **tidak** ada di cadangan, dengan sengaja: password (hash password laporan dilindungi maupun akun) dan akun pengguna. Dengan begitu file cadangan tidak membocorkan kredensial. Tetap simpan di tempat yang aman, bukan di grup chat, karena isinya memuat data laporan yang dilindungi.

### Memulihkan komunitas
1. Super admin yang komunitasnya terhapus (atau database baru) login, lalu buka `/create-community`. Halaman ini hanya bisa dipakai akun yang belum punya komunitas.
2. Di bagian **Atau pulihkan dari cadangan**, pilih file `.json`. Kosongkan kolom slug untuk memakai slug di cadangan, atau isi slug lain bila slug lama sudah dipakai.
3. Komunitas kembali dengan semua isinya, dan pemulih menjadi super admin-nya. Halaman publik langsung tampil.
4. Setelah itu, lakukan dua hal karena keduanya tidak ada di cadangan: atur lagi **password laporan dilindungi** di Pengaturan, dan buat ulang **akun admin** di menu Pengguna (daftar nama anggota lama ada di dalam file cadangan sebagai pengingat).

### Kebiasaan yang disarankan
- Unduh cadangan lengkap sebelum perubahan besar (impor laporan, hapus data) dan secara berkala, mis. awal tiap bulan.
- Setiap super admin menyimpan cadangan komunitasnya sendiri. Platform admin tidak otomatis punya salinan semua komunitas, jadi bila seluruh database hilang, pemulihan dilakukan per komunitas dari file masing-masing.
- Uji pemulihan sekali di awal (lihat skenario D9 di [QA.md](QA.md)), supaya prosesnya sudah dikenal sebelum dibutuhkan.

## 6. Perilaku yang wajar

- **Permintaan pertama setelah lama sepi lebih lambat** (beberapa detik). Database Neon Free tertidur setelah 5 menit tanpa aktivitas lalu bangun otomatis. Halaman publik yang sudah ter-cache tidak terpengaruh.
- **Halaman publik langsung berubah setelah pengurus menyimpan**, dan agenda yang sudah lewat hilang sendiri paling lambat satu jam kemudian.
- **Laporan dilindungi:** pengunjung memasukkan password, lalu akses berlaku 15 menit di perangkat itu. Super admin, admin, dan platform admin yang sedang login membuka laporan tanpa password. Lima kali salah dalam 10 menit mengunci percobaan dari alamat IP itu sementara, dan 100 tebakan salah dalam satu jam (dari alamat mana pun) mengunci pengunjung baru untuk komunitas itu sampai jamnya lewat. Pengunjung yang sudah membuka laporan tidak terpengaruh. Password laporan dilindungi minimal 8 karakter.

## 7. Bot dan pemindaian

Alamat yang formatnya wajar tapi tidak ada (mis. `/abc-def`) menyebabkan satu pencarian ke database, lalu hasilnya di-cache satu jam. Bot yang menebak banyak alamat bisa membuat database Neon terus terbangun dan menghabiskan jatah komputasi. Aplikasi sudah menolak alamat berformat salah tanpa menyentuh database dan membatasi umur cache, tetapi pembatasan laju per IP untuk halaman publik sebaiknya dipasang di platform, bukan di kode. Vercel punya Firewall per project (Settings, Firewall) yang bisa membatasi jumlah request per IP; cek aturan apa yang tersedia di paketmu sebelum mengandalkannya. Pantau juga pemakaian jam komputasi di dashboard Neon beberapa minggu pertama.

## 8. Masalah umum

| Gejala | Kemungkinan penyebab dan solusi |
|---|---|
| Login atau daftar gagal dengan pesan umum, atau "Invalid origin" di log | `BETTER_AUTH_URL` tidak sama persis dengan alamat yang dibuka di browser. Perbaiki lalu deploy ulang. |
| Halaman laporan dilindungi menampilkan "Terjadi kesalahan" | `COOKIE_SECRET` belum diisi di Vercel (minimal 16 karakter). |
| Semua halaman data menampilkan "Terjadi kesalahan" | `DATABASE_URL` salah, atau Neon sedang bangun. Coba muat ulang beberapa detik kemudian. |
| Slug baru tetap "Komunitas tidak ditemukan" | Seharusnya tidak terjadi bila komunitas dibuat lewat aplikasi (cache dibersihkan saat komunitas dibuat). Jika komunitas dibuat langsung lewat database, deploy ulang untuk membersihkan cache. |
| Impor Excel gagal "File tidak bisa dibaca" | File bukan `.xlsx`/`.xls`/`.csv` asli, atau rusak. Buka dan simpan ulang dari Excel. |
