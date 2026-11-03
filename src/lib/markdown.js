/**
 * Small Markdown renderer for the guides (runs at build time in scripts/build-content.mjs).
 * Supports: front matter, # headings (h2-h4 inside articles), paragraphs, - / 1. lists,
 * > quotes, ``` code blocks, --- rules, ![alt](src), [text](url), **bold**, *italic*, `code`.
 * Raw HTML in the source is escaped - guides are text, not markup.
 */
import { escapeHtml } from './html.js';

/** Split `---\nkey: value\n---\nbody` into { data, body }. */
export function parseFrontMatter(source) {
  const text = String(source).replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { data: {}, body: text };
  const data = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) value = value.slice(1, -1);
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (/^\[.*\]$/.test(value)) {
      value = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    }
    data[kv[1]] = value;
  }
  return { data, body: text.slice(match[0].length) };
}

function safeUrl(url) {
  const u = String(url).trim();
  if (/^(https?:|mailto:|\/|#)/i.test(u)) return u;
  return '#';
}

/** Inline formatting on already-escaped text. */
export function renderInline(text) {
  const codes = [];
  let out = escapeHtml(text).replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code);
    return `\u0000${codes.length - 1}\u0000`;
  });
  // URL part allows one level of balanced parentheses, e.g. Wikipedia links.
  out = out
    .replace(/!\[([^\]]*)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (_, alt, src) =>
      `<img src="${safeUrl(src)}" alt="${alt}" loading="lazy" decoding="async">`)
    .replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (_, label, href) => {
      const url = safeUrl(href);
      const external = /^https?:/i.test(url) && !/^https?:\/\/(www\.)?trendvid\.net/i.test(url);
      return external
        ? `<a href="${url}" rel="noopener" target="_blank">${label}</a>`
        : `<a href="${url}">${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

/**
 * Render Markdown to HTML. Returns { html, headings } where headings feed the table of contents.
 * `# ` becomes <h2> because the page template owns the <h1>.
 */
export function renderMarkdown(source) {
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const headings = [];
  let para = [];
  let list = null; // { tag, items }
  let quote = [];
  let i = 0;

  const flushPara = () => {
    if (para.length) out.push(`<p>${renderInline(para.join(' '))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((it) => `<li>${renderInline(it)}</li>`).join('')}</${list.tag}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) out.push(`<blockquote><p>${renderInline(quote.join(' '))}</p></blockquote>`);
    quote = [];
  };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      flushAll();
      const code = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i += 1; }
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+?)\s*#*$/);
    if (heading) {
      flushAll();
      const level = heading[1].length + 1;
      const id = slugify(heading[2]);
      headings.push({ level, id, text: heading[2] });
      out.push(`<h${level} id="${escapeHtml(id)}">${renderInline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { flushAll(); out.push('<hr>'); i += 1; continue; }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || ordered) {
      flushPara(); flushQuote();
      const tag = bullet ? 'ul' : 'ol';
      if (list && list.tag !== tag) flushList();
      if (!list) list = { tag, items: [] };
      list.items.push((bullet || ordered)[1]);
      i += 1;
      continue;
    }

    const q = line.match(/^>\s?(.*)$/);
    if (q) { flushPara(); flushList(); quote.push(q[1]); i += 1; continue; }

    if (!line.trim()) { flushAll(); i += 1; continue; }

    if (list && /^\s{2,}\S/.test(line)) { list.items[list.items.length - 1] += ` ${line.trim()}`; i += 1; continue; }
    flushList(); flushQuote();
    para.push(line.trim());
    i += 1;
  }
  flushAll();
  return { html: out.join('\n'), headings };
}

/** Rough reading time (words / 200), at least 1 minute. */
export function readingMinutes(source) {
  const words = String(source).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
