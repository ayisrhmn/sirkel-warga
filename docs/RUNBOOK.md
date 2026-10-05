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
3. Login. Akun lain disetujui di `/platform`.

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

## 5. Cadangan

Paket Free Neon tidak bisa diandalkan sebagai cadangan. Satu-satunya cadangan yang kita punya adalah ekspor dari aplikasi:

- **Semua laporan satu komunitas (JSON):** menu **Laporan**, link **Unduh cadangan semua laporan (JSON)**.
- **Satu laporan (CSV):** halaman detail laporan, link **Unduh CSV**.

Pengumuman, agenda, kontak, dan akun belum punya ekspor. Kebiasaan yang disarankan: unduh cadangan laporan setiap kali selesai mengimpor laporan penting, dan simpan di tempat yang aman (jangan di repo).

## 6. Perilaku yang wajar

- **Permintaan pertama setelah lama sepi lebih lambat** (beberapa detik). Database Neon Free tertidur setelah 5 menit tanpa aktivitas lalu bangun otomatis. Halaman publik yang sudah ter-cache tidak terpengaruh.
- **Halaman publik langsung berubah setelah pengurus menyimpan**, dan agenda yang sudah lewat hilang sendiri paling lambat satu jam kemudian.
- **Laporan dilindungi:** pengunjung memasukkan password sekali, lalu akses berlaku 7 hari di perangkat itu. Lima kali salah dalam 10 menit mengunci percobaan dari alamat IP itu sementara.

## 7. Masalah umum

| Gejala | Kemungkinan penyebab dan solusi |
|---|---|
| Login atau daftar gagal dengan pesan umum, atau "Invalid origin" di log | `BETTER_AUTH_URL` tidak sama persis dengan alamat yang dibuka di browser. Perbaiki lalu deploy ulang. |
| Halaman laporan dilindungi menampilkan "Terjadi kesalahan" | `COOKIE_SECRET` belum diisi di Vercel (minimal 16 karakter). |
| Semua halaman data menampilkan "Terjadi kesalahan" | `DATABASE_URL` salah, atau Neon sedang bangun. Coba muat ulang beberapa detik kemudian. |
| Slug baru tetap "Komunitas tidak ditemukan" | Seharusnya tidak terjadi bila komunitas dibuat lewat aplikasi (cache dibersihkan saat komunitas dibuat). Jika komunitas dibuat langsung lewat database, deploy ulang untuk membersihkan cache. |
| Impor Excel gagal "File tidak bisa dibaca" | File bukan `.xlsx`/`.xls`/`.csv` asli, atau rusak. Buka dan simpan ulang dari Excel. |
