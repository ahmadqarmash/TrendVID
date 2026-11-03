/**
 * Locale-aware formatting. Latin digits in both languages so numbers read the same across
 * the tools, the trending lists and YouTube Studio screenshots people compare against.
 */

const LOCALES = { ar: 'ar-u-nu-latn', en: 'en' };

export function locale(lang) {
  return LOCALES[lang] || LOCALES.en;
}

/** 1234567 -> "1.2M" / "1.2 مليون". Empty or invalid input -> ''. */
export function formatCompact(value, lang = 'en') {
  if (value === '' || value === null || value === undefined) return '';
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return '';
  return new Intl.NumberFormat(locale(lang), { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** "3 days ago" / "قبل 3 أيام". */
export function formatRelative(iso, lang = 'en', now = Date.now()) {
  const then = new Date(iso).getTime();
  if (!iso || Number.isNaN(then)) return '';
  const diff = then - now;
  const units = [
    ['year', 365 * 864e5], ['month', 30 * 864e5], ['week', 7 * 864e5],
    ['day', 864e5], ['hour', 36e5], ['minute', 6e4],
  ];
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' });
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return rtf.format(0, 'minute');
}

/** "3 November 2026" / "3 نوفمبر 2026". */
export function formatDate(iso, lang = 'en') {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale(lang), { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(d);
}

/** Collapse whitespace and cut on a word boundary (meta descriptions). */
export function truncate(text, max = 155) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}
