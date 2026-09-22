# TrendVid

Trending / most-viewed YouTube directory: **static site** (`site/`) served by Cloudflare Pages +
**own API** (`api/`) running as a Cloudflare Worker. No build step, no framework, no runtime
dependencies — only Node for tests and tooling.

This repository is a clean rebuild. The production build it replaces had **no version history**
(the deployed source had been lost), three divergent local copies, and a front-end that read
`data.videos` while the API returned `items` — so the grid rendered empty. Everything here is
derived from the *verified* behaviour of the live site and API, captured under `_reference/`.

## Repository layout

```
site/                     -> deploy root for Cloudflare Pages
  index.html              main app (Trending / Most Viewed, filters, pager, modal player)
  about|privacy|terms|contact|404.html
  robots.txt sitemap.xml ads.txt _headers _redirects favicon.ico
  assets/css/style.css    one stylesheet for the app and the doc pages
  assets/js/              ES modules: config, countries, i18n, format, api, offers, analytics, app
api/                      -> Cloudflare Worker (the API on api.trendvid.net)
  src/index.js            /videos, /categories, /diag, /  + CORS, KV cache, stale-while-error
  wrangler.toml
tests/                    -> node:test suites (unit, contract, fixtures, live alarm)
  fixtures/               trimmed copies of REAL API responses
docs/                     -> API-CONTRACT, DEPLOYMENT, MONETIZATION, RUNBOOK, SEO-PLAN
scripts/                  -> check-syntax, local static server
_reference/               -> harvested live build + API samples (not deployed; keep for audits)
```

## Quick start

```bash
npm run check     # syntax-check every JS file
npm test          # 41 offline tests (unit + fixtures); no network needed
npm run serve     # http://localhost:8788  (serves site/)
npm run dev:api   # wrangler dev -> http://localhost:8787 (needs the YOUTUBE_API_KEY secret)

# Point the local site at your local Worker instead of production:
#   localStorage.setItem('trendvid_api_base', 'http://localhost:8787')
```

Live contract check against the deployed API (proves the client still matches reality):

```bash
TRENDVID_LIVE=1 node --test tests/live-contract.test.mjs
```

## Deploy (summary — full steps in `docs/DEPLOYMENT.md`)

1. `git init && git add . && git commit -m "TrendVid 3.0 rebuild"` and push to GitHub.
2. Cloudflare Pages → *Connect to Git* → this repo, **build output directory `site`**, no build command.
3. Workers → create `trendvid-api` from `api/wrangler.toml` (or let the `Deploy API Worker` workflow
   publish it) and add the `YOUTUBE_API_KEY` secret in Cloudflare — never in the repo.
4. Attach `trendvid.net` to the Pages project and `api.trendvid.net` to the Worker.
5. Push to `main` = production. Pull requests get preview URLs. Rollback = Cloudflare deployment
   rollback or `git revert`.

## Production IDs that must not change

| What | Value |
| --- | --- |
| AdSense client | `ca-pub-7235869092973329` (slot `4003830709`) |
| GA4 measurement ID | `G-28Y2VHF39E` |
| Impact.com verification | `0de35687-ed81-46f4-8940-5bd4102e4b75` |
| API host | `https://api.trendvid.net` |
| Contact email | `ahmadgam249@gmail.com` |

They live in `site/assets/js/config.js` (JS) or the page `<head>`s, so a future change is one edit
instead of a hunt through eight files.

## What this rebuild fixed

- **Contract mismatch that blanked the grid** (`data.videos` vs `items`, `v.thumbnail` vs
  `thumbnails.*.url`, string view counts). Now normalised in `site/assets/js/api.js` and guarded by
  tests, including fixtures made from the real payloads.
- **SEO that only ran on click.** The old build called `updateSEO()`/schema injection *inside* the card
  click handler, so titles, canonical and JSON-LD stayed stale for crawlers. Now they update on every
  state change, the H1 is server-rendered, and the canonical always points at a URL that exists.
- **No error/empty/loading states** — the old page stayed blank on failure. Now: skeletons, a
  "no results" state, a retry button, and an `api_error` GA4 event.
- **Missing revenue files**: `ads.txt`, `robots.txt`, `sitemap.xml`, `404.html`, an in-feed ad slot,
  and ads/analytics on the doc pages (which previously had none).
- **Untagged affiliate link** (the old banner pointed at plain `veed.io`, earning nothing). The banner
  now hides itself until a real tagged link is configured, and each click fires an `offer_click` event.
- **API robustness**: invalid parameters return 400 with a JSON error instead of 500; categories
  degrade to a static list; an expired cache entry is still served when YouTube fails.

## Before you announce anything — 4 open items

1. **Paste your real affiliate link** into `site/assets/js/config.js` (`offers.items.veed.url`). The
   banner is intentionally hidden until you do, so no clicks are given away untagged.
2. **Enable the certified CMP** in AdSense (*Privacy & messaging*), then set
   `analytics.consentMode: true` — see `docs/MONETIZATION.md`.
3. **Confirm `ALLOWED_ORIGINS`** in `api/wrangler.toml` after the first deploy (production, preview
   hostname, localhost).
4. **Add `X-Robots-Tag: noindex` to the Pages preview hostname** (Cloudflare Configuration Rule) so
   staging copies can never be indexed as duplicates.

`site/assets/og.png` (1200×630) is already generated, so the OG/Twitter tags resolve.

## Docs

- [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md) — endpoints, parameters, responses, errors, quota maths.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — GitHub + Cloudflare Pages/Workers, previews, secrets, rollback.
- [`docs/MONETIZATION.md`](docs/MONETIZATION.md) — AdSense, ads.txt, consent, affiliate offers, policy rules.
- [`docs/RUNBOOK.md`](docs/RUNBOOK.md) — deploy/rollback, incident playbooks, post-deploy checklist.
- [`docs/SEO-PLAN.md`](docs/SEO-PLAN.md) — country/category landing pages and Arabic-first growth.

## Legal / content notes

Videos are embedded from YouTube and remain the property of their owners; this project hosts no
media. The Privacy Policy discloses the Google AdSense/GA4 cookies and the YouTube embeds, and the
Content-Security-Policy ships in **report-only** mode until you verify that ads and analytics still
load (see `docs/RUNBOOK.md`).

