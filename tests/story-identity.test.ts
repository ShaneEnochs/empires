import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { GameSession } from '../src/session';
import { parseStory } from '../src/story';
import {
  checkpointKey, DEFAULT_SAVE_IDENTITY, loadCheckpoint, saveCheckpoint, validateSaveIdentity,
  SAVE_FORMAT_VERSION, STORAGE_KEY, STORY_ID, STORY_REVISION,
} from '../src/storage';
import type { CheckpointStorage, StorySaveIdentity } from '../src/storage';

const example = parseStory(readFileSync(new URL('../src/example.story', import.meta.url), 'utf8'));
const crisis = parseStory(readFileSync(new URL('../examples/provincial-crisis.story', import.meta.url), 'utf8'));
const crisisIdentity = validateSaveIdentity({ storyId: 'provincial-crisis', storyRevision: 1 });
const exampleKey = checkpointKey(DEFAULT_SAVE_IDENTITY);
const crisisKey = checkpointKey(crisisIdentity);

class SharedStorage implements CheckpointStorage {
  readonly records = new Map<string, string>();
  readonly reads: string[] = [];
  readonly writes: { key: string; value: string }[] = [];
  readFailure?: string;
  writeFailure?: string;

  getItem(key: string): string | null {
    this.reads.push(key);
    if (key === this.readFailure) throw new Error('Storage read blocked.');
    return this.records.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.writes.push({ key, value });
    if (key === this.writeFailure) throw new Error('Storage quota exceeded.');
    this.records.set(key, value);
  }
}

function startExample(storage: SharedStorage): GameSession {
  const session = new GameSession(example, storage);
  assert.equal(session.newGame(() => true), 'started');
  session.navigate('choose_name');
  session.submitText('Éléonore O’Brien');
  return session;
}

function startCrisis(storage: SharedStorage, identity = crisisIdentity): GameSession {
  const session = new GameSession(crisis, storage, identity);
  assert.equal(session.startup.status, 'empty');
  assert.equal(session.newGame(() => { assert.fail('Another story must not require overwrite confirmation.'); }), 'started');
  session.navigate('choose_name');
  session.submitText('Rowan 周');
  session.navigate('river_background');
  session.navigate('briefing');
  return session;
}

function reachCouncil(session: GameSession): void {
  for (const id of ['mill_yard', 'copied_records', 'levee_path', 'flood_survey', 'night_council']) session.navigate(id);
}

function onlyAccessed(storage: SharedStorage, key: string): void {
  assert.ok(storage.reads.every(read => read === key));
  assert.ok(storage.writes.every(write => write.key === key));
}

test('default identity preserves the exact existing revision-1 key and application-wide format', () => {
  assert.deepEqual(DEFAULT_SAVE_IDENTITY, { storyId: 'empires-example', storyRevision: 1 });
  assert.ok(Object.isFrozen(DEFAULT_SAVE_IDENTITY));
  assert.equal(STORY_ID, 'empires-example');
  assert.equal(STORY_REVISION, 1);
  assert.equal(SAVE_FORMAT_VERSION, 2);
  assert.equal(STORAGE_KEY, 'empires:checkpoint:empires-example');
  assert.equal(checkpointKey(), STORAGE_KEY);
  assert.notEqual(exampleKey, crisisKey);
  assert.equal(crisisKey, 'empires:checkpoint:provincial-crisis');
  assert.equal(checkpointKey({ storyId: 'provincial-crisis', storyRevision: 2 }), crisisKey);
});

test('identity validation copies and freezes explicit configuration without normalizing IDs', () => {
  const input = { storyId: 'province_2-north', storyRevision: Number.MAX_SAFE_INTEGER };
  const configured = validateSaveIdentity(input);
  assert.notEqual(configured, input);
  assert.deepEqual(configured, input);
  assert.ok(Object.isFrozen(configured));
  input.storyId = 'other';
  assert.equal(configured.storyId, 'province_2-north');
  assert.throws(() => { (configured as { storyRevision: number }).storyRevision = 2; }, TypeError);
  assert.equal(checkpointKey({ storyId: 'constructor', storyRevision: 1 }), 'empires:checkpoint:constructor');
  assert.deepEqual(validateSaveIdentity(Object.assign(Object.create(null), { storyId: 'north', storyRevision: 1 })),
    { storyId: 'north', storyRevision: 1 });
});

