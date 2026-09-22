/**
 * TrendVid API - Cloudflare Worker.
 *
 * Rebuilt from the *verified* behaviour of the live api.trendvid.net endpoint, with the
 * bugs fixed (no more HTTP 500 on bad input, no more silent contract drift).
 *
 * Routes
 *   GET /videos?type=trending|mostViewed&country=<GLOBAL|XX>&category=<id|0>
 *              &page=<n>            (GLOBAL/aggregated paging)
 *              &pageToken=<opaque>  (country paging, from nextPageToken)
 *              &pageSize=<1..50>
 *   GET /categories?country=<XX>
 *   GET /diag                       (health/config introspection)
 *   GET /                           (API description)
 *
 * Bindings (see wrangler.toml / docs/DEPLOYMENT.md)
 *   KV namespace TRENDING   -> cache (optional; the Worker runs uncached without it)
 *   secret YOUTUBE_API_KEY  -> required for live data
 *   vars ALLOWED_ORIGINS, REGIONS, GLOBAL_REGION_LIMIT, CACHE_TTL, CACHE_STALE_TTL,
 *        MOST_VIEWED_SOURCE, DEFAULT_COUNTRY, API_VERSION
 */

const API_VERSION = '3.0.0';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://trendvid.net',
  'https://www.trendvid.net',
  'https://*.pages.dev',
  'http://localhost:8788',
  'http://127.0.0.1:8788',
  'http://localhost:3000',
  'http://localhost:5173',
];

const DEFAULT_REGIONS =
  'US,GB,DE,FR,ES,IT,TR,SA,AE,EG,JO,BR,MX,IN,ID,JP,KR,NG,PH,PK,ZA';

/** Fallback category list per region, used only when the YouTube API call fails. */
const FALLBACK_CATEGORIES = [
  { id: '1', title: 'Film & Animation' },
  { id: '2', title: 'Autos & Vehicles' },
  { id: '10', title: 'Music' },
  { id: '15', title: 'Pets & Animals' },
  { id: '17', title: 'Sports' },
  { id: '19', title: 'Travel & Events' },
  { id: '20', title: 'Gaming' },
  { id: '22', title: 'People & Blogs' },
  { id: '23', title: 'Comedy' },
  { id: '24', title: 'Entertainment' },
  { id: '25', title: 'News & Politics' },
  { id: '26', title: 'Howto & Style' },
  { id: '27', title: 'Education' },
  { id: '28', title: 'Science & Technology' },
];

/* ------------------------------------------------------------------ utilities */

