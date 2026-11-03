# Launch checklist (owner)

Work top to bottom. Nothing here touches the live `trendvid.net` until step 6.

## 1. Confirm the Google accounts (before any deploy)

- AdSense `ca-pub-7235869092973329` (slot `4003830709`) — ✅ confirmed as TrendVid's own (2026-11-03).
  The `pub-` number in `public/ads.txt` must keep matching `ADS.client` in `src/config.js`.
- GA4 `G-28Y2VHF39E` — ✅ confirmed (2026-11-03): web stream "trendvid" for https://trendvid.net,
  Analytics account `trendvid.net` (377953657), property 516734479.

## 2. Sign up for affiliate programs

For each program in `AFFILIATES` (`src/config.js`): apply, get your tracking link, paste it into
`url`. Until then the program stays hidden (any URL containing `REPLACE_WITH` is never shown).
Remove programs you do not join.

## 3. Deploy to the test address

```bash
npx wrangler whoami                       # must show account fae79810… (ahmadgam249@gmail.com)
npx wrangler secret put YOUTUBE_API_KEY   # once; the new Worker "trendvid-site" needs its own copy
npm run verify
npm run deploy
```

You get `https://trendvid-site.<subdomain>.workers.dev`. It is automatically `noindex`.
Check `/api/health` → `youtubeKey: true, kv: true`, then open a trending page; the first visit
fills it, after that the cron refreshes all countries every 2 hours.

## 4. Review on the test address

- Every tool in Arabic and English, on a phone.
- Trending pages: play a video, switch category and country.
- Ads will be blank on workers.dev (AdSense only serves on approved domains) — that is expected.

## 5. Write the first guides

AdSense approval and Google rankings need real content. Aim for 8–10 guides before launch
(see `content/guides/README.md`). Empty guide sections are `noindex` until the first guide ships.

## 6. Go live on trendvid.net

1. Cloudflare → Workers & Pages → `trendvid-site` → Settings → Domains & Routes → add
   `trendvid.net` and `www.trendvid.net` as custom domains. This replaces the old site.
2. Check `https://trendvid.net/robots.txt` shows `Allow: /` and the sitemap line.
3. Google Search Console: submit `https://trendvid.net/sitemap.xml`.
4. AdSense → Sites: make sure `trendvid.net` is approved; Privacy & messaging → publish the GDPR
   message, then set `ANALYTICS.consentMode: true` in `src/config.js` and redeploy.
5. After a week with no CSP reports breaking ads/analytics, switch the header in `src/worker.js`
   from `content-security-policy-report-only` to `content-security-policy`.

Old v3 URLs (`/about.html`, `/privacy-policy.html`, …) redirect to the new pages automatically.

## Rollback

`npx wrangler rollback` (previous Worker version), or remove the custom domain to put the old
site back. v3 is preserved on git tag `v3.1.0`.
