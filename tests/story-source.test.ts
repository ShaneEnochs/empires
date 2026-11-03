import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { assembleStorySources, parseStorySources, publicStoryFiles } from '../src/story-source';
import { publicSources } from './public-story';
import { Game } from '../src/game';

// Captured before the physical split: all revision-8 text, IDs and effects unchanged.
const originalSourceHash = '1a2c324b7c1a37f6a361ebeb707ada62a7e1c8775a63e278f760bc3d7dbaaebe';
test('the fixed ordered chapter list reconstructs exactly the revision-8 source', () => {
  assert.deepEqual(publicStoryFiles.map(path => path.split('/').at(-1)), ['globals.story', 'chapter-01-crossing.story', 'chapter-02-orientation.story']);
  const parts = publicSources();
  assert.equal(createHash('sha256').update(assembleStorySources(parts)).digest('hex'), originalSourceHash);
  const story = parseStorySources(parts);
  assert.equal(story.startId, 'ferry');
  assert.equal(story.passages.find(passage => passage.id === 'lezano_checkin')!.chapter, 'Chapter 2: Orientation');
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
  const result = spawnSync(process.execPath, ['--import','tsx','scripts/check-stories.ts', publicStoryFiles[2]!, publicStoryFiles[0]!], {encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+result.stderr); assert.match(result.stdout,/Total: 0 errors, 0 warnings/);
  assert.equal((result.stdout.match(/INFORMATION ANALYSIS_SCOPE/g) ?? []).length,1);
});
