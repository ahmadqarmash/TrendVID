import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatViews, truncate, toPage, escapeHtml, formatRelativeDate,
} from '../site/assets/js/format.js';

test('formatViews mirrors the production rounding rules', () => {
  // the API sends viewCount as a string, so this must coerce
  assert.equal(formatViews('53730'), '54K');
  assert.equal(formatViews(0), '0');
  assert.equal(formatViews(999), '999');
  assert.equal(formatViews(1500), '1.5K');
  assert.equal(formatViews(1_000_000), '1.0M');
  assert.equal(formatViews(1_234_567), '1.2M');
  assert.equal(formatViews(12_345_678), '12M');
  assert.equal(formatViews(1_000_000_000), '1.0B');
  assert.equal(formatViews(1_000_000_000_000), '1.0T');
});

test('formatViews never returns NaN/undefined', () => {
  assert.equal(formatViews(undefined), '0');
  assert.equal(formatViews(null), '0');
  assert.equal(formatViews('not-a-number'), '0');
  assert.equal(formatViews(-5), '0');
});

test('escapeHtml neutralises markup from the API', () => {
  assert.equal(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  assert.equal(escapeHtml("it's & <ok>"), 'it&#39;s &amp; &lt;ok&gt;');
  assert.equal(escapeHtml(null), '');
});

test('truncate respects the limit and adds an ellipsis', () => {
  const long = 'a '.repeat(200);
  const out = truncate(long, 155);
  assert.ok(out.length <= 155, `expected <=155, got ${out.length}`);
  assert.ok(out.endsWith('…'));
  assert.equal(truncate('short', 155), 'short');
});

test('toPage sanitises page numbers', () => {
  assert.equal(toPage('3'), 3);
  assert.equal(toPage('0'), 1);
  assert.equal(toPage('-2'), 1);
  assert.equal(toPage('abc'), 1);
  assert.equal(toPage(undefined), 1);
});

test('formatRelativeDate is localized', () => {
  const now = new Date('2026-09-23T12:00:00Z');
  assert.equal(formatRelativeDate('2026-09-20T12:00:00Z', 'en', now), '3 days ago');
  const ar = formatRelativeDate('2026-09-20T12:00:00Z', 'ar', now);
  assert.ok(ar.length > 0);
  assert.equal(formatRelativeDate('', 'en', now), '');
  assert.equal(formatRelativeDate('not-a-date', 'en', now), '');
});
