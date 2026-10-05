import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

// Redirects to /login without a valid session, and to /change-password while
// the account still has a temporary password.
export async function requireUser({ allowPasswordChange = false } = {}) {
  const session = await getSession();
  if (!session?.user.approved) redirect("/login");
  if (session.user.mustChangePassword && !allowPasswordChange)
    redirect("/change-password");
  return session.user;
}
