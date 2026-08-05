import { CONFIG } from '../config.js';
import { layout } from '../lib/render.js';
import { fmtDoge } from '../lib/util.js';

export function renderDeposit() {
  const body = `
<h1 class="title">Deposit ${CONFIG.FAUCETPAY_CURRENCY}</h1>
<p class="tagline">Automatic deposits via CCPayment — your balance updates as soon as the transaction is confirmed on-chain.</p>

<div class="card">
    <p id="loadStatus" class="muted center">Loading your deposit address...</p>
    <div id="addrBox" style="display:none;">
        <div class="alert alert-warn">This is your permanent ${CONFIG.FAUCETPAY_CURRENCY} deposit address. Send any amount ≥ ${fmtDoge(CONFIG.MIN_DEPOSIT_AMOUNT)} ${CONFIG.FAUCETPAY_CURRENCY} — your balance is credited automatically, no manual review needed.</div>
        <label>Your Deposit Address</label>
        <div class="address-box">
            <span id="depositAddress"></span>
            <button onclick="navigator.clipboard.writeText(document.getElementById('depositAddress').textContent)" class="btn btn-outline" style="width:auto; padding:6px 12px;">Copy</button>
        </div>
        <div id="memoRow" style="display:none; margin-top:10px;">
            <label>Memo / Tag (required — deposits without it may be lost)</label>
            <div class="address-box">
                <span id="depositMemo"></span>
                <button onclick="navigator.clipboard.writeText(document.getElementById('depositMemo').textContent)" class="btn btn-outline" style="width:auto; padding:6px 12px;">Copy</button>
            </div>
        </div>
    </div>
    <p id="errStatus"></p>
</div>

<script>
(async function () {
  const loadStatus = document.getElementById('loadStatus');
  const errStatus = document.getElementById('errStatus');
  try {
    const res = await fetch('/api/deposit/address');
    const data = await res.json();
    if (!data.ok) {
      loadStatus.style.display = 'none';
      errStatus.innerHTML = '<div class="alert alert-error">' + (data.message || 'Could not load deposit address.') + '</div>';
      return;
    }
    loadStatus.style.display = 'none';
    document.getElementById('addrBox').style.display = 'block';
    document.getElementById('depositAddress').textContent = data.address;
    if (data.memo) {
      document.getElementById('memoRow').style.display = 'block';
      document.getElementById('depositMemo').textContent = data.memo;
    }
  } catch (e) {
    loadStatus.style.display = 'none';
    errStatus.innerHTML = '<div class="alert alert-error">Network error. Please refresh.</div>';
  }
})();
</script>`;

  return layout(body, { title: 'Deposit · ' + CONFIG.SITE_NAME, activePath: '/deposit' });
}
