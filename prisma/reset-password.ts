// Emergency access: sets a temporary password for an account that cannot log
// in (for example a super admin who forgot theirs). The account is signed out
// everywhere and must choose a new password at the next login.
// Run with: bun run user:reset-password <username> [temporary-password]
// Without a password, a random one is generated and printed once.
import { randomBytes } from "node:crypto";
import { resetAccountPassword } from "@/lib/account-admin";
import { getDb } from "@/lib/db";
import { passwordProblem } from "@/lib/password-policy";

async function main() {
  const username = process.argv[2]?.toLowerCase();
  if (!username)
    throw new Error("Usage: bun run user:reset-password <username> [temporary-password]");

  // A password typed on the command line stays in the shell history, so
  // generating one is the default.
  const password = process.argv[3] ?? randomBytes(9).toString("base64url");
  if (password.length < 8) throw new Error("The password must be at least 8 characters.");
  if (passwordProblem(password, username)) throw new Error("That password is too easy to guess.");

  try {
    if (!(await resetAccountPassword(username, password)))
      throw new Error(`No user with username "${username}"`);
    console.log(`Temporary password for ${username}: ${password}`);
    console.log("Share it privately. The account must change it at the next login.");
  } finally {
    await getDb().$disconnect();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
