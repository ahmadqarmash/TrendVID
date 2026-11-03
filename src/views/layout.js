/**
 * Page shell + shared components ("Pulse" design system - styles in public/assets/css/site.css).
 *
 * Revenue rule (YouTube API Services Developer Policies III.G.1.d): a page that shows YouTube
 * API data must not carry ads, sponsorships or promotions. So every page declares `ads`:
 *   - tools, guides, about  -> ads: true  (no YouTube data on the page)
 *   - home + trending pages -> ads: false (and no affiliate links either)
 * tests/policy.test.mjs fails the build if a trending page ever renders an ad or affiliate link.
 */
import { ADS, ANALYTICS, COUNTRIES, SITE, liveAffiliates } from '../config.js';
import { dirFor, translator } from '../i18n.js';
import { html, jsonLd, raw } from '../lib/html.js';
import { truncate } from '../lib/format.js';
import { TOOLS } from '../tools.js';
import { icon, logoMark } from './icons.js';

export const ASSET_VERSION = '4.1.0';

/** "/ar/tools/title-checker/" from ('ar', 'tools', 'title-checker'). */
export function pathFor(lang, ...segments) {
  const rest = segments.filter(Boolean).join('/');
  return `/${lang}/${rest ? `${rest}/` : ''}`;
}

export function absoluteUrl(siteUrl, path) {
  return `${String(siteUrl || SITE.url).replace(/\/+$/, '')}${path}`;
}

