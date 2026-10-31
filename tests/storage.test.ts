import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Game } from '../src/game';
import { GameSession } from '../src/session';
import { loadCheckpoint, saveCheckpoint, SAVE_FORMAT_VERSION, STORY_ID, STORY_REVISION, STORAGE_KEY } from '../src/storage';
import { parseStory } from '../src/story';
import type { CheckpointStorage } from '../src/storage';
import type { GameSnapshot, GameState } from '../src/types';

class FakeStorage implements CheckpointStorage {
  record: string | null = null;
  reads = 0;
  writes = 0;
  readFailure = false;
  writeFailure = false;
  getItem(key: string): string | null {
    assert.equal(key, STORAGE_KEY);
    this.reads++;
    if (this.readFailure) throw new Error('Storage read blocked.');
    return this.record;
  }
  setItem(key: string, value: string): void {
    assert.equal(key, STORAGE_KEY);
    this.writes++;
    if (this.writeFailure) throw new Error('Storage quota exceeded.');
    this.record = value;
  }
}

const nameText = '$' + '{character_name}';
const influenceText = '$' + '{influence}';
const story = parseStory([
  '*var influence 9', '*var honor 5', '*var loyal false', '*var character_name "Unknown"', '*var huge 1e308',
  '*skill composure "Composure"', '*skill herbalism "Herbalism"', '*skill diplomacy "Diplomacy"',
  '*item gold_coin "Gold Coin"', '*item potion "Potion"', '*item token "Token"',
  '*passage gate', '*title Gate', '*add influence 1', '*set character_name "Alexander"',
  '*grant_skill composure', '*grant_skill herbalism', '*add_item token 1', '*add_item gold_coin 50', '*add_item potion 2',
  '*journal arrived "Arrival ' + nameText + '."', 'Gate.',
  '*choice', '#Camp -> camp', '#Name -> choose_name', '#Ordinary -> ordinary',
  '#Risk -> bad_checkpoint', '#Ordinary risk -> bad_ordinary',
  '*chapter Chapter One', '*passage camp', '*title Camp', '*checkpoint',
  '*add influence 5', '*grant_skill diplomacy', '*revoke_skill composure',
  '*add_item gold_coin 100', '*remove_item token 1', '*add_item token 2',
  '*journal camp_event "Camp ' + nameText + ': ' + influenceText + '."',
  'Camp ' + nameText + '.',
  '', '*show_if item_count gold_coin >= 150', 'Enough gold.',
  '*choice', '#Onward -> ordinary [if has_skill diplomacy]', '#Fallback -> ordinary',
  '*passage ordinary', '*title Ordinary', '*add influence 1', '*set character_name "Other"',
  '*add_item potion 1', '*journal ordinary_event "Ordinary."', 'Ordinary.', '*continue camp',
  '*passage choose_name', '*title Name', 'Enter a name.', '*input_text character_name "Name" -> named_camp',
  '*passage named_camp', '*title Named Camp', '*checkpoint', '*add influence 2', '*grant_skill diplomacy',
  '*add_item gold_coin 10', '*journal introduced "Welcome, ' + nameText + '."', 'Welcome, ' + nameText + '.',
  '*continue ordinary',
  '*passage bad_checkpoint', '*title Bad Checkpoint', '*checkpoint', '*add influence 2', '*grant_skill diplomacy',
  '*journal failed "Failed."', '*add_item gold_coin 10', '*remove_item potion 100', 'Bad.',
  '*passage bad_ordinary', '*title Bad Ordinary', '*add huge 1e308', 'Bad.',
].join('\n'));

