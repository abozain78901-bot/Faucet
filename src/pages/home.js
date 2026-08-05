import { CONFIG } from '../config.js';
import { layout } from '../lib/render.js';

export function renderHome() {
  const logoImg = CONFIG.SITE_LOGO_DATA_URI
    ? `<img src="${CONFIG.SITE_LOGO_DATA_URI}" alt="${CONFIG.SITE_NAME}" style="width:96px;height:96px;border-radius:50%;display:block;margin:0 auto 14px;box-shadow:0 0 0 3px var(--gold);">`
    : '';

  const body = `
${logoImg}
<h1 class="title">${CONFIG.SITE_NAME}</h1>
<p class="tagline">${CONFIG.SITE_TAGLINE}</p>

<div class="card" style="display:flex; gap:10px;">
  <a href="/login" class="btn" style="margin:0;">Login</a>
  <a href="/login" class="btn btn-outline" style="margin:0;">Register</a>
</div>

<div class="card">
  <h3>What is ${CONFIG.SITE_NAME}?</h3>
  <p class="muted">${CONFIG.SITE_NAME} is a Dogecoin rewards platform where you earn real ${CONFIG.FAUCETPAY_CURRENCY} through simple, everyday actions — no investment required to get started. All rewards are settled directly to your FaucetPay account.</p>
</div>

<div class="card">
  <h3>How you earn</h3>
  <div class="stat-row" style="flex-wrap:wrap;">
    <div class="stat-box" style="flex:1 1 45%; margin-bottom:10px;">
      <div class="value">Faucet</div>
      <div class="label">Claim free ${CONFIG.FAUCETPAY_CURRENCY} every ${Math.round(CONFIG.CLAIM_INTERVAL_SECONDS / 60)} min</div>
    </div>
    <div class="stat-box" style="flex:1 1 45%; margin-bottom:10px;">
      <div class="value">PTC Ads</div>
      <div class="label">Watch ads, earn on every view</div>
    </div>
    <div class="stat-box" style="flex:1 1 45%;">
      <div class="value">Dice &amp; Wager</div>
      <div class="label">Provably random mini-games</div>
    </div>
    <div class="stat-box" style="flex:1 1 45%;">
      <div class="value">Referrals</div>
      <div class="label">Earn ${CONFIG.REFERRAL_COMMISSION_PERCENT}% of every referral's claims, for life</div>
    </div>
  </div>
</div>

<div class="card">
  <h3>Why ${CONFIG.SITE_NAME}?</h3>
  <ul class="muted" style="margin:0; padding-left:18px; line-height:1.9;">
    <li>Instant, automatic deposits via CCPayment</li>
    <li>Transparent, tiered withdrawal limits that grow with your account</li>
    <li>Secure sessions and anti-bot protection on every claim</li>
  </ul>
</div>

<div class="card center">
  <p class="muted">Ready to start earning ${CONFIG.FAUCETPAY_CURRENCY}?</p>
  <a href="/login" class="btn">Get Started — It's Free</a>
</div>
`;

  return layout(body, { title: CONFIG.SITE_NAME, showNav: false });
}
