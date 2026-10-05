import { expect, test } from "bun:test";
import {
  asTimeZone,
  formatDateTime,
  parseLocalInput,
  startOfToday,
  toLocalInput,
} from "./datetime";

test("datetime-local input is read and written in the community's zone", () => {
  expect(parseLocalInput("2026-10-12T19:30", "Asia/Jakarta")?.toISOString()).toBe("2026-10-12T12:30:00.000Z");
  expect(parseLocalInput("2026-10-12T19:30", "Asia/Makassar")?.toISOString()).toBe("2026-10-12T11:30:00.000Z");
  expect(parseLocalInput("2026-10-12T19:30", "Asia/Jayapura")?.toISOString()).toBe("2026-10-12T10:30:00.000Z");

  for (const zone of ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"] as const) {
    const date = parseLocalInput("2026-10-12T19:30", zone)!;
    expect(toLocalInput(date, zone)).toBe("2026-10-12T19:30");
  }
  expect(parseLocalInput("2026-13-40T99:99", "Asia/Jakarta")).toBeNull();
  expect(parseLocalInput("tomorrow", "Asia/Jakarta")).toBeNull();
});

test("startOfToday follows the calendar day of the zone, not UTC", () => {
  const now = new Date("2026-10-11T16:30:00Z"); // 23:30 WIB, 00:30 WITA, 01:30 WIT next day
  expect(startOfToday("Asia/Jakarta", now).toISOString()).toBe("2026-10-10T17:00:00.000Z");
  expect(startOfToday("Asia/Makassar", now).toISOString()).toBe("2026-10-11T16:00:00.000Z");
  expect(startOfToday("Asia/Jayapura", now).toISOString()).toBe("2026-10-11T15:00:00.000Z");
});

test("the same moment is shown in each zone's local time", () => {
  const moment = "2026-10-12T12:30:00Z";
  expect(formatDateTime(moment, "Asia/Jakarta")).toContain("19.30");
  expect(formatDateTime(moment, "Asia/Makassar")).toContain("20.30");
  expect(formatDateTime(moment, "Asia/Jayapura")).toContain("21.30");
});

test("unknown zones fall back to WIB", () => {
  expect(asTimeZone("Asia/Makassar")).toBe("Asia/Makassar");
  expect(asTimeZone("Europe/Paris")).toBe("Asia/Jakarta");
  expect(asTimeZone(null)).toBe("Asia/Jakarta");
});
