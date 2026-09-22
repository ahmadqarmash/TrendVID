import test from 'node:test';
import assert from 'node:assert/strict';

import worker, { intParam, matchOrigin, normalizeVideo, parseList } from '../api/src/index.js';

const API = 'https://api.trendvid.net';

function makeEnv(overrides = {}) {
  return {
    YOUTUBE_API_KEY: 'test-key',
    REGIONS: 'US,GB',
    GLOBAL_REGION_LIMIT: '2',
    CACHE_TTL: '600',
    CACHE_STALE_TTL: '86400',
    MOST_VIEWED_SOURCE: 'chart',
    DEFAULT_COUNTRY: 'GLOBAL',
    ...overrides,
  };
}

function ytVideo(id, region) {
  return {
    id,
    snippet: {
      title: `Video ${id} in ${region}`,
      channelTitle: `Channel ${region}`,
      publishedAt: '2026-09-20T10:00:00Z',
      thumbnails: { high: { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, width: 480, height: 360 } },
    },
    statistics: { viewCount: '12345' },
  };
}

/** Fake YouTube upstream. Every region returns 3 videos, one of which is shared. */
function stubYouTube() {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    calls.push(url);
    if (url.hostname !== 'www.googleapis.com') throw new Error(`unexpected host: ${url.hostname}`);
    const region = url.searchParams.get('regionCode') || 'XX';
    if (url.pathname.endsWith('/videos')) {
      return Response.json({
        items: [ytVideo(`${region}1`, region), ytVideo(`${region}2`, region), ytVideo('SHARED', region)],
        nextPageToken: 'NEXT',
        prevPageToken: 'PREV',
      });
    }
    if (url.pathname.endsWith('/videoCategories')) {
      return Response.json({
        items: [{ id: '10', snippet: { title: 'Music' } }, { id: '20', snippet: { title: 'Gaming' } }],
      });
    }
    if (url.pathname.endsWith('/search')) return Response.json({ items: [], nextPageToken: '' });
    throw new Error(`unstubbed upstream call: ${url.pathname}`);
  };
  return { calls, restore: () => { globalThis.fetch = original; } };
}

/** In-memory KV stub with the same surface the Worker uses. */
function makeKv(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    async get(key) { return store.has(key) ? store.get(key) : null; },
    async put(key, value) { store.set(key, JSON.parse(value)); },
  };
}

const call = (path, env, headers = {}) => worker.fetch(new Request(`${API}${path}`, { headers }), env, {});

test('country mode returns the verified contract shape', async (t) => {
  const yt = stubYouTube();
  t.after(yt.restore);

  const res = await call('/videos?type=trending&country=US&category=10', makeEnv());
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(body.mode, 'COUNTRY');
  assert.equal(body.country, 'US');
  assert.equal(body.type, 'trending');
  assert.equal(body.category, '10');
  assert.equal(body.nextPageToken, 'NEXT');
  assert.equal(body.prevPageToken, 'PREV');
  assert.equal(body.items.length, 3);

  const item = body.items[0];
  assert.deepEqual(Object.keys(item).sort(),
    ['channelTitle', 'id', 'publishedAt', 'thumbnails', 'title', 'viewCount']);
  assert.equal(typeof item.viewCount, 'string'); // strings here are what broke the old front-end
  assert.ok(item.thumbnails.maxres.url); // all five sizes always present
  assert.equal(yt.calls[0].searchParams.get('chart'), 'mostPopular'); // cheap quota path
});

test('GLOBAL mode aggregates regions and ranks multi-chart videos first', async (t) => {
  const yt = stubYouTube();
  t.after(yt.restore);

  const body = await (await call('/videos?country=GLOBAL&page=1&pageSize=2', makeEnv())).json();
  assert.equal(body.mode, 'GLOBAL');
  assert.equal(body.page, 1);
  assert.equal(body.pageSize, 2);
  assert.equal(body.regionsQueried, 2);
  assert.equal(body.regionsOk, 2);
  assert.equal(body.totalApprox, 5); // US1, US2, GB1, GB2 + the shared video
  assert.equal(body.items.length, 2);
  assert.equal(body.items[0].id, 'SHARED'); // charts in both regions -> ranked first

  const page2 = await (await call('/videos?country=GLOBAL&page=2&pageSize=2', makeEnv())).json();
  assert.equal(page2.items.length, 2);
  assert.notEqual(page2.items[0].id, body.items[0].id);
});

test('invalid parameters return 400 with a JSON error (the old API returned 500)', async () => {
  const env = makeEnv();
  for (const path of ['/videos?type=bogus', '/videos?country=XX1', '/videos?category=abc']) {
    const res = await call(path, env);
    assert.equal(res.status, 400, `${path} should be a 400`);
    const body = await res.json();
    assert.ok(body.error?.message, `missing error message for ${path}`);
  }
});

