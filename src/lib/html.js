/**
 * Safe HTML templating. Every interpolated value is escaped unless it is already a SafeHtml
 * (produced by `html` or `raw`). Arrays are joined, null/undefined/false render nothing.
 *
 *   html`<p>${userText}</p>`        -> escaped
 *   html`<ul>${items.map(li)}</ul>` -> nested templates stay unescaped
 */

class SafeHtml {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Mark trusted markup (e.g. rendered Markdown, JSON-LD) as safe. Never pass user input. */
export function raw(value) {
  return new SafeHtml(String(value ?? ''));
}

function render(value) {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return escapeHtml(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) {
    out += render(values[i]) + strings[i + 1];
  }
  return new SafeHtml(out);
}

/** JSON for a <script type="application/ld+json"> block (no `</script>` breakout). */
export function jsonLd(data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return raw(`<script type="application/ld+json">${json}</script>`);
}
