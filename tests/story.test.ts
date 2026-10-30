import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseStory } from '../src/story';

const end = { id: 'end', title: 'End', text: ['You arrive.'], choices: [] };
const opening = {
  id: 'opening', title: 'Opening', text: ['A road.', 'A destination.'],
  choices: [{ label: 'Walk', destinationId: 'end' }],
};

function source(passages: unknown[] = [opening, end], startId = 'opening'): string {
  return JSON.stringify({ startId, passages });
}

test('parses paragraphs, choices, Continue, and terminal passages from the example', () => {
  const story = parseStory(readFileSync(new URL('../src/example.story.json', import.meta.url), 'utf8'));
  assert.equal(story.startId, 'gate');
  assert.equal(story.passages.length, 3);
  assert.equal(story.passages[0]?.text.length, 2);
  assert.equal(story.passages[0]?.choices[0]?.destinationId, 'messenger');
  assert.equal(story.passages[1]?.continueTo, 'council');
  assert.deepEqual(story.passages[2]?.choices, []);
  assert.equal(story.passages[2]?.continueTo, undefined);
});

test('IDs survive reordering, prose edits, and inserting an unrelated passage', () => {
  const original = parseStory(source());
  const edited = parseStory(source([
    end,
    { id: 'extra', title: 'Extra', text: ['Elsewhere.'], choices: [] },
    { ...opening, title: 'Renamed', text: ['Rewritten.'] },
  ]));
  assert.equal(edited.startId, original.startId);
  assert.equal(edited.passages.find(p => p.id === 'opening')?.id, original.passages[0]?.id);
  assert.equal(edited.passages.find(p => p.id === 'opening')?.choices[0]?.destinationId, 'end');
});

test('rejects duplicate IDs even when the titles differ', () => {
  assert.throws(() => parseStory(source([opening, { ...end, id: 'opening' }])), /Duplicate passage ID "opening"/);
});

test('rejects an unknown start ID', () => {
  assert.throws(() => parseStory(source([end], 'missing')), /Missing start passage "missing"/);
});

test('rejects a missing choice destination', () => {
  assert.throws(() => parseStory(source([opening])), /"opening" has missing destination "end"/);
});

test('rejects a missing Continue destination', () => {
  assert.throws(() => parseStory(source([{ ...opening, choices: [], continueTo: 'missing' }])), /missing destination "missing"/);
});

test('validates destinations in passages that are not reachable from the start', () => {
  const unreachable = { ...opening, choices: [{ label: 'Leave', destinationId: 'missing' }] };
  assert.throws(() => parseStory(source([end, unreachable], 'end')), /missing destination/);
});

test('rejects combining choices and Continue', () => {
  assert.throws(() => parseStory(source([{ ...opening, continueTo: 'end' }, end])), /both choices and Continue/);
});

test('rejects malformed JSON', () => {
  assert.throws(() => parseStory('{'), SyntaxError);
});

for (const invalid of [null, [], {}, { startId: 'opening', passages: [] }]) {
  test(`rejects an invalid story shape: ${JSON.stringify(invalid)}`, () => {
    assert.throws(() => parseStory(JSON.stringify(invalid)));
  });
}

for (const invalidId of ['', 'two words', 'Uppercase', '1number', ' gate ']) {
  test(`rejects an invalid authored ID: ${JSON.stringify(invalidId)}`, () => {
    assert.throws(() => parseStory(source([{ ...end, id: invalidId }], invalidId)), /must/);
  });
}

test('requires explicit valid IDs on every passage, not just the start passage', () => {
  for (const invalidId of [undefined, '', 'bad id']) {
    assert.throws(() => parseStory(source([end, { ...opening, id: invalidId }], 'end')), /Passage id must/);
  }
});

test('rejects unsupported fields rather than silently accepting scripting commands', () => {
  assert.throws(() => parseStory(source([{ ...opening, random: true }, end])), /unknown field "random"/);
  assert.throws(() => parseStory(JSON.stringify({ startId: 'end', passages: [end], procedures: [] })), /unknown field "procedures"/);
  assert.throws(() => parseStory(source([
    { ...opening, choices: [{ label: 'Walk', destinationId: 'end', call: 'setup' }] }, end,
  ])), /unknown field "call"/);
});

test('rejects malformed passage text and actions', () => {
  for (const changes of [
    { title: '' }, { text: 'not an array' }, { text: [] }, { text: [42] },
    { choices: null }, { choices: [{ label: '', destinationId: 'end' }] },
    { choices: [{ label: 'Walk' }] }, { choices: [], continueTo: null },
  ]) {
    assert.throws(() => parseStory(source([{ ...opening, ...changes }, end])));
  }
});

test('keeps validated story data immutable', () => {
  const story = parseStory(source());
  const passage = story.passages[0]!;
  assert.ok(Object.isFrozen(story));
  assert.ok(Object.isFrozen(story.passages));
  assert.ok(Object.isFrozen(passage));
  assert.ok(Object.isFrozen(passage.text));
  assert.ok(Object.isFrozen(passage.choices));
  assert.ok(Object.isFrozen(passage.choices[0]));
});

test('preserves markup-like prose as literal text', () => {
  const story = parseStory(source([{ ...end, text: ['<script>alert(1)</script>'] }], 'end'));
  assert.equal(story.passages[0]?.text[0], '<script>alert(1)</script>');
});
