/**
 * Interface strings. Both languages must have the same keys (tests/i18n.test.mjs enforces it).
 * Values may be functions: t('key', ...args).
 */

export const STRINGS = {
  ar: {
    tagline: 'أدوات وأدلة مجانية لصنّاع المحتوى على يوتيوب',
    navTools: 'الأدوات',
    navGuides: 'الأدلة',
    navTrending: 'الرائج',
    switchLang: 'English',
    switchLangLabel: 'View this page in English',
    themeToggle: 'تبديل الوضع الليلي',
    skipToContent: 'انتقل إلى المحتوى',
    menu: 'القائمة',

    homeTitle: 'TrendVid — الفيديوهات الرائجة على يوتيوب الآن في بلدك',
    homeDescription: 'شاهد الفيديوهات الرائجة على يوتيوب الآن في السعودية ومصر والإمارات وكل الدول العربية والعالم، تُحدَّث كل ساعتين، مع أدوات مجانية لصنّاع المحتوى.',
    homeGuidesTitle: 'أحدث الأدلة',
    allTools: 'كل الأدوات',
    allGuides: 'كل الأدلة',

    toolsTitle: 'أدوات مجانية لصنّاع محتوى يوتيوب',
    toolsDescription: 'حاسبة أرباح يوتيوب، فاحص العنوان، فاحص الوصف والفصول، وفاحص الصورة المصغّرة — مجانًا وبالعربية.',
    toolsLead: 'كل الأدوات تعمل داخل متصفحك. لا نحتاج حسابك ولا نرفع ملفاتك.',
    openTool: 'افتح الأداة',
    howItWorks: 'طريقة الاستخدام',
    faq: 'أسئلة شائعة',
    relatedTools: 'أدوات أخرى',
    privacyNoteTool: 'تعمل هذه الأداة بالكامل في متصفحك؛ لا يُرسَل شيء إلى خوادمنا.',

    guidesTitle: 'أدلة يوتيوب العملية',
    guidesDescription: 'أدلة عملية بالعربية لنمو قناتك على يوتيوب: الأفكار، العناوين، الصور المصغّرة، والربح.',
    guidesLead: 'شروحات مكتوبة بخبرة حقيقية، خطوة بخطوة.',
    guidesEmpty: 'نعمل على أول الأدلة الآن. عُد قريبًا، وجرّب الأدوات في الأثناء.',
    readGuide: 'اقرأ الدليل',
    minutesRead: (n) => `${n} دقائق قراءة`,
    updatedOn: (d) => `آخر تحديث: ${d}`,
    publishedOn: (d) => `نُشر في ${d}`,
    byAuthor: (a) => `بقلم ${a}`,
    tableOfContents: 'في هذا الدليل',
    relatedGuides: 'أدلة ذات صلة',

    countryLabel: 'البلد',
    categoryLabel: 'الفئة',
    show: 'عرض',
    detectedByLocation: 'حسب موقعك',
    refreshEvery: 'تُحدَّث كل ساعتين',
    fallbackNotice: (country) => `قائمة يوتيوب الرائجة غير متوفرة لبلدك، لذا نعرض ${country}. يمكنك اختيار بلد آخر.`,
    trendingCountryTitle: (country) => `الرائج على يوتيوب في ${country}`,
    trendingCountryCategoryTitle: (country, category) => `${category}: الرائج على يوتيوب في ${country}`,
    trendingCountryDescription: (country) => `أكثر الفيديوهات رواجًا على يوتيوب في ${country} الآن، بترتيب يوتيوب نفسه. تُحدَّث القائمة كل ساعتين.`,
    allCategories: 'الكل',
    updatedAgo: (when) => `آخر تحديث ${when}`,
    staleNotice: 'تعذّر التحديث مؤخرًا؛ نعرض آخر نسخة متاحة.',
    trendingEmpty: 'لا تتوفر قائمة لهذا الاختيار الآن. جرّب فئة أو بلدًا آخر.',
    views: (n) => `${n} مشاهدة`,
    play: 'تشغيل',
    watchOnYouTube: 'شاهد على يوتيوب',
    close: 'إغلاق',
    sourceYouTube: 'المصدر: قائمة يوتيوب الرائجة (YouTube Data API). الترتيب وعدد المشاهدات من يوتيوب.',
    creatorCtaTitle: 'تصنع فيديوهات؟',
    creatorCtaText: 'افحص عنوانك وصورتك المصغّرة قبل النشر، واحسب أرباحك المتوقعة.',
    pickCountry: 'اختر بلدًا',

    recommendedTitle: 'أدوات نستخدمها وننصح بها',
    affiliateDisclosure: 'بعض هذه الروابط روابط تسويق بالعمولة: قد نحصل على عمولة إن اشتركت، دون أي تكلفة إضافية عليك.',
    visit: 'زيارة',
    adLabel: 'إعلان',

    footerAbout: 'من نحن',
    footerPrivacy: 'سياسة الخصوصية',
    footerTerms: 'شروط الاستخدام',
    footerContact: 'تواصل معنا',
    footerDisclaimer: 'TrendVid موقع مستقل وغير تابع لـ YouTube أو Google. YouTube علامة تجارية مملوكة لشركة Google LLC.',
    joinTelegram: 'تابعنا على تيليجرام',

    notFoundTitle: 'الصفحة غير موجودة',
    notFoundText: 'ربما نُقلت هذه الصفحة أو حُذفت.',
    backHome: 'العودة إلى الرئيسية',
    home: 'الرئيسية',
  },

  en: {
    tagline: 'Free tools and guides for YouTube creators',
    navTools: 'Tools',
    navGuides: 'Guides',
    navTrending: 'Trending',
    switchLang: 'العربية',
    switchLangLabel: 'اعرض هذه الصفحة بالعربية',
    themeToggle: 'Toggle dark mode',
    skipToContent: 'Skip to content',
    menu: 'Menu',

    homeTitle: 'TrendVid — Trending YouTube videos in your country right now',
    homeDescription: 'See what is trending on YouTube right now in your country — the Arab world, the US, Europe and more — refreshed every two hours, plus free creator tools.',
    homeGuidesTitle: 'Latest guides',
    allTools: 'All tools',
    allGuides: 'All guides',

    toolsTitle: 'Free tools for YouTube creators',
    toolsDescription: 'YouTube earnings calculator, title checker, description and chapters checker, and thumbnail checker — free, no sign-up.',
    toolsLead: 'Every tool runs inside your browser. We never ask for your account or upload your files.',
    openTool: 'Open tool',
    howItWorks: 'How to use it',
    faq: 'FAQ',
    relatedTools: 'More tools',
    privacyNoteTool: 'This tool runs entirely in your browser; nothing is sent to our servers.',

    guidesTitle: 'Practical YouTube guides',
    guidesDescription: 'Practical guides to grow your YouTube channel: ideas, titles, thumbnails and monetization.',
    guidesLead: 'Step-by-step guides written from real experience.',
    guidesEmpty: 'Our first guides are being written right now. Check back soon — and try the tools meanwhile.',
    readGuide: 'Read guide',
    minutesRead: (n) => `${n} min read`,
    updatedOn: (d) => `Updated ${d}`,
    publishedOn: (d) => `Published ${d}`,
    byAuthor: (a) => `By ${a}`,
    tableOfContents: 'In this guide',
    relatedGuides: 'Related guides',

    countryLabel: 'Country',
    categoryLabel: 'Category',
    show: 'Show',
    detectedByLocation: 'Based on your location',
    refreshEvery: 'Refreshed every two hours',
    fallbackNotice: (country) => `YouTube has no trending list for your country, so we are showing ${country}. You can pick another country.`,
    trendingCountryTitle: (country) => `Trending on YouTube in ${country}`,
    trendingCountryCategoryTitle: (country, category) => `${category}: trending on YouTube in ${country}`,
    trendingCountryDescription: (country) => `The most popular YouTube videos in ${country} right now, in YouTube's own order. Refreshed every two hours.`,
    allCategories: 'All',
    updatedAgo: (when) => `Updated ${when}`,
    staleNotice: "We couldn't refresh this list recently, so this is the latest copy we have.",
    trendingEmpty: 'No list is available for this choice right now. Try another category or country.',
    views: (n) => `${n} views`,
    play: 'Play',
    watchOnYouTube: 'Watch on YouTube',
    close: 'Close',
    sourceYouTube: "Source: YouTube's trending chart (YouTube Data API). Order and view counts come from YouTube.",
    creatorCtaTitle: 'Making videos?',
    creatorCtaText: 'Check your title and thumbnail before you publish, and estimate what a video could earn.',
    pickCountry: 'Pick a country',

    recommendedTitle: 'Tools we use and recommend',
    affiliateDisclosure: 'Some of these are affiliate links: we may earn a commission if you subscribe, at no extra cost to you.',
    visit: 'Visit',
    adLabel: 'Advertisement',

    footerAbout: 'About',
    footerPrivacy: 'Privacy policy',
    footerTerms: 'Terms of use',
    footerContact: 'Contact',
    footerDisclaimer: 'TrendVid is independent and not affiliated with YouTube or Google. YouTube is a trademark of Google LLC.',
    joinTelegram: 'Follow us on Telegram',

    notFoundTitle: 'Page not found',
    notFoundText: 'This page may have moved or been removed.',
    backHome: 'Back to home',
    home: 'Home',
  },
};

export function normalizeLang(lang) {
  return lang === 'en' ? 'en' : 'ar';
}

export function dirFor(lang) {
  return normalizeLang(lang) === 'ar' ? 'rtl' : 'ltr';
}

/** t('key', ...args) - falls back to English, then to the key, so a gap never crashes a page. */
export function translator(lang) {
  const table = STRINGS[normalizeLang(lang)];
  return (key, ...args) => {
    const value = table[key] ?? STRINGS.en[key] ?? key;
    return typeof value === 'function' ? value(...args) : value;
  };
}
