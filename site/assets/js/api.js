/**
 * TrendVid API client.
 *
 * Contract (see docs/API-CONTRACT.md):
 *   GET /videos?type=trending|mostViewed&country=<GLOBAL|XX>&category=<id|0>&page=<n>|pageToken=<t>&pageSize=<n>
 *     GLOBAL  -> { mode:'GLOBAL',  type, category, page, pageSize, totalApprox, items[] }
 *     COUNTRY -> { mode:'COUNTRY', country, type, category, nextPageToken, prevPageToken, items[] }
 *   GET /categories?country=XX -> { country, categories:[{ id, title }] }
 */

export class ApiError extends Error {
  constructor(message, { status = 0, kind = 'api' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind; // 'network' | 'timeout' | 'http' | 'shape'
  }
}

/** True for the two modes the API understands. */
export function isValidType(type) {
  return type === 'trending' || type === 'mostViewed';
}

/** Build the /videos URL. Pure function so it can be unit tested. */
export function buildVideosUrl({ apiBase, type, country, category, page, pageToken, pageSize }) {
  const params = new URLSearchParams();
  params.set('type', isValidType(type) ? type : 'trending');
  params.set('country', country || 'GLOBAL');
  params.set('category', String(category ?? '0'));

  const isGlobal = !country || country === 'GLOBAL';
  if (isGlobal) {
    params.set('page', String(toPositiveInt(page, 1)));
  } else if (pageToken) {
    params.set('pageToken', pageToken);
  }
  if (pageSize) params.set('pageSize', String(toPositiveInt(pageSize, 20)));

  return `${apiBase.replace(/\/+$/, '')}/videos?${params.toString()}`;
}

/** Build the /categories URL (GLOBAL falls back to US categories). */
export function buildCategoriesUrl({ apiBase, country }) {
  const rc = !country || country === 'GLOBAL' ? 'US' : country;
  return `${apiBase.replace(/\/+$/, '')}/categories?country=${encodeURIComponent(rc)}`;
}

function toPositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Best available thumbnail, mirroring production's maxres -> high -> medium -> default order. */
export function pickThumbnail(thumbnails) {
  if (!thumbnails || typeof thumbnails !== 'object') return '';
  const order = ['maxres', 'standard', 'high', 'medium', 'default'];
  for (const key of order) {
    const url = thumbnails[key]?.url;
    if (url) return url;
  }
  return '';
}

/**
 * Normalize one API item into the shape the UI uses.
 * `viewCount` arrives as a string from the API - we expose a Number plus the raw string.
 */
export function normalizeVideo(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' ? raw.id : raw.id?.videoId;
  if (!id) return null;
  const viewCountRaw = raw.viewCount ?? raw.views ?? raw.statistics?.viewCount ?? '0';
  const viewCount = Number(viewCountRaw);
  return {
    id,
    title: raw.title ?? raw.snippet?.title ?? '',
    channelTitle: raw.channelTitle ?? raw.snippet?.channelTitle ?? '',
    publishedAt: raw.publishedAt ?? raw.snippet?.publishedAt ?? '',
    viewCount: Number.isFinite(viewCount) ? viewCount : 0,
    viewCountRaw: String(viewCountRaw),
    thumbnails: raw.thumbnails ?? {},
    thumb: pickThumbnail(raw.thumbnails),
  };
}

/** Normalize a whole API response. Throws ApiError('shape') if `items` is missing. */
export function normalizeVideosResponse(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.items)) {
    throw new ApiError('Unexpected API response: missing `items` array', { kind: 'shape' });
  }
  return {
    mode: data.mode || 'GLOBAL',
    country: data.country || null,
    type: data.type || '',
    category: data.category ?? '0',
    page: toPositiveInt(data.page, 1),
    pageSize: toPositiveInt(data.pageSize, data.items.length),
    totalApprox: Number(data.totalApprox) || null,
    nextPageToken: data.nextPageToken || '',
    prevPageToken: data.prevPageToken || '',
    items: data.items.map(normalizeVideo).filter(Boolean),
  };
}

/** fetch() with an AbortController timeout (works in older Safari as well). */
async function fetchJson(url, { fetchImpl = fetch, timeoutMs = 12000, signal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
  if (signal) signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });

  let response;
  try {
    response = await fetchImpl(url, { cache: 'no-store', signal: controller.signal });
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    throw new ApiError(aborted ? 'Request timed out' : 'Network request failed', {
      kind: aborted ? 'timeout' : 'network',
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body?.error?.message || message;
    } catch { /* non-JSON error body */ }
    throw new ApiError(message, { status: response.status, kind: 'http' });
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError('Invalid JSON from API', { status: response.status, kind: 'shape' });
  }
}

/** Fetch + normalize a page of videos. */
export async function fetchVideos(params, options = {}) {
  const url = buildVideosUrl(params);
  const data = await fetchJson(url, options);
  return { ...normalizeVideosResponse(data), url };
}

/** Fetch the category list for a country (throws ApiError; caller decides on fallback). */
export async function fetchCategories({ apiBase, country }, options = {}) {
  const url = buildCategoriesUrl({ apiBase, country });
  const data = await fetchJson(url, options);
  const list = Array.isArray(data?.categories) ? data.categories : [];
  return list
    .map((c) => ({ id: String(c.id ?? ''), title: String(c.title ?? '') }))
    .filter((c) => c.id && c.title);
}

/** Detect visitor country via Cloudflare's trace endpoint (no key, CORS-friendly). */
export async function detectCountry({ fetchImpl = fetch, timeoutMs = 4000, fallback = 'US' } = {}) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetchImpl('https://www.cloudflare.com/cdn-cgi/trace', {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await res.text();
    return text.match(/loc=([A-Z]{2})/)?.[1] || fallback;
  } catch {
    return fallback;
  }
}
