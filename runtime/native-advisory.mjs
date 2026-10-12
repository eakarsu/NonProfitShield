import crypto from 'node:crypto';
import pg from 'pg';
const failure = (message, status) => Object.assign(new Error(message), { status });
const saved = row => ({ id: String(row.id), prompt: typeof row.input?.prompt === 'string' ? row.input.prompt : String(row.input?.question || row.input?.message || row.input?.context || ''), content: typeof row.output?.content === 'string' ? row.output.content : '', model: row.model, createdAt: new Date(row.created_at).toISOString(), canDelete: false, providerReceipt: { id: row.output?.providerReceipt?.id || '' } });
export function createNonprofitAdvisoryHandler({ env = process.env, pool = new pg.Pool({ connectionString: env.DATABASE_URL }), fetchImpl = fetch, timeoutMs = 60_000 } = {}) {
  const endpoint = env.RUNTIME_AI_ENDPOINT || '/api/ai/nonprofit-guidance', feature = env.RUNTIME_AI_FEATURE || 'nonprofit-guidance', limits = new Map();
  const actor = async (db, req, lock = false) => {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) throw failure('Authentication required', 401);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const row = (await db.query(`SELECT u.id,u.email,u.role FROM runtime_app_users u JOIN runtime_app_sessions s ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>NOW() AND u.active=TRUE${lock ? ' FOR SHARE OF u,s' : ''}`, [tokenHash])).rows[0];
    if (!row) throw failure('Session is expired, revoked or inactive', 401);
    return row;
  };
  return async (req, res, url) => {
    if (url.pathname !== endpoint) return false;
    const send = (status, body) => { if (res.destroyed) return; res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': `http://127.0.0.1:${env.FRONTEND_PORT}`, 'Access-Control-Allow-Headers': 'Authorization, Content-Type' }); res.end(JSON.stringify(body)); };
    const controller = new AbortController(), cancel = () => controller.abort(failure('AI request cancelled', 499)), disconnected = () => { if (!res.writableFinished) cancel(); };
    req.once('aborted', cancel); res.once('close', disconnected);
    const timer = setTimeout(() => controller.abort(failure('AI request timed out', 504)), timeoutMs); timer.unref();
    try {
      if (req.aborted || res.destroyed) cancel(); controller.signal.throwIfAborted();
      const user = await actor(pool, req); controller.signal.throwIfAborted();
      if (req.method === 'GET') { const rows = (await pool.query('SELECT * FROM runtime_ai_interactions WHERE user_id=$1 AND feature=$2 ORDER BY created_at DESC LIMIT 50', [user.id, feature])).rows; controller.signal.throwIfAborted(); send(200, { items: rows.map(saved) }); return true; }
      if (req.method !== 'POST') { send(405, { error: 'Native report deletion and evidence mutation are not available' }); return true; }
      let raw = ''; for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 80_000) throw failure('Request body exceeds the limit', 413); }
      let body; try { body = JSON.parse(raw); } catch { throw failure('A JSON request body is required', 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw failure('A JSON request body is required', 400);
      const prompt = typeof (body.prompt || body.question || body.message || body.context) === 'string' ? (body.prompt || body.question || body.message || body.context).trim() : '';
      if (!prompt || prompt.length > 8000) throw failure('Prompt must contain 1-8000 characters', 400);
      const now = Date.now(), recent = (limits.get(user.id) || []).filter(time => now - time < 60_000);
      if (recent.length >= 20) throw failure('Too many AI requests. Try again shortly.', 429);
      limits.set(user.id, [...recent, now]); for (const [id, times] of limits) if (times.at(-1) < now - 60_000) limits.delete(id);
      const base = String(env.OPENROUTER_BASE_URL || '').replace(/\/+$/, ''), model = String(env.OPENROUTER_MODEL || '').trim(), key = String(env.OPENROUTER_API_KEY || '').trim();
      if (base !== 'https://openrouter.ai/api/v1' || !model || !key) throw failure('Exact OpenRouter configuration is required', 503);
      controller.signal.throwIfAborted();
      const response = await fetchImpl(`${base}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': env.RUNTIME_PROJECT_NAME || 'NonProfitShield' }, body: JSON.stringify({ model, messages: [{ role: 'system', content: env.RUNTIME_AI_SYSTEM_PROMPT || 'You are a nonprofit risk and program-operations assistant. Give cautious, evidence-aware guidance and identify missing facts without making eligibility or legal decisions.' }, { role: 'user', content: prompt }], max_tokens: 650 }), signal: controller.signal });
      controller.signal.throwIfAborted(); if (!response.ok) throw failure(`OpenRouter request failed with HTTP ${response.status}`, 502);
      const provider = await response.json(); controller.signal.throwIfAborted(); const choice = provider.choices?.[0], content = typeof choice?.message?.content === 'string' ? choice.message.content.trim() : '';
      if (!content || typeof provider.id !== 'string' || !provider.id.trim() || choice.message.refusal || ['length', 'content_filter'].includes(choice.finish_reason)) throw failure('OpenRouter returned an empty or incomplete advisory', 502);
      const providerReceipt = { id: provider.id.trim(), model: typeof provider.model === 'string' ? provider.model : model, usage: provider.usage || null };
      const client = await pool.connect(); let row;
      try {
        await client.query('BEGIN'); controller.signal.throwIfAborted(); const current = await actor(client, req, true); if (current.id !== user.id || current.role !== user.role) throw failure('Identity changed during generation', 401);
        row = (await client.query('INSERT INTO runtime_ai_interactions(user_id,feature,input,output,model) VALUES($1,$2,$3::jsonb,$4::jsonb,$5) RETURNING *', [user.id, feature, JSON.stringify({ ...body, prompt }), JSON.stringify({ content, providerReceipt }), model])).rows[0];
        controller.signal.throwIfAborted(); await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
      controller.signal.throwIfAborted(); send(200, { content, model, interactionId: Number(row.id), feature, item: saved(row) });
    } catch (error) { const reason = controller.signal.aborted ? controller.signal.reason : error; if (!res.destroyed) send(reason.status || 500, { error: reason.status ? reason.message : 'AI request failed; no report was saved' }); }
    finally { clearTimeout(timer); req.removeListener('aborted', cancel); res.removeListener('close', disconnected); }
    return true;
  };
}
