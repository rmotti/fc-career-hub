import { describe, it, expect } from "vitest";
import { formatCurrency, parseCurrencyToNumber, isValidCurrencyFormat, normalizeCurrencyInput } from "./currency";

describe("formatCurrency", () => {
  it("formats thousands", () => {
    expect(formatCurrency(1000)).toBe("€1K");
    expect(formatCurrency(75000)).toBe("€75K");
    expect(formatCurrency(750000)).toBe("€750K");
  });

  it("formats millions", () => {
    expect(formatCurrency(1000000)).toBe("€1M");
    expect(formatCurrency(1500000)).toBe("€1.5M");
    expect(formatCurrency(35000000)).toBe("€35M");
    expect(formatCurrency(120000000)).toBe("€120M");
  });

  it("formats small values", () => {
    expect(formatCurrency(0)).toBe("€0");
    expect(formatCurrency(500)).toBe("€500");
  });

  it("handles negative values", () => {
    expect(formatCurrency(-5000000)).toBe("-€5M");
  });
});

describe("parseCurrencyToNumber", () => {
  it("parses €XK format", () => {
    expect(parseCurrencyToNumber("€75K")).toBe(75000);
    expect(parseCurrencyToNumber("€750K")).toBe(750000);
    expect(parseCurrencyToNumber("€1.5K")).toBe(1500);
  });

  it("parses €XM format", () => {
    expect(parseCurrencyToNumber("€35M")).toBe(35000000);
    expect(parseCurrencyToNumber("€1.5M")).toBe(1500000);
    expect(parseCurrencyToNumber("€120M")).toBe(120000000);
  });

  it("parses without € prefix", () => {
    expect(parseCurrencyToNumber("75K")).toBe(75000);
    expect(parseCurrencyToNumber("35M")).toBe(35000000);
  });

  it("parses raw numbers", () => {
    expect(parseCurrencyToNumber("750000")).toBe(750000);
    expect(parseCurrencyToNumber("€500")).toBe(500);
  });

  it("handles empty/invalid input", () => {
    expect(parseCurrencyToNumber("")).toBe(0);
    expect(parseCurrencyToNumber("abc")).toBe(0);
  });
});

describe("isValidCurrencyFormat", () => {
  it("accepts valid formats", () => {
    expect(isValidCurrencyFormat("€75K")).toBe(true);
    expect(isValidCurrencyFormat("€35M")).toBe(true);
    expect(isValidCurrencyFormat("75K")).toBe(true);
    expect(isValidCurrencyFormat("35M")).toBe(true);
    expect(isValidCurrencyFormat("€1.5M")).toBe(true);
  });

  it("rejects invalid formats", () => {
    expect(isValidCurrencyFormat("")).toBe(false);
    expect(isValidCurrencyFormat("abc")).toBe(false);
    expect(isValidCurrencyFormat("75")).toBe(false);
    expect(isValidCurrencyFormat("€")).toBe(false);
  });
});

describe("normalizeCurrencyInput", () => {
  it("adds € prefix to valid short formats", () => {
    expect(normalizeCurrencyInput("75K")).toBe("€75K");
    expect(normalizeCurrencyInput("35M")).toBe("€35M");
  });

  it("keeps already-formatted values", () => {
    expect(normalizeCurrencyInput("€75K")).toBe("€75K");
    expect(normalizeCurrencyInput("€35M")).toBe("€35M");
  });

  it("converts raw numbers", () => {
    expect(normalizeCurrencyInput("75000")).toBe("€75K");
    expect(normalizeCurrencyInput("35000000")).toBe("€35M");
  });

  it("handles empty input", () => {
    expect(normalizeCurrencyInput("")).toBe("");
  });
});
