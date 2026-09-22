/**
 * Analytics (GA4) + AdSense bootstrapping + Consent Mode scaffolding.
 *
 * Two things used to be impossible: measuring offer clicks, and turning on consent
 * without breaking revenue. Both are handled here:
 *  - trackEvent('offer_click', ...) is wired to the affiliate banner
 *  - Consent Mode v2 defaults stay OFF until a Google-certified CMP is enabled in AdSense
 *    (see docs/MONETIZATION.md) - flipping `consentMode: true` in config.js is all that changes.
 */

const GA_SRC = 'https://www.googletagmanager.com/gtag/js?id=';

/** Load GA4 (kept out of the HTML so the CSP does not need inline ga scripts). */
export function loadAnalytics(config, doc = document, win = window) {
  const id = config?.analytics?.id;
  if (!config?.analytics?.enabled || !id) return false;

  win.dataLayer = win.dataLayer || [];
  const gtag = (...args) => win.dataLayer.push(args);
  win.gtag = win.gtag || gtag;

  if (config.analytics.consentMode) {
    win.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      wait_for_update: 500,
    });
  }

  if (!doc.querySelector(`script[src^="${GA_SRC}"]`)) {
    const script = doc.createElement('script');
    script.async = true;
    script.src = `${GA_SRC}${id}`;
    doc.head.appendChild(script);
  }

  win.gtag('js', new Date());
  win.gtag('config', id, { send_page_view: false });
  return true;
}

/** Consent Mode v2 update. Call from your CMP callback: window.__trendvidConsentUpdate(true). */
export function applyConsent(granted, win = window) {
  if (typeof win.gtag !== 'function') return;
  const value = granted ? 'granted' : 'denied';
  win.gtag('consent', 'update', {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  });
}

/** Send a GA4 event (no-op when GA is missing/blocked, e.g. an ad blocker). */
export function trackEvent(name, params = {}, win = window) {
  try {
    if (typeof win.gtag === 'function') win.gtag('event', name, params);
  } catch { /* never break the UI over analytics */ }
}

/** SPA page_view for GA4. */
export function trackPageView({ title, path }, win = window) {
  trackEvent('page_view', { page_title: title, page_path: path }, win);
}

/**
 * Reveal + initialize AdSense units.
 * @param {{adsense: object}} config
 * @param {{inFeed?: boolean, bottom?: boolean}} placements which slots to activate this render
 * @returns {number} number of units pushed
 */
export function initAds(config, placements = {}, doc = document, win = window) {
  if (!config?.adsense?.enabled) return 0;

  const slots = [];
  if (Array.isArray(placements.ids)) slots.push(...placements.ids);
  if (config.adsense.inFeed && placements.inFeed) slots.push('adInFeed');
  if (config.adsense.bottom && placements.bottom) slots.push('adBottom1', 'adBottom2');

  let pushed = 0;
  for (const id of slots) {
    const wrap = doc.getElementById(id);
    if (!wrap) continue;
    wrap.hidden = false;
    const ins = wrap.querySelector('ins.adsbygoogle');
    // Push exactly once per <ins>: re-rendering the grid must not re-push.
    if (!ins || ins.dataset.trendvidPushed === '1') continue;
    ins.dataset.trendvidPushed = '1';
    win.adsbygoogle = win.adsbygoogle || [];
    try {
      win.adsbygoogle.push({});
      pushed += 1;
    } catch { /* ad blocker */ }
  }
  return pushed;
}
