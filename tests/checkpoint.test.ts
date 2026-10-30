import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { interpolate } from '../src/interpolate';
import { validateSnapshot } from '../src/snapshot';
import { parseStory } from '../src/story';
import type { GameState } from '../src/types';

const countText = '$' + '{count}';
const nameText = '$' + '{name}';
const story = parseStory([
  '*var count 0', '*var loyal false', '*var name "Unknown"', '*var faction "none"', '*var huge 1e308',
  '*skill composure "Composure"', '*skill herbalism "Herbalism"', '*skill diplomacy "Diplomacy"',
  '*item gold_coin "Gold Coin"', '*item potion "Potion"',
  '*chapter Prologue', '*passage gate', '*title Gate', '*add count 1', '*set name "Alexander"',
  '*grant_skill composure', '*grant_skill herbalism', '*add_item gold_coin 10', '*add_item potion 2',
  '*journal arrived "Arrival ' + countText + '."', 'Gate.',
  '*choice', '#Camp -> camp', '#Ordinary -> later', '#Risk -> bad_checkpoint', '#Ordinary risk -> bad_ordinary',
  '*chapter Chapter One', '*passage camp', '*title Camp', '*checkpoint',
  '*add count 2', '*set loyal true', '*set faction "court"', '*grant_skill diplomacy', '*revoke_skill composure',
  '*remove_item gold_coin 10', '*add_item gold_coin 3', '*remove_item potion 1',
  '*journal camp_event "Camp ' + nameText + ': ' + countText + '."', 'Camp ' + nameText + '.',
  '', '*show_if count >= 3', 'Count qualifies.',
  '', '*show_if has_skill diplomacy', 'Diplomacy qualifies.',
  '', '*show_if lacks_skill composure', 'Composure absent.',
  '', '*show_if item_count gold_coin >= 3', 'Inventory qualifies.',
  '*choice', '#Onward -> later [if loyal == true]', '#Court -> later [if faction == "court"]',
  '#Skill -> later [if has_skill diplomacy]', '#Items -> later [if has_item potion]', '#Fallback -> later',
  '*passage later', '*title Later', '*add count 10', '*set name "Eleanor"', '*set loyal false', '*set faction "guild"',
  '*revoke_skill diplomacy', '*grant_skill composure', '*add_item gold_coin 10', '*add_item potion 2',
  '*journal later_event "Later ' + nameText + '."', 'Later.', '*continue camp',
  '*passage bad_checkpoint', '*title Bad Checkpoint', '*checkpoint', '*add count 2', '*grant_skill diplomacy',
  '*revoke_skill composure', '*journal failed "Failed."', '*add_item gold_coin 2', '*remove_item gold_coin 1000', 'Bad.',
  '*passage bad_ordinary', '*title Bad Ordinary', '*add count 2', '*grant_skill diplomacy',
  '*journal ordinary_failed "Failed."', '*add_item potion 1', '*add huge 1e308', 'Bad.',
].join('\n'));

function atCamp(): Game {
  const game = new Game(story);
  game.navigate('camp');
  return game;
}

const valid = atCamp().checkpoint;
type RawSnapshot = {
  state: {
    passageId: unknown; variables: Record<string, unknown>; journal: unknown[];
    skills: unknown[]; inventory: Record<string, unknown>;
  };
};
function raw(): RawSnapshot { return JSON.parse(JSON.stringify(valid)) as RawSnapshot; }
const passage = '*passage start\n*title Start\nText.';

test('checkpoint metadata is frozen and supports every concluding action category', () => {
  for (const action of ['', '*continue end', '*choice\n#Next -> end', '*input_text name "Name" -> end']) {
    const parsed = parseStory('*var name "Unknown"\n*passage start\n*title Start\n*checkpoint\nText.\n'
      + action + '\n*passage end\n*title End\nDone.');
    assert.equal(parsed.passages[0]?.checkpoint, true);
    assert.equal(parsed.passages[1]?.checkpoint, undefined);
    assert.deepEqual(parsed.passages[0]?.effects, []);
    assert.equal(Reflect.set(parsed.passages[0]!, 'checkpoint', false), false);
    assert.deepEqual(JSON.parse(JSON.stringify(parsed)), parsed);
  }
});

