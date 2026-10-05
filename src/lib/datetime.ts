// Indonesia has three fixed time zones and no daylight saving, so a fixed
// UTC offset per zone is exact.
export const TIME_ZONES = {
  "Asia/Jakarta": { label: "WIB", offsetHours: 7 },
  "Asia/Makassar": { label: "WITA", offsetHours: 8 },
  "Asia/Jayapura": { label: "WIT", offsetHours: 9 },
} as const;

export type TimeZone = keyof typeof TIME_ZONES;
export const DEFAULT_TIME_ZONE: TimeZone = "Asia/Jakarta";

export const isTimeZone = (value: unknown): value is TimeZone =>
  typeof value === "string" && value in TIME_ZONES;

// Database values are plain strings: fall back to the default if one is odd.
export const asTimeZone = (value: unknown): TimeZone =>
  isTimeZone(value) ? value : DEFAULT_TIME_ZONE;

const offsetMs = (zone: TimeZone) => TIME_ZONES[zone].offsetHours * 3_600_000;
const offsetText = (zone: TimeZone) =>
  `+${String(TIME_ZONES[zone].offsetHours).padStart(2, "0")}:00`;

// "2026-10-12T19:30" (datetime-local input in the community's zone) -> Date,
// or null if invalid.
export function parseLocalInput(value: string, zone: TimeZone): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00${offsetText(zone)}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Date -> value for a datetime-local input, in the community's zone.
export function toLocalInput(date: Date, zone: TimeZone): string {
  return new Date(date.getTime() + offsetMs(zone)).toISOString().slice(0, 16);
}

// 00:00 today in the community's zone, as a Date.
export function startOfToday(zone: TimeZone, now = new Date()): Date {
  const day = new Date(now.getTime() + offsetMs(zone)).toISOString().slice(0, 10);
  return new Date(`${day}T00:00:00${offsetText(zone)}`);
}

const formats = new Map<string, Intl.DateTimeFormat>();
function format(zone: TimeZone, withTime: boolean) {
  const key = `${zone}:${withTime}`;
  let f = formats.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("id-ID", {
      dateStyle: withTime ? "full" : "long",
      ...(withTime ? { timeStyle: "short" } : {}),
      timeZone: zone,
    });
    formats.set(key, f);
  }
  return f;
}

export const formatDate = (value: string | Date, zone: TimeZone = DEFAULT_TIME_ZONE) =>
  format(zone, false).format(new Date(value));
export const formatDateTime = (value: string | Date, zone: TimeZone = DEFAULT_TIME_ZONE) =>
  format(zone, true).format(new Date(value));
