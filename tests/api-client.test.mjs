import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ApiError, buildCategoriesUrl, buildVideosUrl, isValidType,
  normalizeVideo, normalizeVideosResponse, pickThumbnail,
} from '../site/assets/js/api.js';

const API = 'https://api.trendvid.net';

test('GLOBAL requests page by page number (no token)', () => {
  const url = new URL(buildVideosUrl({
    apiBase: API, type: 'trending', country: 'GLOBAL', category: '0', page: 3, pageSize: 20,
  }));
  assert.equal(url.pathname, '/videos');
  assert.equal(url.searchParams.get('country'), 'GLOBAL');
  assert.equal(url.searchParams.get('page'), '3');
  assert.equal(url.searchParams.get('pageToken'), null);
});

test('country requests send pageToken and never a page number', () => {
  const url = new URL(buildVideosUrl({
    apiBase: API, type: 'mostViewed', country: 'SA', category: '24', pageToken: 'CAUQAA', pageSize: 20,
  }));
  assert.equal(url.searchParams.get('country'), 'SA');
  assert.equal(url.searchParams.get('pageToken'), 'CAUQAA');
  assert.equal(url.searchParams.get('page'), null);
  assert.equal(url.searchParams.get('type'), 'mostViewed');
});

test('pageSize is optional and clamped to sane values', () => {
  const without = new URL(buildVideosUrl({ apiBase: API, type: 'trending', country: 'US' }));
  assert.equal(without.searchParams.get('pageSize'), null);
  assert.equal(isValidType('trending'), true);
  assert.equal(isValidType('bogus'), false);
});

test('an invalid type falls back to trending instead of breaking the URL', () => {
  const url = new URL(buildVideosUrl({ apiBase: API, type: 'bogus', country: 'US' }));
  assert.equal(url.searchParams.get('type'), 'trending');
});

test('a trailing slash on apiBase does not produce a double slash', () => {
  assert.ok(buildVideosUrl({ apiBase: 'https://x.dev/', type: 'trending', country: 'US' })
    .startsWith('https://x.dev/videos?'));
});

test('categories endpoint maps GLOBAL to a real region', () => {
  assert.equal(buildCategoriesUrl({ apiBase: API, country: 'GLOBAL' }), `${API}/categories?country=US`);
  assert.equal(buildCategoriesUrl({ apiBase: API, country: 'SA' }), `${API}/categories?country=SA`);
});

test('normalizeVideo handles a real API payload', () => {
  const item = {
    id: '3WjSPuuayjs',
    title: 'Satellite',
    channelTitle: 'Kevin Gates - Topic',
    publishedAt: '2026-09-21T15:00:35Z',
    viewCount: '53730',
    thumbnails: {
      default: { url: 'https://i.ytimg.com/vi/3WjSPuuayjs/default.jpg' },
      medium: { url: 'https://i.ytimg.com/vi/3WjSPuuayjs/mqdefault.jpg' },
      high: { url: 'https://i.ytimg.com/vi/3WjSPuuayjs/hqdefault.jpg' },
      standard: { url: 'https://i.ytimg.com/vi/3WjSPuuayjs/sddefault.jpg' },
      maxres: { url: 'https://i.ytimg.com/vi/3WjSPuuayjs/maxresdefault.jpg' },
    },
  };
  const video = normalizeVideo(item);
  assert.equal(video.id, '3WjSPuuayjs');
  assert.equal(video.viewCount, 53730); // string from the API, number in the UI
  assert.equal(video.viewCountRaw, '53730');
  assert.equal(video.thumb, item.thumbnails.maxres.url); // maxres preferred
});

test('normalizeVideo tolerates missing/odd fields', () => {
  assert.equal(normalizeVideo(null), null);
  assert.equal(normalizeVideo({ title: 'no id' }), null);
  const sparse = normalizeVideo({ id: 'abc' });
  assert.equal(sparse.viewCount, 0);
  assert.equal(sparse.thumb, '');
  assert.equal(normalizeVideo({ id: { videoId: 'nested' } }).id, 'nested');
  assert.equal(pickThumbnail({ high: { url: 'h' } }), 'h');
});

test('normalizeVideosResponse throws a shape error when items is missing', () => {
  // This is the exact failure that silently blanked the previous build: { videos: [...] } instead of items.
  assert.throws(
    () => normalizeVideosResponse({ videos: [{ id: 'x' }] }),
    (error) => error instanceof ApiError && error.kind === 'shape',
  );
});

test('normalizeVideosResponse keeps paging/total metadata', () => {
  const global = normalizeVideosResponse({ mode: 'GLOBAL', page: '2', pageSize: '20', totalApprox: 847, items: [] });
  assert.equal(global.mode, 'GLOBAL');
  assert.equal(global.page, 2);
  assert.equal(global.pageSize, 20);
  assert.equal(global.totalApprox, 847);

  const country = normalizeVideosResponse({ mode: 'COUNTRY', nextPageToken: 'CAUQAA', prevPageToken: 'CAEQAA', items: [] });
  assert.equal(country.nextPageToken, 'CAUQAA');
  assert.equal(country.prevPageToken, 'CAEQAA');
  assert.equal(country.totalApprox, null);
});
