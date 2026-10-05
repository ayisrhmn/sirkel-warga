# Sirkel

Info lingkungan (RT / gang / dasa wisma) dalam satu link: pengumuman, agenda, kontak penting, dan laporan dari Excel. Proyek sukarela, non-komersial.

Rencana pengembangan: [docs/PLAN.md](docs/PLAN.md).

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi variabel (lihat bagian Environment dan Database)
npm run db:deploy            # terapkan migrasi ke database
npm run dev
```

## Environment

| Variabel | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi Postgres |
| `DIRECT_URL` | Opsional, URL non-pooled untuk migrasi |
| `BETTER_AUTH_URL` | URL dasar aplikasi, mis. `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Kunci auth, buat dengan `openssl rand -base64 32` |

## Database

Development memakai Postgres lokal, production memakai Neon (region Singapore). Kodenya sama, hanya `DATABASE_URL` yang berbeda.

```bash
docker run -d --name sirkel-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sirkel -p 5432:5432 postgres:17
# .env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sirkel
```

## Akun

Akun baru mendaftar di `/daftar` dan baru bisa login setelah disetujui. Akun pertama (platform admin) disetujui lewat perintah berikut, sesudahnya persetujuan dilakukan di `/platform`.

```bash
npm run user:promote -- <username>
```

## Skrip

| Perintah | Fungsi |
|---|---|
| `npm run db:migrate` | Buat dan terapkan migrasi dari `prisma/schema.prisma` (development) |
| `npm run db:deploy` | Terapkan migrasi yang sudah ada (production) |
| `npm run user:promote -- <username>` | Setujui akun dan jadikan platform admin |

Prisma Client dibuat otomatis ke `src/generated/prisma` lewat `postinstall`. Bila skema berubah, jalankan `npx prisma generate`.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, Neon Postgres, Prisma ORM, Better Auth. Deploy ke Vercel (region `sin1`).