function atCamp(): Game { const game = new Game(story); game.navigate('camp'); return game; }
const checkpoint = atCamp().checkpoint;
function encode(snapshot: GameSnapshot = checkpoint): string {
  return JSON.stringify({ formatVersion: SAVE_FORMAT_VERSION, storyId: STORY_ID, storyRevision: STORY_REVISION, checkpoint: snapshot });
}
function withSave(record = encode()): FakeStorage {
  const storage = new FakeStorage(); storage.record = record; return storage;
}
function start(storage = new FakeStorage()): GameSession {
  const session = new GameSession(story, storage);
  assert.equal(session.newGame(() => true), 'started');
  return session;
}

test('save writes exactly one versioned story-specific pre-entry record', () => {
  const storage = new FakeStorage();
  assert.deepEqual(saveCheckpoint(storage, story, checkpoint), { ok: true });
  assert.equal(storage.writes, 1);
  const data = JSON.parse(storage.record!);
  assert.deepEqual(Object.keys(data), ['formatVersion', 'storyId', 'storyRevision', 'checkpoint']);
  assert.equal(data.formatVersion, 1);
  assert.equal(data.storyId, 'empires-example');
  assert.equal(data.storyRevision, 1);
  assert.equal(STORAGE_KEY, 'empires:checkpoint:empires-example');
  assert.deepEqual(data.checkpoint, checkpoint);
  assert.equal(data.checkpoint.state.variables.influence, 10);
  assert.equal(data.checkpoint.state.inventory.gold_coin, 50);
  assert.equal(Object.hasOwn(data, 'currentState'), false);
});

test('load validates and freezes the JSON round-trip without writes or entry effects', t => {
  const storage = withSave();
  const prototype = Game.prototype as unknown as { enterPassage(input: GameState): GameState };
  const spy = t.mock.method(prototype, 'enterPassage', () => { throw new Error('Load must not enter passages.'); });
  const loaded = loadCheckpoint(storage, story);
  assert.equal(loaded.status, 'loaded');
  if (loaded.status !== 'loaded') assert.fail('Expected a loaded checkpoint.');
  assert.deepEqual(loaded.checkpoint, checkpoint);
  assert.ok(Object.isFrozen(loaded.checkpoint.state.inventory));
  assert.ok(Object.isFrozen(loaded.checkpoint.state.journal[0]));
  assert.equal(storage.writes, 0);
  assert.equal(spy.mock.callCount(), 0);
});

test('a missing record loads as empty without initializing or writing a game', () => {
  const storage = new FakeStorage();
  assert.deepEqual(loadCheckpoint(storage, story), { status: 'empty' });
  const session = new GameSession(story, storage);
  assert.equal(session.startup.status, 'empty');
  assert.equal(session.game, undefined);
  assert.equal(storage.writes, 0);
  assert.throws(() => session.continueGame(), /no usable saved game/);
});

test('empty startup does not enter a failing starting passage before New Game is chosen', () => {
  const parsed = parseStory('*var huge 1e308\n*passage start\n*title Start\n*add huge 1e308\nText.');
  const storage = new FakeStorage();
  const session = new GameSession(parsed, storage);
  assert.equal(session.startup.status, 'empty');
  assert.equal(session.game, undefined);
  assert.equal(session.newGame(() => true), 'failed');
  assert.equal(storage.writes, 0);
});

for (const data of ['', '{', 'null', 'true', '[]', '"text"', '{}']) {
  test('malformed/non-envelope JSON remains untouched: ' + JSON.stringify(data), () => {
    const storage = withSave(data);
    assert.equal(loadCheckpoint(storage, story).status, 'invalid');
    assert.equal(new GameSession(story, storage).startup.status, 'invalid');
    assert.equal(storage.record, data);
    assert.equal(storage.writes, 0);
  });
}

for (const field of ['formatVersion', 'storyId', 'storyRevision', 'checkpoint']) {
  test('rejects missing envelope field: ' + field, () => {
    const data = JSON.parse(encode());
    delete data[field];
    assert.equal(loadCheckpoint(withSave(JSON.stringify(data)), story).status, 'invalid');
  });
}

