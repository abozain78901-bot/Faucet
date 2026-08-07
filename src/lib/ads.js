/* ====================================================================
 *  Central ad-slot registry (Adsterra network codes).
 *  Only the 160x300 unit has proven revenue so far — the rest were
 *  removed after showing $0 across thousands of impressions.
 * ==================================================================== */

export const AD_SLOTS = [
  { id: 1, html: `<script>atOptions={key:'4c1c05cc3769478251a0e23cc9f6989f',format:'iframe',height:300,width:160,params:{}};</script><script src="https://www.highperformanceformat.com/4c1c05cc3769478251a0e23cc9f6989f/invoke.js"></script>` },
  { id: 2, html: `<div id="frame" style="width: 100%;margin: auto;position: relative; z-index: 99998;"><iframe data-aa='2450305' src='//acceptable.a-ads.com/2450305/?size=Adaptive' style='border:0; padding:0; width:70%; height:auto; overflow:hidden;display: block;margin: auto'></iframe></div>` },
  { id: 3, html: `<div style="width:120px; margin:0 auto; text-align:center;"><iframe src="//ads.coinserom.com/pub?adsunit=373738&size=120x60" style="width:120px;height:60px;border:0px;padding:0;background-color: transparent;overflow: auto;"></iframe><a style="display: block;text-align:right;font-size:12px;width:120px;" href="https://coinserom.com/?affiliate=3630353634" target="_blank">Advertise here</a></div>` },
];

export const POPUP_AD = {
  html: `<script>atOptions={key:'4c1c05cc3769478251a0e23cc9f6989f',format:'iframe',height:300,width:160,params:{}};</script><script src="https://www.highperformanceformat.com/4c1c05cc3769478251a0e23cc9f6989f/invoke.js"></script>`
};

export function pickAds(count) {
  const pool = [...AD_SLOTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = [];
  while (picked.length < count) picked.push(pool[picked.length % pool.length]);
  return picked;
}

function renderAdBlock(slot) {
  return `<div class="ad-slot">${slot.html}</div>`;
}

export function renderAdsSection(count = 5, label = 'Sponsored') {
  if (count <= 0) return '';
  const ads = pickAds(count);
  return `
<div class="card ad-section">
  <div class="muted center ad-section-label">${label}</div>
  ${ads.map(renderAdBlock).join('\n')}
</div>`;
}

export function renderAdPopup() {
  const big = POPUP_AD;
  return `
<div id="ad-popup-overlay" class="ad-popup-overlay theme-dark">
  <div class="ad-popup-box">
    <button id="ad-popup-close" class="ad-popup-close" aria-label="Close" type="button">&times;</button>
    <button id="ad-popup-theme" class="ad-popup-theme" aria-label="Toggle theme" type="button">🌙</button>
    <div class="ad-popup-content">${big.html}</div>
  </div>
</div>
<script>
(function(){
  var overlay = document.getElementById('ad-popup-overlay');
  var closeBtn = document.getElementById('ad-popup-close');
  var themeBtn = document.getElementById('ad-popup-theme');
  var saved = localStorage.getItem('adPopupTheme') || 'dark';
  overlay.classList.remove('theme-dark','theme-light');
  overlay.classList.add('theme-' + saved);
  themeBtn.textContent = saved === 'dark' ? '☀️' : '🌙';
  closeBtn.addEventListener('click', function(){ overlay.classList.add('hidden'); });
  themeBtn.addEventListener('click', function(){
    var isDark = overlay.classList.contains('theme-dark');
    overlay.classList.remove('theme-dark','theme-light');
    var next = isDark ? 'light' : 'dark';
    overlay.classList.add('theme-' + next);
    localStorage.setItem('adPopupTheme', next);
    themeBtn.textContent = isDark ? '🌙' : '☀️';
  });
})();
</script>`;
}

export const AD_POPUP_CSS = `
.ad-slot { margin: 10px auto; max-width: 100%; overflow: hidden; text-align: center; }
.ad-section-label { margin-bottom: 10px; text-transform: uppercase; letter-spacing: .5px; font-size: .7rem; }
.ad-popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.75); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.ad-popup-overlay.hidden { display: none; }
.ad-popup-box { position: relative; background: #10182b; border: 1px solid #c9a24b; border-radius: 8px; padding: 34px 14px 16px; max-width: 340px; width: 92%; box-shadow: 0 10px 40px rgba(0,0,0,.6); }
.ad-popup-overlay.theme-light .ad-popup-box { background: #ffffff; border-color: #c9a24b; }
.ad-popup-close { position: absolute; top: 6px; right: 10px; background: none; border: none; color: #e8ecf5; font-size: 1.7rem; cursor: pointer; line-height: 1; }
.ad-popup-overlay.theme-light .ad-popup-close { color: #111; }
.ad-popup-theme { position: absolute; top: 8px; left: 10px; background: none; border: none; font-size: 1.1rem; cursor: pointer; }
.ad-popup-content { display: flex; justify-content: center; align-items: center; min-height: 250px; }
`;
