# Skenario QA Manual — Sirkel

Dokumen ini untuk menguji Sirkel secara manual di browser, sebelum dideploy. Yang diuji: halaman publik, akun, komunitas, role dan isolasi, cadangan, konten, laporan dari Excel, laporan dilindungi password, tampilan HP, dan keamanan dasar. Deploy ke Vercel dan uji di HP sungguhan ada di [RUNBOOK.md](RUNBOOK.md).

Sudah ada tes otomatis (`bun run test`) untuk logika izin, isolasi komunitas, parser Excel, validasi, serta gerbang password dan rate limit. Skenario di bawah fokus pada hal yang **belum bisa dicek otomatis**: tampilan, form di browser, alur impor Excel di layar, perilaku cache, dan pengalaman di HP. Skenario bertanda **[Prioritas]** adalah yang paling mungkin menemukan masalah.

## Cara memakai dokumen ini

**Perkiraan waktu:** sekitar 3 sampai 4 jam bila dikerjakan semua. Skenario **[Prioritas]** saja sekitar 1,5 jam.

**Urutan yang disarankan.** Beberapa skenario mengubah atau menghapus data yang dipakai skenario lain, jadi kerjakan berurutan:

1. A, lalu B (akun), lalu C (komunitas).
2. D1 sampai D7 (role dan isolasi), lalu E (konten) dan F (laporan Excel), lalu G (laporan dilindungi). Skenario E sampai G memakai data dari bagian D.
3. **D9 (cadangan dan pemulihan) sebelum D8 (hapus komunitas).** D8 menghapus Komunitas 1, dan D9 memakai isinya. Setelah D8/D9, buat ulang Komunitas 1 bila masih ada yang perlu diuji.
4. D10 (akses darurat), D11 (platform admin, lakukan sebelum D8 selesai menghapus komunitas bila ingin memakainya), I (keamanan), dan H (tampilan dan HP) di akhir.

**Mengosongkan data uji kapan saja** (misalnya kalau data kacau dan mau mulai dari awal):

```bash
docker exec postgres18 psql -U postgres -d sirkel -c 'delete from communities' -c 'delete from "user"' -c 'delete from "rateLimit"'
```

**Melaporkan masalah.** Catat ID skenario (mis. F6b), langkah yang kamu lakukan, apa yang kamu lihat, dan apa yang diharapkan. Screenshot layar dan tab Network membantu. Jangan lupa menulisnya di kolom Catatan di ringkasan paling bawah.

## 1. Persiapan

1. Pastikan Postgres lokal menyala dan `.env.local` berisi `DATABASE_URL`, `BETTER_AUTH_URL=http://localhost:3000`, `BETTER_AUTH_SECRET`, dan `COOKIE_SECRET`.
2. Siapkan database bersih:
   ```bash
   bun install
   bun run db:deploy
   bun run dev
   ```
3. Buka `http://localhost:3000`. Gunakan **Chrome** dengan DevTools (F12) terbuka di tab Network.
4. Siapkan dua profil browser atau satu jendela biasa dan satu jendela Incognito, supaya bisa login sebagai dua user sekaligus.
5. File Excel contoh ada di folder [docs/qa](qa/):

| File | Isi | Dipakai untuk |
|---|---|---|
| `1-iuran-oktober-berantakan.xlsx` | Judul di-merge, header di baris 4, kolom Blok di-merge, formula, tanggal, kolom kosong, baris kosong, baris total, 2 sheet | Skenario impor utama |
| `2-ringkasan-kas.xlsx` | Tabel bersih 4 baris, Saldo berupa formula | Laporan publik |
| `3-terlalu-banyak-baris.xlsx` | 1200 baris | Batas baris |
| `4-terlalu-banyak-kolom.xlsx` | 35 kolom | Batas kolom |
| `5-bukan-excel.xlsx` | Teks biasa yang diberi ekstensi `.xlsx` | File rusak |
| `6-header-bertingkat.xlsx` | Judul kolom dua baris ("Iuran" di atas "Kebersihan" dan "Keamanan"), format "Rp" dan persen | Judul bertingkat dan format angka |
| `7-kas-bulanan-contoh.xlsx` | Mirip file kas bendahara: 20 warga (nama palsu) dengan iuran per bulan di baris 3 sampai 22, ringkasan kas (TOTAL, PENGELUARAN, PEMASUKAN, SALDO) di baris 23 sampai 26, saldo awal di baris 28 | Satu file jadi dua laporan, dan tabel lebar di HP |

Bikin ulang file contoh kapan saja dengan `bun scripts/make-qa-samples.ts`.

### Akun uji

| Username | Peran | Dibuat lewat |
|---|---|---|
| `qa_platform` | Platform admin (kamu) | Daftar, lalu `bun run user:promote qa_platform` |
| `qa_owner1` | Super admin Komunitas 1 | Daftar, disetujui lewat `/platform` |
| `qa_owner2` | Super admin Komunitas 2 | Daftar, disetujui lewat `/platform` |
| `qa_admin1` | Admin Komunitas 1 | Dibuat oleh `qa_owner1` |
| `qa_pending` | Belum disetujui | Daftar, jangan disetujui dulu |

Password semua akun uji: `password-uji-1`.

Komunitas uji: **Komunitas 1** = "Dawis Matahari - Sektor 3" (slug `dawis-matahari-sektor-3`), **Komunitas 2** = "RT 05 Melati" (slug `rt-05-melati`).

Tandai tiap skenario dengan `[x]` jika lolos. Jika gagal, catat apa yang kamu lihat.

---

## A. Halaman publik dasar

**A1. Landing page**
- Buka `/`.
- Diharapkan: judul "Sirkel", tagline "Info lingkungan, satu link.", penjelasan, petunjuk "Buka lewat link yang dibagikan pengurus RT-mu...", footer berisi link "Login pengurus" dan teks "Dibuat sukarela untuk warga.". Tidak ada daftar komunitas, tombol daftar, atau gambar besar.
- [ ] Lolos

**A2. Tidak terindeks mesin pencari**
- Buka `/robots.txt`. Diharapkan isinya `User-Agent: *` dan `Disallow: /`.
- Di tab Network, buka `/` dan lihat Response Headers. Diharapkan ada `X-Robots-Tag: noindex, nofollow`.
- View source `/`: ada `<meta name="robots" content="noindex, nofollow">`.
- [ ] Lolos

**A3. [Prioritas] Link tidak dikenal**
- Buka `/tidak-ada-komunitas` dan `/Slug_Salah.php`.
- Diharapkan: halaman ramah "Komunitas tidak ditemukan" dengan "Cek lagi link dari pengurus.", langsung tampil (tanpa menunggu JavaScript). Matikan JavaScript di DevTools (Command Menu, "Disable JavaScript") dan muat ulang: pesannya tetap terlihat. Status HTTP-nya 200 untuk alamat satu segmen seperti ini, dan 404 untuk alamat bertingkat tak dikenal seperti `/a/b/c`; keduanya sengaja.
- Huruf besar pada link tidak jadi masalah: bila komunitas `dawis-matahari-sektor-3` ada, `/DAWIS-Matahari-Sektor-3` menampilkan halaman yang sama (tanpa pengalihan).
- [ ] Lolos

