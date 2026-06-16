/**
 * Typed money wrapper. Monetary values flow through the app in three different
 * units (euros, thousands, millions) but are all plain `number`s on the wire,
 * which makes it trivial to format a millions value as if it were euros. The
 * `Money<Unit>` brand makes the unit part of the type so a mismatch is a
 * compile error instead of a runtime bug.
 *
 * The brand is type-only: at runtime a `Money` is just its underlying number,
 * so it serializes and compares exactly like a `number` (zero overhead).
 */

export type MoneyUnit = "eur" | "k" | "M";

declare const moneyBrand: unique symbol;

export type Money<U extends MoneyUnit> = number & { readonly [moneyBrand]: U };

/** Brands a raw number as euros. */
export const eur = (value: number): Money<"eur"> => value as Money<"eur">;

/** Brands a raw number as thousands (e.g. weekly wages: `45` → €45K). */
export const k = (value: number): Money<"k"> => value as Money<"k">;

/** Brands a raw number as millions (e.g. transfer fees: `20` → €20M). */
export const m = (value: number): Money<"M"> => value as Money<"M">;

const ONE_THOUSAND = 1_000;
const ONE_MILLION = 1_000_000;

/** Converts a thousands value to euros. */
export const kToEur = (value: Money<"k">): Money<"eur"> => eur(value * ONE_THOUSAND);

/** Converts a millions value to euros. */
export const mToEur = (value: Money<"M">): Money<"eur"> => eur(value * ONE_MILLION);
