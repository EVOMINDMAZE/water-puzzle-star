function createResponse(body, status, corsHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

function resolveCors(origin, env) {
  const allowlist = String(env.ANALYTICS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const allowedOrigin = allowlist.includes(origin) ? origin : (allowlist[0] || '*');
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function sanitizeEvent(event) {
  if (!event || typeof event !== 'object') return null;
  const payload = event.payload && typeof event.payload === 'object' ? event.payload : {};
  const message = typeof payload.message === 'string' ? payload.message.replace(/[<>]/g, '').slice(0, 500) : undefined;
  const safePayload = message === undefined ? payload : { ...payload, message };
  return {
    schemaVersion: typeof event.schemaVersion === 'string' ? event.schemaVersion : 'unknown',
    eventType: typeof event.eventType === 'string' ? event.eventType : 'unknown',
    category: typeof event.category === 'string' ? event.category : 'unknown',
    timestamp: Number(event.timestamp) || Date.now(),
    sessionId: typeof event.sessionId === 'string' ? event.sessionId : 'unknown',
    playerId: typeof event.playerId === 'string' ? event.playerId : 'unknown',
    sessionIndex: Number(event.sessionIndex) || 0,
    acquisition: event.acquisition && typeof event.acquisition === 'object' ? event.acquisition : {},
    userId: typeof event.userId === 'string' ? event.userId : '',
    payload: safePayload
  };
}

async function writeEventsToD1(db, events, envelope) {
  if (!db || !events.length) return events.length;
  const now = Date.now();
  for (const event of events) {
    await db.prepare(
      `INSERT INTO analytics_events
      (ingested_at_ms, player_id, session_id, event_type, category, schema_version, event_timestamp_ms, payload_json, acquisition_json, source_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      now,
      event.playerId,
      event.sessionId,
      event.eventType,
      event.category,
      event.schemaVersion,
      event.timestamp,
      JSON.stringify(event.payload || {}),
      JSON.stringify(event.acquisition || {}),
      envelope.sourceUrl || ''
    ).run();
  }
  return events.length;
}

async function appendToKV(kv, events, envelope) {
  if (!kv || !events.length) return events.length;
  const key = `analytics:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  await kv.put(key, JSON.stringify({
    schemaVersion: envelope.schemaVersion,
    playerId: envelope.playerId,
    sessionId: envelope.sessionId,
    sourceUrl: envelope.sourceUrl,
    events
  }), { expirationTtl: 60 * 60 * 24 * 30 });
  return events.length;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = resolveCors(origin, env);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (url.pathname !== '/ingest-analytics' || request.method !== 'POST') {
      return createResponse({ error: 'not_found' }, 404, corsHeaders);
    }
    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (Number.isFinite(contentLength) && contentLength > 256000) {
      return createResponse({ accepted: 0, rejected: 0, reason: 'payload_too_large' }, 413, corsHeaders);
    }
    let body;
    try {
      body = await request.json();
    } catch (_) {
      return createResponse({ accepted: 0, rejected: 0, reason: 'invalid_json' }, 400, corsHeaders);
    }
    const eventsInput = Array.isArray(body?.events) ? body.events : [];
    if (!eventsInput.length) {
      return createResponse({ accepted: 0, rejected: 0, reason: 'empty_events' }, 400, corsHeaders);
    }
    const capped = eventsInput.slice(0, 200);
    const sanitized = capped.map(sanitizeEvent).filter(Boolean);
    const envelope = {
      schemaVersion: typeof body?.schemaVersion === 'string' ? body.schemaVersion : 'unknown',
      playerId: typeof body?.playerId === 'string' ? body.playerId : 'unknown',
      sessionId: typeof body?.sessionId === 'string' ? body.sessionId : 'unknown',
      sourceUrl: request.headers.get('Referer') || request.headers.get('Origin') || ''
    };
    let accepted = 0;
    if (env.ANALYTICS_DB) {
      accepted = await writeEventsToD1(env.ANALYTICS_DB, sanitized, envelope);
    } else if (env.ANALYTICS_EVENT_STORE) {
      accepted = await appendToKV(env.ANALYTICS_EVENT_STORE, sanitized, envelope);
    }
    const rejected = capped.length - accepted;
    return createResponse({
      accepted,
      rejected,
      capped: eventsInput.length > capped.length,
      storedWith: env.ANALYTICS_DB ? 'd1' : (env.ANALYTICS_EVENT_STORE ? 'kv' : 'none')
    }, 200, corsHeaders);
  }
};
