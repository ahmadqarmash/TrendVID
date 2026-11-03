/**
 * Revenue/compliance guard. YouTube API Services Developer Policies III.G.1.d: no ads, sponsorships
 * or promotions on a page that shows YouTube API data. These tests fail the build if that ever
 * regresses - including after real affiliate links are configured.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { AFFILIATES } from '../src/config.js';
import { TOOLS } from '../src/tools.js';
import { fakeYouTube, get, memoryKV } from './helpers.mjs';

// Pretend every affiliate program has a real link, so the guard is tested at full exposure.
for (const a of AFFILIATES) a.url = `https://partner.example.org/${a.id}?ref=trendvid`;
const AFFILIATE_HOST = 'partner.example.org';

// The home page is the trending view, so it belongs here too.
const TRENDING_PATHS = ['/ar/', '/en/', '/ar/trending/sa/', '/en/trending/eg/music/', '/en/trending/us/gaming/'];
const AD_PATHS = ['/ar/tools/', '/en/tools/', ...TOOLS.map((t) => `/en/tools/${t.slug}/`), '/ar/about/'];

test('trending pages (YouTube data) never render ads or affiliate links', async () => {
  const { fetchImpl } = fakeYouTube();
  for (const path of TRENDING_PATHS) {
    const { res, body } = await get(path, { env: { TRENDING: memoryKV(), YOUTUBE_API_KEY: 'test' }, fetchImpl });
    assert.equal(res.status, 200, path);
    assert.ok(!body.includes('adsbygoogle'), `${path} contains an ad`);
    assert.ok(!body.includes(AFFILIATE_HOST), `${path} contains an affiliate link`);
    assert.ok(!body.includes('data-affiliate'), `${path} contains an affiliate block`);
  }
});

test('a trending country page really does contain YouTube data (so the guard above is meaningful)', async () => {
  const { fetchImpl } = fakeYouTube();
  const { body } = await get('/en/trending/sa/', { env: { TRENDING: memoryKV(), YOUTUBE_API_KEY: 'test' }, fetchImpl });
  assert.match(body, /data-play="aaa"/);
  assert.match(body, /Video aaa/);
});

test('the home page shows YouTube data too (so it must stay ad-free)', async () => {
  const { fetchImpl } = fakeYouTube();
  const { body } = await get('/ar/', { env: { TRENDING: memoryKV(), YOUTUBE_API_KEY: 'test' }, fetchImpl, cf: { country: 'SA' } });
  assert.match(body, /data-play="aaa"/);
  assert.ok(!body.includes('adsbygoogle'));
});

test('tool and about pages carry the ad script and an ad unit', async () => {
  for (const path of AD_PATHS) {
    const { body } = await get(path);
    assert.match(body, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/, path);
    assert.match(body, /<ins class="adsbygoogle"/, path);
  }
});

test('tool pages show only affiliate programs that fit the tool, marked sponsored', async () => {
  const { body } = await get('/en/tools/thumbnail-checker/');
  const shown = [...body.matchAll(/data-affiliate="([^"]+)"/g)].map((m) => m[1]);
  const expected = AFFILIATES.filter((a) => a.fits.includes('thumbnail-checker')).map((a) => a.id);
  assert.deepEqual(shown.sort(), expected.sort());
  assert.match(body, /rel="sponsored nofollow noopener"/);
});

test('privacy, terms and contact pages carry no ads', async () => {
  for (const path of ['/en/privacy/', '/ar/terms/', '/en/contact/']) {
    const { body } = await get(path);
    assert.ok(!body.includes('adsbygoogle'), path);
  }
});

test('YouTube API Services disclosures are present (Developer Policies III.A)', async () => {
  const privacy = (await get('/en/privacy/')).body;
  assert.match(privacy, /YouTube API Services/);
  assert.match(privacy, /policies\.google\.com\/privacy/);
  const terms = (await get('/en/terms/')).body;
  assert.match(terms, /youtube\.com\/t\/terms/);
  const termsAr = (await get('/ar/terms/')).body;
  assert.match(termsAr, /youtube\.com\/t\/terms/);
});