const invalidConfigurations: [string, unknown][] = [
  ...['', 'Empires', ' empires', 'empires ', 'empires:other', 'empires/other', 'empires\\other',
    'empires.other', 'empires\n', 'émpires', '1empire'].map(id => ['ID ' + JSON.stringify(id), { storyId: id, storyRevision: 1 }] as [string, unknown]),
  ...[0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '1', null].map(revision =>
    ['revision ' + String(revision), { storyId: 'empires', storyRevision: revision }] as [string, unknown]),
  ['non-string ID', { storyId: 1, storyRevision: 1 }],
  ['null', null], ['array', []], ['empty object', {}],
  ['missing revision', { storyId: 'empires' }], ['missing ID', { storyRevision: 1 }],
  ['extra field', { storyId: 'empires', storyRevision: 1, key: exampleKey }],
  ['inherited fields', Object.create({ storyId: 'empires', storyRevision: 1 })],
  ['symbol field', { storyId: 'empires', storyRevision: 1, [Symbol('extra')]: true }],
  ['hidden field', Object.defineProperty({ storyId: 'empires', storyRevision: 1 }, 'extra', { value: true })],
  ['hidden required field', Object.defineProperty({ storyRevision: 1 }, 'storyId', { value: 'empires' })],
];

for (const [description, value] of invalidConfigurations) {
  test('invalid configuration fails before any storage access: ' + description, () => {
    const storage = new SharedStorage();
    storage.records.set(exampleKey, 'Existing progress');
    const identity = value as StorySaveIdentity;
    assert.throws(() => validateSaveIdentity(value), /Invalid story save identity/);
    assert.throws(() => checkpointKey(identity), /Invalid story save identity/);
    assert.throws(() => loadCheckpoint(storage, example, identity), /Invalid story save identity/);
    assert.throws(() => saveCheckpoint(storage, example, new Game(example).checkpoint, identity), /Invalid story save identity/);
    assert.throws(() => new GameSession(example, storage, identity), /Invalid story save identity/);
    assert.deepEqual(storage.reads, []);
    assert.deepEqual(storage.writes, []);
    assert.deepEqual([...storage.records], [[exampleKey, 'Existing progress']]);
  });
}

test('configuration accessors are rejected without invoking callbacks', () => {
  let reads = 0;
  const identity = { get storyId() { reads++; return 'empires'; }, storyRevision: 1 };
  const storage = new SharedStorage();
  assert.throws(() => new GameSession(example, storage, identity), /own data fields/);
  assert.equal(reads, 0);
  assert.deepEqual(storage.reads, []);
  assert.deepEqual(storage.writes, []);
});

