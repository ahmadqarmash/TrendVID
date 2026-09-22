/**
 * TrendVid - index page application.
 * Entry point loaded by <script type="module"> in index.html.
 *
 * Architecture: small state container + explicit render functions.
 * Every DOM id referenced here exists in site/index.html.
 */
import { CONFIG } from './config.js';
import { COUNTRIES, countryName, isSupportedCountry } from './countries.js';
import { createTranslator, normalizeLang, dirFor } from './i18n.js';
import { formatViews, formatRelativeDate, toPage, truncate } from './format.js';
import { fetchVideos, fetchCategories, detectCountry } from './api.js';
import { renderOffer } from './offers.js';
import { loadAnalytics, trackEvent, trackPageView, initAds, applyConsent } from './analytics.js';

const STORAGE = {
  lang: 'trendvid_lang',
  theme: 'trendvid_theme',
  country: 'trendvid_country',
  category: 'trendvid_category',
  mode: 'trendvid_mode',
  countryAuto: 'trendvid_country_auto',
};

const state = {
  lang: 'en',
  theme: 'dark',
  mode: 'trending', // 'trending' | 'mostViewed'
  country: 'US',
  category: '0',
  page: 1,
  pageToken: '',
  nextPageToken: '',
  tokenStack: [], // enables "Previous" for token-based (country) paging
  lastMode: 'COUNTRY', // last API mode: GLOBAL = page paging, COUNTRY = token paging
  totalApprox: null,
  loading: false,
  items: [],
};

let t = createTranslator(state.lang);
let inFlight = null; // AbortController of the current request (guards against races)

const $ = (id) => document.getElementById(id);
const els = {};

function cacheEls() {
  for (const id of [
    'countrySelect', 'categorySelect', 'langSelect', 'btnTrending', 'btnViews', 'themeToggle', 'themeIcon',
    'heroText', 'heroCTA', 'seoTitle', 'seoDescription', 'statusText', 'btnPrev', 'btnNext', 'pageIndicator',
    'grid', 'gridRest', 'modal', 'modalOverlay', 'modalClose', 'playerFrame', 'modalTitle', 'modalSub',
    'modalWatch', 'schema-json', 'year', 'smart-offer', 'offer-link', 'offer-text', 'offer-btn',
  ]) {
    els[id] = $(id);
  }
}

/* ---------------------------------------------------------------- persistence */

function readPersisted() {
  const lang = localStorage.getItem(STORAGE.lang);
  const theme = localStorage.getItem(STORAGE.theme);
  const country = localStorage.getItem(STORAGE.country);
  const category = localStorage.getItem(STORAGE.category);
  const mode = localStorage.getItem(STORAGE.mode);

  if (lang) state.lang = normalizeLang(lang);
  if (theme === 'light' || theme === 'dark') state.theme = theme;
  if (mode === 'trending' || mode === 'mostViewed') state.mode = mode;
  if (country && isSupportedCountry(country)) state.country = country;
  if (category) state.category = category;
}

function persist() {
  localStorage.setItem(STORAGE.lang, state.lang);
  localStorage.setItem(STORAGE.theme, state.theme);
  localStorage.setItem(STORAGE.country, state.country);
  localStorage.setItem(STORAGE.category, state.category);
  localStorage.setItem(STORAGE.mode, state.mode);
}

/* ------------------------------------------------------------------- language */

function setDir(lang) {
  const html = document.documentElement;
  html.setAttribute('dir', dirFor(lang));
  html.setAttribute('lang', normalizeLang(lang));
}

function setLang(lang) {
  state.lang = normalizeLang(lang);
  t = createTranslator(state.lang);
  persist();
  setDir(state.lang);
  if (els.langSelect) els.langSelect.value = state.lang;
  buildCountryOptions();
  applyI18n();
  updateSeo();
  updateOffer();
}

/** Push localized labels into every element that has one. */
function applyI18n() {
  const map = {
    lblCountry: 'country', lblCategory: 'category', lblLang: 'language',
    btnTrending: 'trending', btnViews: 'mostViewed', btnPrev: 'previous', btnNext: 'next',
    lnkAbout: 'about', lnkPrivacy: 'privacy', lnkTerms: 'terms', lnkContact: 'contact',
  };
  for (const [id, key] of Object.entries(map)) {
    const el = els[id] || $(id);
    if (el) el.textContent = t(key);
  }
  if (els.heroText) els.heroText.textContent = t('heroTitle', countryName(state.country, state.lang));
  if (els.heroCTA) els.heroCTA.textContent = t('heroCTA');
  if (els.modalClose) els.modalClose.setAttribute('aria-label', t('close'));
  document.querySelectorAll('#adInFeed .adLabel, #adBottom1 .adLabel, #adBottom2 .adLabel')
    .forEach((el) => { el.textContent = t('adLabel'); });
}

