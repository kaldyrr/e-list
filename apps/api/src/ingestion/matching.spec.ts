import { describe, expect, it } from "vitest";
import { matchProduct } from "./matching";
import type { TargetProduct } from "./types";

describe("product matching", () => {
  it("does not match RTX 4070 Ti Super as RTX 4070 Super", () => {
    const target: TargetProduct = {
      category: "gpu",
      specs: {
        chipset: "RTX 4070 Super",
        memory_gb: 12,
      },
    };

    expect(matchProduct(target, "Palit GeForce RTX 4070 Ti Super 16GB").status).toBe("reject");
  });

  it("matches RTX 4070 Super with required memory", () => {
    const target: TargetProduct = {
      category: "gpu",
      specs: {
        chipset: "RTX 4070 Super",
        memory_gb: 12,
      },
    };

    expect(matchProduct(target, "MSI GeForce RTX 4070 Super 12GB Ventus").status).toBe("exact");
  });

  it("does not mix Intel K and KF processors", () => {
    const target: TargetProduct = {
      category: "cpu",
      model: "Intel i5-14600K",
      specs: {},
    };

    expect(matchProduct(target, "Intel Core i5-14600KF OEM").status).toBe("reject");
  });

  it("matches CPU with BOX signal", () => {
    const target: TargetProduct = {
      category: "cpu",
      model: "Ryzen 7 7800X3D",
      specs: {
        box_type: "BOX",
        socket: "AM5",
      },
    };

    const result = matchProduct(target, "AMD Ryzen 7 7800X3D AM5 BOX");

    expect(result.status).toBe("exact");
    expect(result.reasons).toContain("box_type_match");
  });

  it("rejects SSD with wrong capacity", () => {
    const target: TargetProduct = {
      brand: "Samsung",
      category: "ssd",
      model: "990 Pro",
      specs: {
        capacity_tb: 2,
        heatsink: false,
      },
    };

    expect(matchProduct(target, "Samsung 990 Pro 1TB NVMe").status).toBe("reject");
  });
});