---

## B. Akun dan persetujuan

**B1. Pendaftaran berhasil**
- Buka `/register`. Isi nama "QA Owner 1", username `qa_owner1`, password `password-uji-1` di kedua kolom.
- Diharapkan: pesan "Pendaftaran berhasil. Akunmu menunggu persetujuan, kamu bisa masuk setelah disetujui."
- [ ] Lolos

**B2. Validasi form pendaftaran**
- Username `ab` (terlalu pendek) → "Username 3-30 karakter: huruf kecil, angka, titik, atau garis bawah."
- Username `Ada Spasi` → pesan yang sama.
- Password dan ulangi password berbeda → "Konfirmasi password tidak sama."
- Password 5 karakter → browser menolak (minimal 8).
- Password yang sangat mudah ditebak, mis. `12345678`, `password123`, `qwertyui`, atau yang sama dengan atau memuat username → "Password terlalu mudah ditebak. Pakai kombinasi yang lebih panjang atau acak." Aturan yang sama berlaku saat super admin membuat atau mereset akun admin, saat ganti password, dan untuk password laporan dilindungi.
- Username `qa_owner1` yang sudah dipakai → "Username sudah dipakai."
- Setiap kolom password punya ikon mata di kanan: menekannya menampilkan isinya (ikon berubah jadi mata dicoret), menekan lagi menyembunyikannya. Menahan kursor di atasnya menampilkan keterangan "Tampilkan password" atau "Sembunyikan password". Tombol itu tidak mengirim form. Ada di kolom password di `/login`, `/register`, `/change-password`, dan form buka laporan dilindungi. Coba juga di tampilan HP: area tekannya cukup besar dan teks panjang tidak tertutup ikon.
- [ ] Lolos

**B3. [Prioritas] Akun belum disetujui tidak bisa masuk**
- Daftarkan `qa_pending`. Di `/login`, masuk dengan akun itu.
- Diharapkan: "Akun belum disetujui." dan tetap di halaman login. Membuka `/admin` langsung mengarah ke `/login`.
- [ ] Lolos

**B4. Platform admin pertama**
- Daftarkan `qa_platform`, lalu jalankan `bun run user:promote qa_platform`. Diharapkan keluar `qa_platform is now an approved platform admin.`
- Login sebagai `qa_platform`. Diharapkan langsung dialihkan ke halaman **Platform** (`/platform`), bukan `/admin`. Di sana ada bagian "Akun menunggu persetujuan", "Komunitas", serta link "Ganti password" dan "Keluar".
- [ ] Lolos

**B5. [Prioritas] Menyetujui dan menolak akun**
- Di `/platform` (login `qa_platform`): daftar menampilkan `qa_owner1` dan `qa_pending` (dan akun lain yang menunggu), lengkap nama dan username.
- Klik "Setujui" pada `qa_owner1`. Diharapkan: ia hilang dari daftar. Login sebagai `qa_owner1` kini berhasil.
- Daftarkan akun `qa_tolak`, klik "Tolak". Diharapkan: akun hilang dari daftar dan tidak bisa login (username bisa didaftarkan lagi).
- Setujui `qa_owner2` juga. Biarkan `qa_pending` menunggu.
- [ ] Lolos

**B6. Hanya platform admin yang melihat `/platform`**
- Login sebagai `qa_owner1`, buka `/platform`. Diharapkan: halaman 404. Link "Platform" tidak ada di menu.
- Tanpa login, buka `/platform`: diarahkan ke `/login`.
- [ ] Lolos

**B7. Login, logout, dan sesi**
- Login `qa_owner1` → masuk ke `/admin`. Klik "Keluar" → kembali ke `/login`. Menekan tombol Back lalu memuat ulang `/admin` tetap mengarah ke `/login`.
- Di DevTools, tab Application → Cookies: cookie sesi (`better-auth.session_token`) bertanda **HttpOnly**.
- [ ] Lolos

**B8. [Prioritas] Batas percobaan login**
- Di `/login`, masukkan password salah untuk username apa saja sebanyak 6 kali berturut-turut dalam satu menit.
- Diharapkan: 5 kali pertama "Username atau password salah.", yang ke-6 "Terlalu banyak percobaan. Coba lagi sebentar lagi." Setelah sekitar satu menit bisa mencoba lagi.
- Catatan: ini menghalangi tes lain sementara waktu. Lakukan sebagai skenario terakhir di bagian ini, atau kosongkan dengan `docker exec postgres18 psql -U postgres -d sirkel -c 'delete from "rateLimit"'`.
- [ ] Lolos

---

## C. Komunitas

**C1. Pengguna tanpa komunitas**
- Login `qa_owner1` (belum punya komunitas). Di `/admin`: "Kamu belum punya komunitas." dengan link "Buat komunitas".
- [ ] Lolos

**C2. [Prioritas] Link yang dibuka sebelum komunitas ada**
- Buka `/dawis-matahari-sektor-3` (muncul "Komunitas tidak ditemukan"). Biarkan tab terbuka.
- Lalu buat komunitas (C3), dan segera muat ulang `/dawis-matahari-sektor-3`.
- Diharapkan: halaman komunitas langsung tampil, bukan pesan "tidak ditemukan" yang masih tersimpan di cache.
- [ ] Lolos

**C3. Membuat komunitas dan slug otomatis**
- Di `/create-community` ketik nama "Dawis Matahari - Sektor 3".
- Diharapkan: kolom slug terisi otomatis `dawis-matahari-sektor-3`, dengan catatan "Tidak bisa diubah setelah dibuat. Link: /dawis-matahari-sektor-3".
- Ubah slug secara manual, lalu ubah nama lagi: slug tidak lagi ikut berubah (karena sudah diedit). Kembalikan ke `dawis-matahari-sektor-3`, klik "Buat komunitas".
- Diharapkan: masuk ke `/admin/dawis-matahari-sektor-3`. Menu menampilkan nama komunitas dan "QA Owner 1 (Super admin)".
- [ ] Lolos

**C4. Validasi slug**
- Dengan `qa_owner2` di `/create-community`, coba slug: `admin`, `login`, `api`, `register` → "Slug ini tidak bisa dipakai."; `Slug_Salah` atau `-awal` → "Slug hanya boleh huruf kecil, angka, dan tanda hubung."; `ab` → "Slug 3-50 karakter."; `dawis-matahari-sektor-3` → "Slug sudah dipakai, coba yang lain."
- Nama "ab" → "Nama komunitas 3-80 karakter."
- Buat dengan nama "RT 05 Melati" (slug `rt-05-melati`). Diharapkan berhasil.
- [ ] Lolos

