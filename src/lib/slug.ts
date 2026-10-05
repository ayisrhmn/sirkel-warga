// Lowercase letters, digits, and hyphens only. Checked before any DB query so
// junk URLs (scanners, typos) never wake up the database.
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SLUG_MIN = 3;
const SLUG_MAX = 50;

// Top-level paths owned by the app. A community slug must never shadow them.
const RESERVED_SLUGS = new Set([
  "login",
  "register",
  "change-password",
  "create-community",
  "admin",
  "platform",
  "api",
  "robots.txt",
  "favicon.ico",
  "sitemap.xml",
  "_next",
]);

// "Dawis Matahari - Sektor 3" -> "dawis-matahari-sektor-3"
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

// Returns a user-facing (Indonesian) error message, or null when valid.
export function validateSlug(slug: string): string | null {
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX)
    return `Slug ${SLUG_MIN}-${SLUG_MAX} karakter.`;
  if (!SLUG_RE.test(slug))
    return "Slug hanya boleh huruf kecil, angka, dan tanda hubung.";
  if (RESERVED_SLUGS.has(slug)) return "Slug ini tidak bisa dipakai.";
  return null;
}
