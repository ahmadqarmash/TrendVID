/**
 * Pure tool logic (no DOM) - shared by the tool scripts and tests/tools-logic.test.mjs.
 * Limits are YouTube's published ones; see the FAQ links on each tool page.
 */

export const LIMITS = {
  title: 100,
  description: 5000,
  hashtagsIgnoredAbove: 60,
  chapterMinSeconds: 10,
  chapterMinCount: 3,
  thumbMaxBytes: 2 * 1024 * 1024,
  thumbMinWidth: 640,
  thumbRecommended: [1280, 720],
};

/** Count user-perceived characters (emoji and Arabic marks count once). */
export function charCount(text) {
  const s = String(text ?? '');
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    let n = 0;
    for (const _ of new Intl.Segmenter().segment(s)) n += 1;
    return n;
  }
  return Array.from(s).length;
}

/* ---------------------------------------------------------- earnings calculator */

export function earnings(dailyViews, rpm) {
  const views = Math.max(0, Number(dailyViews) || 0);
  const rate = Math.max(0, Number(rpm) || 0);
  const day = (views / 1000) * rate;
  return { day, month: day * 30, year: day * 365 };
}

/** Daily views needed to reach a monthly income goal at a given RPM (null if RPM is 0). */
export function viewsForGoal(monthlyGoal, rpm) {
  const goal = Math.max(0, Number(monthlyGoal) || 0);
  const rate = Number(rpm) || 0;
  if (rate <= 0) return null;
  const monthly = Math.ceil((goal / rate) * 1000);
  return { daily: Math.ceil(monthly / 30), monthly };
}

/* --------------------------------------------------------------- title checker */

const EMOJI_RE = /\p{Extended_Pictographic}/gu;

/**
 * Returns { count, checks: [{ level: 'ok'|'warn'|'bad', key, value? }] }.
 * Keys are translated by the tool script.
 */