**C5. Satu komunitas per akun**
- Sebagai `qa_owner1`, buka `/create-community` secara langsung. Diharapkan: dialihkan ke `/admin`.
- [ ] Lolos

---

## D. Role, isolasi, cadangan, akses darurat, dan platform admin

Siapkan: Komunitas 1 (`qa_owner1`) dan Komunitas 2 (`qa_owner2`). Beri tiap komunitas satu pengumuman agar ada data (lihat bagian E).

**D1. Super admin membuat admin**
- Login `qa_owner1`, buka menu "Pengguna". Isi nama "QA Admin 1", username `qa_admin1`, password awal `password-uji-1`, klik "Buat akun admin".
- Diharapkan: pesan hijau "Akun @qa_admin1 dibuat. Kirim password awalnya secara pribadi; akun wajib menggantinya saat login pertama." Daftar pengguna menampilkan `qa_admin1` sebagai "Admin" dan `qa_owner1` sebagai "Super admin".
- Kolom "Password awal" tersembunyi (titik-titik) dan punya ikon mata untuk menampilkannya, supaya super admin bisa memeriksa dan menyalinnya sebelum mengirimnya. Hal yang sama berlaku untuk kolom reset password admin (D5) dan password laporan dilindungi di Pengaturan (G1).
- Username kembar atau password pendek → pesan error, isi form tetap ada.
- [ ] Lolos

**D2. [Prioritas] Admin wajib ganti password**
- Di jendela lain, login `qa_admin1` (`password-uji-1`).
- Diharapkan: langsung dialihkan ke `/change-password` ("Password awalmu dari super admin harus diganti sebelum lanjut."). Mengetik `/admin` atau `/admin/dawis-matahari-sektor-3` di address bar tetap kembali ke `/change-password`.
- Coba: password lama salah → "Password lama salah."; password baru sama dengan lama → "Password baru harus berbeda dari yang lama."; konfirmasi beda → "Konfirmasi password tidak sama."
- Ganti ke `password-baru-2` dengan benar → masuk ke dashboard komunitas. Logout, login dengan `password-uji-1` ditolak, dengan `password-baru-2` berhasil.
- Menu admin punya link "Ganti password" (untuk semua pengurus, bukan hanya saat dipaksa). Link itu membuka `/change-password` dengan form yang sama; password baru yang mudah ditebak (mis. `12345678`) ditolak.
- [ ] Lolos

**D3. [Prioritas] Admin tidak bisa mengelola komunitas dan pengguna**
- Sebagai `qa_admin1`: menu hanya menampilkan Ringkasan, Pengumuman, Agenda, Kontak, Laporan, Halaman publik. **Tidak ada** "Pengguna" dan "Pengaturan".
- Ketik langsung `/admin/dawis-matahari-sektor-3/users` dan `/admin/dawis-matahari-sektor-3/settings`. Diharapkan: 404.
- Buka `/create-community`: dialihkan ke `/admin`.
- [ ] Lolos

**D4. [Prioritas] Isolasi antar komunitas lewat URL**
- Login `qa_owner2` (Komunitas 2). Ketik di address bar:
  - `/admin/dawis-matahari-sektor-3`
  - `/admin/dawis-matahari-sektor-3/users`
  - `/admin/dawis-matahari-sektor-3/announcements`
  - `/admin/dawis-matahari-sektor-3/datasets`
- Diharapkan: semuanya 404, tanpa petunjuk bahwa komunitas itu ada.
- Ulangi dengan `qa_admin1` terhadap `/admin/rt-05-melati/...`: juga 404.
- [ ] Lolos

**D5. Reset password admin**
- Sebagai `qa_owner1` di "Pengguna": untuk `qa_admin1` buka "Reset password", isi `password-reset-3`, simpan. Diharapkan: "Password direset. Akun wajib menggantinya saat login berikutnya."
- Di jendela `qa_admin1` (masih login), muat ulang halaman. Diharapkan: sesi hilang, kembali ke `/login`.
- Login `qa_admin1` dengan `password-baru-2` gagal; dengan `password-reset-3` berhasil dan diarahkan ke `/change-password`.
- [ ] Lolos

**D6. [Prioritas] Menghapus admin langsung mencabut akses**
- Sebagai `qa_owner1`, saat `qa_admin1` sedang login di jendela lain, klik "Hapus akun" untuk `qa_admin1` dan setujui dialog konfirmasi.
- Diharapkan: akun hilang dari daftar. Di jendela `qa_admin1`, muat ulang atau klik menu apa saja: kembali ke `/login`. Login lagi gagal.
- Super admin tidak punya tombol hapus untuk dirinya sendiri.
- [ ] Lolos

**D7. Mengganti nama komunitas**
- Sebagai `qa_owner1`: "Pengaturan" → ganti nama jadi "Dawis Matahari Sektor 3", simpan. Diharapkan: "Nama komunitas disimpan." dan nama di menu admin ikut berubah. Slug tetap.
- Buka `/dawis-matahari-sektor-3` di tab lain: nama baru langsung tampil.
- Nama "ab" → "Nama komunitas 3-80 karakter."
- [ ] Lolos

**D8. Menghapus komunitas**
- Buat admin baru `qa_admin_hapus` di Komunitas 1. Lalu di "Pengaturan" bagian "Hapus komunitas": ketik slug yang salah → "Ketik slug komunitas dengan benar untuk menghapus."; ketik slug benar → klik hapus.
- Diharapkan: dialihkan ke `/admin` ("Kamu belum punya komunitas."), `/dawis-matahari-sektor-3` menampilkan "Komunitas tidak ditemukan", akun `qa_admin_hapus` tidak bisa login, akun `qa_owner1` masih bisa login dan boleh membuat komunitas baru. Komunitas 2 tetap utuh.
- Bagian "Hapus komunitas" memuat peringatan untuk mengunduh cadangan lengkap dulu. Lakukan D9 sebelum skenario ini bila ingin menguji pemulihan.
- [ ] Lolos

