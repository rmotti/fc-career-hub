import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/utils/currency";

describe("formatCurrency", () => {
  describe("zero", () => {
    it("formata zero", () => {
      expect(formatCurrency(0)).toBe("€0");
    });
  });

  describe("valores abaixo de 1K", () => {
    it("retorna valor bruto com símbolo €", () => {
      expect(formatCurrency(500)).toBe("€500");
      expect(formatCurrency(1)).toBe("€1");
      expect(formatCurrency(999)).toBe("€999");
    });
  });

  describe("valores em milhares (K)", () => {
    it("formata múltiplos exatos de 1K", () => {
      expect(formatCurrency(1_000)).toBe("€1K");
      expect(formatCurrency(10_000)).toBe("€10K");
      expect(formatCurrency(750_000)).toBe("€750K");
    });

    it("formata com uma casa decimal quando necessário", () => {
      expect(formatCurrency(1_500)).toBe("€1.5K");
      expect(formatCurrency(2_500)).toBe("€2.5K");
    });

    it("não usa notação K acima de 999K", () => {
      expect(formatCurrency(999_000)).toBe("€999K");
    });
  });

  describe("valores em milhões (M)", () => {
    it("formata múltiplos exatos de 1M", () => {
      expect(formatCurrency(1_000_000)).toBe("€1M");
      expect(formatCurrency(35_000_000)).toBe("€35M");
      expect(formatCurrency(100_000_000)).toBe("€100M");
    });

    it("formata com uma casa decimal quando necessário", () => {
      expect(formatCurrency(1_500_000)).toBe("€1.5M");
      expect(formatCurrency(2_750_000)).toBe("€2.8M");
    });
  });

  describe("valores negativos", () => {
    it("prefixo negativo antes do símbolo €", () => {
      expect(formatCurrency(-1_000_000)).toBe("-€1M");
      expect(formatCurrency(-750_000)).toBe("-€750K");
      expect(formatCurrency(-500)).toBe("-€500");
    });
  });
});
