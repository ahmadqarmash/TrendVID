/**
 * All UI strings. Keep both languages in sync (tests/i18n.test.mjs enforces key parity).
 * Values may be functions - call t(key, ...args) and they are invoked for you.
 */
export const SUPPORTED_LANGS = ['en', 'ar'];

export const I18N = {
  en: {
    // controls
    country: 'Country',
    category: 'Category',
    language: 'Language',
    trending: 'Trending',
    mostViewed: 'Most Viewed',
    all: 'All categories',
    // pager + status
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    loading: 'Loading…',
    showing: (n) => `Showing ${n} video${n === 1 ? '' : 's'}`,
    noResults: 'No results for this combination yet. Try another country or category.',
    error: 'Something went wrong while loading videos.',
    errorNetwork: 'Could not reach the video service. Check your connection and try again.',
    retry: 'Try again',
    // cards + modal
    views: 'views',
    play: 'Play video',
    watchOnYouTube: 'Watch on YouTube',
    close: 'Close',
    untitled: 'Untitled video',
    // offer + ads
    adLabel: 'Advertisement',
    offerSponsored: 'Sponsored',
    // page copy
    heroTitle: (country) => `What ${country} is watching right now`,
    heroSubtitle: 'Fresh trending and most-viewed YouTube videos, updated regularly.',
    heroCTA: 'Explore trends',
    seoTitle: (mode, country) => `${mode} YouTube Videos in ${country} | TrendVid`,
    seoLead: (mode, country, category) =>
      `${mode} YouTube videos in ${country}${category ? ` · ${category}` : ''}. ` +
      'Browse the list below and play any video without leaving the page. Data comes from the YouTube API and is refreshed continuously.',
    footerDisclaimer:
      'All videos are embedded from YouTube and remain the property of their respective owners.',
    builtWith: 'Data provided by the YouTube API.',
  },

  ar: {
    // controls
    country: 'الدولة',
    category: 'الفئة',
    language: 'اللغة',
    trending: 'الرائج',
    mostViewed: 'الأكثر مشاهدة',
    all: 'كل الفئات',
    // pager + status
    previous: 'السابق',
    next: 'التالي',
    page: 'صفحة',
    loading: 'جاري التحميل…',
    showing: (n) => `عرض ${n} فيديو`,
    noResults: 'لا توجد نتائج لهذا الاختيار حتى الآن. جرّب دولة أو فئة أخرى.',
    error: 'حدث خطأ أثناء تحميل الفيديوهات.',
    errorNetwork: 'تعذّر الوصول إلى خدمة الفيديوهات. تحقّق من اتصالك وأعد المحاولة.',
    retry: 'إعادة المحاولة',
    // cards + modal
    views: 'مشاهدة',
    play: 'تشغيل الفيديو',
    watchOnYouTube: 'شاهده على يوتيوب',
    close: 'إغلاق',
    untitled: 'فيديو بدون عنوان',
    // offer + ads
    adLabel: 'إعلان',
    offerSponsored: 'إعلان مدفوع',
    // page copy
    heroTitle: (country) => `ماذا يشاهد الجمهور في ${country} الآن`,
    heroSubtitle: 'أحدث الفيديوهات الرائجة والأكثر مشاهدة على يوتيوب، يتم تحديثها باستمرار.',
    heroCTA: 'استكشف الرائج',
    seoTitle: (mode, country) => `${mode} على يوتيوب في ${country} | TrendVid`,
    seoLead: (mode, country, category) =>
      `${mode} على يوتيوب في ${country}${category ? ` · ${category}` : ''}. ` +
      'استعرض القائمة أدناه وشغّل أي فيديو دون مغادرة الصفحة. البيانات مصدرها YouTube API ويتم تحديثها باستمرار.',
    footerDisclaimer: 'جميع الفيديوهات مضمّنة من يوتيوب وهي ملك لأصحابها.',
    builtWith: 'البيانات مقدَّمة من YouTube API.',
  },
};

/** Normalize anything into a supported language code. */
export function normalizeLang(lang) {
  return SUPPORTED_LANGS.includes(lang) ? lang : 'en';
}

/**
 * Build a translator. Falls back to English, then to the key itself, so a missing
 * string can never crash the UI (it just shows the key).
 */
export function createTranslator(lang) {
  const primary = I18N[normalizeLang(lang)];
  return function t(key, ...args) {
    const raw = primary[key] ?? I18N.en[key] ?? key;
    return typeof raw === 'function' ? raw(...args) : raw;
  };
}

/** Direction for a language. */
export function dirFor(lang) {
  return normalizeLang(lang) === 'ar' ? 'rtl' : 'ltr';
}
