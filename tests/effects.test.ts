import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { interpolate } from '../src/interpolate';
import { parseStory } from '../src/story';

const route = parseStory(`*var count 0
*var loyal false
*var name "Unknown"
*passage first
*title First
*add count 1
Count: \${count}.
*choice
#Next -> second
*passage second
*title Second
*add count 10
*set loyal true
*set name "Alexander"
Count: \${count}, \${name}, loyal: \${loyal}.
*continue first`);

test('a new game owns independent initialized primitive variables', () => {
  const game = new Game(parseStory('*var count -0.5\n*var loyal false\n*var name "Unknown"\n*passage start\n*title Start\nText.'));
  assert.deepEqual(game.state.variables, { count: -0.5, loyal: false, name: 'Unknown' });
});

test('the initial passage applies effects exactly once', () => {
  const game = new Game(route);
  assert.equal(game.state.passageId, 'first');
  assert.equal(game.state.variables.count, 1);
  assert.equal(route.initialVariables.count, 0);
});

test('effects execute in source order and set preserves primitive types', () => {
  const story = parseStory(`*var count 1\n*var loyal false\n*var name "Unknown"\n*passage start\n*title Start\n*add count 2\n*set count 10\n*add count -0.25\n*set loyal true\n*set name "Alexander"\nText.`);
  assert.deepEqual(new Game(story).state.variables, { count: 9.75, loyal: true, name: 'Alexander' });
});

test('reading and resolving paragraphs repeatedly cannot execute effects or mutate content', () => {
  const game = new Game(route);
  game.navigate('second');
  const before = game.state;
  const paragraphs = game.passage.paragraphs;
  for (let i = 0; i < 3; i++) {
    assert.deepEqual(game.visibleParagraphs.map(p => interpolate(p.text, game.state.variables)), ['Count: 11, Alexander, loyal: true.']);
    assert.equal(game.passage.paragraphs, paragraphs);
    assert.equal(game.state, before);
  }
  assert.deepEqual(paragraphs, [{ text: 'Count: ${count}, ${name}, loyal: ${loyal}.' }]);
});

test('a later legitimate re-entry applies effects once again without resetting variables', () => {
  const game = new Game(route);
  game.navigate('second');
  assert.equal(game.state.variables.count, 11);
  game.navigate('first');
  assert.equal(game.state.variables.count, 12);
  assert.equal(game.state.variables.loyal, true);
  game.navigate('second');
  assert.equal(game.state.variables.count, 22);
});

test('identical inputs and actions produce identical states in independent games', () => {
  const first = new Game(route);
  const second = new Game(route);
  assert.notEqual(first.state.variables, second.state.variables);
  assert.notEqual(first.state.variables, route.initialVariables);
  for (const destination of ['second', 'first', 'second']) {
    first.navigate(destination);
    second.navigate(destination);
    assert.deepEqual(first.state, second.state);
    assert.notEqual(first.state.variables, second.state.variables);
  }
  first.navigate('first');
  assert.equal(second.state.variables.count, 22);
  assert.equal(route.initialVariables.count, 0);
});

test('rejected navigation leaves all current values and the state object unchanged', () => {
  const game = new Game(route);
  const before = game.state;
  assert.throws(() => game.navigate('missing'), /has no action/);
  assert.throws(() => game.navigate('first'), /has no action/);
  assert.equal(game.state, before);
  assert.equal(game.state.variables.count, 1);
});

test('exposed nested state and previously captured state cannot be mutated', () => {
  const game = new Game(route);
  const before = game.state;
  assert.equal(Reflect.set(before.variables, 'count', 999), false);
  assert.equal(Reflect.set(before, 'variables', { count: 999 }), false);
  game.navigate('second');
  assert.equal(before.variables.count, 1);
  assert.equal(game.state.variables.count, 11);
  assert.notEqual(before.variables, game.state.variables);
  assert.equal(Reflect.set(game.state.variables, 'loyal', false), false);
});

const overflow = `*var count 0
*var huge 1e308
*passage start
*title Start
Text.
*choice
#Risk -> risk
#Safe -> safe
*passage risk
*title Risk
*add count 1
*add huge 1e308
*set huge 0
Text.
*passage safe
*title Safe
*set huge 0
Text.`;

test('numeric overflow rolls back the entire transition, including earlier effects', () => {
  const game = new Game(parseStory(overflow));
  const before = game.state;
  assert.throws(() => game.navigate('risk'), /Passage "risk": \*add on "huge" produced a non-finite number/);
  assert.equal(game.state, before);
  assert.deepEqual(game.state.variables, { count: 0, huge: 1e308 });
  assert.equal(game.passage.id, 'start');
  // Retrying cannot accumulate partial effects, and valid navigation still works.
  assert.throws(() => game.navigate('risk'), /non-finite/);
  assert.equal(game.state, before);
  game.navigate('safe');
  assert.deepEqual(game.state.variables, { count: 0, huge: 0 });
});

test('initial entry also fails atomically when effects overflow', () => {
  let game: Game | undefined;
  assert.throws(() => {
    game = new Game(parseStory('*var huge 1e308\n*passage start\n*title Start\n*add huge 1e308\nText.'));
  }, /non-finite/);
  assert.equal(game, undefined);
});

test('negative overflow is rejected and does not commit the destination', () => {
  const game = new Game(parseStory(overflow.replaceAll('1e308', '-1e308')));
  const before = game.state;
  assert.throws(() => game.navigate('risk'), /non-finite/);
  assert.equal(game.state, before);
});

test('the example keeps both routes while demonstrating different variable results', () => {
  const story = parseStory(readFileSync(new URL('../src/example.story', import.meta.url), 'utf8'));
  const messenger = new Game(story);
  messenger.navigate('messenger');
  messenger.navigate('council');
  assert.deepEqual(messenger.state.variables, { influence: 2.5, honor: 4, loyal: true, character_name: 'Alexander' });
  const direct = new Game(story);
  direct.navigate('council');
  assert.deepEqual(direct.state.variables, { influence: 0.5, honor: 5, loyal: false, character_name: 'Alexander' });
  assert.equal(JSON.stringify(story).includes('${influence}'), true);
  assert.deepEqual(JSON.parse(JSON.stringify(messenger.state)), messenger.state);
});
