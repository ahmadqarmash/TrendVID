# Runbook

Operational playbooks for TrendVid (site on Cloudflare Pages, API on Cloudflare Workers).

## Routine checks

| Cadence | Check |
| --- | --- |
| Daily | `curl -s https://api.trendvid.net/diag` → `ok: true`, `bindings.youtubeKey: true` |
| Daily | Homepage loads 20 cards; grid is not empty |
| Weekly | Google Search Console: index coverage, sitemap processed, no soft-404s |
| Weekly | AdSense: earnings report, policy centre for warnings, ads.txt status |
| Weekly | Cloudflare: Analytics → Worker requests/errors; Pages build list |
| Monthly | `TRENDVID_LIVE=1 node --test tests/live-contract.test.mjs` |

## Deploy the site

```bash
git commit -am "..." && git push        # Pages publishes automatically (main = production)
```

Preview a change safely: open a PR, wait for the Pages preview URL, then verify
`/`, a filter change, pagination, the modal player, `/robots.txt`, and the offer banner before merging.

## Deploy the API

```bash
npm test                                                   # never deploy red
wrangler deploy --config api/wrangler.toml                 # or push to main (workflow)
curl -s https://api.trendvid.net/diag
```

## Rollback

- **Site:** Cloudflare Pages → *Deployments* → previous → *Rollback*. Or `git revert` + push.
- **API:** `wrangler rollback --config api/wrangler.toml` (or `git revert` + push).
- **Poisoned cache:** bump the key prefix in `api/src/index.js` (`v3:` → `v4:`) and redeploy; old
  keys expire on their own.

---

## Playbook 1 — the grid is empty

1. Open devtools → Network → the `/videos` request.
   - **CORS error** (`No 'Access-Control-Allow-Origin'`): the origin is not in `ALLOWED_ORIGINS`.
     Preview hostnames need `https://*.pages.dev`; local dev needs `http://localhost:8788`.
   - **400** → we sent invalid parameters. Check `window.TrendVid.state` for a stale `category`.
   - **503 / 429** → YouTube quota. See Playbook 4.
   - **502** → upstream failure with no cached payload. Check `wrangler tail`.
   - **200 with `items: []`** → legitimate "nothing in this region/category" (the empty state explains
     it to the user).
   - **200 but the UI shows nothing** → contract drift. Run
     `TRENDVID_LIVE=1 node --test tests/live-contract.test.mjs`; a failure there is the same bug class
     that broke the previous production site.
2. Reproduce locally: `npm run serve`, then set
   `localStorage.setItem('trendvid_api_base','http://localhost:8787')` and run `npm run dev:api` with a
   valid `YOUTUBE_API_KEY` in `api/.dev.vars`.

## Playbook 2 — ads disappeared

1. Browser console: CSP violations? The policy ships as
   `Content-Security-Policy-Report-Only`, so it cannot block anything yet — if you have switched to the
   enforcing header, this is the first suspect.
2. Ad blocker enabled? Check in a clean profile; most of your audience has none, but you cannot see
   your own ads otherwise.
3. AdSense → *Policy centre*: warnings or a payment/verification hold stop serving entirely.
4. `curl -s https://trendvid.net/ads.txt` — must be 200 with your `pub-` line.
5. View source: the `<ins class="adsbygoogle">` blocks must not have the `hidden` attribute. The code
   hides ad slots deliberately when there are no videos (error/empty state) — that is intended, not a
   bug: publishing on an empty page is a policy risk.
6. On a preview domain (`*.pages.dev`) blank ads are normal: AdSense is only authorised for
   `trendvid.net`.

## Playbook 3 — GA4 shows no traffic

1. Console: `typeof window.gtag` must be `"function"`. If not, `analytics.enabled` is false in
   `config.js`.
2. If `consentMode: true`, GA only collects after the CMP reports a decision —
   `window.__trendvidConsentUpdate(true)` for testing.
3. Check the network tab for `gtag/js?id=G-28Y2VHF39E`; a CSP or blocker will show as `blocked`.

## Playbook 4 — YouTube quota exceeded (503 / `quotaExceeded`)

1. Confirm in `wrangler tail` (`reason: "quotaExceeded"`).
2. Short term: responses should already be served from the stale cache with `x-trendvid-stale: 1`
   (verify the KV namespace is bound — `/diag` → `bindings.kvCache`).
3. Reduce burn: lower `GLOBAL_REGION_LIMIT` (for example 12 → 8), raise `CACHE_TTL` (600 → 1800), and
   keep `MOST_VIEWED_SOURCE=chart` (search costs 100 units per call instead of 1).
4. Longer term: request a quota increase in Google Cloud, or add a second API key and shard regions
   across keys.

## Playbook 5 — enable the Content-Security-Policy (after verifying)

1. Load the site with devtools open and watch for `[Report Only]` CSP violations on: homepage, modal
   playback, a doc page.
2. Confirm AdSense, GA4 and the YouTube iframe all work with report-only in place (nothing is blocked
   by definition, but the report tells you what *would* be blocked).
3. In `site/_headers`, delete the `Content-Security-Policy-Report-Only` line and uncomment the
   `Content-Security-Policy` line below it. Deploy. Re-test ads + analytics.
4. If something breaks, revert that one line — traffic and revenue are unaffected by the revert.

## Playbook 6 — a bad payload is cached

Symptoms: wrong/old videos for one region+category, or 500s for a key that looks valid.

1. `curl -sI "https://api.trendvid.net/videos?country=US"` → check `x-trendvid-cache`.
2. Purge: bump the prefix in `api/src/index.js` (`v3:` → `v4:`), redeploy. Every old key expires
   within `CACHE_STALE_TTL`.
3. In the Cloudflare dashboard you can also delete individual KV keys under *Workers KV*.

## Post-deploy checklist

See the checklist in `docs/DEPLOYMENT.md` §5 — run it after every production change; it takes two
minutes and covers revenue (ads, ads.txt), data (contract), SEO (canonical, sitemap) and UX (modal,
pagination).
