import { LIMITS, analyzeTitle } from './logic.js';
import { form, lang, markUsed, out, renderChecks, setMeter } from './ui.js';

const T = {
  ar: {
    tooLong: (n) => `أطول من الحد بـ ${n} حرف — يوتيوب لا يقبل أكثر من 100.`,
    mayTruncate: 'قد يُقصّ على الجوال وفي البحث. ضع الكلمات الأهم في البداية.',
    veryShort: 'قصير جدًا؛ أضف ما يوضح للمشاهد ما سيحصل عليه.',
    goodLength: 'طول مناسب.',
    tooManyCaps: (n) => `${n} كلمات بأحرف كبيرة بالكامل — قد يبدو مزعجًا.`,
    tooManyEmoji: (n) => `${n} رموز تعبيرية — واحد أو اثنان يكفيان.`,
    repeatedPunctuation: 'علامات ترقيم مكررة (!!! أو ؟؟؟) تقلّل الثقة.',
    angleBrackets: 'يوتيوب لا يقبل الرمزين < و >.',
    hashtagInTitle: 'الوسوم في العنوان تأخذ مساحة؛ ضعها في الوصف غالبًا.',
    hasNumber: 'يحتوي على رقم — الأرقام تجعل الوعد أوضح.',
  },
  en: {
    tooLong: (n) => `${n} characters over the limit — YouTube accepts at most 100.`,
    mayTruncate: 'May be cut off on mobile and in search. Put the key words first.',
    veryShort: 'Very short; add what the viewer will get.',
    goodLength: 'Good length.',
    tooManyCaps: (n) => `${n} ALL-CAPS words — that can look spammy.`,
    tooManyEmoji: (n) => `${n} emoji — one or two is plenty.`,
    repeatedPunctuation: 'Repeated punctuation (!!! or ???) costs trust.',
    angleBrackets: 'YouTube does not accept < or >.',
    hashtagInTitle: 'Hashtags in the title use up space; they usually belong in the description.',
    hasNumber: 'Contains a number — numbers make the promise concrete.',
  },
}[lang];

const root = form('title-checker');
if (root) {
  const input = root.elements.title;
  const preview = out(root, 'preview');
  const placeholder = preview.textContent;

  const update = () => {
    const { count, checks } = analyzeTitle(input.value);
    out(root, 'count').textContent = String(count);
    setMeter(out(root, 'bar'), count, LIMITS.title, 70);
    preview.textContent = input.value.trim() || placeholder;
    renderChecks(out(root, 'checks'), checks, T);
  };

  input.addEventListener('input', () => { markUsed('title-checker'); update(); });
  root.addEventListener('submit', (e) => e.preventDefault());
  update();
}
