# Roadmap: how TrendVid makes money

Saved 2026-11-03. Trending pages (including the home page) can never carry ads or affiliate links
(YouTube API policy III.G.1.d), so revenue comes from pages we own: tools, guides and offers.

## Where we stopped

- Branch `v4` (PR #1, not merged) is deployed to the test address
  https://trendvid-site.trendvids.workers.dev with live data. `trendvid.net` still serves the old site.
- Confirmed: AdSense `pub-7235869092973329`, GA4 `G-28Y2VHF39E`, YouTube API key (Worker secret).
- Launch steps: `docs/LAUNCH.md`.

## Plan, highest impact first

1. **Guides (owner's team)** — 8–10 before applying to AdSense, then 2–3 a week. Target Arabic searches:
   كيف تربح من يوتيوب · شروط تفعيل الربح في يوتيوب · كم يدفع يوتيوب لكل 1000 مشاهدة ·
   أفضل وقت لنشر فيديو على يوتيوب. Each guide links to a matching tool. Some English guides too
   (English traffic pays more per view).
2. **Affiliate sign-ups (owner)** — vidIQ, TubeBuddy, Epidemic Sound, VEED, Descript; Amazon Associates
   (amazon.sa / amazon.ae / amazon.eg) for creator gear; hosting and course programs. Paste links into
   `AFFILIATES` in `src/config.js`.
3. **More tools (build)** — no YouTube data on the page: Shorts / TikTok / Instagram earnings
   calculators, hashtag formatter, channel name ideas, upload-time planner. Later: AI Arabic
   title/description generator (Claude API) as a paid feature.
4. **Direct revenue (build)** — "Advertise with us" page (sponsored spots on tool/guide pages only),
   paid channel review, thumbnail/editing services via freelancers.
5. **Owned audience** — Telegram channel + email list with creator tips and new tools
   (no sponsorships on posts containing YouTube trending data).
6. **Ads growth** — AdSense now; at ~10k–50k monthly visits evaluate Ezoic / Mediavine Journey
   (check their current requirements first).

Rough illustration, not a forecast: ~100k monthly views on tool/guide pages ≈ $200–500/month from
ads alone, depending on audience country; affiliates and direct services can add as much or more.

## Open choices for the next session

- What to build first: new tools, the gear-guide template with Amazon links, or the
  "Advertise with us" + services pages.
- New social-share image (`public/assets/img/og.png` still has the old branding).
