import { createHash, timingSafeEqual } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { getDb } from "@/lib/db";
import { passwordProblem } from "@/lib/password-policy";
import { pruneRateLimitsSometimes } from "@/lib/rate-limit";

const db = getDb();

// Hashed first so the comparison takes the same time whatever the length.
const sameSecret = (given: string, expected: string) =>
  timingSafeEqual(
    createHash("sha256").update(given).digest(),
    createHash("sha256").update(expected).digest(),
  );

export const auth = betterAuth({
  // Production sets BETTER_AUTH_URL. Preview deployments have a different
  // address on every deploy, which Vercel provides as VERCEL_URL.
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // New accounts wait for approval, and admin accounts are created by a
    // super admin on the server: neither should be signed in automatically.
    autoSignIn: false,
  },
  user: {
    additionalFields: {
      approved: { type: "boolean", defaultValue: false, input: false },
      isPlatformAdmin: { type: "boolean", defaultValue: false, input: false },
      mustChangePassword: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },
  plugins: [username({ minUsernameLength: 3, maxUsernameLength: 30 }), nextCookies()],
  rateLimit: {
    enabled: true,
    // Database storage so limits hold across serverless instances.
    storage: "database",
    window: 60,
    max: 30,
    customRules: {
      "/sign-in/username": { window: 60, max: 5 },
      "/sign-up/email": { window: 3600, max: 5 },
    },
  },
  advanced: { ipAddress: { ipAddressHeaders: ["x-forwarded-for"] } },
  hooks: {
    // Optional gate on self-registration: when REGISTRATION_CODE is set, the
    // sign-up request must carry it. Server-side calls (a super admin creating
    // an admin account) have no HTTP request and are not affected.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.request) await pruneRateLimitsSometimes();
      if (ctx.path !== "/sign-up/email" || !ctx.request) return;

      const expected = process.env.REGISTRATION_CODE;
      if (expected) {
        const given = ctx.request.headers.get("x-registration-code") ?? "";
        if (!sameSecret(given, expected))
          throw new APIError("FORBIDDEN", { message: "Kode pendaftaran salah." });
      }

      const { password, username } = (ctx.body ?? {}) as { password?: unknown; username?: unknown };
      const problem = passwordProblem(
        typeof password === "string" ? password : "",
        typeof username === "string" ? username : undefined,
      );
      if (problem)
        throw new APIError("BAD_REQUEST", { message: problem, code: "PASSWORD_TOO_WEAK" });
    }),
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { approved: true },
          });
          if (!user?.approved) {
            throw new APIError("FORBIDDEN", {
              message: "Akun belum disetujui.",
            });
          }
        },
      },
    },
  },
});
