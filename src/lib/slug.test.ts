import { expect, test } from "bun:test";
import { slugify, validateSlug } from "./slug";

test("slugify derives a slug from the community name", () => {
  expect(slugify("Dawis Matahari - Sektor 3")).toBe("dawis-matahari-sektor-3");
  expect(slugify("  RT 05 / Melati!! ")).toBe("rt-05-melati");
  expect(slugify("Gang Ceméndhé")).toBe("gang-cemendhe");
  expect(slugify("!!!")).toBe("");
  expect(slugify("a".repeat(80)).length).toBe(50);
});

test("validateSlug rejects reserved, malformed, and out-of-range slugs", () => {
  expect(validateSlug("dawis-matahari-sektor-3")).toBeNull();
  for (const slug of ["login", "register", "admin", "platform", "api"]) {
    expect(validateSlug(slug)).not.toBeNull();
  }
  expect(validateSlug("ab")).not.toBeNull();
  expect(validateSlug("Has-Upper")).not.toBeNull();
  expect(validateSlug("-leading")).not.toBeNull();
  expect(validateSlug("double--hyphen")).not.toBeNull();
});
