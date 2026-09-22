# Deployment: GitHub + Cloudflare (Pages for the site, Worker for the API)

Two deployables, one repository:

| Piece | Platform | Trigger |
| --- | --- | --- |
| `site/` | Cloudflare **Pages** | Git integration: push to `main` = production, PRs = preview URLs |
| `api/` | Cloudflare **Worker** | `wrangler deploy` (workflow `Deploy API Worker`, or manually / via Workers Builds) |

The domain is already on Cloudflare, and `www.trendvid.net` already 301-redirects to the apex — keep
that behaviour.

## 1. Create the GitHub repository

```bash
cd d:/trendvid-FINAL-ALL-IN-ONE
git init
git add .
git commit -m "TrendVid 3.0: rebuild from the verified production contract"
git branch -M main
git remote add origin https://github.com/<you>/trendvid.git
git push -u origin main
```

`_reference/api-samples/` is gitignored (raw harvest data). `_reference/live/` is worth committing:
it is the only surviving copy of the previous production build.

## 2. Cloudflare Pages (static site)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the repo, production branch `main`.
3. **Framework preset: None. Build command: *(empty)*. Build output directory: `site`.**
4. Deploy → you get a `<project>.pages.dev` URL (this is the preview/staging host).
5. **Custom domains → Set up a domain → `trendvid.net`** (and `www` → redirect to apex).

Every push to `main` publishes to production, every PR gets its own preview URL, and rollback is one
click in *Deployments* (or `git revert`).

### Preview hygiene (important)

- `site/_headers` sends `X-Robots-Tag`-equivalent protections only for paths it can match; **add a
  Cloudflare Configuration Rule for the preview hostname** (`*.pages.dev` for the project) setting
  `X-Robots-Tag: noindex` so staging copies never get indexed as duplicates of production.
- Preview URLs are not in the API's `ALLOWED_ORIGINS` unless you include `https://*.pages.dev` (the
  shipped default does). Without it, previews load but the grid stays empty — a classic false alarm.

## 3. Cloudflare Worker (API)

```bash
npm i -g wrangler           # or use npx
wrangler login
wrangler secret put YOUTUBE_API_KEY --config api/wrangler.toml    # required
wrangler kv namespace create TRENDING                            # recommended (cache)
# paste the printed id into api/wrangler.toml and uncomment kv_namespaces
wrangler deploy --config api/wrangler.toml
```

Then bind the custom domain: **Workers → trendvid-api → Settings → Domains & Routes → Add custom
domain → `api.trendvid.net`**. Verify with:

```bash
curl -s https://api.trendvid.net/diag
curl -s "https://api.trendvid.net/videos?type=trending&country=US&category=10" | head -c 400
```

`/diag` should report `bindings.youtubeKey: true` and, once KV is bound, `bindings.kvCache: true`.

### Automated deploys (optional)

`.github/workflows/deploy-worker.yml` publishes the Worker on every push to `main` that touches
`api/`. Add two repository secrets first:

- `CLOUDFLARE_API_TOKEN` — token with *Workers Scripts: Edit* (and *Workers KV Storage: Edit* if you
  use the cache).
- `CLOUDFLARE_ACCOUNT_ID`

The YouTube key is **not** a GitHub secret: it lives in Cloudflare (`wrangler secret put`). CI even
fails the build if an `AIza...` key shows up in the repo.

## 4. Cutover from the old deployment

1. Deploy Pages to its `*.pages.dev` URL and the Worker to its `workers.dev` URL first.
2. Test on the preview: filters, both tabs, pagination, modal playback, offer banner, ads (AdSense
   may show blanks on a preview domain — that is normal and not a bug), `robots.txt`, `ads.txt`.
3. Point `api.trendvid.net` at the new Worker and confirm `curl https://api.trendvid.net/diag`.
4. Attach `trendvid.net` to the new Pages project. Cloudflare switches traffic atomically.
5. Keep the previous Pages deployment available until you are happy — rollback is a click.
6. Submit `https://trendvid.net/sitemap.xml` in Google Search Console.

## 5. Post-deploy verification checklist

- [ ] `https://trendvid.net/` returns 200 and the grid fills with 20 videos.
- [ ] `/robots.txt`, `/sitemap.xml` and `/ads.txt` all return 200 (they were 404 before).
- [ ] `/ads.txt` contains `google.com, pub-7235869092973329, DIRECT, f08c47fec0942fa0`.
- [ ] Country + category + tab changes update the list, the title and the canonical.
- [ ] Pagination: Previous disabled on page 1; Next disabled at the end of a country's list.
- [ ] Clicking a card opens the modal player; Escape closes it and restores focus.
- [ ] `window.TrendVid.state` exists in the console (debug hook).
- [ ] GA4 receives `page_view`, `select_content` and (after a click) `offer_click`.
- [ ] AdSense serves at least the in-feed unit on desktop.
- [ ] The browser console shows no CORS or CSP errors.
- [ ] `/diag` reports the expected TTLs and `mostViewedSource`.

## 6. Rollback

- **Site:** Cloudflare Pages → *Deployments* → previous deployment → *Rollback*. Or `git revert` +
  push.
- **API:** `git revert` + push (workflow redeploys), or `wrangler rollback --config api/wrangler.toml`.
- **Cache:** if a bad payload is cached, bump the cache prefix in `api/src/index.js`
  (`v3:` → `v4:`) and redeploy — old keys expire on their own.
