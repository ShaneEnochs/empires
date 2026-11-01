import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { interpolate } from '../src/interpolate';
import { GameSession } from '../src/session';
import { loadCheckpoint, saveCheckpoint, STORY_REVISION, STORAGE_KEY } from '../src/storage';
import { parseStory } from '../src/story';
import type { CheckpointStorage } from '../src/storage';
import type { GameState } from '../src/types';

const nameText = '$' + '{name}';
const countText = '$' + '{count}';
const start = '*var name "Unknown"\n*var flag true\n*passage start\n*title Start\nSafe.\n*continue fatal\n';
const fatal = '*passage fatal\n*title Fatal\nYou fall.\n*death';

test('death is immutable JSON-serializable passage metadata, not an effect or gameplay field', () => {
  const story = parseStory(start + fatal);
  const passage = story.passages[1]!;
  assert.equal(passage.death, true);
  assert.equal(story.passages[0]?.death, undefined);
  assert.deepEqual(passage.effects, []);
  assert.deepEqual(passage.choices, []);
  assert.equal(passage.continueTo, undefined);
  assert.equal(passage.textInput, undefined);
  assert.ok(Object.isFrozen(passage));
  assert.equal(Reflect.set(passage, 'death', false), false);
  assert.deepEqual(JSON.parse(JSON.stringify(passage)), passage);
  const game = new Game(story);
  game.navigate('fatal');
  assert.deepEqual(Object.keys(game.state), ['passageId', 'variables', 'journal', 'skills', 'inventory']);
});

for (const suffix of ['', '\n', '\n\n*passage end\n*title End\nSafe.', '\n*chapter Epilogue\n*passage end\n*title End\nSafe.']) {
  test('death concludes a valid passage at a passage/chapter boundary or EOF: ' + JSON.stringify(suffix), () => {
    assert.equal(parseStory(start + fatal + suffix).passages[1]?.death, true);
  });
}

for (const [label, content] of [
  ['arguments', '*title Fatal\nText.\n*death now'],
  ['destination argument', '*title Fatal\nText.\n*death -> start'],
  ['duplicate', '*title Fatal\nText.\n*death\n*death'],
  ['before title', '*death\n*title Fatal\nText.'],
  ['before prose', '*title Fatal\n*death\nText.'],
  ['missing prose', '*title Fatal\n*death'],
  ['inside pending condition', '*title Fatal\nText.\n\n*show_if flag == true\n*death'],
  ['inside conditional paragraph', '*title Fatal\nText.\n\n*show_if flag == true\nConditional.\n*death'],
  ['only conditional prose', '*title Fatal\n*show_if flag == true\nConditional.\n\n*death'],
  ['choice before death', '*title Fatal\nText.\n*choice\n#Leave -> start\n*death'],
  ['death before choice', '*title Fatal\nText.\n*death\n*choice\n#Leave -> start'],
  ['continue before death', '*title Fatal\nText.\n*continue start\n*death'],
  ['death before continue', '*title Fatal\nText.\n*death\n*continue start'],
  ['input before death', '*title Fatal\nText.\n*input_text name "Name" -> start\n*death'],
  ['death before input', '*title Fatal\nText.\n*death\n*input_text name "Name" -> start'],
  ['prose after death', '*title Fatal\nText.\n*death\nStill alive.'],
  ['choice line after death', '*title Fatal\nText.\n*death\n#Escape -> start'],
  ['effect after death', '*title Fatal\nText.\n*death\n*set name "Other"'],
  ['condition after death', '*title Fatal\nText.\n*death\n*show_if flag == true\nText.'],
  ['title after death', '*title Fatal\nText.\n*death\n*title Other'],
  ['checkpoint before death', '*title Fatal\n*checkpoint\nText.\n*death'],
  ['checkpoint after death', '*title Fatal\nText.\n*death\n*checkpoint'],
  ['checkpoint and death before prose', '*title Fatal\n*checkpoint\n*death\nText.'],
  ['checkpoint after prose before death', '*title Fatal\nText.\n*checkpoint\n*death'],
] as const) {
  test('rejects invalid death with a line and passage ID: ' + label, () => {
    assert.throws(() => parseStory(start + '*passage fatal\n' + content), /Line \d+, passage "fatal":/);
  });
}

