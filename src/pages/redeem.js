import { CONFIG } from '../config.js';
import { layout } from '../lib/render.js';

export function renderRedeem() {
  const captchaHtml = CONFIG.CAPTCHA_ENABLED
    ? `<div class="cf-turnstile" data-sitekey="${CONFIG.TURNSTILE_SITE_KEY}" data-callback="onCaptchaSolved" style="margin-bottom:12px;"></div>`
    : '';

  const body = `
<h1 class="title">Redeem Code</h1>
<p class="tagline">Got a code from our Telegram channel? Enter it below to claim your reward.</p>

<div class="card">
    <p id="statusMsg"></p>
    <label for="codeInput">Redeem Code</label>
    <input type="text" id="codeInput" placeholder="e.g. AB3D9F2K" maxlength="${CONFIG.REDEEM_CODE_LENGTH}" style="text-transform:uppercase; letter-spacing:2px; text-align:center; font-weight:700;" autocomplete="off">
    ${captchaHtml}
    <button id="redeemBtn" class="btn">Claim</button>
</div>

<script>
let captchaToken = '';
function onCaptchaSolved(token) { captchaToken = token; }

document.getElementById('redeemBtn').addEventListener('click', async () => {
    const btn = document.getElementById('redeemBtn');
    const statusMsg = document.getElementById('statusMsg');
    const code = document.getElementById('codeInput').value.trim().toUpperCase();
    if (!code) {
        statusMsg.innerHTML = '<div class="alert alert-error">Please enter a code.</div>';
        return;
    }
    btn.disabled = true;
    statusMsg.innerHTML = '';
    try {
        const res = await fetch('/api/redeem', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: 'code=' + encodeURIComponent(code) + '&captcha_token=' + encodeURIComponent(captchaToken)
        });
        const data = await res.json();
        if (data.ok) {
            statusMsg.innerHTML = '<div class="alert alert-success">Reward credited: ' + data.amount + ' ${CONFIG.FAUCETPAY_CURRENCY}.</div>';
            document.getElementById('codeInput').value = '';
        } else {
            statusMsg.innerHTML = '<div class="alert alert-error">' + data.message + '</div>';
        }
    } catch (e) {
        statusMsg.innerHTML = '<div class="alert alert-error">A network error occurred. Please try again.</div>';
    }
    btn.disabled = false;
});
</script>`;

  return layout(body, { title: 'Redeem · ' + CONFIG.SITE_NAME, activePath: '/redeem', adCount: 3 });
}
