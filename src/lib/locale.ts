// Some devices (notably certain Android browsers and embedded webviews) report
// language tags that Intl rejects, e.g. "en-US@posix". Passing those straight
// into Intl.NumberFormat / toLocaleString throws a RangeError and takes the
// whole page down. Always normalise a locale through these helpers.

const FALLBACK_LOCALE = "fr-FR";

export function safeLocale(locale?: string | null): string {
  if (!locale) return FALLBACK_LOCALE;
  try {
    const [canonical] = Intl.getCanonicalLocales(locale);
    if (canonical) {
      // Final sanity check: some tags canonicalise but still fail formatting.
      new Intl.NumberFormat(canonical);
      return canonical;
    }
  } catch {
    // fall through
  }
  // Try the bare language subtag (e.g. "en" from "en-US@posix").
  const base = String(locale).split(/[-_@.]/)[0];
  try {
    if (base) {
      new Intl.NumberFormat(base);
      return base;
    }
  } catch {
    // ignore
  }
  return FALLBACK_LOCALE;
}

export function formatNumber(
  value: number,
  locale?: string | null,
  options?: Intl.NumberFormatOptions,
): string {
  const amount = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(safeLocale(locale), options).format(amount);
  } catch {
    return amount.toFixed(options?.maximumFractionDigits ?? 2);
  }
}
