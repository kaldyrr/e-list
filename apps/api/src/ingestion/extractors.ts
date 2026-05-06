import { parsePrice } from "./normalization";
import type { RawOffer, SourceType } from "./types";

export type ExtractContext = {
  source: string;
  sourceType: SourceType;
  url: string;
  fallbackCurrency?: "RUB";
};

export function extractRawOffer(html: string, context: ExtractContext): RawOffer | null {
  const jsonLdOffer = extractFromJsonLd(html, context);

  if (jsonLdOffer) {
    return jsonLdOffer;
  }

  return extractFromHtmlFallback(html, context);
}

function extractFromJsonLd(html: string, context: ExtractContext): RawOffer | null {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  for (const script of scripts) {
    const rawJson = decodeHtml(script[1] ?? "").trim();

    if (!rawJson) {
      continue;
    }

    const parsed = safeJsonParse(rawJson);
    const products = findJsonLdProducts(parsed);

    for (const product of products) {
      const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
      const price = parsePrice(String(offer?.price ?? ""));
      const title = stringValue(product.name);

      if (!title) {
        continue;
      }

      return {
        collectedAt: new Date().toISOString(),
        currency: normalizeCurrency(offer?.priceCurrency, context.fallbackCurrency),
        externalId: stringValue(product.sku),
        imageUrls: normalizeImages(product.image),
        price: price ?? undefined,
        rawSpecs: {},
        source: context.source,
        sourceType: context.sourceType,
        title,
        url: context.url,
        availability: normalizeSchemaAvailability(stringValue(offer?.availability)),
        description: stringValue(product.description),
      };
    }
  }

  return null;
}

function extractFromHtmlFallback(html: string, context: ExtractContext): RawOffer | null {
  const title = extractFirst(html, [
    /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<title[^>]*>([\s\S]*?)<\/title>/i,
  ]);

  if (!title) {
    return null;
  }

  const priceText = extractFirst(html, [
    /data-price=["']([^"']+)["']/i,
    /class=["'][^"']*price[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i,
    /"price"\s*:\s*"?(\d[\d\s]*)"?/i,
  ]);
  const availability = extractFirst(html, [
    /class=["'][^"']*(?:availability|stock|status)[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i,
    /data-availability=["']([^"']+)["']/i,
  ]);
  const description = extractFirst(html, [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  ]);
  const image = extractFirst(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  ]);

  return {
    availability,
    collectedAt: new Date().toISOString(),
    currency: context.fallbackCurrency ?? "RUB",
    description,
    imageUrls: image ? [image] : [],
    price: priceText ? (parsePrice(stripTags(priceText)) ?? undefined) : undefined,
    rawSpecs: {},
    source: context.source,
    sourceType: context.sourceType,
    title: stripTags(title),
    url: context.url,
  };
}

function findJsonLdProducts(value: unknown): Array<Record<string, unknown>> {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => findJsonLdProducts(item));
  }

  if (typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const type = record["@type"];
  const products: Array<Record<string, unknown>> = [];

  if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) {
    products.push(record);
  }

  if (Array.isArray(record["@graph"])) {
    products.push(...record["@graph"].flatMap((item) => findJsonLdProducts(item)));
  }

  return products;
}

function extractFirst(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return decodeHtml(match[1]).trim();
    }
  }

  return undefined;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeImages(value: unknown) {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

function normalizeCurrency(value: unknown, fallback: "RUB" = "RUB"): "RUB" {
  return value === "RUB" || value === "RUR" ? "RUB" : fallback;
}

function normalizeSchemaAvailability(value?: string) {
  if (!value) {
    return undefined;
  }

  if (/instock/i.test(value)) {
    return "in_stock";
  }

  if (/outofstock|soldout/i.test(value)) {
    return "out_of_stock";
  }

  if (/preorder/i.test(value)) {
    return "preorder";
  }

  return value;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&quot;", "\"")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#x2F;", "/")
    .replaceAll("&#47;", "/")
    .replaceAll("&nbsp;", " ");
}