for (const field of ['extra', 'currentState', 'versionHistory', '__proto__']) {
  test('rejects extra envelope field: ' + field, () => {
    const data = JSON.parse(encode());
    Object.defineProperty(data, field, { value: 1, enumerable: true });
    assert.equal(loadCheckpoint(withSave(JSON.stringify(data)), story).status, 'invalid');
  });
}

for (const [field, value, reason] of [
  ['formatVersion', 0, /save format/], ['formatVersion', 2, /save format/], ['formatVersion', '1', /save format/],
  ['formatVersion', null, /save format/], ['storyId', 'another-story', /another story/],
  ['storyId', 1, /another story/], ['storyRevision', 0, /story revision/],
  ['storyRevision', 2, /story revision/], ['storyRevision', '1', /story revision/],
] as const) {
  test('rejects incompatible envelope: ' + field + ' = ' + String(value), () => {
    const data = JSON.parse(encode());
    data[field] = value;
    const storage = withSave(JSON.stringify(data));
    const result = loadCheckpoint(storage, story);
    assert.equal(result.status, 'invalid');
    if (result.status !== 'invalid') assert.fail('Expected an incompatible save.');
    assert.match(result.message, reason);
    assert.equal(storage.writes, 0);
  });
}

for (const [label, mutate] of [
  ['unknown passage', (data: any) => { data.checkpoint.state.passageId = 'missing'; }],
  ['missing variable', (data: any) => { delete data.checkpoint.state.variables.honor; }],
  ['extra variable', (data: any) => { data.checkpoint.state.variables.extra = 1; }],
  ['wrong variable type', (data: any) => { data.checkpoint.state.variables.influence = '10'; }],
  ['unknown skill', (data: any) => { data.checkpoint.state.skills.push('unknown'); }],
  ['duplicate skill', (data: any) => { data.checkpoint.state.skills.push('composure'); }],
  ['unknown item', (data: any) => { data.checkpoint.state.inventory.constructor = 1; }],
  ['zero quantity', (data: any) => { data.checkpoint.state.inventory.gold_coin = 0; }],
  ['unsafe quantity', (data: any) => { data.checkpoint.state.inventory.gold_coin = Number.MAX_SAFE_INTEGER + 1; }],
  ['unknown journal event', (data: any) => { data.checkpoint.state.journal[0].id = 'missing'; }],
  ['duplicate journal', (data: any) => { data.checkpoint.state.journal.push(data.checkpoint.state.journal[0]); }],
  ['wrong journal chapter', (data: any) => { data.checkpoint.state.journal[0].chapter = 'Wrong'; }],
  ['extra snapshot field', (data: any) => { data.checkpoint.draft = 'unsaved'; }],
] as const) {
  test('matching version still requires full snapshot validation: ' + label, () => {
    const data = JSON.parse(encode());
    mutate(data);
    const storage = withSave(JSON.stringify(data));
    assert.equal(loadCheckpoint(storage, story).status, 'invalid');
    assert.equal(new GameSession(story, storage).startup.status, 'invalid');
    assert.equal(storage.writes, 0);
  });
}

test('non-finite JSON numbers are rejected by snapshot validation', () => {
  const data = encode().replace('"influence":10', '"influence":1e309');
  assert.equal(loadCheckpoint(withSave(data), story).status, 'invalid');
});

test('a structurally valid but infeasible checkpoint is not a usable Continue option', () => {
  const data = JSON.parse(encode()); data.checkpoint.state.passageId = 'bad_checkpoint';
  const storage = withSave(JSON.stringify(data));
  assert.equal(loadCheckpoint(storage, story).status, 'loaded'); // Storage does not run effects.
  const session = new GameSession(story, storage);
  assert.equal(session.startup.status, 'invalid');
  assert.equal(session.game, undefined);
  assert.throws(() => session.continueGame(), /no usable saved game/);
  assert.equal(storage.record, JSON.stringify(data));
  assert.equal(storage.writes, 0);
});

