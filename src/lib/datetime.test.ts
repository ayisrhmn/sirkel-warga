import { expect, test } from "bun:test";
import { parseWibInput, startOfTodayWib, toWibInput } from "./datetime";

test("datetime-local input is read and written as WIB", () => {
  const date = parseWibInput("2026-10-12T19:30");
  expect(date?.toISOString()).toBe("2026-10-12T12:30:00.000Z");
  expect(toWibInput(date!)).toBe("2026-10-12T19:30");
  expect(parseWibInput("2026-13-40T99:99")).toBeNull();
  expect(parseWibInput("tomorrow")).toBeNull();
});

test("startOfTodayWib follows the WIB calendar day, not UTC", () => {
  // 18:00 UTC on Oct 11 is already 01:00 on Oct 12 in WIB.
  const start = startOfTodayWib(new Date("2026-10-11T18:00:00Z"));
  expect(start.toISOString()).toBe("2026-10-11T17:00:00.000Z");
});
