import { CONFIG } from '../config.js';

export function fmtDoge(amount) {
  return Number(amount).toFixed(CONFIG.DECIMALS);
}

/** Cryptographically secure random integer in [min, max] inclusive */
export function secureRandomInt(min, max) {
  const range = max - min + 1;
  const bytes = new Uint32Array(1);
  const maxUint32 = 0xFFFFFFFF;
  const limit = maxUint32 - (maxUint32 % range);
  let value;
  do {
    crypto.getRandomValues(bytes);
    value = bytes[0];
  } while (value >= limit);
  return min + (value % range);
}

export function nowUTC() {
  return new Date().toISOString();
}

export function secondsSince(isoString) {
  if (!isoString) return Infinity;
  const then = new Date(isoString + (isoString.endsWith('Z') ? '' : 'Z')).getTime();
  return Math.floor((Date.now() - then) / 1000);
}

export function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const out = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

export function buildSetCookie(name, value, days) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax'];
  if (days === 0) parts.push('Max-Age=0');
  else if (days) parts.push(`Max-Age=${days * 86400}`);
  return parts.join('; ');
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

export function htmlResponse(html, status = 200, extraHeaders = {}) {
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...extraHeaders },
  });
}

export function redirect(location, extraHeaders = {}) {
  return new Response(null, { status: 302, headers: { Location: location, ...extraHeaders } });
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function parseFormBody(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await request.text();
    return Object.fromEntries(new URLSearchParams(text));
  }
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }
  return {};
}

/** Check HTTP Basic Auth credentials against env secrets. Returns true/false. */
export function checkBasicAuth(request, env) {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const decoded = atob(header.slice(6));
    const idx = decoded.indexOf(':');
    const user = decoded.slice(0, idx);
    const pass = decoded.slice(idx + 1);
    return user === env.ADMIN_USERNAME && pass === env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

export function basicAuthChallenge() {
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin Panel"' },
  });
}