test('two real stories independently save and Continue complete ordered state using shared storage', () => {
  const storage = new SharedStorage();
  const first = startExample(storage);
  const firstBytes = storage.records.get(exampleKey);
  const second = startCrisis(storage);
  reachCouncil(second);
  assert.equal(storage.records.get(exampleKey), firstBytes);
  assert.deepEqual([...storage.records.keys()], [exampleKey, crisisKey]);
  const firstState = first.game!.state;
  const secondState = second.game!.state;
  assert.deepEqual(firstState.variables, { influence: 1, honor: 5, loyal: false, character_name: 'Éléonore O’Brien' });
  assert.deepEqual(secondState.variables, {
    envoy_name: 'Rowan 周', authority: 4, trust: 2, plan: 'Undecided',
    workers_fed: false, river_warning: true, bonded: false,
  });
  assert.deepEqual(firstState.skills, ['composure']);
  assert.deepEqual(secondState.skills, ['channel_knowledge']);
  assert.deepEqual(secondState.inventory, { coin: 2, grain_sack: 8, ledger_copy: 1 });
  assert.deepEqual(secondState.journal.map(entry => entry.id),
    ['arrival', 'river_background', 'mandate_briefed', 'copied_records', 'flood_survey', 'council_open']);
  assert.match(secondState.journal.at(-1)!.text, /Rowan 周/);

  for (const [story, identity, expected] of [
    [example, DEFAULT_SAVE_IDENTITY, firstState], [crisis, crisisIdentity, secondState],
  ] as const) {
    const key = checkpointKey(identity);
    const envelope = JSON.parse(storage.records.get(key)!);
    assert.deepEqual(Object.keys(envelope), ['formatVersion', 'storyId', 'storyRevision', 'checkpoint', 'currentState']);
    assert.equal(envelope.storyId, identity.storyId);
    assert.equal(envelope.storyRevision, 1);
    assert.equal(envelope.formatVersion, 2);
    storage.reads.length = 0;
    const writes = storage.writes.length;
    const reopened = new GameSession(story, storage, identity);
    assert.equal(reopened.startup.status, 'ready');
    assert.deepEqual(storage.reads, [key]);
    assert.equal(reopened.game, undefined);
    const restored = reopened.continueGame();
    assert.deepEqual(restored.state, expected);
    assert.deepEqual(Object.keys(restored.state.inventory), Object.keys(expected.inventory));
    assert.equal(storage.writes.length, writes);
    assert.equal(storage.records.get(exampleKey), firstBytes);
  }
});

test('cancelled and confirmed New Game for one story preserve the other story and its active game', () => {
  const storage = new SharedStorage();
  const first = startExample(storage);
  const second = startCrisis(storage);
  const otherState = second.game!.state;
  const otherBytes = storage.records.get(crisisKey);
  const previousGame = first.game;
  const previousBytes = storage.records.get(exampleKey);
  storage.reads.length = 0;
  storage.writes.length = 0;
  assert.equal(first.newGame(() => false), 'cancelled');
  assert.equal(first.game, previousGame);
  assert.equal(storage.records.get(exampleKey), previousBytes);
  assert.equal(storage.writes.length, 0);
  assert.equal(first.newGame(() => true), 'started');
  assert.equal(first.game!.state.passageId, 'gate');
  assert.equal(JSON.parse(storage.records.get(exampleKey)!).checkpoint.state.variables.character_name, 'Unknown');
  onlyAccessed(storage, exampleKey);
  assert.equal(storage.records.get(crisisKey), otherBytes);
  assert.equal(second.game!.state, otherState);
  assert.deepEqual(new GameSession(crisis, storage, crisisIdentity).continueGame().state, otherState);
});

test('wrong envelope story ID is rejected at the configured key without searching other records', () => {
  const storage = new SharedStorage();
  startExample(storage);
  startCrisis(storage);
  const firstBytes = storage.records.get(exampleKey);
  const data = JSON.parse(storage.records.get(crisisKey)!);
  data.storyId = DEFAULT_SAVE_IDENTITY.storyId;
  const corrupt = JSON.stringify(data);
  storage.records.set(crisisKey, corrupt);
  storage.reads.length = 0;
  storage.writes.length = 0;
  const result = loadCheckpoint(storage, crisis, crisisIdentity);
  assert.equal(result.status, 'invalid');
  if (result.status !== 'invalid') assert.fail('Expected an invalid save.');
  assert.match(result.message, /another story/);
  const session = new GameSession(crisis, storage, crisisIdentity);
  assert.equal(session.startup.status, 'invalid');
  assert.throws(() => session.continueGame(), /no usable saved game/);
  assert.equal(storage.records.get(crisisKey), corrupt);
  assert.equal(storage.records.get(exampleKey), firstBytes);
  assert.deepEqual(storage.writes, []);
  onlyAccessed(storage, crisisKey);
});