test('death outside a passage and an initial death passage are rejected', () => {
  assert.throws(() => parseStory('*death\n' + start + fatal), /Line 1:/);
  assert.throws(() => parseStory('*passage first\n*title First\nText.\n*death'), /Line 4, passage "first": .*starting passage/);
  assert.throws(() => parseStory('*chapter Prologue\n*passage first\n*title First\nText.\n*death'), /starting passage/);
});

test('unreachable death passages still receive whole-story validation', () => {
  const prefix = '*passage start\n*title Start\nSafe.\n';
  assert.throws(() => parseStory(prefix + fatal.replace('*death', '*death invalid')), /Line 7, passage "fatal": .*no arguments/);
  assert.throws(() => parseStory(prefix + fatal.replace('You fall.', '*checkpoint\nYou fall.')), /death passage cannot also be a checkpoint/);
});

test('death may follow unconditional and finished conditional prose and ordinary entry effects', () => {
  const parsed = parseStory(start + '*passage fatal\n*title Fatal\n*set name "Other"\nUnconditional.\n\n'
    + '*show_if flag == true\nConditional.\n\n*death');
  const game = new Game(parsed);
  game.navigate('fatal');
  assert.equal(game.state.variables.name, 'Other');
  assert.deepEqual(game.visibleParagraphs.map(p => p.text), ['Unconditional.', 'Conditional.']);
});

const story = parseStory([
  '*var count 0', '*var name "Unknown"', '*var loyal false',
  '*skill composure "Composure"', '*skill herbalism "Herbalism"', '*skill diplomacy "Diplomacy"',
  '*item gold "Gold"', '*item potion "Potion"', '*item token "Token"',
  '*chapter Prologue',
  '*passage gate', '*title Gate', '*add count 1', '*set name "Alexander"',
  '*grant_skill composure', '*grant_skill herbalism',
  '*add_item token 1', '*add_item gold 50', '*add_item potion 2',
  '*journal arrived "Arrival ' + nameText + ': ' + countText + '."', 'Gate.',
  '*choice', '#Camp -> camp', '#Danger -> ruins', '#Name -> choose_name', '#Bad -> bad_death',
  '*chapter Chapter One',
  '*passage camp', '*title Camp', '*checkpoint', '*add count 2', '*set loyal true',
  '*grant_skill diplomacy', '*revoke_skill composure',
  '*remove_item token 1', '*add_item token 2', '*remove_item gold 50', '*add_item gold 3', '*remove_item potion 1',
  '*journal rested "Camp ' + nameText + ': ' + countText + '."', 'Camp ' + nameText + '.',
  '', '*show_if has_skill diplomacy', 'Diplomacy restored.',
  '', '*show_if item_count gold == 3', 'Three coins.',
  '*choice', '#Danger -> ruins [if loyal == true]', '#Rest -> safe', '#Name -> choose_name',
  '*passage ruins', '*title Ruins', '*add count 5', '*set name "Other"', '*set loyal false',
  '*revoke_skill herbalism', '*revoke_skill diplomacy', '*grant_skill composure',
  '*remove_item gold 3', '*add_item gold 10', '*remove_item potion 1', '*add_item potion 4',
  '*journal explored "Explored ' + nameText + '."', 'You descend.', '*continue death',
  '*passage death', '*title A Fatal Fall', '*add count 100', '*set name "Lost"',
  '*grant_skill diplomacy', '*remove_item gold 1', '*journal died "Fell ' + nameText + '."',
  '<b>The floor gives way.</b>', '', '*show_if has_skill diplomacy', 'All is silent.', '', '*death',
  '*passage bad_death', '*title Bad Death', '*add count 3', '*grant_skill diplomacy',
  '*journal failed "Failed."', '*add_item gold 2', '*remove_item potion 100', 'Failed.', '*death',
  '*passage safe', '*title Safe', 'You remain safe.',
  '*passage choose_name', '*title Name', 'Name?', '*input_text name "Name" -> named_camp',
  '*passage named_camp', '*title Named Camp', '*checkpoint', '*add count 2', '*grant_skill diplomacy',
  '*journal introduced "Welcome ' + nameText + '."', 'Welcome ' + nameText + '.', '*continue ruins',
].join('\n'));

function atCamp(): Game { const game = new Game(story); game.navigate('camp'); return game; }
function die(game: Game): void { game.navigate('ruins'); game.navigate('death'); }

