/**
 * Page shell + shared components.
 *
 * Revenue rule (YouTube API Services Developer Policies III.G.1.d): a page that shows YouTube
 * API data must not carry ads, sponsorships or promotions. So every page declares `ads`:
 *   - home, tools, guides, about  -> ads: true  (no YouTube data on the page)
 *   - trending pages              -> ads: false (and no affiliate links either)
 * tests/policy.test.mjs fails the build if a trending page ever renders an ad or affiliate link.
 */
import { ADS, ANALYTICS, SITE, liveAffiliates } from '../config.js';
import { dirFor, translator } from '../i18n.js';
import { html, jsonLd, raw } from '../lib/html.js';
import { truncate } from '../lib/format.js';

export const ASSET_VERSION = '4.0.0';

/** "/ar/tools/title-checker/" from ('ar', 'tools', 'title-checker'). */
export function pathFor(lang, ...segments) {
  const rest = segments.filter(Boolean).join('/');
  return `/${lang}/${rest ? `${rest}/` : ''}`;
}

export function absoluteUrl(siteUrl, path) {
  return `${String(siteUrl || SITE.url).replace(/\/+$/, '')}${path}`;
}

/** One responsive AdSense unit. Rendered only on pages with ads: true. */
export function adSlot(lang) {
  if (!ADS.enabled) return '';
  const t = translator(lang);
  return html`
    <aside class="ad" aria-label="${t('adLabel')}">
      <span class="ad-label">${t('adLabel')}</span>
      <ins class="adsbygoogle" style="display:block" data-ad-client="${ADS.client}" data-ad-slot="${ADS.slot}"
        data-ad-format="auto" data-full-width-responsive="true"></ins>
    </aside>`;
}

/** Affiliate recommendations (only programs with a real tracking link). */
export function affiliateBox(lang, toolSlug = null, ids = null) {
  const t = translator(lang);
  let programs = liveAffiliates(toolSlug);
  if (Array.isArray(ids) && ids.length) programs = liveAffiliates().filter((a) => ids.includes(a.id));
  if (!programs.length) return '';
  return html`
    <section class="affiliates" aria-labelledby="aff-title">
      <h2 id="aff-title">${t('recommendedTitle')}</h2>
      <ul class="aff-list">
        ${programs.map((a) => html`
          <li class="aff">
            <div><strong>${a.name}</strong><p>${a.pitch[lang] || a.pitch.en}</p></div>
            <a class="btn btn-ghost" href="${a.url}" rel="sponsored nofollow noopener" target="_blank" data-affiliate="${a.id}">${t('visit')}</a>
          </li>`)}
      </ul>
      <p class="fineprint">${t('affiliateDisclosure')}</p>
    </section>`;
}

/** Visible breadcrumbs + BreadcrumbList JSON-LD. `trail` = [[label, path], ...]. */
export function breadcrumbs(siteUrl, trail) {
  return html`
    <nav class="crumbs" aria-label="Breadcrumb">
      <ol>${trail.map(([label, path], i) => (i === trail.length - 1
        ? html`<li aria-current="page">${label}</li>`
        : html`<li><a href="${path}">${label}</a></li>`))}</ol>
    </nav>
    ${jsonLd({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: trail.map(([label, path], i) => ({
        '@type': 'ListItem', position: i + 1, name: label, item: absoluteUrl(siteUrl, path),
      })),
    })}`;
}

function header(lang, alternates) {
  const t = translator(lang);
  const other = lang === 'ar' ? 'en' : 'ar';
  const switchHref = alternates?.[other] || pathFor(other);
  return html`
    <a class="skip" href="#main">${t('skipToContent')}</a>
    <header class="site-header">
      <div class="wrap header-row">
        <a class="logo" href="${pathFor(lang)}" aria-label="TrendVid">
          <span class="logo-mark" aria-hidden="true">▶</span><span>TrendVid</span>
        </a>
        <nav class="main-nav" aria-label="${t('menu')}">
          <a href="${pathFor(lang, 'tools')}">${t('navTools')}</a>
          <a href="${pathFor(lang, 'guides')}">${t('navGuides')}</a>
          <a href="${pathFor(lang, 'trending')}">${t('navTrending')}</a>
        </nav>
        <div class="header-actions">
          <a class="lang-switch" href="${switchHref}" hreflang="${other}" lang="${other}" title="${t('switchLangLabel')}">${t('switchLang')}</a>
          <button class="icon-btn" type="button" data-theme-toggle aria-label="${t('themeToggle')}">
            <span aria-hidden="true" class="theme-icon"></span>
          </button>
        </div>
      </div>
    </header>`;
}

