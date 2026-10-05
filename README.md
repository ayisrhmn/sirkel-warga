# Sirkel

Info lingkungan (RT / gang / dasa wisma) dalam satu link: pengumuman, agenda, kontak penting, dan laporan dari Excel. Proyek sukarela, non-komersial.

Rencana pengembangan: [docs/PLAN.md](docs/PLAN.md).

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi DATABASE_URL (lihat bagian Database)
npm run db:deploy            # terapkan migrasi ke database
npm run db:seed              # komunitas contoh: /rt05-melati-contoh
npm run dev
```

## Database

Development memakai Postgres lokal, production memakai Neon (region Singapore). Kodenya sama, hanya `DATABASE_URL` yang berbeda.

```bash
docker run -d --name sirkel-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sirkel -p 5432:5432 postgres:17
# .env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sirkel
```

## Skrip database

| Perintah | Fungsi |
|---|---|
| `npm run db:migrate` | Buat dan terapkan migrasi dari `prisma/schema.prisma` (development) |
| `npm run db:deploy` | Terapkan migrasi yang sudah ada (production) |
| `npm run db:seed` | Isi satu komunitas contoh |

Prisma Client dibuat otomatis ke `src/generated/prisma` lewat `postinstall`. Bila skema berubah, jalankan `npx prisma generate`.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, Neon Postgres, Prisma ORM. Deploy ke Vercel (region `sin1`).