test('ordinary choice and Continue enter death atomically and keep the narrative visible', () => {
  const game = atCamp();
  const checkpoint = game.checkpoint;
  game.navigate('ruins');
  assert.equal(game.passage.death, undefined);
  game.navigate('death');
  const state = game.state;
  assert.equal(game.passage.death, true);
  assert.equal(state.variables.count, 108);
  assert.deepEqual(game.visibleParagraphs.map(p => p.text), ['<b>The floor gives way.</b>', 'All is silent.']);
  assert.deepEqual(state.journal.map(e => e.id), ['arrived', 'rested', 'explored', 'died']);
  assert.equal(game.checkpoint, checkpoint);
  for (let i = 0; i < 3; i++) {
    void game.state; void game.passage; void game.availableChoices; void game.visibleParagraphs;
  }
  assert.equal(game.state, state);
  assert.equal(game.checkpoint, checkpoint);
});

test('death has no outgoing normal action and cannot be bypassed by arbitrary navigation or submission', () => {
  const game = atCamp(); die(game);
  const state = game.state;
  const checkpoint = game.checkpoint;
  assert.deepEqual(game.availableChoices, []);
  assert.equal(game.passage.continueTo, undefined);
  assert.equal(game.passage.textInput, undefined);
  for (const id of ['gate', 'camp', 'safe', 'death', 'missing']) {
    assert.throws(() => game.navigate(id), /has no action/);
  }
  assert.throws(() => game.submitText('Other'), /does not offer text input/);
  assert.equal(game.state, state);
  assert.equal(game.checkpoint, checkpoint);
});

test('retry is guarded outside death, including terminal safe passages', () => {
  const game = atCamp();
  for (const safe of [false, true]) {
    if (safe) game.navigate('safe');
    const state = game.state; const checkpoint = game.checkpoint;
    assert.throws(() => game.retryAfterDeath(), /only available on a death passage/);
    assert.equal(game.state, state); assert.equal(game.checkpoint, checkpoint);
  }
});

test('retry before an authored checkpoint replays the automatic initial checkpoint once', () => {
  const game = new Game(story);
  const expected = game.state; const checkpoint = game.checkpoint;
  for (let cycle = 0; cycle < 3; cycle++) {
    die(game); game.retryAfterDeath();
    assert.deepEqual(game.state, expected);
    assert.equal(game.passage.id, 'gate');
    assert.equal(game.state.variables.count, 1);
    assert.equal(game.checkpoint, checkpoint);
  }
  game.navigate('camp');
  assert.equal(game.passage.id, 'camp');
});

test('retry restores complete state, original journal text/chapters, and acquisition order without accumulation', () => {
  const game = atCamp();
  const expected = game.state;
  const checkpoint = game.checkpoint;
  const bytes = JSON.stringify(checkpoint);
  assert.deepEqual(expected.skills, ['herbalism', 'diplomacy']);
  assert.deepEqual(Object.keys(expected.inventory), ['potion', 'token', 'gold']);
  assert.deepEqual(expected.inventory, { potion: 1, token: 2, gold: 3 });
  for (let cycle = 0; cycle < 4; cycle++) {
    die(game);
    const dead = game.state;
    assert.notDeepEqual(dead, expected);
    game.retryAfterDeath();
    assert.deepEqual(game.state, expected);
    assert.equal(game.state.variables.count, 3);
    assert.deepEqual(Object.keys(game.state.inventory), ['potion', 'token', 'gold']);
    assert.equal(game.state.variables.name, 'Alexander');
    assert.deepEqual(game.state.journal, [
      { id: 'arrived', chapter: 'Prologue', text: 'Arrival Alexander: 1.' },
      { id: 'rested', chapter: 'Chapter One', text: 'Camp Alexander: 3.' },
    ]);
    assert.deepEqual(game.availableChoices.map(c => c.destinationId), ['ruins', 'safe', 'choose_name']);
    assert.equal(game.visibleParagraphs.length, 3);
    assert.equal(dead.passageId, 'death');
    assert.equal(dead.variables.count, 108);
    assert.equal(game.checkpoint, checkpoint);
    assert.equal(JSON.stringify(checkpoint), bytes);
    assert.equal(Reflect.set(game.state.inventory, 'gold', 999), false);
    assert.equal(Reflect.set(game.state.skills, '0', 'composure'), false);
  }
  game.navigate('safe');
  assert.equal(game.passage.id, 'safe');
});

