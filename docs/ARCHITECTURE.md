# Arsitektur

Dokumen ini menjelaskan cara kode dibagi supaya halaman tetap tipis dan komponen bisa dipakai ulang. Aturan di bawah dijaga oleh ESLint (`eslint.config.mjs`), jadi pelanggaran langsung terlihat di `bun run lint`.

## Lapisan

```
src/
  app/                 Presentasi: route Next.js. Halaman hanya mengambil data lalu menyusun komponen.
    <route>/actions.ts   Server Action: use case yang mengubah data (validasi, hak akses, tulis ke DB).
    <route>/*-form.tsx   Form khusus route itu, dekat dengan action-nya.
  components/          Presentasi: tampilan murni, tanpa akses data (atomic design, lihat di bawah).
  lib/
    queries/           Membaca data untuk halaman (read use case). Selalu dibatasi `communityId`.
    *.ts               Aturan domain dan infrastruktur: akses (`access.ts`), sesi, Prisma (`db.ts`),
                       Excel, rich text, tanggal, dan sebagainya. Tidak mengimpor `app/` atau `components/`.
```

Arah dependensi: `app` -> `components` dan `lib`; `components` -> `lib` (hanya fungsi murni seperti format tanggal, bukan data access); `lib` tidak bergantung ke atas.

Aturan yang dijaga lint:
- Halaman dan layout tidak boleh memakai `@/lib/db`. Baca data lewat fungsi di `src/lib/queries`.
- Komponen tidak boleh mengimpor `@/lib/db`, `@/lib/queries/*`, `@/lib/auth`, atau `@/app/*`.

## Atomic design (`src/components`)

Satu lapisan hanya boleh mengimpor lapisan di bawahnya.

| Lapisan | Isi | Contoh |
|---|---|---|
| `atoms` | Elemen terkecil, satu tugas, tanpa komposisi | `Button`, `Input`, `Chip`, `Avatar`, `Card`, `Heading`, `Container`, `Ring` |
| `molecules` | Beberapa atom yang bekerja sebagai satu unit | `Field`, `PasswordInput`, `RadioCardGroup`, `Banner`, `StatTile`, `PageHeader`, `NavLink` |
| `organisms` | Bagian halaman yang utuh | `DataTable`, `RichTextEditor`, `AnnouncementCard`, `CommunityHero`, `AdminSidebar` |
| `templates` | Kerangka halaman, menerima isi lewat props | `PublicPage`, `AuthLayout`, `AdminLayout`, `AdminSplit`, `StatusPage` |

Komponen menerima data lewat props dan tidak tahu dari mana datanya. Teks antarmuka berbahasa Indonesia, kode dan nama berkas berbahasa Inggris.

Kapan membuat komponen baru: bila pola yang sama muncul di dua tempat atau lebih. Pola yang baru dipakai sekali cukup ditulis di halamannya.

## Desain token

Warna, font, dan radius didefinisikan sekali di `src/app/globals.css` (`@theme`). Komponen memakai nama token (`bg-primary`, `text-muted`, `border-line`), bukan kode warna. Font dimuat lewat `next/font` di `src/app/layout.tsx` (Bricolage Grotesque untuk judul, Plus Jakarta Sans untuk isi). Helper `cx` (`src/lib/cx.ts`) menggabungkan nama kelas.

Warna utama tiap komunitas disimpan di kolom `primary_color` dan dipasang oleh `ThemeScope` (atom) yang menimpa token `--color-primary`; bayangan gelap dan terangnya dihitung di CSS (`color-mix`). Server hanya memastikan nilainya benar-benar warna (`parsePrimaryColor`, `src/lib/theme.ts`); warna terang tidak ditolak, form cuma menampilkan peringatan kontras (`contrastWarning`). Warna merek Sirkel (`--color-brand`) tidak ikut berubah.

## Menambah halaman admin

1. Fungsi baca data di `src/lib/queries/` (dibatasi `communityId` dari `requireMember`).
2. Server Action di `actions.ts` untuk perubahan data.
3. `page.tsx` memanggil query lalu menyusun `PageHeader`, `AdminSplit`, `FormPanel`, `AdminListItem`, dan komponen lain yang sudah ada.
