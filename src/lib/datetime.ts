// All communities are in Indonesia; event times are entered and shown in WIB.
// ponytail: fixed UTC+7, add a per-community timezone if WITA/WIT is needed.
const TIME_ZONE = "Asia/Jakarta";
const OFFSET_MS = 7 * 60 * 60 * 1000;

// "2026-10-12T19:30" (datetime-local input, WIB) -> Date, or null if invalid.
export function parseWibInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Date -> value for a datetime-local input, in WIB.
export function toWibInput(date: Date): string {
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 16);
}

// 00:00 today in WIB, as a Date.
export function startOfTodayWib(now = new Date()): Date {
  const day = new Date(now.getTime() + OFFSET_MS).toISOString().slice(0, 10);
  return new Date(`${day}T00:00:00+07:00`);
}

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: TIME_ZONE,
});
const dateTimeFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});

export const formatDate = (iso: string | Date) => dateFormat.format(new Date(iso));
export const formatDateTime = (iso: string | Date) =>
  dateTimeFormat.format(new Date(iso));
