(() => {
  const API_BASE = "https://api.trendvid.net";
  const STORAGE = {
    lang: "trendvid_lang",
    theme: "trendvid_theme",
    country: "trendvid_country",
    category: "trendvid_category",
    mode: "trendvid_mode",
    countryAuto: "trendvid_country_auto",
  };

  const I18N = {
    en: {
      country: "Country",
      category: "Category",
      language: "Language",
      trending: "Trending",
      mostViewed: "Most Viewed",
      loading: "Loading…",
      showing: (n) => `Showing ${n} videos`,
      noResults: "No results",
      all: "All",
      global: "Global",
      previous: "Previous",
      next: "Next",
      about: "About",
      privacy: "Privacy",
      terms: "Terms",
      views: "views",
      autoCountry: "Auto (IP)",
      doc: {
        aboutTitle: "About",
        privacyTitle: "Privacy",
        termsTitle: "Terms",
        aboutBody: "TrendVid shows trending and most-viewed YouTube videos by country and category.",
        privacyBody: "We do not collect personal data. The site may use cookies from Google AdSense and YouTube embeds.",
        termsBody: "TrendVid provides links/embeds to public YouTube videos. All content belongs to its owners.",
      }
    },
    ar: {
      country: "الدولة",
      category: "الفئة",
      language: "اللغة",
      trending: "الرائج",
      mostViewed: "الأكثر مشاهدة",
      loading: "جاري التحميل…",
      showing: (n) => `عرض ${n} فيديو`,
      noResults: "لا توجد نتائج",
      all: "الكل",
      global: "عالمي",
      previous: "السابق",
      next: "التالي",
      about: "حول",
      privacy: "الخصوصية",
      terms: "الشروط",
      views: "مشاهدة",
      autoCountry: "تلقائي (IP)",
      doc: {
        aboutTitle: "حول",
        privacyTitle: "الخصوصية",
        termsTitle: "الشروط",
        aboutBody: "TrendVid يعرض مقاطع يوتيوب الرائجة والأكثر مشاهدة حسب الدولة والفئة.",
        privacyBody: "لا نجمع بيانات شخصية. قد تستخدم Google AdSense و YouTube ملفات تعريف ارتباط.",
        termsBody: "TrendVid يعرض روابط/تضمينات لمقاطع YouTube العامة. المحتوى يعود لمالكيه.",
      }
    },
  };

  // ISO 3166-1 alpha-2 list (display in EN; AR UI labels handled separately)
  const COUNTRIES = [
    { code: "GLOBAL", name: {en:"Global", ar:"عالمي"} },
    { code: "US", name: {en:"United States", ar:"الولايات المتحدة"} },
    { code: "GB", name: {en:"United Kingdom", ar:"المملكة المتحدة"} },
    { code: "CA", name: {en:"Canada", ar:"كندا"} },
    { code: "AU", name: {en:"Australia", ar:"أستراليا"} },
    { code: "DE", name: {en:"Germany", ar:"ألمانيا"} },
    { code: "FR", name: {en:"France", ar:"فرنسا"} },
    { code: "IT", name: {en:"Italy", ar:"إيطاليا"} },
    { code: "ES", name: {en:"Spain", ar:"إسبانيا"} },
    { code: "TR", name: {en:"Türkiye", ar:"تركيا"} },
    { code: "SA", name: {en:"Saudi Arabia", ar:"السعودية"} },
    { code: "AE", name: {en:"United Arab Emirates", ar:"الإمارات"} },
    { code: "EG", name: {en:"Egypt", ar:"مصر"} },
    { code: "JO", name: {en:"Jordan", ar:"الأردن"} },
    { code: "IQ", name: {en:"Iraq", ar:"العراق"} },
    { code: "LB", name: {en:"Lebanon", ar:"لبنان"} },
    { code: "MA", name: {en:"Morocco", ar:"المغرب"} },
    { code: "DZ", name: {en:"Algeria", ar:"الجزائر"} },
    { code: "TN", name: {en:"Tunisia", ar:"تونس"} },
    { code: "QA", name: {en:"Qatar", ar:"قطر"} },
    { code: "KW", name: {en:"Kuwait", ar:"الكويت"} },
    { code: "BH", name: {en:"Bahrain", ar:"البحرين"} },
    { code: "OM", name: {en:"Oman", ar:"عُمان"} },
    { code: "YE", name: {en:"Yemen", ar:"اليمن"} },
    { code: "IN", name: {en:"India", ar:"الهند"} },
    { code: "JP", name: {en:"Japan", ar:"اليابان"} },
    { code: "KR", name: {en:"South Korea", ar:"كوريا الجنوبية"} },
    { code: "BR", name: {en:"Brazil", ar:"البرازيل"} },
    { code: "MX", name: {en:"Mexico", ar:"المكسيك"} },
    // Expanded list (common countries)
    { code: "AR", name:{en:"Argentina", ar:"الأرجنتين"} },
    { code: "AT", name:{en:"Austria", ar:"النمسا"} },
    { code: "BE", name:{en:"Belgium", ar:"بلجيكا"} },
    { code: "BG", name:{en:"Bulgaria", ar:"بلغاريا"} },
    { code: "CH", name:{en:"Switzerland", ar:"سويسرا"} },
    { code: "CL", name:{en:"Chile", ar:"تشيلي"} },
    { code: "CO", name:{en:"Colombia", ar:"كولومبيا"} },
    { code: "CZ", name:{en:"Czechia", ar:"التشيك"} },
    { code: "DK", name:{en:"Denmark", ar:"الدنمارك"} },
    { code: "FI", name:{en:"Finland", ar:"فنلندا"} },
    { code: "GR", name:{en:"Greece", ar:"اليونان"} },
    { code: "HK", name:{en:"Hong Kong", ar:"هونغ كونغ"} },
    { code: "HU", name:{en:"Hungary", ar:"المجر"} },
    { code: "ID", name:{en:"Indonesia", ar:"إندونيسيا"} },
    { code: "IE", name:{en:"Ireland", ar:"أيرلندا"} },
    { code: "KE", name:{en:"Kenya", ar:"كينيا"} },
    { code: "MY", name:{en:"Malaysia", ar:"ماليزيا"} },
    { code: "NG", name:{en:"Nigeria", ar:"نيجيريا"} },
    { code: "NL", name:{en:"Netherlands", ar:"هولندا"} },
    { code: "NO", name:{en:"Norway", ar:"النرويج"} },
    { code: "NZ", name:{en:"New Zealand", ar:"نيوزيلندا"} },
    { code: "PH", name:{en:"Philippines", ar:"الفلبين"} },
    { code: "PK", name:{en:"Pakistan", ar:"باكستان"} },
    { code: "PL", name:{en:"Poland", ar:"بولندا"} },
    { code: "PT", name:{en:"Portugal", ar:"البرتغال"} },
    { code: "RO", name:{en:"Romania", ar:"رومانيا"} },
    { code: "RU", name:{en:"Russia", ar:"روسيا"} },
    { code: "SE", name:{en:"Sweden", ar:"السويد"} },
    { code: "SG", name:{en:"Singapore", ar:"سنغافورة"} },
    { code: "TH", name:{en:"Thailand", ar:"تايلاند"} },
    { code: "UA", name:{en:"Ukraine", ar:"أوكرانيا"} },
    { code: "VN", name:{en:"Vietnam", ar:"فيتنام"} },
    { code: "ZA", name:{en:"South Africa", ar:"جنوب أفريقيا"} },
  ];

  const els = {};
  const state = {
    lang: "en",
    theme: "dark",
    mode: "trending", // trending | views
    country: "US",
    category: "0",
    // Pagination:
    page: 1, // used for GLOBAL mode
    nextPageToken: "",
    prevPageToken: "",
    tokenStack: [], // for country mode pagination forward
    currentToken: "",
    lastResponseMode: "COUNTRY",
  };

  function $(id){ return document.getElementById(id); }

  function setDir(lang){
    const html = document.documentElement;
    if(lang === "ar"){ html.setAttribute("dir", "rtl"); html.setAttribute("lang", "ar"); }
    else { html.setAttribute("dir", "ltr"); html.setAttribute("lang", "en"); }
  }

  function applyI18n(){
    const t = I18N[state.lang];
    const isIndex = !!$("grid");

    if ($("lblCountry")) $("lblCountry").textContent = t.country;
    if ($("lblCategory")) $("lblCategory").textContent = t.category;
    if ($("lblLang")) $("lblLang").textContent = t.language;

    if ($("btnTrending")) $("btnTrending").textContent = t.trending;
    if ($("btnViews")) $("btnViews").textContent = t.mostViewed;

    if ($("btnPrev")) $("btnPrev").textContent = t.previous;
    if ($("btnNext")) $("btnNext").textContent = t.next;

    if ($("lnkAbout")) $("lnkAbout").textContent = t.about;
    if ($("lnkPrivacy")) $("lnkPrivacy").textContent = t.privacy;
    if ($("lnkTerms")) $("lnkTerms").textContent = t.terms;

    // update country labels
    if ($("countrySelect")) {
      for(const opt of $("countrySelect").options){
        const code = opt.value;
        const item = COUNTRIES.find(x => x.code === code);
        if(item) opt.textContent = item.name[state.lang] || item.name.en;
      }
    }
  }

/* === HERO (LANG-AWARE) === */
function updateHero(){
  const heroText = $("heroText");
  const heroCTA = $("heroCTA");
  if(!heroText || !heroCTA) return;

  if(state.lang === "ar"){
    heroText.textContent = "اكتشف ما يشاهده الناس على يوتيوب الآن — حسب الدولة والفئة";
    heroCTA.textContent = "استكشف الترند";
  }else{
    heroText.textContent = "Discover what people are watching on YouTube — by country and category";
    heroCTA.textContent = "Explore trends";
  }

  heroCTA.onclick = () => {
    const grid = $("grid");
    if(grid) grid.scrollIntoView({ behavior: "smooth" });
  };
}

/* === SEO: title/meta/canonical + on-page supporting text + Schema(ItemList) === */
function updateSEO(){
  // Only run on index page
  if(!$("grid")) return;

  const modeLabel = (state.mode === "views") ? "Most Viewed" : "Trending";
  const cObj = COUNTRIES.find(c => c.code === state.country);
  const countryName = cObj ? (cObj.name.en || state.country) : state.country;

  const title = `${modeLabel} YouTube Videos in ${countryName} | TrendVid`;
  document.title = title;

  const desc = `Discover ${modeLabel.toLowerCase()} YouTube videos in ${countryName}. Updated frequently and organized by category on TrendVid.`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if(metaDesc) metaDesc.setAttribute("content", desc);

  // Canonical: keep stable even for SPA
  const path = `/${state.mode}/${String(state.country).toLowerCase()}`;
  const canonical = `https://trendvid.net${path}`;
  const link = document.querySelector('link[rel="canonical"]');
  if(link) link.setAttribute("href", canonical);

  // GA4 SPA page_view (if available)
  if(typeof gtag === "function"){
    gtag("event", "page_view", {
      page_title: title,
      page_path: path
    });
  }
}

function updateSEOText(){
  const box = $("seoText");
  const titleEl = $("seoTitle");
  const descEl = $("seoDescription");
  if(!box || !titleEl || !descEl) return;

  const modeLabel = (state.mode === "views") ? "Most Viewed" : "Trending";
  const cObj = COUNTRIES.find(c => c.code === state.country);
  const countryName = cObj ? (cObj.name.en || state.country) : state.country;

  box.style.display = "block";
  titleEl.textContent = `${modeLabel} YouTube Videos in ${countryName}`;
  descEl.textContent = `This page shows ${modeLabel.toLowerCase()} YouTube videos in ${countryName}. Videos are updated frequently and embedded directly from YouTube.`;
}

function injectSchemaItemList(items){
  const el = document.getElementById("schema-json");
  if(!el || !Array.isArray(items)) return;

  const list = items.slice(0, 8).map((v, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `https://www.youtube.com/watch?v=${v.id}`
  }));

  el.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: list
  });
}


  function formatViews(n){
    const num = Number(n || 0);
    if (!isFinite(num)) return "0";
    if (num >= 1e9) return (num/1e9).toFixed(num>=1e10?0:1) + "B";
    if (num >= 1e6) return (num/1e6).toFixed(num>=1e7?0:1) + "M";
    if (num >= 1e3) return (num/1e3).toFixed(num>=1e4?0:1) + "K";
    return String(num);
  }

  function setTheme(theme){
    state.theme = theme;
    document.documentElement.dataset.theme = theme;
    const icon = $("themeIcon");
    if(icon) icon.textContent = theme === "dark" ? "🌙" : "☀️";
    localStorage.setItem(STORAGE.theme, theme);
  }

  function setLang(lang){
    state.lang = lang;
    localStorage.setItem(STORAGE.lang, lang);
    setDir(lang);
    applyI18n();
    updateHero();
    updateHero();
    updateSEO();
    updateSEOText();
    // Category names come from API (English). We keep as-is.
  }

  async function detectCountryByIP(){
    // Use Cloudflare trace (no CORS issues usually)
    try{
      const resp = await fetch("https://www.cloudflare.com/cdn-cgi/trace", { cache: "no-store" });
      const txt = await resp.text();
      const m = txt.match(/loc=([A-Z]{2})/);
      if(m && m[1]) return m[1];
    }catch(e){}
    return "US";
  }

  function buildCountryOptions(){
    const sel = $("countrySelect");
    if(!sel) return;
    sel.innerHTML = "";
    for(const c of COUNTRIES){
      const opt = document.createElement("option");
      opt.value = c.code;
      opt.textContent = c.name[state.lang] || c.name.en;
      sel.appendChild(opt);
    }
  }

  function setMode(mode){
    state.mode = mode;
    localStorage.setItem(STORAGE.mode, mode);
    const btnT = $("btnTrending");
    const btnV = $("btnViews");
    if(btnT && btnV){
      btnT.classList.toggle("active", mode === "trending");
      btnV.classList.toggle("active", mode === "views");
    }
  }

  function resetPagination(){
    state.page = 1;
    state.nextPageToken = "";
    state.prevPageToken = "";
    state.tokenStack = [];
    state.currentToken = "";
    updatePagerUI();
  }

  function updatePagerUI(){
    const prev = $("btnPrev");
    const next = $("btnNext");
    const ind = $("pageIndicator");
    if(ind) ind.textContent = String(state.page);

    if(state.lastResponseMode === "GLOBAL"){
      if(prev) prev.disabled = state.page <= 1;
      if(next) next.disabled = false; // global always can try next
    }else{
      if(prev) prev.disabled = state.tokenStack.length === 0;
      if(next) next.disabled = !state.nextPageToken;
    }
  }

  function getThumb(v){
    const t = v.thumbnails || {};
    return (t.maxres && t.maxres.url) || (t.high && t.high.url) || (t.medium && t.medium.url) || (t.default && t.default.url) || "";
  }

  function cardTemplate(v){
    const title = v.title || "";
    const ch = v.channelTitle || "";
    const views = formatViews(v.viewCount);
    const thumb = getThumb(v);
    const id = v.id;
    const viewLabel = I18N[state.lang].views;
    return `
      <article class="card" data-id="${escapeHtml(id)}" data-title="${escapeHtml(title)}" data-ch="${escapeHtml(ch)}" data-views="${views}">
        <img class="thumb" loading="lazy" src="${escapeAttr(thumb)}" alt="">
        <div class="playBadge"><span>▶</span></div>
        <div class="cardBody">
          <h3 class="title">${escapeHtml(title)}</h3>
          <div class="subRow">
            <div class="ch">${escapeHtml(ch)}</div>
            <div class="views">👁 <span>${views}</span> <span>${viewLabel}</span></div>
          </div>
        </div>
      </article>
    `;
  }

  function escapeHtml(s){
    return String(s ?? "").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }
  function escapeAttr(s){ return escapeHtml(s).replace(/"/g, "&quot;"); }

  function openModal(video){
    const modal = $("modal");
    const frame = $("playerFrame");
    const title = $("modalTitle");
    const sub = $("modalSub");
    if(!modal || !frame) return;

    // Stop any existing playback by resetting src first
    frame.src = "";
    const id = video.id;
    // autoplay=1 ensures immediate play; rel=0 for cleaner
    frame.src = `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
    if(title) title.textContent = video.title || "";
    if(sub) sub.textContent = `${video.channelTitle || ""} • ${formatViews(video.viewCount)} ${I18N[state.lang].views}`;

    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal(){
    const modal = $("modal");
    const frame = $("playerFrame");
    if(frame) frame.src = "";
    if(modal) modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function wireModal(){
    const overlay = $("modalOverlay");
    const close = $("modalClose");
    if(overlay) overlay.addEventListener("click", closeModal);
    if(close) close.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e)=>{
      if(e.key === "Escape") closeModal();
    });
  }

  async function loadCategories(countryCode){
    const catSel = $("categorySelect");
    if(!catSel) return;
    catSel.innerHTML = `<option value="0">${I18N[state.lang].all}</option>`;
    try{
      // Only for COUNTRY; for GLOBAL we pick US categories as baseline
      const rc = (countryCode === "GLOBAL") ? "US" : countryCode;
      const resp = await fetch(`${API_BASE}/categories?country=${encodeURIComponent(rc)}`, { cache: "no-store" });
      const data = await resp.json();
      const cats = data.categories || [];
      for(const c of cats){
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.title;
        catSel.appendChild(opt);
      }
    }catch(e){
      // keep All only
    }
  }

  function persistFilters(){
    localStorage.setItem(STORAGE.country, state.country);
    localStorage.setItem(STORAGE.category, state.category);
  }

  function readPersisted(){
    const lang = localStorage.getItem(STORAGE.lang);
    const theme = localStorage.getItem(STORAGE.theme);
    const country = localStorage.getItem(STORAGE.country);
    const category = localStorage.getItem(STORAGE.category);
    const mode = localStorage.getItem(STORAGE.mode);

    if(lang === "ar" || lang === "en") state.lang = lang;
    if(theme === "light" || theme === "dark") state.theme = theme;
    if(mode === "trending" || mode === "views") state.mode = mode;
    if(country) state.country = country;
    if(category) state.category = category;
  }






  async function fetchVideos(){
    const grid = $("grid");
    const status = $("statusText");
    if(!grid || !status) return;

    status.textContent = I18N[state.lang].loading;
    grid.innerHTML = "";

    const params = new URLSearchParams();
    params.set("type", state.mode);
    params.set("country", state.country);
    params.set("category", state.category || "0");

    // Pagination behavior
    if(state.country === "GLOBAL"){
      params.set("page", String(state.page));
    }else{
      if(state.currentToken) params.set("pageToken", state.currentToken);
    }

    try{
      const url = `${API_BASE}/videos?${params.toString()}`;
      const resp = await fetch(url, { cache: "no-store" });
      const data = await resp.json();

      const items = data.items || [];
      state.lastResponseMode = data.mode || (state.country === "GLOBAL" ? "GLOBAL" : "COUNTRY");

      if(state.lastResponseMode === "COUNTRY"){
        state.nextPageToken = data.nextPageToken || "";
        // prevPageToken from API is not reliable for UI navigation, we use stack
        state.prevPageToken = data.prevPageToken || "";
      }else{
        // GLOBAL
        state.nextPageToken = ""; // not used
        state.prevPageToken = "";
      }

      updatePagerUI();

      if(!items.length){
        status.textContent = I18N[state.lang].noResults;
        return;
      }

      status.textContent = I18N[state.lang].showing(items.length);

      // Render
      grid.innerHTML = items.map(cardTemplate).join("");

      // Wire click
      grid.querySelectorAll(".card").forEach((el) => {
        el.addEventListener("click", () => {
          const id = el.getAttribute("data-id");
          const title = el.getAttribute("data-title") || "";
          const ch = el.getAttribute("data-ch") || "";
          const views = el.getAttribute("data-views") || "0";
          openModal({ id, title, channelTitle: ch, viewCount: views });
        });
      
      // SEO updates (never break UI)
      try{
        updateSEO();
        updateSEOText();
        injectSchemaItemList(items.map(v => ({ id: v.id })));
      }catch(e){}
});
    }catch(e){
      status.textContent = "Error";
    }
  }

  function wirePager(){
    const prev = $("btnPrev");
    const next = $("btnNext");

    if(prev){
      prev.addEventListener("click", async () => {
        if(state.country === "GLOBAL"){
          if(state.page > 1){ state.page -= 1; }
        }else{
          // pop stack to go back
          const last = state.tokenStack.pop();
          state.currentToken = last || "";
          state.page = Math.max(1, state.page - 1);
        }
        updatePagerUI();
        await fetchVideos();
      });
    }

    if(next){
      next.addEventListener("click", async () => {
        if(state.country === "GLOBAL"){
          state.page += 1;
        }else{
          if(!state.nextPageToken) return;
          // push current token
          state.tokenStack.push(state.currentToken);
          state.currentToken = state.nextPageToken;
          state.page += 1;
        }
        updatePagerUI();
        await fetchVideos();
      });
    }
  }

  function wireFilters(){
    const countrySel = $("countrySelect");
    const categorySel = $("categorySelect");
    const langSel = $("langSelect");

    if(langSel){
      langSel.value = state.lang;
      langSel.addEventListener("change", () => {
        setLang(langSel.value);
        // refresh labels + status
        fetchVideos();
      });
    }

    if(countrySel){
      countrySel.value = state.country;
      countrySel.addEventListener("change", async () => {
        state.country = countrySel.value;
        resetPagination();
        await loadCategories(state.country);
        // restore category if possible, otherwise All
        const catSel = $("categorySelect");
        if(catSel){
          const wanted = localStorage.getItem(STORAGE.category) || "0";
          catSel.value = wanted;
          state.category = catSel.value || "0";
        }
        persistFilters();
        await fetchVideos();
      });
    }

    if(categorySel){
      categorySel.addEventListener("change", async () => {
        state.category = categorySel.value || "0";
        resetPagination();
        persistFilters();
        await fetchVideos();
      });
    }
  }

  function wireMode(){
    const t = $("btnTrending");
    const v = $("btnViews");
    if(t) t.addEventListener("click", async ()=>{ setMode("trending"); resetPagination(); await fetchVideos(); });
    if(v) v.addEventListener("click", async ()=>{ setMode("views"); resetPagination(); await fetchVideos(); });
  }

  function wireTheme(){
    const btn = $("themeToggle");
    if(btn){
      btn.addEventListener("click", ()=>{
        setTheme(state.theme === "dark" ? "light" : "dark");
      });
    }
  }

  async function initIndexPage(){
    // Load persisted settings
    readPersisted();
    setDir(state.lang);
    setTheme(state.theme);

    const langSel = $("langSelect");
    if(langSel) langSel.value = state.lang;

    buildCountryOptions();
    applyI18n();

    // Auto-detect country by IP (only once)
    if(!localStorage.getItem(STORAGE.countryAuto)){
      const ipCountry = await detectCountryByIP();
      state.country = COUNTRIES.some(c => c.code === ipCountry) ? ipCountry : "US";
      localStorage.setItem(STORAGE.country, state.country);
      localStorage.setItem(STORAGE.countryAuto, "1");
    }

    // Mode default
    setMode(state.mode);

    // Country select value
    const countrySel = $("countrySelect");
    if(countrySel) countrySel.value = state.country;

    // Categories
    await loadCategories(state.country);

    // Category default
    const catSel = $("categorySelect");
    if(catSel){
      catSel.innerHTML = `<option value="0">${I18N[state.lang].all}</option>` + catSel.innerHTML.replace(`<option value="0">${I18N[state.lang].all}</option>`, "");
      const storedCat = localStorage.getItem(STORAGE.category);
      catSel.value = storedCat || "0";
      state.category = catSel.value || "0";
    }

    persistFilters();

    // Wire
    wireMode();
    wireTheme();
    wirePager();
    wireFilters();
    wireModal();

    // FIRST LOAD (fix)
    resetPagination();
    await fetchVideos();
  }

  // Docs page helper
  window.TrendVidDocs = {
    initDocPage: (key) => {
      readPersisted();
      setDir(state.lang);
      setTheme(state.theme);

      const langSel = $("langSelect");
      if(langSel){
        langSel.value = state.lang;
        langSel.addEventListener("change", ()=>{
          setLang(langSel.value);
          window.location.reload();
        });
      }

      const btn = $("themeToggle");
      if(btn){
        btn.addEventListener("click", ()=>{
          setTheme(state.theme === "dark" ? "light" : "dark");
        });
      }

      const t = I18N[state.lang];
      if ($("lnkAbout")) $("lnkAbout").textContent = t.about;
      if ($("lnkPrivacy")) $("lnkPrivacy").textContent = t.privacy;
      if ($("lnkTerms")) $("lnkTerms").textContent = t.terms;

      const title = $("docTitle");
      const body = $("docBody");
      if(key === "about"){
        if(title) title.textContent = t.doc.aboutTitle;
        if(body) body.innerHTML = `<p>${t.doc.aboutBody}</p>`;
      }
      if(key === "privacy"){
        if(title) title.textContent = t.doc.privacyTitle;
        if(body) body.innerHTML = `<p>${t.doc.privacyBody}</p>`;
      }
      if(key === "terms"){
        if(title) title.textContent = t.doc.termsTitle;
        if(body) body.innerHTML = `<p>${t.doc.termsBody}</p>`;
      }
    }
  };

  // Boot
  document.addEventListener("DOMContentLoaded", () => {
    // if grid exists we are on index
    if($("grid")) initIndexPage();
  });
(function () {
  const offerText = document.getElementById("offer-text");
  const offerBtn = document.getElementById("offer-btn");
  const offerLink = document.getElementById("offer-link");

  if (!offerText || !offerBtn || !offerLink) return;

  // ضع رابط الأفلييت هنا لاحقًا
  const AFFILIATE_LINK = ""; // مثال: https://veed.io/?via=xxxx

  if (AFFILIATE_LINK) {
    offerLink.href = AFFILIATE_LINK;
  } else {
    offerLink.href = "https://veed.io";
  }

  const lang = document.documentElement.lang || "en";

  if (lang === "ar") {
    offerText.textContent = "🔥 ترجم الفيديوهات الرائجة فورًا";
    offerBtn.textContent = "جرّبها مجانًا";
  } else {
    offerText.textContent = "🔥 Translate trending videos instantly";
    offerBtn.textContent = "Try it free";
  }
})();

})();
