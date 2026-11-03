/**
 * TrendVid 4 - central configuration.
 * Everything the owner may need to change lives here. Values are public (they end up in HTML),
 * so never put secrets in this file - the YouTube key is a Worker secret.
 */

export const SITE = {
  name: 'TrendVid',
  url: 'https://trendvid.net', // overridden by the SITE_URL var when set
  contactEmail: 'ahmadgam249@gmail.com',
  defaultLang: 'ar',
  langs: ['ar', 'en'],
  /** Optional community links - leave '' to hide. */
  telegramUrl: '',
};

/**
 * Google AdSense + GA4.
 * Both confirmed as TrendVid's own by the owner (2026-11-03): AdSense pub-7235869092973329, and
 * GA4 G-28Y2VHF39E = stream "trendvid" (https://trendvid.net) in Analytics account 377953657.
 * Ads are only ever rendered on pages without YouTube data (see `adsAllowed` in src/views/layout.js).
 */
export const ADS = {
  enabled: true,
  client: 'ca-pub-7235869092973329',
  slot: '4003830709',
};

export const ANALYTICS = {
  enabled: true,
  id: 'G-28Y2VHF39E',
  /** Turn on after a Google-certified CMP is published in AdSense (Privacy & messaging). */
  consentMode: false,
};

/**
 * Affiliate programs for creators.
 * A program is shown only once `url` is a real tracking link: anything containing REPLACE_WITH
 * stays hidden so no untagged (unpaid) clicks are given away.
 * Affiliate links never appear on pages that show YouTube data (YouTube API policy III.G.1.d).
 */
export const AFFILIATES = [
  {
    id: 'vidiq',
    name: 'vidIQ',
    url: 'https://vidiq.com/?ref=REPLACE_WITH_YOUR_ID',
    pitch: {
      ar: 'أفكار فيديو وكلمات مفتاحية وتحليل للمنافسين.',
      en: 'Video ideas, keyword research and competitor insights.',
    },
    fits: ['title-checker', 'description-checker', 'earnings-calculator'],
  },
  {
    id: 'tubebuddy',
    name: 'TubeBuddy',
    url: 'https://www.tubebuddy.com/REPLACE_WITH_YOUR_ID',
    pitch: {
      ar: 'اختبار العناوين والصور المصغّرة وأدوات تحسين الظهور.',
      en: 'A/B tests for titles and thumbnails, plus SEO helpers.',
    },
    fits: ['title-checker', 'thumbnail-checker'],
  },
  {
    id: 'epidemic',
    name: 'Epidemic Sound',
    url: 'https://www.epidemicsound.com/REPLACE_WITH_YOUR_ID',
    pitch: {
      ar: 'موسيقى ومؤثرات صوتية مرخّصة لقناتك دون مطالبات حقوق.',
      en: 'Licensed music and sound effects without copyright claims.',
    },
    fits: ['earnings-calculator', 'description-checker'],
  },
  {
    id: 'veed',
    name: 'VEED',
    url: 'https://veed.io/?via=REPLACE_WITH_YOUR_ID',
    pitch: {
      ar: 'مونتاج وترجمة تلقائية للفيديو من المتصفح.',
      en: 'Browser-based editing and automatic subtitles.',
    },
    fits: ['thumbnail-checker', 'description-checker'],
  },
  {
    id: 'descript',
    name: 'Descript',
    url: 'https://www.descript.com/REPLACE_WITH_YOUR_ID',
    pitch: {
      ar: 'حرّر الفيديو كما تحرّر نصًا مكتوبًا.',
      en: 'Edit video by editing the transcript.',
    },
    fits: ['description-checker', 'title-checker'],
  },
];

