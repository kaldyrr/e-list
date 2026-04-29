export type SourceKind = "api" | "feed" | "html" | "manual" | "sitemap";

export type SourceConfig = {
  slug: string;
  title: string;
  baseUrl: string;
  kind: SourceKind;
  robotsUrl: string;
  samplePaths: string[];
  minRequestIntervalMs: number;
  enabled: boolean;
  notes: string;
};

export const sourceRegistry: SourceConfig[] = [
  {
    slug: "dns",
    title: "DNS",
    baseUrl: "https://www.dns-shop.ru",
    kind: "sitemap",
    robotsUrl: "https://www.dns-shop.ru/robots.txt",
    samplePaths: ["/catalog/"],
    minRequestIntervalMs: 10_000,
    enabled: false,
    notes: "Prefer partner feed. Enable only after policy review.",
  },
  {
    slug: "citilink",
    title: "Citilink",
    baseUrl: "https://www.citilink.ru",
    kind: "feed",
    robotsUrl: "https://www.citilink.ru/robots.txt",
    samplePaths: ["/catalog/"],
    minRequestIntervalMs: 30_000,
    enabled: false,
    notes: "Prefer partner feed. Pause on 429/403.",
  },
  {
    slug: "mvideo",
    title: "M.Video",
    baseUrl: "https://www.mvideo.ru",
    kind: "feed",
    robotsUrl: "https://www.mvideo.ru/robots.txt",
    samplePaths: ["/products/"],
    minRequestIntervalMs: 30_000,
    enabled: false,
    notes: "Prefer official marketplace/partner integration.",
  },
  {
    slug: "avito",
    title: "Avito",
    baseUrl: "https://www.avito.ru",
    kind: "api",
    robotsUrl: "https://www.avito.ru/robots.txt",
    samplePaths: ["/"],
    minRequestIntervalMs: 60_000,
    enabled: false,
    notes: "Use official API/partner access only. Apply quality scoring.",
  },
];
