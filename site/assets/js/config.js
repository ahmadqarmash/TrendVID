/**
 * TrendVid - central configuration.
 * Everything a non-developer needs to change lives here (or in Cloudflare env vars for the API).
 * NOTE: values in this file are public (they ship to the browser). Never put API keys here.
 */

/**
 * Local/staging override so you can point the site at a dev Worker without editing this file:
 *   localStorage.setItem('trendvid_api_base', 'http://localhost:8787')
 * or set window.__TRENDVID_API_BASE__ before the module loads.
 */
function resolveApiBase(defaultBase) {
  if (typeof window === 'undefined') return defaultBase;
  try {
    const fromStorage = window.localStorage?.getItem('trendvid_api_base');
    const fromGlobal = window.__TRENDVID_API_BASE__;
    return (fromGlobal || fromStorage || defaultBase).replace(/\/+$/, '');
  } catch {
    return defaultBase;
  }
}

export const CONFIG = {
  apiBase: resolveApiBase('https://api.trendvid.net'),

  /** Verified production IDs - do not change without updating AdSense/GA. */
  adsense: {
    enabled: true,
    client: 'ca-pub-7235869092973329',
    /** Slot reused for every placement in production. */
    slot: '4003830709',
    /** Renders a labelled in-feed unit between the first and second grid rows. */
    inFeed: true,
    /** Renders the two units below the grid. */
    bottom: true,
  },

  analytics: {
    /** GA4 measurement ID. */
    id: 'G-28Y2VHF39E',
    enabled: true,
  },

  /**
   * Affiliate offers.
   * IMPORTANT: replace `url` with YOUR real tracking link (Impact/partner subId included).
   * While a url still contains REPLACE_WITH, the banner stays hidden on purpose so we never
   * send untagged (unpaid) clicks. See docs/MONETIZATION.md.
   */
  offers: {
    enabled: true,
    /** default offer used when no geo-specific offer matches */
    defaultOfferId: 'veed',
    /** country code -> offer id */
    byCountry: {
      US: 'veed', GB: 'veed', CA: 'veed', AU: 'veed', IE: 'veed', NZ: 'veed',
      SA: 'veed', AE: 'veed', EG: 'veed', JO: 'veed', QA: 'veed', KW: 'veed',
      BH: 'veed', OM: 'veed', MA: 'veed', DZ: 'veed', TN: 'veed', IQ: 'veed',
    },
    items: {
      veed: {
        id: 'veed',
        // TODO(owner): paste your Impact tracking link, e.g.
        //   https://veed.io/?via=YOURID&subId1=trendvid_offer
        url: 'https://veed.io/?via=REPLACE_WITH_IMPACT_LINK',
        text: {
          en: '🔥 Translate trending videos instantly',
          ar: '🔥 ترجم الفيديوهات الرائجة فورًا',
        },
        cta: { en: 'Try it free', ar: 'جرّبها مجانًا' },
      },
    },
  },

  /** YouTube channel/video URLs use this host (used for schema + share links). */
  youtubeWatchBase: 'https://www.youtube.com/watch?v=',

  /** Page size for the grid (API max is 50). */
  pageSize: 20,
  /** Cards shown before the in-feed ad unit. */
  inFeedAfter: 8,
};