/** Countries with a trending page. Order = order in the picker. Arab markets first. */
export const COUNTRIES = [
  { code: 'SA', ar: 'السعودية', en: 'Saudi Arabia' },
  { code: 'AE', ar: 'الإمارات', en: 'United Arab Emirates' },
  { code: 'EG', ar: 'مصر', en: 'Egypt' },
  { code: 'JO', ar: 'الأردن', en: 'Jordan' },
  { code: 'KW', ar: 'الكويت', en: 'Kuwait' },
  { code: 'QA', ar: 'قطر', en: 'Qatar' },
  { code: 'BH', ar: 'البحرين', en: 'Bahrain' },
  { code: 'OM', ar: 'عُمان', en: 'Oman' },
  { code: 'IQ', ar: 'العراق', en: 'Iraq' },
  { code: 'LB', ar: 'لبنان', en: 'Lebanon' },
  { code: 'MA', ar: 'المغرب', en: 'Morocco' },
  { code: 'DZ', ar: 'الجزائر', en: 'Algeria' },
  { code: 'TN', ar: 'تونس', en: 'Tunisia' },
  { code: 'LY', ar: 'ليبيا', en: 'Libya' },
  { code: 'YE', ar: 'اليمن', en: 'Yemen' },
  { code: 'US', ar: 'الولايات المتحدة', en: 'United States' },
  { code: 'GB', ar: 'المملكة المتحدة', en: 'United Kingdom' },
  { code: 'CA', ar: 'كندا', en: 'Canada' },
  { code: 'DE', ar: 'ألمانيا', en: 'Germany' },
  { code: 'FR', ar: 'فرنسا', en: 'France' },
  { code: 'TR', ar: 'تركيا', en: 'Türkiye' },
  { code: 'IN', ar: 'الهند', en: 'India' },
  { code: 'ES', ar: 'إسبانيا', en: 'Spain' },
  { code: 'IT', ar: 'إيطاليا', en: 'Italy' },
  { code: 'NL', ar: 'هولندا', en: 'Netherlands' },
  { code: 'BR', ar: 'البرازيل', en: 'Brazil' },
  { code: 'MX', ar: 'المكسيك', en: 'Mexico' },
  { code: 'ID', ar: 'إندونيسيا', en: 'Indonesia' },
  { code: 'PK', ar: 'باكستان', en: 'Pakistan' },
  { code: 'NG', ar: 'نيجيريا', en: 'Nigeria' },
  { code: 'AU', ar: 'أستراليا', en: 'Australia' },
  { code: 'JP', ar: 'اليابان', en: 'Japan' },
  { code: 'KR', ar: 'كوريا الجنوبية', en: 'South Korea' },
];

/**
 * Country shown when the visitor's own country has no trending page (or is unknown).
 * The cron refreshes every country above, one YouTube call each: keep the list under ~45 so a run
 * stays inside the Workers Free plan's 50 external subrequests per invocation.
 */
export const FALLBACK_COUNTRY = { ar: 'SA', en: 'US' };

/** Visitors located in these countries (Cloudflare IP geolocation) get HTTP 451 instead of the site. */
export const BLOCKED_COUNTRIES = ['IL'];

/** Cookie that remembers the country a visitor picked (overrides IP detection). */
export const COUNTRY_COOKIE = 'tv_country';

/** YouTube video categories offered as filters (ids are YouTube's). */
export const CATEGORIES = [
  { id: '10', slug: 'music', ar: 'موسيقى', en: 'Music' },
  { id: '20', slug: 'gaming', ar: 'ألعاب', en: 'Gaming' },
  { id: '24', slug: 'entertainment', ar: 'ترفيه', en: 'Entertainment' },
  { id: '17', slug: 'sports', ar: 'رياضة', en: 'Sports' },
  { id: '23', slug: 'comedy', ar: 'كوميديا', en: 'Comedy' },
  { id: '25', slug: 'news', ar: 'أخبار وسياسة', en: 'News & Politics' },
  { id: '26', slug: 'howto', ar: 'نصائح وأسلوب حياة', en: 'Howto & Style' },
  { id: '27', slug: 'education', ar: 'تعليم', en: 'Education' },
  { id: '28', slug: 'science', ar: 'علوم وتقنية', en: 'Science & Technology' },
  { id: '1', slug: 'film', ar: 'أفلام ورسوم متحركة', en: 'Film & Animation' },
];

export const TRENDING = {
  /** Videos per chart (YouTube max is 50). */
  pageSize: 50,
  /** Fresh window for on-demand (category) charts. */
  cacheTtlSeconds: 2 * 3600,
  /**
   * KV expiry for every snapshot. YouTube API policy III.E.4 allows at most 30 days;
   * we keep a day so a failed refresh still has something to show.
   */
  maxAgeSeconds: 26 * 3600,
};

export function countryByCode(code) {
  const upper = String(code || '').toUpperCase();
  return COUNTRIES.find((c) => c.code === upper) || null;
}

export function categoryBySlug(slug) {
  return CATEGORIES.find((c) => c.slug === String(slug).toLowerCase()) || null;
}

const PLACEHOLDER_RE = /REPLACE_WITH|YOUR_?ID|example\.com/i;

export function isPlaceholderUrl(url) {
  return !url || PLACEHOLDER_RE.test(String(url));
}

/** Affiliate programs with a real tracking link, optionally only those that fit a tool. */
export function liveAffiliates(toolSlug = null) {
  return AFFILIATES.filter((a) => !isPlaceholderUrl(a.url) && (!toolSlug || a.fits.includes(toolSlug)));
}
