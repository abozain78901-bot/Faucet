import { CONFIG } from '../config.js';
import { layout } from '../lib/render.js';
import { fmtDoge } from '../lib/util.js';

export function renderFaucet({ user, secondsLeft, canClaim }) {
  const captchaHtml = CONFIG.CAPTCHA_ENABLED
    ? `<div class="cf-turnstile" data-sitekey="${CONFIG.TURNSTILE_SITE_KEY}" data-callback="onCaptchaSolved" style="margin-bottom:12px;"></div>`
    : '';

  const body = `
<h1 class="title">Dogecoin Faucet</h1>
<p class="tagline">Claim a reward once every ${Math.round(CONFIG.CLAIM_INTERVAL_SECONDS / 60)} minutes.</p>

<script>
  atOptions = {
    'key' : '2069ca0b4b7f43c398a4b51f7559c006',
    'format' : 'iframe',
    'height' : 600,
    'width' : 160,
    'params' : {}
  };
</script>
<script src="https://www.highperformanceformat.com/2069ca0b4b7f43c398a4b51f7559c006/invoke.js"></script>



<div class="card">
    <div class="stat-row">
        <div class="stat-box">
            <div class="value">${fmtDoge(user.balance)}</div>
            <div class="label">Balance (${CONFIG.FAUCETPAY_CURRENCY})</div>
        </div>
        <div class="stat-box">
            <div class="value">${user.claims_today}/${CONFIG.MAX_CLAIMS_PER_DAY}</div>
            <div class="label">Claims Today</div>
        </div>
    </div>
</div>


<script src="https://pl27826838.effectivecpmnetwork.com/87/03/5b/87035b6aea8c7569ecd3e7726bfcf2ba.js"></script>


<div class="card">
    <p id="statusMsg"></p>
    <div class="countdown" id="countdown">${canClaim ? 'Ready to claim' : 'Next claim available in: ' + fmtMMSS(secondsLeft)}</div>
    ${captchaHtml}
    
    <button id="claimBtn" class="btn" ${canClaim ? '' : 'disabled'}>Claim Reward</button>
    <p class="muted center" style="margin-top:12px;">
        Reward range: ${fmtDoge(CONFIG.CLAIM_MIN_AMOUNT)} – ${fmtDoge(CONFIG.CLAIM_MAX_AMOUNT)} ${CONFIG.FAUCETPAY_CURRENCY} per claim.
    </p>
</div>



<script>
  atOptions = {
    'key' : '62dd2833ffddeabe6909f16df83f3d25',
    'format' : 'iframe',
    'height' : 60,
    'width' : 468,
    'params' : {}
  };
</script>
<script src="https://www.highperformanceformat.com/62dd2833ffddeabe6909f16df83f3d25/invoke.js"></script>



<script>
let secondsLeft = ${secondsLeft};
let canClaim = ${canClaim};
let captchaToken = '';
function onCaptchaSolved(token) { captchaToken = token; }

function tick() {
    const el = document.getElementById('countdown');
    const btn = document.getElementById('claimBtn');
    if (secondsLeft <= 0) {
        canClaim = true;
        el.textContent = 'Ready to claim';
        btn.disabled = false;
        return;
    }
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const s = String(secondsLeft % 60).padStart(2, '0');
    el.textContent = 'Next claim available in: ' + m + ':' + s;
    secondsLeft--;
    setTimeout(tick, 1000);
}
tick();

document.getElementById('claimBtn').addEventListener('click', async () => {
    if (!canClaim) return;
    const btn = document.getElementById('claimBtn');
    const statusMsg = document.getElementById('statusMsg');
    btn.disabled = true;
    statusMsg.innerHTML = '';
    try {
        const res = await fetch('/api/claim', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: 'captcha_token=' + encodeURIComponent(captchaToken)
        });
        const data = await res.json();
        if (data.ok) {
            statusMsg.innerHTML = '<div class="alert alert-success">Reward credited: ' + data.amount + ' ${CONFIG.FAUCETPAY_CURRENCY}.</div>';
            secondsLeft = ${CONFIG.CLAIM_INTERVAL_SECONDS};
            canClaim = false;
            tick();
        } else {
            statusMsg.innerHTML = '<div class="alert alert-error">' + data.message + '</div>';
            btn.disabled = false;
        }
    } catch (e) {
        statusMsg.innerHTML = '<div class="alert alert-error">A network error occurred. Please try again.</div>';
        btn.disabled = false;
    }
});
</script>`; 



  return layout(body, { title: 'Faucet · ' + CONFIG.SITE_NAME, activePath: '/faucet' });
}

function fmtMMSS(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}
