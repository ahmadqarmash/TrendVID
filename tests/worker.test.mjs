import test from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES, TRENDING } from '../src/config.js';
import { refreshAll, trendKey } from '../src/lib/trending.js';
import { preferredLang, sitemapXml } from '../src/worker.js';
import worker from '../src/worker.js';
import { fakeYouTube, get, memoryKV, ytItem } from './helpers.mjs';

test('root redirects by Accept-Language, Arabic by default', async () => {
  assert.equal((await get('/')).res.headers.get('location'), '/ar/');
  assert.equal((await get('/', { headers: { 'accept-language': 'en-GB,en;q=0.9' } })).res.headers.get('location'), '/en/');
  assert.equal((await get('/', { headers: { 'accept-language': 'ar-SA,en;q=0.5' } })).res.headers.get('location'), '/ar/');
  assert.equal(preferredLang('fr-FR'), 'ar');
});

test('canonical URL rules: trailing slash, lower case, legacy v3 paths', async () => {
  assert.equal((await get('/en/tools')).res.headers.get('location'), '/en/tools/');
  assert.equal((await get('/en/trending/SA/')).res.headers.get('location'), '/en/trending/sa/');
  assert.equal((await get('/privacy-policy.html')).res.status, 301);
  assert.equal((await get('/privacy-policy.html')).res.headers.get('location'), '/en/privacy/');
});

test('every page renders with lang/dir, canonical and both hreflang alternates', async () => {
  const pages = ['/ar/', '/en/tools/', '/ar/tools/earnings-calculator/', '/en/guides/', '/ar/trending/', '/en/about/'];
  for (const path of pages) {
    const { res, body } = await get(path);
    assert.equal(res.status, 200, path);
    const lang = path.split('/')[1];
    assert.match(body, new RegExp(`<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">`), path);
    assert.match(body, new RegExp(`<link rel="canonical" href="https://trendvid.net${path}">`), path);
    assert.match(body, /hreflang="ar"/, path);
    assert.match(body, /hreflang="en"/, path);
    assert.equal((body.match(/<h1[ >]/g) || []).length, 1, `${path} must have exactly one h1`);
  }
});

test('unknown pages, countries and categories are 404 + noindex', async () => {
  for (const path of ['/zz/', '/ar/nope/', '/ar/tools/nope/', '/en/trending/xx/', '/en/trending/sa/nope/', '/ar/guides/nope/']) {
    const { res, body } = await get(path);
    assert.equal(res.status, 404, path);
    assert.match(body, /noindex/, path);
  }
});

