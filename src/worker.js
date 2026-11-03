/**
 * TrendVid 4 - Cloudflare Worker entry.
 *
 *   /                          -> 302 to /ar/ or /en/ (Accept-Language, Arabic by default)
 *   /{lang}/                   home
 *   /{lang}/tools/[slug]/      creator tools
 *   /{lang}/guides/[slug]/     guides (Markdown in content/guides)
 *   /{lang}/trending/[cc]/[category]/   ad-free trending lists
 *   /{lang}/about|privacy|terms|contact/
 *   /sitemap.xml /robots.txt /api/health
 * Static files (CSS, JS, images, ads.txt) are served from public/ before the Worker runs.
 */
import { SITE, categoryBySlug, countryByCode, COUNTRIES } from './config.js';
import { GUIDES } from './generated/guides.js';
import { normalizeLang } from './i18n.js';
import { getTrending, refreshAll } from './lib/trending.js';
import { TOOLS, toolBySlug } from './tools.js';
import { ASSET_VERSION, absoluteUrl, layout, pathFor } from './views/layout.js';
import {
  guidePage, guidesIndexPage, homePage, notFoundPage, publishedGuides, staticPage,
  toolPage, toolsIndexPage, trendingCountryPage, trendingIndexPage,
} from './views/pages.js';

const STATIC_PAGES = ['about', 'privacy', 'terms', 'contact'];

/** Old v3 URLs -> new homes (keeps backlinks and bookmarks working). */
const LEGACY = {
  '/index.html': '/',
  '/about.html': '/en/about/',
  '/privacy.html': '/en/privacy/',
  '/privacy-policy.html': '/en/privacy/',
  '/terms.html': '/en/terms/',
  '/contact.html': '/en/contact/',
};

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://www.googletagmanager.com https://adservice.google.com https://www.google.com https://www.gstatic.com https://fundingchoicesmessages.google.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://pagead2.googlesyndication.com https://ep1.adtrafficquality.google https://cloudflareinsights.com",
  "frame-src https://www.youtube-nocookie.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://fundingchoicesmessages.google.com",
  'upgrade-insecure-requests',
].join('; ');

function siteUrlFor(env) {
  return (env?.SITE_URL || SITE.url).replace(/\/+$/, '');
}

/** Production = the configured site host (or its www). Everything else (workers.dev, previews) is noindex. */
export function isProductionHost(env, hostname) {
  const prod = new URL(siteUrlFor(env)).hostname;
  return hostname === prod || hostname === `www.${prod}`;
}

function baseHeaders(env, url) {
  const headers = {
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'x-frame-options': 'DENY',
    'strict-transport-security': 'max-age=31536000',
    // Report-only until AdSense + GA + the player are verified in production (docs/RUNBOOK.md).
    'content-security-policy-report-only': CSP,
  };
  if (!isProductionHost(env, url.hostname)) headers['x-robots-tag'] = 'noindex, nofollow';
  return headers;
}

function htmlResponse(env, url, page, { status = 200, maxAge = 300 } = {}) {
  return new Response(layout({ ...page, siteUrl: siteUrlFor(env) }), {
    status,
    headers: {
      ...baseHeaders(env, url),
      'content-type': 'text/html; charset=utf-8',
      'cache-control': status === 200 ? `public, max-age=${maxAge}` : 'no-store',
    },
  });
}

function redirect(location, status = 301) {
  return new Response(null, { status, headers: { location, 'cache-control': status === 301 ? 'public, max-age=86400' : 'no-store' } });
}

export function preferredLang(acceptLanguage) {
  const header = String(acceptLanguage || '').toLowerCase();
  const ar = header.indexOf('ar');
  const en = header.indexOf('en');
  if (en !== -1 && (ar === -1 || en < ar)) return 'en';
  return SITE.defaultLang;
}

/* ------------------------------------------------------------- sitemap / robots */

