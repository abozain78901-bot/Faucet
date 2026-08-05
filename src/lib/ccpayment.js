import { CONFIG } from '../config.js';

/** SHA-256(appId + appSecret + timestamp + bodyString) -> lowercase hex, per CCPayment's signature spec. */
async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hashBuffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function signRequest(appSecret, timestamp, bodyStr) {
  return sha256Hex(CONFIG.CCPAYMENT_APP_ID + appSecret + timestamp + bodyStr);
}

/** Low-level authenticated POST to the CCPayment merchant API. */
async function ccpaymentPost(env, path, payload) {
  const appSecret = env.CCPAYMENT_APP_SECRET;
  if (!appSecret) throw new Error('CCPAYMENT_APP_SECRET is not set. Run: wrangler secret put CCPAYMENT_APP_SECRET');

  const timestamp = String(Math.floor(Date.now() / 1000));
  const bodyStr = JSON.stringify(payload || {});
  const sign = await signRequest(appSecret, timestamp, bodyStr);

  const res = await fetch(CONFIG.CCPAYMENT_API_BASE + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Appid: CONFIG.CCPAYMENT_APP_ID,
      Sign: sign,
      Timestamp: timestamp,
    },
    body: bodyStr,
  });
  const data = await res.json();
  return data; // { code, msg, data }
}

/**
 * Get (or lazily create) a permanent deposit address for a user.
 * CCPayment returns the SAME address on every call once one exists for
 * that (user_id, chain) pair, so it's safe/cheap to call this on demand.
 */
export async function getPermanentDepositAddress(env, userId, notifyUrl) {
  const payload = {
    user_id: String(userId),
    chain: CONFIG.CCPAYMENT_CHAIN,
    notify_url: notifyUrl,
  };
  const result = await ccpaymentPost(env, '/ccpayment/v1/payment/address/get', payload);
  if (result.code !== 10000) {
    return { ok: false, message: result.msg || 'CCPayment error', raw: result };
  }
  return { ok: true, address: result.data.address, memo: result.data.memo || '', raw: result };
}

/**
 * Verify an incoming webhook's signature. CCPayment sends Appid/Sign/Timestamp
 * headers on the webhook POST itself — recompute and compare.
 */
export async function verifyWebhookSignature(env, appid, timestamp, rawBodyStr, sign) {
  if (appid !== CONFIG.CCPAYMENT_APP_ID) return false;
  const appSecret = env.CCPAYMENT_APP_SECRET;
  if (!appSecret) return false;
  const expected = await sha256Hex(appid + appSecret + timestamp + rawBodyStr);
  return expected === sign;
}
