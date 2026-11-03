/** Shared test helpers: an in-memory KV, a fake YouTube API and a request runner. */
import { handleRequest } from '../src/worker.js';

export function memoryKV(initial = {}) {
  const store = new Map(Object.entries(initial).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]));
  return {
    store,
    puts: [],
    async get(key, opts) {
      const value = store.get(key);
      if (value === undefined) return null;
      return opts?.type === 'json' ? JSON.parse(value) : value;
    },
    async put(key, value, opts) {
      this.puts.push({ key, opts });
      store.set(key, value);
    },
  };
}

export function ytItem(id, overrides = {}) {
  return {
    id,
    snippet: {
      title: `Video ${id}`,
      channelTitle: `Channel ${id}`,
      channelId: `UC${id}`,
      publishedAt: '2026-11-01T10:00:00Z',
      thumbnails: { medium: { url: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` } },
    },
    statistics: { viewCount: '1234567' },
    ...overrides,
  };
}

/** fetch() stand-in for the YouTube API. `respond(url)` returns { status, body }. */
export function fakeYouTube(respond = () => ({ status: 200, body: { items: [ytItem('aaa'), ytItem('bbb')] } })) {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(new URL(url));
    const { status = 200, body = {} } = respond(new URL(url));
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  };
  return { fetchImpl, calls };
}

export async function get(path, { env = {}, host = 'https://trendvid.net', headers = {}, fetchImpl } = {}) {
  const res = await handleRequest(new Request(host + path, { headers }), { SITE_URL: 'https://trendvid.net', ...env }, { fetchImpl });
  return { res, body: await res.text() };
}