test('a revision change reports incompatibility at the same key until confirmed replacement', () => {
  const storage = new SharedStorage();
  startExample(storage);
  startCrisis(storage);
  const firstBytes = storage.records.get(exampleKey);
  const oldBytes = storage.records.get(crisisKey);
  const revision2 = validateSaveIdentity({ storyId: 'provincial-crisis', storyRevision: 2 });
  storage.reads.length = 0;
  storage.writes.length = 0;
  const session = new GameSession(crisis, storage, revision2);
  assert.equal(session.startup.status, 'invalid');
  if (session.startup.status !== 'invalid') assert.fail('Expected incompatible progress.');
  assert.match(session.startup.message, /incompatible story revision/);
  assert.throws(() => session.continueGame(), /no usable saved game/);
  assert.equal(session.newGame(() => false), 'cancelled');
  assert.equal(storage.records.get(crisisKey), oldBytes);
  assert.equal(storage.writes.length, 0);
  assert.equal(session.newGame(() => true), 'started');
  assert.equal(storage.writes.length, 1);
  const replacement = JSON.parse(storage.records.get(crisisKey)!);
  assert.equal(replacement.storyRevision, 2);
  assert.equal(replacement.formatVersion, 2);
  assert.equal(storage.records.get(exampleKey), firstBytes);
  assert.equal(loadCheckpoint(storage, crisis, crisisIdentity).status, 'invalid');
  assert.equal(loadCheckpoint(storage, crisis, revision2).status, 'loaded');
  onlyAccessed(storage, crisisKey);
});

test('literal existing revision-1 Empires saves load with default and explicit configuration without migration', () => {
  const storage = new SharedStorage();
  const legacy = JSON.stringify({
    formatVersion: 1, storyId: 'empires-example', storyRevision: 1,
    checkpoint: { state: {
      passageId: 'gate', variables: { influence: 0, honor: 5, loyal: false, character_name: 'Unknown' },
      journal: [], skills: [], inventory: {},
    } },
  });
  storage.records.set('empires:checkpoint:empires-example', legacy);
  assert.equal(loadCheckpoint(storage, example).status, 'loaded');
  assert.equal(loadCheckpoint(storage, example, DEFAULT_SAVE_IDENTITY).status, 'loaded');
  const expected = new Game(example).state;
  assert.deepEqual(new GameSession(example, storage).continueGame().state, expected);
  assert.deepEqual(new GameSession(example, storage, DEFAULT_SAVE_IDENTITY).continueGame().state, expected);
  assert.equal(storage.records.get(exampleKey), legacy);
  assert.deepEqual(storage.writes, []);
});

test('matching identity still requires validation against the configured story definitions', () => {
  const storage = new SharedStorage();
  const first = startExample(storage);
  const result = saveCheckpoint(storage, crisis, first.game!.checkpoint, crisisIdentity);
  assert.equal(result.ok, false);
  assert.equal(storage.records.has(crisisKey), false);
  const envelope = JSON.parse(storage.records.get(exampleKey)!);
  envelope.storyId = crisisIdentity.storyId;
  storage.records.set(crisisKey, JSON.stringify(envelope));
  storage.writes.length = 0;
  assert.equal(loadCheckpoint(storage, crisis, crisisIdentity).status, 'invalid');
  assert.equal(new GameSession(crisis, storage, crisisIdentity).startup.status, 'invalid');
  assert.deepEqual(storage.writes, []);
});

test('session retains its identity when caller configuration changes, including during overwrite confirmation', () => {
  const storage = new SharedStorage();
  startExample(storage);
  const firstBytes = storage.records.get(exampleKey);
  const mutable = { storyId: 'provincial-crisis', storyRevision: 1 };
  const session = new GameSession(crisis, storage, mutable);
  mutable.storyId = 'empires-example';
  mutable.storyRevision = 99;
  storage.reads.length = 0;
  storage.writes.length = 0;
  assert.equal(session.newGame(() => true), 'started');
  session.navigate('background');
  session.navigate('river_background');
  session.navigate('briefing');
  assert.equal(session.newGame(() => {
    mutable.storyId = 'another-story';
    return true;
  }), 'started');
  onlyAccessed(storage, crisisKey);
  assert.equal(storage.records.get(exampleKey), firstBytes);
  assert.equal(JSON.parse(storage.records.get(crisisKey)!).storyRevision, 1);
});

