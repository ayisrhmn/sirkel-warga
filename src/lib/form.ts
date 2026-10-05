import { notFound } from "next/navigation";

export const getString = (data: FormData, key: string) =>
  String(data.get(key) ?? "").trim();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Row ids come from bound Server Action arguments, which the client can
// forge. A malformed uuid would make Prisma throw, so answer 404 instead.
export function requireUuid(id: string) {
  if (!UUID_RE.test(id)) notFound();
}
