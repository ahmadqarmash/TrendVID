/**
 * Shared bootstrap for the static pages (about / privacy / terms / contact / 404).
 * Keeps them consistent with the app without loading the whole app bundle.
 */
import { CONFIG } from './config.js';
import { loadAnalytics, initAds, applyConsent } from './analytics.js';

const theme = localStorage.getItem('trendvid_theme');
if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;

const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

loadAnalytics(CONFIG);
window.__trendvidConsentUpdate = (granted) => applyConsent(Boolean(granted));

// One labelled ad unit at the end of the article (skipped entirely on /404.html).
initAds(CONFIG, { ids: ['adDoc'] });

// Static pages are single-language HTML; honour a previously chosen language when
// the visitor came from an Arabic session by pointing the "back" button correctly.
const btn = document.getElementById('backHome');
if (btn && localStorage.getItem('trendvid_lang') === 'ar') {
  btn.textContent = '← الرئيسية';
}
