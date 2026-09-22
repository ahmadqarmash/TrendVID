# SEO plan

## Where SEO stands after the rebuild

In place now:

- Five indexable pages (`/`, `about`, `privacy`, `terms`, `contact`) plus a `404.html`.
- A **visible, server-rendered H1** and lead paragraph. The previous build shipped its SEO text as
  `<section style="display:none">` and revealed it with JavaScript — text that is hidden at load and
  shown later is a (mild) cloaking risk and adds nothing for crawlers.
- `canonical` that always points at a URL that **exists**. The old build rewrote the canonical to
  `/trending/sa`-style paths that return 404 — a self-inflicted soft-404 factory.
- `robots.txt`, `sitemap.xml`, Open Graph/Twitter tags, and JSON-LD `ItemList` of the visible videos
  (previously injected only after a user click, so crawlers never saw it).
- Titles/descriptions that change with mode + country, e.g.
  *"Trending YouTube Videos in Saudi Arabia | TrendVid"*.

Honest reality check: a thin layer over YouTube's own charts will never win the generic head term
("trending videos" is answered by Google itself). The winnable ground is **country × category ×
language long tail** and **Arabic**, where competition is far thinner and the query intent is
explicit.

## Phase 1 — measure and clean (week 1, no new content)

1. Google Search Console: verify `trendvid.net` (DNS TXT via Cloudflare), submit
   `https://trendvid.net/sitemap.xml`, check that the 5 pages get indexed.
2. Fix whatever GSC reports: exclude preview hostnames (see `docs/DEPLOYMENT.md` §2), confirm the
   `www` → apex redirect, confirm no crawl blocks in `robots.txt`.
3. Baseline: queries, impressions, average position, CTR per page.

## Phase 2 — country/category landing pages (the main traffic play)

Target queries with real, recurring, machine-checkable intent:

- `trending videos <country>` / `youtube trending <country> today`
- `<category> trending <country>` (music, gaming, entertainment, sports, news)
- The Arabic equivalents: `الفيديوهات الرائجة في السعودية`, `أكثر الفيديوهات مشاهدة في مصر`, etc.

Rules that keep this from becoming a thin-content penalty:

1. **Each page needs its own value**, not a swapped country name: a short unique intro (2–3
   sentences with genuinely different facts), the live list, an FAQ block, and a "last updated" stamp.
2. **One page per real combination**, hand-picked. Start with 12–18 (for example SA, AE, EG, JO, US,
   GB, DE, TR × a few categories). Do **not** mass-generate hundreds of near-duplicates.
3. **Server-rendered, not client-generated**: the page must contain the H1, intro and FAQ in the HTML
   (fetch the data client-side afterwards, exactly like the app does).
4. **Internal links** from the homepage hero/footer to the top landing pages, and between related
   pages — orphans do not rank.
5. **Add each page to `sitemap.xml`** with a real `lastmod`.
6. Reuse the app: a landing page can load the same modules with a locked `country`/`category`, so
   there is one code path to maintain.

## Phase 3 — go Arabic-first

The Gulf/MENA queries are less contested and advertisers there pay better than global average.

- Publish static Arabic pages under `/ar/...` (for example `/ar/trending-saudi-arabia.html`) rather
  than relying on the in-app language toggle: a client-side switch cannot rank as a separate URL.
- Add `hreflang` pairs (`ar`, `en`, plus `x-default`) and give each language its own canonical.
- Translate the titles, meta descriptions and on-page copy properly — do not machine-dump text.

## Phase 4 — retention (so rankings are not the only traffic source)

Add a Telegram channel or a simple email digest: "Top 10 trending in your country, daily". One-off
search visits are fragile; an owned audience is not, and it monetises several times better per
visitor than display ads.

## What not to do

- No mass-generated pages (hundreds of near-identical country pages is the classic aggregator
  deindexing trigger).
- No hidden text, no keyword stuffing, no doorway pages, no bought links.
- No `noindex` anywhere except the 404 page and preview hostnames.
- Do not canonicalise SPA filter states: the app is one URL by design; the landing pages are the
  crawl surface.

## Measurement

| What | Where | Target |
| --- | --- | --- |
| Indexed pages | Search Console → Pages | 5 → 25–30 after Phase 2 |
| Impressions/clicks per landing page | GSC → Performance | month-over-month growth |
| Country mix of visitors | GA4 → Demographics | Gulf share growing |
| Engagement | GA4 `select_content` per session | > 1 video opened per 2 sessions |
| Revenue per 1,000 sessions | AdSense + Impact (`subId1`) | rising as geo-split offers kick in |
