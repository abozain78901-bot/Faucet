import { CONFIG } from '../config.js';

/**
 * CCPayment v2 signature:
 *   signText = AppId + Timestamp + Body(json string)   (AppSecret is NOT in the text)
 *   sign     = HMAC-SHA256(key = AppSecret, message = signText)  -> lowercase hex
 * (Different from v1, which was a plain SHA-256 hash with the secret concatenated in.)
 */
async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sigBuffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function ccpaymentPost(env, path, payload) {
  const appSecret = env.CCPAYMENT_APP_SECRET;
  if (!appSecret) throw new Error('CCPAYMENT_APP_SECRET is not set. Run: wrangler secret put CCPAYMENT_APP_SECRET');

  const timestamp = String(Math.floor(Date.now() / 1000)); // seconds, per the official Go SDK sample
  const bodyStr = JSON.stringify(payload || {});
  const signText = CONFIG.CCPAYMENT_APP_ID + timestamp + bodyStr;
  const sign = await hmacSha256Hex(appSecret, signText);

  const res = await fetch(CONFIG.CCPAYMENT_API_BASE + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Appid: CONFIG.CCPAYMENT_APP_ID,
      Sign: sign,
      Timestamp: timestamp,
    },
    body: bodyStr,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`CCPayment returned non-JSON (status ${res.status}): ${text.slice(0, 200)}`);
  }
  return data; // { code, msg, data }
}

/**
 * userId must be 5-64 chars and must NOT start with "sys" — our internal
 * numeric user.id is too short, so we prefix it.
 */
function toCcpaymentUserId(userId) {
  return `user_${userId}`;
}

export async function getPermanentDepositAddress(env, userId) {
  const payload = {
    userId: toCcpaymentUserId(userId),
    chain: CONFIG.CCPAYMENT_CHAIN,
  };
  const result = await ccpaymentPost(env, '/getOrCreateUserDepositAddress', payload);
  if (result.code !== 10000) {
    return { ok: false, message: result.msg || 'CCPayment error', raw: result };
  }
  const d = result.data || {};
  return { ok: true, address: d.address, memo: d.memo || '', raw: result };
}

/** Verify an incoming webhook's signature using the same v2 HMAC scheme. */
export async function verifyWebhookSignature(env, appid, timestamp, rawBodyStr, sign) {
  if (appid !== CONFIG.CCPAYMENT_APP_ID) return false;
  const appSecret = env.CCPAYMENT_APP_SECRET;
  if (!appSecret) return false;
  const signText = appid + timestamp + rawBodyStr;
  const expected = await hmacSha256Hex(appSecret, signText);
  return expected === sign;
}