test('checkpoint follows the title as the next nonblank directive', () => {
  assert.equal(parseStory('*passage start\n*title Start\n \n  *checkpoint  \nText.').passages[0]?.checkpoint, true);
});

for (const directive of ['*checkpoint now', '*checkpoint "camp"', '*checkpoint 1', '*checkpoint [if count == 0]']) {
  test('checkpoint rejects arguments: ' + directive, () => {
    assert.throws(() => parseStory('*passage start\n*title Start\n' + directive + '\nText.'),
      /Line 3, passage "start": \*checkpoint takes no arguments/);
  });
}

test('rejects duplicate/misplaced checkpoints, including unreachable passages', () => {
  const declarations = '*var count 0\n*var name "Unknown"\n*skill diplomacy "Diplomacy"\n*item token "Token"\n';
  for (const body of [
    '*checkpoint\n' + passage,
    '*chapter First\n*checkpoint\n' + passage,
    '*passage start\n*checkpoint\n*title Start\nText.',
    '*passage start\n*title Start\n*checkpoint\n*checkpoint\nText.',
    '*passage start\n*title Start\n*set count 1\n*checkpoint\nText.',
    '*passage start\n*title Start\n*add count 1\n*checkpoint\nText.',
    '*passage start\n*title Start\n*journal event "Text"\n*checkpoint\nText.',
    '*passage start\n*title Start\n*grant_skill diplomacy\n*checkpoint\nText.',
    '*passage start\n*title Start\n*revoke_skill diplomacy\n*checkpoint\nText.',
    '*passage start\n*title Start\n*add_item token 1\n*checkpoint\nText.',
    '*passage start\n*title Start\n*remove_item token 1\n*checkpoint\nText.',
    passage + '\n*checkpoint',
    passage + '\n\n*checkpoint',
    passage + '\n*choice\n#Again -> start\n*checkpoint',
    passage + '\n*continue start\n*checkpoint',
    passage + '\n*input_text name "Name" -> start\n*checkpoint',
    passage + '\n\n*show_if count == 0\n*checkpoint\nConditional.',
    passage + '\n\n*show_if count == 0\nConditional.\n\n*checkpoint',
  ]) {
    assert.throws(() => parseStory(declarations + body), /Line \d+/);
  }
  assert.throws(() => parseStory(declarations + passage + '\n*passage unreachable\n*title Other\n*add count 1\n*checkpoint\nText.'),
    /passage "unreachable": \*checkpoint must immediately follow/);
});

test('new game establishes a complete checkpoint before starting effects', () => {
  const game = new Game(story);
  assert.deepEqual(game.checkpoint, {
    state: { passageId: 'gate', variables: { count: 0, loyal: false, name: 'Unknown', faction: 'none', huge: 1e308 },
      journal: [], skills: [], inventory: {} },
  });
  assert.equal(game.state.variables.count, 1);
  assert.equal(game.state.variables.name, 'Alexander');
  assert.equal(game.state.journal.length, 1);
  assert.deepEqual(game.state.skills, ['composure', 'herbalism']);
  assert.deepEqual(game.state.inventory, { gold_coin: 10, potion: 2 });
});

test('an explicit checkpoint on the start passage still applies effects once', () => {
  const parsed = parseStory('*var count 0\n*passage start\n*title Start\n*checkpoint\n*add count 1\nText.');
  const game = new Game(parsed);
  assert.equal(game.checkpoint.state.variables.count, 0);
  assert.equal(game.state.variables.count, 1);
  const checkpoint = game.checkpoint;
  game.restoreCheckpoint(); game.restoreCheckpoint();
  assert.equal(game.state.variables.count, 1);
  assert.equal(game.checkpoint, checkpoint);
});

