/**
 * Pure formatting/escaping helpers. No DOM access -> unit tested in tests/format.test.mjs.
 */

/**
 * Compact view count, mirroring production behaviour:
 *   999 -> "999", 1500 -> "1.5K", 53730 -> "54K", 1234567 -> "1.2M", 12345678 -> "12M".
 * One decimal below 10 units, none above (so large numbers stay readable).
 */
export function formatViews(n) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num) || num < 0) return '0';
  const abs = Math.abs(num);
  if (abs >= 1e12) return trim(num / 1e12, abs) + 'T';
  if (abs >= 1e9) return trim(num / 1e9, abs) + 'B';
  if (abs >= 1e6) return trim(num / 1e6, abs) + 'M';
  if (abs >= 1e3) return trim(num / 1e3, abs) + 'K';
  return String(Math.round(num));
}

/** One decimal below 10 units, none above (matches production behaviour). */
function trim(value, abs) {
  const unit = abs >= 1e12 ? 1e12 : abs >= 1e9 ? 1e9 : abs >= 1e6 ? 1e6 : 1e3;
  return (value).toFixed(abs / unit >= 10 ? 0 : 1);
}

/** Escape for HTML text nodes and quoted attributes. Safe for API-provided strings. */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/** Escape then neutralize quotes - used when interpolating into attributes. */
export function escapeAttr(value) {
  return escapeHtml(value);
}

/** Truncate on word boundaries for meta descriptions. */
export function truncate(text, max = 155) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

/** Localized relative time ("3 days ago" / "قبل ٣ أيام"). Falls back to the raw date. */
export function formatRelativeDate(iso, lang = 'en', now = new Date()) {
  const then = new Date(iso);
  if (!iso || Number.isNaN(then.getTime())) return '';
  const diffMs = then.getTime() - now.getTime();
  const units = [
    ['year', 365 * 24 * 3600 * 1000],
    ['month', 30 * 24 * 3600 * 1000],
    ['week', 7 * 24 * 3600 * 1000],
    ['day', 24 * 3600 * 1000],
    ['hour', 3600 * 1000],
    ['minute', 60 * 1000],
  ];
  try {
    const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar' : 'en', { numeric: 'auto' });
    for (const [unit, ms] of units) {
      if (Math.abs(diffMs) >= ms) return rtf.format(Math.round(diffMs / ms), unit);
    }
    return rtf.format(Math.round(diffMs / 1000), 'second');
  } catch {
    return then.toISOString().slice(0, 10);
  }
}

/** Clamp a positive page number (1-based). */
export function toPage(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
