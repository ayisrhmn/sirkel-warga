import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Created on first use so builds and static pages don't need DATABASE_URL.
// Kept on globalThis so dev hot reloads don't open a new client each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export function getDb() {
  return (globalForPrisma.prisma ??= create());
}
