import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { extractRawOffer } from "../ingestion/extractors";
import { writeParserRunJson } from "../ingestion/json-storage";
import { runParserPipeline } from "../ingestion/pipeline";
import type { RawOffer, TargetProduct } from "../ingestion/types";

const target: TargetProduct = {
  category: "gpu",
  region: "RU",
  specs: {
    chipset: "RTX 4070 Super",
    memory_gb: 12,
  },
};

const fixtureFiles = [
  "large-retail-valid.html",
  "specialist-valid.html",
  "wrong-model.html",
  "used-copy.html",
  "out-of-stock.html",
  "too-cheap.html",
];

async function main() {
  const rawOffers: RawOffer[] = [];

  for (const fixtureFile of fixtureFiles) {
    const html = await readFile(join("src", "ingestion", "__fixtures__", fixtureFile), "utf8");
    const offer = extractRawOffer(html, {
      source: fixtureFile.replace(".html", ""),
      sourceType: fixtureFile.includes("specialist") ? "known_specialist" : "large_retail",
      url: `fixture://${fixtureFile}`,
    });

    if (offer) {
      rawOffers.push(offer);
    }
  }

  const result = runParserPipeline(target, rawOffers);
  const filePath = await writeParserRunJson(result, join("..", "..", "storage", "parser-runs"));

  console.log(
    JSON.stringify(
      {
        accepted: result.offersAccepted,
        exclusions: result.exclusions,
        filePath,
        marketPrice: result.marketPrice,
        rejected: result.offersRejected,
        total: result.offersTotal,
      },
      null,
      2,
    ),
  );
}

void main();
