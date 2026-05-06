import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractRawOffer } from "./extractors";

describe("extractors", () => {
  it("extracts product data from JSON-LD", async () => {
    const html = await fixture("large-retail-valid.html");
    const offer = extractRawOffer(html, {
      source: "fixture",
      sourceType: "large_retail",
      url: "fixture://large-retail-valid.html",
    });

    expect(offer).toMatchObject({
      currency: "RUB",
      price: 67990,
      title: "MSI GeForce RTX 4070 Super 12GB Ventus 2X",
    });
  });

  it("falls back to HTML selectors", async () => {
    const html = await fixture("specialist-valid.html");
    const offer = extractRawOffer(html, {
      source: "fixture",
      sourceType: "known_specialist",
      url: "fixture://specialist-valid.html",
    });

    expect(offer).toMatchObject({
      price: 66490,
      title: "Palit GeForce RTX 4070 Super Dual 12 ГБ",
    });
  });
});

function fixture(name: string) {
  return readFile(join("src", "ingestion", "__fixtures__", name), "utf8");
}
