import { CONFIG } from '../config.js';
import { renderAdsSection, renderAdPopup, AD_POPUP_CSS } from './ads.js';

/* ROUTER_JS is served as a static asset from /assets/app.js (see index.js).
 * It is intentionally NOT imported here — layout() only references its URL. */

export const STYLE_CSS = `
:root {
  /* الافتراضي هو الوضع الغامق (Dark Mode) */
  --bg-color: #0f172a;
  --panel-color: #0d1424;
  --text-color: #ffffff;
  --muted-color: #a0a0a0;
  --border-color: #1e293b;
  --gold-color: #fbbf24;
  --gold-light: #fcd34d;
}

/* عند إلغاء الوضع الغامق (أي الوضع الفاتح) تتحول المتغيرات بالكامل */
body:not(.dark-mode) {
  --bg-color: #f8fafc;
  --panel-color: #ffffff;
  --text-color: #1e293b;
  --muted-color: #64748b;
  --border-color: #e2e8f0;
  --gold-color: #d97706;
  --gold-light: #b45309;
}

* { box-sizing: border-box; }
html { -webkit-tap-highlight-color: transparent; }

body { 
  background-color: var(--bg-color); 
  color: var(--text-color); 
  font-family: Georgia, 'Times New Roman', serif; 
  margin: 0; 
  padding-bottom: 90px; 
  transition: background-color 0.3s ease, color 0.3s ease;
}

.wrap { max-width: 480px; margin: 0 auto; padding: 24px 18px; }

/* ---------- app-like page transitions (used by /assets/app.js) ---------- */
#nprogress-bar {
  position: fixed; top: 0; left: 0; height: 3px; width: 0%;
  background: linear-gradient(90deg, var(--gold-color), var(--gold-light));
  z-index: 10000; opacity: 0;
  box-shadow: 0 0 8px var(--gold-color);
}
body.spa-leaving .wrap, body.spa-leaving > .card { opacity: 0; }
body.spa-entering .wrap, body.spa-entering > .card { opacity: 0; }
.wrap { opacity: 1; transition: opacity 0.16s ease; }
@media (prefers-reduced-motion: reduce) {
  .wrap, #nprogress-bar { transition: none !important; }
}

/* click-outside-to-close backdrop for the sidebar */
.nav-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  z-index: 999; opacity: 0; pointer-events: none;
  transition: opacity 0.25s ease;
}
.nav-backdrop.show { opacity: 1; pointer-events: auto; }

/* subtle depth + smoother corners app-wide (additive, same class names) */
.card, .stat-box, .referral-box, .referral-link, .address-box {
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}
.btn { border-radius: 8px; transition: transform 0.12s ease, opacity 0.12s ease, background 0.15s ease; }
.btn:active:not(:disabled) { transform: scale(0.98); }
a, button { -webkit-tap-highlight-color: transparent; }

h1, h2, h3 { margin: 0 0 8px; font-family: Georgia, serif; font-weight: 600; color: var(--text-color); }
.title { text-align: center; font-size: 1.6rem; font-weight: 700; color: var(--gold-light); letter-spacing: 0.5px; margin-bottom: 4px; }
.tagline { text-align: center; color: var(--muted-color); margin-bottom: 24px; font-size: 0.9rem; font-style: italic; }

.card, .stat-box, .referral-box, .referral-link, .address-box { 
  background-color: var(--panel-color) !important; 
  border: 1px solid var(--border-color) !important; 
  border-radius: 6px; 
  padding: 18px; 
  margin-bottom: 18px; 
  color: var(--text-color) !important;
}

.stat-row { display: flex; gap: 12px; }
.stat-box { flex: 1; text-align: center; padding: 14px; }
.stat-box .value { font-size: 1.2rem; font-weight: 700; color: var(--gold-light); }
.stat-box .label { color: var(--muted-color); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

input[type=text], input[type=email], input[type=number] { 
  width: 100%; 
  padding: 13px; 
  border-radius: 4px; 
  border: 1px solid var(--border-color); 
  background: var(--panel-color); 
  color: var(--text-color); 
  font-size: 1rem; 
  margin-bottom: 12px; 
  font-family: inherit; 
}

label { display: block; font-size: 0.85rem; color: var(--muted-color); margin-bottom: 6px; }

.btn { display: block; width: 100%; padding: 14px; border: 1px solid var(--gold-color); border-radius: 4px; font-weight: 700; font-size: 0.95rem; cursor: pointer; color: var(--bg-color); text-align: center; text-decoration: none; background: var(--gold-color); letter-spacing: 0.3px; }
.btn-outline { background: transparent; color: var(--gold-light); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

.countdown { text-align: center; font-weight: 700; margin: 12px 0; font-size: 0.95rem; }

table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 0.9rem; color: var(--text-color); }
th, td { padding: 9px; text-align: center; border-bottom: 1px solid var(--border-color); }
th { background: var(--panel-color); color: var(--gold-light); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; }

.roll-display { text-align: center; font-size: 2.2rem; font-weight: 700; letter-spacing: 4px; background: var(--panel-color); border: 1px solid var(--gold-color); border-radius: 4px; padding: 20px; color: var(--gold-light); margin-bottom: 16px; }

.alert { padding: 12px; border-radius: 4px; margin-bottom: 12px; font-size: 0.88rem; border: 1px solid; }
.alert-success { background: rgba(63,174,106,.12); border-color: #3fae6a; color: #3fae6a; }
.alert-error { background: rgba(193,75,75,.12); border-color: #c14b4b; color: #e08585; }
.alert-warn { background: rgba(201,162,75,.12); border-color: var(--gold-color); color: var(--gold-light); }

.referral-link, .address-box { word-break: break-all; font-size: 0.82rem; display: flex; justify-content: space-between; align-items: center; gap: 8px; font-family: monospace; }

.muted { color: var(--muted-color); font-size: 0.83rem; }
.center { text-align: center; }
.divider { border: none; border-top: 1px solid var(--border-color); margin: 16px 0; }
.badge { display: inline-block; background: var(--gold-color); color: var(--bg-color); padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
.site-logo { width: 34px; height: 34px; border-radius: 50%; vertical-align: middle; margin-right: 8px; }

.telegram-float { position: fixed; bottom: 80px; right: 16px; z-index: 9997; display: flex; flex-direction: column; align-items: center; text-decoration: none; }
.telegram-float .tg-btn { width: 54px; height: 54px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,.4); }
.telegram-float .tg-btn svg { width: 28px; height: 28px; fill: #fff; }
.telegram-float .tg-label { margin-top: 4px; color: #22c55e; font-size: 0.7rem; font-weight: 700; text-align: center; text-shadow: 0 1px 3px rgba(0,0,0,.8); max-width: 70px; line-height: 1.2; } 

/* زر الثلاث خطوط */
.menu-toggle {
  position: fixed;
  top: 50px;
  left: 40px;
  z-index: 1001;
  background: var(--panel-color);
  border: 1px solid var(--border-color);
  padding: 10px;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.menu-toggle span {
  display: block;
  width: 25px;
  height: 3px;
  background-color: var(--text-color);
  border-radius: 2px;
  transition: 0.3s;
}

/* القائمة الجانبية على اليسار */
.side-nav {
  position: fixed;
  top: 0;
  left: -280px;
  width: 260px;
  height: 100vh;
  background-color: var(--panel-color);
  border-right: 1px solid var(--border-color);
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: left 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.side-nav.open {
  left: 0;
}

.nav-header {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 25px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side-nav .nav-btn {
  display: block;
  padding: 12px 16px;
  background-color: var(--bg-color);
  color: var(--text-color);
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  border: 1px solid var(--border-color);
  transition: background-color 0.2s, transform 0.2s;
}

.side-nav .nav-btn:hover {
  background-color: var(--border-color);
  transform: translateX(4px);
}

.side-nav .nav-btn.active {
  background-color: var(--border-color);
  font-weight: bold;
  border-left: 4px solid var(--gold-color);
}

${AD_POPUP_CSS}
`;

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard 🏠' },
  { href: '/faucet', label: 'Faucet 💧' },
  { href: '/dice', label: 'Dice 🎲' },
  { href: '/bet', label: 'Wager 🎰' },
  { href: '/ptc', label: 'PTC ​🖱️' }, 
  { href: '/redeem', label: 'Redeem 🎁' },
  { href: '/deposit', label: 'Deposit 💳' },
];

