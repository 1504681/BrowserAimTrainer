// Browser Aim Trainer — leaderboard Worker
// Endpoints:
//   GET  /scores?key=<scenario>-<difficulty>-<weapon>   → top N runs
//   POST /submit                                         → submit a run
//
// Storage: a single KV value per key, holding a JSON array of top runs
// (capped to MAX_KEEP). Sorted by score (descending — higher is better).

const MAX_KEEP = 50;
const MAX_NAME_LEN = 20;
const MAX_SCORE = 100000;
const RATE_WINDOW_MS = 10_000;   // 10s
const RATE_MAX_PER_IP = 6;       // max submits per window per IP

// Allowed scenario keys — anything else is rejected
const ALLOWED_MODES = ['bouncing', 'cylinder', 'dodge', 'pole'];
const ALLOWED_DIFFS = ['easy', 'normal', 'hard', 'custom'];
const ALLOWED_WEAPONS = ['hitscan', 'tracking'];

function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    ...extra,
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders() });
}

function isValidKey(key) {
  if (typeof key !== 'string') return false;
  const parts = key.split('-');
  if (parts.length !== 3) return false;
  return ALLOWED_MODES.includes(parts[0]) &&
         ALLOWED_DIFFS.includes(parts[1]) &&
         ALLOWED_WEAPONS.includes(parts[2]);
}

function sanitizeName(name) {
  if (typeof name !== 'string') return 'Anon';
  // Strip control chars + trim + cap length
  const cleaned = name.replace(/[\x00-\x1f\x7f]/g, '').trim();
  if (!cleaned) return 'Anon';
  return cleaned.slice(0, MAX_NAME_LEN);
}

async function rateLimit(env, ip) {
  const k = 'rl:' + ip;
  const raw = await env.SCORES.get(k);
  const now = Date.now();
  let arr = [];
  if (raw) {
    try { arr = JSON.parse(raw); } catch {}
  }
  arr = arr.filter(t => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX_PER_IP) return false;
  arr.push(now);
  await env.SCORES.put(k, JSON.stringify(arr), { expirationTtl: 60 });
  return true;
}

async function getScores(env, key) {
  const raw = await env.SCORES.get('lb:' + key);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function putScores(env, key, arr) {
  await env.SCORES.put('lb:' + key, JSON.stringify(arr));
}

function dedupeByName(arr) {
  const sorted = arr.slice().sort((a, b) => b.score - a.score);
  const seen = new Set();
  const out = [];
  for (const r of sorted) {
    const n = r.name || 'Anon';
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(r);
  }
  return out;
}

async function handleGet(req, env) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  if (!isValidKey(key)) return json({ error: 'invalid key' }, 400);
  const arr = await getScores(env, key);
  return json({ scores: dedupeByName(arr) });
}

async function handleFeedback(req, env) {
  let body;
  try { body = await req.json(); } catch { return json({ error: 'invalid json' }, 400); }
  const { type, subject, message, name } = body || {};
  if (!['bug', 'feature', 'other'].includes(type)) return json({ error: 'invalid type' }, 400);
  if (typeof subject !== 'string' || !subject.trim()) return json({ error: 'subject required' }, 400);
  if (typeof message !== 'string' || !message.trim()) return json({ error: 'message required' }, 400);
  if (subject.length > 140) return json({ error: 'subject too long' }, 400);
  if (message.length > 4000) return json({ error: 'message too long' }, 400);

  const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('x-forwarded-for') || 'unknown';

  // Per-IP rate limit — 5 feedback submissions per hour
  const rlKey = 'fb-rl:' + ip;
  const rlRaw = await env.SCORES.get(rlKey);
  const now = Date.now();
  let rlArr = [];
  if (rlRaw) { try { rlArr = JSON.parse(rlRaw); } catch {} }
  rlArr = rlArr.filter(t => now - t < 3600_000);
  if (rlArr.length >= 5) return json({ error: 'rate limited — max 5/hour' }, 429);
  rlArr.push(now);
  await env.SCORES.put(rlKey, JSON.stringify(rlArr), { expirationTtl: 3700 });

  const entry = {
    type,
    subject: subject.trim().slice(0, 140),
    message: message.trim().slice(0, 4000),
    name: sanitizeName(name),
    ts: now,
    ua: (req.headers.get('User-Agent') || '').slice(0, 200),
  };
  const key = `fb:${now}:${Math.random().toString(36).slice(2, 8)}`;
  await env.SCORES.put(key, JSON.stringify(entry));
  return json({ ok: true });
}

async function handlePost(req, env) {
  let body;
  try { body = await req.json(); } catch { return json({ error: 'invalid json' }, 400); }

  const { key, name, score, acc, hits, headshots, mul } = body || {};
  if (!isValidKey(key)) return json({ error: 'invalid key' }, 400);
  if (typeof score !== 'number' || !isFinite(score) || score < 0 || score > MAX_SCORE) {
    return json({ error: 'invalid score' }, 400);
  }
  if (typeof acc !== 'number' || acc < 0 || acc > 100) return json({ error: 'invalid acc' }, 400);

  const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('x-forwarded-for') || 'unknown';
  if (!await rateLimit(env, ip)) return json({ error: 'rate limited' }, 429);

  const cleanName = sanitizeName(name);
  const entry = {
    name: cleanName,
    score: Math.round(score * 100) / 100,
    acc: Math.round(acc),
    hits: typeof hits === 'number' ? Math.round(hits) : 0,
    headshots: typeof headshots === 'number' ? Math.round(headshots) : 0,
    mul: typeof mul === 'number' ? Math.round(mul * 100) / 100 : 1,
    ts: Date.now(),
  };

  const arr = await getScores(env, key);
  arr.push(entry);
  // Sort descending by score
  arr.sort((a, b) => b.score - a.score);
  // Dedupe by name — keep only the highest score per player (first occurrence after sort)
  const seen = new Set();
  const deduped = [];
  for (const r of arr) {
    const n = r.name || 'Anon';
    if (seen.has(n)) continue;
    seen.add(n);
    deduped.push(r);
  }
  while (deduped.length > MAX_KEEP) deduped.pop();
  await putScores(env, key, deduped);

  return json({ ok: true, scores: deduped, rank: deduped.indexOf(entry) + 1 });
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    const url = new URL(req.url);
    if (req.method === 'GET' && url.pathname === '/scores') return handleGet(req, env);
    if (req.method === 'POST' && url.pathname === '/submit') return handlePost(req, env);
    if (req.method === 'POST' && url.pathname === '/feedback') return handleFeedback(req, env);
    if (req.method === 'GET' && url.pathname === '/health') return json({ ok: true });
    return json({ error: 'not found' }, 404);
  },
};
