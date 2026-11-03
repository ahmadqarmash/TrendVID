import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeDescription, analyzeTitle, charCount, checkChapters, checkThumbnail, earnings,
  extractTimestamps, formatTimestamp, parseTimestamp, viewsForGoal,
} from '../public/assets/js/tools/logic.js';

const keys = (checks) => checks.map((c) => c.key);

test('earnings: views/1000 x RPM, monthly = 30 days, yearly = 365', () => {
  assert.deepEqual(earnings(10000, 2), { day: 20, month: 600, year: 7300 });
  assert.deepEqual(earnings('', 'x'), { day: 0, month: 0, year: 0 });
  assert.deepEqual(earnings(-5, 3), { day: 0, month: 0, year: 0 });
});

test('views needed for a monthly goal', () => {
  assert.deepEqual(viewsForGoal(600, 2), { daily: 10000, monthly: 300000 });
  assert.deepEqual(viewsForGoal(1000, 2), { daily: 16667, monthly: 500000 }, 'monthly is exact, daily rounds up');
  assert.equal(viewsForGoal(600, 0), null);
});

test('charCount counts emoji and Arabic as people see them', () => {
  assert.equal(charCount('👍🏽'), 1);
  assert.equal(charCount('مرحبا'), 5);
  assert.equal(charCount(''), 0);
});

test('title analysis: limits and common mistakes', () => {
  assert.deepEqual(analyzeTitle('').checks, []);
  assert.ok(keys(analyzeTitle('a'.repeat(101)).checks).includes('tooLong'));
  assert.ok(keys(analyzeTitle('a'.repeat(80)).checks).includes('mayTruncate'));
  assert.ok(keys(analyzeTitle('Short').checks).includes('veryShort'));
  assert.ok(keys(analyzeTitle('I tried the cheapest phone for 7 days').checks).includes('goodLength'));
  assert.ok(keys(analyzeTitle('THIS IS THE BEST PHONE EVER MADE').checks).includes('tooManyCaps'));
  assert.ok(keys(analyzeTitle('Wow 😀😀😀 what a day for everyone').checks).includes('tooManyEmoji'));
  assert.ok(keys(analyzeTitle('هل هذا حقيقي؟؟؟ تجربة غريبة جدًا').checks).includes('repeatedPunctuation'));
  assert.ok(keys(analyzeTitle('Best <tips> for creators on YouTube').checks).includes('angleBrackets'));
});

test('timestamps: parsing and formatting', () => {
  assert.equal(parseTimestamp('0:00'), 0);
  assert.equal(parseTimestamp('2:05'), 125);
  assert.equal(parseTimestamp('1:02:03'), 3723);
  assert.equal(parseTimestamp('1:75'), null);
  assert.equal(formatTimestamp(3723), '1:02:03');
  assert.equal(formatTimestamp(65), '1:05');
});

test('timestamps are taken from line starts, in common formats', () => {
  const ts = extractTimestamps('Intro text 1:00 not a chapter\n0:00 Intro\n(0:45) Step one\n2:10 - Wrap-up');
  assert.deepEqual(ts.map((t) => [t.seconds, t.label]), [[0, 'Intro'], [45, 'Step one'], [130, 'Wrap-up']]);
});

test("chapters follow YouTube's rules", () => {
  const ok = checkChapters(extractTimestamps('0:00 A\n0:30 B\n1:00 C'));
  assert.equal(ok.valid, true);
  assert.deepEqual(keys(checkChapters(extractTimestamps('0:05 A\n0:30 B\n1:00 C')).problems), ['firstNotZero']);
  assert.deepEqual(keys(checkChapters(extractTimestamps('0:00 A\n0:30 B')).problems), ['tooFew']);
  assert.deepEqual(keys(checkChapters(extractTimestamps('0:00 A\n0:05 B\n1:00 C')).problems), ['tooShort']);
  assert.deepEqual(keys(checkChapters(extractTimestamps('0:00 A\n1:00 B\n0:30 C')).problems), ['notAscending']);
  assert.deepEqual(keys(checkChapters([]).problems), ['noTimestamps']);
});

test('description analysis: limit, hashtags, links, brackets', () => {
  const r = analyzeDescription('Hello #one #two https://a.com\n0:00 Intro\n0:20 B\n0:40 C');
  assert.equal(r.hashtags, 2);
  assert.equal(r.links, 1);
  assert.equal(r.chapters.valid, true);
  assert.ok(keys(analyzeDescription('x'.repeat(5001)).problems).includes('descTooLong'));
  assert.ok(keys(analyzeDescription('a <b>').problems).includes('angleBrackets'));
  const many = Array.from({ length: 61 }, (_, i) => `#t${i}`).join(' ');
  assert.ok(keys(analyzeDescription(many).problems).includes('hashtagsIgnored'));
});

test("thumbnail checks follow YouTube's requirements", () => {
  const perfect = checkThumbnail({ type: 'image/jpeg', size: 300_000, width: 1280, height: 720 });
  assert.ok(perfect.every((c) => c.level === 'ok'));
  const bad = checkThumbnail({ type: 'image/webp', size: 3 * 1024 * 1024, width: 600, height: 600 });
  assert.deepEqual(keys(bad), ['formatBad', 'sizeBad', 'tooSmall', 'ratioBad']);
  assert.ok(keys(checkThumbnail({ type: 'image/png', size: 1, width: 1920, height: 1080 })).includes('dimsOther'));
});
