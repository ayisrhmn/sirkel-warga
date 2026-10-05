// Makes an existing account an approved platform admin.
// Run with: bun run user:promote <username>
import { getDb } from "@/lib/db";

async function main() {
  const username = process.argv[2]?.toLowerCase();
  if (!username) throw new Error("Usage: bun run user:promote <username>");

  const db = getDb();
  try {
    const { count } = await db.user.updateMany({
      where: { username },
      data: { approved: true, isPlatformAdmin: true },
    });
    if (count === 0) throw new Error(`No user with username "${username}"`);
    console.log(`${username} is now an approved platform admin.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
