import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractRawOffer } from "./extractors";
import { runParserPipeline } from "./pipeline";
import type { RawOffer, TargetProduct } from "./types";

describe("parser pipeline", () => {
  it("accepts clean offers and rejects wrong or suspicious offers", async () => {
    const target: TargetProduct = {
      category: "gpu",
      specs: {
        chipset: "RTX 4070 Super",
        memory_gb: 12,
      },
    };
    const rawOffers = await loadOffers([
      "large-retail-valid.html",
      "specialist-valid.html",
      "wrong-model.html",
      "used-copy.html",
      "out-of-stock.html",
      "too-cheap.html",
    ]);

    const result = runParserPipeline(target, rawOffers);

    expect(result.offersTotal).toBe(6);
    expect(result.offersAccepted).toBe(2);
    expect(result.marketPrice).toMatchObject({
      count: 2,
      median: 67240,
      p25: 66865,
      p75: 67615,
    });
    expect(result.exclusions.match_reject).toBeGreaterThanOrEqual(1);
    expect(result.exclusions.availability_out_of_stock).toBe(1);
    expect(result.exclusions.too_cheap).toBe(2);
  });
});

async function loadOffers(files: string[]) {
  const offers: RawOffer[] = [];

  for (const file of files) {
    const html = await readFile(join("src", "ingestion", "__fixtures__", file), "utf8");
    const offer = extractRawOffer(html, {
      source: file,
      sourceType: file === "specialist-valid.html" ? "known_specialist" : "large_retail",
      url: `fixture://${file}`,
    });

    if (offer) {
      offers.push(offer);
    }
  }

  return offers;
}
