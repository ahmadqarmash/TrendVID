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
  const pages = ['/ar/', '/en/tools/', '/ar/tools/earnings-calculator/', '/en/guides/', '/ar/trending/sa/', '/en/about/'];
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

/* ------------------------------------------------ home = trending for the visitor's country */

const liveEnv = () => ({ TRENDING: memoryKV(), YOUTUBE_API_KEY: 'k' });

test("home shows the trending chart for the visitor's IP country", async () => {
  const yt = fakeYouTube();
  const { res, body } = await get('/ar/', { env: liveEnv(), fetchImpl: yt.fetchImpl, cf: { country: 'EG' } });
  assert.equal(res.status, 200);
  assert.equal(yt.calls[0].searchParams.get('regionCode'), 'EG');
  assert.match(body, /الرائج على يوتيوب في مصر/);
  assert.match(body, /حسب موقعك/);
  assert.match(body, /<option value="EG" selected>/);
  assert.match(body, /data-play="aaa"/);
  assert.equal(res.headers.get('cache-control'), 'private, max-age=60', 'per-visitor page must not be shared-cached');
  assert.match(res.headers.get('vary'), /Cookie/);
});

test('a picked country (cookie) wins over the IP country', async () => {
  const yt = fakeYouTube();
  const { body } = await get('/en/', {
    env: liveEnv(), fetchImpl: yt.fetchImpl, cf: { country: 'EG' }, headers: { cookie: 'a=1; tv_country=JO' },
  });
  assert.equal(yt.calls[0].searchParams.get('regionCode'), 'JO');
  assert.match(body, /Trending on YouTube in Jordan/);
  assert.ok(!body.includes('Based on your location'));
});

test('a country without a trending page falls back by language, with a notice', async () => {
  const yt = fakeYouTube();
  const ar = await get('/ar/', { env: liveEnv(), fetchImpl: yt.fetchImpl, cf: { country: 'SY' } });
  assert.equal(yt.calls[0].searchParams.get('regionCode'), 'SA');
  assert.match(ar.body, /غير متوفرة لبلدك/);
  const en = await get('/en/', { env: liveEnv(), fetchImpl: yt.fetchImpl }); // no geolocation at all
  assert.equal(yt.calls[1].searchParams.get('regionCode'), 'US');
  assert.ok(!en.body.includes('no trending list for your country'), 'no notice when the country is unknown');
});

test('visitors located in Israel get 451 on every route, with no tracking scripts', async () => {
  for (const path of ['/', '/ar/', '/en/tools/', '/en/trending/sa/', '/api/health', '/robots.txt', '/nope/']) {
    const { res, body } = await get(path, { cf: { country: 'IL' } });
    assert.equal(res.status, 451, path);
    assert.match(body, /not available in your region/);
    assert.ok(!/adsbygoogle|googletagmanager|<script/.test(body), `${path} must load nothing third-party`);
  }
  assert.equal((await get('/en/tools/', { cf: { country: 'JO' } })).res.status, 200, 'other countries unaffected');
});

test('set-country remembers the choice in a cookie and redirects', async () => {
  const home = await get('/ar/set-country/?c=eg&to=home');
  assert.equal(home.res.status, 302);
  assert.equal(home.res.headers.get('location'), '/ar/');
  assert.match(home.res.headers.get('set-cookie'), /^tv_country=EG; Path=\/; Max-Age=31536000; SameSite=Lax; Secure$/);

  const page = await get('/en/set-country/?c=AE&to=page&cat=music');
  assert.equal(page.res.headers.get('location'), '/en/trending/ae/music/');

  const bad = await get('/en/set-country/?c=IL');
  assert.equal(bad.res.headers.get('location'), '/en/');
  assert.equal(bad.res.headers.get('set-cookie'), null);
});

test('the old trending index redirects to the home page', async () => {
  const { res } = await get('/ar/trending/');
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), '/ar/');
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
  assert.match(prod.body, /Disallow: \/ar\/set-country\//);
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
