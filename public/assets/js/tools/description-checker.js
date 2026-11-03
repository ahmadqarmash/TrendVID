import { LIMITS, analyzeDescription, formatNumber, formatTimestamp } from './logic.js';
import { form, lang, markUsed, out, renderChecks, setMeter } from './ui.js';

const T = {
  ar: {
    descTooLong: (n) => `الوصف أطول من الحد بـ ${n} حرف (الحد 5000).`,
    angleBrackets: 'يحتوي على < أو > — لا يقبلهما YouTube Studio.',
    hashtagsIgnored: (n) => `${n} وسمًا: أكثر من 60 يجعل يوتيوب يتجاهل كل الوسوم.`,
    noTimestamps: 'لا توجد طوابع زمنية، فلن تظهر فصول (وهذا اختياري).',
    firstNotZero: (v) => `أول طابع زمني (${v}) يجب أن يكون 0:00.`,
    tooFew: (n) => `${n} طوابع فقط — تحتاج 3 على الأقل.`,
    notAscending: (v) => `الطابع ${v} ليس بعد الذي قبله.`,
    tooShort: (v) => `الفصل الذي يبدأ عند ${v} أقصر من 10 ثوانٍ.`,
    valid: 'الطوابع صحيحة: ستظهر الفصول في الفيديو.',
    fold: 'ابدأ بجملة تشرح الفيديو — هذا ما يظهر قبل «المزيد».',
  },
  en: {
    descTooLong: (n) => `${n} characters over the 5,000 limit.`,
    angleBrackets: 'Contains < or > — YouTube Studio rejects those.',
    hashtagsIgnored: (n) => `${n} hashtags: above 60, YouTube ignores all of them.`,
    noTimestamps: 'No timestamps, so no chapters (that is optional).',
    firstNotZero: (v) => `The first timestamp (${v}) must be 0:00.`,
    tooFew: (n) => `Only ${n} timestamps — you need at least 3.`,
    notAscending: (v) => `Timestamp ${v} does not come after the previous one.`,
    tooShort: (v) => `The chapter starting at ${v} is shorter than 10 seconds.`,
    valid: 'Timestamps are valid: chapters will show on the video.',
    fold: 'Start with a sentence that explains the video — that is what shows before “more”.',
  },
}[lang];

const root = form('description-checker');
if (root) {
  const input = root.elements.description;

  const update = () => {
    const r = analyzeDescription(input.value);
    out(root, 'count').textContent = formatNumber(r.count, lang);
    setMeter(out(root, 'bar'), r.count, LIMITS.description, 4500);
    out(root, 'hashtags').textContent = String(r.hashtags);
    out(root, 'links').textContent = String(r.links);
    out(root, 'timestamps').textContent = String(r.timestamps.length);
    out(root, 'fold').textContent = r.fold || T.fold;

    const chapterChecks = r.chapters.valid
      ? [{ level: 'ok', key: 'valid' }]
      : r.chapters.problems.map((p) => ({ level: p.key === 'noTimestamps' ? '' : 'bad', ...p }));
    renderChecks(out(root, 'checks'), [...r.problems, ...chapterChecks], T);

    const list = out(root, 'chapters');
    list.replaceChildren(...(r.chapters.valid ? r.chapters.chapters : []).map((c) => {
      const li = document.createElement('li');
      const time = document.createElement('time');
      time.textContent = formatTimestamp(c.seconds);
      li.append(time, document.createTextNode(c.label));
      return li;
    }));
  };

  input.addEventListener('input', () => { markUsed('description-checker'); update(); });
  root.addEventListener('submit', (e) => e.preventDefault());
  update();
}
