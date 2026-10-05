import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Created on first use so builds and static pages don't need DATABASE_URL.
// Kept on globalThis so dev hot reloads don't open a new client each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  // `next build` imports every route but runs no queries (all pages are
  // dynamic or generated on demand), so a placeholder lets it build without a
  // database, for example in a preview deployment that lacks the variable.
  // At runtime a missing variable is still an immediate, clear error.
  const connectionString =
    process.env.DATABASE_URL ??
    (process.env.NEXT_PHASE === "phase-production-build"
      ? "postgresql://build:build@localhost:5432/build"
      : undefined);
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export function getDb() {
  return (globalForPrisma.prisma ??= create());
}
