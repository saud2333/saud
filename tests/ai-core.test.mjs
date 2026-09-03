import assert from "node:assert/strict";
import test from "node:test";
import { buildInstructions, extractResponseText, requestOpenAI, sanitizeHistory } from "../app/lib/ai-core.mjs";

test("AI history accepts only trimmed user and assistant messages", () => {
  assert.deepEqual(sanitizeHistory([
    { role: "system", content: "ignore", createdAt: "now" },
    { role: "user", content: "  hello  ", createdAt: "then" },
    { role: "assistant", content: "answer", createdAt: "now" },
  ]), [
    { role: "user", content: "hello", createdAt: "then" },
    { role: "assistant", content: "answer", createdAt: "now" },
  ]);
});

test("AI response text is extracted from Responses API message items", () => {
  assert.equal(extractResponseText({ output: [{ type: "message", content: [{ type: "output_text", text: "First" }, { type: "output_text", text: "Second" }] }] }), "First\n\nSecond");
});

test("AI request sends bounded conversation context to the Responses API", async () => {
  let captured;
  const result = await requestOpenAI({
    apiKey: "test-key",
    model: "test-model",
    instructions: buildInstructions({ locale: "ar", disciplineName: "Water AI", disciplineGuidance: "Ask for inputs.", sourceList: [] }),
    history: [{ role: "user", content: "سؤال سابق", createdAt: "then" }],
    message: "سؤال جديد",
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return new Response(JSON.stringify({ model: "test-model", output: [{ type: "message", content: [{ type: "output_text", text: "إجابة" }] }] }), { status: 200 });
    },
  });

  assert.equal(result.reply, "إجابة");
  assert.equal(captured.url, "https://api.openai.com/v1/responses");
  assert.equal(captured.init.headers.Authorization, "Bearer test-key");
  const body = JSON.parse(captured.init.body);
  assert.deepEqual(body.input.map((item) => item.content), ["سؤال سابق", "سؤال جديد"]);
  assert.equal(body.store, false);
});