test('failed initial entry exposes neither a game nor a partially initialized checkpoint', () => {
  const parsed = parseStory('*item token "Token"\n*passage start\n*title Start\n*checkpoint\n*add_item token 1\n*remove_item token 2\nText.');
  let game: Game | undefined;
  assert.throws(() => { game = new Game(parsed); }, /insufficient inventory/);
  assert.equal(game, undefined);
});

test('authored entry replaces the initial checkpoint with destination pre-entry state', () => {
  const game = new Game(story);
  const initial = game.checkpoint;
  const before = game.state;
  game.navigate('camp');
  assert.notEqual(game.checkpoint, initial);
  assert.deepEqual(game.checkpoint.state, { ...before, passageId: 'camp' });
  assert.equal(game.checkpoint.state.variables.count, 1);
  assert.equal(game.state.variables.count, 3);
  assert.deepEqual(game.checkpoint.state.skills, ['composure', 'herbalism']);
  assert.deepEqual(game.state.skills, ['herbalism', 'diplomacy']);
});

test('ordinary navigation and repeated reads/rendered prose never capture checkpoints', () => {
  const game = new Game(story);
  const checkpoint = game.checkpoint;
  game.navigate('later');
  for (let i = 0; i < 3; i++) {
    game.state; game.passage; game.availableChoices;
    game.visibleParagraphs.map(p => interpolate(p.text, game.state.variables));
    JSON.stringify(game.checkpoint);
    assert.equal(game.checkpoint, checkpoint);
  }
});

test('re-entering the same checkpoint passage replaces its pre-entry snapshot', () => {
  const game = atCamp();
  const first = game.checkpoint;
  game.navigate('later');
  const before = game.state;
  game.navigate('camp');
  assert.notEqual(game.checkpoint, first);
  assert.equal(game.checkpoint.state.passageId, first.state.passageId);
  assert.deepEqual(game.checkpoint.state, { ...before, passageId: 'camp' });
  assert.equal(game.checkpoint.state.variables.count, 13);
  assert.equal(game.state.variables.count, 15);
  assert.equal(game.state.journal[1]?.text, 'Camp Alexander: 3.');
  assert.equal(first.state.variables.count, 1);
});

test('restoration reconstructs every gameplay field and preserves the checkpoint itself', () => {
  const game = atCamp();
  const checkpoint = game.checkpoint;
  const expected = game.state;
  game.navigate('later');
  const later = game.state;
  for (let i = 0; i < 3; i++) {
    game.restoreCheckpoint();
    assert.deepEqual(game.state, expected);
    assert.equal(game.checkpoint, checkpoint);
    assert.deepEqual(game.state.skills, ['herbalism', 'diplomacy']);
    assert.deepEqual(Object.keys(game.state.inventory), ['potion', 'gold_coin']);
    assert.deepEqual(game.state.inventory, { potion: 1, gold_coin: 3 });
    assert.deepEqual(game.state.journal.map(e => [e.id, e.chapter, e.text]), [
      ['arrived', 'Prologue', 'Arrival 1.'], ['camp_event', 'Chapter One', 'Camp Alexander: 3.'],
    ]);
    assert.deepEqual(game.availableChoices.map(c => c.label), ['Onward', 'Court', 'Skill', 'Items', 'Fallback']);
    assert.equal(game.visibleParagraphs.length, 5);
  }
  assert.equal(later.variables.name, 'Eleanor');
  assert.deepEqual(later.skills, ['herbalism', 'composure']);
  assert.equal(later.journal.length, 3);
});

test('restoring an updated checkpoint preserves journal recording order and deduplication', () => {
  const game = atCamp();
  game.navigate('later'); game.navigate('camp');
  const checkpoint = game.checkpoint;
  const expected = game.state;
  assert.deepEqual(checkpoint.state.journal.map(e => e.id), ['arrived', 'camp_event', 'later_event']);
  game.navigate('later'); game.restoreCheckpoint();
  assert.deepEqual(game.state, expected);
  assert.deepEqual(game.state.journal.map(e => e.text), ['Arrival 1.', 'Camp Alexander: 3.', 'Later Eleanor.']);
  assert.deepEqual(Object.keys(game.state.inventory), ['potion', 'gold_coin']);
});

