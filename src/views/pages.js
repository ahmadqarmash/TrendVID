/**
 * Page renderers. Each returns the layout() input: { title, description, path, alternates, ads, body, ... }.
 * The router adds lang + siteUrl and calls layout().
 */
import { CATEGORIES, COUNTRIES, SITE } from '../config.js';
import { GUIDES } from '../generated/guides.js';
import { translator } from '../i18n.js';
import { html, raw } from '../lib/html.js';
import { formatCompact, formatDate, formatRelative } from '../lib/format.js';
import { TOOLS } from '../tools.js';
import { PAGES, UPDATED } from '../content/static-pages.js';
import { absoluteUrl, adSlot, affiliateBox, breadcrumbs, pathFor } from './layout.js';

const both = (...segments) => ({ ar: pathFor('ar', ...segments), en: pathFor('en', ...segments) });

export function publishedGuides(lang) {
  return GUIDES
    .filter((g) => g.lang === lang && !g.draft)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/* ------------------------------------------------------------------ components */

function toolCard(lang, tool) {
  return html`
    <li class="card tool-card">
      <a href="${pathFor(lang, 'tools', tool.slug)}">
        <span class="card-icon" aria-hidden="true">${tool.icon}</span>
        <h3>${tool.name[lang]}</h3>
        <p>${tool.short[lang]}</p>
      </a>
    </li>`;
}

function guideCard(lang, guide) {
  const t = translator(lang);
  return html`
    <li class="card guide-card">
      <a href="${pathFor(lang, 'guides', guide.slug)}">
        <h3>${guide.title}</h3>
        <p>${guide.description}</p>
        <p class="meta">${formatDate(guide.updated || guide.date, lang)} · ${t('minutesRead', guide.minutes)}</p>
      </a>
    </li>`;
}

function countryLinks(lang, current = null) {
  return html`
    <ul class="country-list">
      ${COUNTRIES.map((c) => html`
        <li><a href="${pathFor(lang, 'trending', c.code.toLowerCase())}"${c.code === current ? raw(' aria-current="page"') : ''}>${c[lang]}</a></li>`)}
    </ul>`;
}

function creatorCta(lang) {
  const t = translator(lang);
  return html`
    <aside class="cta-box">
      <div>
        <h2>${t('creatorCtaTitle')}</h2>
        <p>${t('creatorCtaText')}</p>
      </div>
      <a class="btn" href="${pathFor(lang, 'tools')}">${t('homeHeroCta')}</a>
    </aside>`;
}

/* ------------------------------------------------------------------------- home */

export function homePage(lang, { siteUrl }) {
  const t = translator(lang);
  const guides = publishedGuides(lang).slice(0, 3);
  const featured = ['SA', 'EG', 'AE', 'JO', 'MA', 'IQ', 'US', 'GB'];
  return {
    lang,
    title: t('homeTitle'),
    description: t('homeDescription'),
    path: pathFor(lang),
    alternates: both(),
    ads: true,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'TrendVid',
        url: absoluteUrl(siteUrl, pathFor(lang)),
        inLanguage: lang,
        description: t('homeDescription'),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'TrendVid',
        url: absoluteUrl(siteUrl, '/'),
        logo: absoluteUrl(siteUrl, '/assets/img/og.png'),
        email: SITE.contactEmail,
      },
    ],
    body: html`
      <section class="hero">
        <h1>${t('homeHeroTitle')}</h1>
        <p class="lead">${t('homeHeroLead')}</p>
        <div class="hero-actions">
          <a class="btn" href="${pathFor(lang, 'tools')}">${t('homeHeroCta')}</a>
          <a class="btn btn-ghost" href="${pathFor(lang, 'trending')}">${t('homeHeroCta2')}</a>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div><h2>${t('homeToolsTitle')}</h2><p class="muted">${t('homeToolsLead')}</p></div>
          <a href="${pathFor(lang, 'tools')}">${t('allTools')}</a>
        </div>
        <ul class="card-grid">${TOOLS.map((tool) => toolCard(lang, tool))}</ul>
      </section>

      ${adSlot(lang)}

      <section class="section">
        <div class="section-head">
          <h2>${t('homeGuidesTitle')}</h2>
          <a href="${pathFor(lang, 'guides')}">${t('allGuides')}</a>
        </div>
        ${guides.length
          ? html`<ul class="card-grid">${guides.map((g) => guideCard(lang, g))}</ul>`
          : html`<p class="empty">${t('guidesEmpty')}</p>`}
      </section>

      <section class="section">
        <div class="section-head">
          <div><h2>${t('homeTrendingTitle')}</h2><p class="muted">${t('homeTrendingLead')}</p></div>
          <a href="${pathFor(lang, 'trending')}">${t('allCountries')}</a>
        </div>
        <ul class="country-list">
          ${featured.map((code) => {
            const c = COUNTRIES.find((x) => x.code === code);
            return html`<li><a href="${pathFor(lang, 'trending', code.toLowerCase())}">${c[lang]}</a></li>`;
          })}
        </ul>
      </section>`,
  };
}

