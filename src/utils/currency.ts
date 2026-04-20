/**
 * Currency formatting utilities for €XK / €XM format.
 */

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
 * Examples: 750000 → "€750K", 1500000 → "€1.5M", 35000000 → "€35M", 500 → "€500"
 */
export function formatCurrency(value: number): string {
  if (value < 0) return `-${formatCurrency(-value)}`;
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const formatted = millions % 1 === 0 ? millions.toString() : millions.toFixed(1).replace(/\.0$/, "");
    return `€${formatted}M`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    const formatted = thousands % 1 === 0 ? thousands.toString() : thousands.toFixed(1).replace(/\.0$/, "");
    return `€${formatted}K`;
  }
  if (value === 0) return "€0";
  return `€${value}`;
}
