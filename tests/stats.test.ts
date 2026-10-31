import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { characterStats } from '../src/panels';
import { GameSession } from '../src/session';
import { SAVE_FORMAT_VERSION, STORY_ID, STORY_REVISION, STORAGE_KEY } from '../src/storage';
import type { CheckpointStorage } from '../src/storage';
import { parseStory } from '../src/story';

const passage = '*passage start\n*title Start\nText.';

test('stats reference earlier variables of every primitive type in author-defined order', () => {
  const story = parseStory([
    '*var influence 0', '*stat influence "Influence"', '*skill diplomacy "Diplomacy"',
    '*var name "Unknown"', '*item coin "Coin"', '*stat name "Name"',
    '*var loyal false', '*stat loyal "Loyal"', '*var hidden 5', '*chapter Prologue', passage,
  ].join('\n'));
  assert.deepEqual(story.stats, [
    { variable: 'influence', label: 'Influence' }, { variable: 'name', label: 'Name' }, { variable: 'loyal', label: 'Loyal' },
  ]);
  assert.deepEqual(story.initialVariables, { influence: 0, name: 'Unknown', loyal: false, hidden: 5 });
  assert.deepEqual(characterStats(story, new Game(story).state), [
    { label: 'Influence', value: '0' }, { label: 'Name', value: 'Unknown' }, { label: 'Loyal', value: 'No' },
  ]);
});

test('stat metadata is frozen, JSON-serializable, and independent of gameplay state', () => {
  const story = parseStory('*var score 1\n*stat score "Score"\n' + passage);
  assert.ok(Object.isFrozen(story.stats));
  assert.ok(Object.isFrozen(story.stats[0]));
  assert.equal(Reflect.set(story, 'stats', []), false);
  assert.equal(Reflect.set(story.stats[0]!, 'variable', 'other'), false);
  assert.equal(Reflect.set(story.stats[0]!, 'label', 'Other'), false);
  assert.throws(() => Array.prototype.push.call(story.stats, { variable: 'score', label: 'Other' }), TypeError);
  assert.deepEqual(JSON.parse(JSON.stringify(story.stats)), [{ variable: 'score', label: 'Score' }]);
  const game = new Game(story);
  assert.equal(Object.hasOwn(game.state, 'stats'), false);
  assert.equal(Object.hasOwn(game.checkpoint.state, 'stats'), false);
  assert.deepEqual(Object.keys(game.state.variables), ['score']);
});

test('stories without stat declarations have an immutable empty list and no selected values', () => {
  const story = parseStory('*var hidden 1\n' + passage);
  assert.deepEqual(story.stats, []);
  assert.ok(Object.isFrozen(story.stats));
  assert.deepEqual(characterStats(story, new Game(story).state), []);
});

test('labels use JSON string escapes, keep literal contents, and may be duplicated for different variables', () => {
  const label = '  "Name" \\ path\n♥ $' + '{unknown} <b>Label</b>  ';
  const story = parseStory('*var first 1\n*var second false\n*stat second ' + JSON.stringify(label)
    + '\n*stat first ' + JSON.stringify(label) + '\n' + passage);
  assert.deepEqual(story.stats, [{ variable: 'second', label }, { variable: 'first', label }]);
  assert.deepEqual(characterStats(story, new Game(story).state), [{ label, value: 'No' }, { label, value: '1' }]);
});

for (const declaration of [
  '*stat', '*stat score', '*stat score 1', '*stat score true', '*stat score null',
  '*stat score []', '*stat score {}', '*stat score Label', "*stat score 'Label'",
  '*stat score ""', '*stat score "   "', '*stat score "\\n\\t"', '*stat score "unclosed',
  '*stat score "bad\\x"', '*stat score "Score" trailing', '*stat score "Score" "Other"',
  '*stat score "Score" [if score > 0]', '*stat score + 1 "Score"',
  '*stat Upper "Score"', '*stat 1score "Score"', '*stat bad.id "Score"', '*stat $score "Score"',
]) {
  test('rejects malformed stat declaration with its source line: ' + declaration, () => {
    assert.throws(() => parseStory('*var score 1\n' + declaration + '\n' + passage), /Line 2:/);
  });
}

for (const variable of ['missing', 'constructor', 'toString', 'diplomacy']) {
  test('stat references must be previously declared own variables: ' + variable, () => {
    assert.throws(() => parseStory('*skill diplomacy "Skill"\n*item diplomacy "Item"\n*stat '
      + variable + ' "Label"\n' + passage), /Line 3:/);
  });
}

test('stat references cannot be declared later', () => {
  assert.throws(() => parseStory('*stat score "Score"\n*var score 0\n' + passage), /Line 1: Undeclared stat variable "score"/);
});

test('constructor and identifier punctuation work when declared; skill/item namespaces do not interfere', () => {
  const story = parseStory('*var constructor 2\n*var field-kit_2 true\n*skill constructor "Skill"\n*item constructor "Item"\n'
    + '*stat constructor "Constructor"\n*stat field-kit_2 "Field kit"\n' + passage);
  assert.deepEqual(characterStats(story, new Game(story).state), [
    { label: 'Constructor', value: '2' }, { label: 'Field kit', value: 'Yes' },
  ]);
});