/* ------------------------------------------------------------------------ tools */

export function toolsIndexPage(lang, { siteUrl }) {
  const t = translator(lang);
  return {
    lang,
    title: `${t('toolsTitle')} | TrendVid`,
    description: t('toolsDescription'),
    path: pathFor(lang, 'tools'),
    alternates: both('tools'),
    ads: true,
    body: html`
      ${breadcrumbs(siteUrl, [[t('home'), pathFor(lang)], [t('navTools'), pathFor(lang, 'tools')]])}
      <header class="page-head">
        <h1>${t('toolsTitle')}</h1>
        <p class="lead">${t('toolsLead')}</p>
      </header>
      <ul class="card-grid">${TOOLS.map((tool) => toolCard(lang, tool))}</ul>
      ${adSlot(lang)}
      ${affiliateBox(lang)}`,
  };
}

export function toolPage(lang, tool, { siteUrl }) {
  const t = translator(lang);
  const labels = tool.labels[lang];
  const faq = tool.faq[lang];
  const path = pathFor(lang, 'tools', tool.slug);
  return {
    lang,
    title: `${tool.title[lang]} | TrendVid`,
    description: tool.intro[lang],
    path,
    alternates: both('tools', tool.slug),
    ads: true,
    scripts: [`tools/${tool.slug}.js`],
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: tool.name[lang],
        url: absoluteUrl(siteUrl, path),
        description: tool.short[lang],
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        inLanguage: lang,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') },
        })),
      },
    ],
    body: html`
      ${breadcrumbs(siteUrl, [[t('home'), pathFor(lang)], [t('navTools'), pathFor(lang, 'tools')], [tool.name[lang], path]])}
      <header class="page-head">
        <h1>${tool.title[lang]}</h1>
        <p class="lead">${tool.intro[lang]}</p>
      </header>
      <section class="tool-panel" aria-label="${tool.name[lang]}">
        ${tool.form(labels)}
        <p class="fineprint">🔒 ${t('privacyNoteTool')}</p>
      </section>
      ${adSlot(lang)}
      <section class="prose">
        <h2>${t('howItWorks')}</h2>
        <ol>${tool.steps[lang].map((s) => html`<li>${s}</li>`)}</ol>
        <h2>${t('faq')}</h2>
        ${faq.map(([q, a]) => html`<details><summary>${q}</summary><p>${raw(a)}</p></details>`)}
      </section>
      ${affiliateBox(lang, tool.slug)}
      <section class="section">
        <h2>${t('relatedTools')}</h2>
        <ul class="card-grid">${TOOLS.filter((x) => x.slug !== tool.slug).map((x) => toolCard(lang, x))}</ul>
      </section>`,
  };
}

/* ----------------------------------------------------------------------- guides */

export function guidesIndexPage(lang, { siteUrl }) {
  const t = translator(lang);
  const guides = publishedGuides(lang);
  return {
    lang,
    title: `${t('guidesTitle')} | TrendVid`,
    description: t('guidesDescription'),
    path: pathFor(lang, 'guides'),
    alternates: both('guides'),
    ads: true,
    // An empty index is thin content: keep it out of the index until the first guide ships.
    noindex: guides.length === 0,
    body: html`
      ${breadcrumbs(siteUrl, [[t('home'), pathFor(lang)], [t('navGuides'), pathFor(lang, 'guides')]])}
      <header class="page-head">
        <h1>${t('guidesTitle')}</h1>
        <p class="lead">${t('guidesLead')}</p>
      </header>
      ${guides.length
        ? html`<ul class="card-grid">${guides.map((g) => guideCard(lang, g))}</ul>`
        : html`<p class="empty">${t('guidesEmpty')} <a href="${pathFor(lang, 'tools')}">${t('allTools')}</a></p>`}
      ${guides.length ? adSlot(lang) : ''}`,
  };
}