**D9. [Prioritas] Cadangan lengkap dan pemulihan**
- Siapkan Komunitas 1 dengan isi: pengumuman publik dan draft, agenda, kontak, satu laporan Publik, satu Dilindungi, satu Draft, password laporan dilindungi sudah diatur, dan satu admin.
- Sebagai `qa_owner1`: Pengaturan → "Unduh cadangan lengkap (JSON)". Link yang sama ada di ringkasan admin. Diharapkan unduhan `dawis-matahari-sektor-3-cadangan-<tanggal>.json`.
- Buka file itu di editor teks. Harus ada: pengumuman (termasuk draft), agenda, kontak, ketiga laporan, dan daftar nama anggota. **Tidak boleh ada**: kata "scrypt", password apa pun, atau id internal.
- Sebagai `qa_admin1` (admin biasa): buka `/admin/dawis-matahari-sektor-3/backup` langsung → 404. Tanpa login → `/login`. Super admin komunitas lain → 404.
- Hapus Komunitas 1 (D8). Lalu, masih login sebagai `qa_owner1`, buka `/create-community` dan di bagian "Atau pulihkan dari cadangan" pilih file tadi, klik "Pulihkan komunitas".
- Diharapkan: masuk ke `/admin/dawis-matahari-sektor-3`. Pengumuman publik dan draft, agenda, kontak, dan ketiga laporan kembali persis seperti semula (status Publik/Dilindungi/Draft sama, isi tabel sama). Halaman publik `/dawis-matahari-sektor-3` langsung tampil. Yang **tidak** kembali: password laporan dilindungi (Pengaturan menyatakan belum diatur) dan akun `qa_admin1`.
- Coba pulihkan lagi saat sudah punya komunitas: "Kamu sudah punya komunitas." Dengan akun lain tanpa komunitas, memakai file yang sama dan slug yang sudah dipakai: "Slug sudah dipakai. Isi slug lain di bawah." lalu isi slug lain, berhasil.
- File yang bukan cadangan (mis. `5-bukan-excel.xlsx` atau JSON sembarang): "File cadangan tidak valid." dan tidak ada komunitas baru.
- [ ] Lolos

**D10. Akses darurat: reset password dari terminal**
- Dari folder proyek: `bun run user:reset-password qa_owner1`.
- Diharapkan: terminal menampilkan `Temporary password for qa_owner1: <password acak>` dan "Share it privately. The account must change it at the next login."
- Jika `qa_owner1` sedang login di browser, muat ulang halaman: sesi hilang, kembali ke `/login`. Login dengan password lama ditolak. Login dengan password sementara berhasil dan langsung dialihkan ke `/change-password`.
- `bun run user:reset-password tidak_ada` → "No user with username ..."; `bun run user:reset-password qa_owner1 12345678` → ditolak (password terlalu mudah ditebak); tanpa username → pesan penggunaan.
- [ ] Lolos

**D11. [Prioritas] Platform admin: daftar komunitas, akses paksa, dan batasannya**
- Siapkan: `qa_platform` (platform admin) dan dua komunitas milik `qa_owner1` dan `qa_owner2`.
- Login `qa_platform`. Di halaman **Platform**, bagian "Komunitas (2)" menampilkan tiap komunitas: nama, `/slug`, tanggal dibuat, super admin (nama dan username), dan jumlah anggota, dengan link "Kelola (akses paksa)", "Pengaturan dan hapus", dan "Halaman publik".
- **Tidak bisa membuat komunitas:** buka `/create-community` langsung → dialihkan ke `/platform`. Buka `/admin` → dialihkan ke `/platform`. Tidak ada tombol "Buat komunitas" di mana pun untuk akun ini.
- Klik "Kelola (akses paksa)" pada komunitas yang bukan miliknya. Diharapkan: panel admin komunitas itu terbuka dengan kotak kuning "Akses paksa platform admin. Kamu bukan anggota komunitas ini...", label di bawah nama komunitas berbunyi "(Platform admin)", dan menu lengkap termasuk **Pengguna** dan **Pengaturan**.
- Lakukan perubahan: ganti nama komunitas, tambah satu pengumuman, ubah zona waktu. Semuanya berhasil dan halaman publik komunitas itu langsung berubah. "Unduh cadangan lengkap" juga bisa.
- "Pengaturan dan hapus" → hapus komunitas dengan mengetik slug-nya. Diharapkan: kembali ke `/platform`, komunitas hilang dari daftar, akun super admin-nya masih ada (bisa login dan membuat komunitas baru), dan komunitas lain tidak terpengaruh.
- Alamat komunitas yang tidak ada, mis. `/admin/tidak-ada`: 404.
- Pembanding: login `qa_owner2` (super admin biasa). Tidak ada kotak kuning di panelnya sendiri, dan `/admin/<slug komunitas lain>` tetap 404. Hanya platform admin yang bisa melakukan akses paksa.
- [ ] Lolos

---

## E. Konten publik

Buat ulang Komunitas 1 jika sudah dihapus di D8. Login sebagai super admin atau admin.

**E1. Pengumuman: draft dan publik**
- Menu "Pengumuman": buat "Kerja bakti" isi dua baris ("Minggu pagi" lalu baris baru "bawa sapu"), status Publik. Buat "Rencana rahasia", status Draft.
- Buka `/dawis-matahari-sektor-3`. Diharapkan: hanya "Kerja bakti" tampil, tanggalnya hari ini (format "5 Oktober 2026"), dan baris baru terjaga. "Rencana rahasia" tidak tampil.
- [ ] Lolos

**E2. [Prioritas] Perubahan langsung tampil di halaman publik**
- Dengan halaman publik terbuka di tab lain, ubah judul "Kerja bakti" jadi "Kerja bakti besar" dan simpan. Muat ulang halaman publik.
- Diharapkan: judul baru **langsung** tampil, tanpa menunggu.
- Ubah "Rencana rahasia" menjadi Publik: langsung muncul. Hapus (konfirmasi dialog): langsung hilang dari publik.
- [ ] Lolos

**E3. Validasi pengumuman**
- Judul "ab" → "Judul 3-120 karakter." Isi kosong tidak bisa dikirim. Saat error, isi form tidak hilang.
- Setelah simpan sukses di form tambah, pesan "Pengumuman disimpan." muncul dan form kosong kembali.
- [ ] Lolos

**E4. Agenda dan zona waktu**
- Menu "Agenda": tambah "Ronda malam", tanggal 3 hari ke depan pukul 19:30, lokasi "Pos ronda".
- Di halaman publik: tampil dengan format seperti "Kamis, 08 Oktober 2026 pukul 19.30" (jam **19.30**, bukan 12.30 atau 02.30), lengkap lokasi.
- Tambah agenda untuk 10 hari yang lalu: **tidak** tampil di halaman publik, tapi tetap ada di daftar admin.
- Tanggal dikosongkan → ditolak browser (kolom wajib diisi).
- Buka form Edit agenda: tanggal dan jam yang terisi sama dengan yang diinput (tidak bergeser).
- Label kolom tanggal berbunyi "Tanggal dan jam (WIB)". Di Pengaturan → "Zona waktu", pilih WITA lalu simpan: label berubah jadi WITA dan jam agenda yang ditampilkan bertambah satu jam (momen kejadiannya sama). Agenda baru yang diisi 19:30 tampil sebagai 19.30 WITA. Kembalikan ke WIB setelahnya. Buat komunitas baru: ada pilihan zona waktu di formulirnya.
- [ ] Lolos

