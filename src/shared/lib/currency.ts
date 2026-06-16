/**
 * Currency formatting utilities for €XK / €XM / €XB format.
 */

import { formatRoundedSingleDecimal } from "@/shared/lib/rounding";
import { eur, k, m, type Money } from "@/shared/lib/money";

const ONE_THOUSAND = 1_000;
const ONE_MILLION = 1_000_000;
const ONE_BILLION_IN_MILLIONS = 1_000;

/**
 * Parses a budget input expressed in millions and converts it to euros.
 * Examples: "100" -> 100000000, "2,5" -> 2500000
 */
export function parseBudgetInMillionsInput(value: string): Money<"eur"> | null {
  const normalizedValue = value.replace(",", ".").trim();

  if (!normalizedValue) return null;

  const millions = Number.parseFloat(normalizedValue);

  if (!Number.isFinite(millions) || millions < 0) {
    return null;
  }

  return eur(millions * ONE_MILLION);
}

/**
 * Legacy bug guard: a season budget should always be stored in euros and,
 * in practice, comes from an input expressed in millions. Positive values
 * below 1M are therefore treated as corrupted and normalized to zero.
 */
export function normalizeStoredBudget(value: number | null | undefined): Money<"eur"> {
  if (!Number.isFinite(value)) return eur(0);
  if (value! > 0 && value! < ONE_MILLION) return eur(0);
  return eur(value!);
}

/**
 * Converts a euro amount to a formatted currency string.
 * Examples: 750000 -> "€750.0K", 1500000 -> "€1.5M", 1000000000 -> "€1.0B", 500 -> "€500.0"
 */
export function formatCurrency(value: Money<"eur">): string {
  if (value < 0) return `-${formatCurrency(eur(-value))}`;
  if (value >= ONE_MILLION) {
    return formatCurrencyInMillions(m(value / ONE_MILLION));
  }
  if (value >= ONE_THOUSAND) {
    return formatCurrencyInThousands(k(value / ONE_THOUSAND));
  }
  return `€${formatRoundedSingleDecimal(value)}`;
}

export function formatCurrencyInMillions(value: Money<"M">): string {
  if (value >= ONE_BILLION_IN_MILLIONS) {
    return `€${formatRoundedSingleDecimal(value / ONE_BILLION_IN_MILLIONS)}B`;
  }

  return `€${formatRoundedSingleDecimal(value)}M`;
}

export function formatCurrencyInThousands(value: Money<"k">): string {
  return `€${formatRoundedSingleDecimal(value)}K`;
}

export function formatSignedCurrencyInMillions(value: Money<"M">): string {
  if (value === 0) return formatCurrencyInMillions(m(0));
  return `${value > 0 ? "+" : "-"}${formatCurrencyInMillions(m(Math.abs(value)))}`;
}

export function formatSignedCurrencyInThousands(value: Money<"k">): string {
  if (value === 0) return formatCurrencyInThousands(k(0));
  return `${value > 0 ? "+" : "-"}${formatCurrencyInThousands(k(Math.abs(value)))}`;
}