test('storage read exceptions are handled without replacing existing bytes', () => {
  const storage = withSave();
  const before = storage.record;
  storage.readFailure = true;
  assert.equal(loadCheckpoint(storage, story).status, 'unavailable');
  const session = new GameSession(story, storage);
  assert.equal(session.startup.status, 'unavailable');
  assert.equal(session.canPlayWithoutSaving, true);
  assert.equal(session.game, undefined);
  assert.equal(storage.writes, 0);
  assert.equal(storage.record, before);
});

test('failed writes preserve the old record and report failure', () => {
  const storage = withSave();
  const before = storage.record;
  storage.writeFailure = true;
  const result = saveCheckpoint(storage, story, new Game(story).checkpoint);
  assert.equal(result.ok, false);
  assert.equal(storage.record, before);
  assert.equal(storage.writes, 1);
});

test('replacement is one setItem call to the same key, without a deletion API', () => {
  const storage = withSave();
  assert.equal(saveCheckpoint(storage, story, new Game(story).checkpoint).ok, true);
  assert.equal(storage.writes, 1);
  assert.equal(JSON.parse(storage.record!).checkpoint.state.passageId, 'gate');
});

test('Continue activates the already validated game without replaying effects or writing', t => {
  const storage = withSave();
  const prototype = Game.prototype as unknown as { enterPassage(input: GameState): GameState };
  const enter = prototype.enterPassage;
  const entered: string[] = [];
  t.mock.method(prototype, 'enterPassage', function(this: Game, input: GameState) {
    entered.push(input.passageId);
    return enter.call(this, input);
  });
  const session = new GameSession(story, storage);
  assert.equal(session.startup.status, 'ready');
  assert.equal(session.game, undefined);
  assert.deepEqual(entered, ['camp']);
  const game = session.continueGame();
  assert.equal(session.game, game);
  assert.deepEqual(entered, ['camp']);
  assert.equal(game.state.variables.influence, 15);
  assert.equal(game.state.inventory.gold_coin, 150);
  assert.deepEqual(game.state.skills, ['herbalism', 'diplomacy']);
  assert.deepEqual(Object.keys(game.state.inventory), ['gold_coin', 'potion', 'token']);
  assert.equal(storage.writes, 0);
});

test('repeated loading and continuing restores the same full state and leaves the saved record unchanged', () => {
  const storage = withSave();
  const before = storage.record;
  for (let i = 0; i < 3; i++) {
    const session = new GameSession(story, storage);
    const game = session.continueGame();
    assert.deepEqual(game.state, atCamp().state);
    assert.equal(game.state.journal.filter(e => e.id === 'camp_event').length, 1);
    assert.equal(storage.record, before);
    assert.equal(storage.writes, 0);
  }
});

test('New Game without a record needs no confirmation and writes its initial checkpoint once', () => {
  const storage = new FakeStorage();
  const session = new GameSession(story, storage);
  assert.equal(session.newGame(() => assert.fail('No record to replace.')), 'started');
  assert.equal(storage.writes, 1);
  assert.equal(session.game?.state.variables.influence, 10);
  assert.equal(JSON.parse(storage.record!).checkpoint.state.variables.influence, 9);
  assert.deepEqual(JSON.parse(storage.record!).checkpoint.state.inventory, {});
});

test('cancelled New Game preserves save, active game, checkpoint, and notice', () => {
  const storage = new FakeStorage();
  const session = start(storage);
  session.navigate('choose_name');
  const before = session.game;
  const checkpoint = before!.checkpoint;
  const record = storage.record;
  const notice = session.notice;
  let confirms = 0;
  assert.equal(session.newGame(() => { confirms++; return false; }), 'cancelled');
  assert.equal(confirms, 1);
  assert.equal(session.game, before);
  assert.equal(session.game!.checkpoint, checkpoint);
  assert.equal(session.notice, notice);
  assert.equal(storage.record, record);
  assert.equal(storage.writes, 1);
});