**E5. Kontak penting**
- Menu "Kontak": tambah "Budi", peran "Ronda", telepon `0812-3456-7890`, urutan 2; tambah "Ani", peran "Ketua RT", telepon `+62 811 222 333`, urutan 1.
- Publik: Ani tampil sebelum Budi. Setiap nomor tampil sebagai tombol dengan ikon WhatsApp. Menekannya membuka WhatsApp di tab baru ke nomor itu: `0812-3456-7890` menjadi `https://wa.me/6281234567890` dan `+62 811 222 333` menjadi `https://wa.me/62811222333` (cek alamat di status bar saat kursor di atasnya). Di HP yang punya WhatsApp, aplikasinya terbuka langsung ke chat dengan nomor itu. Nomor telepon rumah (mis. `021 ...`) tetap dibuka sebagai link WhatsApp, tapi tidak akan menemukan akun.
- Nomor `halo` → "Nomor telepon 5-20 karakter (angka, +, -, spasi)." Label kolomnya berbunyi "Nomor WhatsApp". Urutan `-1` atau `1000` → "Urutan harus angka 0-999."
- [ ] Lolos

**E6. Halaman publik kosong**
- Komunitas baru tanpa konten menampilkan "Belum ada pengumuman.", "Belum ada agenda.", "Belum ada kontak." dan tidak ada bagian "Laporan".
- [ ] Lolos

**E7. Ringkasan admin**
- Dashboard `/admin/<slug>` menampilkan jumlah: pengumuman publik dan draft, agenda, kontak, laporan; angkanya cocok dengan yang dibuat.
- [ ] Lolos

---

## F. Laporan dari Excel

Login sebagai super admin atau admin. Buka menu "Laporan" → "Impor dari Excel".

**F1. [Prioritas] Impor file berantakan**
- Pilih `1-iuran-oktober-berantakan.xlsx`.
- Diharapkan: muncul pilihan sheet ("Iuran Oktober" dan "Catatan"), "Iuran Oktober" terpilih. Baris tabel mentah ditampilkan, dan **baris 4** (judul kolom: No, Nama Warga, Blok, ...) sudah ter-highlight kuning sebagai tebakan header.
- Bagian "Kolom yang disimpan" memuat 8 kolom: No, Nama Warga, Blok, Telepon, Iuran Kebersihan, Iuran Keamanan, Total, Tanggal Bayar (kolom kosong tidak muncul).
- Pratinjau: "9 baris, 8 kolom". Isi: kolom Blok terisi "A" untuk empat baris pertama dan "B" untuk empat berikutnya (hasil sel yang di-merge), kolom Total berisi 75.000 (hasil formula, bukan rumusnya), tanggal bayar seperti "01/10/2026" dan kosong untuk Dodi dan Hendra, baris TOTAL di akhir (200.000, 400.000, 600.000), tidak ada baris kosong.
- Angka tampil dengan titik ribuan ("25.000") dan rata kanan.
- [ ] Lolos

**F2. Mengubah pilihan di layar impor**
- Pilih baris 1 sebagai header: pratinjau berubah (nama kolom jadi judul laporan, dan seterusnya), kembalikan ke baris 4.
- Hilangkan centang "Telepon": pratinjau menjadi 7 kolom tanpa telepon.
- Pilih sheet "Catatan": pratinjau berubah. Kembali ke "Iuran Oktober".
- Ada keterangan bahwa file dibaca di browser dan tidak diunggah. Di tab Network, tidak ada request unggah file `.xlsx` (hanya request simpan di langkah berikutnya).
- [ ] Lolos

**F3. Menyimpan sebagai draft**
- Isi judul "Iuran Oktober 2026", periode "Oktober 2026", tampilan "Draft", klik "Simpan laporan".
- Diharapkan: dialihkan ke daftar laporan: "Iuran Oktober 2026" dengan "Oktober 2026 · Draft (belum tampil) · Diimpor <tanggal>".
- Buka detailnya: tabel lengkap, "9 baris", tanpa kolom Telepon (jika tadi dihilangkan).
- [ ] Lolos

**F4. [Prioritas] Draft tidak terlihat publik**
- Buka `/dawis-matahari-sektor-3`: tidak ada bagian "Laporan". Buka langsung `/dawis-matahari-sektor-3/datasets/<id>` (id dari URL detail admin): 404. (Untuk alamat laporan seperti ini, halaman 404 bisa tampil kosong sebentar sebelum pesannya muncul; itu diketahui, lihat bagian J.)
- [ ] Lolos

**F5. Laporan publik**
- Impor `2-ringkasan-kas.xlsx` dengan judul "Ringkasan kas", periode "Oktober 2026", tampilan "Publik".
- Halaman publik menampilkan bagian "Laporan" dengan "Ringkasan kas" (dan periodenya). Klik: tabel 4 baris, "Saldo" bernilai "549.999,5" (formula terhitung), "Pengeluaran kebersihan" "350.000,5".
- Di HP atau emulasi layar sempit (360px): halaman tidak bisa digeser menyamping, hanya tabelnya jika terlalu lebar.
- Ubah ke Draft di detail admin: langsung hilang dari publik (link lama 404).
- [ ] Lolos

**F6. [Prioritas] Laporan dilindungi muncul dengan label**
- Ubah "Iuran Oktober 2026" menjadi "Dilindungi password" dan simpan.
- Halaman komunitas: laporan tampil dengan label "Dilindungi". Isi dan pengaturan password diuji di bagian G.
- [ ] Lolos

**F6b. Judul bertingkat dan format angka**
- Impor `6-header-bertingkat.xlsx`. Baris 1 ter-highlight sebagai judul. Kolom yang muncul masih "Nama, Blok, Iuran, Iuran (2), Persen bayar" (satu baris judul).
- Ubah "Jumlah baris judul" menjadi 2: baris 1 dan 2 ter-highlight, nama kolom menjadi "Nama, Blok, Iuran Kebersihan, Iuran Keamanan, Persen bayar", dan pratinjau berisi 3 baris data.
- Nilai tampil seperti di Excel: "Rp 25.000", "Rp 50.000", dan "100%", "50%", "25%" (rata kanan).
- Simpan, lalu buka laporan di halaman publik dan unduh CSV: nilainya sama ("Rp 25.000", "100%").
- [ ] Lolos

