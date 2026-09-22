import test from 'node:test';
import assert from 'node:assert/strict';

import { isPlaceholderUrl, pickOffer, withSubId } from '../site/assets/js/offers.js';
import { CONFIG } from '../site/assets/js/config.js';

const realOfferConfig = {
  enabled: true,
  defaultOfferId: 'veed',
  byCountry: { SA: 'veed', US: 'veed' },
  items: {
    veed: {
      id: 'veed',
      url: 'https://veed.io/?via=PARTNER123',
      text: { en: 'Translate', ar: 'ترجم' },
      cta: { en: 'Try free', ar: 'جرّب' },
    },
  },
};

test('placeholder links are detected so we never send untagged traffic', () => {
  assert.equal(isPlaceholderUrl('https://veed.io/?via=REPLACE_WITH_IMPACT_LINK'), true);
  assert.equal(isPlaceholderUrl(''), true);
  assert.equal(isPlaceholderUrl(undefined), true);
  assert.equal(isPlaceholderUrl('https://veed.io/?via=PARTNER123'), false);
});

test('the shipped config hides the banner until a real affiliate link exists', () => {
  // config.js still contains the REPLACE_WITH placeholder -> no offer, banner hidden, $0 leaked.
  assert.equal(pickOffer(CONFIG.offers, { country: 'SA' }), null);
});

test('pickOffer returns the configured offer once a real link is set', () => {
  const offer = pickOffer(realOfferConfig, { country: 'SA' });
  assert.equal(offer.id, 'veed');
  assert.equal(offer.url, 'https://veed.io/?via=PARTNER123');
});

test('pickOffer falls back to the default offer for unknown countries', () => {
  assert.equal(pickOffer(realOfferConfig, { country: 'ZZ' })?.id, 'veed');
  assert.equal(pickOffer({ ...realOfferConfig, enabled: false }, { country: 'SA' }), null);
});

test('withSubId adds subId1 once and preserves an existing value', () => {
  assert.equal(withSubId('https://veed.io/?via=X', 'trendvid_sa_ar'), 'https://veed.io/?via=X&subId1=trendvid_sa_ar');
  const already = withSubId('https://veed.io/?via=X&subId1=existing', 'trendvid_sa_ar');
  assert.equal(new URL(already).searchParams.get('subId1'), 'existing');
  assert.equal(withSubId('not a url', 'x'), 'not a url');
});