test('New Game requires confirmation even for an unusable record', () => {
  const storage = withSave('{broken');
  const session = new GameSession(story, storage);
  assert.equal(session.newGame(() => false), 'cancelled');
  assert.equal(storage.record, '{broken');
  assert.equal(session.game, undefined);
  assert.equal(session.newGame(() => true), 'started');
  assert.equal(storage.writes, 1);
});

test('a record appearing after startup is rechecked before New Game overwrite', () => {
  const storage = new FakeStorage();
  const session = new GameSession(story, storage);
  storage.record = encode();
  assert.equal(session.newGame(() => false), 'cancelled');
  assert.equal(storage.writes, 0);
  assert.equal(storage.record, encode());
});

test('confirmed New Game resets all progress and atomically replaces the save once', () => {
  const storage = new FakeStorage();
  const session = start(storage);
  session.navigate('choose_name'); session.submitText('Eleanor');
  const old = session.game!;
  assert.equal(session.newGame(() => true), 'started');
  assert.notEqual(session.game, old);
  assert.deepEqual(session.game!.state, new Game(story).state);
  assert.equal(session.game!.state.variables.character_name, 'Alexander');
  assert.equal(session.game!.checkpoint.state.variables.character_name, 'Unknown');
  assert.equal(storage.writes, 3); // Initial, submitted-name checkpoint, new initial.
  assert.equal(JSON.parse(storage.record!).checkpoint.state.passageId, 'gate');
});

test('New Game overwrite failure preserves active game and the previous record', () => {
  const storage = new FakeStorage();
  const session = start(storage);
  session.navigate('camp');
  const before = session.game;
  const record = storage.record;
  storage.writeFailure = true;
  assert.equal(session.newGame(() => true), 'failed');
  assert.equal(session.game, before);
  assert.equal(storage.record, record);
  assert.match(session.notice!.message, /not started.*could not be saved/);
  assert.equal(session.canPlayWithoutSaving, true);
});

test('a failed startup overwrite leaves the already validated Continue option usable', () => {
  const storage = withSave();
  const session = new GameSession(story, storage);
  const record = storage.record;
  storage.writeFailure = true;
  assert.equal(session.newGame(() => true), 'failed');
  assert.equal(session.game, undefined);
  assert.deepEqual(session.continueGame().state, atCamp().state);
  assert.equal(storage.record, record);
  assert.equal(storage.writes, 1);
});

test('read failure during New Game preserves the active game and does not risk an overwrite', () => {
  const storage = new FakeStorage();
  const session = start(storage);
  const game = session.game;
  const record = storage.record;
  storage.readFailure = true;
  assert.equal(session.newGame(() => assert.fail('Cannot determine whether replacement is safe.')), 'failed');
  assert.equal(session.game, game);
  assert.equal(storage.record, record);
  assert.equal(storage.writes, 1);
});

test('New Game construction failure preserves the save and an active restored game', () => {
  const parsed = parseStory('*var count 0\n*item token "Token"\n*passage start\n*title Start\n*remove_item token 1\nBad.\n'
    + '*passage saved\n*title Saved\n*checkpoint\n*add count 1\nGood.');
  const snapshot = { state: { passageId: 'saved', variables: { count: 3 }, journal: [], skills: [], inventory: {} } };
  const storage = new FakeStorage();
  assert.equal(saveCheckpoint(storage, parsed, snapshot).ok, true);
  const session = new GameSession(parsed, storage);
  const before = session.continueGame();
  const record = storage.record;
  assert.equal(before.state.variables.count, 4);
  assert.equal(session.newGame(() => true), 'failed');
  assert.equal(session.game, before);
  assert.equal(storage.record, record);
  assert.equal(storage.writes, 1);
});