test('failed death entry rolls back mixed effects and leaves a usable checkpoint', () => {
  const game = new Game(story); const state = game.state; const checkpoint = game.checkpoint;
  assert.throws(() => game.navigate('bad_death'), /insufficient inventory/);
  assert.equal(game.state, state); assert.equal(game.checkpoint, checkpoint);
  die(game); game.retryAfterDeath(); assert.deepEqual(game.state, state);
});

test('a retry failure after preparing all effects keeps death and checkpoint intact, permitting retry', t => {
  const game = atCamp(); const expected = game.state; die(game);
  const dead = game.state; const checkpoint = game.checkpoint;
  const internal = game as unknown as { enterPassage(input: GameState): GameState };
  const enter = internal.enterPassage.bind(game);
  let fail = true;
  t.mock.method(internal, 'enterPassage', (input: GameState) => {
    const candidate = enter(input);
    if (fail) { fail = false; throw new Error('Recovery interrupted.'); }
    return candidate;
  });
  assert.throws(() => game.retryAfterDeath(), /Recovery interrupted/);
  assert.equal(game.state, dead); assert.equal(game.checkpoint, checkpoint);
  game.retryAfterDeath();
  assert.deepEqual(game.state, expected); assert.equal(game.checkpoint, checkpoint);
});

test('retry of a named destination retains accepted Unicode text and its journal interpolation', () => {
  const game = new Game(story); game.navigate('choose_name');
  game.submitText('Éléonore 王 <b>Hero</b>');
  const expected = game.state; const checkpoint = game.checkpoint;
  assert.equal(checkpoint.state.variables.name, 'Éléonore 王 <b>Hero</b>');
  die(game); game.retryAfterDeath();
  assert.deepEqual(game.state, expected);
  assert.equal(game.passage.textInput, undefined);
  assert.equal(game.state.journal.at(-1)?.text, 'Welcome Éléonore 王 <b>Hero</b>.');
  assert.equal(interpolate(game.visibleParagraphs[0]!.text, game.state.variables), 'Welcome Éléonore 王 <b>Hero</b>.');
});

test('a genuine input checkpoint restores the form action, allowing a different submission', () => {
  const parsed = parseStory('*var name "Unknown"\n*passage input\n*title Name\n*checkpoint\nName?\n'
    + '*input_text name "Name" -> danger\n*passage danger\n*title Danger\n'
    + '*journal named "Name ' + nameText + '."\nText.\n*death');
  const game = new Game(parsed);
  game.submitText('Eleanor');
  assert.equal(game.state.journal[0]?.text, 'Name Eleanor.');
  game.retryAfterDeath();
  assert.equal(game.passage.id, 'input');
  assert.equal(game.passage.textInput?.variable, 'name');
  assert.equal(game.state.variables.name, 'Unknown');
  assert.deepEqual([...game.state.journal], []);
  game.submitText("O'Brien");
  assert.equal(game.state.journal[0]?.text, "Name O'Brien.");
});

test('untrusted snapshots cannot use a death passage as a recovery destination', () => {
  const game = atCamp();
  const invalid = { state: { ...game.checkpoint.state, passageId: 'death' } };
  assert.throws(() => new Game(story, { checkpoint: invalid }), /Checkpoint destination cannot be a death passage/);
});

class FakeStorage implements CheckpointStorage {
  record: string | null = null;
  reads = 0;
  writes = 0;
  failWrites = false;
  getItem(key: string): string | null { assert.equal(key, STORAGE_KEY); this.reads++; return this.record; }
  setItem(key: string, value: string): void {
    assert.equal(key, STORAGE_KEY); this.writes++;
    if (this.failWrites) throw new Error('Quota exceeded.');
    this.record = value;
  }
}

function sessionAtCamp(): { session: GameSession; storage: FakeStorage } {
  const storage = new FakeStorage();
  const session = new GameSession(story, storage);
  assert.equal(session.newGame(() => true), 'started');
  session.navigate('camp');
  return { session, storage };
}
function sessionDie(session: GameSession): void { session.navigate('ruins'); session.navigate('death'); }

test('death and retry save once per action; inspection never writes', () => {
  const { session, storage } = sessionAtCamp();
  const expected = session.game!.state;
  const saved = storage.record; const writes = storage.writes; const reads = storage.reads;
  for (let cycle = 0; cycle < 3; cycle++) {
    sessionDie(session);
    void session.game!.state; void session.game!.visibleParagraphs; void session.game!.availableChoices;
    assert.equal(JSON.parse(storage.record!).currentState.passageId, 'death');
    assert.equal(storage.writes, writes + cycle * 3 + 2);
    session.retryAfterDeath();
    assert.deepEqual(session.game!.state, expected);
    assert.equal(storage.record, saved); assert.equal(storage.writes, writes + (cycle + 1) * 3); assert.equal(storage.reads, reads);
  }
});

