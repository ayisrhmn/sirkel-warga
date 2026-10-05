import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Migrations need a direct (non-pooled) Neon URL. Set DIRECT_URL when
    // DATABASE_URL is the pooled one; otherwise DATABASE_URL is used.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