test('ordinary navigation, state reads, and condition/interpolation views never write', () => {
  const storage = new FakeStorage();
  const session = start(storage);
  session.navigate('ordinary');
  const record = storage.record;
  for (let i = 0; i < 3; i++) {
    session.game!.state; session.game!.checkpoint; session.game!.availableChoices; session.game!.visibleParagraphs;
  }
  assert.equal(storage.record, record);
  assert.equal(storage.writes, 1);
});

test('marked entry and legitimate same-passage checkpoint re-entry each write exactly once', () => {
  const storage = new FakeStorage();
  const session = start(storage);
  session.navigate('camp');
  assert.equal(storage.writes, 2);
  assert.equal(JSON.parse(storage.record!).checkpoint.state.variables.influence, 10);
  session.navigate('ordinary');
  assert.equal(storage.writes, 2);
  session.navigate('camp');
  assert.equal(storage.writes, 3);
  assert.equal(JSON.parse(storage.record!).checkpoint.state.variables.influence, 16);
});

test('submitted Unicode names persist before entry, with journal text and order reconstructed on Continue', () => {
  const storage = new FakeStorage();
  const session = start(storage);
  session.navigate('choose_name');
  assert.equal(storage.writes, 1);
  const name = 'Éléonore 李 — عائشة';
  session.submitText('  ' + name + '  ');
  assert.equal(storage.writes, 2);
  const envelope = JSON.parse(storage.record!);
  assert.equal(envelope.checkpoint.state.variables.character_name, name);
  assert.deepEqual(envelope.checkpoint.state.journal.map((e: { id: string }) => e.id), ['arrived']);
  const expected = session.game!.state;
  session.navigate('ordinary'); // Unsaved name/stat/item changes must disappear after reopen.
  const reopened = new GameSession(story, storage);
  const resumed = reopened.continueGame();
  assert.deepEqual(resumed.state, expected);
  assert.equal(resumed.passage.textInput, undefined);
  assert.deepEqual(resumed.state.journal.map(e => e.text), ['Arrival Alexander.', 'Welcome, ' + name + '.']);
  assert.equal(storage.writes, 2);
});

test('failed ordinary/marked transitions, invalid input, and bypass attempts never write', () => {
  const storage = new FakeStorage();
  const session = start(storage);
  const before = storage.record;
  for (const destination of ['bad_checkpoint', 'bad_ordinary', 'missing']) {
    assert.throws(() => session.navigate(destination));
    assert.equal(storage.record, before);
  }
  session.navigate('choose_name');
  assert.throws(() => session.submitText(' '));
  assert.throws(() => session.navigate('named_camp'));
  assert.equal(storage.writes, 1);
  assert.equal(storage.record, before);
});

test('a rejected text destination entry never writes or commits its accepted name', () => {
  const parsed = parseStory('*var name "Unknown"\n*var huge 1e308\n*passage start\n*title Name\nText.\n*input_text name "Name" -> end\n'
    + '*passage end\n*title End\n*checkpoint\n*journal introduced "Hello"\n*add huge 1e308\nDone.');
  const storage = new FakeStorage();
  const session = new GameSession(parsed, storage);
  assert.equal(session.newGame(() => true), 'started');
  const record = storage.record;
  const before = session.game!.state;
  assert.throws(() => session.submitText('Eleanor'), /non-finite/);
  assert.equal(session.game!.state, before);
  assert.equal(session.game!.state.variables.name, 'Unknown');
  assert.equal(storage.record, record);
  assert.equal(storage.writes, 1);
});