/** "a,b, c" -> ['a','b','c']; falls back to `fallback` when empty. */
export function parseList(value, fallback = []) {
  const items = String(value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
}

/** Supports exact origins plus `*` wildcards such as https://*.pages.dev */
export function matchOrigin(pattern, origin) {
  if (!origin) return false;
  if (pattern === '*') return true;
  if (!pattern.includes('*')) return pattern.toLowerCase() === origin.toLowerCase();
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*');
  return new RegExp(`^${escaped}$`, 'i').test(origin);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = parseList(env.ALLOWED_ORIGINS, DEFAULT_ALLOWED_ORIGINS);
  const matched = origin && allowed.some((p) => matchOrigin(p, origin));
  const headers = {
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
  // Only echo an allowed origin. Anything else gets no CORS header (the browser blocks it).
  if (matched) headers['access-control-allow-origin'] = origin;
  return { headers, matchedOrigin: matched ? origin : null, allowed };
}

function json(body, { status = 200, headers = {}, cacheTtl = 0, cacheState = null } = {}) {
  const out = {
    'content-type': 'application/json; charset=utf-8',
    ...headers,
  };
  if (cacheTtl > 0) out['cache-control'] = `public, max-age=${cacheTtl}`;
  else out['cache-control'] = 'no-store';
  if (cacheState) out['x-trendvid-cache'] = cacheState;
  return new Response(JSON.stringify(body), { status, headers: out });
}

function jsonError(status, message, headers = {}, extra = {}) {
  return json({ error: { status, message, ...extra } }, { status, headers });
}

/** Deterministic int parsing with clamping (never throws, never returns NaN). */
export function intParam(value, { fallback, min, max }) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/** Tiny helper so a slow YouTube call cannot hang the request forever. */
async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------------ cache */

function configInt(env, key, fallback, min, max) {
  return intParam(env[key], { fallback, min, max });
}

/** Read a cache entry: { at: epochMs, data } */
async function readCache(env, key) {
  if (!env.TRENDING) return null;
  try {
    const hit = await env.TRENDING.get(key, { type: 'json' });
    return hit && typeof hit.at === 'number' ? hit : null;
  } catch {
    return null;
  }
}

async function writeCache(env, key, data, ttlSeconds) {
  if (!env.TRENDING) return;
  try {
    await env.TRENDING.put(key, JSON.stringify({ at: Date.now(), data }), { expirationTtl: ttlSeconds });
  } catch { /* cache is best-effort */ }
}

function isFresh(entry, ttlSeconds) {
  return Boolean(entry) && (Date.now() - entry.at) < ttlSeconds * 1000;
}

/* ---------------------------------------------------------------- result shape */

const THUMB_FILES = [
  ['default', 'default.jpg'],
  ['medium', 'mqdefault.jpg'],
  ['high', 'hqdefault.jpg'],
  ['standard', 'sddefault.jpg'],
  ['maxres', 'maxresdefault.jpg'],
];

/** Always return all five thumbnail sizes so consumers never see `undefined`. */
export function normalizeThumbnails(video) {
  const source = video?.snippet?.thumbnails || video?.thumbnails || {};
  const id = typeof video?.id === 'string' ? video.id : video?.id?.videoId || '';
  const out = {};
  for (const [name, file] of THUMB_FILES) {
    const hit = source[name];
    if (hit?.url) out[name] = { url: hit.url, width: hit.width || 0, height: hit.height || 0 };
    else if (id) out[name] = { url: `https://i.ytimg.com/vi/${id}/${file}`, width: 0, height: 0 };
  }
  return out;
}

/** One API item: { id, title, channelTitle, publishedAt, viewCount, thumbnails } */
export function normalizeVideo(video) {
  const snippet = video?.snippet || {};
  return {
    id: typeof video?.id === 'string' ? video.id : video?.id?.videoId || '',
    title: snippet.title || video?.title || '',
    channelTitle: snippet.channelTitle || video?.channelTitle || '',
    publishedAt: snippet.publishedAt || video?.publishedAt || '',
    viewCount: String(video?.statistics?.viewCount ?? video?.viewCount ?? '0'),
    thumbnails: normalizeThumbnails(video),
  };
}

/* ------------------------------------------------------------- YouTube upstream */

class YouTubeError extends Error {
  constructor(message, { status = 0, reason = '' } = {}) {
    super(message);
    this.name = 'YouTubeError';
    this.status = status;
    this.reason = reason;
  }
  /** Quota / rate problems deserve a 503, not a 500. */
  get isQuota() {
    return this.reason === 'quotaExceeded' || this.reason === 'rateLimitExceeded' || this.status === 429;
  }
}

async function ytJson(env, path, params) {
  if (!env.YOUTUBE_API_KEY) {
    throw new YouTubeError('Server is missing the YOUTUBE_API_KEY secret', { status: 500, reason: 'missingKey' });
  }
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  url.searchParams.set('key', env.YOUTUBE_API_KEY);

  const res = await fetchWithTimeout(url.toString(), 9000);
  if (!res.ok) {
    let reason = '';
    let message = `YouTube API HTTP ${res.status}`;
    try {
      const body = await res.json();
      reason = body?.error?.errors?.[0]?.reason || '';
      message = body?.error?.message || message;
    } catch { /* body was not JSON */ }
    throw new YouTubeError(message, { status: res.status, reason });
  }
  return res.json();
}

/** Popularity chart for one region (+ optional category). Costs 1 quota unit. */
async function fetchChart(env, { country, category, pageToken, pageSize }) {
  const data = await ytJson(env, 'videos', {
    part: 'snippet,statistics',
    chart: 'mostPopular',
    regionCode: country,
    videoCategoryId: category || undefined,
    maxResults: pageSize,
    pageToken: pageToken || undefined,
  });
  return {
    items: (data.items || []).map(normalizeVideo).filter((v) => v.id),
    nextPageToken: data.nextPageToken || '',
    prevPageToken: data.prevPageToken || '',
  };
}

/** Most-viewed via search (100 units + 1). Only used when MOST_VIEWED_SOURCE=search. */
async function fetchMostViewedBySearch(env, { country, category, pageToken, pageSize }) {
  const search = await ytJson(env, 'search', {
    part: 'snippet',
    type: 'video',
    order: 'viewCount',
    regionCode: country,
    videoCategoryId: category || undefined,
    publishedAfter: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    maxResults: pageSize,
    pageToken: pageToken || undefined,
  });
  const ids = (search.items || []).map((i) => i.id?.videoId).filter(Boolean);
  const tokens = { nextPageToken: search.nextPageToken || '', prevPageToken: search.prevPageToken || '' };
  if (!ids.length) return { items: [], ...tokens };

  const details = await ytJson(env, 'videos', { part: 'snippet,statistics', id: ids.join(',') });
  const byId = new Map((details.items || []).map((v) => [v.id, v]));
  return { items: ids.map((id) => byId.get(id)).filter(Boolean).map(normalizeVideo), ...tokens };
}

async function fetchCategories(env, country) {
  const data = await ytJson(env, 'videoCategories', { part: 'snippet', regionCode: country });
  return (data.items || [])
    .map((c) => ({ id: String(c.id), title: c.snippet?.title || '' }))
    .filter((c) => c.id && c.title);
}

/* ----------------------------------------------------------------- aggregation */

/**
 * Worldwide mode: sample several countries, then rank a video by how many of those
 * charts it appears in (ties broken by view count). That is what makes the "Global"
 * tab meaningful instead of just being the US chart.
 */
async function buildGlobal(env, { type, category, pageSize }) {
  const regions = parseList(env.REGIONS, DEFAULT_REGIONS.split(','))
    .slice(0, configInt(env, 'GLOBAL_REGION_LIMIT', 12, 1, 30));

  const useSearch = type === 'mostViewed' && env.MOST_VIEWED_SOURCE === 'search';
  const results = await Promise.allSettled(
    regions.map((region) => (useSearch
      ? fetchMostViewedBySearch(env, { country: region, category, pageSize })
      : fetchChart(env, { country: region, category, pageSize }))),
  );

  const oks = results.filter((r) => r.status === 'fulfilled');
  if (!oks.length) {
    const rejected = results.find((r) => r.status === 'rejected');
    throw rejected?.reason || new YouTubeError('No region returned data', { status: 502 });
  }

  const merged = new Map();
  for (const result of oks) {
    for (const video of result.value.items) {
      const prev = merged.get(video.id);
      if (!prev) {
        merged.set(video.id, { ...video, chartCount: 1 });
      } else {
        prev.chartCount += 1;
        if (Number(video.viewCount) > Number(prev.viewCount)) prev.viewCount = video.viewCount;
      }
    }
  }

  const items = [...merged.values()]
    .sort((a, b) => (b.chartCount - a.chartCount) || (Number(b.viewCount) - Number(a.viewCount)))
    .map(({ chartCount, ...video }) => video); // ranking helper stays out of the payload

  return { items, regionsQueried: regions.length, regionsOk: oks.length };
}

/* -------------------------------------------------------------------- handlers */

async function handleVideos(env, url, cors) {
  const type = url.searchParams.get('type') || 'trending';
  if (type !== 'trending' && type !== 'mostViewed') {
    return jsonError(400, `Invalid type "${type}". Use trending or mostViewed.`, cors.headers);
  }

  const rawCountry = String(url.searchParams.get('country') || env.DEFAULT_COUNTRY || 'GLOBAL').toUpperCase();
  const isGlobal = rawCountry === 'GLOBAL' || rawCountry === 'WW';
  if (!isGlobal && !/^[A-Z]{2}$/.test(rawCountry)) {
    return jsonError(400, `Invalid country "${rawCountry}". Use GLOBAL or an ISO 3166-1 alpha-2 code.`, cors.headers);
  }

  const rawCategory = url.searchParams.get('category') ?? '0';
  if (!/^\d{1,3}$/.test(rawCategory)) {
    return jsonError(400, `Invalid category "${rawCategory}". Use a numeric YouTube category id, or 0 for all.`, cors.headers);
  }
  const category = rawCategory === '0' ? '' : rawCategory;

  const pageSize = intParam(url.searchParams.get('pageSize'), { fallback: 20, min: 1, max: 50 });
  const page = intParam(url.searchParams.get('page'), { fallback: 1, min: 1, max: 500 });
  const pageToken = url.searchParams.get('pageToken') || '';
  const country = isGlobal ? 'GLOBAL' : rawCountry;

  const ttl = configInt(env, 'CACHE_TTL', 600, 30, 86400);
  const staleTtl = configInt(env, 'CACHE_STALE_TTL', 86400, 600, 604800);
  const cacheKey = `v3:videos:${type}:${country}:${category || 'all'}:`
    + (isGlobal ? `p${page}:${pageSize}` : `t${pageToken || 'first'}:${pageSize}`);

  const entry = await readCache(env, cacheKey);
  if (isFresh(entry, ttl)) {
    return json(entry.data, { headers: cors.headers, cacheTtl: Math.min(ttl, 300), cacheState: 'HIT' });
  }
  // Remember the previous good payload: if YouTube is down or quota-blocked we still serve it.
  const lastGood = entry?.data || null;

  try {
    let payload;
    if (isGlobal) {
      const global = await buildGlobal(env, { type, category, pageSize });
      const start = (page - 1) * pageSize;
      payload = {
        mode: 'GLOBAL',
        type,
        category: rawCategory,
        page,
        pageSize,
        totalApprox: global.items.length,
        regionsQueried: global.regionsQueried,
        regionsOk: global.regionsOk,
        items: global.items.slice(start, start + pageSize),
      };
    } else {
      const useSearch = type === 'mostViewed' && env.MOST_VIEWED_SOURCE === 'search';
      const result = useSearch
        ? await fetchMostViewedBySearch(env, { country, category, pageToken, pageSize })
        : await fetchChart(env, { country, category, pageToken, pageSize });
      payload = {
        mode: 'COUNTRY',
        country,
        type,
        category: rawCategory,
        nextPageToken: result.nextPageToken,
        prevPageToken: result.prevPageToken,
        items: result.items,
      };
    }
    await writeCache(env, cacheKey, payload, staleTtl);
    return json(payload, { headers: cors.headers, cacheTtl: Math.min(ttl, 300), cacheState: 'MISS' });
  } catch (error) {
    if (lastGood) {
      return json({ ...lastGood, stale: true }, {
        headers: { ...cors.headers, 'x-trendvid-stale': '1' },
        cacheTtl: 60,
        cacheState: 'STALE',
      });
    }
    if (error instanceof YouTubeError) {
      const status = error.isQuota ? 503 : error.status === 500 ? 500 : 502;
      return jsonError(status, error.message, cors.headers, { reason: error.reason || undefined });
    }
    return jsonError(502, 'Upstream failure while fetching videos', cors.headers);
  }
}

async function handleCategories(env, url, cors) {
  const country = String(url.searchParams.get('country') || 'US').toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) {
    return jsonError(400, `Invalid country "${country}". Use an ISO 3166-1 alpha-2 code.`, cors.headers);
  }

  const cacheKey = `v3:categories:${country}`;
  const entry = await readCache(env, cacheKey);
  if (isFresh(entry, 86400)) {
    return json({ country, source: 'cache', categories: entry.data },
      { headers: cors.headers, cacheTtl: 3600, cacheState: 'HIT' });
  }

  try {
    const categories = await fetchCategories(env, country);
    if (categories.length) {
      await writeCache(env, cacheKey, categories, 7 * 86400);
      return json({ country, source: 'youtube', categories },
        { headers: cors.headers, cacheTtl: 3600, cacheState: 'MISS' });
    }
    return json({ country, source: 'fallback', degraded: true, categories: FALLBACK_CATEGORIES },
      { headers: cors.headers, cacheTtl: 300 });
  } catch {
    // Categories are a nice-to-have: never let this endpoint 500 (the old API did exactly that).
    return json({ country, source: 'fallback', degraded: true, categories: FALLBACK_CATEGORIES },
      { headers: cors.headers, cacheTtl: 120 });
  }
}

function handleDiag(env, cors) {
  return json({
    ok: true,
    version: API_VERSION,
    cors: { matchedOrigin: cors.matchedOrigin, allowedPatterns: cors.allowed },
    bindings: {
      kvCache: Boolean(env.TRENDING),
      youtubeKey: Boolean(env.YOUTUBE_API_KEY),
    },
    config: {
      defaultCountry: env.DEFAULT_COUNTRY || 'GLOBAL',
      regions: parseList(env.REGIONS, DEFAULT_REGIONS.split(',')).length,
      globalRegionLimit: configInt(env, 'GLOBAL_REGION_LIMIT', 12, 1, 30),
      cacheTtlSeconds: configInt(env, 'CACHE_TTL', 600, 30, 86400),
      cacheStaleTtlSeconds: configInt(env, 'CACHE_STALE_TTL', 86400, 600, 604800),
      mostViewedSource: env.MOST_VIEWED_SOURCE === 'search' ? 'search' : 'chart',
    },
  }, { headers: cors.headers });
}

/* ----------------------------------------------------------------------- router */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors.headers });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonError(405, 'Method not allowed. Use GET.', cors.headers);
    }

    try {
      if (path === '/videos') return await handleVideos(env, url, cors);
      if (path === '/categories') return await handleCategories(env, url, cors);
      if (path === '/diag') return handleDiag(env, cors);

      if (path === '/') {
        return json({
          name: 'TrendVid API',
          version: API_VERSION,
          endpoints: {
            '/videos': 'GET type=trending|mostViewed&country=<GLOBAL|XX>&category=<id|0>[&page=n | &pageToken=t][&pageSize=1..50]',
            '/categories': 'GET country=<XX>',
            '/diag': 'GET (health + configuration)',
          },
          notes: [
            'country=GLOBAL aggregates several regional charts (mode: GLOBAL, page/pageSize/totalApprox).',
            'Country responses carry nextPageToken/prevPageToken (mode: COUNTRY).',
            'Invalid parameters return 400 with a JSON error object - never a 500.',
          ],
        }, { headers: cors.headers, cacheTtl: 3600 });
      }

      return jsonError(404, `Unknown endpoint "${url.pathname}". See / for the endpoint list.`, cors.headers);
    } catch (error) {
      return jsonError(500, `Unhandled error: ${error?.message || 'unknown'}`, cors.headers);
    }
  },
};