export function sitemapXml(env) {
  const siteUrl = siteUrlFor(env);
  const entries = [];
  const pair = (segments, lastmod) => entries.push({ ar: pathFor('ar', ...segments), en: pathFor('en', ...segments), lastmod });

  pair([]);
  pair(['tools']);
  for (const tool of TOOLS) pair(['tools', tool.slug]);
  pair(['trending']);
  for (const c of COUNTRIES) pair(['trending', c.code.toLowerCase()]);
  for (const key of STATIC_PAGES) pair([key]);

  const urls = [];
  for (const e of entries) {
    for (const lang of ['ar', 'en']) {
      urls.push(`  <url>
    <loc>${absoluteUrl(siteUrl, e[lang])}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}
    <xhtml:link rel="alternate" hreflang="ar" href="${absoluteUrl(siteUrl, e.ar)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${absoluteUrl(siteUrl, e.en)}"/>
  </url>`);
    }
  }
  for (const lang of ['ar', 'en']) {
    const guides = publishedGuides(lang);
    if (!guides.length) continue;
    urls.push(`  <url><loc>${absoluteUrl(siteUrl, pathFor(lang, 'guides'))}</loc></url>`);
    for (const g of guides) {
      urls.push(`  <url><loc>${absoluteUrl(siteUrl, pathFor(lang, 'guides', g.slug))}</loc><lastmod>${String(g.updated || g.date).slice(0, 10)}</lastmod></url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

function robotsTxt(env, url) {
  if (!isProductionHost(env, url.hostname)) return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrlFor(env)}/sitemap.xml\n`;
}

/* ----------------------------------------------------------------------- router */

export async function handleRequest(request, env, { fetchImpl = fetch } = {}) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
  }

  if (LEGACY[pathname]) return redirect(LEGACY[pathname]);

  if (pathname === '/') {
    const lang = preferredLang(request.headers.get('accept-language'));
    return new Response(null, { status: 302, headers: { location: `/${lang}/`, vary: 'Accept-Language', 'cache-control': 'no-store' } });
  }
  if (pathname === '/robots.txt') {
    return new Response(robotsTxt(env, url), { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
  }
  if (pathname === '/sitemap.xml') {
    return new Response(sitemapXml(env), { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
  }
  if (pathname === '/api/health') {
    return new Response(JSON.stringify({
      ok: true,
      version: ASSET_VERSION,
      youtubeKey: Boolean(env.YOUTUBE_API_KEY),
      kv: Boolean(env.TRENDING),
      production: isProductionHost(env, url.hostname),
      guides: GUIDES.filter((g) => !g.draft).length,
    }), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  }

  const parts = pathname.split('/').filter(Boolean);
  const langPart = parts[0];
  if (langPart !== 'ar' && langPart !== 'en') {
    const lang = preferredLang(request.headers.get('accept-language'));
    return htmlResponse(env, url, notFoundPage(lang), { status: 404 });
  }
  const lang = normalizeLang(langPart);

  // Canonical URLs end with a slash and use lower case.
  if (!pathname.endsWith('/')) return redirect(`${pathname}/${url.search}`);
  if (pathname !== pathname.toLowerCase()) return redirect(pathname.toLowerCase() + url.search);

  const ctx = { siteUrl: siteUrlFor(env) };
  const [, section, slug, sub, extra] = parts;
  const notFound = () => htmlResponse(env, url, notFoundPage(lang), { status: 404 });

  if (!section) return htmlResponse(env, url, homePage(lang, ctx));

  if (section === 'tools') {
    if (!slug) return htmlResponse(env, url, toolsIndexPage(lang, ctx));
    const tool = toolBySlug(slug);
    return tool && !sub ? htmlResponse(env, url, toolPage(lang, tool, ctx), { maxAge: 3600 }) : notFound();
  }

  if (section === 'guides') {
    if (!slug) return htmlResponse(env, url, guidesIndexPage(lang, ctx));
    const guide = GUIDES.find((g) => g.lang === lang && g.slug === slug && !g.draft);
    return guide && !sub ? htmlResponse(env, url, guidePage(lang, guide, ctx), { maxAge: 3600 }) : notFound();
  }

  if (section === 'trending') {
    if (!slug) return htmlResponse(env, url, trendingIndexPage(lang, ctx));
    const country = countryByCode(slug);
    const category = sub ? categoryBySlug(sub) : null;
    if (!country || (sub && !category) || extra) return notFound();
    const snapshot = await getTrending(env, { country: country.code, category: category?.id || '' }, { fetchImpl });
    return htmlResponse(env, url, trendingCountryPage(lang, { country, category, snapshot }, ctx), { maxAge: 600 });
  }

  if (STATIC_PAGES.includes(section) && !slug) return htmlResponse(env, url, staticPage(lang, section, ctx), { maxAge: 3600 });

  return notFound();
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error('Unhandled error', error?.stack || error);
      return new Response('Something went wrong. Please try again shortly.', {
        status: 500,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
      });
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshAll(env).then((report) => console.log('trending refresh', JSON.stringify(report))));
  },
};
