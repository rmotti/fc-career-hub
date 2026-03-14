/**
 * Currency formatting utilities for €XK / €XM format.
 */

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

/**
 * Parses a formatted currency string back to number.
 * Handles: "€750K" → 750000, "€35M" → 35000000, "75K" → 75000, "35M" → 35000000, "€1.5M" → 1500000
 * Also handles raw number strings: "750000" → 750000
 */
export function parseCurrencyToNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.trim().replace(/^€/, "").trim();
  if (!cleaned) return 0;

  const upperCleaned = cleaned.toUpperCase();

  const mMatch = upperCleaned.match(/^([\d.]+)\s*M$/);
  if (mMatch) {
    return parseFloat(mMatch[1]) * 1_000_000;
  }

  const kMatch = upperCleaned.match(/^([\d.]+)\s*K$/);
  if (kMatch) {
    return parseFloat(kMatch[1]) * 1_000;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Validates if a string is in valid currency format: €XK, €XM, XK, XM
 */
export function isValidCurrencyFormat(value: string): boolean {
  if (!value) return false;
  const cleaned = value.trim();
  return /^€?\d+(\.\d+)?\s*[KkMm]$/.test(cleaned);
}

/**
 * Normalizes user input to the standard €XK/€XM format.
 * If user types "75K", returns "€75K". If "35000000", returns "€35M". If already formatted, returns as-is.
 */
export function normalizeCurrencyInput(value: string): string {
  if (!value || !value.trim()) return "";
  const trimmed = value.trim();

  // Already in valid format — just ensure € prefix
  if (isValidCurrencyFormat(trimmed)) {
    const withoutEuro = trimmed.replace(/^€/, "").trim().toUpperCase();
    return `€${withoutEuro}`;
  }

  // Raw number — convert to formatted
  const num = parseFloat(trimmed.replace(/^€/, ""));
  if (!isNaN(num) && num > 0) {
    return formatCurrency(num);
  }

  return trimmed;
}