**F6c. [Prioritas] Satu file, dua laporan (rincian dilindungi, ringkasan publik)**
- Impor `7-kas-bulanan-contoh.xlsx`. Daftar baris mentah bisa di-scroll sampai baris 28 (tidak berhenti di baris 15). Baris 2 terdeteksi sebagai judul.
- **Laporan 1, rincian:** di bagian "Baris yang disimpan" isi Dari baris `3`, Sampai baris `22`. Baris 3 sampai 22 berwarna hijau muda, baris lainnya dan di luar rentang menjadi abu-abu. Pratinjau menampilkan 20 baris. Judul "Rincian iuran", tampilan **Dilindungi password**, klik **"Simpan, lalu buat laporan lain dari file ini"**.
- Diharapkan: tetap di layar yang sama, muncul pesan hijau "Laporan "Rincian iuran" tersimpan..." dengan link "Lihat daftar laporan". Kolom judul dikosongkan dan tampilan kembali ke Draft; file dan pilihan lain tetap.
- **Laporan 2, ringkasan:** Dari baris `23`, Sampai baris `26`. Kolom "No", "Bapak", dan "Ibu" **hilang sendiri** dari daftar kolom (kosong di baris itu). Ubah nama kolom "Blok" menjadi "Keterangan" di kolom isian di sebelah kotak centang. Pratinjau: 4 baris (TOTAL, PENGELUARAN, PEMASUKAN, SALDO), kolom pertama berjudul "Keterangan". Judul "Ringkasan kas", tampilan **Publik**, klik **"Simpan laporan"** (yang biasa): dialihkan ke daftar laporan.
- Di daftar ada dua laporan. Sebagai warga (Incognito): halaman komunitas menampilkan "Ringkasan kas" (tabel terbuka) dan "Rincian iuran" berlabel "Dilindungi" (hanya judul; tanpa password tidak ada nama warga di mana pun, termasuk View Source).
- Coba juga: Dari baris diisi lebih kecil dari baris judul (mis. `1`): tetap tidak mengambil baris judul; Dari baris `50` (di luar data): "Tidak ada data pada baris yang dipilih."; nama kolom dikosongkan: kembali ke nama aslinya; dua kolom diberi nama sama: yang kedua menjadi "... (2)".
- [ ] Lolos

**F6e. [Prioritas] Warna sel dari Excel dan tanda "-"**
- Berkas contoh dari generator tidak punya warna (pustaka yang dipakai hanya bisa membaca warna, tidak bisa menulisnya), jadi pakai file Excel milikmu sendiri yang sel-selnya diberi warna latar (mis. file kas dawis).
- Impor file itu dan lihat pratinjau: warna latar sel data muncul sama seperti di Excel (mis. sel merah untuk yang menunggak, baris SALDO kuning). **Warna baris judul kolom tidak ikut**: judul memakai gaya tampilan Sirkel sendiri.
- Teks di atas warna tetap terbaca (hitam di warna terang, putih di warna gelap). Warna bergaris-garis selang-seling hanya tampil di sel yang tidak berwarna.
- Setiap sel yang kosong (kolom angka maupun teks) tampil sebagai "-" abu-abu.
- Nilai negatif (mis. saldo -59.000, "-Rp 5.000", "-5%") tampil dengan teks **merah**. Di sel dengan latar terang (mis. kuning) tetap merah; di sel dengan latar gelap (mis. merah pekat) teksnya tetap putih supaya terbaca.
- Simpan, lalu buka laporan di halaman publik, halaman admin, dan (untuk yang dilindungi) setelah memasukkan password: warnanya sama. Unduh cadangan (JSON) lalu pulihkan di komunitas baru: warna tetap ada. Laporan lama (dibuat sebelum fitur ini) tampil tanpa warna.
- Catatan: hanya warna isian polos (RGB) yang terbaca. Warna dari tema Excel, warna putih, dan tebal/miring tidak dibawa.
- [ ] Lolos

**F6d. [Prioritas] Tabel lebar di HP**
- Buka laporan hasil F6c (rincian, setelah memasukkan password) dan ringkasan, di emulasi HP lebar 360px (DevTools, device toolbar), lalu di HP sungguhan bila ada.
- Tabel tetap **tabel** di semua ukuran layar (tidak ada tampilan kartu), dengan semua baris dan kolom terlihat, termasuk baris TOTAL, PENGELUARAN, PEMASUKAN, SALDO. Di layar kecil ada tulisan "Geser tabel ke samping untuk melihat kolom lain." (tidak tampil di layar lebar, dan tidak tampil untuk tabel sempit).
- Geser tabel ke kanan: kolom penanda **tetap menempel di kiri**: **"Bapak"** pada rincian (kolom teks pertama, "No" dilewati) atau **"Keterangan"** pada ringkasan, sedangkan kolom lain bergeser di belakangnya. **Garis tepi di kanan kolom yang menempel tetap terlihat (beserta bayangan tipis) saat digeser**, jadi jelas di mana kolom nama berakhir. Garis di bawah judul kolom juga tetap ada. Teks di bawah kolom yang menempel tidak tembus terlihat.
- Kolom "No" ramping (selebar angkanya) dan ikut bergeser pergi (bukan yang menempel). Baris selang-seling tetap terlihat, termasuk di kolom yang menempel.
- **Lebar tabel:** tabel memenuhi lebar halaman (full width) dan digeser di dalam bingkainya bila isinya lebih lebar. **Kolom berisi angka (bulan, jumlah) rata kanan, baik judul maupun angkanya**, jadi judul tepat di atas angka. Ini ditentukan per kolom: bila sebagian besar isinya angka, judulnya ikut rata kanan; bila isinya teks, judul dan isinya rata kiri. Kolom teks (Bapak, Ibu, Blok) rata kiri dan "No" di tengah.
- Halaman itu sendiri tidak ikut bergeser ke samping; hanya tabelnya.
- **Kolom penanda di HP:** di bawah 768px, kolom yang menempel dikunci selebar sekitar 144px dan teksnya boleh **turun baris** bila panjang, bukan satu baris panjang. Kolom "No" **disembunyikan** di HP bila ada kolom nama. Catat berapa kolom bulan yang terlihat sekaligus di HP 360px (harapannya 2 sampai 3) dan apakah barisnya masih enak dibaca walau lebih tinggi. Di layar 768px ke atas, kolom nama tetap satu baris dan kolom No tampil.
- Tabel tanpa kolom nama (mis. semua angka) tidak berubah: kolom No tetap tampil di HP.
- [ ] Lolos

**F7. Edit metadata dan hapus**
- Di detail: ganti judul dan periode, simpan → "Perubahan disimpan." dan tampilan publik ikut berubah.
- Judul "ab" → "Judul 3-120 karakter."
- "Hapus laporan" → dialog konfirmasi; setelah setuju kembali ke daftar dan laporan hilang. Batal di dialog → tidak terhapus.
- [ ] Lolos

