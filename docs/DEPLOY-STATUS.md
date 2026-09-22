# Deploy status & resume notes

**Status: BUILT and VERIFIED locally, NOT deployed.** Your live site (`trendvid.net`) and the
existing API Worker were never touched — nothing is broken by waiting, and there is no half-finished
state anywhere remote.

- **Resume point:** commit `781cfa1` on branch `main` (tagged `v3.0.0`).
- **Last verified:** 2026-09-23 on this machine (see evidence below).

## Verified state (evidence)

| Check | Command | Result |
| --- | --- | --- |
| Syntax | `npm run check` | 20/20 files parse cleanly |
| Offline tests | `npm test` | 55 passed, 0 failed (5 live tests skipped) |
| Live API contract | `TRENDVID_LIVE=1 node --test tests/live-contract.test.mjs` | 5/5 passed |
| Runtime smoke | `npm run serve` + requests | all pages/assets 200, 404 page works |
| Worker bundle | `npx wrangler@latest deploy --dry-run --config api/wrangler.toml` | ✅ 16.92 KiB (gzip 5.35 KiB), all vars/bindings parsed (wrangler 4.136.3) |
| Repository | `git log --oneline` | 4 commits on `main`, working tree clean, 63 files tracked |
| Secret scan | CI guard / local grep | 0 API keys committed |

## What is blocking the deploy (measured on this machine)

| Blocker | Detail | Fix |
| --- | --- | --- |
| No git remote | the repo exists only on disk | create a GitHub repo and add the remote (Route 2) |
| `gh` not installed | GitHub CLI absent | `winget install GitHub.cli` then `gh auth login` |
| `wrangler` not installed globally | not needed — `npx` works | — |
| No Cloudflare session | never logged in from here | `npx wrangler login` (browser approval) |
| No API tokens in env | `GITHUB_TOKEN`, `CLOUDFLARE_API_TOKEN` unset | prefer interactive logins over pasting tokens |
| Git identity is a placeholder | `TrendVid Dev <dev@trendvid.local>` | set your real name/email before pushing |
| GitHub credential | a stored credential for `https://github.com` **does** exist on this machine | a push may work without re-login, or Git Credential Manager prompts once |

## Exact commands (pick one route when we resume)

### Route A — Cloudflare direct (fastest to a live preview, no GitHub)

```bash
npx wrangler login                                              # opens YOUR browser; click Allow
npx wrangler secret put YOUTUBE_API_KEY --config api/wrangler.toml   # paste the key when prompted (never in chat)
npx wrangler kv namespace create TRENDING                       # optional but recommended
# paste the returned id into api/wrangler.toml and uncomment kv_namespaces
npx wrangler deploy --config api/wrangler.toml                  # the API
npx wrangler pages deploy site --project-name trendvid          # the site -> <project>.pages.dev preview
```

Then, in the Cloudflare dashboard (only you can do this): Pages → *Custom domains* → add
`trendvid.net`, and Workers → *Domains & Routes* → add `api.trendvid.net`.

### Route B — GitHub first, then Pages Git integration

```bash
git config user.name  "Your Name"
git config user.email "you@example.com"
git commit --amend --reset-author --no-edit        # fixes the placeholder identity on the tip commit
git remote add origin https://github.com/<you>/trendvid.git
git push -u origin main
```

Then: Cloudflare → Workers & Pages → Create → Pages → **Connect to Git** → build output directory
`site`, no build command. Every push to `main` becomes production; PRs become previews.

### Route C — both

Do Route A to get a verifiable preview URL today, then Route B to switch to Git-driven deploys.

## Owner-only items (cannot be done by an assistant)

1. **Affiliate link** — paste your Impact/VEED tracking link into `site/assets/js/config.js`
   (`offers.items.veed.url`). Until then the banner stays hidden by design, so no untagged clicks leak.
2. **Consent (CMP)** — AdSense → *Privacy & messaging* → publish the GDPR message, then set
   `analytics.consentMode: true` in `site/assets/js/config.js`.
3. **`ALLOWED_ORIGINS`** — after the first deploy, confirm the list in `api/wrangler.toml`
   (production + preview hostname + localhost).
4. **Preview noindex** — Cloudflare Configuration Rule adding `X-Robots-Tag: noindex` to the
   `*.pages.dev` preview host so staging is never indexed.
5. **`YOUTUBE_API_KEY`** — must be re-entered as a Worker secret (the old one was never recoverable);
   or create a fresh key in Google Cloud Console.

## When we resume

Say "resume the TrendVid deploy" and pick a route. Nothing else needs re-deriving — the code, tests,
docs and backups are all in place. If the repo or `.git` is ever lost, restore from a backup (below)
with `git clone trendvid-backup-<date>.bundle trendvid` and everything (including history) comes back.

## Backups created

- `D:\trendvid-backup-<date>.bundle` — full git history in one file (`git clone <file>` restores it).
- `D:\trendvid-backup-<date>.zip` — plain copy of the working tree for non-git restore.

## Live production note

`trendvid.net` still serves the old build and `api.trendvid.net` still runs the old Worker. The
rebuild's API is a fresh implementation of the verified contract, so it deploys alongside safely and
the cache starts empty under the `v3:` key prefix. Rollback after cutover is documented in
`docs/RUNBOOK.md`.