function setTheme(theme) {
  state.theme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = state.theme;
  if (els.themeIcon) els.themeIcon.textContent = state.theme === 'dark' ? '🌙' : '☀️';
  persist();
}

/* ------------------------------------------------------------------- controls */

function buildCountryOptions() {
  if (!els.countrySelect) return;
  els.countrySelect.innerHTML = '';
  for (const c of COUNTRIES) {
    const opt = document.createElement('option');
    opt.value = c.code;
    opt.textContent = c.name[state.lang] || c.name.en;
    els.countrySelect.appendChild(opt);
  }
  els.countrySelect.value = state.country;
}

/** Category titles come from the API (English). Falls back to "All" when offline. */
async function loadCategories(country) {
  if (!els.categorySelect) return;
  els.categorySelect.innerHTML = '';
  const all = document.createElement('option');
  all.value = '0';
  all.textContent = t('all');
  els.categorySelect.appendChild(all);

  try {
    const categories = await fetchCategories({ apiBase: CONFIG.apiBase, country });
    for (const c of categories) {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.title;
      els.categorySelect.appendChild(opt);
    }
  } catch { /* offline / API down: "All" stays usable */ }

  const wanted = state.category || '0';
  const has = [...els.categorySelect.options].some((o) => o.value === wanted);
  els.categorySelect.value = has ? wanted : '0';
  state.category = els.categorySelect.value;
}

function setMode(mode) {
  state.mode = mode === 'mostViewed' ? 'mostViewed' : 'trending';
  persist();
  els.btnTrending?.classList.toggle('active', state.mode === 'trending');
  els.btnViews?.classList.toggle('active', state.mode === 'mostViewed');
  els.btnTrending?.setAttribute('aria-selected', String(state.mode === 'trending'));
  els.btnViews?.setAttribute('aria-selected', String(state.mode === 'mostViewed'));
}

/* ------------------------------------------------------------------- paging UI */

function resetPagination() {
  state.page = 1;
  state.pageToken = '';
  state.nextPageToken = '';
  state.tokenStack = [];
  state.totalApprox = null;
  updatePagerUI();
}

function updatePagerUI() {
  if (els.pageIndicator) {
    els.pageIndicator.textContent = String(state.page);
    els.pageIndicator.setAttribute('aria-label', `${t('page')} ${state.page}`);
  }
  const isGlobal = state.lastMode === 'GLOBAL';
  if (els.btnPrev) {
    els.btnPrev.disabled = isGlobal ? state.page <= 1 : state.tokenStack.length === 0;
  }
  if (els.btnNext) {
    els.btnNext.disabled = isGlobal
      ? state.items.length === 0
        || (Number.isFinite(state.totalApprox) && state.page * CONFIG.pageSize >= state.totalApprox)
      : !state.nextPageToken;
  }
}

function setStatus(text) {
  if (els.statusText) els.statusText.textContent = text;
}

/* --------------------------------------------------------------------- rendering */

function createCard(video) {
  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.dataset.id = video.id;
  card.setAttribute('aria-label', `${t('play')}: ${video.title || t('untitled')}`);
  card._video = video; // keep the normalized object on the node (lossless, no attribute round-trip)

  if (video.thumb) {
    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = video.thumb;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    card.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'thumb thumbEmpty';
    card.appendChild(placeholder);
  }

  const badge = document.createElement('div');
  badge.className = 'playBadge';
  const badgeInner = document.createElement('span');
  badgeInner.textContent = '▶';
  badge.appendChild(badgeInner);
  card.appendChild(badge);

  const body = document.createElement('div');
  body.className = 'cardBody';

  const title = document.createElement('h3');
  title.className = 'title';
  title.textContent = video.title || t('untitled');
  body.appendChild(title);

  const subRow = document.createElement('div');
  subRow.className = 'subRow';

  const channel = document.createElement('div');
  channel.className = 'ch';
  const when = formatRelativeDate(video.publishedAt, state.lang);
  channel.textContent = [video.channelTitle, when].filter(Boolean).join(' · ');
  subRow.appendChild(channel);

  const views = document.createElement('div');
  views.className = 'views';
  const eye = document.createElement('span');
  eye.textContent = '👁';
  eye.setAttribute('aria-hidden', 'true');
  const count = document.createElement('span');
  count.textContent = formatViews(video.viewCount);
  const label = document.createElement('span');
  label.textContent = t('views');
  views.append(eye, count, label);
  subRow.appendChild(views);

  body.appendChild(subRow);
  card.appendChild(body);

  const open = () => openModal(video);
  card.addEventListener('click', open);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });
  return card;
}

