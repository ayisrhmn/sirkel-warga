import { inferAdditionalFields, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  plugins: [usernameClient(), inferAdditionalFields<typeof auth>()],
});

type AuthError = { code?: string; status?: number; message?: string };

// Maps Better Auth errors to messages for pengurus.
export function authMessage(error: AuthError): string {
  if (error.status === 429) return "Terlalu banyak percobaan. Coba lagi sebentar lagi.";
  if (error.code === "INVALID_USERNAME_OR_PASSWORD") return "Username atau password salah.";
  if (error.code?.includes("USERNAME_IS_ALREADY_TAKEN") || error.code === "USER_ALREADY_EXISTS")
    return "Username sudah dipakai.";
  if (error.status === 403 && error.message) return error.message;
  return "Terjadi kesalahan. Coba lagi.";
}
