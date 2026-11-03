# TrendVid 4

Arabic-first **creator hub** for YouTube creators: free browser-based tools, practical guides
written by the team, and an ad-free trending browser. One Cloudflare Worker serves everything —
server-rendered HTML, static assets, and a cron job that refreshes trending charts. No framework,
no runtime dependencies.

## How the site makes money

| Page type | Shows YouTube data? | Ads | Affiliate links |
| --- | --- | --- | --- |
| Home, tools, guides, about | No | ✅ AdSense | ✅ creator tools (vidIQ, TubeBuddy, Epidemic Sound, VEED, Descript) |
| Trending (`/{lang}/trending/...`) | Yes | ❌ never | ❌ never |
| Privacy, terms, contact, 404 | No | ❌ | ❌ |

The split is required by the **YouTube API Services Developer Policies, III.G.1.d**: a page that
contains YouTube API data must not carry advertising, sponsorships or promotions. The trending pages
exist to bring visitors in; they link to the tools and guides, which earn. `tests/policy.test.mjs`
fails the build if a trending page ever renders an ad or affiliate link.

Other policy constraints built in: no derived metrics (we show YouTube's own order and view counts),
trending data expires after 26 hours (limit is 30 days), and privacy/terms carry the required
YouTube API Services disclosures.

## Layout

```
src/
  worker.js            routes, redirects, security headers, sitemap/robots, cron handler
  config.js            ← owner settings: AdSense/GA IDs, affiliate links, countries, categories
  i18n.js              interface strings (ar + en, same keys)
  tools.js             tool pages: copy, FAQ, form markup
  content/static-pages.js   about / privacy / terms / contact (ar + en)
  views/layout.js      page shell, ad slot, affiliate box, breadcrumbs
  views/pages.js       home, tools, guides, trending, static, 404
  lib/                 html templating, markdown, youtube client, KV trending store, formatting
  generated/guides.js  built from content/guides (gitignored)
content/guides/{ar,en}/*.md   guides written by the team (see content/guides/README.md)
public/                CSS, browser JS (tools, player), images, ads.txt
tests/                 node:test suites (policy, routing, tools logic, content)
scripts/               build-content, check-syntax
docs/LAUNCH.md         owner checklist from zero to live
```

## Commands

```bash
npm test          # builds guides, runs all offline tests
npm run check     # syntax-check every JS file
npm run dev       # wrangler dev -> http://127.0.0.1:8787 (YOUTUBE_API_KEY in .dev.vars for live data)
npm run deploy    # wrangler deploy (builds guides first) - see docs/LAUNCH.md before the first one
```

## URLs

`/` redirects to `/ar/` or `/en/` by browser language (Arabic by default).

- `/{lang}/tools/` · `/{lang}/tools/{earnings-calculator|title-checker|description-checker|thumbnail-checker}/`
- `/{lang}/guides/` · `/{lang}/guides/{slug}/`
- `/{lang}/trending/` · `/{lang}/trending/{country}/` · `/{lang}/trending/{country}/{category}/`
- `/{lang}/about|privacy|terms|contact/` · `/sitemap.xml` · `/robots.txt` · `/api/health`

Any host other than `trendvid.net` (workers.dev, previews) is served with `noindex` and a
disallow-all robots.txt, so test deployments can never be indexed as duplicates.

## Accounts

This project uses only GitHub `ahmadqarmash` and Cloudflare account `fae79810…`
(`account_id` is pinned in `wrangler.toml`).
