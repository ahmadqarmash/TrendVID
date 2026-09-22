import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { normalizeVideosResponse, normalizeVideo } from '../site/assets/js/api.js';

const load = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

/**
 * These fixtures are trimmed copies of REAL responses captured from api.trendvid.net.
 * If the API ever changes shape again, these tests fail instead of the homepage going blank.
 */
test('the captured GLOBAL trending payload still parses', () => {
  const body = normalizeVideosResponse(load('videos-global.json'));
  assert.equal(body.mode, 'GLOBAL');
  assert.ok(body.items.length > 0);
  assert.ok(body.pageSize >= body.items.length);

  const video = body.items[0];
  assert.ok(video.id, 'id missing');
  assert.ok(video.title, 'title missing');
  assert.equal(typeof video.viewCount, 'number');
  assert.match(video.thumb, /^https:\/\/i\.ytimg\.com\//);
});

test('the captured country payload keeps paging tokens', () => {
  const body = normalizeVideosResponse(load('videos-country.json'));
  assert.equal(body.mode, 'COUNTRY');
  assert.equal(body.country, 'US');
  assert.ok(body.items.length > 0);
  assert.ok('nextPageToken' in body);
});

test('every captured item exposes the fields the card renders', () => {
  for (const file of ['videos-global.json', 'videos-country.json']) {
    for (const raw of load(file).items) {
      const video = normalizeVideo(raw);
      assert.ok(video, `item failed to normalize in ${file}`);
      for (const key of ['id', 'title', 'channelTitle', 'publishedAt', 'viewCount', 'thumb']) {
        assert.ok(video[key] !== undefined && video[key] !== null && video[key] !== '', `${key} missing in ${file}`);
      }
      // all five thumbnail sizes must exist, exactly like the Worker guarantees
      for (const size of ['default', 'medium', 'high', 'standard', 'maxres']) {
        assert.ok(video.thumbnails[size]?.url, `thumbnails.${size} missing in ${file}`);
      }
    }
  }
});

test('the captured categories payload matches what the filter expects', () => {
  const body = load('categories-us.json');
  assert.equal(body.country, 'US');
  assert.ok(Array.isArray(body.categories) && body.categories.length > 0);
  for (const category of body.categories) {
    assert.match(category.id, /^\d+$/);
    assert.ok(category.title.length > 0);
  }
});