**F8. Batas dan file bermasalah**
- `3-terlalu-banyak-baris.xlsx` → pratinjau "1200 baris"; klik simpan → "Maksimal 1000 baris. Pecah laporan menjadi beberapa bagian." Tidak ada laporan tersimpan.
- `4-terlalu-banyak-kolom.xlsx` → klik simpan → "Maksimal 30 kolom. Sembunyikan kolom yang tidak perlu." Hilangkan centang 5 kolom, simpan: berhasil.
- `5-bukan-excel.xlsx` → "File tidak bisa dibaca. Pastikan formatnya .xlsx, .xls, atau .csv."
- File lebih dari 5 MB: buat dengan `head -c 6000000 /dev/urandom > /tmp/besar.xlsx` → "File terlalu besar (maksimal 5 MB)."
- Judul laporan kosong atau "ab" → "Judul 3-120 karakter."
- File CSV sederhana (buat di editor teks, dua kolom) → terbaca.
- [ ] Lolos

**F9. File sungguhan dari bendahara**
- Coba file Excel asli dari bendahara RT (salin dulu, jangan pakai aslinya). Catat: apakah header terdeteksi benar, apakah kolom persen dan "Rp" tampil seperti di Excel (format lain seperti `$` atau satuan khusus tampil sebagai angka polos dengan titik ribuan), apakah header dua atau tiga baris terbaca wajar (gunakan "Jumlah baris judul"), dan apakah ada sel dengan tanggal yang salah.
- [ ] Dicoba, catatan: ____________________

**F10. Ekspor cadangan**
- Di detail laporan: "Unduh CSV" → file `.csv`, buka di Excel/Sheets: kolom benar, huruf dan angka utuh (baris TOTAL ada).
- Di daftar laporan: "Unduh cadangan semua laporan (JSON)" → file `.json` berisi komunitas, dan semua laporan lengkap dengan kolom dan baris (termasuk yang draft dan dilindungi). Cadangan seluruh komunitas ada di skenario D9.
- Tanpa login, buka URL export langsung: dialihkan ke `/login`. Login sebagai user komunitas lain lalu buka URL export komunitas ini: 404.
- [ ] Lolos

---

## G. Laporan dilindungi password (Fase 3)

Siapkan: Komunitas 1 dengan satu laporan "Dilindungi" (mis. impor `1-iuran-oktober-berantakan.xlsx` dengan tampilan "Dilindungi password") dan satu laporan Publik. Siapkan juga Komunitas 2 dengan satu laporan Dilindungi sendiri. Gunakan jendela Incognito sebagai "warga" (tanpa login).

**G1. Super admin mengatur password**
- Login `qa_owner1`, menu "Pengaturan", bagian "Password laporan dilindungi". Sebelum diatur, tulisannya "Belum diatur: laporan berstatus Dilindungi belum bisa dibuka siapa pun."
- Isi `abc` atau `1234567` → "Password 8-64 karakter." (atau browser menolak). Isi `rahasia-rt`, simpan → pesan hijau tentang password disimpan. Tulisan status berubah menjadi "Password sudah diatur...".
- Admin biasa (`qa_admin1`) tidak punya menu "Pengaturan" dan `/admin/dawis-matahari-sektor-3/settings` memberi 404.
- [ ] Lolos

**G2. Peringatan bila password belum diatur**
- Pada komunitas yang belum punya password, buka detail laporan Dilindungi di admin: ada kotak peringatan kuning ("...password komunitas belum diatur...").
- Sebagai warga, buka laporan itu: "Pengurus belum menetapkan password untuk laporan ini." tanpa kolom password dan tanpa tabel.
- [ ] Lolos

**G3. [Prioritas] Gerbang password**
- Di jendela Incognito, buka halaman komunitas, klik laporan berlabel "Dilindungi". Diharapkan: URL `/dawis-matahari-sektor-3/protected/<id>`, judul dan periode tampil, pesan "Laporan ini dilindungi password. Tanyakan password-nya ke pengurus.", dan kolom password dengan tombol "Buka laporan". Tidak ada tabel.
- Masukkan password salah → "Password salah." Masukkan `rahasia-rt` → tabel tampil.
- Muat ulang halaman: tetap terbuka (tanpa minta password lagi). Jendela Incognito lain (baru) tetap diminta password.
- Laporan Dilindungi lain di komunitas yang sama juga langsung terbuka (satu password per komunitas).
- [ ] Lolos

**G4. [Prioritas] Data tidak bocor tanpa password**
- Di jendela Incognito baru (belum membuka), buka halaman laporan dilindungi. View Source dan cari satu nama dari tabel (mis. "Budi Santoso"): tidak boleh ada. Di tab Network, periksa semua respons (Doc, Fetch/XHR, JS): tidak ada data tabel.
- Cek header respons halaman `/protected/<id>`: `Cache-Control: private, no-store, max-age=0`.
- Setelah membuka dengan password benar, Application → Cookies: ada `sirkel_access_<id komunitas>` dengan **HttpOnly**, Path `/dawis-matahari-sektor-3`, dan kedaluwarsa sekitar 7 hari.
- Ubah isi cookie itu secara manual (edit satu karakter) lalu muat ulang: kembali diminta password.
- [ ] Lolos

**G5. Mengganti password mengeluarkan semua pengunjung**
- Dengan laporan terbuka di jendela warga, login `qa_owner1` di jendela lain dan ganti password menjadi `password-baru`.
- Di jendela warga, muat ulang: diminta password lagi. `rahasia-rt` ditolak ("Password salah."), `password-baru` berhasil.
- [ ] Lolos

**G6. [Prioritas] Cookie satu komunitas tidak membuka komunitas lain**
- Buka laporan dilindungi Komunitas 1 dengan password benar. Lalu di jendela yang sama buka laporan dilindungi Komunitas 2: tetap diminta password.
- Password Komunitas 1 dimasukkan di form Komunitas 2 ditolak ("Password salah.").
- [ ] Lolos

**G7. [Prioritas] Batas percobaan**
- Di jendela warga baru, masukkan password salah 5 kali berturut-turut → setiap kali "Password salah."
- Percobaan ke-6, termasuk dengan password yang **benar**: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." Tidak ada cookie yang dibuat.
- Untuk melanjutkan tanpa menunggu 10 menit: `docker exec postgres18 psql -U postgres -d sirkel -c "delete from \"rateLimit\" where key like 'unlock:%'"`
- Masukkan salah 3 kali lalu benar → terbuka. Setelah itu counter di-reset (5 percobaan salah berikutnya kembali diizinkan).
- Catatan: batas per alamat IP dihitung per komunitas, dan di jaringan lokal semua percobaan memakai alamat yang sama. Ada juga batas total **100 tebakan salah per jam per komunitas** (dari alamat mana pun): setelah itu pengunjung baru melihat "Terlalu banyak percobaan gagal pada laporan komunitas ini...", sedangkan yang sudah membuka tetap bisa. Password yang benar tidak dihitung. Ini sudah diuji otomatis; di browser cukup pastikan pesannya terbaca wajar.
- [ ] Lolos

