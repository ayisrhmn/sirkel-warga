// Run with: npm run db:seed (inserts one sample community, safe to re-run).
import { getDb } from "@/lib/db";

async function main() {
  const db = getDb();
  try {
    await db.community.upsert({
      where: { slug: "rt05-melati-contoh" },
      update: {},
      create: { slug: "rt05-melati-contoh", name: "RT 05 Melati (contoh)" },
    });
    console.log("Seeded: /rt05-melati-contoh");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
