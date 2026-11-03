/**
 * Loaded on every page: theme toggle, GA4 (with Consent Mode hook), AdSense units, affiliate click events.
 * Ads only exist in the HTML of pages allowed to carry them (see src/views/layout.js).
 */

/* ---------------------------------------------------------------------- theme */
const root = document.documentElement;
function currentTheme() {
  return root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('tv-theme', next); } catch { /* private mode */ }
  });
});

/* ------------------------------------------------------------------ analytics */
const ga = document.querySelector('meta[name="tv-ga"]');
if (ga?.content) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); }; // gtag needs `arguments`
  if (ga.dataset.consentMode === '1') {
    window.gtag('consent', 'default', {
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500,
    });
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga.content)}`;
  document.head.appendChild(script);
  window.gtag('js', new Date());
  window.gtag('config', ga.content);
}

/** Hook for a consent banner / CMP: window.__trendvidConsentUpdate(true|false). */
window.__trendvidConsentUpdate = (granted) => {
  if (typeof window.gtag !== 'function') return;
  const value = granted ? 'granted' : 'denied';
  window.gtag('consent', 'update', { ad_storage: value, ad_user_data: value, ad_personalization: value, analytics_storage: value });
};

/* ------------------------------------------------------------------------ ads */
document.querySelectorAll('ins.adsbygoogle').forEach(() => {
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* blocked */ }
});

/* ------------------------------------------------------------ affiliate clicks */
document.addEventListener('click', (event) => {
  const link = event.target.closest?.('a[data-affiliate]');
  if (!link || typeof window.gtag !== 'function') return;
  window.gtag('event', 'affiliate_click', { program: link.dataset.affiliate, page_path: location.pathname });
});
