/**
 * Geo-aware "smart offer" banner.
 *
 * Money rule: never render the banner unless the URL is a REAL tagged affiliate link.
 * While config.offers.items.*.url still contains `REPLACE_WITH`, the banner stays hidden
 * instead of sending untagged (unpaid) clicks to the partner - that is the bug this fixes.
 */

const PLACEHOLDER_RE = /REPLACE_WITH|REPLACE_ME|YOUR_?ID|example\.com/i;

/** True when a URL is only a placeholder (must not be shown/sent traffic). */
export function isPlaceholderUrl(url) {
  return !url || PLACEHOLDER_RE.test(String(url));
}

/** Pick the offer for a country, falling back to the configured default. */
export function pickOffer(offersConfig, { country } = {}) {
  if (!offersConfig?.enabled) return null;
  const items = offersConfig.items || {};
  const byCountry = offersConfig.byCountry || {};
  const candidateId = byCountry[country] || offersConfig.defaultOfferId;
  const offer = items[candidateId] || Object.values(items)[0] || null;
  if (!offer || isPlaceholderUrl(offer.url)) return null;
  return offer;
}

/** Add the affiliate subId once (Impact reads subId1; other networks use it too). */
export function withSubId(url, subId) {
  if (!url || !subId) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has('subId1') && !u.searchParams.has('subid')) {
      u.searchParams.set('subId1', subId);
    }
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Render the banner into the DOM.
 * @returns {{shown: boolean, offerId: string|null, url: string|null}}
 */
export function renderOffer({ offersConfig, country, lang, doc = document, onShow } = {}) {
  const root = doc.getElementById('smart-offer');
  if (!root) return { shown: false, offerId: null, url: null };

  const offer = pickOffer(offersConfig, { country });
  if (!offer) {
    root.hidden = true;
    return { shown: false, offerId: null, url: null };
  }

  const subId = `trendvid_${(country || 'xx').toLowerCase()}_${lang || 'en'}`;
  const url = withSubId(offer.url, subId);

  const link = doc.getElementById('offer-link');
  const text = doc.getElementById('offer-text');
  const cta = doc.getElementById('offer-btn');
  if (link) link.href = url;
  if (text) text.textContent = offer.text?.[lang] || offer.text?.en || '';
  if (cta) cta.textContent = offer.cta?.[lang] || offer.cta?.en || '';

  root.hidden = false;

  // Bind once per element: repeated renders must not stack click listeners.
  root._trendvidOffer = { offerId: offer.id, url, country, lang };
  if (typeof onShow === 'function' && root.dataset.trendvidBound !== '1') {
    root.dataset.trendvidBound = '1';
    link?.addEventListener('click', () => onShow(root._trendvidOffer || {}));
  }
  return { shown: true, offerId: offer.id, url };
}
