import { CONFIG } from '../config.js';
import { fmtDoge } from '../lib/util.js';

/** Plain, self-contained page — no shared nav/footer, this is an internal tool. */
export function renderAdmin({ pendingDeposits }) {
  const rows = pendingDeposits.length
    ? pendingDeposits.map((d) => `
      <tr>
        <td>${d.id}</td>
        <td>${d.email}</td>
        <td>${fmtDoge(d.amount)}</td>
        <td style="font-family:monospace; font-size:0.75rem;">${d.tx_hash || '—'}</td>
        <td style="font-family:monospace; font-size:0.75rem;">${d.sender_wallet || '—'}</td>
        <td style="font-family:monospace; font-size:0.75rem;">${d.address_shown}</td>
        <td>${d.created_at}</td>
        <td>
          <form method="post" action="/admin/approve" style="display:inline;">
            <input type="hidden" name="deposit_id" value="${d.id}">
            <button type="submit" style="background:#3fae6a;color:#fff;border:none;padding:6px 10px;border-radius:4px;">Approve</button>
          </form>
          <form method="post" action="/admin/reject" style="display:inline;">
            <input type="hidden" name="deposit_id" value="${d.id}">
            <button type="submit" style="background:#c14b4b;color:#fff;border:none;padding:6px 10px;border-radius:4px;">Reject</button>
          </form>
        </td>
      </tr>`).join('')
    : `<tr><td colspan="8" style="text-align:center;color:#888;">No pending deposits.</td></tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Admin · ${CONFIG.SITE_NAME}</title>
<style>
body { font-family: sans-serif; background: #10182b; color: #e8ecf5; padding: 20px; }
table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
th, td { border: 1px solid #223052; padding: 8px; text-align: left; }
th { background: #17223c; }
h1 { color: #e6c976; }
</style></head>
<body>
<h1>Pending Deposit Reviews</h1>
<table>
<tr><th>ID</th><th>Email</th><th>Amount</th><th>Tx Hash</th><th>Sender Wallet</th><th>Address Shown</th><th>Submitted</th><th>Action</th></tr>
${rows}
</table>
</body></html>`;
}