test('session retry rejects before startup and outside death without changing game, save, or notice', () => {
  const storage = new FakeStorage(); const session = new GameSession(story, storage);
  assert.throws(() => session.retryAfterDeath(), /Start or continue/);
  assert.equal(session.newGame(() => true), 'started');
  const game = session.game; const state = game!.state; const saved = storage.record;
  assert.throws(() => session.retryAfterDeath(), /only available/);
  assert.equal(session.game, game); assert.equal(game!.state, state);
  assert.equal(session.notice, undefined); assert.equal(storage.record, saved); assert.equal(storage.writes, 1);
});

test('Continue restores committed death without replay; confirmed New Game still resets', () => {
  const { session, storage } = sessionAtCamp();
  const expected = session.game!.state;
  sessionDie(session);
  const saved = storage.record; const writes = storage.writes;
  const reopened = new GameSession(story, storage);
  assert.equal(reopened.startup.status, 'ready');
  assert.deepEqual(reopened.continueGame().state, session.game!.state);
  assert.equal(storage.writes, writes); assert.equal(storage.record, saved);
  const dead = session.game!.state;
  assert.equal(session.newGame(() => false), 'cancelled');
  assert.equal(session.game!.state, dead); assert.equal(storage.record, saved);
  assert.equal(session.newGame(() => true), 'started');
  assert.equal(session.game!.passage.id, 'gate');
  assert.deepEqual(session.game!.state, new Game(story).state);
  assert.equal(storage.writes, writes + 1);
});

test('failed checkpoint writes keep the newer in-memory checkpoint for retry and its warning, while reload uses the old save', () => {
  const storage = new FakeStorage(); const session = new GameSession(story, storage);
  assert.equal(session.newGame(() => true), 'started');
  const initial = session.game!.state; const oldBytes = storage.record;
  storage.failWrites = true;
  session.navigate('camp');
  const newer = session.game!.state; const checkpoint = session.game!.checkpoint; const notice = session.notice;
  assert.match(notice!.message, /Recent progress could not be saved/);
  const writes = storage.writes;
  sessionDie(session); session.retryAfterDeath();
  assert.deepEqual(session.game!.state, newer);
  assert.equal(session.game!.checkpoint, checkpoint); assert.equal(session.notice?.message, notice?.message);
  assert.equal(storage.record, oldBytes); assert.equal(storage.writes, writes + 3);
  const reopened = new GameSession(story, storage);
  assert.deepEqual(reopened.continueGame().state, initial);
  assert.equal(storage.record, oldBytes); assert.equal(storage.writes, writes + 3);
  // A later normal checkpoint entry can replace the save and clear the warning.
  storage.failWrites = false;
  session.navigate('choose_name'); session.submitText('Eleanor');
  assert.equal(session.notice, undefined);
  assert.equal(storage.writes, writes + 5);
  const loaded = loadCheckpoint(storage, story);
  assert.equal(loaded.status, 'loaded');
  if (loaded.status !== 'loaded') assert.fail('Expected the new checkpoint to be saved.');
  assert.equal(loaded.checkpoint.state.passageId, 'named_camp');
  assert.equal(loaded.checkpoint.state.variables.name, 'Eleanor');
});

test('failed session recovery retains both storage failure notice and death state, and retry stays available', t => {
  const storage = new FakeStorage(); const session = new GameSession(story, storage);
  assert.equal(session.newGame(() => true), 'started'); storage.failWrites = true;
  session.navigate('camp'); sessionDie(session);
  const dead = session.game!.state; const saved = storage.record; const writes = storage.writes;
  const notice = session.notice;
  const restore = t.mock.method(session.game!, 'restoreCheckpoint', () => { throw new Error('Cannot restore now.'); });
  assert.throws(() => session.retryAfterDeath(), /Cannot restore now/);
  assert.equal(session.game!.state, dead); assert.equal(storage.record, saved); assert.equal(storage.writes, writes);
  assert.equal(session.notice?.message, notice?.message);
  restore.mock.restore();
  session.retryAfterDeath(); assert.equal(session.game!.passage.id, 'camp'); assert.equal(storage.writes, writes + 1);
  assert.equal(session.notice?.message, notice?.message);
});