test('failed checkpoint entry rolls back mixed effects and preserves the previous checkpoint', () => {
  const game = new Game(story);
  const before = game.state;
  const checkpoint = game.checkpoint;
  for (let i = 0; i < 3; i++) {
    assert.throws(() => game.navigate('bad_checkpoint'), /insufficient inventory/);
    assert.equal(game.state, before);
    assert.equal(game.checkpoint, checkpoint);
  }
  game.navigate('camp');
  assert.deepEqual(game.state.journal.map(e => e.id), ['arrived', 'camp_event']);
});

test('the initial checkpoint remains usable after failed ordinary navigation', () => {
  const game = new Game(story);
  const checkpoint = game.checkpoint;
  const expected = game.state;
  assert.throws(() => game.navigate('bad_ordinary'), /non-finite/);
  assert.equal(game.checkpoint, checkpoint);
  assert.equal(game.state, expected);
  game.restoreCheckpoint();
  assert.deepEqual(game.state, expected);
  assert.equal(game.checkpoint, checkpoint);
});

test('failed restoration commits neither prepared state nor a replacement checkpoint', t => {
  const game = atCamp();
  const checkpoint = game.checkpoint;
  const expected = game.state;
  game.navigate('later');
  const before = game.state;
  const internal = game as unknown as { enterPassage(input: GameState): GameState };
  const enter = internal.enterPassage.bind(game);
  let failOnce = true;
  t.mock.method(internal, 'enterPassage', (input: GameState) => {
    const candidate = enter(input);
    if (failOnce) { failOnce = false; throw new Error('Simulated entry interruption.'); }
    return candidate;
  });
  assert.throws(() => game.restoreCheckpoint(), /Simulated entry interruption/);
  assert.equal(game.state, before);
  assert.equal(game.checkpoint, checkpoint);
  game.restoreCheckpoint();
  assert.deepEqual(game.state, expected);
  assert.equal(game.checkpoint, checkpoint);
});

test('checkpoint data and all nested records/arrays/entries are independent and frozen', () => {
  const game = atCamp();
  const checkpoint = game.checkpoint;
  assert.notEqual(checkpoint.state.variables, game.state.variables);
  assert.notEqual(checkpoint.state.journal, game.state.journal);
  assert.notEqual(checkpoint.state.journal[0], game.state.journal[0]);
  for (const object of [checkpoint, checkpoint.state, checkpoint.state.variables, checkpoint.state.journal,
    checkpoint.state.journal[0]!, checkpoint.state.skills, checkpoint.state.inventory]) {
    assert.ok(Object.isFrozen(object));
  }
  assert.equal(Reflect.set(checkpoint, 'state', game.state), false);
  assert.equal(Reflect.set(checkpoint.state.variables, 'count', 999), false);
  assert.equal(Reflect.set(checkpoint.state.journal[0]!, 'text', 'Changed'), false);
  assert.equal(Reflect.set(checkpoint.state.inventory, 'gold_coin', 0), false);
  assert.throws(() => Array.prototype.push.call(checkpoint.state.skills, 'diplomacy'), TypeError);
  const json = JSON.stringify(checkpoint);
  game.navigate('later');
  assert.equal(JSON.stringify(checkpoint), json);
});

test('JSON round-trip initializes independent games directly at the checkpoint', () => {
  const original = atCamp();
  const data = raw();
  const first = new Game(story, { checkpoint: data });
  const second = new Game(story, { checkpoint: JSON.parse(JSON.stringify(data)) });
  assert.deepEqual(first.state, original.state);
  assert.deepEqual(second.state, original.state);
  assert.notEqual(first.checkpoint, original.checkpoint);
  assert.notEqual(first.state.inventory, second.state.inventory);
  data.state.variables.count = 100;
  data.state.skills.push('diplomacy');
  data.state.inventory.gold_coin = 1;
  (data.state.journal[0] as Record<string, unknown>).text = 'Changed';
  assert.deepEqual(first.state, original.state);
  assert.deepEqual(first.checkpoint, original.checkpoint);
});

