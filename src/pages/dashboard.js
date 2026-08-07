import { CONFIG } from '../config.js';
import { layout } from '../lib/render.js';
import { fmtDoge } from '../lib/util.js';
import { getLevelInfo } from '../lib/functions.js';

export function renderDashboard({ user, withdrawals }) {
  const refLink = `${CONFIG.SITE_URL}/login?ref=${user.id}`;
  const levelInfo = getLevelInfo(user.total_deposited);
  const remainingToday = Math.max(0, levelInfo.dailyWithdrawalLimit - user.withdrawn_today);

  const nextLevel = CONFIG.LEVELS.find((t) => t.level === levelInfo.level + 1);
  const nextLevelNote = nextLevel
    ? `<p class="muted">Deposit ${fmtDoge(nextLevel.minTotalDeposit - user.total_deposited)} more ${CONFIG.FAUCETPAY_CURRENCY} to reach Level ${nextLevel.level} (daily limit ${fmtDoge(nextLevel.dailyWithdrawalLimit)} ${CONFIG.FAUCETPAY_CURRENCY}).</p>`
    : `<p class="muted">You have reached the highest account level.</p>`;

  const historyTable = withdrawals.length
    ? `<table><tr><th>Amount</th><th>Status</th><th>Date</th></tr>${withdrawals
        .map((w) => `<tr><td>${fmtDoge(w.amount)}</td><td>${w.status}</td><td>${w.created_at}</td></tr>`)
        .join('')}</table>`
    : `<p class="muted">No withdrawals yet.</p>`;

  const referralBox = CONFIG.REFERRAL_ENABLED ? `
<div class="referral-box card">
    <h3>Referral Program</h3>
    <p class="muted">Earn ${CONFIG.REFERRAL_COMMISSION_PERCENT}% of every claim made by users you refer.</p>
    <p>Total Referrals: <b>${user.referral_count}</b></p>
    <p>Total Referral Earnings: <b>${fmtDoge(user.referral_earnings)} ${CONFIG.FAUCETPAY_CURRENCY}</b></p>
    <div class="referral-link">
        <span id="refLink">${refLink}</span>
        <button onclick="navigator.clipboard.writeText(document.getElementById('refLink').textContent)" class="btn btn-outline" style="width:auto; padding:8px 14px;">Copy</button>
    </div>
</div>` : '';

  const body = `
<h1 class="title">Dashboard</h1>


<script src="https://pl27826792.effectivecpmnetwork.com/64/a9/f2/64a9f2bcf58f9cc6510ef86dfd4b9dc2.js"></script>




<div class="card">
    <div class="stat-row">
        <div class="stat-box">
            <div class="value">${fmtDoge(user.balance)}</div>
            <div class="label">Balance (${CONFIG.FAUCETPAY_CURRENCY})</div>
        </div>
        <div class="stat-box">
            <div class="value"><span class="badge">Level ${levelInfo.level}</span></div>
            <div class="label">Account Tier</div>
        </div>
    </div>
    <hr class="divider">
    <p class="muted">Signed in as ${user.email}</p>
    <p class="muted">Lifetime deposits: ${fmtDoge(user.total_deposited)} ${CONFIG.FAUCETPAY_CURRENCY}</p>
    ${nextLevelNote}
</div>


<script async="async" data-cfasync="false" src="https://pl27850433.effectivecpmnetwork.com/f078c83005d88bd6d5ca59bed3accc42/invoke.js"></script>
<div id="container-f078c83005d88bd6d5ca59bed3accc42"></div>


<script src="https://pl27826838.effectivecpmnetwork.com/87/03/5b/87035b6aea8c7569ecd3e7726bfcf2ba.js"></script>



<div class="card">
    <h3>Withdraw to FaucetPay</h3>
    <p id="wStatus"></p>
    <label for="wAmount">Amount</label>
    <input type="number" step="0.00000001" id="wAmount" placeholder="e.g. ${fmtDoge(CONFIG.MIN_WITHDRAWAL_AMOUNT)}">
    <button id="wBtn" class="btn">Request Withdrawal</button>
    <p class="muted" style="margin-top:10px;">
        Minimum: ${fmtDoge(CONFIG.MIN_WITHDRAWAL_AMOUNT)} ${CONFIG.FAUCETPAY_CURRENCY} ·
        Remaining daily allowance: ${fmtDoge(remainingToday)} ${CONFIG.FAUCETPAY_CURRENCY} (Level ${levelInfo.level} limit: ${fmtDoge(levelInfo.dailyWithdrawalLimit)} ${CONFIG.FAUCETPAY_CURRENCY}/day)
    </p>
</div>




<div class="card">
    <h3>Withdrawal History</h3>
    ${historyTable}
</div>
${referralBox}

<p class="center"><a href="/logout" class="muted">Sign out</a></p>

<script>
document.getElementById('wBtn').addEventListener('click', async () => {
    const amount = document.getElementById('wAmount').value;
    const status = document.getElementById('wStatus');
    status.innerHTML = '';
    if (!amount || parseFloat(amount) <= 0) {
        status.innerHTML = '<div class="alert alert-error">Please enter a valid amount.</div>';
        return;
    }
    const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'amount=' + encodeURIComponent(amount)
    });
    const data = await res.json();
    status.innerHTML = data.ok
        ? '<div class="alert alert-success">' + data.message + '</div>'
        : '<div class="alert alert-error">' + data.message + '</div>';
    if (data.ok) setTimeout(() => location.reload(), 1500);
});
</script>`; 

  return layout(body, { title: 'Dashboard · ' + CONFIG.SITE_NAME, activePath: '/dashboard' });
}