export function analyzeTitle(title) {
  const text = String(title ?? '').trim();
  const count = charCount(text);
  const checks = [];
  if (!count) return { count, checks };

  if (count > LIMITS.title) checks.push({ level: 'bad', key: 'tooLong', value: count - LIMITS.title });
  else if (count > 70) checks.push({ level: 'warn', key: 'mayTruncate' });
  else if (count < 20) checks.push({ level: 'warn', key: 'veryShort' });
  else checks.push({ level: 'ok', key: 'goodLength' });

  const capsWords = (text.match(/\b[A-Z]{3,}\b/g) || []).length;
  if (capsWords > 2) checks.push({ level: 'warn', key: 'tooManyCaps', value: capsWords });

  const emoji = (text.match(EMOJI_RE) || []).length;
  if (emoji > 2) checks.push({ level: 'warn', key: 'tooManyEmoji', value: emoji });

  if (/([!?؟])\1{2,}/.test(text)) checks.push({ level: 'warn', key: 'repeatedPunctuation' });
  if (/[<>]/.test(text)) checks.push({ level: 'bad', key: 'angleBrackets' });
  if (/#\S+/.test(text)) checks.push({ level: 'warn', key: 'hashtagInTitle' });
  if (/\d/.test(text)) checks.push({ level: 'ok', key: 'hasNumber' });
  return { count, checks };
}

/* ----------------------------------------------------- description + chapters */

/** "1:02:03" -> 3723, "2:05" -> 125, invalid -> null. */
export function parseTimestamp(value) {
  const parts = String(value).split(':').map((p) => Number(p));
  if (parts.length < 2 || parts.length > 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) return null;
  if (parts.slice(1).some((n) => n > 59)) return null;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

export function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

const TIMESTAMP_LINE = /^\s*[([]?((?:\d{1,2}:)?\d{1,2}:\d{2})[)\]]?\s*[-–—:|]?\s*(.*)$/;

/** Timestamps that start a line, in order of appearance: [{ seconds, label, raw }]. */
export function extractTimestamps(text) {
  const out = [];
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const m = line.match(TIMESTAMP_LINE);
    if (!m) continue;
    const seconds = parseTimestamp(m[1]);
    if (seconds === null) continue;
    out.push({ seconds, label: m[2].trim(), raw: m[1] });
  }
  return out;
}

/**
 * Apply YouTube's chapter rules. Returns { valid, chapters, problems: [{ key, value? }] }.
 * The last chapter's length is unknown (it runs to the end of the video), so it is not checked.
 */
export function checkChapters(timestamps) {
  const problems = [];
  if (!timestamps.length) return { valid: false, chapters: [], problems: [{ key: 'noTimestamps' }] };
  if (timestamps[0].seconds !== 0) problems.push({ key: 'firstNotZero', value: timestamps[0].raw });
  if (timestamps.length < LIMITS.chapterMinCount) problems.push({ key: 'tooFew', value: timestamps.length });
  for (let i = 1; i < timestamps.length; i += 1) {
    const gap = timestamps[i].seconds - timestamps[i - 1].seconds;
    if (gap <= 0) problems.push({ key: 'notAscending', value: timestamps[i].raw });
    else if (gap < LIMITS.chapterMinSeconds) problems.push({ key: 'tooShort', value: timestamps[i - 1].raw });
  }
  return { valid: problems.length === 0, chapters: timestamps, problems };
}

export function analyzeDescription(text) {
  const s = String(text ?? '');
  const hashtags = s.match(/(^|\s)#[\p{L}\p{N}_]+/gu) || [];
  const links = s.match(/https?:\/\/[^\s<>]+/g) || [];
  const timestamps = extractTimestamps(s);
  const problems = [];
  const count = charCount(s);
  if (count > LIMITS.description) problems.push({ level: 'bad', key: 'descTooLong', value: count - LIMITS.description });
  if (/[<>]/.test(s)) problems.push({ level: 'bad', key: 'angleBrackets' });
  if (hashtags.length > LIMITS.hashtagsIgnoredAbove) problems.push({ level: 'bad', key: 'hashtagsIgnored', value: hashtags.length });
  return {
    count,
    hashtags: hashtags.length,
    links: links.length,
    timestamps,
    fold: s.split(/\r?\n/).filter((l) => l.trim()).slice(0, 3).join('\n').slice(0, 200),
    problems,
    chapters: checkChapters(timestamps),
  };
}

/* ----------------------------------------------------------- thumbnail checker */

const THUMB_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

/** { type, size, width, height } -> [{ level, key, value? }] */
export function checkThumbnail({ type, size, width, height }) {
  const checks = [];
  checks.push(THUMB_TYPES.includes(type)
    ? { level: 'ok', key: 'formatOk', value: type.replace('image/', '').toUpperCase() }
    : { level: 'bad', key: 'formatBad', value: type || '?' });

  checks.push(size <= LIMITS.thumbMaxBytes
    ? { level: 'ok', key: 'sizeOk', value: size }
    : { level: 'bad', key: 'sizeBad', value: size });

  const [rw, rh] = LIMITS.thumbRecommended;
  if (width < LIMITS.thumbMinWidth) checks.push({ level: 'bad', key: 'tooSmall', value: `${width}×${height}` });
  else if (width === rw && height === rh) checks.push({ level: 'ok', key: 'dimsPerfect', value: `${width}×${height}` });
  else checks.push({ level: 'warn', key: 'dimsOther', value: `${width}×${height}` });

  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) / (16 / 9) <= 0.01) checks.push({ level: 'ok', key: 'ratioOk' });
  else checks.push({ level: 'warn', key: 'ratioBad', value: ratio.toFixed(2) });
  return checks;
}

/* -------------------------------------------------------------------- shared */

export function formatMoney(amount, lang) {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'en', {
    style: 'currency', currency: 'USD', maximumFractionDigits: amount < 100 ? 2 : 0,
  }).format(amount);
}

export function formatNumber(n, lang) {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'en').format(n);
}

export function formatBytes(bytes, lang) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${formatNumber(Math.round(mb * 100) / 100, lang)} MB` : `${formatNumber(Math.round(bytes / 1024), lang)} KB`;
}
