import { CONFIG } from '../config.js';
import { renderAdsSection, renderAdPopup, AD_POPUP_CSS } from './ads.js';

export const STYLE_CSS = `
:root {
    --bg: #0a0e1a; --panel: #10182b; --border: #223052;
    --gold: #c9a24b; --gold-light: #e6c976; --blue: #4a7dc9;
    --green: #3fae6a; --red: #c14b4b;
    --text: #e8ecf5; --muted: #8b96b0;
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
${AD_POPUP_CSS}
`;
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/faucet', label: 'Faucet' },
  { href: '/dice', label: 'Dice' },
  { href: '/bet', label: 'Wager' },
  { href: '/deposit', label: 'Deposit' },
  { href: '/ptc', label: 'PTC' }
];

function navHtml(activePath) {
  const links = NAV_ITEMS.map(
    (item) => `<a href="${item.href}" class="${item.href === activePath ? 'active' : ''}">${item.label}</a>`
  ).join('\n');
  return `<nav class="bottom-nav">${links}</nav>`;
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
  const adsHtml = CONFIG.ADS_ENABLED ? renderAdsSection(adCount) : '';
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
${bodyHtml}
${adsHtml}
</div>
${showNav ? navHtml(opts.activePath) : ''}
${popupHtml}
</body>
</html>`;
}
