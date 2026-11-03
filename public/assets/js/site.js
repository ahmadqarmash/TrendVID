/**
 * Loaded on every page: theme toggle, header state, scroll reveal, reading progress,
 * GA4 (with Consent Mode hook), AdSense units and affiliate click events.
 * Ads only exist in the HTML of pages allowed to carry them (see src/views/layout.js).
 */
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------------- theme */
/* Dark is the default design; the choice is remembered per browser. */
document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('tv-theme', next); } catch { /* private mode */ }
  });
});

/* --------------------------------------------------------- header + progress */
const topbar = document.querySelector('[data-topbar]');
const progress = document.querySelector('[data-progress]');
const article = document.querySelector('[data-article]');
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    topbar?.classList.toggle('is-scrolled', window.scrollY > 8);
    if (progress && article) {
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const done = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      progress.style.setProperty('--p', done.toFixed(3));
    }
    ticking = false;
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------------------------------------------------------------- reveal */
/* Content is visible without JS; with JS, items fade up as they enter (staggered per row). */
const revealables = [...document.querySelectorAll('[data-reveal]')];
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    let batch = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.style.setProperty('--d', `${Math.min(batch, 6) * 60}ms`);
      entry.target.classList.add('in');
      io.unobserve(entry.target);
      batch += 1;
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  revealables.forEach((el) => io.observe(el));
}

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

/* ------------------------------------------------------ conversion events */
document.addEventListener('click', (event) => {
  if (typeof window.gtag !== 'function') return;
  const affiliate = event.target.closest?.('a[data-affiliate]');
  if (affiliate) {
    window.gtag('event', 'affiliate_click', { program: affiliate.dataset.affiliate, page_path: location.pathname });
    return;
  }
  // Clicks from trending pages into the tools are the funnel that earns - measure them.
  const toTools = event.target.closest?.('a[href*="/tools/"]');
  if (toTools && !location.pathname.includes('/tools/')) {
    window.gtag('event', 'tools_click', { from: location.pathname, to: toTools.getAttribute('href') });
  }
});
