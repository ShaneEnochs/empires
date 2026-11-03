import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game';
import { parseStory } from '../src/story';
import { exploreGameplay } from '../src/preflight';
import { GameSession } from '../src/session';

const route = [
  '*var response "none"',
  '*passage start', '*title Start', 'A rude passenger passes you.', '*choice',
  '#Confront him -> arrival [set response "confront"]',
  '#Ignore him -> arrival [set response "ignore"]',
  '*passage arrival', '*title Arrival',
  '*show_if response == "confront"',
  'You confront him.',
  '*show_if response == "ignore"',
  'You ignore him.',
  'The harbor welcomes you.',
].join('\n');

test('two choices to one passage retain their distinct assignments and conditional prose', () => {
  const story = parseStory(route);
  const choices = story.passages[0]!.choices;
  assert.deepEqual(choices.map(choice => choice.assignment), [
    { variable: 'response', value: 'confront' }, { variable: 'response', value: 'ignore' },
  ]);
  assert.ok(Object.isFrozen(choices[0]!.assignment));
  assert.throws(() => new Game(story).navigate('arrival'), /select a specific choice/);
  for (const [index, expected] of ['confront', 'ignore'].entries()) {
    const game = new Game(story);
    game.navigateChoice(game.visibleChoices[index]!);
    assert.equal(game.passage.id, 'arrival');
    assert.equal(game.state.variables.response, expected);
    const text = game.visibleParagraphs.map(p => p.text).join(' ');
    assert.match(text, new RegExp('You ' + (expected === 'confront' ? 'confront' : 'ignore') + ' him'));
    assert.doesNotMatch(text, new RegExp('You ' + (expected === 'confront' ? 'ignore' : 'confront') + ' him'));
    assert.match(text, /harbor welcomes you/);
  }
});

test('assignments are typed, support quoted brackets and combine with an existing condition', () => {
  const story = parseStory([
    '*var mode "none"', '*var checked false', '*var credits 0', '*var ready true',
    '*passage start', '*title Start', 'Select.', '*choice',
    '#A -> end [set mode "a]b"] [if ready == true]',
    '#B -> end [if ready == false] [set checked true]',
    '#C -> end [set credits 100]',
    '*passage end', '*title End', 'Done.',
  ].join('\n'));
  const game = new Game(story);
  assert.deepEqual(game.visibleChoices.map(c => c.label), ['A', 'C']);
  game.navigateChoice(game.visibleChoices[0]!);
  assert.equal(game.state.variables.mode, 'a]b');
  const other = new Game(story);
  other.navigateChoice(other.visibleChoices[1]!);
  assert.equal(other.state.variables.credits, 100);
  assert.equal(other.state.variables.mode, 'none');
});

test('malformed choice assignments fail during parsing with line context', () => {
  const invalid = [
    ['[set unknown "value"]', /declared global variable/],
    ['[set mode true]', /preserve the declared type/],
    ['[set mode]', /at most one condition suffix/],
    ['[set mode "a"] [set mode "b"]', /only one variable/],
    ['[set mode "a"] [if ready == true] [if ready == true]', /at most one condition/],
    ['[set mode "unterminated]', /Expected \[if condition\]/],
  ] as const;
  for (const [suffix, error] of invalid) {
    const story = [
      '*var mode "none"', '*var ready true', '*passage start', '*title Start', 'Begin.', '*choice',
      '#Pick -> end ' + suffix, '*passage end', '*title End', 'Done.',
    ].join('\n');
    assert.throws(() => parseStory(story), error);
  }
  assert.throws(() => parseStory([
    '*var mode "none"', '*passage start', '*title Start', '*temp local "x"',
    'Begin.', '*choice', '#Pick -> end [set local "y"]',
    '*passage end', '*title End', 'Done.',
  ].join('\n')), /declared global variable/);
});

test('disabled, stale, and forged choices cannot assign variables', () => {
  const story = parseStory([
    '*var response "none"', '*var ready false', '*passage start', '*title Start', 'Choose.', '*choice',
    '#Disabled -> end [set response "bad"] [selectable_if ready == true]',
    '#Allowed -> end [set response "good"]',
    '*passage end', '*title End', 'Done.',
  ].join('\n'));
  const game = new Game(story);
  const disabled = game.visibleChoices[0]!;
  const allowed = game.visibleChoices[1]!;
  const snapshot = game.state;
  assert.throws(() => game.navigateChoice(disabled), /not currently available/);
  assert.throws(() => game.navigateChoice({ ...allowed }), /not currently available/);
  assert.equal(game.state, snapshot);
  game.navigateChoice(allowed);
  assert.equal(game.state.variables.response, 'good');
  assert.throws(() => game.navigateChoice(allowed), /not currently available/);
});

test('choice assignments and destination effects are atomic even on entry failure', () => {
  const story = parseStory([
    '*var response "none"', '*item token "Token"',
    '*passage start', '*title Start', 'Choose.', '*choice',
    '#Break -> broken [set response "confront"]',
    '#Safe -> safe',
    '*passage broken', '*title Broken', '*remove_item token 1', 'Error.',
    '*passage safe', '*title Safe', 'Done.',
  ].join('\n'));
  const game = new Game(story), state = game.state, checkpoint = game.checkpoint;
  assert.throws(() => game.navigateChoice(game.visibleChoices[0]!), /insufficient inventory/);
  assert.equal(game.state, state);
  assert.equal(game.checkpoint, checkpoint);
  game.navigateChoice(game.visibleChoices[1]!);
  assert.equal(game.state.passageId, 'safe');
  assert.equal(game.state.variables.response, 'none');
});

test('choice assignments survive browser-independent save/reload', () => {
  const story = parseStory(route);
  let raw: string | null = null;
  const storage = {
    getItem: (_key: string) => raw,
    setItem: (_key: string, value: string) => { raw = value; },
  };
  const session = new GameSession(story, storage);
  assert.equal(session.newGame(() => true), 'started');
  session.navigateChoice(session.game!.visibleChoices[1]!);
  assert.equal(session.game!.state.variables.response, 'ignore');
  const saved = raw;
  const restored = new GameSession(story, storage);
  assert.equal(restored.continueGame().state.variables.response, 'ignore');
  assert.equal(raw, saved);
});

test('preflight explores both same-destination choices, including failures unique to one assignment', () => {
  const story = parseStory([
    '*var response "none"', '*item token "Token"',
    '*passage start', '*title Start', 'Choose.', '*choice',
    '#Confront -> arrival [set response "confront"]',
    '#Ignore -> arrival [set response "ignore"]',
    '*passage arrival', '*title Arrival',
    '*if response == "ignore"',
    '  *remove_item token 1',
    'A harbor.',
  ].join('\n'));
  const report = exploreGameplay(story);
  assert.equal(report.exploredRoutes, 3);
  const failure = report.diagnostics.find(d => d.code === 'ENTRY_FAILURE');
  assert.ok(failure);
  assert.equal(failure.route?.at(-1)?.choiceIndex, 1);
  assert.match(failure.message, /insufficient inventory/);
});