/** Split the list so the in-feed ad sits between the first and second grid block. */
function renderItems(items) {
  state.items = items;
  const splitAt = Math.max(0, CONFIG.inFeedAfter);
  const head = items.slice(0, splitAt);
  const rest = items.slice(splitAt);

  els.grid.replaceChildren(...head.map(createCard));
  els.gridRest.replaceChildren(...rest.map(createCard));
  updateAds(items.length > splitAt, items.length > 0);
}

function renderSkeleton(count = 8) {
  const make = () => {
    const card = document.createElement('article');
    card.className = 'card skeleton';
    card.innerHTML = '<div class="thumb"></div><div class="cardBody"><div class="line"></div><div class="line short"></div></div>';
    return card;
  };
  els.grid.replaceChildren(...Array.from({ length: count }, make));
  els.gridRest.replaceChildren();
  updateAds(false, false);
}

/* ------------------------------------------------------------------------ modal */

let lastFocused = null;

function openModal(video) {
  if (!els.modal || !els.playerFrame) return;
  lastFocused = document.activeElement;
  els.playerFrame.src = `https://www.youtube.com/embed/${encodeURIComponent(video.id)}?autoplay=1&rel=0`;
  if (els.modalTitle) els.modalTitle.textContent = video.title || t('untitled');
  if (els.modalSub) {
    els.modalSub.textContent = [video.channelTitle, `${formatViews(video.viewCount)} ${t('views')}`]
      .filter(Boolean).join(' • ');
  }
  if (els.modalWatch) els.modalWatch.href = `${CONFIG.youtubeWatchBase}${video.id}`;
  els.modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  els.modalClose?.focus();
  trackEvent('select_content', { content_type: 'video', item_id: video.id });
}

function closeModal() {
  if (!els.modal) return;
  if (els.playerFrame) els.playerFrame.src = ''; // stops playback
  els.modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}

function wireModal() {
  els.modalOverlay?.addEventListener('click', closeModal);
  els.modalClose?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });
}

/* ------------------------------------------------------------------------ offer */

function updateOffer() {
  return renderOffer({
    offersConfig: CONFIG.offers,
    country: state.country,
    lang: state.lang,
    doc: document,
    onShow: ({ offerId, url }) => trackEvent('offer_click', {
      offer_id: offerId,
      country: state.country,
      language: state.lang,
      link_url: url,
    }),
  });
}

/* --------------------------------------------------------------- seo + schema */

function updateSeo() {
  const modeLabel = state.mode === 'mostViewed' ? t('mostViewed') : t('trending');
  const cName = countryName(state.country, state.lang);
  const catLabel = state.category && state.category !== '0'
    ? (els.categorySelect?.selectedOptions?.[0]?.textContent || '')
    : '';

  const title = t('seoTitle', modeLabel, cName);
  const desc = truncate(t('seoLead', modeLabel, cName, catLabel), 155);

  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);

  // The H1 must never be "Trending YouTube Videos in X | TrendVid" - keep it human.
  if (els.seoTitle) els.seoTitle.textContent = `${modeLabel} YouTube videos in ${cName}`;
  if (els.seoDescription) els.seoDescription.textContent = t('seoLead', modeLabel, cName, catLabel);
  if (els.heroText) els.heroText.textContent = t('heroTitle', cName);

  trackPageView({ title, path: `/${state.mode}/${String(state.country).toLowerCase()}` });
}

/** ItemList schema for the visible videos (helps rich results / video discovery). */
function injectSchema(items) {
  const el = els['schema-json'];
  if (!el) return;
  const list = items.slice(0, 8).map((v, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: v.title || '',
    url: `${CONFIG.youtubeWatchBase}${v.id}`,
  }));
  el.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: list,
  });
}

/* -------------------------------------------------------------------------- ads */

function updateAds(hasInFeed, hasContent = state.items.length > 0) {
  initAds(CONFIG, { inFeed: hasInFeed, bottom: hasContent });
}

/* ---------------------------------------------------------------------- states */

function showEmpty() {
  state.items = [];
  const box = document.createElement('div');
  box.className = 'stateBox';
  const text = document.createElement('p');
  text.textContent = t('noResults');
  box.appendChild(text);
  els.grid.replaceChildren(box);
  els.gridRest.replaceChildren();
  updateAds(false, false);
  setStatus(t('noResults'));
}

function showError(error) {
  state.items = [];
  const box = document.createElement('div');
  box.className = 'stateBox';
  const text = document.createElement('p');
  text.textContent = (error?.kind === 'network' || error?.kind === 'timeout')
    ? t('errorNetwork')
    : t('error');
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'btn';
  retry.textContent = t('retry');
  retry.addEventListener('click', () => loadVideos());
  box.append(text, retry);
  els.grid.replaceChildren(box);
  els.gridRest.replaceChildren();
  updateAds(false, false);
  setStatus(t('error'));
  trackEvent('api_error', {
    error_kind: error?.kind || 'unknown',
    status: error?.status || 0,
    message: String(error?.message || '').slice(0, 120),
  });
}

