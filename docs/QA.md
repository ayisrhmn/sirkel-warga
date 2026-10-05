# Skenario QA Manual — Sirkel (Fase 0 sampai 2)

Dokumen ini untuk menguji Sirkel secara manual di browser. Yang diuji: halaman publik, akun, komunitas, role dan isolasi, konten, dan laporan dari Excel. Mode lindung password (Fase 3) belum ada, jadi tidak termasuk.

Sudah ada tes otomatis (`bun run test`) untuk logika izin, isolasi komunitas, parser Excel, dan validasi. Skenario di bawah fokus pada hal yang **belum bisa dicek otomatis**: tampilan, form di browser, alur impor Excel di layar, perilaku cache, dan pengalaman di HP. Skenario bertanda **[Prioritas]** adalah yang paling mungkin menemukan masalah.

## 1. Persiapan

1. Pastikan Postgres lokal menyala dan `.env.local` berisi `DATABASE_URL`, `BETTER_AUTH_URL=http://localhost:3000`, `BETTER_AUTH_SECRET`.
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
- Diharapkan: halaman ramah "Komunitas tidak ditemukan" dengan "Cek lagi link dari pengurus.", bukan error mentah.
- Perhatikan: teks ini muncul setelah JavaScript jalan (perilaku Next.js yang sudah diketahui). Di DevTools aktifkan throttling "Slow 4G" lalu muat ulang. Catat apakah layar kosong terlihat lama dan apakah itu mengganggu.
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
- Username `qa_owner1` yang sudah dipakai → "Username sudah dipakai."
- [ ] Lolos

**B3. [Prioritas] Akun belum disetujui tidak bisa masuk**
- Daftarkan `qa_pending`. Di `/login`, masuk dengan akun itu.
- Diharapkan: "Akun belum disetujui." dan tetap di halaman login. Membuka `/admin` langsung mengarah ke `/login`.
- [ ] Lolos

**B4. Platform admin pertama**
- Daftarkan `qa_platform`, lalu jalankan `bun run user:promote qa_platform`. Diharapkan keluar `qa_platform is now an approved platform admin.`
- Login sebagai `qa_platform`. Di `/admin` ada link "Persetujuan akun".
- [ ] Lolos

**B5. [Prioritas] Menyetujui dan menolak akun**
- Di `/platform` (login `qa_platform`): daftar menampilkan `qa_owner1` dan `qa_pending` (dan akun lain yang menunggu), lengkap nama dan username.
- Klik "Setujui" pada `qa_owner1`. Diharapkan: ia hilang dari daftar. Login sebagai `qa_owner1` kini berhasil.
- Daftarkan akun `qa_tolak`, klik "Tolak". Diharapkan: akun hilang dari daftar dan tidak bisa login (username bisa didaftarkan lagi).
- Setujui `qa_owner2` juga. Biarkan `qa_pending` menunggu.
- [ ] Lolos

**B6. Hanya platform admin yang melihat `/platform`**
- Login sebagai `qa_owner1`, buka `/platform`. Diharapkan: halaman 404. Link "Persetujuan akun" tidak ada di menu.
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
- Buka `/dawis-matahari-sektor-3` (404). Biarkan tab terbuka.
- Lalu buat komunitas (C3), dan segera muat ulang `/dawis-matahari-sektor-3`.
- Diharapkan: halaman komunitas langsung tampil, bukan 404 yang tersimpan di cache.
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

## D. Role dan isolasi komunitas

Siapkan: Komunitas 1 (`qa_owner1`) dan Komunitas 2 (`qa_owner2`). Beri tiap komunitas satu pengumuman agar ada data (lihat bagian E).

**D1. Super admin membuat admin**
- Login `qa_owner1`, buka menu "Pengguna". Isi nama "QA Admin 1", username `qa_admin1`, password awal `password-uji-1`, klik "Buat akun admin".
- Diharapkan: pesan hijau "Akun @qa_admin1 dibuat. Kirim password awalnya secara pribadi; akun wajib menggantinya saat login pertama." Daftar pengguna menampilkan `qa_admin1` sebagai "Admin" dan `qa_owner1` sebagai "Super admin".
- Username kembar atau password pendek → pesan error, isi form tetap ada.
- [ ] Lolos