for (const label of ['"Same"', '"Other"']) {
  test('duplicate stat displays for a variable are rejected even without story usage: ' + label, () => {
    assert.throws(() => parseStory('*var score 1\n*stat score "Same"\n*stat score ' + label + '\n' + passage),
      /Line 3: Duplicate stat display for "score"/);
  });
}

for (const body of [
  '*chapter Prologue\n*stat score "Score"\n' + passage,
  '*passage start\n*stat score "Score"\n*title Start\nText.',
  '*passage start\n*title Start\n*stat score "Score"\nText.',
  passage + '\n*stat score "Score"',
  passage + '\n*choice\n#Again -> start\n*stat score "Score"',
  passage + '\n*continue start\n*stat score "Score"',
  passage + '\n*input_text name "Name" -> start\n*stat score "Score"',
  passage + '\n\n*show_if score == 1\n*stat score "Score"\nText.',
  passage + '\n*chapter Later\n*stat score "Score"\n*passage end\n*title End\nText.',
  passage + '\n*passage unreachable\n*title Unreachable\n*stat score "Score"\nText.',
  passage + '\n*passage fatal\n*title Fatal\nText.\n*death\n*stat score "Score"',
]) {
  test('stat declarations cannot occur outside initial metadata: ' + body.split('\n').slice(0, 3).join(' / '), () => {
    assert.throws(() => parseStory('*var score 1\n*var name "Unknown"\n' + body), /Line \d+(?:, passage "[^"]+")?:/);
  });
}

for (const [literal, display] of [
  ['true', 'Yes'], ['false', 'No'], ['0', '0'], ['-0', '0'], ['-3.75', '-3.75'], ['1e30', '1e+30'],
  ['""', ''], ['"false"', 'false'], ['"Mary Jane"', 'Mary Jane'], ['"<img src=x onerror=alert(1)>"', '<img src=x onerror=alert(1)>'],
] as const) {
  test('formats one committed primitive as text without changing its value: ' + literal, () => {
    const story = parseStory('*var value ' + literal + '\n*stat value "Value"\n' + passage);
    const game = new Game(story); const state = game.state;
    assert.deepEqual(characterStats(story, state), [{ label: 'Value', value: display }]);
    assert.equal(game.state, state);
    assert.ok(Object.is(game.state.variables.value, story.initialVariables.value));
  });
}

const definitions = [
  '*var influence 1', '*var name "Unknown"', '*var loyal false',
  '*skill diplomacy "Diplomacy"', '*item coin "Coin"',
].join('\n') + '\n';
const displays = '*stat name "Name"\n*stat influence "Influence"\n*stat loyal "Loyal"\n';
const source = [
  '*chapter Prologue',
  '*passage gate', '*title Gate', '*add influence 1', '*journal arrived "Arrived."', 'Gate.',
  '*choice', '#Name -> choose_name', '#Camp -> camp',
  '*passage choose_name', '*title Name', 'Name?', '*input_text name "Name" -> camp',
  '*passage camp', '*title Camp', '*checkpoint', '*add influence 2', '*set loyal true', '*grant_skill diplomacy',
  '*add_item coin 3', '*journal rested "Welcome $' + '{name}."', 'Camp.', '*choice', '#Danger -> ruins', '#Rest -> safe',
  '*passage ruins', '*title Ruins', '*add influence 5', '*set loyal false', '*set name "Other"',
  '*revoke_skill diplomacy', '*remove_item coin 1', '*journal explored "Explored."', 'Ruins.', '*continue death',
  '*passage death', '*title Death', '*add influence 100', 'You fall.', '*death',
  '*passage safe', '*title Safe', 'Rest.',
].join('\n');
const story = parseStory(definitions + displays + source);

test('Character derives updated values only after successful entry effects and text submission', () => {
  const game = new Game(story);
  const initial = game.state;
  assert.deepEqual(characterStats(story, game.state), [
    { label: 'Name', value: 'Unknown' }, { label: 'Influence', value: '2' }, { label: 'Loyal', value: 'No' },
  ]);
  game.navigate('choose_name');
  const input = game.state;
  assert.throws(() => game.submitText('   '), /between 1 and 80/);
  assert.equal(game.state, input);
  game.submitText('  Éléonore 王 <b>Hero</b>  ');
  assert.deepEqual(characterStats(story, game.state), [
    { label: 'Name', value: 'Éléonore 王 <b>Hero</b>' }, { label: 'Influence', value: '4' }, { label: 'Loyal', value: 'Yes' },
  ]);
  assert.equal(initial.variables.name, 'Unknown');
  assert.equal(game.checkpoint.state.variables.name, 'Éléonore 王 <b>Hero</b>');
  assert.equal(game.state.journal.at(-1)?.text, 'Welcome Éléonore 王 <b>Hero</b>.');
});

class MemoryStorage implements CheckpointStorage {
  record: string | null = null;
  writes = 0;
  reads = 0;
  getItem(key: string): string | null { assert.equal(key, STORAGE_KEY); this.reads++; return this.record; }
  setItem(key: string, value: string): void { assert.equal(key, STORAGE_KEY); this.writes++; this.record = value; }
}

function startSession() {
  const storage = new MemoryStorage(); const session = new GameSession(story, storage);
  assert.equal(session.newGame(() => true), 'started');
  session.navigate('choose_name'); session.submitText('Eleanor');
  return { session, storage };
}

test('Character inspection is read-only and never reads/writes storage or repeats effects', () => {
  const { session, storage } = startSession();
  const game = session.game!; const state = game.state; const checkpoint = game.checkpoint;
  const record = storage.record; const writes = storage.writes; const reads = storage.reads;
  for (let i = 0; i < 20; i++) {
    const rows = characterStats(story, game.state);
    assert.deepEqual(rows.map(row => row.value), ['Eleanor', '4', 'Yes']);
    // Derived text is disposable; modifying it cannot change Story or GameState.
    rows[0]!.value = 'Other';
    rows[0]!.label = 'Other';
  }
  assert.equal(game.state, state); assert.equal(game.checkpoint, checkpoint);
  assert.equal(story.stats[0]?.label, 'Name');
  assert.equal(storage.record, record); assert.equal(storage.writes, writes); assert.equal(storage.reads, reads);
});

test('Character values restore after Try Again and Continue Game with no recovery or viewing writes', () => {
  const { session, storage } = startSession();
  const expected = characterStats(story, session.game!.state);
  const state = session.game!.state; const checkpoint = session.game!.checkpoint;
  const record = storage.record; const writes = storage.writes;
  for (let cycle = 0; cycle < 3; cycle++) {
    session.navigate('ruins'); session.navigate('death');
    assert.deepEqual(characterStats(story, session.game!.state).map(row => row.value), ['Other', '109', 'No']);
    session.retryAfterDeath();
    assert.deepEqual(characterStats(story, session.game!.state), expected);
    assert.deepEqual(session.game!.state, state);
    assert.equal(session.game!.checkpoint, checkpoint);
    assert.equal(storage.record, record); assert.equal(storage.writes, writes);
  }
  const continued = new GameSession(story, storage).continueGame();
  assert.deepEqual(characterStats(story, continued.state), expected);
  assert.deepEqual(continued.state, state);
  assert.equal(storage.record, record); assert.equal(storage.writes, writes);
});

test('adding/reordering/renaming stat displays preserves old saves, snapshot schema, and revision', () => {
  const before = parseStory(definitions + source);
  const storage = new MemoryStorage(); const original = new GameSession(before, storage);
  assert.equal(original.newGame(() => true), 'started');
  original.navigate('choose_name'); original.submitText('Eleanor');
  const expected = original.game!.state; const saved = storage.record; const writes = storage.writes;
  const envelope = JSON.parse(saved!);
  assert.deepEqual(Object.keys(envelope), ['formatVersion', 'storyId', 'storyRevision', 'checkpoint']);
  assert.deepEqual(Object.keys(envelope.checkpoint), ['state']);
  assert.deepEqual(Object.keys(envelope.checkpoint.state), ['passageId', 'variables', 'journal', 'skills', 'inventory']);
  assert.equal(envelope.formatVersion, SAVE_FORMAT_VERSION); assert.equal(SAVE_FORMAT_VERSION, 1);
  assert.equal(envelope.storyId, STORY_ID); assert.equal(STORY_REVISION, 1);
  for (const stats of [displays, '*stat loyal "Oath"\n*stat name "Alias"\n', '']) {
    const revised = parseStory(definitions + stats + source);
    const session = new GameSession(revised, storage);
    assert.equal(session.startup.status, 'ready');
    const game = session.continueGame();
    assert.deepEqual(game.state, expected);
    assert.equal(game.state.variables.name, 'Eleanor');
    assert.deepEqual(game.checkpoint, original.game!.checkpoint);
    assert.equal(storage.record, saved); assert.equal(storage.writes, writes);
    assert.deepEqual(characterStats(revised, game.state).map(row => row.label), revised.stats.map(stat => stat.label));
  }
});

test('the example displays ordinary character variables in order without changing original route outcomes', () => {
  const example = parseStory(readFileSync(new URL('../src/example.story', import.meta.url), 'utf8'));
  assert.deepEqual(example.stats.map(stat => stat.variable), ['character_name', 'influence', 'honor', 'loyal']);
  for (const messenger of [false, true]) {
    const game = new Game(example);
    if (messenger) game.navigate('messenger');
    game.navigate('council');
    assert.deepEqual(characterStats(example, game.state).map(row => row.value),
      messenger ? ['Alexander', '2.5', '4', 'Yes'] : ['Alexander', '0.5', '5', 'No']);
  }
});
