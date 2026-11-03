/** Small DOM helpers shared by the tool scripts. */

export const lang = document.documentElement.lang === 'en' ? 'en' : 'ar';

export function form(slug) {
  return document.querySelector(`form[data-tool="${slug}"]`);
}

export function out(root, name) {
  return root.querySelector(`[data-out="${name}"]`);
}

/** Render [{ level, key, value }] into a <ul class="checks"> using a { key: text|fn } table. */
export function renderChecks(list, checks, table) {
  list.replaceChildren(...checks.map((c) => {
    const li = document.createElement('li');
    li.className = c.level || '';
    const entry = table[c.key];
    li.textContent = typeof entry === 'function' ? entry(c.value) : (entry || c.key);
    return li;
  }));
}

/** Fill a .meter bar: green under `warnAt`, amber up to `limit`, red above. */
export function setMeter(bar, count, limit, warnAt = limit * 0.8) {
  if (!bar) return;
  bar.style.width = `${Math.min(100, (count / limit) * 100)}%`;
  bar.classList.toggle('is-warn', count > warnAt && count <= limit);
  bar.classList.toggle('is-bad', count > limit);
}

/** Fire a GA4 event if analytics loaded (no-op otherwise). */
export function track(name, params = {}) {
  try { if (typeof window.gtag === 'function') window.gtag('event', name, params); } catch { /* ignore */ }
}

/** Debounced "tool_use" event so we can see which tools people actually use. */
let usedOnce = false;
export function markUsed(slug) {
  if (usedOnce) return;
  usedOnce = true;
  track('tool_use', { tool: slug });
}
