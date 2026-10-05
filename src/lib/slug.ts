// Lowercase letters, digits, and hyphens only. Checked before any DB query so
// junk URLs (scanners, typos) never wake up the database.
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
