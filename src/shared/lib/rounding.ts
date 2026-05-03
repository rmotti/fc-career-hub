export function roundToDecimals(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return 0;

  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function roundToSingleDecimal(value: number): number {
  return roundToDecimals(value, 1);
}

export function formatRoundedDecimal(value: number, decimals: number): string {
  return roundToDecimals(value, decimals).toFixed(decimals);
}

export function formatRoundedSingleDecimal(value: number): string {
  return formatRoundedDecimal(value, 1);
}
