/**
 * Currency formatting utilities for €XK / €XM format.
 */

import { formatRoundedSingleDecimal } from "@/utils/rounding";

const ONE_THOUSAND = 1_000;
const ONE_MILLION = 1_000_000;

/**
 * Parses a budget input expressed in millions and converts it to euros.
 * Examples: "100" -> 100000000, "2,5" -> 2500000
 */
export function parseBudgetInMillionsInput(value: string): number | null {
  const normalizedValue = value.replace(",", ".").trim();

  if (!normalizedValue) return null;

  const millions = Number.parseFloat(normalizedValue);

  if (!Number.isFinite(millions) || millions < 0) {
    return null;
  }

  return millions * ONE_MILLION;
}

/**
 * Legacy bug guard: a season budget should always be stored in euros and,
 * in practice, comes from an input expressed in millions. Positive values
 * below 1M are therefore treated as corrupted and normalized to zero.
 */
export function normalizeStoredBudget(value: number | null | undefined): number {
  if (!Number.isFinite(value)) return 0;
  if (value > 0 && value < ONE_MILLION) return 0;
  return value;
}

/**
 * Converts a number to a formatted currency string.
 * Examples: 750000 → "€750.0K", 1500000 → "€1.5M", 35000000 → "€35.0M", 500 → "€500.0"
 */
export function formatCurrency(value: number): string {
  if (value < 0) return `-${formatCurrency(-value)}`;
  if (value >= ONE_MILLION) {
    return formatCurrencyInMillions(value / ONE_MILLION);
  }
  if (value >= ONE_THOUSAND) {
    return formatCurrencyInThousands(value / ONE_THOUSAND);
  }
  return `€${formatRoundedSingleDecimal(value)}`;
}

export function formatCurrencyInMillions(value: number): string {
  return `€${formatRoundedSingleDecimal(value)}M`;
}

export function formatCurrencyInThousands(value: number): string {
  return `€${formatRoundedSingleDecimal(value)}K`;
}

export function formatSignedCurrencyInMillions(value: number): string {
  if (value === 0) return formatCurrencyInMillions(0);
  return `${value > 0 ? "+" : "-"}${formatCurrencyInMillions(Math.abs(value))}`;
}

export function formatSignedCurrencyInThousands(value: number): string {
  if (value === 0) return formatCurrencyInThousands(0);
  return `${value > 0 ? "+" : "-"}${formatCurrencyInThousands(Math.abs(value))}`;
}
