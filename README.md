# Sirkel

Info lingkungan (RT / gang / dasa wisma) dalam satu link: pengumuman, agenda, kontak penting, dan laporan dari Excel. Proyek sukarela, non-komersial.

Rencana pengembangan: [docs/PLAN.md](docs/PLAN.md). Deploy dan akses darurat: [docs/RUNBOOK.md](docs/RUNBOOK.md). Skenario uji manual: [docs/QA.md](docs/QA.md).

## Menjalankan

```bash
bun install
cp .env.example .env.local   # isi variabel (lihat bagian Environment dan Database)
bun run db:deploy            # terapkan migrasi ke database
bun run dev
```

## Environment

| Variabel | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi Postgres |
| `DIRECT_URL` | Opsional, URL non-pooled untuk migrasi |
| `BETTER_AUTH_URL` | URL dasar aplikasi, mis. `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Kunci auth, buat dengan `openssl rand -base64 32` |
| `COOKIE_SECRET` | Kunci tanda tangan cookie akses laporan dilindungi (minimal 16 karakter), buat dengan `openssl rand -base64 32` |

## Database

Development memakai Postgres lokal, production memakai Neon (region Singapore). Kodenya sama, hanya `DATABASE_URL` yang berbeda.

```bash
docker run -d --name sirkel-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sirkel -p 5432:5432 postgres:17
# .env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sirkel
```

## Akun

Akun baru mendaftar di `/register` dan baru bisa login setelah disetujui. Akun pertama (platform admin) disetujui lewat perintah berikut, sesudahnya persetujuan dilakukan di `/platform`. Platform admin tidak membuat komunitas: ia melihat daftar semua komunitas di `/platform` dan bisa masuk ke komunitas mana pun (akses paksa) bila perlu.

```bash
bun run user:promote <username>
```

## Skrip

| Perintah | Fungsi |
|---|---|
| `bun run db:migrate` | Buat dan terapkan migrasi dari `prisma/schema.prisma` (development) |
| `bun run db:deploy` | Terapkan migrasi yang sudah ada (production) |
| `bun run user:promote <username>` | Setujui akun dan jadikan platform admin |
| `bun run user:reset-password <username>` | Akses darurat: password sementara untuk akun yang tidak bisa login |
| `bun run test` | Tes unit dan tes integrasi akun, role, konten, dan isolasi komunitas (memakai database `sirkel_test`, dibuat otomatis) |

Prisma Client dibuat otomatis ke `src/generated/prisma` lewat `postinstall`. Bila skema berubah, jalankan `bunx prisma generate`.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, Neon Postgres, Prisma ORM, Better Auth. Deploy ke Vercel (region `sin1`).
