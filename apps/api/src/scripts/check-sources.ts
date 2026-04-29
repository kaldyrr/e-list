import {
  fetchRobotsPolicy,
  isPathAllowed,
} from "../ingestion/robots-guard";
import { sourceRegistry } from "../ingestion/source-registry";

async function main() {
  for (const source of sourceRegistry) {
    try {
      const policy = await fetchRobotsPolicy(source.robotsUrl);
      const pathResults = source.samplePaths.map((path) => ({
        allowed: isPathAllowed(path, policy),
        path,
      }));

      console.log(
        JSON.stringify(
          {
            source: source.slug,
            crawlDelayMs: policy.crawlDelayMs ?? null,
            enabled: source.enabled,
            paths: pathResults,
            rules: policy.rules.length,
            sitemaps: policy.sitemaps.slice(0, 5),
            status: "ok",
          },
          null,
          2,
        ),
      );
    } catch (error) {
      console.log(
        JSON.stringify(
          {
            source: source.slug,
            enabled: false,
            error: error instanceof Error ? error.message : "unknown error",
            status: "paused",
          },
          null,
          2,
        ),
      );
    }
  }
}

void main();
