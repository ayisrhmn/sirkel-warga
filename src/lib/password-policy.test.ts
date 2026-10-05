import { describe, expect, test } from "bun:test";
import { passwordProblem } from "./password-policy";

describe("passwordProblem", () => {
  test("rejects the passwords guessed first", () => {
    for (const weak of ["password", "Password123", "12345678", "87654321", "23456789", "11111111", "aaaaaaaa", "Indonesia", "QWERTYUI"]) {
      expect(passwordProblem(weak)).not.toBeNull();
    }
  });

  test("rejects a password equal to or containing the username", () => {
    expect(passwordProblem("budisantoso", "budisantoso")).not.toBeNull();
    expect(passwordProblem("BudiSantoso", "budisantoso")).not.toBeNull();
    expect(passwordProblem("budisantoso-2026", "budisantoso")).not.toBeNull();
    expect(passwordProblem("ani-rahasia-9", "ani")).toBeNull(); // very short usernames only count when equal
    expect(passwordProblem("ani", "ani")).not.toBeNull();
  });

  test("accepts ordinary good passwords", () => {
    for (const good of ["password-awal-1", "rahasia-rt", "kucing-oren-di-atap", "T9x!mQ2v", "gang mawar 12"]) {
      expect(passwordProblem(good, "budi")).toBeNull();
    }
  });
});
