/**
 * Creator tools: page copy (ar/en) + the server-rendered form each tool's script enhances.
 * Tool logic lives in public/assets/js/tools/<slug>.js and runs only in the browser.
 *
 * Facts quoted in the copy come from YouTube Help and are linked from the FAQ:
 *  - titles: max 100 characters; descriptions: max 5,000 characters
 *  - chapters: first timestamp 0:00, at least 3 timestamps, each chapter at least 10 seconds
 *  - thumbnails: 1280x720 recommended (min width 640), JPG/GIF/PNG, under 2 MB, 16:9
 */
import { html } from './lib/html.js';

const HELP = {
  thumbnails: 'https://support.google.com/youtube/answer/72431',
  chapters: 'https://support.google.com/youtube/answer/9884579',
  hashtags: 'https://support.google.com/youtube/answer/6390658',
  ypp: 'https://support.google.com/youtube/answer/72851',
  rpm: 'https://support.google.com/youtube/answer/9314357',
};

export const TOOLS = [
  {
    slug: 'earnings-calculator',
    icon: '💰',
    name: { ar: 'حاسبة أرباح يوتيوب', en: 'YouTube earnings calculator' },
    short: {
      ar: 'قدّر دخل قناتك اليومي والشهري والسنوي من المشاهدات ومعدل RPM.',
      en: 'Estimate daily, monthly and yearly income from views and your RPM.',
    },
    title: {
      ar: 'حاسبة أرباح يوتيوب — كم تربح من المشاهدات؟',
      en: 'YouTube Earnings Calculator — how much do views pay?',
    },
    intro: {
      ar: 'أدخل عدد المشاهدات اليومية ومعدل RPM (ما تربحه فعليًا عن كل 1000 مشاهدة بعد حصة يوتيوب) لتحصل على تقدير لأرباحك. يمكنك أيضًا حساب عدد المشاهدات اللازمة للوصول إلى دخل شهري تستهدفه.',
      en: 'Enter your daily views and your RPM (what you actually earn per 1,000 views after YouTube’s share) to estimate your income. You can also work backwards from a monthly income goal to the views you need.',
    },
    steps: {
      ar: [
        'افتح YouTube Studio ← الإحصاءات ← الأرباح، وانسخ قيمة RPM لآخر 28 يومًا.',
        'أدخل متوسط المشاهدات اليومية وقيمة RPM.',
        'اقرأ التقدير اليومي والشهري والسنوي، أو أدخل هدفك الشهري لمعرفة المشاهدات المطلوبة.',
      ],
      en: [
        'Open YouTube Studio → Analytics → Revenue and copy your RPM for the last 28 days.',
        'Enter your average daily views and that RPM.',
        'Read the daily, monthly and yearly estimate, or enter a monthly goal to see the views you need.',
      ],
    },
    faq: {
      ar: [
        ['ما الفرق بين RPM و CPM؟', `CPM هو ما يدفعه المعلنون لكل 1000 ظهور إعلاني قبل حصة يوتيوب، أما RPM فهو ما تحصل عليه أنت فعليًا لكل 1000 مشاهدة بعد حصة يوتيوب ومن كل مصادر الربح. لذلك RPM هو الرقم الصحيح لتقدير دخلك. <a href="${HELP.rpm}" rel="noopener" target="_blank">شرح يوتيوب لمعدل RPM</a>.`],
        ['لماذا يختلف RPM كثيرًا بين القنوات؟', 'يعتمد على بلد المشاهدين، وموضوع القناة، وطول الفيديو، وموسم الإعلانات (يرتفع عادة في نهاية السنة). لهذا لا نفترض رقمًا ثابتًا: استخدم RPM قناتك الحقيقي من YouTube Studio.'],
        ['هل أحتاج إلى برنامج شركاء يوتيوب لأربح؟', `نعم، أرباح الإعلانات تتطلب الانضمام إلى برنامج شركاء YouTube. الشروط تتغيّر من وقت لآخر، فراجعها في <a href="${HELP.ypp}" rel="noopener" target="_blank">صفحة يوتيوب الرسمية</a>.`],
        ['هل هذا التقدير دقيق؟', 'هو تقدير تقريبي مبني على الأرقام التي تدخلها. الأرباح الفعلية تتغيّر يوميًا.'],
      ],
      en: [
        ['What is the difference between RPM and CPM?', `CPM is what advertisers pay per 1,000 ad impressions before YouTube’s share. RPM is what you actually receive per 1,000 views, after YouTube’s share and across all revenue sources — so RPM is the right number for estimating income. <a href="${HELP.rpm}" rel="noopener" target="_blank">YouTube’s explanation of RPM</a>.`],
        ['Why does RPM vary so much between channels?', 'It depends on where viewers live, the channel’s topic, video length and the advertising season (it usually rises at the end of the year). That is why we do not assume a number: use your real RPM from YouTube Studio.'],
        ['Do I need the YouTube Partner Program to earn?', `Yes, ad revenue requires joining the YouTube Partner Program. The requirements change from time to time, so check <a href="${HELP.ypp}" rel="noopener" target="_blank">YouTube’s official page</a>.`],
        ['Is this estimate accurate?', 'It is an estimate based on the numbers you enter. Real earnings change every day.'],
      ],
    },
    form: (t) => html`
      <form class="tool" data-tool="earnings-calculator" novalidate>
        <div class="field">
          <label for="ec-views">${t.views}</label>
          <input id="ec-views" name="views" type="number" inputmode="numeric" min="0" step="1" value="10000">
        </div>
        <div class="field">
          <label for="ec-rpm">${t.rpm}</label>
          <input id="ec-rpm" name="rpm" type="number" inputmode="decimal" min="0" step="0.1" value="2">
          <div class="chips" role="group" aria-label="${t.rpmPresets}">
            ${['0.5', '1', '2', '4', '8'].map((v) => html`<button type="button" class="chip" data-rpm="${v}">$${v}</button>`)}
          </div>
        </div>
        <output class="results" for="ec-views ec-rpm" aria-live="polite">
          <div class="stat"><span class="stat-label">${t.perDay}</span><span class="stat-value" data-out="day">—</span></div>
          <div class="stat"><span class="stat-label">${t.perMonth}</span><span class="stat-value" data-out="month">—</span></div>
          <div class="stat"><span class="stat-label">${t.perYear}</span><span class="stat-value" data-out="year">—</span></div>
        </output>
        <div class="field">
          <label for="ec-goal">${t.goal}</label>
          <input id="ec-goal" name="goal" type="number" inputmode="decimal" min="0" step="10" value="1000">
        </div>
        <p class="result-line" data-out="goal" aria-live="polite"></p>
      </form>`,
    labels: {
      ar: { views: 'المشاهدات اليومية', rpm: 'RPM بالدولار (لكل 1000 مشاهدة)', rpmPresets: 'قيم RPM سريعة', perDay: 'يوميًا', perMonth: 'شهريًا (30 يومًا)', perYear: 'سنويًا', goal: 'هدفك الشهري بالدولار' },
      en: { views: 'Daily views', rpm: 'RPM in USD (per 1,000 views)', rpmPresets: 'Quick RPM values', perDay: 'Per day', perMonth: 'Per month (30 days)', perYear: 'Per year', goal: 'Your monthly goal in USD' },
    },
  },

  {
    slug: 'title-checker',
    icon: '✍️',
    name: { ar: 'فاحص عنوان الفيديو', en: 'YouTube title checker' },
    short: {
      ar: 'تحقّق من طول العنوان وشاهد كيف يظهر قبل النشر.',
      en: 'Check title length and preview how it looks before you publish.',
    },
    title: {
      ar: 'فاحص عنوان فيديو يوتيوب — الطول والمعاينة والنصائح',
      en: 'YouTube Title Checker — length, preview and tips',
    },
    intro: {
      ar: 'العنوان هو أول ما يقرأه المشاهد. اكتب عنوانك لترى عدد الأحرف (الحد الأقصى في يوتيوب 100 حرف)، ومعاينة لكيفية ظهوره في القائمة، وملاحظات سريعة على الأخطاء الشائعة.',
      en: 'Your title is the first thing a viewer reads. Type it to see the character count (YouTube’s limit is 100), a preview of how it shows in a list, and quick notes on common mistakes.',
    },
    steps: {
      ar: [
        'اكتب أو الصق عنوان الفيديو.',
        'راقب عدّاد الأحرف والمعاينة: الجزء المقصوص لن يراه كثير من المشاهدين.',
        'راجع الملاحظات، وضع الكلمات الأهم في بداية العنوان.',
      ],
      en: [
        'Type or paste your video title.',
        'Watch the counter and preview: the cut-off part is what many viewers will not see.',
        'Review the notes and move the most important words to the start.',
      ],
    },
    faq: {
      ar: [
        ['ما الحد الأقصى لطول عنوان يوتيوب؟', 'يقبل يوتيوب حتى 100 حرف. لكن في الجوال وفي نتائج البحث يُقصّ العنوان الطويل غالبًا، لذا ضع الفكرة الأساسية في أول جزء منه.'],
        ['هل الأحرف الكبيرة والرموز التعبيرية مفيدة؟', 'باعتدال. كلمة أو رمز واحد قد يلفت الانتباه، لكن الإفراط يبدو مزعجًا وقد يقلّل الثقة.'],
        ['هل تُحفظ عناويني؟', 'لا. الأداة تعمل داخل متصفحك فقط.'],
      ],
      en: [
        ['What is the maximum YouTube title length?', 'YouTube accepts up to 100 characters. On mobile and in search, long titles are often cut off, so put the core idea first.'],
        ['Do capital letters and emoji help?', 'In moderation. One word or emoji can catch the eye; too many look spammy and can cost trust.'],
        ['Are my titles saved?', 'No. The tool runs only in your browser.'],
      ],
    },
    form: (t) => html`
      <form class="tool" data-tool="title-checker" novalidate>
        <div class="field">
          <label for="tc-title">${t.title}</label>
          <input id="tc-title" name="title" type="text" maxlength="150" autocomplete="off" placeholder="${t.placeholder}">
          <div class="meter" aria-hidden="true"><span data-out="bar"></span></div>
          <p class="hint"><span data-out="count">0</span> / 100</p>
        </div>
        <div class="preview-card" aria-label="${t.preview}">
          <div class="preview-thumb" aria-hidden="true"></div>
          <div><p class="preview-title" data-out="preview">${t.placeholder}</p><p class="preview-meta">TrendVid · 12K</p></div>
        </div>
        <ul class="checks" data-out="checks" aria-live="polite"></ul>
      </form>`,
    labels: {
      ar: { title: 'عنوان الفيديو', placeholder: 'مثال: جرّبت أرخص هاتف في السوق لمدة أسبوع', preview: 'معاينة' },
      en: { title: 'Video title', placeholder: 'Example: I used the cheapest phone on the market for a week', preview: 'Preview' },
    },
  },

  {
    slug: 'description-checker',
    icon: '📝',
    name: { ar: 'فاحص الوصف والفصول', en: 'Description & chapters checker' },
    short: {
      ar: 'تأكّد أن الوصف ضمن الحد، وأن الطوابع الزمنية تصنع فصولًا صحيحة.',
      en: 'Check description length and that your timestamps make valid chapters.',
    },
    title: {
      ar: 'فاحص وصف يوتيوب والفصول (الطوابع الزمنية)',
      en: 'YouTube Description & Chapters (Timestamps) Checker',
    },
    intro: {
      ar: 'الصق وصف الفيديو لتعرف عدد الأحرف (الحد 5000)، وما يظهر قبل «المزيد»، وهل ستتحوّل طوابعك الزمنية إلى فصول. يتحقق الفاحص من شروط يوتيوب للفصول ويعدّ الوسوم (الهاشتاغ) والروابط.',
      en: 'Paste your video description to see the character count (limit 5,000), what shows before “more”, and whether your timestamps will become chapters. The checker applies YouTube’s chapter rules and counts hashtags and links.',
    },
    steps: {
      ar: [
        'الصق الوصف كاملًا، مع الطوابع الزمنية إن وُجدت (مثل 0:00 مقدمة).',
        'راجع نتيجة الفصول: كل شرط غير محقق يظهر مع سببه.',
        'عدّل ثم انسخ الوصف إلى YouTube Studio.',
      ],
      en: [
        'Paste the whole description, including timestamps if you use them (like 0:00 Intro).',
        'Read the chapter result: every failed rule is listed with the reason.',
        'Fix, then copy the description into YouTube Studio.',
      ],
    },
    faq: {
      ar: [
        ['ما شروط ظهور الفصول؟', `حسب يوتيوب: يبدأ أول طابع زمني من 0:00، ويجب وجود ثلاثة طوابع على الأقل بترتيب تصاعدي، وألا يقل طول الفصل عن 10 ثوانٍ. <a href="${HELP.chapters}" rel="noopener" target="_blank">صفحة يوتيوب عن الفصول</a>.`],
        ['كم وسمًا (هاشتاغ) أضع؟', `القليل أفضل. وفق سياسة يوتيوب، إذا أضفت أكثر من 60 وسمًا يتجاهل يوتيوب كل الوسوم في الفيديو. <a href="${HELP.hashtags}" rel="noopener" target="_blank">سياسة الوسوم</a>.`],
        ['لماذا ينبّه الفاحص على الرمزين < و >؟', 'لا يقبل YouTube Studio هذين الرمزين في الوصف، فاحذفهما قبل الحفظ.'],
      ],
      en: [
        ['What are the rules for chapters?', `Per YouTube: the first timestamp must be 0:00, there must be at least three timestamps in ascending order, and each chapter must be at least 10 seconds long. <a href="${HELP.chapters}" rel="noopener" target="_blank">YouTube’s chapters page</a>.`],
        ['How many hashtags should I use?', `Fewer is better. Under YouTube’s policy, if you add more than 60 hashtags, YouTube ignores all hashtags on the video. <a href="${HELP.hashtags}" rel="noopener" target="_blank">Hashtag policy</a>.`],
        ['Why does it flag < and >?', 'YouTube Studio does not accept those two characters in descriptions, so remove them before saving.'],
      ],
    },
    form: (t) => html`
      <form class="tool" data-tool="description-checker" novalidate>
        <div class="field">
          <label for="dc-text">${t.description}</label>
          <textarea id="dc-text" name="description" rows="12" placeholder="${t.placeholder}"></textarea>
          <div class="meter" aria-hidden="true"><span data-out="bar"></span></div>
          <p class="hint"><span data-out="count">0</span> / 5000</p>
        </div>
        <div class="results" aria-live="polite">
          <div class="stat"><span class="stat-label">${t.hashtags}</span><span class="stat-value" data-out="hashtags">0</span></div>
          <div class="stat"><span class="stat-label">${t.links}</span><span class="stat-value" data-out="links">0</span></div>
          <div class="stat"><span class="stat-label">${t.timestamps}</span><span class="stat-value" data-out="timestamps">0</span></div>
        </div>
        <h3>${t.foldTitle}</h3>
        <p class="fold-preview" data-out="fold"></p>
        <h3>${t.chaptersTitle}</h3>
        <ul class="checks" data-out="checks"></ul>
        <ol class="chapter-list" data-out="chapters"></ol>
      </form>`,
    labels: {
      ar: { description: 'وصف الفيديو', placeholder: 'اكتب وصفك هنا…\n\n0:00 مقدمة\n0:45 الخطوة الأولى\n2:10 الخلاصة', hashtags: 'وسوم', links: 'روابط', timestamps: 'طوابع زمنية', foldTitle: 'ما يظهر قبل «المزيد» (تقريبًا)', chaptersTitle: 'الفصول' },
      en: { description: 'Video description', placeholder: 'Write your description here…\n\n0:00 Intro\n0:45 Step one\n2:10 Wrap-up', hashtags: 'Hashtags', links: 'Links', timestamps: 'Timestamps', foldTitle: 'What shows before “more” (approx.)', chaptersTitle: 'Chapters' },
    },
  },

  {
    slug: 'thumbnail-checker',
    icon: '🖼️',
    name: { ar: 'فاحص الصورة المصغّرة', en: 'Thumbnail checker' },
    short: {
      ar: 'تحقّق من المقاس والحجم والصيغة، وشاهد صورتك بأحجام العرض الحقيقية.',
      en: 'Check size, file weight and format, and preview it at real display sizes.',
    },
    title: {
      ar: 'فاحص الصورة المصغّرة ليوتيوب — المقاس والحجم والمعاينة',
      en: 'YouTube Thumbnail Checker — size, file weight and preview',
    },
    intro: {
      ar: 'اختر صورتك المصغّرة لتتحقق من مطابقتها لمتطلبات يوتيوب (1280×720 مُستحسن، بعرض لا يقل عن 640 بكسل، بصيغة JPG أو PNG أو GIF، وأقل من 2 ميغابايت، بنسبة 16:9)، وشاهدها بالأحجام الصغيرة التي يراها المشاهد فعلًا على الجوال وفي الاقتراحات.',
      en: 'Pick your thumbnail to check it against YouTube’s requirements (1280×720 recommended, at least 640 px wide, JPG/PNG/GIF, under 2 MB, 16:9) and see it at the small sizes viewers actually see on mobile and in suggestions.',
    },
    steps: {
      ar: [
        'اختر ملف الصورة من جهازك (لا يُرفع إلى أي خادم).',
        'راجع نتيجة الفحص: المقاس، الحجم، الصيغة، والنسبة.',
        'انظر إلى المعاينات الصغيرة: هل ما زال النص مقروءًا والوجه واضحًا؟',
      ],
      en: [
        'Choose the image file from your device (it is never uploaded).',
        'Read the result: dimensions, file size, format and aspect ratio.',
        'Look at the small previews: is the text still readable and the face clear?',
      ],
    },
    faq: {
      ar: [
        ['ما المقاس الصحيح للصورة المصغّرة؟', `يوصي يوتيوب بدقة 1280×720 (عرض لا يقل عن 640 بكسل) ونسبة 16:9، بصيغة JPG أو GIF أو PNG وحجم أقل من 2 ميغابايت. <a href="${HELP.thumbnails}" rel="noopener" target="_blank">متطلبات يوتيوب</a>.`],
        ['هل تُرفع صورتي إلى موقعكم؟', 'لا. تُقرأ الصورة داخل متصفحك فقط ولا تغادر جهازك.'],
        ['لماذا أختبر الصورة بحجم صغير؟', 'معظم المشاهدين يرون الصورة صغيرة جدًا على الجوال وفي الاقتراحات. إن لم تكن واضحة بهذا الحجم فلن تجذب النقرات.'],
      ],
      en: [
        ['What is the right thumbnail size?', `YouTube recommends 1280×720 (minimum width 640 px) at 16:9, as JPG, GIF or PNG under 2 MB. <a href="${HELP.thumbnails}" rel="noopener" target="_blank">YouTube’s requirements</a>.`],
        ['Is my image uploaded to your site?', 'No. The image is read inside your browser and never leaves your device.'],
        ['Why test at a small size?', 'Most viewers see thumbnails tiny — on mobile and in suggestions. If it is not clear at that size, it will not earn clicks.'],
      ],
    },
    form: (t) => html`
      <form class="tool" data-tool="thumbnail-checker" novalidate>
        <div class="field">
          <label for="th-file">${t.file}</label>
          <input id="th-file" name="file" type="file" accept="image/png,image/jpeg,image/gif,image/webp">
        </div>
        <ul class="checks" data-out="checks" aria-live="polite"></ul>
        <div class="thumb-previews" data-out="previews" hidden>
          <figure><div class="tp tp-lg"><img alt="" data-out="img"></div><figcaption>${t.large}</figcaption></figure>
          <figure><div class="tp tp-md"><img alt="" data-out="img"></div><figcaption>${t.medium}</figcaption></figure>
          <figure><div class="tp tp-sm"><img alt="" data-out="img"></div><figcaption>${t.small}</figcaption></figure>
        </div>
      </form>`,
    labels: {
      ar: { file: 'اختر الصورة المصغّرة', large: 'الصفحة الرئيسية', medium: 'نتائج البحث', small: 'الاقتراحات على الجوال' },
      en: { file: 'Choose your thumbnail', large: 'Home feed', medium: 'Search results', small: 'Mobile suggestions' },
    },
  },
];

export function toolBySlug(slug) {
  return TOOLS.find((tool) => tool.slug === slug) || null;
}
