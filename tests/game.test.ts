import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { parseStory } from '../src/story';

const story = parseStory(readFileSync(new URL('../src/example.story.json', import.meta.url), 'utf8'));

test('enters the authored starting passage', () => {
  const game = new Game(story);
  assert.deepEqual(game.state, { passageId: 'gate' });
  assert.equal(game.passage.id, 'gate');
});

test('follows a choice then an explicit Continue destination', () => {
  const game = new Game(story);
  game.navigate('messenger');
  assert.equal(game.state.passageId, 'messenger');
  assert.equal(game.passage.title, 'A Quiet Warning');
  // Continue does not run automatically on entry or when reading the passage.
  assert.equal(game.passage.continueTo, 'council');
  assert.equal(game.state.passageId, 'messenger');
  game.navigate('council');
  assert.equal(game.state.passageId, 'council');
});

test('can follow the alternative direct route', () => {
  const game = new Game(story);
  game.navigate('council');
  assert.equal(game.passage.id, 'council');
});

test('navigation uses IDs even when passage definitions are reordered', () => {
  const reordered = parseStory(JSON.stringify({ ...story, passages: [...story.passages].reverse() }));
  const game = new Game(reordered);
  assert.equal(game.passage.id, 'gate');
  game.navigate('messenger');
  assert.equal(game.passage.id, 'messenger');
  game.navigate('council');
  assert.equal(game.passage.id, 'council');
});

test('rejects a nonexistent destination without changing state', () => {
  const game = new Game(story);
  const before = game.state;
  assert.throws(() => game.navigate('missing'), /has no action/);
  assert.equal(game.state, before);
});

test('rejects jumping to an existing passage with no active action to it', () => {
  const game = new Game(story);
  game.navigate('messenger');
  assert.throws(() => game.navigate('gate'), /has no action/);
  assert.equal(game.state.passageId, 'messenger');
});

test('terminal passages do not allow further navigation', () => {
  const game = new Game(story);
  game.navigate('council');
  assert.throws(() => game.navigate('gate'), /has no action/);
  assert.equal(game.state.passageId, 'council');
});

test('navigation replaces centrally owned state and cannot be mutated by callers', () => {
  const game = new Game(story);
  const before = game.state;
  assert.equal(Reflect.set(before, 'passageId', 'council'), false);
  assert.equal(game.state.passageId, 'gate');
  game.navigate('messenger');
  assert.notEqual(game.state, before);
  assert.equal(before.passageId, 'gate');
  assert.ok(Object.isFrozen(game.state));
});

test('the same actions produce the same state and do not affect another game', () => {
  const first = new Game(story);
  const second = new Game(story);
  first.navigate('messenger');
  assert.equal(second.state.passageId, 'gate');
  second.navigate('messenger');
  assert.deepEqual(first.state, second.state);
  first.navigate('council');
  second.navigate('council');
  assert.deepEqual(first.state, second.state);
});
