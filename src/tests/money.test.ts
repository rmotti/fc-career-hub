import { describe, expect, it } from "vitest";
import { eur, k, m, kToEur, mToEur } from "@/shared/lib/money";

describe("money constructors", () => {
  it("brand values without changing the underlying number", () => {
    expect(eur(85_000_000)).toBe(85_000_000);
    expect(k(45)).toBe(45);
    expect(m(20)).toBe(20);
  });
});

describe("money conversions to euros", () => {
  it("converts thousands to euros", () => {
    expect(kToEur(k(45))).toBe(45_000);
    expect(kToEur(k(0))).toBe(0);
  });

  it("converts millions to euros", () => {
    expect(mToEur(m(20))).toBe(20_000_000);
    expect(mToEur(m(2.5))).toBe(2_500_000);
  });
});