/* ------------------------------------------------------------------- data flow */

let requestId = 0;

async function loadVideos() {
  const myId = ++requestId; // latest request wins: stale responses are ignored
  state.loading = true;
  els.grid?.setAttribute('aria-busy', 'true');
  setStatus(t('loading'));
  renderSkeleton(Math.min(CONFIG.inFeedAfter, CONFIG.pageSize));

  try {
    const data = await fetchVideos({
      apiBase: CONFIG.apiBase,
      type: state.mode,
      country: state.country,
      category: state.category,
      page: state.page,
      pageToken: state.pageToken,
      pageSize: CONFIG.pageSize,
    }, { timeoutMs: 15000 });

    if (myId !== requestId) return; // a newer request already rendered

    state.lastMode = data.mode === 'GLOBAL' ? 'GLOBAL' : 'COUNTRY';
    state.nextPageToken = data.nextPageToken || '';
    state.totalApprox = data.totalApprox;

    if (!data.items.length) {
      showEmpty();
    } else {
      renderItems(data.items);
      setStatus(t('showing', data.items.length));
      try { injectSchema(data.items); } catch { /* schema must never break the UI */ }
    }
    updatePagerUI();
  } catch (error) {
    if (myId !== requestId) return;
    showError(error);
  } finally {
    if (myId === requestId) {
      state.loading = false;
      els.grid?.setAttribute('aria-busy', 'false');
    }
  }
}

/* ---------------------------------------------------------------- event wiring */

function wireFilters() {
  els.langSelect?.addEventListener('change', async () => {
    setLang(els.langSelect.value);
    await loadVideos();
  });

  els.countrySelect?.addEventListener('change', async () => {
    state.country = els.countrySelect.value;
    persist();
    resetPagination();
    updateSeo();
    updateOffer();
    await loadCategories(state.country);
    await loadVideos();
  });

  els.categorySelect?.addEventListener('change', async () => {
    state.category = els.categorySelect.value || '0';
    persist();
    resetPagination();
    updateSeo();
    await loadVideos();
  });
}

function wireMode() {
  els.btnTrending?.addEventListener('click', async () => {
    setMode('trending');
    resetPagination();
    updateSeo();
    await loadVideos();
  });
  els.btnViews?.addEventListener('click', async () => {
    setMode('mostViewed');
    resetPagination();
    updateSeo();
    await loadVideos();
  });
}

function wireTheme() {
  els.themeToggle?.addEventListener('click', () => {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
  });
}

function wirePager() {
  els.btnPrev?.addEventListener('click', async () => {
    if (state.lastMode === 'GLOBAL') {
      if (state.page > 1) state.page -= 1;
    } else {
      state.pageToken = state.tokenStack.pop() || '';
      state.page = Math.max(1, state.page - 1);
    }
    updatePagerUI();
    await loadVideos();
  });

  els.btnNext?.addEventListener('click', async () => {
    if (state.lastMode === 'GLOBAL') {
      state.page += 1;
    } else {
      if (!state.nextPageToken) return;
      state.tokenStack.push(state.pageToken);
      state.pageToken = state.nextPageToken;
      state.page += 1;
    }
    updatePagerUI();
    await loadVideos();
  });
}

/* ------------------------------------------------------------------------ boot */

async function init() {
  cacheEls();
  readPersisted();
  setDir(state.lang);
  setTheme(state.theme);
  loadAnalytics(CONFIG);

  // CMP hook: your consent banner (or AdSense's own message) calls this.
  window.__trendvidConsentUpdate = (granted) => applyConsent(Boolean(granted));

  if (els.year) els.year.textContent = String(new Date().getFullYear());
  applyI18n();
  buildCountryOptions();
  if (els.langSelect) els.langSelect.value = state.lang;

  // Detect the visitor's country once per browser (never overrides a user choice).
  if (!localStorage.getItem(STORAGE.countryAuto)) {
    const detected = await detectCountry();
    if (isSupportedCountry(detected)) state.country = detected;
    persist();
    localStorage.setItem(STORAGE.countryAuto, '1');
    buildCountryOptions();
    applyI18n();
  }

  setMode(state.mode);
  wireMode();
  wireTheme();
  wirePager();
  wireFilters();
  wireModal();

  await loadCategories(state.country);
  updateSeo();
  updateOffer();
  resetPagination();
  await loadVideos();
}

// Handy for debugging in the console (state + manual reload).
window.TrendVid = {
  state,
  reload: () => loadVideos(),
  config: CONFIG,
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
