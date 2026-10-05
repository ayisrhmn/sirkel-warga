import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { getDb } from "@/lib/db";

const db = getDb();

export const auth = betterAuth({
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
