import { renderPtc } from './pages/ptc.js';
import { renderPtcView } from './pages/ptc_view.js';
import { renderHome } from './pages/home.js';
import { getPermanentDepositAddress, verifyWebhookSignature } from './lib/ccpayment.js';
import { CONFIG } from './config.js';
import { STYLE_CSS } from './lib/render.js';
import {
  jsonResponse, htmlResponse, redirect, isValidEmail,
  parseFormBody, fmtDoge, nowUTC, secondsSince,
  checkBasicAuth, basicAuthChallenge,
} from './lib/util.js';
import { currentUser, createSession, clearSessionCookie, destroySession } from './lib/session.js';
import {
  getOrCreateUser, maybeResetDailyCounters, getLevelInfo, randomClaimAmount,
  playRoll, playBet, verifyCaptcha, faucetpaySend, telegramNotify,
} from './lib/functions.js';

import { renderLogin } from './pages/login.js';
import { renderFaucet } from './pages/faucet.js';
import { renderDice } from './pages/dice.js';
import { renderBet } from './pages/bet.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderDeposit } from './pages/deposit.js';
import { renderAdmin } from './pages/admin.js';

function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || '0.0.0.0';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // ---- Static asset ----
      if (path === '/assets/style.css') {
        return new Response(STYLE_CSS, { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
      }


      // ---- Maintenance mode ----
      if (!CONFIG.SITE_LIVE && !path.startsWith('/admin')) {
        return new Response(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Under Maintenance · ${CONFIG.SITE_NAME}</title>
<style>
  body { background:#0b1220; color:#e8ecf5; font-family:system-ui,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; text-align:center; padding:20px; }
  .gear { font-size:64px; display:inline-block; animation:spin 3s linear infinite; }
  @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
  h1 { margin:20px 0 10px; }
  p { color:#9aa4b8; }
</style></head>
<body>
  <div>
    <div class="gear">⚙️</div>
    <h1>We'll be right back</h1>
    <p>${CONFIG.SITE_NAME} is currently under maintenance. Please check back soon.</p>
  </div>
</body></html>`, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '3600' } });
      }
      
      // ---- Admin panel (Basic Auth, separate from user sessions) ----
      if (path.startsWith('/admin')) {
        if (!checkBasicAuth(request, env)) return basicAuthChallenge();

        if (path === '/admin' && method === 'GET') {
          const { results } = await env.DB.prepare(
            `SELECT d.*, u.email FROM deposits d JOIN users u ON u.id = d.user_id
             WHERE d.status = 'pending' ORDER BY d.id DESC`
          ).all();
          return htmlResponse(renderAdmin({ pendingDeposits: results || [] }));
        }

        if (path === '/admin/approve' && method === 'POST') {
          const form = await parseFormBody(request);
          const depositId = Number(form.deposit_id);
          const deposit = await env.DB.prepare('SELECT * FROM deposits WHERE id = ? AND status = ?')
            .bind(depositId, 'pending').first();
          if (deposit) {
            await env.DB.batch([
              env.DB.prepare('UPDATE users SET balance = balance + ?, total_deposited = total_deposited + ? WHERE id = ?')
                .bind(deposit.amount, deposit.amount, deposit.user_id),
              env.DB.prepare('UPDATE deposits SET status = ?, reviewed_at = ? WHERE id = ?')
                .bind('approved', nowUTC(), depositId),
            ]);
          }
          return redirect('/admin');
        }

        if (path === '/admin/reject' && method === 'POST') {
          const form = await parseFormBody(request);
          const depositId = Number(form.deposit_id);
          await env.DB.prepare('UPDATE deposits SET status = ?, reviewed_at = ? WHERE id = ? AND status = ?')
            .bind('rejected', nowUTC(), depositId, 'pending').run();
          return redirect('/admin');
        }

        return new Response('Not found', { status: 404 });
      }

      // ---- Public routes ----
      if (path === '/') {
        const user = await currentUser(request, env);
        if (user) return redirect('/dashboard');
        return htmlResponse(renderHome());
      }

      // ---- CCPayment webhook (public — auth is via signature, not a session) ----
      if (path === '/api/webhooks/ccpayment' && method === 'POST') {
        const rawBody = await request.text();
        const appid = request.headers.get('Appid') || '';
        const timestamp = request.headers.get('Timestamp') || '';
        const sign = request.headers.get('Sign') || '';

        const validSig = await verifyWebhookSignature(env, appid, timestamp, rawBody, sign);
        if (!validSig) return new Response('invalid signature', { status: 401 });

        let payload;
        try { payload = JSON.parse(rawBody); } catch { return new Response('bad json', { status: 400 }); }

        // Direct-deposit-to-permanent-address notifications carry: record_id, user_id, coin_symbol, amount, status ...
        const recordId = String(payload.record_id || payload.recordId || '');
        const depositUserId = Number(payload.user_id || payload.userId);
        const amount = parseFloat(payload.amount || '0');
        const status = String(payload.status || '');

        if (!recordId || !depositUserId || !(amount > 0)) {
          return new Response('success', { status: 200 }); // ack malformed/irrelevant events so CCPayment stops retrying
        }

        // Idempotency: only credit once per record_id.
        const existing = await env.DB.prepare('SELECT id FROM ccpayment_deposits WHERE record_id = ?')
          .bind(recordId).first();
        if (!existing) {
          await env.DB.batch([
            env.DB.prepare(
              'INSERT INTO ccpayment_deposits (user_id, record_id, coin_symbol, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(depositUserId, recordId, payload.coin_symbol || CONFIG.FAUCETPAY_CURRENCY, amount, status || 'confirmed', nowUTC()),
            env.DB.prepare(
              'UPDATE users SET balance = balance + ?, total_deposited = total_deposited + ? WHERE id = ?'
            ).bind(amount, amount, depositUserId),
          ]);
          await telegramNotify(
            `<b>CCPayment deposit credited</b>\n\nUser ID: ${depositUserId}\nAmount: ${fmtDoge(amount)} ${payload.coin_symbol || CONFIG.FAUCETPAY_CURRENCY}\nRecord: ${recordId}`
          );
        }

        return new Response('success', { status: 200 });
      }

      if (path === '/login' && method === 'GET') {
        const user = await currentUser(request, env);
        if (user) return redirect('/dashboard');
        return htmlResponse(renderLogin({}));
      }

      if (path === '/login' && method === 'POST') {
        const form = await parseFormBody(request);
        const email = (form.email || '').trim();
        if (!isValidEmail(email)) {
          return htmlResponse(renderLogin({ error: 'Please enter a valid FaucetPay email address.' }));
        }
        const refIdParam = url.searchParams.get('ref');
        const refId = refIdParam && /^\d+$/.test(refIdParam) ? Number(refIdParam) : null;
        const user = await getOrCreateUser(env, email, refId, clientIp(request));
        const cookie = await createSession(env, user.id);
        return redirect('/dashboard', { 'Set-Cookie': cookie });
      }

      if (path === '/logout') {
        await destroySession(request, env);
        return redirect('/login', { 'Set-Cookie': clearSessionCookie() });
      }

      // ---- Everything below requires a logged-in user ----
      let user = await currentUser(request, env);
      if (!user) {
        if (path.startsWith('/api/')) return jsonResponse({ ok: false, message: 'You must be logged in.' }, 401);
        return redirect('/login');
      }
      user = await maybeResetDailyCounters(env, user);

      // ---- Faucet ----
      if (path === '/faucet' && method === 'GET') {
        const secondsSinceLast = secondsSince(user.last_claim_at);
        const secondsLeft = Math.max(0, CONFIG.CLAIM_INTERVAL_SECONDS - (Number.isFinite(secondsSinceLast) ? secondsSinceLast : CONFIG.CLAIM_INTERVAL_SECONDS));
        const canClaim = secondsLeft <= 0 && user.claims_today < CONFIG.MAX_CLAIMS_PER_DAY;
        return htmlResponse(renderFaucet({ user, secondsLeft, canClaim }));
      }

      if (path === '/api/claim' && method === 'POST') {
        const form = await parseFormBody(request);
        if (!(await verifyCaptcha(env, form.captcha_token || '', clientIp(request)))) {
          return jsonResponse({ ok: false, message: 'Captcha verification failed. Please try again.' });
        }
        if (user.claims_today >= CONFIG.MAX_CLAIMS_PER_DAY) {
          return jsonResponse({ ok: false, message: 'Daily claim limit reached.' });
        }
        const secondsSinceLast = secondsSince(user.last_claim_at);
        if (Number.isFinite(secondsSinceLast) && secondsSinceLast < CONFIG.CLAIM_INTERVAL_SECONDS) {
          return jsonResponse({ ok: false, message: `Please wait ${CONFIG.CLAIM_INTERVAL_SECONDS - secondsSinceLast}s before claiming again.` });
        }

        const amount = randomClaimAmount();
        const now = nowUTC();
        await env.DB.batch([
          env.DB.prepare('INSERT INTO claims (user_id, amount, ip, created_at) VALUES (?, ?, ?, ?)')
            .bind(user.id, amount, clientIp(request), now),
          env.DB.prepare('UPDATE users SET balance = balance + ?, claims_today = claims_today + 1, last_claim_at = ? WHERE id = ?')
            .bind(amount, now, user.id),
        ]);

        if (CONFIG.REFERRAL_ENABLED && user.referred_by) {
          const commission = amount * (CONFIG.REFERRAL_COMMISSION_PERCENT / 100);
          await env.DB.prepare('UPDATE users SET balance = balance + ?, referral_earnings = referral_earnings + ? WHERE id = ?')
            .bind(commission, commission, user.referred_by).run();
        }

        return jsonResponse({ ok: true, amount: fmtDoge(amount) });
      }

      // ---- Dice ----
      if (path === '/dice' && method === 'GET') {
        const secondsSinceLast = secondsSince(user.last_roll_at);
        const secondsLeft = Math.max(0, CONFIG.ROLL_INTERVAL_SECONDS - (Number.isFinite(secondsSinceLast) ? secondsSinceLast : CONFIG.ROLL_INTERVAL_SECONDS));
        const underDailyLimit = user.rolls_today < CONFIG.MAX_ROLLS_PER_DAY;
        const canRoll = secondsLeft <= 0 && underDailyLimit;
        return htmlResponse(renderDice({ user, secondsLeft, canRoll, underDailyLimit }));
      }

      if (path === '/api/roll' && method === 'POST') {
        if (user.rolls_today >= CONFIG.MAX_ROLLS_PER_DAY) {
          return jsonResponse({ ok: false, message: 'Daily roll limit reached.' });
        }
        const secondsSinceLast = secondsSince(user.last_roll_at);
        if (Number.isFinite(secondsSinceLast) && secondsSinceLast < CONFIG.ROLL_INTERVAL_SECONDS) {
          return jsonResponse({ ok: false, message: `Please wait ${CONFIG.ROLL_INTERVAL_SECONDS - secondsSinceLast}s before rolling again.` });
        }

        const result = playRoll();
        const now = nowUTC();
        await env.DB.batch([
          env.DB.prepare('INSERT INTO rolls (user_id, roll_number, reward, created_at) VALUES (?, ?, ?, ?)')
            .bind(user.id, result.roll, result.reward, now),
          env.DB.prepare('UPDATE users SET balance = balance + ?, rolls_today = rolls_today + 1, last_roll_at = ? WHERE id = ?')
            .bind(result.reward, now, user.id),
        ]);

        return jsonResponse({
          ok: true, roll: result.roll, reward: fmtDoge(result.reward),
          rolls_left: CONFIG.MAX_ROLLS_PER_DAY - (user.rolls_today + 1),
        });
      }

      // ---- Wager (betting) ----
      if (path === '/bet' && method === 'GET') {
        return htmlResponse(renderBet({ user }));
      }

      if (path === '/api/bet' && method === 'POST') {
        const form = await parseFormBody(request);
        const amount = parseFloat(form.amount || '0');
        if (amount < CONFIG.BET_MIN_AMOUNT || amount > CONFIG.BET_MAX_AMOUNT) {
          return jsonResponse({ ok: false, message: `Wager must be between ${fmtDoge(CONFIG.BET_MIN_AMOUNT)} and ${fmtDoge(CONFIG.BET_MAX_AMOUNT)} ${CONFIG.FAUCETPAY_CURRENCY}.` });
        }
        if (amount > user.balance) {
          return jsonResponse({ ok: false, message: 'Insufficient balance.' });
        }

        const result = playBet(amount);
        const now = nowUTC();
        await env.DB.batch([
          env.DB.prepare('UPDATE users SET balance = balance - ? + ? WHERE id = ?')
            .bind(amount, result.payout, user.id),
          env.DB.prepare('INSERT INTO bets (user_id, bet_amount, outcome, multiplier, payout, created_at) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(user.id, amount, result.type, result.multiplier, result.payout, now),
        ]);

        const updated = await env.DB.prepare('SELECT balance FROM users WHERE id = ?').bind(user.id).first();
        return jsonResponse({
          ok: true, label: result.label, multiplier: result.multiplier,
          payout: fmtDoge(result.payout), net: result.net, balance: fmtDoge(updated.balance),
        });
      }

            // ---- PTC Ads Routes ----
      if (path === '/ptc' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT ad_id, last_clicked_at FROM ptc_clicks WHERE user_id = ?'
        ).bind(user.id).all();

        const clicksMap = {};
        if (results) {
          for (const row of results) {
            clicksMap[row.ad_id] = row.last_clicked_at;
          }
        }

        return htmlResponse(renderPtc({ user, clicksMap }));
      }

      if (path === '/ptc/view' && method === 'GET') {
        const adIdParam = url.searchParams.get('id');
        const adId = Number(adIdParam);
        
        if (!Number.isInteger(adId) || adId < 1 || adId > CONFIG.PTC_COUNT) {
          return redirect('/ptc');
        }

        const clickRecord = await env.DB.prepare(
          'SELECT last_clicked_at FROM ptc_clicks WHERE user_id = ? AND ad_id = ?'
        ).bind(user.id, adId).first();

        if (clickRecord) {
          const diffHours = (Date.now() - new Date(clickRecord.last_clicked_at).getTime()) / (1000 * 60 * 60);
          if (diffHours < CONFIG.PTC_COOLDOWN_HOURS) {
            return redirect('/ptc');
          }
        }

        return htmlResponse(renderPtcView({ adId }));
      }

      if (path === '/api/ptc/claim' && method === 'POST') {
        const form = await parseFormBody(request);
        const adId = Number(form.ad_id);

        if (!Number.isInteger(adId) || adId < 1 || adId > CONFIG.PTC_COUNT) {
          return jsonResponse({ ok: false, message: 'Invalid advertisement.' }, 400);
        }

        const clickRecord = await env.DB.prepare(
          'SELECT last_clicked_at FROM ptc_clicks WHERE user_id = ? AND ad_id = ?'
        ).bind(user.id, adId).first();

        if (clickRecord) {
          const diffHours = (Date.now() - new Date(clickRecord.last_clicked_at).getTime()) / (1000 * 60 * 60);
          if (diffHours < CONFIG.PTC_COOLDOWN_HOURS) {
            return jsonResponse({ ok: false, message: 'This ad is still in cooldown.' }, 400);
          }
        }

        const now = nowUTC();
        const reward = CONFIG.PTC_REWARD;

        await env.DB.batch([
          env.DB.prepare(
            `INSERT INTO ptc_clicks (user_id, ad_id, last_clicked_at) 
             VALUES (?, ?, ?) 
             ON CONFLICT(user_id, ad_id) 
             DO UPDATE SET last_clicked_at = ?`
          ).bind(user.id, adId, now, now),
          env.DB.prepare(
            'UPDATE users SET balance = balance + ? WHERE id = ?'
          ).bind(reward, user.id),
        ]);

        return jsonResponse({ ok: true, amount: fmtDoge(reward) });
      }

      // ---- Dashboard ----
      if (path === '/dashboard' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM withdrawals WHERE user_id = ? ORDER BY id DESC LIMIT 10'
        ).bind(user.id).all();
        return htmlResponse(renderDashboard({ user, withdrawals: results || [] }));
      }

      if (path === '/api/withdraw' && method === 'POST') {
        const form = await parseFormBody(request);
        const amount = parseFloat(form.amount || '0');
        const levelInfo = getLevelInfo(user.total_deposited);

        if (amount < CONFIG.MIN_WITHDRAWAL_AMOUNT) {
          return jsonResponse({ ok: false, message: `Minimum withdrawal is ${fmtDoge(CONFIG.MIN_WITHDRAWAL_AMOUNT)} ${CONFIG.FAUCETPAY_CURRENCY}.` });
        }
        if (amount > user.balance) {
          return jsonResponse({ ok: false, message: 'Insufficient balance.' });
        }
        if (user.withdrawn_today + amount > levelInfo.dailyWithdrawalLimit) {
          const remaining = Math.max(0, levelInfo.dailyWithdrawalLimit - user.withdrawn_today);
          return jsonResponse({ ok: false, message: `This exceeds your Level ${levelInfo.level} daily withdrawal allowance. Remaining today: ${fmtDoge(remaining)} ${CONFIG.FAUCETPAY_CURRENCY}.` });
        }

        const fee = amount * (CONFIG.WITHDRAWAL_FEE_PERCENT / 100);
        const netAmount = amount - fee;
        const now = nowUTC();

        await env.DB.batch([
          env.DB.prepare('UPDATE users SET balance = balance - ?, withdrawn_today = withdrawn_today + ? WHERE id = ?')
            .bind(amount, amount, user.id),
        ]);
        const insertResult = await env.DB.prepare(
          'INSERT INTO withdrawals (user_id, amount, status, created_at) VALUES (?, ?, ?, ?)'
        ).bind(user.id, netAmount, 'pending', now).run();
        const withdrawalId = insertResult.meta.last_row_id;

        const result = await faucetpaySend(env, user.email, netAmount);

        if (result.ok) {
          await env.DB.prepare('UPDATE withdrawals SET status = ?, faucetpay_response = ? WHERE id = ?')
            .bind('success', JSON.stringify(result.raw), withdrawalId).run();
          return jsonResponse({ ok: true, message: `Withdrawal sent: ${fmtDoge(netAmount)} ${CONFIG.FAUCETPAY_CURRENCY}.` });
        } else {
          await env.DB.batch([
            env.DB.prepare('UPDATE users SET balance = balance + ?, withdrawn_today = withdrawn_today - ? WHERE id = ?')
              .bind(amount, amount, user.id),
            env.DB.prepare('UPDATE withdrawals SET status = ?, faucetpay_response = ? WHERE id = ?')
              .bind('failed', JSON.stringify(result.raw), withdrawalId),
          ]);
          return jsonResponse({ ok: false, message: 'Withdrawal failed: ' + result.message });
        }
      }

      // ---- Deposit (CCPayment — permanent address, auto-credited via webhook) ----
      if (path === '/deposit' && method === 'GET') {
        return htmlResponse(renderDeposit());
      }

      if (path === '/api/deposit/address' && method === 'GET') {
        const cached = await env.DB.prepare(
          'SELECT address, memo FROM ccpayment_addresses WHERE user_id = ? AND chain = ?'
        ).bind(user.id, CONFIG.CCPAYMENT_CHAIN).first();

        if (cached) {
          return jsonResponse({ ok: true, address: cached.address, memo: cached.memo || '' });
        }

        const notifyUrl = CONFIG.SITE_URL + '/api/webhooks/ccpayment';
        const result = await getPermanentDepositAddress(env, user.id, notifyUrl);
        if (!result.ok) {
          return jsonResponse({ ok: false, message: result.message || 'Could not reach CCPayment.' });
        }

        await env.DB.prepare(
          'INSERT INTO ccpayment_addresses (user_id, chain, address, memo, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(user.id, CONFIG.CCPAYMENT_CHAIN, result.address, result.memo, nowUTC()).run();

        return jsonResponse({ ok: true, address: result.address, memo: result.memo });
      }

      return new Response('Not found', { status: 404 });
    } catch (err) {
      return new Response('Server error: ' + err.message, { status: 500 });
    }
  },
};
