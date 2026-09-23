# Deploy status & resume notes

**Status: ROUTES A + B DONE (preview live, repo pushed) — NOT cut over.** The rebuild runs on
Cloudflare under preview hostnames and the full history is on GitHub. Your live site (`trendvid.net`)
and the existing API (`api.trendvid.net`) were never touched — production still serves the old build.

- **Resume point:** tip of `main`, pushed to `origin/main` (pre-deploy snapshot remains tag `v3.0.0`).
- **Last verified:** 2026-09-23 on this machine, after deploy (evidence below).

## Deployed endpoints (2026-09-23)

| Piece | URL / ID | Notes |
| --- | --- | --- |
| Cloudflare account | `fae798109874b9f3ad50d23d15ad51d0` | "Ahmadgam249@gmail.com's Account"; wrangler logged in as `ahmadgam249@gmail.com`; pinned via `account_id` in `api/wrangler.toml` |
| Site (Pages project `trendvid`) | `https://trendvid-82q.pages.dev` | deployment `39f6f2cd`, branch `main`, 21 files + `_headers`/`_redirects` |
| API (Worker `trendvid-api`) | `https://trendvid-api.trendvids.workers.dev` | version `65262469-65b0-4731-b88b-c42515684348` |
| KV namespace `TRENDING` | `de49c8930de6453aab9608117a1ee26d` | bound in `api/wrangler.toml` |

> ⚠️ **Leftovers on the WRONG (old) account** `ec0ce1943f313c84cfdd06226d5f003c`
> (`vstudio24@outlook.com`, no longer authenticated): Pages project `trendvid` →
> `trendvid-ap3.pages.dev`, Worker `trendvid-api` → `trendvid-api.vstudio24.workers.dev`,
> KV `a51b451f…`. Harmless, but delete them from that dashboard when convenient so nobody
> confuses the two deployments. **Everything above this line is the real deployment.**

Redeploy (both non-interactive):

```bash
npx wrangler deploy --config api/wrangler.toml                            # API
npx wrangler pages deploy site --project-name trendvid --branch main     # site
```

## Verified state (evidence, post-deploy)

| Check | Command | Result |
| --- | --- | --- |
| Syntax | `npm run check` | 20/20 files parse cleanly |
| Offline tests | `npm test` | 55 passed, 0 failed (5 live tests skipped) |
| Live API contract | `TRENDVID_LIVE=1 node --test tests/live-contract.test.mjs` | 5/5 passed (against old prod API) |
| Worker `/diag` | `curl https://trendvid-api.trendvids.workers.dev/diag` | `ok:true`, `kvCache:true`, **`youtubeKey:false`**, TTLs 600/86400 |
| Bad params | `curl .../videos?type=bogus&country=XX&category=999` | 400 + JSON error (old API returned 500) |
| Categories w/o key | `curl .../categories` | 200, `source:"fallback", degraded:true` (designed degradation) |
| CORS | preflight from `https://trendvid-82q.pages.dev` | 204, `Access-Control-Allow-Origin` echoed (wildcard pattern works) |
| Pages routes | `/`, robots/sitemap/ads.txt, assets | all 200; unknown path → 404 (`404.html`) |
| Pretty URLs | `/about.html` etc. | **308 → `/about`** (Pages canonicalises `.html`), final 200 |
| Secret scan | CI guard / local grep | 0 API keys committed; no `AIza…` key anywhere on disk |

## What still blocks a fully working preview grid

| Blocker | Detail | Fix |
| --- | --- | --- |
| **`YOUTUBE_API_KEY` missing** | never recovered; `/diag` reports `youtubeKey:false`, so `/videos` errors and the grid shows the `api_error` state (by design) | **owner runs in a terminal:** `npx wrangler secret put YOUTUBE_API_KEY --config api/wrangler.toml`, then paste the key (never in chat, never commit it). Or create a fresh key in Google Cloud Console. |
| **Preview defaults to the OLD API** | `config.js` `apiBase` is `https://api.trendvid.net`; measured: the old API only allows origin `https://trendvid.net` (no `*.pages.dev`), so the preview gets CORS-blocked there | on the preview origin run `localStorage.setItem('trendvid_api_base','https://trendvid-api.trendvids.workers.dev')` and reload. The shipped CSP is report-only, so it reports but does not block (add the workers.dev host to `connect-src` in `site/_headers` if you want zero CSP reports). |

