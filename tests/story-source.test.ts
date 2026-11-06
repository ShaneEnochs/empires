import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { assembleStorySources, parseStorySources, publicStoryFiles } from '../src/story-source';
import { publicSources } from './public-story';
import { Game } from '../src/game';

// Canonical SHA-256 for the assembled Chapter 1 relocation story.
const currentSourceHash = '72a92ebc08f82ac2cba1ad529600878f51e3545d9cb60f0ab9e9886748b1e0c5';
test('the ordered sources reproduce the final Chapter 1 and no legacy chapters', () => {
  assert.deepEqual(publicStoryFiles.map(path => path.split('/').at(-1)), ['globals.story', 'chapter-01-simple-assignment.story']);
  const parts = publicSources();
  assert.equal(createHash('sha256').update(assembleStorySources(parts)).digest('hex'), currentSourceHash);
  const story = parseStorySources(parts);
  assert.equal(story.startId, 'orchard_intro');
  assert.equal(story.passages.length, 7);
  assert.ok(story.passages.every(passage => passage.chapter === 'Chapter 1: A Simple Assignment'));
  assert.equal(story.passages.at(-1)!.id, 'capture_attempt');
});

const parts = [
  { path: 'globals.story', text: '*var name "Ari"\n*var count 1\n*item pass "Pass"' },
  { path: 'chapter-1.story', text: '*chapter Chapter One\n*passage start\n*title Start\n*add_item pass 1\n*journal started "${name} began."\nBegin.\n*continue next' },
  { path: 'chapter-2.story', text: '*chapter Chapter Two\n*passage next\n*title Next\n*add count 2\n*journal arrived "${name} arrived with count ${count}."\nOnward.' },
];
test('one parsed story navigates across chapter files with shared variables, inventory and journal', () => {
  const game = new Game(parseStorySources(parts)); game.navigate('next');
  assert.equal(game.state.variables.count, 3); assert.equal(game.state.variables.name, 'Ari');
  assert.deepEqual(game.state.inventory, {pass: 1});
  assert.deepEqual(game.state.journal.map(event => [event.id, event.chapter]), [['started', 'Chapter One'], ['arrived', 'Chapter Two']]);
});
test('duplicate IDs and invalid cross-file references still fail with originating file/local line', () => {
  assert.throws(() => parseStorySources([parts[0]!, parts[1]!, {path:'chapter-2.story',text:'*chapter Chapter Two\n*passage start\n*title Duplicate\nText.'}]), /chapter-2.story: Line 2.*Duplicate passage ID/);
  assert.throws(() => parseStorySources([parts[0]!, parts[1]!]), /chapter-1.story: Line 7.*Missing destination/);
});
test('BOMs, CRLF, and missing final newlines assemble through the same parser', () => {
  const normalized = parts.map(part => ({...part, text:'\uFEFF'+part.text.replace(/\n/g,'\r\n')}));
  assert.deepEqual(parseStorySources(normalized), parseStorySources(parts));
  assert.ok(assembleStorySources(normalized).includes('\n*chapter'));
});
test('checking a selected public chapter validates the entire ordered story', () => {
  const result = spawnSync(process.execPath, ['--import','tsx','scripts/check-stories.ts', publicStoryFiles[1]!, publicStoryFiles[0]!], {encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+result.stderr); assert.match(result.stdout,/Total: 0 errors, 0 warnings/);
  assert.equal((result.stdout.match(/INFORMATION ANALYSIS_SCOPE/g) ?? []).length,1);
});
