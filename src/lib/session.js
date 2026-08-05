import { CONFIG } from '../config.js';
import { parseCookies, buildSetCookie } from './util.js';

const COOKIE_NAME = 'session_token';

export async function createSession(env, userId) {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + CONFIG.SESSION_DAYS * 86400 * 1000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, userId, expires)
    .run();
  return buildSetCookie(COOKIE_NAME, token, CONFIG.SESSION_DAYS);
}

export async function currentUser(request, env) {
  const cookies = parseCookies(request);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first();
  if (!session) return null;

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first();
  return user || null;
}

export function clearSessionCookie() {
  return buildSetCookie(COOKIE_NAME, '', 0);
}

export async function destroySession(request, env) {
  const cookies = parseCookies(request);
  const token = cookies[COOKIE_NAME];
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }
}
