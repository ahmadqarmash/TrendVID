/**
 * Interface strings. Both languages must have the same keys (tests/content.test.mjs enforces it).
 * Values may be functions: t('key', ...args).
 */

export const STRINGS = {
  ar: {
    // chrome
    navTrending: 'الرائج',
    navTools: 'الأدوات',
    navGuides: 'الأدلة',
    navCta: 'أدوات مجانية',
    switchLang: 'English',
    switchLangLabel: 'View this page in English',
    themeToggle: 'تبديل المظهر',
    skipToContent: 'انتقل إلى المحتوى',
    menu: 'القائمة الرئيسية',
    home: 'الرئيسية',

    // home + trending
    homeTitle: 'TrendVid — الفيديوهات الرائجة على يوتيوب الآن في بلدك',
    homeDescription: 'شاهد الفيديوهات الرائجة على يوتيوب الآن في السعودية ومصر والإمارات وكل الدول العربية والعالم، تُحدَّث كل ساعتين، مع أدوات مجانية لصنّاع المحتوى.',
    live: 'مباشر',
    stageA: 'ماذا يشاهد ',
    stageB: ' الآن؟',
    stageCatA: (category) => `الأكثر رواجًا في ${category} — `,
    stageCatB: '',
    lede: (country) => `أكثر الفيديوهات رواجًا على يوتيوب في ${country} الآن، بترتيب يوتيوب نفسه. اضغط على أي فيديو لتشاهده هنا.`,
    countryLabel: 'البلد',
    categoryLabel: 'الفئة',
    show: 'عرض',
    detectedByLocation: 'حسب موقعك',
    refreshEvery: 'تُحدَّث كل ساعتين',
    updatedAgo: (when) => `آخر تحديث ${when}`,
    fallbackNotice: (country) => `قائمة يوتيوب الرائجة غير متوفرة لبلدك، لذا نعرض ${country}. يمكنك اختيار بلد آخر.`,
    staleNotice: 'تعذّر التحديث مؤخرًا؛ نعرض آخر نسخة متاحة.',
    trendingEmpty: 'لا تتوفر قائمة لهذا الاختيار الآن. جرّب فئة أو بلدًا آخر.',
    allCategories: 'الكل',
    spotlightLabel: 'الأول الآن',
    topRunners: 'في القمة أيضًا',
    moreTrending: 'المزيد من الرائج',
    views: (n) => `${n} مشاهدة`,
    play: 'تشغيل',
    watchNow: 'شاهد الآن',
    watchOnYouTube: 'شاهد على يوتيوب',
    close: 'إغلاق',
    sourceYouTube: 'المصدر: قائمة يوتيوب الرائجة (YouTube Data API). الترتيب وعدد المشاهدات من يوتيوب.',
    worldTitle: 'استكشف الرائج حول العالم',
    worldLead: 'كل بلد يشاهد شيئًا مختلفًا. اختر وجهتك.',
    worldArab: 'العالم العربي',
    worldGlobal: 'حول العالم',
    trendingCountryTitle: (country) => `الرائج على يوتيوب في ${country}`,
    trendingCountryCategoryTitle: (country, category) => `${category}: الرائج على يوتيوب في ${country}`,
    trendingCountryDescription: (country) => `أكثر الفيديوهات رواجًا على يوتيوب في ${country} الآن، بترتيب يوتيوب نفسه. تُحدَّث القائمة كل ساعتين.`,

    // creator band (the bridge from trending to the pages that earn)
    bandEyebrow: 'لصنّاع المحتوى',
    bandTitle: 'شاهدت ما يرغبه جمهورك. الآن اصنعه.',
    bandText: 'أدوات مجانية لعناوين أقوى، وصور مصغّرة تجذب النقرات، ووصف بفصول صحيحة، وتقدير أرباحك — بدون تسجيل.',
    bandCta: 'جرّب الأدوات مجانًا',

    // tools
    toolsEyebrow: 'صندوق أدوات صانع المحتوى',
    toolsTitle: 'أدوات مجانية لصنّاع محتوى يوتيوب',
    toolsDescription: 'حاسبة أرباح يوتيوب، فاحص العنوان، فاحص الوصف والفصول، وفاحص الصورة المصغّرة — مجانًا وبالعربية.',
    toolsLead: 'أدوات سريعة تعمل داخل متصفحك. لا نطلب حسابك، ولا نرفع ملفاتك.',
    openTool: 'افتح الأداة',
    freeTool: 'أداة مجانية',
    trustFree: 'مجانية بالكامل',
    trustNoSignup: 'بدون تسجيل',
    trustPrivate: 'تعمل في متصفحك',
    howItWorks: 'طريقة الاستخدام',
    faq: 'أسئلة شائعة',
    relatedTools: 'أدوات أخرى',
    privacyNoteTool: 'تعمل هذه الأداة بالكامل في متصفحك؛ لا يُرسَل شيء إلى خوادمنا.',

    // guides
    guidesEyebrow: 'الأدلة',
    guidesTitle: 'أدلة يوتيوب العملية',
    guidesDescription: 'أدلة عملية بالعربية لنمو قناتك على يوتيوب: الأفكار، العناوين، الصور المصغّرة، والربح.',
    guidesLead: 'شروحات مكتوبة بخبرة حقيقية، خطوة بخطوة.',
    guidesEmpty: 'نكتب أول الأدلة الآن. عُد قريبًا — وجرّب الأدوات في الأثناء.',
    minutesRead: (n) => `${n} دقائق قراءة`,
    updatedOn: (d) => `آخر تحديث: ${d}`,
    publishedOn: (d) => `نُشر في ${d}`,
    byAuthor: (a) => `بقلم ${a}`,
    tableOfContents: 'في هذا الدليل',
    relatedGuides: 'أدلة ذات صلة',
    latestGuides: 'أحدث الأدلة',
    allGuides: 'كل الأدلة',

    // money
    recommendedTitle: 'أدوات نستخدمها وننصح بها',
    affiliateDisclosure: 'بعض هذه الروابط روابط تسويق بالعمولة: قد نحصل على عمولة إن اشتركت، دون أي تكلفة إضافية عليك.',
    visit: 'زيارة',
    adLabel: 'إعلان',

    // footer
    footerTagline: 'ما يشاهده العالم الآن — وأدوات لتصنع ما سيشاهده غدًا.',
    footerExplore: 'استكشف',
    footerCreators: 'لصنّاع المحتوى',
    footerCompany: 'TrendVid',
    footerAbout: 'من نحن',
    footerPrivacy: 'سياسة الخصوصية',
    footerTerms: 'شروط الاستخدام',
    footerContact: 'تواصل معنا',
    footerDisclaimer: 'TrendVid موقع مستقل وغير تابع لـ YouTube أو Google. YouTube علامة تجارية مملوكة لشركة Google LLC.',
    joinTelegram: 'تابعنا على تيليجرام',

    // 404
    notFoundTitle: 'الصفحة غير موجودة',
    notFoundText: 'ربما نُقلت هذه الصفحة أو حُذفت. لكن الرائج لا يتوقف.',
    backHome: 'شاهد الرائج الآن',
  },

  en: {
    navTrending: 'Trending',
    navTools: 'Tools',
    navGuides: 'Guides',
    navCta: 'Free tools',
    switchLang: 'العربية',
    switchLangLabel: 'اعرض هذه الصفحة بالعربية',
    themeToggle: 'Toggle theme',
    skipToContent: 'Skip to content',
    menu: 'Main menu',
    home: 'Home',

    homeTitle: 'TrendVid — Trending YouTube videos in your country right now',
    homeDescription: 'See what is trending on YouTube right now in your country — the Arab world, the US, Europe and more — refreshed every two hours, plus free creator tools.',
    live: 'Live',
    stageA: 'What ',
    stageB: ' is watching now',
    stageCatA: (category) => `Top ${category} — what `,
    stageCatB: ' is watching',
    lede: (country) => `The most popular YouTube videos in ${country} right now, in YouTube’s own order. Tap any video to watch it here.`,
    countryLabel: 'Country',
    categoryLabel: 'Category',
    show: 'Show',
    detectedByLocation: 'Based on your location',
    refreshEvery: 'Refreshed every two hours',
    updatedAgo: (when) => `Updated ${when}`,
    fallbackNotice: (country) => `YouTube has no trending list for your country, so we are showing ${country}. You can pick another country.`,
    staleNotice: "We couldn't refresh this list recently, so this is the latest copy we have.",
    trendingEmpty: 'No list is available for this choice right now. Try another category or country.',
    allCategories: 'All',
    spotlightLabel: '#1 right now',
    topRunners: 'Also at the top',
    moreTrending: 'More trending',
    views: (n) => `${n} views`,
    play: 'Play',
    watchNow: 'Watch now',
    watchOnYouTube: 'Watch on YouTube',
    close: 'Close',
    sourceYouTube: "Source: YouTube's trending chart (YouTube Data API). Order and view counts come from YouTube.",
    worldTitle: 'Explore trending around the world',
    worldLead: 'Every country watches something different. Pick a destination.',
    worldArab: 'Arab world',
    worldGlobal: 'Around the world',
    trendingCountryTitle: (country) => `Trending on YouTube in ${country}`,
    trendingCountryCategoryTitle: (country, category) => `${category}: trending on YouTube in ${country}`,
    trendingCountryDescription: (country) => `The most popular YouTube videos in ${country} right now, in YouTube's own order. Refreshed every two hours.`,

    bandEyebrow: 'For creators',
    bandTitle: 'You’ve seen what your audience wants. Now make it.',
    bandText: 'Free tools for stronger titles, thumbnails that earn clicks, descriptions with valid chapters, and an estimate of your earnings — no sign-up.',
    bandCta: 'Try the free tools',

    toolsEyebrow: 'The creator toolkit',
    toolsTitle: 'Free tools for YouTube creators',
    toolsDescription: 'YouTube earnings calculator, title checker, description and chapters checker, and thumbnail checker — free, no sign-up.',
    toolsLead: 'Fast tools that run inside your browser. We never ask for your account or upload your files.',
    openTool: 'Open tool',
    freeTool: 'Free tool',
    trustFree: 'Completely free',
    trustNoSignup: 'No sign-up',
    trustPrivate: 'Runs in your browser',
    howItWorks: 'How to use it',
    faq: 'FAQ',
    relatedTools: 'More tools',
    privacyNoteTool: 'This tool runs entirely in your browser; nothing is sent to our servers.',

    guidesEyebrow: 'Guides',
    guidesTitle: 'Practical YouTube guides',
    guidesDescription: 'Practical guides to grow your YouTube channel: ideas, titles, thumbnails and monetization.',
    guidesLead: 'Step-by-step guides written from real experience.',
    guidesEmpty: 'Our first guides are being written right now. Check back soon — and try the tools meanwhile.',
    minutesRead: (n) => `${n} min read`,
    updatedOn: (d) => `Updated ${d}`,
    publishedOn: (d) => `Published ${d}`,
    byAuthor: (a) => `By ${a}`,
    tableOfContents: 'In this guide',
    relatedGuides: 'Related guides',
    latestGuides: 'Latest guides',
    allGuides: 'All guides',

    recommendedTitle: 'Tools we use and recommend',
    affiliateDisclosure: 'Some of these are affiliate links: we may earn a commission if you subscribe, at no extra cost to you.',
    visit: 'Visit',
    adLabel: 'Advertisement',

    footerTagline: 'What the world is watching now — and tools to make what it watches next.',
    footerExplore: 'Explore',
    footerCreators: 'For creators',
    footerCompany: 'TrendVid',
    footerAbout: 'About',
    footerPrivacy: 'Privacy policy',
    footerTerms: 'Terms of use',
    footerContact: 'Contact',
    footerDisclaimer: 'TrendVid is independent and not affiliated with YouTube or Google. YouTube is a trademark of Google LLC.',
    joinTelegram: 'Follow us on Telegram',

    notFoundTitle: 'Page not found',
    notFoundText: 'This page may have moved or been removed. Trending never stops, though.',
    backHome: 'Watch what’s trending',
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
