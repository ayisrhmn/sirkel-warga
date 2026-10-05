import { expect, test } from "bun:test";
import { whatsappNumber, whatsappUrl } from "./phone";

test("Indonesian numbers become international WhatsApp numbers", () => {
  expect(whatsappNumber("0812-3456-7890")).toBe("6281234567890");
  expect(whatsappNumber("+62 812 3456 7890")).toBe("6281234567890");
  expect(whatsappNumber("62812-3456-7890")).toBe("6281234567890");
  expect(whatsappNumber("(0812) 3456 7890")).toBe("6281234567890");
  expect(whatsappNumber("0062 812 3456 7890")).toBe("6281234567890");
  expect(whatsappNumber("812 3456 7890")).toBe("6281234567890");
});

test("numbers with another country code are left alone", () => {
  expect(whatsappNumber("+60 12-345 6789")).toBe("60123456789");
  expect(whatsappNumber("+1 (415) 555-0100")).toBe("14155550100");
});

test("the link points at wa.me and contains nothing but digits", () => {
  expect(whatsappUrl("0812-3456-7890")).toBe("https://wa.me/6281234567890");
  expect(whatsappUrl("+62 811 222 333")).toBe("https://wa.me/62811222333");
  expect(whatsappUrl("0812 3456 7890; <script>")).toMatch(/^https:\/\/wa\.me\/\d+$/);
});
