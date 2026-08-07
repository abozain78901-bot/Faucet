import { CONFIG } from '../config.js';
import { secureRandomInt, nowUTC, secondsSince } from './util.js';

export async function getOrCreateUser(env, email, refId, ip) {
  let user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (user) return user;

  if (refId) {
    const refExists = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(refId).first();
    if (!refExists) refId = null;
  }

  const result = await env.DB.prepare(
    `INSERT INTO users (email, balance, total_deposited, claims_today, rolls_today, withdrawn_today,
       last_reset_at, last_withdrawal_reset_at, referred_by, last_ip, created_at)
     VALUES (?, 0, 0, 0, 0, 0, ?, ?, ?, ?, ?)`
  ).bind(email, nowUTC(), nowUTC(), refId || null, ip, nowUTC()).run();

  const newId = result.meta.last_row_id;

  if (refId) {
    await env.DB.prepare('UPDATE users SET referral_count = referral_count + 1 WHERE id = ?').bind(refId).run();
  }

  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(newId).first();
}

/** Reset daily claim/roll/withdrawal counters if 24h have passed. Returns the (possibly updated) user. */
export async function maybeResetDailyCounters(env, user) {
  const hoursSince = secondsSince(user.last_reset_at) / 3600;
  if (hoursSince >= CONFIG.CLAIM_RESET_HOURS) {
    await env.DB.prepare(
      'UPDATE users SET claims_today = 0, rolls_today = 0, withdrawn_today = 0, last_reset_at = ?, last_withdrawal_reset_at = ? WHERE id = ?'
    ).bind(nowUTC(), nowUTC(), user.id).run();
    user.claims_today = 0;
    user.rolls_today = 0;
    user.withdrawn_today = 0;
    user.last_reset_at = nowUTC();
    user.last_withdrawal_reset_at = nowUTC();
  }
  return user;
}

/** Determine a user's level and daily withdrawal limit from their cumulative deposits */
export function getLevelInfo(totalDeposited) {
  let current = CONFIG.LEVELS[0];
  for (const tier of CONFIG.LEVELS) {
    if (totalDeposited >= tier.minTotalDeposit) current = tier;
  }
  return current; // { level, minTotalDeposit, dailyWithdrawalLimit }
}

export function randomClaimAmount() {
  const scale = 10 ** CONFIG.DECIMALS;
  const minUnits = Math.round(CONFIG.CLAIM_MIN_AMOUNT * scale);
  const maxUnits = Math.round(CONFIG.CLAIM_MAX_AMOUNT * scale);
  return secureRandomInt(minUnits, maxUnits) / scale;
}

export function playRoll() {
  const roll = secureRandomInt(CONFIG.ROLL_MIN, CONFIG.ROLL_MAX);
  let reward = 0;
  for (const tier of CONFIG.ROLL_TABLE) {
    if (roll >= tier.min && roll <= tier.max) {
      reward = tier.reward;
      break;
    }
  }
  return { roll, reward };
}

/** Pick one of the 4 equally-likely bet outcomes and compute the payout */
export function playBet(betAmount) {
  const outcomes = CONFIG.BET_OUTCOMES;
  const pick = outcomes[secureRandomInt(0, outcomes.length - 1)];
  const payout = betAmount * pick.multiplier;
  return {
    type: pick.type,
    label: pick.label,
    multiplier: pick.multiplier,
    payout,
    net: payout - betAmount,
  };
}

export async function verifyCaptcha(env, token, ip) {
  if (!CONFIG.CAPTCHA_ENABLED) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip });
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function faucetpaySend(env, toEmail, amountDoge) {
  const amountUnits = Math.round(amountDoge * (10 ** CONFIG.DECIMALS));
  const body = new URLSearchParams({
    api_key: env.FAUCETPAY_API_KEY,
    amount: String(amountUnits),
    to: toEmail,
    currency: CONFIG.FAUCETPAY_CURRENCY,
  });
  try {
    const res = await fetch('https://faucetpay.io/api/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await res.json();
    const ok = data && Number(data.status) === 200;
    return { ok, message: data?.message || (ok ? 'Success' : 'Unknown error'), raw: data || {} };
  } catch (e) {
    return { ok: false, message: 'Connection error: ' + e.message, raw: {} };
  }
}



export async function telegramSendToChannel(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN.startsWith('PUT_YOUR')) {
    return { ok: false, message: 'Telegram bot token not configured.' };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CONFIG.TELEGRAM_CHANNEL_ID, text, parse_mode: 'HTML' }),
    });
    const data = await res.json();
    return { ok: !!data.ok, raw: data };
  } catch (e) {
    return { ok: false, message: 'Connection error: ' + e.message };
  }
}

export function generateRedeemCode(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}



/** Send a plain-text notification to the configured Telegram chat */
export async function telegramNotify(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN.startsWith('PUT_YOUR')) {
    return { ok: false, message: 'Telegram bot token not configured.' };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    return { ok: !!data.ok, raw: data };
  } catch (e) {
    return { ok: false, message: 'Connection error: ' + e.message };
  }
}
