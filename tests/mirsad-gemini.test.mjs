import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('FAQ selection and local course search stay client-side and retire the old endpoint', async () => {
  const ui = await readFile(new URL('../app/components/KuwaitCoursesApp.tsx', import.meta.url), 'utf8');
  const dialog = ui.slice(ui.indexOf('{botOpen &&'), ui.indexOf('{selected &&'));
  assert.match(dialog, /<input/);
  assert.match(dialog, /sendBotQuestion/);
  assert.match(dialog, /askBot\(item.id\)/);
  assert.match(ui, /item.answerAr : item.answerEn/);
  assert.doesNotMatch(ui, /api\/mirsad\/chat|Google Gemini|botBusy/);
  const route = await readFile(new URL('../app/api/mirsad/chat/route.ts', import.meta.url), 'utf8');
  const { POST } = await import(`data:text/javascript;base64,${Buffer.from(route).toString('base64')}`);
  assert.equal((await POST()).status, 410);
  assert.doesNotMatch(route, /fetch\(|API_KEY/);
});