test('fresh restoration does not run an unrelated failing start passage', () => {
  const parsed = parseStory('*var count 0\n*item token "Token"\n*passage start\n*title Start\n*remove_item token 1\nStart.\n'
    + '*passage saved\n*title Saved\n*checkpoint\n*add count 2\n*add_item token 1\nSaved.');
  assert.throws(() => new Game(parsed), /insufficient inventory/);
  const snapshot = { state: { passageId: 'saved', variables: { count: 3 }, journal: [], skills: [], inventory: {} } };
  const game = new Game(parsed, { checkpoint: snapshot });
  assert.equal(game.state.passageId, 'saved');
  assert.equal(game.state.variables.count, 5);
  assert.deepEqual(game.state.inventory, { token: 1 });
  game.restoreCheckpoint();
  assert.equal(game.state.variables.count, 5);
});

test('valid snapshot structure with infeasible entry effects fails fresh construction atomically', () => {
  const data = raw();
  data.state.passageId = 'bad_checkpoint';
  let game: Game | undefined;
  assert.throws(() => { game = new Game(story, { checkpoint: data }); }, /insufficient inventory/);
  assert.equal(game, undefined);
});

const inputStory = (markIntroduction: boolean) => parseStory([
  '*var name "Unknown"', '*var count 0', '*passage choose_name', '*title Name', '*checkpoint', '*add count 1',
  'What is your name?', '*input_text name "Name" -> introduction',
  '*passage introduction', '*title Introduction', ...(markIntroduction ? ['*checkpoint'] : []),
  '*add count 2', '*journal introduced "Your name is ' + nameText + '."',
  'Welcome, ' + nameText + '.', '*continue later',
  '*passage later', '*title Later', '*set name "Other"', '*add count 10', 'Later.',
].join('\n'));

test('input destination checkpoint contains accepted text before journal and other effects', () => {
  const parsed = inputStory(true);
  const game = new Game(parsed);
  const initial = game.checkpoint;
  assert.throws(() => game.submitText('   '), /1 and 80/);
  assert.equal(game.checkpoint, initial);
  assert.throws(() => game.navigate('introduction'), /has no action/);
  assert.equal(game.checkpoint, initial);
  game.submitText(' Eleanor ');
  const checkpoint = game.checkpoint;
  const expected = game.state;
  assert.equal(checkpoint.state.passageId, 'introduction');
  assert.equal(checkpoint.state.variables.name, 'Eleanor');
  assert.equal(checkpoint.state.variables.count, 1);
  assert.deepEqual(checkpoint.state.journal, []);
  game.navigate('later'); game.restoreCheckpoint();
  assert.deepEqual(game.state, expected);
  assert.equal(game.passage.textInput, undefined);
  assert.equal(game.state.journal[0]?.text, 'Your name is Eleanor.');
  assert.equal(game.state.variables.count, 3);
  assert.equal(game.checkpoint, checkpoint);
  assert.deepEqual(new Game(parsed, { checkpoint: JSON.parse(JSON.stringify(checkpoint)) }).state, expected);
});

test('a genuine input checkpoint restores its action without storing a form draft', () => {
  const parsed = inputStory(false);
  const game = new Game(parsed);
  const checkpoint = game.checkpoint;
  game.submitText('Eleanor');
  game.restoreCheckpoint();
  assert.equal(game.passage.id, 'choose_name');
  assert.equal(game.passage.textInput?.variable, 'name');
  assert.equal(game.state.variables.name, 'Unknown');
  assert.equal(game.state.variables.count, 1);
  game.submitText("O'Brien");
  assert.equal(game.state.variables.name, "O'Brien");
  assert.equal(game.state.variables.count, 3);
  assert.equal(game.checkpoint, checkpoint);
  const fresh = new Game(parsed, { checkpoint: checkpoint });
  assert.equal(fresh.passage.id, 'choose_name');
  fresh.submitText('Alexandra');
  assert.equal(fresh.state.variables.name, 'Alexandra');
});

