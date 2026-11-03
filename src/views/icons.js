/**
 * Inline SVG icons (24x24, stroke = currentColor). Drawn for TrendVid - no icon library.
 * icon('play') returns SafeHtml; decorative by default (aria-hidden).
 */
import { raw } from '../lib/html.js';

const P = {
  logo: '<path d="M2.5 13.5h3l2-5 3 10 3-14 2.5 9h5.5" stroke-width="2.2"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  flame: '<path d="M12 21c-3.9 0-7-2.8-7-6.6 0-3 1.8-5.1 3.6-6.9.4 1.8 1.4 3 2.6 3.5C11 7.8 12.6 5 15 3c.2 2.6 1.4 4.2 2.6 5.8 1 1.4 1.4 2.7 1.4 4.6 0 4.4-3.1 7.6-7 7.6z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  sparkle: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  calculator: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" stroke-width="2.2"/>',
  title: '<path d="M4 6V4.5h16V6M12 4.5v15M9 19.5h6"/>',
  text: '<path d="M4 6h16M4 10h16M4 14h10M4 18h7"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M21 15.5l-5-4.5-8.5 8"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/><path d="M9 12l2 2 4-4"/>',
  bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
  music: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  gamepad: '<path d="M7 8h10a4.5 4.5 0 0 1 4.4 5.5l-.8 3.5a2.5 2.5 0 0 1-4.3 1L14.5 16h-5l-1.8 2a2.5 2.5 0 0 1-4.3-1l-.8-3.5A4.5 4.5 0 0 1 7 8z"/><path d="M8 11v3M6.5 12.5h3M15.5 12h.01M17.5 13.5h.01" stroke-width="2"/>',
  tv: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M8 2.5l4 3.5 4-3.5"/>',
  trophy: '<path d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 13v4M8.5 20.5h7M9.5 17h5"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01" stroke-width="2.2"/>',
  news: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M7 9h10M7 12.5h10M7 16h6"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  cap: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.5v4c1.5 1.6 3.4 2.5 5.5 2.5s4-.9 5.5-2.5v-4M21.5 9.5v5"/>',
  atom: '<circle cx="12" cy="12" r="1.6" fill="currentColor"/><ellipse cx="12" cy="12" rx="9.5" ry="4"/><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(120 12 12)"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7.5 4v16M16.5 4v16M3 9h4.5M3 15h4.5M16.5 9H21M16.5 15H21"/>',
  all: '<circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
};

/** Category slug -> icon name. */
export const CATEGORY_ICONS = {
  music: 'music', gaming: 'gamepad', entertainment: 'tv', sports: 'trophy', comedy: 'smile',
  news: 'news', howto: 'bulb', education: 'cap', science: 'atom', film: 'film',
};

export function icon(name, { size = 20, cls = '', label = '' } = {}) {
  const body = P[name] || P.sparkle;
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return raw(`<svg class="i${cls ? ` ${cls}` : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${body}</svg>`);
}

/** Brand mark: pulse line inside a gradient tile. `id` keeps gradient ids unique per page. */
export function logoMark(id = 'lg') {
  return raw(`<svg class="logo-mark" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" focusable="false">
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#FF7A3D"/><stop offset=".5" stop-color="#FF2E7E"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>
  <rect width="34" height="34" rx="10" fill="url(#${id})"/>
  <path d="M6 18h4l2.6-6 3.4 11 3.6-15 2.8 10H28" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);
}