test('non-production hosts are noindex and robots-blocked; production is open', async () => {
  const preview = await get('/robots.txt', { host: 'https://trendvid-site.example.workers.dev' });
  assert.match(preview.body, /Disallow: \//);
  const page = await get('/ar/', { host: 'https://trendvid-site.example.workers.dev' });
  assert.equal(page.res.headers.get('x-robots-tag'), 'noindex, nofollow');

  const prod = await get('/robots.txt');
  assert.match(prod.body, /Allow: \//);
  assert.match(prod.body, /Sitemap: https:\/\/trendvid\.net\/sitemap\.xml/);
  assert.equal((await get('/ar/')).res.headers.get('x-robots-tag'), null);
});

test('sitemap lists both languages for tools, countries and static pages', () => {
  const xml = sitemapXml({ SITE_URL: 'https://trendvid.net' });
  assert.match(xml, /<loc>https:\/\/trendvid\.net\/ar\/tools\/title-checker\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/trendvid\.net\/en\/trending\/sa\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/trendvid\.net\/en\/privacy\/<\/loc>/);
  assert.ok(!xml.includes('/guides/'), 'no guides published yet, so no guide URLs');
});

test('HTML responses carry security headers', async () => {
  const { res } = await get('/en/');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.match(res.headers.get('content-security-policy-report-only'), /frame-src https:\/\/www\.youtube-nocookie\.com/);
  assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');
});

test('trending page fetches from YouTube once, then serves from KV', async () => {
  const kv = memoryKV();
  const yt = fakeYouTube();
  const env = { TRENDING: kv, YOUTUBE_API_KEY: 'k' };
  await get('/en/trending/sa/', { env, fetchImpl: yt.fetchImpl });
  await get('/ar/trending/sa/', { env, fetchImpl: yt.fetchImpl });
  assert.equal(yt.calls.length, 1);
  assert.equal(yt.calls[0].searchParams.get('regionCode'), 'SA');
  assert.equal(yt.calls[0].searchParams.get('chart'), 'mostPopular');
  assert.ok(kv.store.has(trendKey('SA')));
  assert.equal(kv.puts[0].opts.expirationTtl, TRENDING.maxAgeSeconds);
  assert.ok(TRENDING.maxAgeSeconds < 30 * 86400, 'YouTube allows at most 30 days of storage');
});

test('category pages request the YouTube category id', async () => {
  const yt = fakeYouTube();
  await get('/en/trending/eg/music/', { env: { TRENDING: memoryKV(), YOUTUBE_API_KEY: 'k' }, fetchImpl: yt.fetchImpl });
  assert.equal(yt.calls[0].searchParams.get('videoCategoryId'), '10');
});

test('an expired snapshot is still shown (marked stale) when YouTube fails', async () => {
  const old = { items: [{ id: 'old1', title: 'Old video', channelTitle: 'C', publishedAt: '', viewCount: '5', thumb: '' }], fetchedAt: Date.now() - 5 * 3600 * 1000 };
  const kv = memoryKV({ [trendKey('JO')]: old });
  const yt = fakeYouTube(() => ({ status: 403, body: { error: { message: 'quota', errors: [{ reason: 'quotaExceeded' }] } } }));
  const { res, body } = await get('/en/trending/jo/', { env: { TRENDING: kv, YOUTUBE_API_KEY: 'k' }, fetchImpl: yt.fetchImpl });
  assert.equal(res.status, 200);
  assert.match(body, /Old video/);
  assert.match(body, /latest copy we have/);
});

test('no data at all renders an empty state that is noindex, never a crash', async () => {
  const { res, body } = await get('/en/trending/us/', { env: {} });
  assert.equal(res.status, 200);
  assert.match(body, /No list is available/);
  assert.match(body, /noindex/);
});

test('video titles from YouTube are escaped', async () => {
  const yt = fakeYouTube(() => ({ body: { items: [ytItem('x1', { snippet: { title: '<script>alert(1)</script>', thumbnails: {} } })] } }));
  const { body } = await get('/en/trending/gb/', { env: { TRENDING: memoryKV(), YOUTUBE_API_KEY: 'k' }, fetchImpl: yt.fetchImpl });
  assert.ok(!body.includes('<script>alert(1)</script>'));
  assert.match(body, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('cron refresh writes every country and stops early on quota errors', async () => {
  const kv = memoryKV();
  const ok = await refreshAll({ TRENDING: kv, YOUTUBE_API_KEY: 'k' }, { fetchImpl: fakeYouTube().fetchImpl });
  assert.equal(ok.ok, COUNTRIES.length);
  assert.equal(kv.store.size, COUNTRIES.length);

  const quota = fakeYouTube(() => ({ status: 403, body: { error: { errors: [{ reason: 'quotaExceeded' }] } } }));
  const report = await refreshAll({ TRENDING: memoryKV(), YOUTUBE_API_KEY: 'k' }, { fetchImpl: quota.fetchImpl });
  assert.equal(quota.calls.length, 1);
  assert.equal(report.failed[0].reason, 'quotaExceeded');
});

test('health endpoint reports bindings without leaking the key', async () => {
  const { body } = await get('/api/health', { env: { YOUTUBE_API_KEY: 'secret-value', TRENDING: memoryKV() } });
  const data = JSON.parse(body);
  assert.equal(data.youtubeKey, true);
  assert.equal(data.kv, true);
  assert.ok(!body.includes('secret-value'));
});

test('fetch handler rejects POST', async () => {
  const post = await worker.fetch(new Request('https://trendvid.net/ar/', { method: 'POST' }), {});
  assert.equal(post.status, 405);
});
