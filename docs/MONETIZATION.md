# Monetization guide

Current revenue stack (all verified against the live site):

| Channel | Status in this rebuild |
| --- | --- |
| Google AdSense | wired: client `ca-pub-7235869092973329`, slot `4003830709`, 3 placements (in-feed + 2 bottom) + 1 unit on each doc page |
| GA4 | wired: `G-28Y2VHF39E`, with SPA `page_view` plus new `select_content` / `offer_click` / `api_error` events |
| Impact.com affiliate | **verification tag kept, link missing** — see below; this is the biggest leak |

## 1. Fix the affiliate leak (do this first)

The old banner said *"Translate trending videos instantly → Try it free"* but linked to plain
`https://veed.io` with no tracking parameter, so every click was unpaid traffic. VEED's affiliate
program (run through **Impact.com** — the same network whose verification tag is already on the site)
pays 20–50% **recurring** commission.

1. Get your tracking link from the Impact dashboard.
2. Paste it into `site/assets/js/config.js`:

```js
items: {
  veed: {
    url: 'https://veed.io/?via=YOURID',   // <- replace REPLACE_WITH_IMPACT_LINK
    ...
  }
}
```

3. Deploy. The banner stays hidden while the URL contains `REPLACE_WITH` (enforced by a test), so you
   can never accidentally donate clicks again.
4. Every render appends a `subId1` such as `trendvid_sa_ar` (country + language), and each click fires
   an `offer_click` GA4 event. Use the subId to see which market converts.

### Adding more offers (geo-splitting)

```js
offers.defaultOfferId: 'vpn',
offers.byCountry: { SA: 'translate', AE: 'translate', US: 'vpn', GB: 'vpn' },
offers.items: { translate: {...}, vpn: {...} },
```

Offers that match intent convert best here: translate/subtitle tools, VPN or unblock-region tools,
video downloaders, streaming hardware. Keep questionable downloader offers off the same pages that
carry AdSense.

## 2. `ads.txt`

`site/ads.txt` now exists (it 404'd before) with the line that authorises Google as a direct seller:

```
google.com, pub-7235869092973329, DIRECT, f08c47fec0942fa0
```

Without it, buyers that only bid on authorised sellers skip your inventory and AdSense reports
"earnings at risk". Verify after deploy: `curl -s https://trendvid.net/ads.txt`.

## 3. Consent (EEA/UK) — required, and free to do

The old site loaded AdSense with **no CMP**, which limits personalised ad revenue and creates policy
risk for EEA/UK visitors.

1. AdSense → **Privacy & messaging → GDPR message**: create and publish the message. It is
   Google-certified, integrates with Consent Mode v2 automatically, and requires no code from us.
2. Then flip the switch in `site/assets/js/config.js`:

```js
analytics: { id: 'G-28Y2VHF39E', enabled: true, consentMode: true }
```

With `consentMode: true` the site pushes `gtag('consent','default', …denied)` before GA4 loads and
waits for the CMP. Your banner (or Google's) can report a decision with:

```js
window.__trendvidConsentUpdate(true);  // or false on refusal
```

Until step 2, leave it `false`: that keeps today's behaviour (ads and analytics load immediately)
rather than silently switching everything off.

## 4. Ad placements and policy

- **In-feed** unit sits between the first and second grid rows (`CONFIG.adsense.inFeed`,
  `CONFIG.inFeedAfter`) — this is the best-performing slot on browse-heavy pages.
- **Two bottom** units mirror the old layout.
- Each placement has a visible **"Advertisement"** label (`adLabel`) and clear spacing, and the units
  are **hidden whenever there is no content** (error or empty state). That avoids the two classic
  invalid-traffic traps: unlabelled in-feed ads that look like content, and ads on empty pages.
- Doc pages (about/privacy/terms) each carry one labelled unit — previously they had **zero** ads and
  zero analytics despite being indexable.

**Non-negotiables:** never buy traffic, never use pop-under or forced-click farms, never incentivise
an affiliate conversion, never place an ad where a click can be accidental. AdSense bans are
permanent, and affiliate networks claw back commission for incentivised and bot traffic.

## 5. Measurement

| Event | Fired when | Useful for |
| --- | --- | --- |
| `page_view` | every filter/tab/language change | which markets browse |
| `select_content` | a video is opened | engagement vs. bounce |
| `offer_click` | the affiliate banner is clicked | offer CTR per country/language |
| `api_error` | a fetch fails | catching contract/outage problems early |

Affiliate conversions themselves are reported by Impact; join them on `subId1` to see revenue per
market.

## 6. Ranked levers (highest impact first)

1. **Wire the affiliate link** — pure lost revenue today.
2. **ads.txt + CMP** — small config, real RPM/consent effect.
3. **Geo-split offers** — the biggest lever for mixed-tier traffic, since the site already knows the
   visitor's country (`detectCountry()` from Cloudflare's trace endpoint).
4. **In-feed ad placement** — already implemented; watch RPM in AdSense for a week.
5. **Own the audience** — a Telegram channel or email list ("top 10 trending in your country, daily")
   monetises far better than display and survives ranking changes.
6. **Traffic, not more ads** — see `docs/SEO-PLAN.md`; at ~100k pageviews/month the mix above is worth
   roughly $100–$400 from ads, plus affiliate. Adding more ad units past this point hurts more than it
   earns.