export function guidePage(lang, guide, { siteUrl }) {
  const t = translator(lang);
  const path = pathFor(lang, 'guides', guide.slug);
  const other = lang === 'ar' ? 'en' : 'ar';
  const translation = guide.translation
    ? GUIDES.find((g) => g.lang === other && g.slug === guide.translation && !g.draft)
    : null;
  const alternates = { [lang]: path };
  if (translation) alternates[other] = pathFor(other, 'guides', translation.slug);
  const related = publishedGuides(lang).filter((g) => g.slug !== guide.slug).slice(0, 3);
  const toc = guide.headings.filter((h) => h.level === 2);

  return {
    lang,
    title: `${guide.title} | TrendVid`,
    description: guide.description,
    path,
    alternates,
    ads: true,
    ogType: 'article',
    schema: [{
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.description,
      inLanguage: lang,
      datePublished: guide.date,
      dateModified: guide.updated || guide.date,
      author: { '@type': 'Person', name: guide.author },
      publisher: { '@type': 'Organization', name: 'TrendVid', logo: { '@type': 'ImageObject', url: absoluteUrl(siteUrl, '/assets/img/og.png') } },
      mainEntityOfPage: absoluteUrl(siteUrl, path),
    }],
    body: html`
      ${breadcrumbs(siteUrl, [[t('home'), pathFor(lang)], [t('navGuides'), pathFor(lang, 'guides')], [guide.title, path]])}
      <article class="guide">
        <header class="page-head">
          <h1>${guide.title}</h1>
          <p class="lead">${guide.description}</p>
          <p class="meta">
            ${guide.author ? html`${t('byAuthor', guide.author)} · ` : ''}
            ${guide.updated && guide.updated !== guide.date
              ? t('updatedOn', formatDate(guide.updated, lang))
              : t('publishedOn', formatDate(guide.date, lang))}
            · ${t('minutesRead', guide.minutes)}
          </p>
        </header>
        ${toc.length >= 3 ? html`
          <nav class="toc" aria-label="${t('tableOfContents')}">
            <h2>${t('tableOfContents')}</h2>
            <ol>${toc.map((h) => html`<li><a href="#${h.id}">${h.text}</a></li>`)}</ol>
          </nav>` : ''}
        <div class="prose">${raw(guide.html)}</div>
      </article>
      ${adSlot(lang)}
      ${affiliateBox(lang, null, guide.affiliates)}
      ${related.length ? html`
        <section class="section">
          <h2>${t('relatedGuides')}</h2>
          <ul class="card-grid">${related.map((g) => guideCard(lang, g))}</ul>
        </section>` : ''}`,
  };
}

/* --------------------------------------------------------------------- trending */
/* No ads and no affiliate links anywhere in this section (YouTube API policy III.G.1.d). */

export function trendingIndexPage(lang, { siteUrl }) {
  const t = translator(lang);
  return {
    lang,
    title: `${t('trendingTitle')} | TrendVid`,
    description: t('trendingDescription'),
    path: pathFor(lang, 'trending'),
    alternates: both('trending'),
    ads: false,
    body: html`
      ${breadcrumbs(siteUrl, [[t('home'), pathFor(lang)], [t('navTrending'), pathFor(lang, 'trending')]])}
      <header class="page-head">
        <h1>${t('trendingTitle')}</h1>
        <p class="lead">${t('trendingLead')}</p>
      </header>
      ${countryLinks(lang)}
      ${creatorCta(lang)}`,
  };
}

function videoItem(lang, video, index) {
  const t = translator(lang);
  const views = formatCompact(video.viewCount, lang);
  // <bdi> keeps a Latin channel name from reordering the Arabic view count next to it.
  const meta = [video.channelTitle, views ? t('views', views) : '', formatRelative(video.publishedAt, lang)]
    .filter(Boolean)
    .map((part, i) => html`${i ? ' · ' : ''}<bdi>${part}</bdi>`);
  return html`
    <li class="video">
      <span class="rank" aria-hidden="true">${index + 1}</span>
      <button type="button" class="video-thumb" data-play="${video.id}" data-title="${video.title}" aria-label="${t('play')}: ${video.title}">
        <img src="${video.thumb}" alt="" width="320" height="180" loading="${index < 4 ? 'eager' : 'lazy'}" decoding="async">
        <span class="play-icon" aria-hidden="true">▶</span>
      </button>
      <div class="video-body">
        <h3 dir="auto"><a href="https://www.youtube.com/watch?v=${video.id}" rel="noopener" target="_blank">${video.title}</a></h3>
        <p class="meta">${meta}</p>
      </div>
    </li>`;
}

