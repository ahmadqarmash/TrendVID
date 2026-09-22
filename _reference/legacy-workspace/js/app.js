const API_BASE = 'https://api.trendvid.net/videos';

let currentType='trending';
let currentCountry='GLOBAL';
let currentCategory='0';
let currentLang='en';
let activeIframe=null;

const videosEl=document.getElementById('videos');
const countrySelect=document.getElementById('countrySelect');
const categorySelect=document.getElementById('categorySelect');
const langToggle=document.getElementById('langToggle');

const COUNTRIES={
  GLOBAL:{en:'Worldwide',ar:'عالمي'},
  US:{en:'United States',ar:'الولايات المتحدة'},
  GB:{en:'United Kingdom',ar:'بريطانيا'},
  SA:{en:'Saudi Arabia',ar:'السعودية'}
};

const CATEGORIES={
  0:{en:'All',ar:'الكل'},
  10:{en:'Music',ar:'موسيقى'},
  20:{en:'Gaming',ar:'ألعاب'},
  24:{en:'Entertainment',ar:'ترفيه'}
};

function populateFilters(){
  countrySelect.innerHTML='';
  Object.keys(COUNTRIES).forEach(c=>{
    const o=document.createElement('option');
    o.value=c;
    o.textContent=COUNTRIES[c][currentLang];
    countrySelect.appendChild(o);
  });

  categorySelect.innerHTML='';
  Object.keys(CATEGORIES).forEach(c=>{
    const o=document.createElement('option');
    o.value=c;
    o.textContent=CATEGORIES[c][currentLang];
    categorySelect.appendChild(o);
  });
}

async function loadVideos(){
  const url=`${API_BASE}?type=${currentType}&country=${currentCountry}&category=${currentCategory}&page=1`;
  const res=await fetch(url);
  const data=await res.json();
  renderVideos(data.videos||[]);
}

function renderVideos(videos){
  videosEl.innerHTML='';
  videos.forEach(v=>{
    const views=v.views ?? v.viewCount ?? v.statistics?.viewCount ?? 0;
    const card=document.createElement('div');
    card.className='card';
    card.innerHTML=`
      <div class="thumb">
        <img src="${v.thumbnail}">
        <div class="play">▶</div>
      </div>
      <h3>${v.title}</h3>
      <div class="meta">👁 ${formatViews(views)}</div>
    `;
    card.querySelector('.thumb').onclick=()=>playVideo(card,v.id);
    videosEl.appendChild(card);
  });
}

function playVideo(card,id){
  if(activeIframe){
    const holder=activeIframe.closest('.thumb');
    holder.innerHTML=activeIframe.dataset.thumbHtml;
  }
  const thumb=card.querySelector('.thumb');
  const original=thumb.innerHTML;
  const iframe=document.createElement('iframe');
  iframe.src=`https://www.youtube.com/embed/${id}?autoplay=1`;
  iframe.allow='autoplay; encrypted-media';
  iframe.allowFullscreen=true;
  iframe.dataset.thumbHtml=original;
  thumb.innerHTML='';
  thumb.appendChild(iframe);
  activeIframe=iframe;
}

function formatViews(v){
  if(!v) return '0 views';
  if(v>=1e6) return (v/1e6).toFixed(1)+'M views';
  if(v>=1e3) return (v/1e3).toFixed(1)+'K views';
  return v+' views';
}

countrySelect.onchange=()=>{currentCountry=countrySelect.value;loadVideos();};
categorySelect.onchange=()=>{currentCategory=categorySelect.value;loadVideos();};
langToggle.onclick=()=>{
  currentLang=currentLang==='en'?'ar':'en';
  langToggle.textContent=currentLang.toUpperCase();
  populateFilters();
  loadVideos();
};

document.querySelectorAll('.tab').forEach(tab=>{
  tab.onclick=()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    currentType=tab.dataset.type;
    loadVideos();
  };
});

populateFilters();
loadVideos();
