import { checkThumbnail, formatBytes } from './logic.js';
import { form, lang, markUsed, out, renderChecks } from './ui.js';

const T = {
  ar: {
    formatOk: (v) => `الصيغة ${v} مقبولة.`,
    formatBad: (v) => `الصيغة (${v}) غير مقبولة — استخدم JPG أو PNG أو GIF.`,
    sizeOk: (v) => `حجم الملف ${formatBytes(v, 'ar')} — أقل من 2 ميغابايت.`,
    sizeBad: (v) => `حجم الملف ${formatBytes(v, 'ar')} — أكبر من حد 2 ميغابايت. اضغط الصورة أو صدّرها بجودة أقل.`,
    tooSmall: (v) => `المقاس ${v} صغير — يجب ألا يقل العرض عن 640 بكسل.`,
    dimsPerfect: (v) => `المقاس ${v} مثالي.`,
    dimsOther: (v) => `المقاس ${v} مقبول، لكن 1280×720 هو الموصى به.`,
    ratioOk: 'النسبة 16:9 صحيحة.',
    ratioBad: (v) => `النسبة ${v}:1 ليست 16:9 — ستظهر أشرطة أو قصّ.`,
    unreadable: 'تعذّرت قراءة الصورة. جرّب ملفًا آخر.',
  },
  en: {
    formatOk: (v) => `${v} format is accepted.`,
    formatBad: (v) => `Format (${v}) is not accepted — use JPG, PNG or GIF.`,
    sizeOk: (v) => `File size ${formatBytes(v, 'en')} — under 2 MB.`,
    sizeBad: (v) => `File size ${formatBytes(v, 'en')} — over the 2 MB limit. Compress it or export at lower quality.`,
    tooSmall: (v) => `${v} is too small — width must be at least 640 px.`,
    dimsPerfect: (v) => `${v} is the ideal size.`,
    dimsOther: (v) => `${v} works, but 1280×720 is recommended.`,
    ratioOk: '16:9 aspect ratio is correct.',
    ratioBad: (v) => `Aspect ratio ${v}:1 is not 16:9 — expect bars or cropping.`,
    unreadable: 'Could not read that image. Try another file.',
  },
}[lang];

const root = form('thumbnail-checker');
if (root) {
  const input = root.elements.file;
  const checks = out(root, 'checks');
  const previews = out(root, 'previews');
  let objectUrl = '';

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    markUsed('thumbnail-checker');
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file); // stays in the browser - nothing is uploaded

    const img = new Image();
    img.onload = () => {
      renderChecks(checks, checkThumbnail({ type: file.type, size: file.size, width: img.naturalWidth, height: img.naturalHeight }), T);
      root.querySelectorAll('[data-out="img"]').forEach((el) => { el.src = objectUrl; });
      previews.hidden = false;
    };
    img.onerror = () => {
      renderChecks(checks, [{ level: 'bad', key: 'unreadable' }], T);
      previews.hidden = true;
    };
    img.src = objectUrl;
  });
  root.addEventListener('submit', (e) => e.preventDefault());

  // Drag and drop onto the drop zone feeds the same file input.
  const zone = root.querySelector('.dropzone');
  if (zone) {
    ['dragenter', 'dragover'].forEach((type) => zone.addEventListener(type, (e) => {
      e.preventDefault();
      zone.classList.add('is-over');
    }));
    ['dragleave', 'drop'].forEach((type) => zone.addEventListener(type, () => zone.classList.remove('is-over')));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!e.dataTransfer?.files?.length) return;
      input.files = e.dataTransfer.files;
      input.dispatchEvent(new Event('change'));
    });
  }
}
