import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
test('VS Code uses the custom language, discoverable command snippets, and process task arguments', () => {
  assert.equal(json('.vscode/settings.json')['files.associations']['*.story'], 'empires-story');
  const snippets = json('.vscode/empires.code-snippets');
  assert.equal(Object.keys(snippets).length, 20);
  for (const [name, value] of Object.entries(snippets)) {
    const snippet = value as { prefix: string; scope: string; body: string[] };
    assert.equal(snippet.prefix, 'emp-' + name);
    assert.equal(snippet.scope, 'empires-story,plaintext');
    assert.ok(snippet.body[0]!.startsWith('*'));
  }
  const tasks = json('.vscode/tasks.json').tasks;
  assert.deepEqual(tasks.map((task: { label: string }) => task.label), ['Empires: Check Current Story', 'Empires: Check Bundled Stories', 'Empires: Start Local Preview']);
  assert.ok(tasks.every((task: { type: string }) => task.type === 'process'));
  assert.deepEqual(tasks[0].args, ['--import', 'tsx', 'scripts/check-stories.ts', '${file}']);
});