export function trendingCountryPage(lang, { country, category, snapshot }, { siteUrl, now = Date.now() }) {
  const t = translator(lang);
  const cName = country[lang];
  const catSlug = category?.slug || '';
  const path = pathFor(lang, 'trending', country.code.toLowerCase(), catSlug);
  const title = category
    ? t('trendingCountryCategoryTitle', cName, category[lang])
    : t('trendingCountryTitle', cName);
  const items = snapshot.items || [];
  const updated = snapshot.fetchedAt ? formatRelative(new Date(snapshot.fetchedAt).toISOString(), lang, now) : '';

  const trail = [[t('home'), pathFor(lang)], [t('navTrending'), pathFor(lang, 'trending')], [cName, pathFor(lang, 'trending', country.code.toLowerCase())]];
  if (category) trail.push([category[lang], path]);

  return {
    lang,
    title: `${title} | TrendVid`,
    description: t('trendingCountryDescription', cName),
    path,
    alternates: both('trending', country.code.toLowerCase(), catSlug),
    ads: false,
    noindex: items.length === 0,
    scripts: ['trending.js'],
    schema: items.length ? [{
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: title,
      itemListElement: items.slice(0, 10).map((v, i) => ({
        '@type': 'ListItem', position: i + 1, name: v.title, url: `https://www.youtube.com/watch?v=${v.id}`,
      })),
    }] : [],
    body: html`
      ${breadcrumbs(siteUrl, trail)}
      <header class="page-head">
        <h1>${title}</h1>
        <p class="lead">${t('trendingCountryDescription', cName)}</p>
      </header>
      <nav class="chips" aria-label="${t('navTrending')}">
        <a class="chip" href="${pathFor(lang, 'trending', country.code.toLowerCase())}"${!category ? raw(' aria-current="page"') : ''}>${t('allCategories')}</a>
        ${CATEGORIES.map((c) => html`
          <a class="chip" href="${pathFor(lang, 'trending', country.code.toLowerCase(), c.slug)}"${c.slug === catSlug ? raw(' aria-current="page"') : ''}>${c[lang]}</a>`)}
      </nav>
      ${updated ? html`<p class="meta">${t('updatedAgo', updated)}</p>` : ''}
      ${snapshot.stale ? html`<p class="notice">${t('staleNotice')}</p>` : ''}
      ${items.length
        ? html`<ol class="video-list">${items.map((v, i) => videoItem(lang, v, i))}</ol>`
        : html`<p class="empty">${t('trendingEmpty')}</p>`}
      <p class="fineprint">${t('sourceYouTube')}</p>
      ${creatorCta(lang)}
      <section class="section">
        <h2>${t('pickCountry')}</h2>
        ${countryLinks(lang, country.code)}
      </section>
      <dialog class="player" data-player aria-label="${t('play')}">
        <div class="player-bar">
          <a class="btn btn-ghost" data-player-watch href="#" rel="noopener" target="_blank">${t('watchOnYouTube')}</a>
          <button type="button" class="icon-btn" data-player-close aria-label="${t('close')}">✕</button>
        </div>
        <div class="player-frame" data-player-frame></div>
      </dialog>`,
  };
}

/* ----------------------------------------------------------------------- static */

export function staticPage(lang, key, { siteUrl }) {
  const t = translator(lang);
  const page = PAGES[key][lang];
  const path = pathFor(lang, key);
  const showUpdated = key === 'privacy' || key === 'terms';
  return {
    lang,
    title: `${page.title} | TrendVid`,
    description: page.description,
    path,
    alternates: both(key),
    ads: key === 'about',
    body: html`
      ${breadcrumbs(siteUrl, [[t('home'), pathFor(lang)], [page.title, path]])}
      <article class="prose static">
        <h1>${page.title}</h1>
        ${page.sections.map(([heading, paragraphs]) => html`
          <h2>${heading}</h2>
          ${paragraphs.map((p) => html`<p>${raw(p)}</p>`)}`)}
        ${showUpdated ? html`<p class="fineprint">${t('updatedOn', formatDate(UPDATED, lang))}</p>` : ''}
      </article>
      ${key === 'about' ? adSlot(lang) : ''}`,
  };
}

export function notFoundPage(lang) {
  const t = translator(lang);
  return {
    lang,
    title: `${t('notFoundTitle')} | TrendVid`,
    description: t('notFoundText'),
    path: pathFor(lang, '404'),
    alternates: {},
    ads: false,
    noindex: true,
    body: html`
      <section class="hero">
        <h1>${t('notFoundTitle')}</h1>
        <p class="lead">${t('notFoundText')}</p>
        <div class="hero-actions">
          <a class="btn" href="${pathFor(lang)}">${t('backHome')}</a>
          <a class="btn btn-ghost" href="${pathFor(lang, 'tools')}">${t('navTools')}</a>
        </div>
      </section>`,
  };
}
