import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ParserRunResult } from "./types";

export async function writeParserRunJson(result: ParserRunResult, outputDir = "storage/parser-runs") {
  await mkdir(outputDir, { recursive: true });

  const filePath = join(outputDir, `${result.id}.json`);
  await writeFile(filePath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  return filePath;
}
