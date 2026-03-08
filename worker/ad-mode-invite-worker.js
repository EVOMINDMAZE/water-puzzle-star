function json(body, status, corsHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

function toBase64UrlFromBytes(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64UrlToBytes(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function computeSignature(payloadEncoded, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payloadEncoded));
  return toBase64UrlFromBytes(new Uint8Array(signature));
}

async function verifyToken(token, env) {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'missing_token' };
  }
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'invalid_token_format' };
  }
  const payloadEncoded = parts[0];
  const signatureProvided = parts[1];
  if (!env.AD_MODE_INVITE_SECRET) {
    return { valid: false, reason: 'missing_signing_secret' };
  }
  let payload;
  try {
    const payloadBytes = fromBase64UrlToBytes(payloadEncoded);
    payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch (_) {
    return { valid: false, reason: 'invalid_payload' };
  }
  const signatureExpected = await computeSignature(payloadEncoded, env.AD_MODE_INVITE_SECRET);
  if (!safeEqual(signatureExpected, signatureProvided)) {
    return { valid: false, reason: 'invalid_signature' };
  }
  if (payload.mode !== 'adfree') {
    return { valid: false, reason: 'invalid_mode' };
  }
  const exp = Number(payload.exp);
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) {
    return { valid: false, reason: 'expired_token' };
  }
  if (env.AD_MODE_INVITE_AUD && payload.aud !== env.AD_MODE_INVITE_AUD) {
    return { valid: false, reason: 'audience_mismatch' };
  }
  return {
    valid: true,
    mode: 'adfree',
    expiresAt: new Date(exp * 1000).toISOString(),
    campaignId: typeof payload.campaignId === 'string' ? payload.campaignId : '',
    reason: ''
  };
}

function getCorsHeaders(origin, env) {
  const allowed = String(env.AD_MODE_ALLOWED_ORIGINS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  const allowedOrigin = allowed.includes(origin) ? origin : (allowed[0] || '*');
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = getCorsHeaders(origin, env);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (url.pathname !== '/verify-invite' || request.method !== 'POST') {
      return json({ error: 'not_found' }, 404, corsHeaders);
    }
    let payload;
    try {
      payload = await request.json();
    } catch (_) {
      return json({ valid: false, mode: 'ads', expiresAt: null, campaignId: '', reason: 'invalid_json' }, 400, corsHeaders);
    }
    const token = typeof payload?.token === 'string' ? payload.token.trim() : '';
    const result = await verifyToken(token, env);
    if (!result.valid) {
      return json({
        valid: false,
        mode: 'ads',
        expiresAt: null,
        campaignId: '',
        reason: result.reason
      }, 200, corsHeaders);
    }
    return json(result, 200, corsHeaders);
  }
};
