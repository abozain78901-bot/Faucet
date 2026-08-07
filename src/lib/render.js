import { CONFIG } from '../config.js';
import { renderAdsSection, renderAdPopup, AD_POPUP_CSS } from './ads.js';

export const STYLE_CSS = `
:root {
  --bg-color: #ffffff;
  --text-color: #333333;
}

body.dark-mode {
  --bg-color: #0f172a;
  --text-color: #ffffff;
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.side-nav {
  background-color: var(--bg-color);
}
 
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--text); font-family: Georgia, 'Times New Roman', serif; margin: 0; padding-bottom: 90px; }
.wrap { max-width: 480px; margin: 0 auto; padding: 24px 18px; }
h1, h2, h3 { margin: 0 0 8px; font-family: Georgia, serif; font-weight: 600; }
.title { text-align: center; font-size: 1.6rem; font-weight: 700; color: var(--gold-light); letter-spacing: 0.5px; margin-bottom: 4px; }
.tagline { text-align: center; color: var(--muted); margin-bottom: 24px; font-size: 0.9rem; font-style: italic; }
.card { background: var(--panel); border: 1px solid var(--border); border-radius: 6px; padding: 18px; margin-bottom: 18px; }
.stat-row { display: flex; gap: 12px; }
.stat-box { flex: 1; background: #0d1424; border: 1px solid var(--border); border-radius: 4px; padding: 14px; text-align: center; }
.stat-box .value { font-size: 1.2rem; font-weight: 700; color: var(--gold-light); }
.stat-box .label { color: var(--muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
input[type=text], input[type=email], input[type=number] { width: 100%; padding: 13px; border-radius: 4px; border: 1px solid var(--border); background: #0d1424; color: var(--text); font-size: 1rem; margin-bottom: 12px; font-family: inherit; }
label { display: block; font-size: 0.85rem; color: var(--muted); margin-bottom: 6px; }
.btn { display: block; width: 100%; padding: 14px; border: 1px solid var(--gold); border-radius: 4px; font-weight: 700; font-size: 0.95rem; cursor: pointer; color: var(--bg); text-align: center; text-decoration: none; background: var(--gold); letter-spacing: 0.3px; }
.btn-outline { background: transparent; color: var(--gold-light); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.countdown { text-align: center; color: var(--blue); font-weight: 700; margin: 12px 0; font-size: 0.95rem; }
table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 0.9rem; }
th, td { padding: 9px; text-align: center; border-bottom: 1px solid var(--border); }
th { background: #17223c; color: var(--gold-light); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; }
.roll-display { text-align: center; font-size: 2.2rem; font-weight: 700; letter-spacing: 4px; background: #0d1424; border: 1px solid var(--gold); border-radius: 4px; padding: 20px; color: var(--gold-light); margin-bottom: 16px; }
.alert { padding: 12px; border-radius: 4px; margin-bottom: 12px; font-size: 0.88rem; border: 1px solid; }
.alert-success { background: rgba(63,174,106,.12); border-color: var(--green); color: var(--green); }
.alert-error { background: rgba(193,75,75,.12); border-color: var(--red); color: #e08585; }
.alert-warn { background: rgba(201,162,75,.12); border-color: var(--gold); color: var(--gold-light); }
.referral-box { background: #0d1424; border: 1px solid var(--border); border-radius: 6px; padding: 18px; }
.referral-link, .address-box { background: #0d1424; border: 1px solid var(--border); border-radius: 4px; padding: 10px; word-break: break-all; font-size: 0.82rem; display: flex; justify-content: space-between; align-items: center; gap: 8px; font-family: monospace; }
.bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: var(--panel); border-top: 1px solid var(--border); display: flex; max-width: 480px; margin: 0 auto; }
.bottom-nav a { flex: 1; text-align: center; padding: 11px 0; color: var(--muted); text-decoration: none; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.3px; }
.bottom-nav a.active { color: var(--gold-light); }
.muted { color: var(--muted); font-size: 0.83rem; }
.center { text-align: center; }
.divider { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
.badge { display: inline-block; background: var(--gold); color: var(--bg); padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
.site-logo { width: 34px; height: 34px; border-radius: 50%; vertical-align: middle; margin-right: 8px; }
.telegram-float { position: fixed; bottom: 80px; right: 16px; z-index: 9997; display: flex; flex-direction: column; align-items: center; text-decoration: none; }
.telegram-float .tg-btn { width: 54px; height: 54px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,.4); }
.telegram-float .tg-btn svg { width: 28px; height: 28px; fill: #fff; }
.telegram-float .tg-label { margin-top: 4px; color: #22c55e; font-size: 0.7rem; font-weight: 700; text-align: center; text-shadow: 0 1px 3px rgba(0,0,0,.8); max-width: 70px; line-height: 1.2; } 


/* زر الثلاث خطوط */
.menu-toggle {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1001;
  background: #e8f5e9; /* أخضر باهت جداً */
  border: 1px solid #c8e6c9;
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
  background-color: #2e7d32; /* لون الخطوط أخضر داكن وواضح */
  border-radius: 2px;
  transition: 0.3s;
}

/* القائمة الجانبية على اليسار */
.side-nav {
  position: fixed;
  top: 0;
  left: -280px; /* مخفية بالكامل خارج الشاشة من اليسار */
  width: 260px;
  height: 100vh;
  background-color: #0f172a;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  transition: left 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

/* عند فتح القائمة */
.side-nav.open {
  left: 0;
}

/* عنوان القائمة */
.nav-header {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2e7d32;
  margin-bottom: 25px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e8f5e9;
}

/* حاوية الروابط */
.nav-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* تصميم الأزرار (أخضر باهت) */
.side-nav .nav-btn {
  display: block;
  padding: 12px 16px;
  background-color: #e8f5e9; /* أخضر باهت */
  color: #1b5e20; /* نص أخضر غامق لضمان وضوح القراءة */
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.2s;
}

/* تأثير عند المرور بالفأرة أو الضغط */
.side-nav .nav-btn:hover {
  background-color: #c8e6c9; /* أخضر باهت أغمق قليلاً عند التحويم */
  transform: translateX(4px);
}

/* زر الصفحة الحالية (Active) */
.side-nav .nav-btn.active {
  background-color: #a5d6a7;
  font-weight: bold;
  border-left: 4px solid #2e7d32;
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

  return `
    <!-- زر الثلاث خطوط -->
    <button class="menu-toggle" onclick="toggleSidebar()">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- القائمة الجانبية على اليسار -->
    <nav class="side-nav" id="sideNav">
      <div class="nav-header">Menu</div>
      <div class="nav-links">
        ${links}
      </div>
    </nav>

    <!-- جافاسكريبت بسيط للتحكم بالفتح والإغلاق -->
    <script>
      function toggleSidebar() {
        const nav = document.getElementById('sideNav');
        nav.classList.toggle('open');
      }
    </script>
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
</head>
<body>
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
