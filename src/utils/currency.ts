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
