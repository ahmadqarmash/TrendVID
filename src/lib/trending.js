/**
 * Trending snapshots in KV.
 *   v4:trend:<COUNTRY>:<category|all>  ->  { items, fetchedAt }
 *
 * The cron job refreshes every country's "all" chart. Category charts are fetched on demand and
 * cached for TRENDING.cacheTtlSeconds. Every key expires after TRENDING.maxAgeSeconds, which keeps
 * us far inside YouTube's 30-day storage limit.
 */
import { COUNTRIES, TRENDING } from '../config.js';
import { fetchTrending } from './youtube.js';

export function trendKey(country, category = '') {
  return `v4:trend:${String(country).toUpperCase()}:${category || 'all'}`;
}

async function readSnapshot(env, key) {
  if (!env.TRENDING) return null;
  try {
    const hit = await env.TRENDING.get(key, { type: 'json' });
    return hit && Array.isArray(hit.items) && typeof hit.fetchedAt === 'number' ? hit : null;
  } catch {
    return null;
  }
}

async function writeSnapshot(env, key, snapshot) {
  if (!env.TRENDING) return;
  try {
    await env.TRENDING.put(key, JSON.stringify(snapshot), { expirationTtl: TRENDING.maxAgeSeconds });
  } catch { /* best effort */ }
}

/**
 * Get a chart for a page view.
 * Returns { items, fetchedAt, stale } or { items: [], fetchedAt: null, error } - never throws.
 */
export async function getTrending(env, { country, category = '' }, { fetchImpl = fetch, now = Date.now() } = {}) {
  const key = trendKey(country, category);
  const cached = await readSnapshot(env, key);
  if (cached && now - cached.fetchedAt < TRENDING.cacheTtlSeconds * 1000) {
    return { ...cached, stale: false };
  }

  try {
    const fresh = await fetchTrending({
      apiKey: env.YOUTUBE_API_KEY,
      country,
      category,
      maxResults: TRENDING.pageSize,
      fetchImpl,
    });
    await writeSnapshot(env, key, fresh);
    return { ...fresh, stale: false };
  } catch (error) {
    if (cached) return { ...cached, stale: true };
    return { items: [], fetchedAt: null, stale: false, error: error?.reason || error?.message || 'error' };
  }
}

/** Cron: refresh every country's main chart. Returns a small report for logs/tests. */
export async function refreshAll(env, { fetchImpl = fetch } = {}) {
  const report = { ok: 0, failed: [] };
  for (const { code } of COUNTRIES) {
    try {
      const fresh = await fetchTrending({
        apiKey: env.YOUTUBE_API_KEY,
        country: code,
        maxResults: TRENDING.pageSize,
        fetchImpl,
      });
      await writeSnapshot(env, trendKey(code), fresh);
      report.ok += 1;
    } catch (error) {
      report.failed.push({ country: code, reason: error?.reason || error?.message });
      if (error?.reason === 'quotaExceeded' || error?.reason === 'missingKey') break; // no point continuing
    }
  }
  return report;
}
