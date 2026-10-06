import { describe, expect, test } from "bun:test";
import { checkPrimaryColor, contrastWithWhite, DEFAULT_PRIMARY, MIN_CONTRAST, normalizeHex, PRIMARY_PRESETS, themeStyle } from "./theme";

describe("normalizeHex", () => {
  test("accepts 3 and 6 digit colours with or without #, in any case", () => {
    expect(normalizeHex("#ABCDEF")).toBe("#abcdef");
    expect(normalizeHex("abc")).toBe("#aabbcc");
    expect(normalizeHex("  #0E6B58 ")).toBe("#0e6b58");
  });

  test("rejects anything else, so nothing but a colour can reach a style attribute", () => {
    for (const bad of ["", "#12", "#12345", "#1234567", "red", "#ggg", "#fff;x:y", 'url("x")', null, undefined, 5])
      expect(normalizeHex(bad)).toBeNull();
  });
});

describe("contrast", () => {
  test("white on black is 21, white on white is 1", () => {
    expect(contrastWithWhite("#000000")).toBeCloseTo(21, 0);
    expect(contrastWithWhite("#ffffff")).toBeCloseTo(1, 1);
  });

  test("every preset, and the default, is readable under white text", () => {
    expect(PRIMARY_PRESETS[0].value).toBe(DEFAULT_PRIMARY);
    for (const { value } of PRIMARY_PRESETS) expect(contrastWithWhite(value)).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });
});

describe("checkPrimaryColor", () => {
  test("returns the normalized colour when readable", () => {
    expect(checkPrimaryColor("#1D4ED8")).toEqual({ color: "#1d4ed8" });
  });

  test("refuses colours that are too light, and invalid input", () => {
    expect(checkPrimaryColor("#ffff00")).toEqual({ error: expect.stringContaining("terlalu terang") });
    expect(checkPrimaryColor("#f5b83d")).toEqual({ error: expect.stringContaining("terlalu terang") });
    expect(checkPrimaryColor("hijau")).toEqual({ error: "Warna tidak valid." });
  });
});

describe("themeStyle", () => {
  test("no style for the default, nothing stored, or a bad stored value", () => {
    expect(themeStyle(null)).toBeUndefined();
    expect(themeStyle(DEFAULT_PRIMARY)).toBeUndefined();
    expect(themeStyle("#ffff00")).toBeUndefined();
    expect(themeStyle("not a colour")).toBeUndefined();
  });

  test("a chosen colour sets the primary token and derives the shades from it", () => {
    const style = themeStyle("#1D4ED8") as Record<string, string>;
    expect(style["--color-primary"]).toBe("#1d4ed8");
    expect(style["--color-primary-dark"]).toContain("var(--color-primary)");
    expect(style["--color-primary-tint"]).toContain("var(--color-primary)");
  });
});
