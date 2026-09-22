import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

/**
 * Wiring tests: proves the static files agree with the JavaScript.
 *
 * The previous production build failed in exactly this way (the JS expected a data shape the API
 * never returned), so markup, config, scripts and platform files are cross-checked automatically:
 *  - ids the modules look up must exist in the HTML
 *  - every local asset reference must resolve to a real file
 *  - ad units must use the configured client/slot
 *  - sitemap / robots / redirects / headers must stay consistent
 */
const SITE = new URL('../site/', import.meta.url);
const JS_DIR = new URL('../site/assets/js/', import.meta.url);
const PAGES = ['index.html', 'about.html', 'privacy.html', 'terms.html', 'contact.html', '404.html'];
const INDEXABLE = PAGES.filter((p) => p !== '404.html');
const DOC_PAGES = ['about.html', 'privacy.html', 'terms.html', 'contact.html', '404.html'];

const readSite = (rel) => readFileSync(new URL(rel, SITE), 'utf8');
const hasSite = (rel) => existsSync(new URL(rel, SITE));
const readAllJs = () => readdirSync(JS_DIR)
  .filter((f) => f.endsWith('.js'))
  .map((f) => readFileSync(new URL(f, JS_DIR), 'utf8'))
  .join('\n');

test('every page declares lang, charset, viewport, title, description and canonical', () => {
  for (const page of PAGES) {
    const html = readSite(page);
    assert.match(html, /<html[^>]+lang="[a-z]{2}"/, `${page}: missing lang`);
    assert.match(html, /<meta charset="UTF-8"/i, `${page}: missing charset`);
    assert.match(html, /name="viewport"/, `${page}: missing viewport`);
    assert.match(html, /<title>[^<]{10,}<\/title>/, `${page}: weak title`);
    assert.match(html, /name="description" content="[^"]{40,}"/, `${page}: weak description`);
    if (page !== '404.html') {
      assert.match(html, /rel="canonical" href="https:\/\/trendvid\.net/, `${page}: missing canonical`);
    }
  }
});

test('404 page is noindex and carries no ads', () => {
  const html = readSite('404.html');
  assert.match(html, /name="robots" content="noindex/);
  assert.ok(!/adsbygoogle\.js/.test(html), '404 must not load AdSense');
  assert.ok(!/class="adsbygoogle"/.test(html), '404 must not contain ad units');
});

test('every local asset reference resolves to a real file', () => {
  for (const page of PAGES) {
    const html = readSite(page);
    const refs = [...html.matchAll(/(?:src|href)="(\/[^"#?]*)"/g)].map((m) => m[1]);
    for (const ref of refs) {
      const rel = ref.replace(/^\//, '') || 'index.html';
      assert.ok(hasSite(rel), `${page} references ${ref}, which does not exist in site/`);
    }
  }
});

test('index.html contains every element id the app modules look up', () => {
  const index = readSite('index.html');
  const appJs = readFileSync(new URL('app.js', JS_DIR), 'utf8');

  const cached = /for \(const id of \[([\s\S]*?)\]\)/.exec(appJs)?.[1] ?? '';
  const ids = [...cached.matchAll(/'([a-zA-Z][\w-]*)'/g)].map((m) => m[1]);
  assert.ok(ids.length > 20, 'failed to read the id list from app.js');

  const localised = ['lblCountry', 'lblCategory', 'lblLang', 'lnkAbout', 'lnkPrivacy', 'lnkTerms', 'lnkContact'];
  const adSlots = ['adInFeed', 'adBottom1', 'adBottom2']; // resolved inside analytics.initAds()

  for (const id of [...ids, ...localised, ...adSlots]) {
    assert.match(index, new RegExp(`id="${id}"`), `index.html is missing #${id}`);
  }
});

test('every id any module looks up exists somewhere in site/', () => {
  const js = readAllJs();
  const used = [...js.matchAll(/getElementById\(['"]([\w-]+)['"]\)/g)].map((m) => m[1]);
  const allHtml = PAGES.map(readSite).join('\n');
  for (const id of new Set(used)) {
    assert.match(allHtml, new RegExp(`id="${id}"`), `#${id} is used by JS but missing from every page`);
  }
});

test('ad units use the configured client and slot, and each page loads AdSense', () => {
  const config = readFileSync(new URL('config.js', JS_DIR), 'utf8');
  const client = /client: '([^']+)'/.exec(config)?.[1];
  const slot = /slot: '([^']+)'/.exec(config)?.[1];
  assert.ok(client && slot, 'config.js must define the adsense client + slot');

  for (const page of ['index.html', 'about.html', 'privacy.html', 'terms.html']) {
    const html = readSite(page);
    assert.match(html, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=/,
      `${page}: AdSense loader missing`);

    const units = [...html.matchAll(/data-ad-client="([^"]+)"[\s\S]{0,200}?data-ad-slot="([^"]+)"/g)];
    assert.ok(units.length > 0, `${page}: no ad units`);
    for (const [, unitClient, unitSlot] of units) {
      assert.equal(unitClient, client, `${page}: ad client does not match config.js`);
      assert.equal(unitSlot, slot, `${page}: ad slot does not match config.js`);
    }
  }
});

test('doc pages wire the shared script and the elements it needs', () => {
  for (const page of DOC_PAGES) {
    const html = readSite(page);
    assert.match(html, /assets\/js\/static-page\.js/, `${page}: static-page.js not loaded`);
    assert.match(html, /id="year"/, `${page}: missing #year`);
    assert.match(html, /id="backHome"/, `${page}: missing #backHome`);
  }
  for (const page of ['about.html', 'privacy.html', 'terms.html']) {
    assert.match(readSite(page), /id="adDoc"/, `${page}: missing #adDoc`);
  }
});

test('sitemap lists exactly the indexable pages, with the correct namespace', () => {
  const xml = readSite('sitemap.xml');
  assert.match(xml, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/, 'wrong sitemap namespace');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  assert.equal(locs.length, INDEXABLE.length, `sitemap has ${locs.length} entries, expected ${INDEXABLE.length}`);
  for (const page of INDEXABLE) {
    const expected = page === 'index.html' ? 'https://trendvid.net/' : `https://trendvid.net/${page}`;
    assert.ok(locs.includes(expected), `sitemap is missing ${expected}`);
  }
  assert.ok(!locs.some((l) => /404/.test(l)), '404 must not be in the sitemap');
  assert.ok(locs.every((l) => l.startsWith('https://trendvid.net/')), 'sitemap must use the apex domain');
});

test('robots.txt points at the sitemap and keeps crawlers out of /api/', () => {
  const robots = readSite('robots.txt');
  assert.match(robots, /Sitemap: https:\/\/trendvid\.net\/sitemap\.xml/);
  assert.match(robots, /Disallow: \/api\//);
  assert.match(robots, /User-agent: \*/);
});

test('_redirects: no self-redirects and every target exists', () => {
  const rules = readSite('_redirects')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  assert.ok(rules.length >= 3, 'legacy paths should still be redirected');
  for (const rule of rules) {
    const [from, to] = rule.split(/\s+/);
    assert.notEqual(from, to, `self-redirect: ${rule}`);
    const target = to.replace(/^\//, '');
    assert.ok(hasSite(target), `redirect target ${to} does not exist in site/`);
  }
});

test('_headers keeps the CSP (with every revenue host) and the safe cache policy', () => {
  const headers = readSite('_headers');
  assert.match(headers, /Content-Security-Policy-Report-Only:/, 'CSP should ship in report-only mode');
  assert.match(headers, /Cache-Control: public, max-age=0, must-revalidate/);
  assert.match(headers, /\/assets\/js\/\*/, 'app code must get its own (short) cache policy');
  assert.match(headers, /X-Content-Type-Options: nosniff/);

  // if any of these hosts are missing, ads/analytics/data die silently after the CSP is enforced
  for (const host of [
    'https://pagead2.googlesyndication.com',
    'https://www.googletagmanager.com',
    'https://api.trendvid.net',
    'https://www.youtube.com',
    'https://static.cloudflareinsights.com',
  ]) {
    assert.ok(headers.includes(host), `CSP is missing ${host}`);
  }
});

test('platform files exist and ads.txt is well formed', () => {
  for (const file of ['ads.txt', 'robots.txt', 'sitemap.xml', 'favicon.ico', 'assets/og.png']) {
    assert.ok(hasSite(file), `site/${file} is missing`);
  }
  assert.match(readSite('ads.txt'), /^google\.com, pub-\d+, DIRECT, [0-9a-f]{16}$/m);
});

test('every relative import in the browser modules resolves', () => {
  const modules = readdirSync(JS_DIR).filter((f) => f.endsWith('.js'));
  for (const file of modules) {
    const source = readFileSync(new URL(file, JS_DIR), 'utf8');
    for (const [, specifier] of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const target = new URL(specifier, new URL(file, JS_DIR));
      assert.ok(existsSync(target), `${file} imports "${specifier}", which does not exist`);
    }
  }
  assert.ok(modules.includes('config.js') && modules.includes('app.js'), 'expected core modules to exist');
});

test('index loads the app entry point and no page loads app.js twice', () => {
  for (const page of PAGES) {
    const html = readSite(page);
    const appScripts = [...html.matchAll(/src="([^"]*assets\/js\/[^"]+\.js)"/g)].map((m) => m[1]);
    assert.equal(new Set(appScripts).size, appScripts.length, `${page} loads the same script twice`);
    const expected = page === 'index.html' ? '/assets/js/app.js' : null;
    if (expected) assert.ok(appScripts.includes(expected), 'index.html must load /assets/js/app.js');
  }
});
