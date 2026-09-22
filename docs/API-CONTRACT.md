# TrendVid API contract

Base URL: `https://api.trendvid.net` (Worker source: `api/src/index.js`)

This document describes the contract the **live site relies on**. It was written from verified
responses of the previous deployment and is enforced by tests
(`tests/worker.test.mjs`, `tests/fixtures.test.mjs`, `tests/live-contract.test.mjs`).

## `GET /videos`

| Parameter | Required | Values | Notes |
| --- | --- | --- | --- |
| `type` | no | `trending` (default), `mostViewed` | anything else → `400` |
| `country` | no | `GLOBAL` (default) or ISO 3166-1 alpha-2 | anything else → `400` |
| `category` | no | numeric YouTube category id, `0` = all | non-numeric → `400` |
| `page` | no | `1..500` | used in **GLOBAL** mode only |
| `pageToken` | no | opaque token from a previous `nextPageToken` | used in **country** mode only |
| `pageSize` | no | `1..50` (default `20`) | |

### Response — `GLOBAL` mode (aggregated across regions)

```json
{
  "mode": "GLOBAL",
  "type": "trending",
  "category": "0",
  "page": 1,
  "pageSize": 20,
  "totalApprox": 847,
  "regionsQueried": 12,
  "regionsOk": 12,
  "items": [ /* see item shape */ ]
}
```

Ranking: a video scores higher the more regional charts it appears in; ties break on view count.
`page`/`pageSize`/`totalApprox` make offset paging possible because an aggregated list has no
YouTube token.

### Response — country mode

```json
{
  "mode": "COUNTRY",
  "country": "US",
  "type": "trending",
  "category": "10",
  "nextPageToken": "CAUQAA",
  "prevPageToken": "CAEQAA",
  "items": [ /* see item shape */ ]
}
```

Tokens are YouTube's own, passed through unchanged. The front-end keeps its own token stack so
"Previous" works predictably.

### Item shape (both modes)

```json
{
  "id": "3WjSPuuayjs",
  "title": "Satellite",
  "channelTitle": "Kevin Gates - Topic",
  "publishedAt": "2026-09-21T15:00:35Z",
  "viewCount": "53730",
  "thumbnails": {
    "default":  { "url": "https://i.ytimg.com/vi/3WjSPuuayjs/default.jpg", "width": 120, "height": 90 },
    "medium":   { "url": ".../mqdefault.jpg", "width": 320, "height": 180 },
    "high":     { "url": ".../hqdefault.jpg", "width": 480, "height": 360 },
    "standard": { "url": ".../sddefault.jpg", "width": 640, "height": 480 },
    "maxres":   { "url": ".../maxresdefault.jpg", "width": 1280, "height": 720 }
  }
}
```

**Important:** `viewCount` is a **string**, and all five thumbnail sizes are always present (missing
sizes are derived from the video id). Consumers must use `thumbnails.high.url` (or `maxres`) rather
than a `thumbnail` field — that mismatch is what emptied the previous production grid.

## `GET /categories?country=XX`

```json
{ "country": "US", "source": "youtube", "categories": [{ "id": "10", "title": "Music" }] }
```

- `source`: `youtube` | `cache` | `fallback`
- This endpoint never returns 5xx: if YouTube fails it answers `200` with the built-in category list
  and `"degraded": true` (the old API returned a 500 here).

## `GET /diag`

Health + configuration introspection: version, whether the KV cache and YouTube key are bound, the
CORS patterns, cache TTLs and the `mostViewed` source. Safe to poll from uptime monitors.

## `GET /`

JSON description of the API and its endpoints.

## Errors

```json
{ "error": { "status": 400, "message": "Invalid type \"bogus\". Use trending or mostViewed.", "reason": "quotaExceeded" } }
```

| Status | Meaning |
| --- | --- |
| `400` | invalid parameters (validated before any upstream call) |
| `404` | unknown endpoint |
| `405` | method other than `GET`/`HEAD` |
| `429`/`503` | YouTube quota or upstream rate limiting |
| `502` | upstream failure with no cached payload to fall back on |
| `500` | server misconfiguration (for example a missing `YOUTUBE_API_KEY`) |

## Caching & resilience

- KV key layout: `v3:videos:<type>:<country>:<category>:<page|token>:<pageSize>`, plus
  `v3:categories:<country>`.
- `CACHE_TTL` (default 600s) is the freshness window; entries live for `CACHE_STALE_TTL`
  (default 86400s) so a **stale-while-error** response can still be served. That response carries
  `"stale": true` and an `x-trendvid-stale: 1` header.
- `x-trendvid-cache: HIT | MISS | STALE` tells you where a response came from.
- Responses also send `cache-control: public, max-age=<min(ttl,300)>` for Cloudflare's edge cache.

## CORS

`ALLOWED_ORIGINS` (comma-separated) supports `*` inside a host, so preview deployments work:

```
https://trendvid.net,https://www.trendvid.net,https://*.pages.dev,http://localhost:8788,http://localhost:5173
```

Only allow-listed origins get an `access-control-allow-origin` header; everything else gets none
(the browser blocks it). `vary: Origin` is always set.

## Environment variables

| Name | Default | Purpose |
| --- | --- | --- |
| `YOUTUBE_API_KEY` | — | **secret**, required for live data (`wrangler secret put`) |
| `TRENDING` | — | KV namespace binding for the cache (optional but recommended) |
| `ALLOWED_ORIGINS` | see above | CORS allow-list |
| `REGIONS` | 21 countries | regions sampled for `country=GLOBAL` |
| `GLOBAL_REGION_LIMIT` | `12` | how many of those regions are queried per GLOBAL request |
| `CACHE_TTL` | `600` | fresh window (seconds) |
| `CACHE_STALE_TTL` | `86400` | stale window used on upstream failure |
| `MOST_VIEWED_SOURCE` | `chart` | `chart` = 1 quota unit, `search` = order=viewCount (100 units) |
| `DEFAULT_COUNTRY` | `GLOBAL` | used when `country` is omitted |

### Quota maths (10,000 units/day by default)

- `videos.list` = 1 unit → a country page is 1 unit; a `GLOBAL` page is `GLOBAL_REGION_LIMIT` units.
- `videoCategories.list` = 1 unit, cached 24h.
- `search.list` = 100 units → keep `MOST_VIEWED_SOURCE=chart` unless you raise the quota.
- With KV caching enabled, a warm cache costs **zero** units.
