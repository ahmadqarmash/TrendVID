import { earnings, formatMoney, formatNumber, viewsForGoal } from './logic.js';
import { form, lang, markUsed, out } from './ui.js';

const T = {
  ar: {
    goal: (daily, monthly) => `تحتاج نحو ${daily} مشاهدة يوميًا (${monthly} شهريًا) بهذا المعدل.`,
    noRpm: 'أدخل قيمة RPM أكبر من صفر.',
  },
  en: {
    goal: (daily, monthly) => `You need about ${daily} views a day (${monthly} a month) at this RPM.`,
    noRpm: 'Enter an RPM above zero.',
  },
}[lang];

const root = form('earnings-calculator');
if (root) {
  const views = root.elements.views;
  const rpm = root.elements.rpm;
  const goal = root.elements.goal;

  const update = () => {
    const e = earnings(views.value, rpm.value);
    out(root, 'day').textContent = formatMoney(e.day, lang);
    out(root, 'month').textContent = formatMoney(e.month, lang);
    out(root, 'year').textContent = formatMoney(e.year, lang);

    const need = viewsForGoal(goal.value, rpm.value);
    out(root, 'goal').textContent = need
      ? T.goal(formatNumber(need.daily, lang), formatNumber(need.monthly, lang))
      : T.noRpm;

    root.querySelectorAll('[data-rpm]').forEach((b) => b.classList.toggle('is-active', b.dataset.rpm === String(Number(rpm.value))));
  };

  root.addEventListener('input', () => { markUsed('earnings-calculator'); update(); });
  root.addEventListener('submit', (e) => e.preventDefault());
  root.querySelectorAll('[data-rpm]').forEach((button) => {
    button.addEventListener('click', () => {
      rpm.value = button.dataset.rpm;
      markUsed('earnings-calculator');
      update();
    });
  });
  update();
}