test('automatic write failure keeps committed state/checkpoint and warns until a later real checkpoint saves', () => {
  const storage = new FakeStorage();
  const session = start(storage);
  const saved = storage.record;
  const oldCheckpoint = session.game!.checkpoint;
  storage.writeFailure = true;
  session.navigate('camp');
  assert.equal(session.game!.passage.id, 'camp');
  assert.equal(session.game!.state.variables.influence, 15);
  assert.notEqual(session.game!.checkpoint, oldCheckpoint);
  assert.equal(storage.record, saved);
  assert.match(session.notice!.message, /latest checkpoint could not be saved/);
  assert.match(session.notice!.message, /Closing this page may lose progress/);
  const notice = session.notice;
  session.navigate('ordinary');
  assert.equal(session.notice, notice);
  assert.equal(storage.writes, 2);
  storage.writeFailure = false;
  session.navigate('camp');
  assert.equal(session.notice, undefined);
  assert.equal(storage.writes, 3);
});

test('text submission remains committed when its automatic save fails', () => {
  const storage = new FakeStorage();
  const session = start(storage);
  session.navigate('choose_name');
  const record = storage.record;
  storage.writeFailure = true;
  session.submitText('Eleanor');
  assert.equal(session.game!.passage.id, 'named_camp');
  assert.equal(session.game!.state.variables.character_name, 'Eleanor');
  assert.equal(session.game!.checkpoint.state.variables.character_name, 'Eleanor');
  assert.equal(storage.record, record);
  assert.match(session.notice!.message, /could not be saved/);
});

test('explicit unsaved play requires consent, never touches storage, and keeps a clear notice', () => {
  const storage = withSave();
  storage.readFailure = true;
  const session = new GameSession(story, storage);
  const record = storage.record;
  assert.equal(session.playWithoutSaving(() => false), 'cancelled');
  assert.equal(session.game, undefined);
  assert.equal(session.newGame(() => assert.fail('Unknown save presence must not be overwritten.')), 'failed');
  assert.equal(session.playWithoutSaving(() => true), 'started');
  const reads = storage.reads;
  session.navigate('camp'); session.navigate('ordinary'); session.navigate('camp');
  assert.equal(storage.reads, reads);
  assert.equal(storage.writes, 0);
  assert.equal(storage.record, record);
  assert.match(session.notice!.message, /Playing without saving/);
  assert.match(session.notice!.message, /will be lost/);
});

test('first-save failure does not silently start an unsaved game; the user can opt in', () => {
  const storage = new FakeStorage(); storage.writeFailure = true;
  const session = new GameSession(story, storage);
  assert.equal(session.newGame(() => true), 'failed');
  assert.equal(session.game, undefined);
  assert.equal(storage.record, null);
  assert.equal(session.canPlayWithoutSaving, true);
  assert.equal(session.playWithoutSaving(() => true), 'started');
  assert.equal(storage.writes, 1);
});

test('failed New Game attempts keep the active unsaved-mode warning explicit', () => {
  for (const readFailure of [false, true]) {
    const storage = new FakeStorage(); storage.writeFailure = true;
    const session = new GameSession(story, storage);
    assert.equal(session.newGame(() => true), 'failed');
    assert.equal(session.playWithoutSaving(() => true), 'started');
    const game = session.game;
    storage.readFailure = readFailure;
    assert.equal(session.newGame(() => true), 'failed');
    assert.equal(session.game, game);
    assert.match(session.notice!.message, /Saving remains disabled.*will be lost/);
    const attempts = storage.writes;
    session.navigate('camp');
    assert.equal(storage.writes, attempts);
    assert.match(session.notice!.message, /Saving remains disabled.*will be lost/);
  }
});

test('a checkpoint at a genuine input passage resumes the input action normally', () => {
  const parsed = parseStory('*var name "Unknown"\n*passage start\n*title Name\n*checkpoint\nText.\n*input_text name "Name" -> end\n'
    + '*passage end\n*title End\nDone.');
  const storage = new FakeStorage();
  const session = new GameSession(parsed, storage);
  assert.equal(session.newGame(() => true), 'started');
  const resumed = new GameSession(parsed, storage).continueGame();
  assert.equal(resumed.passage.textInput?.variable, 'name');
  assert.equal(resumed.state.variables.name, 'Unknown');
  assert.equal(storage.writes, 1);
});