test('failed input destination checkpoint entry preserves the initial snapshot and submitted variable', () => {
  const parsed = parseStory('*var name "Unknown"\n*var huge 1e308\n*passage start\n*title Name\nText.\n*input_text name "Name" -> intro\n'
    + '*passage intro\n*title Intro\n*checkpoint\n*journal introduced "Name: ' + nameText + '"\n*add huge 1e308\nText.');
  const game = new Game(parsed);
  const checkpoint = game.checkpoint;
  const state = game.state;
  assert.throws(() => game.submitText('Eleanor'), /non-finite/);
  assert.equal(game.checkpoint, checkpoint);
  assert.equal(game.state, state);
  assert.equal(game.checkpoint.state.variables.name, 'Unknown');
});

for (const value of [undefined, null, true, 1, '{}', [], {}, { state: null }, { state: [] }, { state: {} }]) {
  test('rejects malformed snapshot structures: ' + String(value), () => {
    assert.throws(() => new Game(story, { checkpoint: value }), /Invalid checkpoint:/);
  });
}

for (const field of ['passageId', 'variables', 'journal', 'skills', 'inventory']) {
  test('requires state field: ' + field, () => {
    const data = raw();
    Reflect.deleteProperty(data.state, field);
    assert.throws(() => new Game(story, { checkpoint: data }), /State must contain exactly/);
  });
}

for (const passageId of ['unknown', '', 'Camp', 0, null, {}]) {
  test('rejects unknown or non-string passage IDs: ' + String(passageId), () => {
    const data = raw(); data.state.passageId = passageId;
    assert.throws(() => new Game(story, { checkpoint: data }), /Unknown passage ID/);
  });
}

test('rejects unexpected fields rather than silently dropping gameplay data', () => {
  for (const [object, key] of [['snapshot', 'version'], ['state', 'draft'], ['state', 'checkpoint'],
    ['variables', 'extra'], ['inventory', 'unknown']] as const) {
    const data = raw();
    const target = object === 'snapshot' ? data : object === 'state' ? data.state : data.state[object];
    Reflect.set(target, key, 1);
    assert.throws(() => new Game(story, { checkpoint: data }), /Invalid checkpoint:/);
  }
});

for (const id of Object.keys(story.initialVariables)) {
  test('requires declared variable: ' + id, () => {
    const data = raw(); delete data.state.variables[id];
    assert.throws(() => new Game(story, { checkpoint: data }), /Variables must contain exactly/);
  });
}

for (const [id, value] of [
  ['count', '1'], ['count', true], ['count', null], ['count', undefined], ['count', []], ['count', {}],
  ['count', NaN], ['count', Infinity], ['count', -Infinity], ['count', 1n],
  ['loyal', 1], ['loyal', 'true'], ['name', false], ['name', {}], ['faction', null],
] as const) {
  test('rejects invalid variable type/value: ' + id + ', ' + String(value), () => {
    const data = raw(); data.state.variables[id] = value;
    assert.throws(() => new Game(story, { checkpoint: data }), /Variable .*incompatible or non-finite/);
  });
}

for (const quantity of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, '1', true, null, [], {}, undefined, 1n]) {
  test('rejects invalid inventory quantity: ' + String(quantity), () => {
    const data = raw(); data.state.inventory.gold_coin = quantity;
    assert.throws(() => new Game(story, { checkpoint: data }), /positive safe integer/);
  });
}

