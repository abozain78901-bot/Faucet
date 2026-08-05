import { CONFIG } from '../config.js';
import { layout } from '../lib/render.js';
import { fmtDoge } from '../lib/util.js';

export function renderPtc({ user, clicksMap }) {
  let adsHtml = '';
  
  // توليد الـ 100 إعلان
  for (let i = 1; i <= CONFIG.PTC_COUNT; i++) {
    const lastClicked = clicksMap[i];
    let isAvailable = true;
    let timeLeftText = '';

    if (lastClicked) {
      const lastTime = new Date(lastClicked).getTime();
      const now = Date.now();
      const diffHours = (now - lastTime) / (1000 * 60 * 60);
      
      if (diffHours < CONFIG.PTC_COOLDOWN_HOURS) {
        isAvailable = false;
        const remainingSeconds = Math.ceil((CONFIG.PTC_COOLDOWN_HOURS * 3600) - ((now - lastTime) / 1000));
        const hrs = Math.floor(remainingSeconds / 3600);
        const mins = Math.floor((remainingSeconds % 3600) / 60);
        timeLeftText = `Available in ${hrs}h ${mins}m`;
      }
    }

    adsHtml += `
      <div class="card" style="padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>Advertisement #${i}</strong>
          <div class="muted" style="font-size: 0.8rem;">Reward: ${fmtDoge(CONFIG.PTC_REWARD)} ${CONFIG.FAUCETPAY_CURRENCY}</div>
        </div>
        <div>
          ${isAvailable 
            ? `<a href="/ptc/view?id=${i}" class="btn" style="padding: 8px 16px; font-size: 0.85rem;">View Ad</a>`
            : `<button class="btn" disabled style="padding: 8px 16px; font-size: 0.85rem; opacity: 0.5;">${timeLeftText}</button>`
          }
        </div>
      </div>
    `;
  }

  const body = `
    <h1 class="title">PTC Ads</h1>
    <p class="tagline">View advertisements and earn ${CONFIG.FAUCETPAY_CURRENCY}. Each ad can be viewed once every ${CONFIG.PTC_COOLDOWN_HOURS} hours.</p>
    
    <div class="card">
        <div class="stat-row">
            <div class="stat-box">
                <div class="value">${fmtDoge(user.balance)}</div>
                <div class="label">Balance (${CONFIG.FAUCETPAY_CURRENCY})</div>
            </div>
            <div class="stat-box">
                <div class="value">${CONFIG.PTC_COUNT}</div>
                <div class="label">Total Ads</div>
            </div>
        </div>
    </div>

    <div style="margin-top: 20px;">
        ${adsHtml}
    </div>
  `;

  return layout(body, { title: 'PTC Ads · ' + CONFIG.SITE_NAME, activePath: '/ptc', adCount: CONFIG.ADS_PER_PTC_PAGE });
}