**G8. Tautan dan perubahan status laporan**
- Dari halaman komunitas, laporan Dilindungi menautkan langsung ke `/protected/<id>`.
- Buka `/dawis-matahari-sektor-3/datasets/<id laporan dilindungi>`: dialihkan ke `/protected/<id>`.
- Ubah laporan itu menjadi Publik: `/protected/<id>` dialihkan ke `/datasets/<id>` dan tabel tampil tanpa password. Ubah ke Draft: kedua alamat 404.
- Id sembarang atau id laporan komunitas lain di `/protected/...`: 404.
- [ ] Lolos

---

## H. Tampilan, error, dan HP

**H1. [Prioritas] Emulasi HP**
- DevTools → Toggle device toolbar, pilih ukuran kecil (iPhone SE atau 360x640). Telusuri: `/`, halaman komunitas, halaman laporan, `/login`, `/register`, seluruh menu admin, form impor.
- Diharapkan: tidak ada scroll horizontal pada halaman (kecuali di dalam tabel lebar), teks terbaca, tombol cukup besar untuk ditekan, menu admin membungkus ke baris berikutnya dengan rapi.
- [ ] Lolos

**H2. Koneksi lambat**
- Throttling "Slow 4G" dan "Fast 3G", buka halaman komunitas. Catat waktu hingga isi tampil dan ukuran transfer. Halaman publik tidak boleh memuat library Excel (cek tab Network: tidak ada chunk besar berisi "xlsx" di halaman publik).
- [ ] Lolos

**H3. Selalu terang, walau perangkat memakai mode gelap**
- Ubah tema sistem ke gelap (atau di DevTools: Command Menu, "Emulate CSS prefers-color-scheme: dark"). Telusuri halaman publik, login, dan admin.
- Diharapkan: tampilan **tetap terang** (latar putih, teks gelap), tidak ada bagian yang berubah gelap atau teks terang di atas putih. Kolom isian, pemilih tanggal, dan scrollbar juga tetap terang. Ini disengaja: pengguna utamanya orang tua yang tidak nyaman dengan mode gelap.
- [ ] Lolos

**H4. Halaman error yang ramah**
- Jalankan versi produksi: `bun run build && bun run start` (mode `dev` menampilkan layar error pengembang, bukan halaman ini).
- Ubah port di `DATABASE_URL` pada `.env.local` menjadi port yang salah (mis. `5999`) lalu jalankan ulang `bun run start`. Jangan menghentikan container Postgres: container itu dipakai proyek lain.
- Buka `/dawis-matahari-sektor-3` dan `/admin` (setelah login lama masih tersimpan, atau cukup halaman komunitas). Diharapkan: halaman "Terjadi kesalahan" dengan tombol "Coba lagi", tanpa teks error teknis, jejak stack, atau alamat database.
- Kembalikan port yang benar dan jalankan ulang; tombol "Coba lagi" (atau muat ulang) memulihkan halaman.
- [ ] Lolos

**H5. HP sungguhan**
- Catatan: login dari HP lewat alamat LAN akan ditolak karena `BETTER_AUTH_URL` ditetapkan ke `localhost`. Uji di HP sungguhan setelah deploy ke Vercel, atau minimal buka halaman publik lewat IP LAN.
- [ ] Dikerjakan setelah deploy (RUNBOOK bagian 2.5)

---

## I. Keamanan dan akses

**I1. [Prioritas] Halaman admin tanpa login**
- Dalam jendela Incognito (belum login), buka satu per satu: `/admin`, `/admin/dawis-matahari-sektor-3`, `.../announcements`, `.../datasets`, `.../datasets/import`, `.../datasets/export`, `/platform`, `/change-password`, `/create-community`.
- Diharapkan: semuanya dialihkan ke `/login`.
- [ ] Lolos

**I2. Akses silang lewat id**
- Login `qa_owner2`. Salin URL detail laporan milik Komunitas 1 (`/admin/dawis-matahari-sektor-3/datasets/<id>`) dan buka: 404.
- Ubah slug di URL admin Komunitas 2 menjadi id laporan Komunitas 1, misalnya `/admin/rt-05-melati/datasets/<id-komunitas-1>`: 404.
- [ ] Lolos

**I3. Halaman publik tidak membocorkan data admin**
- View source halaman komunitas dan halaman laporan. Tidak boleh ada: hash password, email sintetis (`@users.sirkel.local`), data draft, atau data komunitas lain.
- [ ] Lolos

**I4. Header cache**
- Halaman publik komunitas memiliki `Cache-Control: s-maxage=3600, stale-while-revalidate=...`. Halaman admin dan export tidak boleh ter-cache (`no-store` atau dinamis).
- [ ] Lolos

**I5. Header keamanan**
- Di tab Network, buka satu halaman apa saja (mis. `/login`) dan lihat Response Headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (kamera, mikrofon, lokasi dimatikan), dan `X-Robots-Tag: noindex, nofollow`.
- [ ] Lolos

---

## J. Yang sengaja belum ada (jangan dilaporkan sebagai bug)

- Membuat password berbeda untuk tiap laporan: ada satu password per komunitas.
- Tombol "kunci kembali" atau keluar dari laporan dilindungi: akses habis setelah 7 hari atau saat password diganti.
- Reset password lewat email. Super admin yang lupa password hanya bisa direset manual oleh platform admin.
- Paginasi di halaman publik (maksimal 20 pengumuman, 20 agenda, 50 kontak, 50 laporan).
- Deploy ke Vercel dan uji di HP sungguhan: dikerjakan setelah QA ini, mengikuti [RUNBOOK.md](RUNBOOK.md).
- Cadangan otomatis terjadwal: cadangan lengkap harus diunduh sendiri oleh super admin.
- Halaman 404 untuk alamat laporan yang tidak ada atau draft (`/slug/datasets/<id>`) bisa tampil kosong sebentar sebelum pesannya muncul (perilaku Next.js yang diketahui). Halaman komunitas sendiri sudah tidak terpengaruh.
- Memindahkan super admin ke orang lain: satu komunitas punya satu super admin.
- Impor ulang ke laporan yang sudah ada: tiap impor membuat laporan baru.

## K. Ringkasan hasil

| Bagian | Jumlah skenario | Lolos | Gagal | Catatan |
|---|---|---|---|---|
| A. Halaman publik dasar | 3 | | | |
| B. Akun dan persetujuan | 8 | | | |
| C. Komunitas | 5 | | | |
| D. Role, isolasi, cadangan, akses darurat, dan platform admin | 11 | | | |
| E. Konten publik | 7 | | | |
| F. Laporan dari Excel | 13 | | | |
| G. Laporan dilindungi | 8 | | | |
| H. Tampilan, error, dan HP | 5 | | | |
| I. Keamanan dan akses | 5 | | | |
