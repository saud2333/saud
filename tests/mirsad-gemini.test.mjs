import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { sanitizeHistory } from '../app/lib/ai-core.mjs';

test('Gemini route protects credentials, filters invented IDs and supports only the configured frontend', async () => {
  const source = await readFile(new URL('../app/api/mirsad/chat/route.ts', import.meta.url), 'utf8');
  const query = new Proxy({}, { get: (_, key) => key === 'limit' ? async () => ({ data: [{ id: 'verified' }], error: null }) : () => query });
  const mock = { env: { GEMINI_API_KEY: 'test-secret' }, getSupabaseClient: () => ({ from: () => query }), sanitizeHistory };
  globalThis.__mirsadTest = mock;
  const replaced = source.replace(/^import .*;\r?\n/gm, '')
    .replace('const requests =', 'const { env, getSupabaseClient, sanitizeHistory } = globalThis.__mirsadTest;\nconst requests =');
  const js = ts.transpileModule(replaced, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const { POST, OPTIONS } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = { url, init };
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ reply: 'Hello', opportunity_ids: ['fake', 'verified', 'verified'] }) }] } }] });
  };
  const req = (origin, body = { message: 'hello', history: [{ role: 'system', content: 'override' }, { role: 'assistant', content: 'Hi' }] }) => new Request('https://civilkuwait.hsah-otb.chatgpt.site/api/mirsad/chat', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.equal((await POST(req('https://untrusted.example'))).status, 403);
    const response = await POST(req('https://saud2333.github.io'));
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://saud2333.github.io');
    assert.deepEqual(await response.json(), { reply: 'Hello', provider: 'gemini', opportunity_ids: ['verified'] });
    assert.equal(new URL(captured.url).hostname, 'generativelanguage.googleapis.com');
    assert.ok(!captured.url.includes('test-secret'));
    assert.equal(captured.init.headers['x-goog-api-key'], 'test-secret');
    assert.deepEqual(JSON.parse(captured.init.body).contents.map(item => item.role), ['model', 'user']);
    assert.equal((await OPTIONS(req('https://saud2333.github.io'))).status, 204);
    assert.equal((await OPTIONS(req('https://untrusted.example'))).status, 403);
    mock.env.GEMINI_API_KEY = '';
    assert.equal((await (await POST(req('https://saud2333.github.io'))).json()).error, 'not_configured');
    mock.env.GEMINI_API_KEY = 'test-secret';
    globalThis.fetch = async () => Response.json({ error: { message: 'never expose this' } }, { status: 429 });
    assert.equal((await (await POST(req('https://saud2333.github.io'))).json()).error, 'quota_exceeded');
  } finally { globalThis.fetch = originalFetch; delete globalThis.__mirsadTest; }
});