test('accepts safe integer boundaries and preserves ordinary strings without player-input normalization', () => {
  const data = raw();
  data.state.variables.name = '\n  Literal $' + '{unknown} <b>Name</b>  ';
  data.state.inventory.gold_coin = Number.MAX_SAFE_INTEGER;
  const snapshot = validateSnapshot(data, story);
  assert.equal(snapshot.state.variables.name, data.state.variables.name);
  assert.equal(snapshot.state.inventory.gold_coin, Number.MAX_SAFE_INTEGER);
});

for (const skills of [['unknown'], ['constructor'], ['composure', 'composure'], [1], [null], [{}], 'composure', null, {}]) {
  test('rejects malformed, unknown, or duplicate skills: ' + JSON.stringify(skills), () => {
    const data = raw(); Reflect.set(data.state, 'skills', skills);
    assert.throws(() => new Game(story, { checkpoint: data }), /Invalid checkpoint:/);
  });
}

for (const entry of [
  null, 'arrived', [], {}, { id: 'arrived', chapter: 'Prologue' },
  { id: 'arrived', chapter: 'Prologue', text: 'Text', extra: 1 },
  { id: 1, chapter: 'Prologue', text: 'Text' }, { id: 'unknown', chapter: 'Prologue', text: 'Text' },
  { id: 'arrived', chapter: '', text: 'Text' }, { id: 'arrived', chapter: 'Chapter One', text: 'Text' },
  { id: 'arrived', chapter: 1, text: 'Text' }, { id: 'arrived', chapter: 'Prologue', text: {} },
]) {
  test('rejects malformed journal entries and mismatched origins: ' + JSON.stringify(entry), () => {
    const data = raw(); data.state.journal = [entry];
    assert.throws(() => new Game(story, { checkpoint: data }), /Invalid checkpoint:/);
  });
}

test('journal IDs must be unique; recorded text is retained rather than re-interpolated', () => {
  const duplicate = raw();
  duplicate.state.journal.push(duplicate.state.journal[0]);
  assert.throws(() => new Game(story, { checkpoint: duplicate }), /Duplicate journal event/);
  const literal = raw();
  literal.state.journal = [{ id: 'arrived', chapter: 'Prologue', text: '$' + '{unknown}<b>Recorded</b>' }];
  const game = new Game(story, { checkpoint: literal });
  assert.equal(game.state.journal[0]?.text, '$' + '{unknown}<b>Recorded</b>');
});

test('constructor IDs work as own variables, skills, items, and journal events', () => {
  const parsed = parseStory('*var constructor 1\n*skill constructor "Skill"\n*item constructor "Item"\n'
    + '*passage start\n*title Start\n*checkpoint\n*grant_skill constructor\n*add_item constructor 1\n*journal constructor ""\nText.');
  const data = { state: { passageId: 'start', variables: { constructor: 7 },
    journal: [{ id: 'constructor', chapter: 'Prologue', text: '' }], skills: ['constructor'], inventory: { constructor: 2 } } };
  const game = new Game(parsed, { checkpoint: data });
  assert.equal(game.state.variables.constructor, 7);
  assert.deepEqual(game.state.inventory, { constructor: 3 });
  assert.deepEqual(game.state.skills, ['constructor']);
  assert.equal(game.state.journal.length, 1);
  const missing = { ...data, state: { ...data.state, variables: {} } };
  assert.throws(() => new Game(parsed, { checkpoint: missing }), /Variables must contain exactly/);
});

test('unknown own constructor/prototype-like item IDs are not mistaken for definitions', () => {
  for (const id of ['constructor', 'toString', '__proto__']) {
    const data = raw();
    Object.defineProperty(data.state.inventory, id, { value: 1, enumerable: true });
    assert.throws(() => new Game(story, { checkpoint: data }), /Unknown inventory item/);
  }
});

test('inherited fields are rejected and null-prototype own records are accepted', () => {
  for (const field of ['variables', 'inventory'] as const) {
    const data = raw();
    Reflect.set(data.state, field, Object.create(data.state[field]));
    assert.throws(() => new Game(story, { checkpoint: data }), /plain object without inherited data/);
  }
  assert.throws(() => new Game(story, { checkpoint: Object.create(raw()) }), /plain object without inherited data/);
  const data = raw();
  data.state.variables = Object.assign(Object.create(null), data.state.variables);
  data.state.inventory = Object.assign(Object.create(null), data.state.inventory);
  assert.deepEqual(new Game(story, { checkpoint: data }).state, atCamp().state);
});

