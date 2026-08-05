import { CONFIG } from '../config.js';
import { layout } from '../lib/render.js';
import { fmtDoge } from '../lib/util.js';

export function renderDice({ user, secondsLeft, canRoll, underDailyLimit }) {
  const rollTableRows = CONFIG.ROLL_TABLE.map(
    (tier) => `<tr><td>${tier.min}-${tier.max}</td><td>${fmtDoge(tier.reward)} ${CONFIG.FAUCETPAY_CURRENCY}</td></tr>`
  ).join('\n');

  const padLen = String(CONFIG.ROLL_MAX).length;
  const countdownHtml = !underDailyLimit
    ? `<div class="countdown">Daily roll limit reached</div>`
    : `<div class="countdown" id="countdown">${canRoll ? 'Ready to roll' : 'Next roll available in: ' + fmtMMSS(secondsLeft)}</div>`;

  const body = `
<h1 class="title">Dice Draw</h1>
<p class="tagline">One draw permitted every ${Math.round(CONFIG.ROLL_INTERVAL_SECONDS / 60)} minutes.</p>


<script src="https://pl27826792.effectivecpmnetwork.com/64/a9/f2/64a9f2bcf58f9cc6510ef86dfd4b9dc2.js"></script>






<div class="card">
    <div class="stat-row">
        <div class="stat-box">
            <div class="value">${fmtDoge(user.balance)}</div>
            <div class="label">Balance</div>
        </div>
        <div class="stat-box">
            <div class="value">${user.rolls_today}/${CONFIG.MAX_ROLLS_PER_DAY}</div>
            <div class="label">Draws Today</div>
        </div>
    </div>
</div>



<script src="https://pl27826838.effectivecpmnetwork.com/87/03/5b/87035b6aea8c7569ecd3e7726bfcf2ba.js"></script>





<div class="card">
    <table>
        <tr><th>Result Range</th><th>Reward</th></tr>
        ${rollTableRows}
    </table>

    <div class="roll-display" id="rollDisplay">${'0'.repeat(padLen)}</div>
    ${countdownHtml}
    <p id="rollStatus"></p>
    <button id="rollBtn" class="btn" ${canRoll ? '' : 'disabled'}>Draw</button>
</div>


<script async="async" data-cfasync="false" src="https://pl27850433.effectivecpmnetwork.com/f078c83005d88bd6d5ca59bed3accc42/invoke.js"></script>
<div id="container-f078c83005d88bd6d5ca59bed3accc42"></div>



<script>
let secondsLeft = ${secondsLeft};
let canRoll = ${canRoll};
const dailyLimitReached = ${!underDailyLimit};

function tick() {
    if (dailyLimitReached) return;
    const el = document.getElementById('countdown');
    const btn = document.getElementById('rollBtn');
    if (secondsLeft <= 0) {
        canRoll = true;
        el.textContent = 'Ready to roll';
        btn.disabled = false;
        return;
    }
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const s = String(secondsLeft % 60).padStart(2, '0');
    el.textContent = 'Next roll available in: ' + m + ':' + s;
    secondsLeft--;
    setTimeout(tick, 1000);
}
tick();

document.getElementById('rollBtn').addEventListener('click', async () => {
    if (!canRoll) return;
    const btn = document.getElementById('rollBtn');
    const status = document.getElementById('rollStatus');
    const display = document.getElementById('rollDisplay');
    btn.disabled = true;
    status.innerHTML = '';
    try {
        const res = await fetch('/api/roll', { method: 'POST' });
        const data = await res.json();
        if (!data.ok) {
            status.innerHTML = '<div class="alert alert-error">' + data.message + '</div>';
            btn.disabled = false;
            return;
        }
        display.textContent = String(data.roll).padStart(${padLen}, '0');
        status.innerHTML = data.reward > 0
            ? '<div class="alert alert-success">Reward credited: ' + data.reward + ' ${CONFIG.FAUCETPAY_CURRENCY}.</div>'
            : '<div class="alert alert-error">No reward this round.</div>';
        if (data.rolls_left > 0) {
            secondsLeft = ${CONFIG.ROLL_INTERVAL_SECONDS};
            canRoll = false;
            tick();
        } else {
            btn.textContent = 'Daily limit reached';
        }
    } catch (e) {
        status.innerHTML = '<div class="alert alert-error">A network error occurred. Please try again.</div>';
        btn.disabled = false;
    }
});
</script>



<script>
  atOptions = {
    'key' : '4c1c05cc3769478251a0e23cc9f6989f',
    'format' : 'iframe',
    'height' : 300,
    'width' : 160,
    'params' : {}
  };
</script>
<script src="https://www.highperformanceformat.com/4c1c05cc3769478251a0e23cc9f6989f/invoke.js"></script>`;

  return layout(body, { title: 'Dice · ' + CONFIG.SITE_NAME, activePath: '/dice' });
}

function fmtMMSS(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}
