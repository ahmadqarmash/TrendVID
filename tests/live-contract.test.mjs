import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCategoriesUrl, buildVideosUrl, normalizeVideosResponse } from '../site/assets/js/api.js';

/**
 * Live contract alarm against the deployed API.
 * Skipped by default (no network in normal test runs / CI unless asked):
 *
 *   TRENDVID_LIVE=1 npm test
 *
 * Why it matters: the previous build shipped against an API contract it did not match,
 * so the grid was empty in production. This test fails loudly if that happens again.
 */
const LIVE = process.env.TRENDVID_LIVE === '1';
const API = process.env.TRENDVID_API || 'https://api.trendvid.net';
const options = { skip: LIVE ? false : 'set TRENDVID_LIVE=1 to run the live contract check' };

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  assert.equal(res.status, 200, `${url} -> HTTP ${res.status}`);
  return res.json();
}

test('live: GLOBAL trending parse + shape', options, async () => {
  const url = buildVideosUrl({ apiBase: API, type: 'trending', country: 'GLOBAL', category: '0', page: 1, pageSize: 20 });
  const body = normalizeVideosResponse(await getJson(url));
  assert.equal(body.mode, 'GLOBAL');
  assert.ok(body.items.length > 0, 'no items returned');
  assert.ok(body.items[0].thumb.startsWith('https://'), 'thumbnail url missing');
  assert.equal(typeof body.items[0].viewCount, 'number');
});

test('live: country trending parse + tokens', options, async () => {
  const url = buildVideosUrl({ apiBase: API, type: 'trending', country: 'US', category: '10' });
  const body = normalizeVideosResponse(await getJson(url));
  assert.equal(body.mode, 'COUNTRY');
  assert.equal(body.country, 'US');
  assert.ok(body.items.length > 0);
});

test('live: mostViewed parse', options, async () => {
  const url = buildVideosUrl({ apiBase: API, type: 'mostViewed', country: 'SA', category: '0' });
  const body = normalizeVideosResponse(await getJson(url));
  assert.ok(body.items.length > 0);
  assert.ok(['COUNTRY', 'GLOBAL'].includes(body.mode));
});

test('live: categories parse', options, async () => {
  const body = await getJson(buildCategoriesUrl({ apiBase: API, country: 'US' }));
  assert.ok(Array.isArray(body.categories) && body.categories.length > 0);
});

test('live: bad parameters never return data (400 once our Worker is deployed)', options, async () => {
  const res = await fetch(`${API}/videos?type=bogus&country=XX&category=999`);
  const body = await res.json().catch(() => ({}));

  // The old Worker answered 500 here (with no JSON body at all); the rebuilt Worker
  // answers 400 with a structured error. Either way it must never look like data.
  assert.ok(res.status >= 400, `expected an error status, got ${res.status}`);
  assert.ok(!Array.isArray(body.items), 'bad parameters must not return items');
  if (res.status === 400) {
    assert.ok(body.error?.message, 'the rebuilt Worker must return a JSON error message');
  } else {
    console.warn(`[live-contract] ${API} still returns HTTP ${res.status} without a JSON error body - `
      + 'that endpoint has not been replaced by the rebuilt Worker yet.');
  }
});