test('rejects invalid record containers, arrays with holes/properties, and invalid nested data', () => {
  for (const field of ['variables', 'inventory']) {
    const data = raw(); Reflect.set(data.state, field, []);
    assert.throws(() => new Game(story, { checkpoint: data }), /must be a plain object/);
  }
  for (const field of ['journal', 'skills']) {
    const data = raw(); Reflect.set(data.state, field, {});
    assert.throws(() => new Game(story, { checkpoint: data }), /plain, dense array/);
  }
  for (const field of ['variables', 'inventory', 'journal', 'skills']) {
    for (const invalid of [undefined, null, true, 'value', 1, new Date(), new Map(), new Set()]) {
      const data = raw(); Reflect.set(data.state, field, invalid);
      assert.throws(() => new Game(story, { checkpoint: data }), /Invalid checkpoint:/);
    }
  }
  for (const field of ['journal', 'skills']) {
    for (const invalid of [new Array(1), Object.assign([], { extra: 1 }), Object.setPrototypeOf([], null)]) {
      const data = raw(); Reflect.set(data.state, field, invalid);
      assert.throws(() => new Game(story, { checkpoint: data }), /plain, dense array/);
    }
  }
  for (const target of ['state', 'variables', 'inventory'] as const) {
    const data = raw();
    const object = target === 'state' ? data.state : data.state[target];
    Object.defineProperty(object, 'hidden', { value: 1, enumerable: false });
    assert.throws(() => new Game(story, { checkpoint: data }), /enumerable string-keyed data properties/);
  }
  const symbolic = raw(); Reflect.set(symbolic.state, Symbol('extra'), 1);
  assert.throws(() => new Game(story, { checkpoint: symbolic }), /enumerable string-keyed data properties/);
});

test('accessor callbacks are rejected without being executed', () => {
  let calls = 0;
  for (const location of ['snapshot', 'state', 'variable', 'inventory', 'journal', 'skills']) {
    const data = raw();
    const [object, key] = location === 'snapshot' ? [data, 'state'] : location === 'state' ? [data.state, 'passageId']
      : location === 'variable' ? [data.state.variables, 'count'] : location === 'inventory' ? [data.state.inventory, 'gold_coin']
      : location === 'journal' ? [data.state.journal[0] as object, 'text'] : [data.state.skills, '0'];
    Object.defineProperty(object, key, { enumerable: true, configurable: true, get() { calls++; return 'value'; } });
    assert.throws(() => new Game(story, { checkpoint: data }), /Invalid checkpoint:/);
  }
  assert.equal(calls, 0);
});

test('the example captures a submitted name at the optional background passage', () => {
  const parsed = parseStory(readFileSync(new URL('../src/example.story', import.meta.url), 'utf8'));
  const game = new Game(parsed);
  const initial = game.checkpoint;
  game.navigate('messenger'); game.navigate('council');
  assert.equal(game.checkpoint, initial);
  game.restoreCheckpoint();
  game.navigate('choose_name'); game.submitText('Eleanor');
  const checkpoint = game.checkpoint;
  assert.equal(checkpoint.state.passageId, 'choose_background');
  assert.equal(checkpoint.state.variables.character_name, 'Eleanor');
  assert.deepEqual(checkpoint.state.journal.map(e => e.id), ['arrived_city']);
  game.navigate('noble_origin'); game.navigate('council');
  game.restoreCheckpoint();
  assert.equal(game.passage.id, 'choose_background');
  assert.equal(game.state.variables.character_name, 'Eleanor');
  assert.deepEqual(game.state.journal.map(e => e.id), ['arrived_city', 'chose_name']);
  assert.equal(game.checkpoint, checkpoint);
});