test('play without saving supports death and retry wholly in memory and retains its notice', () => {
  const storage = new FakeStorage(); storage.record = 'existing unusable save';
  const session = new GameSession(story, storage);
  assert.equal(session.playWithoutSaving(() => true), 'started');
  const expected = session.game!.state; const notice = session.notice; const reads = storage.reads;
  sessionDie(session); session.retryAfterDeath();
  assert.deepEqual(session.game!.state, expected);
  assert.equal(session.notice?.message, notice?.message); assert.match(notice!.message, /without saving/);
  assert.equal(storage.writes, 0); assert.equal(storage.reads, reads); assert.equal(storage.record, 'existing unusable save');
});

test('a death destination cannot be accepted from persistent data', () => {
  const storage = new FakeStorage(); const game = new Game(story);
  const invalid = { state: { ...game.checkpoint.state, passageId: 'death' } };
  assert.equal(saveCheckpoint(storage, story, invalid).ok, false);
  assert.equal(storage.writes, 0);
});

test('the example death route preserves initial recovery and accepted names without invalidating revision 1 saves', () => {
  const parsed = parseStory(readFileSync(new URL('../src/example.story', import.meta.url), 'utf8'));
  const game = new Game(parsed); const initial = game.state;
  game.navigate('watchtower'); game.navigate('fatal_fall'); game.retryAfterDeath();
  assert.deepEqual(game.state, initial);
  game.navigate('choose_name'); game.submitText('Eleanor');
  const named = game.state; const checkpoint = game.checkpoint;
  game.navigate('watchtower'); game.navigate('fatal_fall'); game.retryAfterDeath();
  assert.deepEqual(game.state, named); assert.equal(game.passage.id, 'choose_background');
  assert.equal(game.state.variables.character_name, 'Eleanor');
  assert.equal(game.passage.textInput, undefined);
  assert.equal(game.checkpoint, checkpoint); assert.equal(STORY_REVISION, 1);
  game.navigate('noble_origin'); game.navigate('council');
  assert.equal(game.state.variables.influence, 2.5);
});

test('existing revision 1 initial and named checkpoint records remain loadable after adding optional death routes', () => {
  const parsed = parseStory(readFileSync(new URL('../src/example.story', import.meta.url), 'utf8'));
  for (const named of [false, true]) {
    const snapshot = {
      state: {
        passageId: named ? 'choose_background' : 'gate',
        variables: { influence: named ? 1 : 0, honor: 5, loyal: false, character_name: named ? 'Eleanor' : 'Unknown' },
        journal: named ? [{ id: 'arrived_city', chapter: 'Prologue', text: 'Alexander reached the city with influence 1.' }] : [],
        skills: named ? ['composure'] : [],
        inventory: named ? { gold_coin: 10, gate_token: 1 } : {},
      },
    };
    const storage = new FakeStorage();
    storage.record = JSON.stringify({ formatVersion: 1, storyId: 'empires-example', storyRevision: 1, checkpoint: snapshot });
    const session = new GameSession(parsed, storage);
    assert.equal(session.startup.status, 'ready');
    const game = session.continueGame();
    assert.equal(game.passage.id, named ? 'choose_background' : 'gate');
    assert.equal(game.state.variables.character_name, named ? 'Eleanor' : 'Alexander');
    assert.equal(game.state.variables.influence, 1);
    assert.deepEqual(game.state.inventory, { gold_coin: 10, gate_token: 1 });
    assert.equal(storage.writes, 0);
  }
});

test('a failed atomic death transition performs no persistence and leaves later death recovery possible', () => {
  const storage = new FakeStorage(); const session = new GameSession(story, storage);
  assert.equal(session.newGame(() => true), 'started');
  const state = session.game!.state; const checkpoint = session.game!.checkpoint;
  const saved = storage.record; const writes = storage.writes;
  assert.throws(() => session.navigate('bad_death'), /insufficient inventory/);
  assert.equal(session.game!.state, state); assert.equal(session.game!.checkpoint, checkpoint);
  assert.equal(storage.record, saved); assert.equal(storage.writes, writes);
  sessionDie(session); session.retryAfterDeath();
  assert.deepEqual(session.game!.state, state);
  assert.equal(storage.record, saved); assert.equal(storage.writes, writes + 3);
});
