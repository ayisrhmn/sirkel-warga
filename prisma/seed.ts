// Run with: npm run db:seed (inserts one sample community, safe to re-run).
import { getDb } from "@/lib/db";

const db = getDb();
await db.community.upsert({
  where: { slug: "rt05-melati-contoh" },
  update: {},
  create: { slug: "rt05-melati-contoh", name: "RT 05 Melati (contoh)" },
});
console.log("Seeded: /rt05-melati-contoh");
await db.$disconnect();