**D2. [Prioritas] Admin wajib ganti password**
- Di jendela lain, login `qa_admin1` (`password-uji-1`).
- Diharapkan: langsung dialihkan ke `/change-password` ("Password awalmu dari super admin harus diganti sebelum lanjut."). Mengetik `/admin` atau `/admin/dawis-matahari-sektor-3` di address bar tetap kembali ke `/change-password`.
- Coba: password lama salah → "Password lama salah."; password baru sama dengan lama → "Password baru harus berbeda dari yang lama."; konfirmasi beda → "Konfirmasi password tidak sama."
- Ganti ke `password-baru-2` dengan benar → masuk ke dashboard komunitas. Logout, login dengan `password-uji-1` ditolak, dengan `password-baru-2` berhasil.
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
- Diharapkan: dialihkan ke `/admin` ("Kamu belum punya komunitas."), `/dawis-matahari-sektor-3` menjadi 404, akun `qa_admin_hapus` tidak bisa login, akun `qa_owner1` masih bisa login dan boleh membuat komunitas baru. Komunitas 2 tetap utuh.
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

**E4. Agenda dan zona waktu WIB**
- Menu "Agenda": tambah "Ronda malam", tanggal 3 hari ke depan pukul 19:30, lokasi "Pos ronda".
- Di halaman publik: tampil dengan format seperti "Kamis, 08 Oktober 2026 pukul 19.30" (jam **19.30**, bukan 12.30 atau 02.30), lengkap lokasi.
- Tambah agenda untuk 10 hari yang lalu: **tidak** tampil di halaman publik, tapi tetap ada di daftar admin.
- Tanggal dikosongkan → ditolak browser (kolom wajib diisi).
- Buka form Edit agenda: tanggal dan jam yang terisi sama dengan yang diinput (tidak bergeser).
- [ ] Lolos

**E5. Kontak penting**
- Menu "Kontak": tambah "Budi", peran "Ronda", telepon `0812-3456-7890`, urutan 2; tambah "Ani", peran "Ketua RT", telepon `+62 811 222 333`, urutan 1.
- Publik: Ani tampil sebelum Budi. Nomor adalah link; di HP (atau emulasi), menekannya membuka aplikasi telepon dengan nomor tanpa spasi dan tanda hubung.
- Telepon `halo` → "Nomor telepon 5-20 karakter (angka, +, -, spasi)." Urutan `-1` atau `1000` → "Urutan harus angka 0-999."
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
- Buka `/dawis-matahari-sektor-3`: tidak ada bagian "Laporan". Buka langsung `/dawis-matahari-sektor-3/datasets/<id>` (id dari URL detail admin): 404.
- [ ] Lolos

**F5. Laporan publik**
- Impor `2-ringkasan-kas.xlsx` dengan judul "Ringkasan kas", periode "Oktober 2026", tampilan "Publik".
- Halaman publik menampilkan bagian "Laporan" dengan "Ringkasan kas" (dan periodenya). Klik: tabel 4 baris, "Saldo" bernilai "549.999,5" (formula terhitung), "Pengeluaran kebersihan" "350.000,5".
- Di HP atau emulasi layar sempit (360px): halaman tidak bisa digeser menyamping, hanya tabelnya jika terlalu lebar.
- Ubah ke Draft di detail admin: langsung hilang dari publik (link lama 404).
- [ ] Lolos

**F6. [Prioritas] Laporan dilindungi: baris tidak boleh bocor**
- Ubah "Iuran Oktober 2026" menjadi "Dilindungi password" dan simpan.
- Halaman komunitas: laporan tampil dengan label "Dilindungi". Klik: judul dan periode tampil, dengan pesan "Laporan ini dilindungi password. Tanyakan password-nya ke pengurus.", **tanpa tabel**.
- Buka View Source halaman itu dan cari "Budi Santoso". Tidak boleh ada. Di tab Network (Doc dan Fetch/XHR), juga tidak boleh ada data tabel.
- (Penginputan password belum ada sampai Fase 3: ini perilaku yang diharapkan.)
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
- Coba file Excel asli dari bendahara RT (salin dulu, jangan pakai aslinya). Catat: apakah header terdeteksi benar, apakah ada kolom persen atau mata uang yang tampilannya berubah (format "Rp" dan "%" tidak dibawa, angka ditampilkan polos dengan titik ribuan), apakah header dua baris atau lebih terbaca wajar (hanya satu baris header yang didukung), dan apakah ada sel dengan tanggal yang salah.
- [ ] Dicoba, catatan: ____________________

**F10. Ekspor cadangan**
- Di detail laporan: "Unduh CSV" → file `.csv`, buka di Excel/Sheets: kolom benar, huruf dan angka utuh (baris TOTAL ada).
- Di daftar laporan: "Unduh cadangan semua laporan (JSON)" → file `.json` berisi komunitas, dan semua laporan lengkap dengan kolom dan baris (termasuk yang draft dan dilindungi).
- Tanpa login, buka URL export langsung: dialihkan ke `/login`. Login sebagai user komunitas lain lalu buka URL export komunitas ini: 404.
- [ ] Lolos

