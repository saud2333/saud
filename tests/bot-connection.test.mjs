import test from "node:test";
import assert from "node:assert/strict";
import { checkSyncConnection, runSync, syncConfiguration } from "../scripts/sync-opportunities.mjs";

const env = { SUPABASE_URL: "https://project.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-server-key" };

test("missing AI configuration never creates a client or modifies catalog data", async () => {
  let connected = false;
  await assert.rejects(runSync({ env, createClientImpl: () => { connected = true; } }), /OPENAI_API_KEY is missing/);
  assert.equal(connected, false);
  assert.throws(() => syncConfiguration({ ...env, OPENAI_API_KEY: "  " }), /OPENAI_API_KEY is missing/);
});

test("connection check only performs HEAD reads and distinguishes missing AI", async () => {
  const requests = [];
  const client = { from: (table) => ({ select: async (columns, options) => { requests.push({ table, columns, options }); return { error: null }; } }) };
  const result = await checkSyncConnection({ env, createClientImpl: () => client });
  assert.equal(result.connection, "ok");
  assert.equal(result.aiConfigured, false);
  assert.equal(result.automatedReviewTested, false);
  assert.equal(result.writesPerformed, false);
  assert.equal(requests.length, 3);
  assert.ok(requests.every(r => r.options.head === true));
  assert.ok(requests.some(r => r.table === "learning_source_documents"));
});

test("connection check reports denied private-table access without leaking credentials", async () => {
  const client = { from: () => ({ select: async () => ({ error: { code: "42501", message: "sensitive upstream details" } }) }) };
  await assert.rejects(checkSyncConnection({ env, createClientImpl: () => client }), error => error.message.includes("42501") && !error.message.includes("sensitive"));
});

test("configuration accepts a modern server key and requires an HTTPS project origin", () => {
  const config = syncConfiguration({ SUPABASE_URL: env.SUPABASE_URL, SUPABASE_SECRET_KEY: "sb_secret_test", OPENAI_API_KEY: "test-key" });
  assert.equal(config.serviceKey, "sb_secret_test");
  assert.equal(config.aiConfigured, true);
  for (const url of ["http://project.supabase.co", "https://user:password@project.supabase.co", "https://project.supabase.co/rest/v1"]) assert.throws(() => syncConfiguration({ ...env, SUPABASE_URL: url }, { requireAI: false }), /Invalid Supabase/);
});
