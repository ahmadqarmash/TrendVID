/**
 * Page renderers ("Pulse" design). Each returns the layout() input:
 * { lang, title, description, path, alternates, ads, nav, body, ... }.
 */
import { CATEGORIES, COUNTRIES, SITE } from '../config.js';
import { GUIDES } from '../generated/guides.js';
import { translator } from '../i18n.js';
import { html, raw } from '../lib/html.js';
import { formatCompact, formatDate, formatRelative } from '../lib/format.js';
import { TOOLS } from '../tools.js';
import { PAGES, UPDATED } from '../content/static-pages.js';
import { CATEGORY_ICONS, icon } from './icons.js';
import { absoluteUrl, adSlot, affiliateBox, breadcrumbs, pathFor } from './layout.js';

const both = (...segments) => ({ ar: pathFor('ar', ...segments), en: pathFor('en', ...segments) });
const ARAB_COUNT = 15; // COUNTRIES lists the Arab markets first

export function publishedGuides(lang) {
  return GUIDES
    .filter((g) => g.lang === lang && !g.draft)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/* ------------------------------------------------------------------ components */

function toolCard(lang, tool, { featured = false } = {}) {
  const t = translator(lang);
  return html`
    <li class="tool-card${featured ? ' is-featured' : ''}" data-reveal>
      <a href="${pathFor(lang, 'tools', tool.slug)}">
        <span class="tool-icon">${icon(tool.icon, { size: featured ? 30 : 24 })}</span>
        <h3>${tool.name[lang]}</h3>
        <p>${tool.short[lang]}</p>
        <span class="link-arrow">${t('openTool')} ${icon('arrow', { size: 16, cls: 'i-dir' })}</span>
      </a>
    </li>`;
}

function guideCard(lang, guide) {
  const t = translator(lang);
  return html`
    <li class="guide-card" data-reveal>
      <a href="${pathFor(lang, 'guides', guide.slug)}">
        <span class="eyebrow">${icon('book', { size: 14 })} ${t('minutesRead', guide.minutes)}</span>
        <h3>${guide.title}</h3>
        <p>${guide.description}</p>
        <span class="meta">${formatDate(guide.updated || guide.date, lang)}</span>
      </a>
    </li>`;
}

/** Shared hero for tools, guides and static pages. */
function pageHero({ eyebrow = '', title, lede = '', crumbs = '', extra = '', iconName = '' }) {
  return html`
    <section class="page-hero">
      <div class="wrap">
        ${crumbs}
        ${iconName ? html`<span class="hero-icon">${icon(iconName, { size: 30 })}</span>` : ''}
        ${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : ''}
        <h1>${title}</h1>
        ${lede ? html`<p class="lede">${lede}</p>` : ''}
        ${extra}
      </div>
    </section>`;
}

/* ===================================================================== TRENDING */
/* Home + /trending/ pages. No ads, no affiliate links (YouTube API policy III.G.1.d). */

function metaLine(lang, video) {
  const t = translator(lang);
  const views = formatCompact(video.viewCount, lang);
  const when = formatRelative(video.publishedAt, lang);
  return html`${views ? html`<bdi>${t('views', views)}</bdi>` : ''}${views && when ? ' · ' : ''}${when ? html`<bdi>${when}</bdi>` : ''}`;
}

function thumbImg(video, { eager = false, sizes = '(max-width: 640px) 92vw, 300px', max = false } = {}) {
  const src = max ? (video.thumbMax || video.thumbHigh || video.thumb) : video.thumb;
  const srcset = !max && video.thumbHigh && video.thumbHigh !== video.thumb
    ? `${video.thumb} 320w, ${video.thumbHigh} 480w` : '';
  return html`<img src="${src}" ${srcset ? html`srcset="${srcset}" sizes="${sizes}" ` : ''}alt="" width="${max ? 1280 : 320}" height="${max ? 720 : 180}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager && max ? raw(' fetchpriority="high"') : ''}>`;
}

function playAttrs(lang, video) {
  const t = translator(lang);
  return html`data-play="${video.id}" data-title="${video.title}" aria-label="${t('play')}: ${video.title}"`;
}

function videoCard(lang, video, rank) {
  return html`
    <li class="vcard" data-reveal>
      <button type="button" class="vthumb" ${playAttrs(lang, video)}>
        ${thumbImg(video, { eager: rank <= 9 })}
        <span class="vrank">${rank}</span>
        <span class="vplay" aria-hidden="true">${icon('play', { size: 22 })}</span>
      </button>
      <div class="vbody">
        <span class="avatar" aria-hidden="true">${(video.channelTitle || '?').trim().slice(0, 1).toUpperCase()}</span>
        <div class="vtext">
          <h3 dir="auto"><a href="https://www.youtube.com/watch?v=${video.id}" rel="noopener" target="_blank">${video.title}</a></h3>
          <p class="meta"><bdi>${video.channelTitle}</bdi></p>
          <p class="meta">${metaLine(lang, video)}</p>
        </div>
      </div>
    </li>`;
}

function spotlight(lang, items) {
  const t = translator(lang);
  const [top, ...rest] = items;
  const runners = rest.slice(0, 4);
  return html`
    <section class="spotlight wrap">
      <article class="feature" data-reveal>
        <button type="button" class="feature-media" ${playAttrs(lang, top)}>
          ${thumbImg(top, { eager: true, max: true })}
        </button>
        <div class="feature-copy">
          <span class="badge-grad">${icon('flame', { size: 16 })} #1 · ${t('spotlightLabel')}</span>
          <h2 dir="auto"><a href="https://www.youtube.com/watch?v=${top.id}" rel="noopener" target="_blank">${top.title}</a></h2>
          <p class="meta"><bdi>${top.channelTitle}</bdi> · ${metaLine(lang, top)}</p>
          <button type="button" class="btn btn-light" ${playAttrs(lang, top)}>${icon('play', { size: 18 })} ${t('watchNow')}</button>
        </div>
      </article>
      ${runners.length ? html`
        <div class="runners" data-reveal>
          <h2 class="side-title">${t('topRunners')}</h2>
          <ol>
            ${runners.map((v, i) => html`
              <li class="runner">
                <button type="button" class="runner-thumb" ${playAttrs(lang, v)}>
                  ${thumbImg(v, { eager: true, sizes: '160px' })}
                  <span class="vrank">${i + 2}</span>
                </button>
                <div class="vtext">
                  <h3 dir="auto"><a href="https://www.youtube.com/watch?v=${v.id}" rel="noopener" target="_blank">${v.title}</a></h3>
                  <p class="meta"><bdi>${v.channelTitle}</bdi></p>
                  <p class="meta">${metaLine(lang, v)}</p>
                </div>
              </li>`)}
          </ol>
        </div>` : ''}
    </section>`;
}

/** Country <select>; works without JS (submit button), auto-submits with JS. */
function countryPicker(lang, { country, category, isHome, source }) {
  const t = translator(lang);
  return html`
    <form class="picker" method="get" action="${pathFor(lang, 'set-country')}">
      <label class="picker-field">
        <span class="picker-icon">${icon('globe', { size: 18 })}</span>
        <span class="visually-hidden">${t('countryLabel')}</span>
        <select name="c" data-autosubmit aria-label="${t('countryLabel')}">
          ${COUNTRIES.map((c) => html`<option value="${c.code}"${c.code === country.code ? raw(' selected') : ''}>${c[lang]}</option>`)}
        </select>
        <span class="picker-chevron">${icon('chevron', { size: 16 })}</span>
      </label>
      <input type="hidden" name="to" value="${isHome ? 'home' : 'page'}">
      ${category ? html`<input type="hidden" name="cat" value="${category.slug}">` : ''}
      <button class="btn btn-ghost btn-sm" type="submit" data-nojs>${t('show')}</button>
      ${source === 'ip' ? html`<span class="geo-note">${icon('pin', { size: 14 })} ${t('detectedByLocation')}</span>` : ''}
    </form>`;
}

function categoryChips(lang, { country, category, isHome }) {
  const t = translator(lang);
  const cc = country.code.toLowerCase();
  const allHref = isHome ? pathFor(lang) : pathFor(lang, 'trending', cc);
  return html`
    <nav class="cats" aria-label="${t('categoryLabel')}">
      <div class="cats-track wrap">
        <a class="cat" href="${allHref}"${!category ? raw(' aria-current="page"') : ''}>${icon('all', { size: 16 })}${t('allCategories')}</a>
        ${CATEGORIES.map((c) => html`
          <a class="cat" href="${pathFor(lang, 'trending', cc, c.slug)}"${c.slug === category?.slug ? raw(' aria-current="page"') : ''}>${icon(CATEGORY_ICONS[c.slug], { size: 16 })}${c[lang]}</a>`)}
      </div>
    </nav>`;
}

/** The bridge from trending (no ads) to the tools (ads + affiliates). */
function creatorBand(lang) {
  const t = translator(lang);
  return html`
    <aside class="band wrap" data-reveal>
      <div class="band-inner">
        <div class="band-copy">
          <p class="eyebrow">${icon('sparkle', { size: 14 })} ${t('bandEyebrow')}</p>
          <h2>${t('bandTitle')}</h2>
          <p>${t('bandText')}</p>
          <a class="btn btn-grad" href="${pathFor(lang, 'tools')}">${t('bandCta')} ${icon('arrow', { size: 18, cls: 'i-dir' })}</a>
        </div>
        <ul class="band-tools">
          ${TOOLS.map((tool) => html`
            <li><a href="${pathFor(lang, 'tools', tool.slug)}"><span class="tool-icon">${icon(tool.icon)}</span><span>${tool.name[lang]}</span></a></li>`)}
        </ul>
      </div>
    </aside>`;
}

function worldSection(lang, currentCode) {
  const t = translator(lang);
  const tile = (c) => html`
    <li><a class="country-tile" href="${pathFor(lang, 'trending', c.code.toLowerCase())}"${c.code === currentCode ? raw(' aria-current="page"') : ''}>
      <span class="cc">${c.code}</span><span class="cname">${c[lang]}</span>${icon('arrow', { size: 16, cls: 'i-dir' })}
    </a></li>`;
  return html`
    <section class="world wrap" aria-labelledby="world-title">
      <div class="section-head" data-reveal>
        <h2 id="world-title">${t('worldTitle')}</h2>
        <p class="muted">${t('worldLead')}</p>
      </div>
      <h3 class="group-title">${t('worldArab')}</h3>
      <ul class="country-grid">${COUNTRIES.slice(0, ARAB_COUNT).map(tile)}</ul>
      <h3 class="group-title">${t('worldGlobal')}</h3>
      <ul class="country-grid">${COUNTRIES.slice(ARAB_COUNT).map(tile)}</ul>
    </section>`;
}

function trendingView(lang, { country, category, snapshot, isHome, source, detected }, { siteUrl, now = Date.now() }) {
  const t = translator(lang);
  const cName = country[lang];
  const catSlug = category?.slug || '';
  const path = pathFor(lang, 'trending', country.code.toLowerCase(), catSlug);
  const title = category ? t('trendingCountryCategoryTitle', cName, category[lang]) : t('trendingCountryTitle', cName);
  const items = snapshot.items || [];
  const updated = snapshot.fetchedAt ? formatRelative(new Date(snapshot.fetchedAt).toISOString(), lang, now) : '';
  const guides = publishedGuides(lang).slice(0, 3);

  const trail = [[t('home'), pathFor(lang)], [cName, pathFor(lang, 'trending', country.code.toLowerCase())]];
  if (category) trail.push([category[lang], path]);

  const h1 = category
    ? html`${t('stageCatA', category[lang])}${t('stageA')}<span class="grad-text">${cName}</span>${t('stageCatB')}`
    : html`${t('stageA')}<span class="grad-text">${cName}</span>${t('stageB')}`;

  const grid = items.slice(5);
  const firstRows = grid.slice(0, 12);
  const laterRows = grid.slice(12);

  return {
    lang,
    nav: 'trending',
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
      <section class="stage">
        <div class="wrap">
          ${isHome ? '' : breadcrumbs(siteUrl, trail)}
          <div class="stage-grid">
            <div class="stage-copy">
              <p class="eyebrow live"><span class="live-dot" aria-hidden="true"></span>${t('live')}${updated ? html` · ${t('updatedAgo', updated)}` : ''} · ${t('refreshEvery')}</p>
              <h1>${h1}</h1>
              <p class="lede">${t('lede', cName)}</p>
            </div>
            ${countryPicker(lang, { country, category, isHome, source })}
          </div>
          ${source === 'fallback' && detected ? html`<p class="notice">${t('fallbackNotice', cName)}</p>` : ''}
          ${snapshot.stale ? html`<p class="notice">${t('staleNotice')}</p>` : ''}
        </div>
      </section>
      ${categoryChips(lang, { country, category, isHome })}
      ${items.length ? html`
        ${spotlight(lang, items)}
        ${firstRows.length ? html`
          <section class="wrap feed" aria-labelledby="more-title">
            <h2 id="more-title" class="section-title">${t('moreTrending')}</h2>
            <ol class="vgrid">${firstRows.map((v, i) => videoCard(lang, v, i + 6))}</ol>
          </section>` : ''}
        ${creatorBand(lang)}
        ${laterRows.length ? html`
          <section class="wrap feed">
            <ol class="vgrid">${laterRows.map((v, i) => videoCard(lang, v, i + 18))}</ol>
          </section>` : ''}
        <p class="wrap fineprint source">${t('sourceYouTube')}</p>`
      : html`
        <div class="wrap"><p class="empty-state">${icon('globe', { size: 28 })}<span>${t('trendingEmpty')}</span></p></div>
        ${creatorBand(lang)}`}
      ${guides.length ? html`
        <section class="wrap section">
          <div class="section-head"><h2>${t('latestGuides')}</h2><a class="link-arrow" href="${pathFor(lang, 'guides')}">${t('allGuides')} ${icon('arrow', { size: 16, cls: 'i-dir' })}</a></div>
          <ul class="guide-grid">${guides.map((g) => guideCard(lang, g))}</ul>
        </section>` : ''}
      ${worldSection(lang, country.code)}
      <dialog class="player" data-player aria-label="${t('play')}">
        <div class="player-bar">
          <a class="btn btn-ghost btn-sm" data-player-watch href="#" rel="noopener" target="_blank">${icon('external', { size: 16 })} ${t('watchOnYouTube')}</a>
          <button type="button" class="icon-btn" data-player-close aria-label="${t('close')}">${icon('close')}</button>
        </div>
        <div class="player-frame" data-player-frame></div>
      </dialog>`,
  };
}

/**
 * Home = trending view for the visitor's country.
 * @param {object} data { country, snapshot, source: 'cookie'|'ip'|'fallback', detected? }
 */
export function homePage(lang, data, ctx) {
  const t = translator(lang);
  const page = trendingView(lang, { ...data, category: null, isHome: true }, ctx);
  return {
    ...page,
    title: t('homeTitle'),
    description: t('homeDescription'),
    path: pathFor(lang),
    alternates: both(),
    noindex: false,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'TrendVid',
        url: absoluteUrl(ctx.siteUrl, pathFor(lang)),
        inLanguage: lang,
        description: t('homeDescription'),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'TrendVid',
        url: absoluteUrl(ctx.siteUrl, '/'),
        logo: absoluteUrl(ctx.siteUrl, '/assets/img/og.png'),
        email: SITE.contactEmail,
      },
      ...page.schema,
    ],
  };
}

export function trendingCountryPage(lang, data, ctx) {
  return trendingView(lang, { ...data, isHome: false, source: 'page' }, ctx);
}

/* ======================================================================== TOOLS */

function trustRow(lang) {
  const t = translator(lang);
  return html`
    <ul class="trust">
      <li>${icon('check', { size: 16 })} ${t('trustFree')}</li>
      <li>${icon('bolt', { size: 16 })} ${t('trustNoSignup')}</li>
      <li>${icon('shield', { size: 16 })} ${t('trustPrivate')}</li>
    </ul>`;
}

export function toolsIndexPage(lang, { siteUrl }) {
  const t = translator(lang);
  return {
    lang,
    nav: 'tools',
    title: `${t('toolsTitle')} | TrendVid`,
    description: t('toolsDescription'),
    path: pathFor(lang, 'tools'),
    alternates: both('tools'),
    ads: true,
    body: html`
      ${pageHero({
        crumbs: breadcrumbs(siteUrl, [[t('home'), pathFor(lang)], [t('navTools'), pathFor(lang, 'tools')]]),
        eyebrow: html`${icon('sparkle', { size: 14 })} ${t('toolsEyebrow')}`,
        title: t('toolsTitle'),
        lede: t('toolsLead'),
        extra: trustRow(lang),
      })}
      <div class="wrap">
        <ul class="tool-bento">${TOOLS.map((tool, i) => toolCard(lang, tool, { featured: i === 0 }))}</ul>
        ${adSlot(lang)}
        ${affiliateBox(lang)}
      </div>`,
  };
}

export function toolPage(lang, tool, { siteUrl }) {
  const t = translator(lang);
  const labels = tool.labels[lang];
  const faq = tool.faq[lang];
  const path = pathFor(lang, 'tools', tool.slug);
  const others = TOOLS.filter((x) => x.slug !== tool.slug);
  return {
    lang,
    nav: 'tools',
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
      ${pageHero({
        crumbs: breadcrumbs(siteUrl, [[t('home'), pathFor(lang)], [t('navTools'), pathFor(lang, 'tools')], [tool.name[lang], path]]),
        iconName: tool.icon,
        eyebrow: t('freeTool'),
        title: tool.title[lang],
        lede: tool.intro[lang],
        extra: trustRow(lang),
      })}
      <div class="wrap tool-layout">
        <div class="tool-main">
          <section class="panel" aria-label="${tool.name[lang]}">
            ${tool.form(labels)}
            <p class="fineprint lock">${icon('shield', { size: 14 })} ${t('privacyNoteTool')}</p>
          </section>
          ${adSlot(lang)}
          <section class="section">
            <h2 class="section-title">${t('howItWorks')}</h2>
            <ol class="steps">${tool.steps[lang].map((s, i) => html`<li data-reveal><span class="step-n">${i + 1}</span><p>${s}</p></li>`)}</ol>
          </section>
          <section class="section faq">
            <h2 class="section-title">${t('faq')}</h2>
            ${faq.map(([q, a]) => html`<details><summary>${q}${icon('chevron', { size: 18 })}</summary><div class="faq-a"><p>${raw(a)}</p></div></details>`)}
          </section>
        </div>
        <aside class="tool-side">
          ${affiliateBox(lang, tool.slug)}
          ${adSlot(lang, { variant: 'side' })}
          <section class="side-card">
            <h2 class="side-title">${t('relatedTools')}</h2>
            <ul class="mini-tools">
              ${others.map((x) => html`<li><a href="${pathFor(lang, 'tools', x.slug)}"><span class="tool-icon">${icon(x.icon, { size: 18 })}</span>${x.name[lang]}</a></li>`)}
            </ul>
          </section>
        </aside>
      </div>`,
  };
}

/* ======================================================================= GUIDES */

export function guidesIndexPage(lang, { siteUrl }) {
  const t = translator(lang);
  const guides = publishedGuides(lang);
  return {
    lang,
    nav: 'guides',
    title: `${t('guidesTitle')} | TrendVid`,
    description: t('guidesDescription'),
    path: pathFor(lang, 'guides'),
    alternates: both('guides'),
    ads: true,
    // An empty index is thin content: keep it out of the index until the first guide ships.
    noindex: guides.length === 0,
    body: html`
      ${pageHero({
        crumbs: breadcrumbs(siteUrl, [[t('home'), pathFor(lang)], [t('navGuides'), pathFor(lang, 'guides')]]),
        eyebrow: html`${icon('book', { size: 14 })} ${t('guidesEyebrow')}`,
        title: t('guidesTitle'),
        lede: t('guidesLead'),
      })}
      <div class="wrap">
        ${guides.length
          ? html`<ul class="guide-grid">${guides.map((g) => guideCard(lang, g))}</ul>${adSlot(lang)}`
          : html`
            <div class="empty-hero" data-reveal>
              <span class="hero-icon">${icon('book', { size: 30 })}</span>
              <p>${t('guidesEmpty')}</p>
              <a class="btn btn-grad" href="${pathFor(lang, 'tools')}">${t('bandCta')} ${icon('arrow', { size: 18, cls: 'i-dir' })}</a>
            </div>`}
      </div>`,
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
    nav: 'guides',
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
      <div class="progress" data-progress aria-hidden="true"></div>
      ${pageHero({
        crumbs: breadcrumbs(siteUrl, [[t('home'), pathFor(lang)], [t('navGuides'), pathFor(lang, 'guides')], [guide.title, path]]),
        eyebrow: html`${icon('book', { size: 14 })} ${t('minutesRead', guide.minutes)}`,
        title: guide.title,
        lede: guide.description,
        extra: html`<p class="meta">
          ${guide.author ? html`${t('byAuthor', guide.author)} · ` : ''}
          ${guide.updated && guide.updated !== guide.date
            ? t('updatedOn', formatDate(guide.updated, lang))
            : t('publishedOn', formatDate(guide.date, lang))}
        </p>`,
      })}
      <div class="wrap article-layout">
        <article class="prose" data-article>${raw(guide.html)}</article>
        <aside class="article-side">
          ${toc.length >= 3 ? html`
            <nav class="side-card toc" aria-label="${t('tableOfContents')}">
              <h2 class="side-title">${t('tableOfContents')}</h2>
              <ol>${toc.map((h) => html`<li><a href="#${h.id}">${h.text}</a></li>`)}</ol>
            </nav>` : ''}
          ${affiliateBox(lang, null, guide.affiliates)}
        </aside>
      </div>
      <div class="wrap">
        ${adSlot(lang)}
        ${related.length ? html`
          <section class="section">
            <h2 class="section-title">${t('relatedGuides')}</h2>
            <ul class="guide-grid">${related.map((g) => guideCard(lang, g))}</ul>
          </section>` : ''}
      </div>`,
  };
}

/* ======================================================================= STATIC */

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
      ${pageHero({
        crumbs: breadcrumbs(siteUrl, [[t('home'), pathFor(lang)], [page.title, path]]),
        title: page.title,
        lede: page.description,
      })}
      <div class="wrap">
        <article class="prose doc">
          ${page.sections.map(([heading, paragraphs]) => html`
            <h2>${heading}</h2>
            ${paragraphs.map((p) => html`<p>${raw(p)}</p>`)}`)}
          ${showUpdated ? html`<p class="fineprint">${t('updatedOn', formatDate(UPDATED, lang))}</p>` : ''}
        </article>
        ${key === 'about' ? adSlot(lang) : ''}
      </div>`,
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
      <section class="lost wrap">
        <p class="lost-code grad-text" aria-hidden="true">404</p>
        <h1>${t('notFoundTitle')}</h1>
        <p class="lede">${t('notFoundText')}</p>
        <div class="actions">
          <a class="btn btn-grad" href="${pathFor(lang)}">${icon('flame', { size: 18 })} ${t('backHome')}</a>
          <a class="btn btn-ghost" href="${pathFor(lang, 'tools')}">${t('navTools')}</a>
        </div>
      </section>`,
  };
}
