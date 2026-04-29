import { normalizeText, parseCapacityGb } from "./normalization";
import type { TargetProduct } from "./types";

export type MatchResult = {
  score: number;
  status: "exact" | "probable" | "reject";
  reasons: string[];
};

export function matchProduct(target: TargetProduct, offerTitle: string): MatchResult {
  const title = normalizeText(offerTitle);

  if (target.category === "gpu") {
    return matchGpu(target, title);
  }

  if (target.category === "cpu") {
    return matchCpu(target, title);
  }

  if (target.category === "ram") {
    return matchRam(target, title);
  }

  if (target.category === "ssd") {
    return matchSsd(target, title);
  }

  return matchGeneric(target, title);
}

function matchGeneric(target: TargetProduct, title: string): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  if (target.brand && title.includes(normalizeText(target.brand))) {
    score += 15;
    reasons.push("brand_match");
  }

  if (target.model && title.includes(normalizeText(target.model))) {
    score += 45;
    reasons.push("model_match");
  }

  const storageGb = numberSpec(target, "storage_gb");

  if (storageGb) {
    const parsed = parseCapacityGb(title);

    if (parsed === storageGb) {
      score += 20;
      reasons.push("storage_match");
    } else if (parsed) {
      score -= 30;
      reasons.push("storage_mismatch");
    }
  }

  return withStatus(score, reasons);
}

function matchGpu(target: TargetProduct, title: string): MatchResult {
  let score = 0;
  const reasons: string[] = [];
  const chipset = stringSpec(target, "chipset") ?? target.model;

  if (!chipset) {
    return matchGeneric(target, title);
  }

  const normalizedChipset = normalizeText(chipset);
  const negativeModels = getGpuNegativeModels(normalizedChipset);

  if (negativeModels.some((model) => title.includes(model))) {
    return withStatus(0, ["gpu_negative_model_match"]);
  }

  if (title.includes(normalizedChipset)) {
    score += 50;
    reasons.push("chipset_match");
  }

  const memoryGb = numberSpec(target, "memory_gb");

  if (memoryGb) {
    const parsedMemory = parseCapacityGb(title);

    if (parsedMemory === memoryGb) {
      score += 20;
      reasons.push("memory_match");
    } else if (parsedMemory) {
      score -= 30;
      reasons.push("memory_mismatch");
    }
  }

  const vendor = stringSpec(target, "vendor");

  if (vendor && title.includes(normalizeText(vendor))) {
    score += 15;
    reasons.push("vendor_match");
  }

  return withStatus(score, reasons);
}

function matchCpu(target: TargetProduct, title: string): MatchResult {
  const model = target.model;

  if (!model) {
    return matchGeneric(target, title);
  }

  const normalizedModel = normalizeText(model);

  if (!title.includes(normalizedModel)) {
    return withStatus(0, ["model_mismatch"]);
  }

  if (normalizedModel.endsWith("k") && title.includes(`${normalizedModel}f`)) {
    return withStatus(0, ["cpu_k_kf_mismatch"]);
  }

  if (normalizedModel.endsWith("kf")) {
    const kModel = normalizedModel.slice(0, -1);

    if (new RegExp(`\\b${escapeRegExp(kModel)}\\b`).test(title) && !title.includes(normalizedModel)) {
      return withStatus(0, ["cpu_k_kf_mismatch"]);
    }
  }

  let score = 60;
  const reasons = ["model_match"];
  const socket = stringSpec(target, "socket");
  const boxType = stringSpec(target, "box_type");

  if (socket && title.includes(normalizeText(socket))) {
    score += 10;
    reasons.push("socket_match");
  }

  if (boxType && title.includes(normalizeText(boxType))) {
    score += 15;
    reasons.push("box_type_match");
  }

  return withStatus(score, reasons);
}

function matchRam(target: TargetProduct, title: string): MatchResult {
  const required = [
    numberSpec(target, "capacity_total_gb")?.toString(),
    stringSpec(target, "type"),
    numberSpec(target, "frequency_mhz")?.toString(),
  ].filter((value): value is string => typeof value === "string");

  const reasons: string[] = [];
  let score = 0;

  for (const value of required) {
    const normalizedValue = normalizeText(value);

    if (!title.includes(normalizedValue)) {
      return withStatus(0, [`ram_required_mismatch:${value}`]);
    }

    score += 18;
    reasons.push(`ram_required_match:${value}`);
  }

  const modules = stringSpec(target, "modules");

  if (modules === "2x16" && !/2\s*x\s*16/.test(title)) {
    return withStatus(0, ["ram_modules_mismatch"]);
  }

  if (modules) {
    score += 15;
    reasons.push("ram_modules_match");
  }

  const cl = numberSpec(target, "cl");

  if (cl && title.replace(/\s/g, "").includes(`cl${cl}`)) {
    score += 15;
    reasons.push("ram_cl_match");
  }

  return withStatus(score, reasons);
}

function matchSsd(target: TargetProduct, title: string): MatchResult {
  const result = matchGeneric(target, title);
  const capacityTb = numberSpec(target, "capacity_tb");

  if (capacityTb) {
    const capacityGb = parseCapacityGb(title);

    if (capacityGb !== capacityTb * 1024) {
      return withStatus(0, ["ssd_capacity_mismatch"]);
    }
  }

  if (target.specs.heatsink === false && /heatsink|радиатор/.test(title)) {
    return withStatus(0, ["ssd_heatsink_mismatch"]);
  }

  return result;
}

function withStatus(score: number, reasons: string[]): MatchResult {
  if (score >= 70) {
    return { reasons, score, status: "exact" };
  }

  if (score >= 50) {
    return { reasons, score, status: "probable" };
  }

  return { reasons, score, status: "reject" };
}

function getGpuNegativeModels(chipset: string) {
  const rules: Record<string, string[]> = {
    "rtx 4070 super": ["rtx 4070 ti super", "rtx 4070 ti"],
    "rtx 4070 ti": ["rtx 4070 ti super", "rtx 4070 super", "rtx 4070"],
  };

  return rules[chipset] ?? [];
}

function stringSpec(target: TargetProduct, key: string) {
  const value = target.specs[key];

  return typeof value === "string" ? value : undefined;
}

function numberSpec(target: TargetProduct, key: string) {
  const value = target.specs[key];

  return typeof value === "number" ? value : undefined;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
