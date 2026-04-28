import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCurrencyInMillions,
  formatCurrencyInThousands,
  formatSignedCurrencyInMillions,
  normalizeStoredBudget,
  parseBudgetInMillionsInput,
} from "@/utils/currency";
import { formatRoundedSingleDecimal, roundToSingleDecimal } from "@/utils/rounding";

describe("formatCurrency", () => {
  describe("zero", () => {
    it("formata zero", () => {
      expect(formatCurrency(0)).toBe("€0.0");
    });
  });

  describe("valores abaixo de 1K", () => {
    it("retorna valor bruto com uma casa decimal e símbolo €", () => {
      expect(formatCurrency(500)).toBe("€500.0");
      expect(formatCurrency(1)).toBe("€1.0");
      expect(formatCurrency(999)).toBe("€999.0");
    });
  });

  describe("valores em milhares (K)", () => {
    it("formata múltiplos exatos de 1K", () => {
      expect(formatCurrency(1_000)).toBe("€1.0K");
      expect(formatCurrency(10_000)).toBe("€10.0K");
      expect(formatCurrency(750_000)).toBe("€750.0K");
    });

    it("mantém uma casa decimal", () => {
      expect(formatCurrency(1_500)).toBe("€1.5K");
      expect(formatCurrency(2_500)).toBe("€2.5K");
    });

    it("não usa notação K acima de 999K", () => {
      expect(formatCurrency(999_000)).toBe("€999.0K");
    });
  });

  describe("valores em milhões (M)", () => {
    it("formata múltiplos exatos de 1M", () => {
      expect(formatCurrency(1_000_000)).toBe("€1.0M");
      expect(formatCurrency(35_000_000)).toBe("€35.0M");
      expect(formatCurrency(100_000_000)).toBe("€100.0M");
    });

    it("mantém uma casa decimal", () => {
      expect(formatCurrency(1_500_000)).toBe("€1.5M");
      expect(formatCurrency(2_750_000)).toBe("€2.8M");
    });

    it("usa bilhões a partir de 1000M", () => {
      expect(formatCurrency(1_000_000_000)).toBe("€1.0B");
      expect(formatCurrency(1_250_000_000)).toBe("€1.3B");
    });
  });

  describe("valores negativos", () => {
    it("prefixo negativo antes do símbolo €", () => {
      expect(formatCurrency(-1_000_000)).toBe("-€1.0M");
      expect(formatCurrency(-750_000)).toBe("-€750.0K");
      expect(formatCurrency(-500)).toBe("-€500.0");
    });
  });
});

describe("currency unit helpers", () => {
  it("formata milhões e milhares com uma casa decimal", () => {
    expect(formatCurrencyInMillions(4)).toBe("€4.0M");
    expect(formatCurrencyInMillions(999.9)).toBe("€999.9M");
    expect(formatCurrencyInMillions(1000)).toBe("€1.0B");
    expect(formatCurrencyInMillions(1250)).toBe("€1.3B");
    expect(formatCurrencyInThousands(45)).toBe("€45.0K");
  });

  it("formata deltas monetários com uma casa decimal", () => {
    expect(formatSignedCurrencyInMillions(0.2999999999999998)).toBe("+€0.3M");
    expect(formatSignedCurrencyInMillions(-1)).toBe("-€1.0M");
    expect(formatSignedCurrencyInMillions(1000)).toBe("+€1.0B");
  });
});

describe("rounding", () => {
  it("arredonda para uma casa decimal", () => {
    expect(roundToSingleDecimal(0.2999999999999998)).toBe(0.3);
    expect(roundToSingleDecimal(2.75)).toBe(2.8);
  });

  it("formata com uma casa decimal fixa", () => {
    expect(formatRoundedSingleDecimal(4)).toBe("4.0");
    expect(formatRoundedSingleDecimal(0.2999999999999998)).toBe("0.3");
  });
});

describe("parseBudgetInMillionsInput", () => {
  it("converte valores inteiros em milhões para euros", () => {
    expect(parseBudgetInMillionsInput("150")).toBe(150_000_000);
    expect(parseBudgetInMillionsInput("0")).toBe(0);
  });

  it("aceita vírgula decimal", () => {
    expect(parseBudgetInMillionsInput("2,5")).toBe(2_500_000);
  });

  it("retorna null para entradas inválidas", () => {
    expect(parseBudgetInMillionsInput("")).toBeNull();
    expect(parseBudgetInMillionsInput("-5")).toBeNull();
    expect(parseBudgetInMillionsInput("abc")).toBeNull();
  });
});

describe("normalizeStoredBudget", () => {
  it("zera orçamentos legados corrompidos abaixo de 1M", () => {
    expect(normalizeStoredBudget(150)).toBe(0);
    expect(normalizeStoredBudget(999_999)).toBe(0);
  });

  it("preserva valores válidos", () => {
    expect(normalizeStoredBudget(0)).toBe(0);
    expect(normalizeStoredBudget(1_000_000)).toBe(1_000_000);
    expect(normalizeStoredBudget(150_000_000)).toBe(150_000_000);
  });
});