## Open items (owner-only; cannot be done by an assistant)

1. **`YOUTUBE_API_KEY`** — `wrangler secret put` (above); the only thing separating the preview from a full grid.
2. **Affiliate link** — paste your Impact/VEED tracking link into `site/assets/js/config.js`
   (`offers.items.veed.url`). Until then the banner stays hidden by design, so no untagged clicks leak.
3. **Consent (CMP)** — AdSense → *Privacy & messaging* → publish the GDPR message, then set
   `analytics.consentMode: true` in `site/assets/js/config.js`.
4. **`ALLOWED_ORIGINS`** — the shipped list covers production, `*.pages.dev` and localhost; confirm
   after the first custom-domain attach.
5. **Preview noindex** — Cloudflare Configuration Rule adding `X-Robots-Tag: noindex` to
   `trendvid-82q.pages.dev` so staging is never indexed.
6. **`.html` canonical vs Pages pretty URLs** — Pages 308s `/about.html` → `/about`; the sitemap and
   `<link rel=canonical>` use `.html` (matching the old build). Decide before attaching `trendvid.net`:
   switch canonicals + `sitemap.xml` to extensionless URLs (recommended) or accept the one-hop chain.

## Route B — GitHub: DONE (2026-09-23)

- Remote: `origin` → `https://github.com/ahmadqarmash/TrendVID.git` (public, default branch `main`).
- Identity: `ahmadqarmash <ahmadgam249@gmail.com>` (repo-local git config).
- Auth: GitHub CLI device flow → `gh` (installed `C:\Program Files\GitHub CLI`) logged in as
  **ahmadqarmash**, scopes `repo,workflow,gist,read:org`. The stored Git Credential Manager
  credential (OLD account `ahmadqar`) is neutralised **for this repo only** by repo-local config:
  `credential.helper` = `""` (reset) then `!gh auth git-credential` — on both the generic and
  `credential.https://github.com.helper` keys. Plain `git push` uses the new account.
- Pushed: `main` = tip commit + tag `v3.0.0`; branch tracks `origin/main`.

### GitHub Actions after the first push

| Workflow | Result | Note |
| --- | --- | --- |
| `CI` | ✅ success | secret scan + `npm run check` + `npm test` green on the runner |
| `Deploy API Worker` | ❌ failed (expected) | `wrangler deploy` aborted: `CLOUDFLARE_API_TOKEN` not set. **Owner step:** dashboard → *My Profile → Tokens* (or Workers API token) create a token with Workers Edit + Account Read → repo **Settings → Secrets and variables → Actions** → add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (`fae798109874b9f3ad50d23d15ad51d0`) → re-run the job. Only triggers on `api/**` changes. |

### Still to do (owner, dashboard)

1. Workers & Pages → `trendvid` → *Settings → Build & deployments → Connect to Git* → repo
   `ahmadqarmash/TrendVID` (build output directory `site`, no build command). After that, pushes to
   `main` deploy the site and PRs get preview URLs. Until then, site updates go through
   `npx wrangler pages deploy site --project-name trendvid --branch main`.
2. The two Actions secrets above.
3. `YOUTUBE_API_KEY` (see blockers) + the other open items.

## Cutover (only after the preview is approved)

1. Set the `YOUTUBE_API_KEY` secret; confirm `/diag` → `youtubeKey:true` and the preview grid fills.
2. Workers → `trendvid-api` → *Domains & Routes → Add custom domain* → `api.trendvid.net`; verify
   `curl https://api.trendvid.net/diag`.
3. Pages → `trendvid` → *Custom domains* → `trendvid.net` (`www` keeps its 301 to the apex).
4. Run the checklist in `docs/DEPLOYMENT.md` §5; submit `https://trendvid.net/sitemap.xml` in GSC.
5. Rollback: `docs/RUNBOOK.md` (Pages deployment rollback / `wrangler rollback`).

## Backups created (pre-deploy, still valid)

- `D:\trendvid-backup-2026-09-23.bundle` — full git history in one file; restore with
  `git clone D:\trendvid-backup-2026-09-23.bundle trendvid-restored`
- `D:\trendvid-backup-2026-09-23.zip` — plain copy of the working tree for non-git restore.

Both were re-created after the `v3.0.0` commit and verified (`git bundle verify`).
