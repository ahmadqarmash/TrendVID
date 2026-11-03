/**
 * YouTube Data API client - only the "mostPopular" chart (1 quota unit per call).
 *
 * Policy notes (YouTube API Services Developer Policies):
 *  - III.E.4.h: no derived metrics. We show YouTube's own order and view counts, nothing computed.
 *  - III.E.4:   stored data must be refreshed or deleted within 30 days (see TRENDING.maxAgeSeconds).
 */

export class YouTubeError extends Error {
  constructor(message, { status = 0, reason = '' } = {}) {
    super(message);
    this.name = 'YouTubeError';
    this.status = status;
    this.reason = reason;
  }
}

/** Keep only what the pages render. */
export function normalizeVideo(item) {
  const snippet = item?.snippet || {};
  const thumbs = snippet.thumbnails || {};
  const thumb = thumbs.medium?.url || thumbs.high?.url || thumbs.default?.url
    || (item?.id ? `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg` : '');
  return {
    id: typeof item?.id === 'string' ? item.id : '',
    title: snippet.title || '',
    channelTitle: snippet.channelTitle || '',
    channelId: snippet.channelId || '',
    publishedAt: snippet.publishedAt || '',
    viewCount: String(item?.statistics?.viewCount ?? ''),
    thumb,
  };
}

/**
 * Fetch one trending chart. Resolves to { items, fetchedAt }.
 * @param {{apiKey: string, country: string, category?: string, maxResults?: number, fetchImpl?: Function}} opts
 */
export async function fetchTrending({ apiKey, country, category = '', maxResults = 50, fetchImpl = fetch }) {
  if (!apiKey) throw new YouTubeError('YOUTUBE_API_KEY is not configured', { reason: 'missingKey' });

  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('part', 'snippet,statistics');
  url.searchParams.set('chart', 'mostPopular');
  url.searchParams.set('regionCode', country);
  url.searchParams.set('maxResults', String(maxResults));
  if (category) url.searchParams.set('videoCategoryId', category);
  url.searchParams.set('key', apiKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  let res;
  try {
    res = await fetchImpl(url.toString(), { signal: controller.signal });
  } catch (error) {
    throw new YouTubeError(error?.name === 'AbortError' ? 'YouTube request timed out' : 'YouTube request failed');
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let reason = '';
    let message = `YouTube API HTTP ${res.status}`;
    try {
      const body = await res.json();
      reason = body?.error?.errors?.[0]?.reason || '';
      message = body?.error?.message || message;
    } catch { /* non-JSON body */ }
    throw new YouTubeError(message, { status: res.status, reason });
  }

  const data = await res.json();
  return {
    items: (data.items || []).map(normalizeVideo).filter((v) => v.id),
    fetchedAt: Date.now(),
  };
}