function navHtml(activePath) {
  const links = NAV_ITEMS.map(
    (item) => `<a href="${item.href}" class="nav-btn ${item.href === activePath ? 'active' : ''}">${item.label}</a>`
  ).join('');

  // Behavior for these two buttons (toggleSidebar / toggleTheme) lives in the
  // single shared /assets/app.js so it keeps working identically across
  // client-side navigations, not just on a hard page load.
  return `
    <!-- زر الثلاث خطوط -->
    <button class="menu-toggle" onclick="toggleSidebar()" aria-label="Menu">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- خلفية شفافة لإغلاق القائمة عند الضغط خارجها -->
    <div class="nav-backdrop" id="navBackdrop"></div>

    <!-- القائمة الجانبية على اليسار -->
    <nav class="side-nav" id="sideNav">
      <div class="nav-header">
        <span>Menu</span>
        <!-- زر الشمس/القمر -->
        <button id="themeToggleBtn" onclick="toggleTheme()" aria-label="Toggle theme" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">🌙</button>
      </div>
      <div class="nav-links">
        ${links}
      </div>
    </nav>
  `;
}

export function layout(bodyHtml, opts = {}) {
  const title = opts.title || CONFIG.SITE_NAME;
  const showNav = opts.showNav !== false;
  const turnstileScript = CONFIG.CAPTCHA_ENABLED
    ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>'
    : '';
  const favicon = CONFIG.SITE_LOGO_DATA_URI
    ? `<link rel="icon" href="${CONFIG.SITE_LOGO_DATA_URI}">`
    : '';

  const adCount = opts.adCount ?? (CONFIG.ADS_ENABLED ? CONFIG.ADS_PER_PAGE : 0);
  const topCount = Math.floor(adCount / 2);
  const bottomCount = adCount - topCount;
  const adsTopHtml = CONFIG.ADS_ENABLED ? renderAdsSection(topCount, 'Sponsored') : '';
  const adsBottomHtml = CONFIG.ADS_ENABLED ? renderAdsSection(bottomCount, 'Sponsored') : '';
  const popupHtml = (CONFIG.ADS_ENABLED && opts.showPopup !== false) ? renderAdPopup() : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta name="bitmedia-site-verification" content="05e8a7445ae4c4d4b5e6e19a056467de" />
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${favicon}
<link rel="stylesheet" href="/assets/style.css">
${turnstileScript}
<script src="/assets/app.js" defer></script>
</head>
<body>
<div id="nprogress-bar"></div>
<div class="wrap">
${adsTopHtml}
${bodyHtml}
${adsBottomHtml}
</div>
${showNav ? navHtml(opts.activePath) : ''}
<a href="https://t.me/faucet_dog" target="_blank" rel="noopener" class="telegram-float">
  <div class="tg-btn">
    <svg viewBox="0 0 24 24"><path d="M22.05 2.94a1.5 1.5 0 0 0-1.53-.24L1.9 9.9a1.4 1.4 0 0 0 .1 2.64l4.7 1.47 1.82 5.84a1.3 1.3 0 0 0 2.16.5l2.7-2.55 4.62 3.4a1.4 1.4 0 0 0 2.23-.85l3.1-15.4a1.5 1.5 0 0 0-.28-1.01ZM8.6 13.3l9.4-6.16-7.6 7.9-.3 3.1-1.5-4.84Z"/></svg>
  </div>
  <span class="tg-label">Join for a bonus</span>
</a>
${popupHtml}
</body>
</html>`;
}
