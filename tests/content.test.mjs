import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGuides } from '../scripts/build-content.mjs';
import { PAGES } from '../src/content/static-pages.js';
import { STRINGS } from '../src/i18n.js';
import { escapeHtml, html, jsonLd, raw } from '../src/lib/html.js';
import { parseFrontMatter, renderInline, renderMarkdown } from '../src/lib/markdown.js';
import { TOOLS } from '../src/tools.js';

test('Arabic and English interface strings have the same keys', () => {
  assert.deepEqual(Object.keys(STRINGS.ar).sort(), Object.keys(STRINGS.en).sort());
});

test('every tool and static page exists in both languages', () => {
  for (const tool of TOOLS) {
    for (const field of ['name', 'short', 'title', 'intro', 'steps', 'faq', 'labels']) {
      assert.ok(tool[field].ar && tool[field].en, `${tool.slug}.${field}`);
    }
    assert.deepEqual(Object.keys(tool.labels.ar).sort(), Object.keys(tool.labels.en).sort(), tool.slug);
    assert.equal(tool.faq.ar.length, tool.faq.en.length, `${tool.slug} FAQ count`);
  }
  for (const [key, page] of Object.entries(PAGES)) {
    assert.equal(page.ar.sections.length, page.en.sections.length, `${key} section count`);
  }
});

test('html template escapes values but not nested templates', () => {
  assert.equal(escapeHtml(`<a href="x">'&`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
  assert.equal(String(html`<p>${'<b>'}</p>`), '<p>&lt;b&gt;</p>');
  assert.equal(String(html`<ul>${['a', 'b'].map((x) => html`<li>${x}</li>`)}</ul>`), '<ul><li>a</li><li>b</li></ul>');
  assert.equal(String(html`${raw('<i>ok</i>')}${null}${false}`), '<i>ok</i>');
  assert.ok(!String(jsonLd({ x: '</script><script>' })).includes('</script><script>'));
});

test('markdown: front matter, headings with ids, lists, links, escaping', () => {
  const { data, body } = parseFrontMatter('---\ntitle: "Hi"\ndraft: true\naffiliates: [vidiq, veed]\n---\n# Head\ntext');
  assert.deepEqual(data, { title: 'Hi', draft: true, affiliates: ['vidiq', 'veed'] });
  const { html: out, headings } = renderMarkdown(`${body}\n\n- one\n- **two**\n\n1. a\n2. b\n\n> quote\n\n<script>x</script>`);
  assert.match(out, /<h2 id="head">Head<\/h2>/);
  assert.match(out, /<ul><li>one<\/li><li><strong>two<\/strong><\/li><\/ul>/);
  assert.match(out, /<ol><li>a<\/li><li>b<\/li><\/ol>/);
  assert.match(out, /<blockquote>/);
  assert.ok(!out.includes('<script>'));
  assert.deepEqual(headings, [{ level: 2, id: 'head', text: 'Head' }]);
  assert.equal(renderInline('[x](javascript:alert(1))'), '<a href="#">x</a>');
  assert.match(renderInline('[YT](https://youtube.com)'), /rel="noopener" target="_blank"/);
  // Arabic headings keep their letters; diacritics (tanween) are dropped from the id.
  assert.match(renderMarkdown('## كيف تختار عنوانًا').html, /<h3 id="كيف-تختار-عنوانا">/);
});

function guideDir(files) {
  const dir = mkdtempSync(join(tmpdir(), 'tv-guides-'));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

const words = (n) => Array.from({ length: n }, () => 'word').join(' ');

test('guide build validates front matter, length, affiliates and translations', () => {
  const dir = guideDir({
    'ar/good-guide.md': `---\ntitle: T\ndescription: D\ndate: 2026-11-03\nauthor: A\ntranslation: good-guide-en\naffiliates: [vidiq]\n---\n${words(320)}`,
    'en/good-guide-en.md': `---\ntitle: T\ndescription: D\ndate: 2026-11-03\nauthor: A\ntranslation: good-guide\n---\n${words(320)}`,
    'en/_TEMPLATE.md': 'ignored',
    'en/Bad Name.md': `---\ntitle: T\ndescription: D\ndate: 03/11/2026\nauthor: A\naffiliates: [nope]\ntranslation: missing\n---\nshort`,
    'en/draft-ok.md': '---\ntitle: T\ndescription: D\ndate: 2026-11-03\nauthor: A\ndraft: true\n---\nshort is fine for drafts',
  });
  const { guides, errors } = buildGuides(dir);
  assert.equal(guides.length, 4);
  const joined = errors.join('\n');
  assert.match(joined, /Bad Name\.md: file name/);
  assert.match(joined, /"date" must look like/);
  assert.match(joined, /unknown affiliate "nope"/);
  assert.match(joined, /under 300 words/);
  assert.match(joined, /translation "missing" not found/);
  assert.ok(!joined.includes('good-guide'), 'valid guides produce no errors');
  assert.ok(!joined.includes('draft-ok'), 'drafts may be short');
});
