# كتابة الأدلة · Writing guides

## بالعربية

1. انسخ `_TEMPLATE.md` إلى `ar/` (أو `en/` للإنجليزية) وسمِّ الملف بحروف لاتينية صغيرة وشرطات،
   مثل `ar/youtube-title-tips.md` — يصبح الرابط `/ar/guides/youtube-title-tips/`.
2. املأ البيانات في أعلى الملف (العنوان، الوصف، التاريخ، الكاتب). اترك `draft: true` حتى تنتهي.
3. اكتب من تجربتك: ما جرّبته، ما نجح، أرقام حقيقية، صور شاشة. جوجل وأدسنس يكافئان الخبرة الحقيقية
   ويعاقبان النصوص العامة أو المولّدة بكثرة.
4. 300 كلمة على الأقل للدليل المنشور (الأفضل 1000–2000). ثلاثة عناوين رئيسية أو أكثر تُنشئ فهرسًا تلقائيًا.
5. غيّر إلى `draft: false` ثم شغّل `npm test` — إن كان هناك خطأ ستظهر رسالة توضّح ما يجب إصلاحه.

## In English

1. Copy `_TEMPLATE.md` into `ar/` or `en/`. The file name (lowercase latin, dashes) becomes the URL.
2. Fill in the front matter; keep `draft: true` until it is finished.
3. Write from first-hand experience — real numbers, screenshots, what worked and what did not.
4. Published guides need at least 300 words (1,000–2,000 is better). Three or more `#` sections
   get an automatic table of contents.
5. Set `draft: false` and run `npm test`; any problem is reported with the exact fix.

## Ideas for the first guides

- How YouTube monetization works for Arab creators (YPP, RPM by audience country)
- Writing titles that get clicked — with before/after examples from your channel
- Thumbnail design: what works at small sizes
- Chapters and descriptions that help search
- Best free and paid tools for Arabic video editing and subtitles
- How to find video ideas from the trending list (link to `/ar/trending/`)

Link guides to the matching tool (e.g. `[فاحص العنوان](/ar/tools/title-checker/)`) and set
`affiliates:` to the programs the guide genuinely recommends.
