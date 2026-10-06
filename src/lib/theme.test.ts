import { describe, expect, test } from "bun:test";
import { contrastWarning, contrastWithWhite, DEFAULT_PRIMARY, MIN_CONTRAST, normalizeHex, parsePrimaryColor, PRIMARY_PRESETS, themeStyle } from "./theme";

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

  test("the default colour is readable under white text, and every preset is a valid colour", () => {
    expect(PRIMARY_PRESETS[0].value).toBe(DEFAULT_PRIMARY);
    expect(contrastWithWhite(DEFAULT_PRIMARY)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    for (const { value } of PRIMARY_PRESETS) expect(normalizeHex(value)).toBe(value);
  });

  test("the presets include yellows", () => {
    const names = PRIMARY_PRESETS.map((p) => p.name);
    expect(names).toContain("Kuning");
    expect(names).toContain("Emas");
  });
});

describe("parsePrimaryColor", () => {
  test("returns the normalized colour", () => {
    expect(parsePrimaryColor("#1D4ED8")).toEqual({ color: "#1d4ed8" });
  });

  test("light colours are allowed: that is the community's choice", () => {
    expect(parsePrimaryColor("#ffff00")).toEqual({ color: "#ffff00" });
    expect(parsePrimaryColor("#ffffff")).toEqual({ color: "#ffffff" });
  });

  test("anything that is not a colour is refused", () => {
    expect(parsePrimaryColor("hijau")).toEqual({ error: "Warna tidak valid." });
    expect(parsePrimaryColor("#fff;background:url(x)")).toEqual({ error: "Warna tidak valid." });
    expect(parsePrimaryColor(undefined)).toEqual({ error: "Warna tidak valid." });
  });
});

describe("contrastWarning", () => {
  test("warns for light colours only", () => {
    expect(contrastWarning("#eab308")).toContain("terang");
    expect(contrastWarning("#ffff00")).toContain("terang");
    expect(contrastWarning("#0e6b58")).toBeNull();
    expect(contrastWarning("#1d4ed8")).toBeNull();
  });
});

describe("themeStyle", () => {
  test("no style for the default, nothing stored, or a stored value that is not a colour", () => {
    expect(themeStyle(null)).toBeUndefined();
    expect(themeStyle(DEFAULT_PRIMARY)).toBeUndefined();
    expect(themeStyle("not a colour")).toBeUndefined();
  });

  test("a chosen colour sets the primary token and derives the shades from it, light or not", () => {
    for (const color of ["#1D4ED8", "#eab308"]) {
      const style = themeStyle(color) as Record<string, string>;
      expect(style["--color-primary"]).toBe(color.toLowerCase());
      expect(style["--color-primary-dark"]).toContain("var(--color-primary)");
      expect(style["--color-primary-tint"]).toContain("var(--color-primary)");
    }
  });
});