/** One responsive AdSense unit. Rendered only on pages with ads: true. */
export function adSlot(lang, { variant = '' } = {}) {
  if (!ADS.enabled) return '';
  const t = translator(lang);
  return html`
    <aside class="ad-slot${variant ? ` ad-${variant}` : ''}" aria-label="${t('adLabel')}">
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
    <section class="recommend" aria-labelledby="rec-title">
      <h2 id="rec-title" class="side-title">${icon('sparkle', { size: 18 })} ${t('recommendedTitle')}</h2>
      <ul class="rec-list">
        ${programs.map((a) => html`
          <li>
            <a class="rec" href="${a.url}" rel="sponsored nofollow noopener" target="_blank" data-affiliate="${a.id}">
              <span class="rec-mono" aria-hidden="true">${a.name.slice(0, 1)}</span>
              <span class="rec-copy"><strong>${a.name}</strong><span>${a.pitch[lang] || a.pitch.en}</span></span>
              <span class="rec-go">${t('visit')} ${icon('external', { size: 16 })}</span>
            </a>
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

const current = (nav, key) => (nav === key ? raw(' aria-current="page"') : '');

function header(lang, alternates, nav) {
  const t = translator(lang);
  const other = lang === 'ar' ? 'en' : 'ar';
  const switchHref = alternates?.[other] || pathFor(other);
  return html`
    <a class="skip" href="#main">${t('skipToContent')}</a>
    <header class="topbar" data-topbar>
      <div class="topbar-inner">
        <a class="brand" href="${pathFor(lang)}" aria-label="TrendVid">${logoMark('lg-top')}<span class="brand-word">TrendVid</span></a>
        <nav class="nav" aria-label="${t('menu')}">
          <a href="${pathFor(lang)}"${current(nav, 'trending')}><span class="live-dot" aria-hidden="true"></span>${t('navTrending')}</a>
          <a href="${pathFor(lang, 'tools')}"${current(nav, 'tools')}>${t('navTools')}</a>
          <a href="${pathFor(lang, 'guides')}"${current(nav, 'guides')}>${t('navGuides')}</a>
        </nav>
        <div class="topbar-actions">
          <a class="lang-pill" href="${switchHref}" hreflang="${other}" lang="${other}" title="${t('switchLangLabel')}">${t('switchLang')}</a>
          <button class="icon-btn" type="button" data-theme-toggle aria-label="${t('themeToggle')}">
            ${icon('sun', { cls: 'i-sun' })}${icon('moon', { cls: 'i-moon' })}
          </button>
          <a class="btn btn-grad btn-sm nav-cta" href="${pathFor(lang, 'tools')}">${icon('sparkle', { size: 16 })}${t('navCta')}</a>
        </div>
      </div>
    </header>`;
}

/** App-style bottom navigation for phones. */
function tabbar(lang, nav) {
  const t = translator(lang);
  return html`
    <nav class="tabbar" aria-label="${t('menu')}">
      <a href="${pathFor(lang)}"${current(nav, 'trending')}>${icon('flame', { size: 22 })}<span>${t('navTrending')}</span></a>
      <a href="${pathFor(lang, 'tools')}"${current(nav, 'tools')}>${icon('grid', { size: 22 })}<span>${t('navTools')}</span></a>
      <a href="${pathFor(lang, 'guides')}"${current(nav, 'guides')}>${icon('book', { size: 22 })}<span>${t('navGuides')}</span></a>
    </nav>`;
}

function footer(lang) {
  const t = translator(lang);
  const explore = ['SA', 'EG', 'AE', 'JO', 'MA', 'US'].map((code) => COUNTRIES.find((c) => c.code === code));
  return html`
    <footer class="footer">
      <div class="wrap">
        <div class="footer-hero">
          <a class="brand" href="${pathFor(lang)}">${logoMark('lg-foot')}<span class="brand-word">TrendVid</span></a>
          <p class="footer-tagline">${t('footerTagline')}</p>
        </div>
        <div class="footer-cols">
          <div>
            <h2>${t('footerExplore')}</h2>
            <ul>${explore.map((c) => html`<li><a href="${pathFor(lang, 'trending', c.code.toLowerCase())}">${c[lang]}</a></li>`)}</ul>
          </div>
          <div>
            <h2>${t('footerCreators')}</h2>
            <ul>
              ${TOOLS.map((tool) => html`<li><a href="${pathFor(lang, 'tools', tool.slug)}">${tool.name[lang]}</a></li>`)}
              <li><a href="${pathFor(lang, 'guides')}">${t('navGuides')}</a></li>
            </ul>
          </div>
          <div>
            <h2>${t('footerCompany')}</h2>
            <ul>
              <li><a href="${pathFor(lang, 'about')}">${t('footerAbout')}</a></li>
              <li><a href="${pathFor(lang, 'privacy')}">${t('footerPrivacy')}</a></li>
              <li><a href="${pathFor(lang, 'terms')}">${t('footerTerms')}</a></li>
              <li><a href="${pathFor(lang, 'contact')}">${t('footerContact')}</a></li>
              ${SITE.telegramUrl ? html`<li><a href="${SITE.telegramUrl}" rel="noopener" target="_blank">${t('joinTelegram')}</a></li>` : ''}
            </ul>
          </div>
        </div>
        <div class="footer-base">
          <p>${t('footerDisclaimer')}</p>
          <p>© ${new Date().getUTCFullYear()} TrendVid</p>
        </div>
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
 * @param {'trending'|'tools'|'guides'} [page.nav]  highlighted navigation item
 * @param {object[]} [page.schema]      JSON-LD objects
 * @param {string[]} [page.scripts]     extra module scripts (paths under /assets/js/)
 * @param {boolean} [page.noindex]
 * @param {string} [page.siteUrl]
 * @param {string} [page.ogType]
 */
export function layout(page) {
  const { lang, title, path, alternates = {}, ads = false, body, schema = [], scripts = [], noindex = false, nav = null } = page;
  const siteUrl = page.siteUrl || SITE.url;
  const description = truncate(page.description, 158);
  const canonical = absoluteUrl(siteUrl, path);
  const ogImage = absoluteUrl(siteUrl, '/assets/img/og.png');
  const showAds = Boolean(ads && ADS.enabled);
  const font = lang === 'ar' ? 'arabic' : 'latin';

  const hreflangs = Object.entries(alternates).filter(([, p]) => p);
  const xDefault = alternates.ar ? alternates.ar : null;

  return `<!doctype html>
${html`<html lang="${lang}" dir="${dirFor(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonical}">
  ${hreflangs.map(([l, p]) => html`<link rel="alternate" hreflang="${l}" href="${absoluteUrl(siteUrl, p)}">`)}
  ${xDefault ? html`<link rel="alternate" hreflang="x-default" href="${absoluteUrl(siteUrl, xDefault)}">` : ''}
  ${noindex ? html`<meta name="robots" content="noindex, follow">` : ''}
  <meta name="theme-color" content="#07070c">
  <meta name="color-scheme" content="dark light">
  <meta property="og:site_name" content="TrendVid">
  <meta property="og:type" content="${page.ogType || 'website'}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:locale" content="${lang === 'ar' ? 'ar_AR' : 'en_US'}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="preload" href="/assets/fonts/readex-pro-${font}.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/site.css?v=${ASSET_VERSION}">
  ${raw('<script>try{var m=localStorage.getItem("tv-theme");if(m)document.documentElement.dataset.theme=m}catch(e){}document.documentElement.classList.add("js")</script>')}
  ${ANALYTICS.enabled ? html`<meta name="tv-ga" content="${ANALYTICS.id}" data-consent-mode="${ANALYTICS.consentMode ? '1' : '0'}">` : ''}
  ${showAds ? html`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.client}" crossorigin="anonymous"></script>` : ''}
  ${schema.map((s) => jsonLd(s))}
</head>
<body>
  <div class="aurora" aria-hidden="true"></div>
  ${header(lang, alternates, nav)}
  <main id="main">
    ${body}
  </main>
  ${footer(lang)}
  ${tabbar(lang, nav)}
  <script type="module" src="/assets/js/site.js?v=${ASSET_VERSION}"></script>
  ${scripts.map((s) => html`<script type="module" src="/assets/js/${s}?v=${ASSET_VERSION}"></script>`)}
</body>
</html>`}`;
}