test('failed writes are isolated; retry attempts saving the newer in-memory checkpoint', () => {
  const storage = new SharedStorage();
  const first = startExample(storage);
  const second = startCrisis(storage);
  const firstBytes = storage.records.get(exampleKey);
  const persistedBriefing = storage.records.get(crisisKey);
  const briefingState = second.game!.state;
  storage.writeFailure = crisisKey;
  reachCouncil(second);
  const councilState = second.game!.state;
  const checkpoint = second.game!.checkpoint;
  const warning = second.notice;
  assert.match(warning!.message, /could not be saved/);
  assert.equal(storage.records.get(crisisKey), persistedBriefing);
  assert.equal(storage.records.get(exampleKey), firstBytes);
  const writes = storage.writes.length;
  second.navigate('evacuation_plan');
  second.navigate('night_breach');
  second.retryAfterDeath();
  assert.deepEqual(second.game!.state, councilState);
  assert.equal(second.game!.checkpoint, checkpoint);
  assert.equal(second.notice?.message, warning?.message);
  assert.equal(storage.writes.length, writes + 3);
  assert.equal(storage.records.get(crisisKey), persistedBriefing);
  assert.deepEqual(new GameSession(crisis, storage, crisisIdentity).continueGame().state, briefingState);
  assert.equal(first.newGame(() => true), 'started');
  assert.equal(storage.records.get(crisisKey), persistedBriefing);
  assert.equal(JSON.parse(storage.records.get(exampleKey)!).checkpoint.state.passageId, 'gate');
});

test('failed New Game replacement preserves both stories and the prior active game', () => {
  const storage = new SharedStorage();
  startExample(storage);
  const second = startCrisis(storage);
  const records = [...storage.records];
  const game = second.game;
  storage.reads.length = 0;
  storage.writes.length = 0;
  storage.writeFailure = crisisKey;
  assert.equal(second.newGame(() => true), 'failed');
  assert.equal(second.game, game);
  assert.deepEqual([...storage.records], records);
  assert.equal(storage.writes.length, 1);
  onlyAccessed(storage, crisisKey);
  assert.match(second.notice!.message, /previous progress was kept/);
});

test('read failures never fall back to another story; explicit unsaved play and recovery leave all records intact', () => {
  const storage = new SharedStorage();
  startExample(storage);
  startCrisis(storage);
  const records = [...storage.records];
  storage.reads.length = 0;
  storage.writes.length = 0;
  storage.readFailure = crisisKey;
  const session = new GameSession(crisis, storage, crisisIdentity);
  assert.equal(session.startup.status, 'unavailable');
  assert.equal(session.newGame(() => { assert.fail('Do not overwrite when storage cannot be read.'); }), 'failed');
  assert.equal(session.canPlayWithoutSaving, true);
  assert.equal(session.playWithoutSaving(() => true), 'started');
  session.navigate('background');
  session.navigate('river_background');
  session.navigate('briefing');
  const expected = session.game!.state;
  for (const id of ['mill_yard', 'copied_records', 'levee_path', 'sluice_death']) session.navigate(id);
  session.retryAfterDeath();
  assert.deepEqual(session.game!.state, expected);
  assert.match(session.notice!.message, /without saving/);
  assert.deepEqual([...storage.records], records);
  assert.deepEqual(storage.writes, []);
  onlyAccessed(storage, crisisKey);
});

test('independent death and retry autosaves restore both records and exactly-once effects', () => {
  const storage = new SharedStorage();
  const first = startExample(storage);
  const second = startCrisis(storage);
  reachCouncil(second);
  const records = [...storage.records];
  const firstState = first.game!.state;
  const secondState = second.game!.state;
  const writes = storage.writes.length;
  for (let cycle = 0; cycle < 3; cycle++) {
    first.navigate('watchtower');
    first.navigate('fatal_fall');
    second.navigate('evacuation_plan');
    second.navigate('night_breach');
    first.retryAfterDeath();
    second.retryAfterDeath();
    assert.deepEqual(first.game!.state, firstState);
    assert.deepEqual(second.game!.state, secondState);
  }
  assert.deepEqual([...storage.records], records);
  assert.equal(storage.writes.length, writes + 18);
});