test('unknown endpoints 404 and OPTIONS preflight is answered', async () => {
  assert.equal((await call('/nope', makeEnv())).status, 404);

  const preflight = await worker.fetch(
    new Request(`${API}/videos`, { method: 'OPTIONS', headers: { Origin: 'https://trendvid.net' } }),
    makeEnv(),
    {},
  );
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://trendvid.net');
});

test('CORS only echoes allow-listed origins (previews included via wildcards)', async () => {
  const env = makeEnv({ ALLOWED_ORIGINS: 'https://trendvid.net,https://*.pages.dev' });

  const allowed = await call('/diag', env, { Origin: 'https://trendvid.net' });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://trendvid.net');

  const preview = await call('/diag', env, { Origin: 'https://trendvid-preview.pages.dev' });
  assert.equal(preview.headers.get('access-control-allow-origin'), 'https://trendvid-preview.pages.dev');

  const blocked = await call('/diag', env, { Origin: 'https://evil.example' });
  assert.equal(blocked.headers.get('access-control-allow-origin'), null);
});

test('categories fall back to a static list instead of failing', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('upstream down'); };
  try {
    const res = await call('/categories?country=US', makeEnv());
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.degraded, true);
    assert.equal(body.source, 'fallback');
    assert.ok(body.categories.length >= 10);

    assert.equal((await call('/categories?country=USA', makeEnv())).status, 400);
  } finally {
    globalThis.fetch = original;
  }
});

test('categories come from YouTube when available', async (t) => {
  const yt = stubYouTube();
  t.after(yt.restore);
  const body = await (await call('/categories?country=US', makeEnv())).json();
  assert.equal(body.source, 'youtube');
  assert.deepEqual(body.categories, [{ id: '10', title: 'Music' }, { id: '20', title: 'Gaming' }]);
});

test('stale-while-error: an expired cache entry is still served when YouTube fails', async () => {
  const stalePayload = {
    mode: 'COUNTRY',
    country: 'US',
    type: 'trending',
    category: '0',
    nextPageToken: '',
    prevPageToken: '',
    items: [{ id: 'CACHED', title: 'cached', channelTitle: '', publishedAt: '', viewCount: '1', thumbnails: {} }],
  };
  const kv = makeKv({
    'v3:videos:trending:US:all:tfirst:20': { at: Date.now() - 120_000, data: stalePayload },
  });

  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('quota exhausted'); };
  try {
    const res = await call('/videos?country=US', makeEnv({ TRENDING: kv, CACHE_TTL: '30' }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.stale, true);
    assert.equal(body.items[0].id, 'CACHED');
    assert.equal(res.headers.get('x-trendvid-stale'), '1');
  } finally {
    globalThis.fetch = original;
  }
});

test('a warm cache is served without touching YouTube', async (t) => {
  const kv = makeKv();
  const yt = stubYouTube();
  t.after(yt.restore);
  const env = makeEnv({ TRENDING: kv });

  const first = await call('/videos?country=US', env);
  assert.equal(first.headers.get('x-trendvid-cache'), 'MISS');
  const callsAfterFirst = yt.calls.length;

  const second = await call('/videos?country=US', env);
  assert.equal(second.headers.get('x-trendvid-cache'), 'HIT');
  assert.equal(yt.calls.length, callsAfterFirst, 'a cache hit must not call YouTube');
});

test('diag reports bindings and configuration', async () => {
  const body = await (await call('/diag', makeEnv())).json();
  assert.equal(body.ok, true);
  assert.equal(body.bindings.youtubeKey, true);
  assert.equal(body.bindings.kvCache, false);
  assert.equal(body.config.mostViewedSource, 'chart');
  assert.equal(body.config.regions, 2);
});

test('pure helpers behave', () => {
  assert.deepEqual(parseList('a, b ,c', ['x']), ['a', 'b', 'c']);
  assert.deepEqual(parseList('', ['fallback']), ['fallback']);
  assert.equal(matchOrigin('https://trendvid.net', 'https://trendvid.net'), true);
  assert.equal(matchOrigin('https://*.pages.dev', 'https://abc.pages.dev'), true);
  assert.equal(matchOrigin('https://*.pages.dev', 'https://abc.example.com'), false);
  assert.equal(matchOrigin('*', 'https://anything.test'), true);
  assert.equal(intParam('99', { fallback: 20, min: 1, max: 50 }), 50);
  assert.equal(intParam('abc', { fallback: 20, min: 1, max: 50 }), 20);

  const normalized = normalizeVideo({ id: 'abc', snippet: { title: 't' }, statistics: { viewCount: '7' } });
  assert.deepEqual(Object.keys(normalized.thumbnails).sort(),
    ['default', 'high', 'maxres', 'medium', 'standard']);
  assert.equal(normalized.thumbnails.high.url, 'https://i.ytimg.com/vi/abc/hqdefault.jpg');
  assert.equal(normalized.viewCount, '7');
});
