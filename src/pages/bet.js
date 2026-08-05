import { CONFIG } from '../config.js';
import { layout } from '../lib/render.js';
import { fmtDoge } from '../lib/util.js';

export function renderBet({ user }) {
  const rows = CONFIG.BET_OUTCOMES.map((o) => `<tr><td>25%</td><td>${o.label}</td></tr>`).join('\n');

  const body = `
<h1 class="title">Wagering</h1>
<p class="tagline">Four equally likely outcomes, selected at random on every wager.</p>



<script src="https://pl27826792.effectivecpmnetwork.com/64/a9/f2/64a9f2bcf58f9cc6510ef86dfd4b9dc2.js"></script>

<script src="https://pl27826838.effectivecpmnetwork.com/87/03/5b/87035b6aea8c7569ecd3e7726bfcf2ba.js"></script>




<script async="async" data-cfasync="false" src="https://pl27850433.effectivecpmnetwork.com/f078c83005d88bd6d5ca59bed3accc42/invoke.js"></script>
<div id="container-f078c83005d88bd6d5ca59bed3accc42"></div>


<div class="card">
    <div class="stat-row">
        <div class="stat-box">
            <div class="value">${fmtDoge(user.balance)}</div>
            <div class="label">Balance (${CONFIG.FAUCETPAY_CURRENCY})</div>
        </div>
        <div class="stat-box">
            <div class="value">3x</div>
            <div class="label">Outcome Odds</div>
        </div>
    </div>
</div>

<div class="card">
    <table>
        <tr><th>Probability</th><th>Outcome</th></tr>
        ${rows}
    </table>

    <p id="betStatus"></p>
    <label for="betAmount">Wager Amount</label>
    <input type="number" step="0.00000001" id="betAmount" placeholder="${fmtDoge(CONFIG.BET_MIN_AMOUNT)} - ${fmtDoge(CONFIG.BET_MAX_AMOUNT)}">
    <button id="betBtn" class="btn">Place Wager</button>
    <p class="muted center" style="margin-top:12px;">Minimum: ${fmtDoge(CONFIG.BET_MIN_AMOUNT)} ${CONFIG.FAUCETPAY_CURRENCY} · Maximum: ${fmtDoge(CONFIG.BET_MAX_AMOUNT)} ${CONFIG.FAUCETPAY_CURRENCY}</p>
</div>





<script>
document.getElementById('betBtn').addEventListener('click', async () => {
    const btn = document.getElementById('betBtn');
    const status = document.getElementById('betStatus');
    const amount = document.getElementById('betAmount').value;
    status.innerHTML = '';
    if (!amount || parseFloat(amount) <= 0) {
        status.innerHTML = '<div class="alert alert-error">Please enter a valid wager amount.</div>';
        return;
    }
    btn.disabled = true;
    try {
        const res = await fetch('/api/bet', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: 'amount=' + encodeURIComponent(amount)
        });
        const data = await res.json();
        if (!data.ok) {
            status.innerHTML = '<div class="alert alert-error">' + data.message + '</div>';
        } else {
            status.innerHTML = '<div class="alert ' + (data.net >= 0 ? 'alert-success' : 'alert-error') + '">' + data.label + ' — payout ' + data.payout + ' ${CONFIG.FAUCETPAY_CURRENCY} (new balance: ' + data.balance + ')</div>';
        }
    } catch (e) {
        status.innerHTML = '<div class="alert alert-error">A network error occurred. Please try again.</div>';
    }
    btn.disabled = false;
});
</script>`;

  return layout(body, { title: 'Wager · ' + CONFIG.SITE_NAME, activePath: '/bet' });
}