---

## G. Tampilan dan HP

**G1. [Prioritas] Emulasi HP**
- DevTools → Toggle device toolbar, pilih ukuran kecil (iPhone SE atau 360x640). Telusuri: `/`, halaman komunitas, halaman laporan, `/login`, `/register`, seluruh menu admin, form impor.
- Diharapkan: tidak ada scroll horizontal pada halaman (kecuali di dalam tabel lebar), teks terbaca, tombol cukup besar untuk ditekan, menu admin membungkus ke baris berikutnya dengan rapi.
- [ ] Lolos

**G2. Koneksi lambat**
- Throttling "Slow 4G" dan "Fast 3G", buka halaman komunitas. Catat waktu hingga isi tampil dan ukuran transfer. Halaman publik tidak boleh memuat library Excel (cek tab Network: tidak ada chunk besar berisi "xlsx" di halaman publik).
- [ ] Lolos

**G3. Mode gelap**
- Ubah tema sistem ke gelap (atau emulasi `prefers-color-scheme: dark` di DevTools → Rendering). Telusuri halaman publik dan admin.
- Diharapkan: teks terbaca, garis tepi kartu dan tabel terlihat, pesan error merah dan sukses hijau terbaca.
- [ ] Lolos

**G4. HP sungguhan**
- Catatan: login dari HP lewat alamat LAN akan ditolak karena `BETTER_AUTH_URL` ditetapkan ke `localhost`. Uji di HP sungguhan setelah deploy ke Vercel (Fase 4), atau minimal buka halaman publik lewat IP LAN.
- [ ] Ditunda ke Fase 4

---

## H. Keamanan dan akses

**H1. [Prioritas] Halaman admin tanpa login**
- Dalam jendela Incognito (belum login), buka satu per satu: `/admin`, `/admin/dawis-matahari-sektor-3`, `.../announcements`, `.../datasets`, `.../datasets/import`, `.../datasets/export`, `/platform`, `/change-password`, `/create-community`.
- Diharapkan: semuanya dialihkan ke `/login`.
- [ ] Lolos

**H2. Akses silang lewat id**
- Login `qa_owner2`. Salin URL detail laporan milik Komunitas 1 (`/admin/dawis-matahari-sektor-3/datasets/<id>`) dan buka: 404.
- Ubah slug di URL admin Komunitas 2 menjadi id laporan Komunitas 1, misalnya `/admin/rt-05-melati/datasets/<id-komunitas-1>`: 404.
- [ ] Lolos

**H3. Halaman publik tidak membocorkan data admin**
- View source halaman komunitas dan halaman laporan. Tidak boleh ada: hash password, email sintetis (`@users.sirkel.local`), data draft, atau data komunitas lain.
- [ ] Lolos

**H4. Header cache**
- Halaman publik komunitas memiliki `Cache-Control: s-maxage=3600, stale-while-revalidate=...`. Halaman admin dan export tidak boleh ter-cache (`no-store` atau dinamis).
- [ ] Lolos

---

## I. Yang sengaja belum ada (jangan dilaporkan sebagai bug)

- Membuka laporan `protected` dengan password (Fase 3). Saat ini hanya ada pemberitahuan terkunci.
- Batas percobaan password untuk laporan `protected` (Fase 3).
- Reset password lewat email. Super admin yang lupa password hanya bisa direset manual oleh platform admin.
- Perubahan zona waktu per komunitas: semua waktu WIB.
- Paginasi di halaman publik (maksimal 20 pengumuman, 20 agenda, 50 kontak, 50 laporan).
- Tampilan di HP sungguhan, deploy ke Vercel, dan panduan akses darurat (Fase 4).
- Impor ulang ke laporan yang sudah ada: tiap impor membuat laporan baru.

## J. Ringkasan hasil

| Bagian | Jumlah skenario | Lolos | Gagal | Catatan |
|---|---|---|---|---|
| A. Halaman publik dasar | 3 | | | |
| B. Akun dan persetujuan | 8 | | | |
| C. Komunitas | 5 | | | |
| D. Role dan isolasi | 8 | | | |
| E. Konten publik | 7 | | | |
| F. Laporan dari Excel | 10 | | | |
| G. Tampilan dan HP | 4 | | | |
| H. Keamanan dan akses | 4 | | | |
