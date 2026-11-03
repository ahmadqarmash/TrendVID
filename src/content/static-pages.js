/**
 * About / Privacy / Terms / Contact copy in both languages.
 * Each page: { title, description, updated, sections: [[heading, [paragraphHtml, ...]], ...] }.
 * Paragraphs are trusted HTML written here (links only) - never user input.
 *
 * YouTube API Services Terms (III.A) require that the privacy policy discloses our use of the
 * YouTube API Services and links Google's Privacy Policy, and that the terms bind users to the
 * YouTube Terms of Service. Keep those paragraphs when editing.
 */
import { SITE } from '../config.js';

const EMAIL = SITE.contactEmail;
const MAIL = `<a href="mailto:${EMAIL}">${EMAIL}</a>`;
const GOOGLE_PRIVACY = 'https://policies.google.com/privacy';
const YT_TOS = 'https://www.youtube.com/t/terms';
const ADS_SETTINGS = 'https://adssettings.google.com';
const GOOGLE_PARTNER_SITES = 'https://policies.google.com/technologies/partner-sites';
const ext = (href, label) => `<a href="${href}" rel="noopener" target="_blank">${label}</a>`;

export const UPDATED = '2026-11-03';

export const PAGES = {
  about: {
    ar: {
      title: 'من نحن',
      description: 'TrendVid موقع مستقل يقدّم أدوات وأدلة مجانية لصنّاع المحتوى على يوتيوب، بالعربية أولًا.',
      sections: [
        ['ما هو TrendVid؟', [
          'TrendVid موقع مستقل لصنّاع المحتوى على يوتيوب، بالعربية أولًا ثم بالإنجليزية. نقدّم أدوات مجانية تعمل داخل متصفحك، وأدلة عملية مكتوبة بخبرة، وقائمة يوتيوب الرائجة لكل بلد لتعرف ما يشاهده جمهورك الآن.',
        ]],
        ['كيف نموّل الموقع؟', [
          'الموقع مجاني. نموّله من إعلانات Google AdSense في صفحات الأدوات والأدلة، ومن روابط تسويق بالعمولة لأدوات نستخدمها وننصح بها. لا تظهر أي إعلانات أو روابط عمولة في صفحات الفيديوهات الرائجة.',
        ]],
        ['استقلاليتنا', [
          'TrendVid غير تابع لـ YouTube أو Google. بيانات القوائم الرائجة مصدرها YouTube Data API، والفيديوهات ملك لأصحابها.',
        ]],
        ['تواصل معنا', [`لأي اقتراح أو تصحيح: ${MAIL}`]],
      ],
    },
    en: {
      title: 'About TrendVid',
      description: 'TrendVid is an independent site with free tools and guides for YouTube creators, Arabic-first.',
      sections: [
        ['What is TrendVid?', [
          'TrendVid is an independent site for YouTube creators, Arabic-first with an English edition. We offer free tools that run in your browser, practical guides written from experience, and YouTube’s trending list for each country so you can see what your audience is watching.',
        ]],
        ['How is the site funded?', [
          'The site is free. It is funded by Google AdSense ads on tool and guide pages, and by affiliate links to tools we use and recommend. Trending video pages never show ads or affiliate links.',
        ]],
        ['Independence', [
          'TrendVid is not affiliated with YouTube or Google. Trending data comes from the YouTube Data API, and videos belong to their owners.',
        ]],
        ['Contact', [`Suggestions or corrections: ${MAIL}`]],
      ],
    },
  },

  privacy: {
    ar: {
      title: 'سياسة الخصوصية',
      description: 'كيف يتعامل TrendVid مع البيانات: لا حسابات، أدوات تعمل في متصفحك، إعلانات Google وتحليلاتها، وخدمات YouTube API.',
      sections: [
        ['باختصار', [
          'لا نطلب إنشاء حساب ولا نجمع اسمك أو عنوانك أو بيانات دفع. الأدوات تعمل داخل متصفحك، ولا تُرسَل نصوصك أو صورك إلى خوادمنا.',
        ]],
        ['استخدامنا لخدمات YouTube API', [
          `يستخدم TrendVid خدمات YouTube API لعرض قوائم الفيديوهات الرائجة العامة. لا نصل إلى حسابك على يوتيوب ولا إلى أي بيانات خاصة بك. باستخدامك هذه الصفحات تخضع أيضًا لـ${ext(GOOGLE_PRIVACY, 'سياسة خصوصية Google')}.`,
          'عند تشغيل فيديو، يُعرض عبر مشغّل يوتيوب المضمّن (youtube-nocookie.com)، وقد تعالج Google عنوان IP الخاص بك وتفاعلك مع المشغّل وفق سياستها.',
        ]],
        ['البيانات التي تُعالَج عند زيارتك', [
          '<strong>الاستضافة والأمان:</strong> يعمل الموقع على Cloudflare التي تعالج عنوان IP ومعلومات المتصفح لتقديم الصفحات ومنع إساءة الاستخدام.',
          '<strong>تفضيلاتك:</strong> نحفظ اختيارك للوضع الليلي في متصفحك فقط (localStorage).',
          '<strong>التحليلات:</strong> نستخدم Google Analytics 4 لفهم الاستخدام بشكل إجمالي (مثل الصفحات الأكثر زيارة).',
        ]],
        ['ملفات تعريف الارتباط والإعلانات', [
          `نعرض إعلانات Google AdSense في صفحات الأدوات والأدلة. تستخدم Google وشركاؤها ملفات تعريف الارتباط لعرض الإعلانات وقياسها، بما في ذلك إعلانات مخصّصة بناءً على زياراتك السابقة لهذا الموقع ومواقع أخرى. يمكنك إيقاف الإعلانات المخصّصة من ${ext(ADS_SETTINGS, 'إعدادات الإعلانات في Google')}، والاطلاع على ${ext(GOOGLE_PARTNER_SITES, 'كيف تستخدم Google المعلومات من المواقع الشريكة')}.`,
          'حيث يتطلّب القانون ذلك (مثل الاتحاد الأوروبي والمملكة المتحدة)، تظهر رسالة موافقة تتيح لك قبول ملفات الارتباط غير الضرورية أو رفضها.',
        ]],
        ['روابط التسويق بالعمولة', [
          'بعض الروابط لأدوات خارجية روابط عمولة. عند النقر عليها قد يضع الموقع الشريك ملف تعريف ارتباط لنسب الاشتراك إلينا. لا نتلقى منه أي بيانات شخصية عنك.',
        ]],
        ['حقوقك', [
          `يمكنك طلب الاطلاع على بياناتك أو حذفها أو الاعتراض على معالجتها. بما أننا لا نحتفظ بحسابات، تتعلق معظم الطلبات بمعرّفات الإعلانات لدى Google. راسلنا على ${MAIL} وسنساعدك.`,
        ]],
        ['الأطفال', ['الموقع غير موجّه للأطفال دون 13 عامًا، ولا نجمع بياناتهم عن قصد.']],
        ['التغييرات', ['نحدّث تاريخ «آخر تحديث» أدناه عند أي تغيير في هذه السياسة.']],
        ['التواصل', [`أسئلة الخصوصية: ${MAIL}`]],
      ],
    },
    en: {
      title: 'Privacy policy',
      description: 'How TrendVid handles data: no accounts, tools that run in your browser, Google ads and analytics, and the YouTube API Services.',
      sections: [
        ['In short', [
          'There are no accounts, and we do not collect your name, address or payment details. The tools run inside your browser; your text and images are never sent to our servers.',
        ]],
        ['Our use of the YouTube API Services', [
          `TrendVid uses the YouTube API Services to show public trending video lists. We never access your YouTube account or any private data. By using these pages you are also subject to the ${ext(GOOGLE_PRIVACY, 'Google Privacy Policy')}.`,
          'When you play a video it opens in YouTube’s embedded player (youtube-nocookie.com), and Google may process your IP address and player interactions under its own policy.',
        ]],
        ['Data processed when you visit', [
          '<strong>Hosting and security:</strong> the site runs on Cloudflare, which processes your IP address and browser details to deliver pages and block abuse.',
          '<strong>Your preferences:</strong> your dark-mode choice is stored only in your browser (localStorage).',
          '<strong>Analytics:</strong> we use Google Analytics 4 to understand usage in aggregate (for example, which pages are popular).',
        ]],
        ['Cookies and advertising', [
          `We show Google AdSense ads on tool and guide pages. Google and its partners use cookies to serve and measure ads, including personalised ads based on your previous visits to this and other websites. You can turn off personalised ads in ${ext(ADS_SETTINGS, 'Google Ads Settings')}, and read ${ext(GOOGLE_PARTNER_SITES, 'how Google uses information from partner sites')}.`,
          'Where the law requires it (for example the EEA and UK), a consent message lets you accept or refuse non-essential cookies.',
        ]],
        ['Affiliate links', [
          'Some links to third-party tools are affiliate links. If you click one, the partner site may set a cookie to credit us for a subscription. We receive no personal data about you from it.',
        ]],
        ['Your rights', [
          `You can ask to access or delete your data, or object to processing. Because we hold no accounts, most requests concern Google advertising identifiers. Email ${MAIL} and we will help.`,
        ]],
        ['Children', ['The site is not directed at children under 13 and we do not knowingly collect their data.']],
        ['Changes', ['We update the “last updated” date below whenever this policy changes.']],
        ['Contact', [`Privacy questions: ${MAIL}`]],
      ],
    },
  },

  terms: {
    ar: {
      title: 'شروط الاستخدام',
      description: 'شروط استخدام موقع TrendVid وأدواته المجانية وقوائم يوتيوب الرائجة.',
      sections: [
        ['قبول الشروط', ['باستخدامك TrendVid فإنك توافق على هذه الشروط. إن لم توافق عليها فلا تستخدم الموقع.']],
        ['شروط خدمة يوتيوب', [
          `تعرض صفحات «الرائج» محتوى من يوتيوب عبر خدمات YouTube API. باستخدامك هذه الصفحات فإنك توافق على الالتزام ${ext(YT_TOS, 'بشروط خدمة YouTube')}.`,
        ]],
        ['الأدوات والمعلومات', [
          'الأدوات والأدلة لأغراض المعلومات فقط، وتقديرات الأرباح تقريبية. لا نضمن نتائج محددة لقناتك، وقرارات النشر مسؤوليتك.',
        ]],
        ['المحتوى والملكية', [
          'الفيديوهات والصور المصغّرة والعناوين ملك لأصحابها ويوتيوب. نصوص الأدلة والأدوات ملك TrendVid، ولا يجوز نسخها بالكامل دون إذن.',
        ]],
        ['الروابط الخارجية', ['قد نضع روابط لمواقع أخرى، بعضها روابط عمولة. لسنا مسؤولين عن محتوى تلك المواقع أو خدماتها.']],
        ['إخلاء المسؤولية', ['يُقدَّم الموقع «كما هو» دون ضمانات. لا نتحمّل مسؤولية أي خسارة ناتجة عن استخدامه في حدود ما يسمح به القانون.']],
        ['التواصل', [`للاستفسارات: ${MAIL}`]],
      ],
    },
    en: {
      title: 'Terms of use',
      description: 'Terms for using TrendVid, its free tools and the YouTube trending lists.',
      sections: [
        ['Acceptance', ['By using TrendVid you agree to these terms. If you do not agree, please do not use the site.']],
        ['YouTube Terms of Service', [
          `The trending pages show YouTube content through the YouTube API Services. By using those pages you agree to be bound by the ${ext(YT_TOS, 'YouTube Terms of Service')}.`,
        ]],
        ['Tools and information', [
          'Tools and guides are for information only, and earnings figures are estimates. We do not guarantee any result for your channel; publishing decisions are yours.',
        ]],
        ['Content and ownership', [
          'Videos, thumbnails and titles belong to their owners and YouTube. Guide and tool texts belong to TrendVid and may not be copied in full without permission.',
        ]],
        ['External links', ['We link to other sites, some through affiliate links. We are not responsible for their content or services.']],
        ['Disclaimer', ['The site is provided “as is” without warranties. To the extent the law allows, we are not liable for any loss arising from its use.']],
        ['Contact', [`Questions: ${MAIL}`]],
      ],
    },
  },

  contact: {
    ar: {
      title: 'تواصل معنا',
      description: 'تواصل مع فريق TrendVid: اقتراحات، تصحيحات، أو طلبات خصوصية.',
      sections: [
        ['راسلنا', [
          `البريد الإلكتروني: ${MAIL}`,
          'نرحّب باقتراحات الأدوات والأدلة، وبتصحيح أي معلومة. نرد عادة خلال أيام قليلة.',
        ]],
      ],
    },
    en: {
      title: 'Contact',
      description: 'Contact the TrendVid team: suggestions, corrections or privacy requests.',
      sections: [
        ['Email us', [
          `Email: ${MAIL}`,
          'We welcome ideas for tools and guides, and corrections of anything we got wrong. We usually reply within a few days.',
        ]],
      ],
    },
  },
};
