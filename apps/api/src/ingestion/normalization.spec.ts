import { describe, expect, it } from "vitest";
import {
  findBadWords,
  normalizeAvailability,
  normalizeText,
  parseCapacityGb,
  parsePrice,
} from "./normalization";

describe("normalization", () => {
  it("normalizes tech text tokens", () => {
    expect(normalizeText("SSD 2 ТБ, 6000 МГц × 2")).toBe("ssd 2 tb 6000 mhz x 2");
  });

  it("parses capacity in GB", () => {
    expect(parseCapacityGb("Samsung 990 Pro 2TB")).toBe(2048);
    expect(parseCapacityGb("RTX 4070 Super 12 ГБ")).toBe(12);
  });

  it("parses prices", () => {
    expect(parsePrice("89 990 ₽")).toBe(89990);
    expect(parsePrice("50 ₽")).toBeNull();
  });

  it("normalizes availability", () => {
    expect(normalizeAvailability("Есть в наличии")).toBe("in_stock");
    expect(normalizeAvailability("Нет в наличии")).toBe("out_of_stock");
  });

  it("finds suspicious bad words", () => {
    expect(findBadWords("iPhone 17 Pro Max копия", "")).toContain("копия");
  });
});
