import test from 'node:test';
import assert from 'node:assert/strict';

import { I18N, SUPPORTED_LANGS, createTranslator, normalizeLang, dirFor } from '../site/assets/js/i18n.js';

test('en and ar expose exactly the same keys', () => {
  const en = Object.keys(I18N.en).sort();
  const ar = Object.keys(I18N.ar).sort();
  assert.deepEqual(ar, en, 'Arabic must define the same keys as English (no missing translations)');
});

test('array-valued strings are callable in both languages', () => {
  for (const lang of SUPPORTED_LANGS) {
    const t = createTranslator(lang);
    assert.equal(typeof t('showing', 5), 'string');
    assert.equal(typeof t('seoTitle', 'Trending', 'Saudi Arabia'), 'string');
    assert.match(t('seoTitle', 'Trending', 'Saudi Arabia'), /TrendVid/);
  }
});

test('arabic values are actually translated, not copied from english', () => {
  const keys = ['country', 'category', 'language', 'trending', 'mostViewed', 'previous', 'next', 'views', 'loading'];
  for (const key of keys) {
    assert.notEqual(I18N.ar[key], I18N.en[key], `ar.${key} looks untranslated`);
  }
});

test('translator falls back to English, then to the key itself', () => {
  assert.equal(createTranslator('ar')('definitelyMissingKey'), 'definitelyMissingKey');
  assert.equal(createTranslator('de')('country'), 'Country'); // unsupported language -> English
});

test('language helpers normalise input', () => {
  assert.equal(normalizeLang('ar'), 'ar');
  assert.equal(normalizeLang('en'), 'en');
  assert.equal(normalizeLang('AR'), 'en'); // strict: unknown values fall back to English
  assert.equal(normalizeLang(undefined), 'en');
  assert.equal(dirFor('ar'), 'rtl');
  assert.equal(dirFor('en'), 'ltr');
  assert.equal(dirFor(undefined), 'ltr');
});
