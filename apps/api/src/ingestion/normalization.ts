import type { Availability } from "./types";

const badWords = [
  "б/у",
  "бу",
  "used",
  "refurbished",
  "восстановленный",
  "уценка",
  "витринный",
  "после ремонта",
  "донор",
  "запчасть",
  "муляж",
  "копия",
  "реплика",
  "чехол",
  "стекло",
  "кабель",
  "адаптер",
  "защитная пленка",
  "макет",
];

const availabilityMap: Record<string, Availability> = {
  "в корзину": "in_stock",
  "в наличии": "in_stock",
  "есть в наличии": "in_stock",
  "купить": "in_stock",
  "нет в наличии": "out_of_stock",
  "ожидается": "out_of_stock",
  "под заказ": "preorder",
  "предзаказ": "preorder",
};

export function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replaceAll("ё", "е")
    .normalize("NFKC")
    .replaceAll("×", "x")
    .replaceAll("гб", "gb")
    .replaceAll("тб", "tb")
    .replaceAll("мгц", "mhz")
    .replaceAll("дюймов", '"')
    .replace(/[^\p{L}\p{N}_\s\-+./"]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseCapacityGb(text: string) {
  const normalized = normalizeText(text);
  const tbMatch = normalized.match(/(\d+(?:\.\d+)?)\s*tb/);

  if (tbMatch?.[1]) {
    return Math.round(Number(tbMatch[1]) * 1024);
  }

  const gbMatch = normalized.match(/(\d+)\s*gb/);

  if (gbMatch?.[1]) {
    return Number(gbMatch[1]);
  }

  return null;
}

export function parsePrice(text: string) {
  const digits = text.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const price = Number(digits);

  return price >= 100 ? price : null;
}

export function normalizeAvailability(text?: string): Availability {
  const normalized = normalizeText(text ?? "");
  const entries = Object.entries(availabilityMap).sort(
    ([left], [right]) => right.length - left.length,
  );

  for (const [key, value] of entries) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  return "unknown";
}

export function findBadWords(title: string, description = "") {
  const text = normalizeText(`${title} ${description}`);

  return badWords.filter((word) => text.includes(normalizeText(word)));
}
