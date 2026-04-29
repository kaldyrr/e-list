export type AvitoQualityInput = {
  title: string;
  description?: string;
  price?: number;
  medianCategoryPrice?: number;
  imageCount: number;
  hasDelivery?: boolean;
  sellerRating?: number;
};

const suspiciousWords = [
  "битый",
  "копия",
  "муляж",
  "на запчасти",
  "не включается",
  "реплика",
];

export function scoreAvitoOffer(input: AvitoQualityInput) {
  let score = 50;
  const reasons: string[] = [];
  const title = input.title.toLowerCase();
  const description = input.description?.trim() ?? "";

  if (input.imageCount > 0) {
    score += 15;
  } else {
    score -= 25;
    reasons.push("missing images");
  }

  if (description.length >= 80) {
    score += 10;
  } else {
    score -= 10;
    reasons.push("short description");
  }

  if (input.hasDelivery) {
    score += 8;
  }

  if (typeof input.sellerRating === "number" && input.sellerRating >= 4.5) {
    score += 8;
  }

  for (const word of suspiciousWords) {
    if (title.includes(word) || description.toLowerCase().includes(word)) {
      score -= 30;
      reasons.push(`suspicious word: ${word}`);
    }
  }

  if (input.price && input.medianCategoryPrice) {
    const ratio = input.price / input.medianCategoryPrice;

    if (ratio < 0.5) {
      score -= 25;
      reasons.push("price is too low");
    }

    if (ratio > 1.8) {
      score -= 10;
      reasons.push("price is too high");
    }
  }

  return {
    decision: getDecision(score),
    reasons,
    score: Math.max(0, Math.min(100, score)),
  };
}

function getDecision(score: number) {
  if (score >= 80) {
    return "accept" as const;
  }

  if (score >= 50) {
    return "moderate" as const;
  }

  return "reject" as const;
}