function footer(lang) {
  const t = translator(lang);
  return html`
    <footer class="site-footer">
      <div class="wrap footer-grid">
        <div>
          <a class="logo" href="${pathFor(lang)}"><span class="logo-mark" aria-hidden="true">▶</span><span>TrendVid</span></a>
          <p class="muted">${t('tagline')}</p>
          ${SITE.telegramUrl ? html`<p><a href="${SITE.telegramUrl}" rel="noopener" target="_blank">${t('joinTelegram')}</a></p>` : ''}
        </div>
        <nav aria-label="Footer">
          <a href="${pathFor(lang, 'about')}">${t('footerAbout')}</a>
          <a href="${pathFor(lang, 'privacy')}">${t('footerPrivacy')}</a>
          <a href="${pathFor(lang, 'terms')}">${t('footerTerms')}</a>
          <a href="${pathFor(lang, 'contact')}">${t('footerContact')}</a>
        </nav>
      </div>
      <div class="wrap">
        <p class="fineprint">${t('footerDisclaimer')}</p>
        <p class="fineprint">© ${new Date().getUTCFullYear()} TrendVid</p>
      </div>
    </footer>`;
}

/**
 * Full HTML document.
 * @param {object} page
 * @param {'ar'|'en'} page.lang
 * @param {string} page.title
 * @param {string} page.description
 * @param {string} page.path            canonical path, e.g. /ar/tools/
 * @param {{ar?: string, en?: string}} [page.alternates]  hreflang targets (omit a language that has no version)
 * @param {boolean} page.ads            true only for pages without YouTube data
 * @param {*} page.body
 * @param {object[]} [page.schema]      JSON-LD objects
 * @param {string[]} [page.scripts]     extra module scripts (paths under /assets/js/)
 * @param {boolean} [page.noindex]
 * @param {string} [page.siteUrl]
 * @param {string} [page.ogType]
 */
export function layout(page) {
  const { lang, title, path, alternates = {}, ads = false, body, schema = [], scripts = [], noindex = false } = page;
  const siteUrl = page.siteUrl || SITE.url;
  const description = truncate(page.description, 158);
  const canonical = absoluteUrl(siteUrl, path);
  const ogImage = absoluteUrl(siteUrl, '/assets/img/og.png');
  const showAds = Boolean(ads && ADS.enabled);

  const hreflangs = Object.entries(alternates).filter(([, p]) => p);
  const xDefault = alternates.ar ? alternates.ar : null;

  return `<!doctype html>
${html`<html lang="${lang}" dir="${dirFor(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonical}">
  ${hreflangs.map(([l, p]) => html`<link rel="alternate" hreflang="${l}" href="${absoluteUrl(siteUrl, p)}">`)}
  ${xDefault ? html`<link rel="alternate" hreflang="x-default" href="${absoluteUrl(siteUrl, xDefault)}">` : ''}
  ${noindex ? html`<meta name="robots" content="noindex, follow">` : ''}
  <meta name="theme-color" content="#0f1115">
  <meta property="og:site_name" content="TrendVid">
  <meta property="og:type" content="${page.ogType || 'website'}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:locale" content="${lang === 'ar' ? 'ar_AR' : 'en_US'}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="stylesheet" href="/assets/css/site.css?v=${ASSET_VERSION}">
  ${raw('<script>try{var m=localStorage.getItem("tv-theme");if(m)document.documentElement.dataset.theme=m}catch(e){}</script>')}
  ${ANALYTICS.enabled ? html`<meta name="tv-ga" content="${ANALYTICS.id}" data-consent-mode="${ANALYTICS.consentMode ? '1' : '0'}">` : ''}
  ${showAds ? html`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.client}" crossorigin="anonymous"></script>` : ''}
  ${schema.map((s) => jsonLd(s))}
</head>
<body>
  ${header(lang, alternates)}
  <main id="main" class="wrap">
    ${body}
  </main>
  ${footer(lang)}
  <script type="module" src="/assets/js/site.js?v=${ASSET_VERSION}"></script>
  ${scripts.map((s) => html`<script type="module" src="/assets/js/${s}?v=${ASSET_VERSION}"></script>`)}
</body>
</html>`}`;
}
