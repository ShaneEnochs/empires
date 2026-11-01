import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { GameSession } from '../src/session';
import { interpolate } from '../src/interpolate';
import { characterStats } from '../src/panels';
import { parseStory } from '../src/story';
import { checkpointKey, SAVE_FORMAT_VERSION, validateSaveIdentity } from '../src/storage';
import type { CheckpointStorage } from '../src/storage';

const story = parseStory(readFileSync(new URL('../examples/provincial-crisis.story', import.meta.url), 'utf8'));
const identity = validateSaveIdentity({ storyId: 'provincial-crisis', storyRevision: 1 });
const storageKey = checkpointKey(identity);

function walk(game: Game, ...destinations: string[]): void {
  for (const destination of destinations) game.navigate(destination);
}

function begin(background: 'river_background' | 'clerk_background', name?: string): Game {
  const game = new Game(story);
  if (name === undefined) game.navigate('background');
  else { game.navigate('choose_name'); game.submitText(name); }
  walk(game, background, 'briefing');
  return game;
}

function prose(game: Game): string {
  return game.visibleParagraphs.map(paragraph => interpolate(paragraph.text, game.state.variables)).join('\n');
}

const routes = [
  {
    id: 'A: direct official order', background: 'clerk_background',
    steps: ['night_council', 'guard_offer', 'ending_guard'],
    authority: 4, trust: -3, plan: 'Guard rationing', workers: false, warning: false, bonded: false,
    inventory: { coin: 4, grain_sack: 4 }, skills: ['diplomacy'],
    journal: ['council_open', 'guard_requested', 'ending_guard'],
  },
  {
    id: 'B: named surveyor, paid evidence, and civic settlement', background: 'river_background', name: "Éléonore O'Brien",
    steps: ['mill_yard', 'copied_records', 'levee_path', 'flood_survey', 'night_council', 'evidence_hearing', 'ending_compact'],
    authority: 5, trust: 4, plan: 'Civic compact', workers: false, warning: true, bonded: false,
    inventory: { coin: 2, grain_sack: 2, ledger_copy: 1 }, skills: ['channel_knowledge'],
    journal: ['copied_records', 'flood_survey', 'council_open', 'evidence_heard', 'ending_compact'],
  },
  {
    id: 'C: protected testimony and hired local knowledge', background: 'clerk_background',
    steps: ['mill_yard', 'sworn_testimony', 'levee_path', 'hired_pilot', 'night_council', 'evidence_hearing', 'ending_compact'],
    authority: 5, trust: 4, plan: 'Civic compact', workers: false, warning: true, bonded: false,
    inventory: { coin: 3, grain_sack: 2, ledger_copy: 1 }, skills: ['diplomacy', 'channel_knowledge'],
    journal: ['sworn_testimony', 'hired_pilot', 'council_open', 'evidence_heard', 'ending_compact'],
  },
  {
    id: 'D: reject the bond, feed families, and share power', background: 'river_background',
    steps: ['depot_queue', 'bonded_offer', 'depot_queue', 'relief_kitchen', 'night_council', 'popular_assembly', 'ending_compact'],
    authority: 2, trust: 6, plan: 'Civic compact', workers: true, warning: false, bonded: false,
    inventory: { coin: 4 }, skills: ['channel_knowledge'],
    journal: ['depot_queue', 'relief_kitchen', 'council_open', 'popular_assembly', 'ending_compact'],
  },
  {
    id: 'E: debt-financed grain and evacuation by barge', background: 'river_background',
    steps: ['depot_queue', 'bonded_offer', 'merchant_bond', 'night_council', 'evacuation_plan', 'grain_barges', 'ending_refuge'],
    authority: 4, trust: 2, plan: 'River refuge', workers: false, warning: false, bonded: true,
    inventory: { coin: 1, grain_sack: 5 }, skills: ['channel_knowledge'],
    journal: ['depot_queue', 'merchant_bond', 'council_open', 'grain_barges', 'ending_refuge'],
  },
  {
    id: 'F: bypass fieldwork and pay ferry crews', background: 'river_background',
    steps: ['night_council', 'evacuation_plan', 'paid_ferries', 'ending_refuge'],
    authority: 3, trust: 2, plan: 'River refuge', workers: false, warning: true, bonded: false,
    inventory: { coin: 1, grain_sack: 6 }, skills: ['channel_knowledge'],
    journal: ['council_open', 'paid_ferries', 'ending_refuge'],
  },
  {
    id: 'G: preserve evidence while guiding an evacuation', background: 'river_background',
    steps: ['mill_yard', 'copied_records', 'levee_path', 'flood_survey', 'night_council', 'evacuation_plan', 'guided_evacuation', 'ending_refuge'],
    authority: 4, trust: 3, plan: 'River refuge', workers: false, warning: true, bonded: false,
    inventory: { coin: 2, grain_sack: 6, ledger_copy: 1 }, skills: ['channel_knowledge'],
    journal: ['copied_records', 'flood_survey', 'council_open', 'guided_evacuation', 'ending_refuge'],
  },
  {
    id: 'H: requisition food and accept coercive order', background: 'river_background',
    steps: ['cart_seizure', 'night_council', 'guard_offer', 'ending_guard'],
    authority: 5, trust: -4, plan: 'Guard rationing', workers: false, warning: false, bonded: false,
    inventory: { coin: 4, grain_sack: 6 }, skills: ['channel_knowledge'],
    journal: ['cart_seizure', 'council_open', 'guard_requested', 'ending_guard'],
  },
  {
    id: 'I: refuse the captain after requesting his help', background: 'clerk_background',
    steps: ['night_council', 'guard_offer', 'evacuation_plan', 'paid_ferries', 'ending_refuge'],
    authority: 4, trust: 0, plan: 'River refuge', workers: false, warning: true, bonded: false,
    inventory: { coin: 1, grain_sack: 6 }, skills: ['diplomacy', 'channel_knowledge'],
    journal: ['council_open', 'guard_requested', 'paid_ferries', 'ending_refuge'],
  },
  {
    id: 'J: bind the harvest to a guard settlement', background: 'clerk_background',
    steps: ['depot_queue', 'bonded_offer', 'merchant_bond', 'night_council', 'guard_offer', 'ending_guard'],
    authority: 5, trust: -4, plan: 'Guard rationing', workers: false, warning: false, bonded: true,
    inventory: { coin: 1, grain_sack: 7 }, skills: ['diplomacy'],
    journal: ['depot_queue', 'merchant_bond', 'council_open', 'guard_requested', 'ending_guard'],
  },
] as const;

test('Provincial Crisis validates 30 passages, three chapters, two checkpoints, and three authored endings', () => {
  assert.equal(story.passages.length, 30);
  assert.deepEqual([...new Set(story.passages.map(passage => passage.chapter))], ['The Writ', 'The River', 'Night Council']);
  assert.deepEqual(story.passages.filter(passage => passage.checkpoint).map(passage => passage.id), ['briefing', 'night_council']);
  assert.deepEqual(story.passages.filter(passage => passage.death).map(passage => passage.id), ['sluice_death', 'night_breach']);
  assert.deepEqual(story.passages.filter(passage => !passage.death && passage.choices.length === 0
    && passage.continueTo === undefined && passage.textInput === undefined).map(passage => passage.id),
  ['ending_compact', 'ending_guard', 'ending_refuge']);
  assert.deepEqual(story.stats.map(stat => stat.variable), ['envoy_name', 'authority', 'trust', 'plan']);
  const covered = new Set([
    'quayside', 'choose_name', 'background', 'river_background', 'clerk_background', 'briefing',
    ...routes.flatMap(route => [...route.steps]), 'sluice_death', 'night_breach',
  ]);
  assert.deepEqual([...covered].sort(), story.passages.map(passage => passage.id).sort());
});

for (const route of routes) {
  test('complete Provincial Crisis route ' + route.id, () => {
    const name = 'name' in route ? route.name : 'Mara Vale';
    const game = begin(route.background, 'name' in route ? '  ' + route.name + '  ' : undefined);
    walk(game, ...route.steps);
    assert.equal(game.passage.id, route.steps.at(-1));
    assert.deepEqual(game.state.variables, {
      envoy_name: name, authority: route.authority, trust: route.trust, plan: route.plan,
      workers_fed: route.workers, river_warning: route.warning, bonded: route.bonded,
    });
    assert.deepEqual(game.state.inventory, route.inventory);
    assert.deepEqual(game.state.skills, route.skills);
    assert.deepEqual(game.state.journal.map(entry => entry.id),
      ['arrival', route.background, 'mandate_briefed', ...route.journal]);
    assert.equal(game.state.journal[0]?.chapter, 'The Writ');
    assert.equal(game.state.journal.at(-1)?.chapter, 'Night Council');
    assert.deepEqual(characterStats(story, game.state).map(stat => stat.value),
      [name, String(route.authority), String(route.trust), route.plan]);
    assert.ok(prose(game).includes(name));
    assert.ok(game.state.journal.at(-1)?.text.startsWith(name));
    assert.deepEqual(game.availableChoices, []);
    assert.deepEqual(JSON.parse(JSON.stringify(game.state)), game.state);
    if (route.workers) {
      assert.ok(prose(game).includes('Without attested accounts'));
      assert.ok(prose(game).includes("The first kitchen's delegates keep their seats"));
      assert.equal(Object.hasOwn(game.state.inventory, 'grain_sack'), false);
      const queue = game.state.journal.filter(entry => entry.id === 'depot_queue');
      assert.deepEqual(queue, [{ id: 'depot_queue', chapter: 'The River', text: 'The depot families asked for food before any settlement.' }]);
    }
    if (route.bonded) {
      assert.ok(prose(game).includes(route.plan === 'River refuge' ? 'The harvest guarantee follows'
        : "The merchant's guarantee becomes a preferred claim"));
    }
  });
}

test('evidence and trust unlock a shared compact destination without diplomacy; hidden actions stay guarded', () => {
  const game = begin('river_background');
  walk(game, 'mill_yard');
  const before = game.state;
  assert.equal(game.availableChoices.some(choice => choice.destinationId === 'sworn_testimony'), false);
  assert.throws(() => game.navigate('sworn_testimony'), /has no action/);
  assert.equal(game.state, before);
  walk(game, 'copied_records', 'levee_path', 'flood_survey', 'night_council');
  assert.deepEqual(game.availableChoices.map(choice => choice.destinationId), ['evidence_hearing', 'guard_offer', 'evacuation_plan']);
  assert.deepEqual(game.state.skills, ['channel_knowledge']);
  assert.equal(Object.hasOwn(game.state.inventory, 'sealed_writ'), false);
  assert.ok(prose(game).includes('Your seal can no longer turn an instruction into law'));
  walk(game, 'evidence_hearing');
  assert.equal(game.availableChoices.filter(choice => choice.destinationId === 'ending_compact').length, 1);
  walk(game, 'ending_compact');
  assert.equal(game.state.variables.plan, 'Civic compact');
});

test('diplomacy unlocks the compact with low trust after taking the dry road', () => {
  const game = begin('clerk_background');
  walk(game, 'mill_yard', 'sworn_testimony', 'levee_path', 'night_council', 'evidence_hearing');
  assert.equal(game.state.variables.trust, 1);
  assert.equal(game.state.variables.river_warning, false);
  assert.equal(game.availableChoices.filter(choice => choice.destinationId === 'ending_compact').length, 1);
  walk(game, 'ending_compact');
  assert.equal(game.state.variables.authority, 5);
  assert.equal(game.state.variables.trust, 3);
  assert.deepEqual(game.state.inventory, { coin: 4, grain_sack: 2, ledger_copy: 1 });
});

test('a bonded envoy cannot afford ferry hands or use stale soundings, but has a safe barge alternative', () => {
  const game = begin('river_background');
  walk(game, 'depot_queue', 'bonded_offer', 'merchant_bond', 'night_council', 'evacuation_plan');
  assert.equal(game.state.inventory.coin, 1);
  const before = game.state;
  assert.throws(() => game.navigate('paid_ferries'), /has no action/);
  assert.equal(game.state, before);
  walk(game, 'guided_evacuation');
  const unprepared = game.state;
  assert.throws(() => game.navigate('ending_refuge'), /has no action/);
  assert.equal(game.state, unprepared);
  assert.ok(prose(game).includes("You cannot answer with today's depths"));
  walk(game, 'grain_barges', 'ending_refuge');
  assert.equal(game.state.variables.plan, 'River refuge');
  assert.deepEqual(game.state.inventory, { coin: 1, grain_sack: 5 });
});

test('the smallest council reserve can fund barges and camp without negative or fractional quantities', () => {
  const game = begin('river_background');
  walk(game, 'depot_queue', 'relief_kitchen', 'night_council', 'evacuation_plan');
  assert.equal(game.state.inventory.grain_sack, 6);
  assert.equal(game.availableChoices.some(choice => choice.destinationId === 'grain_barges' && !choice.condition), true);
  walk(game, 'grain_barges');
  assert.equal(game.state.inventory.grain_sack, 2);
  walk(game, 'ending_refuge');
  assert.deepEqual(game.state.inventory, { coin: 4 });
  assert.equal(game.state.variables.trust, 5);
});

test('both checkpoint boundaries preserve pre-entry values and restoration applies supplies/expiry exactly once', () => {
  const game = begin('river_background', 'Eleanor');
  const first = game.checkpoint;
  const firstBytes = JSON.stringify(first);
  assert.equal(first.state.passageId, 'briefing');
  assert.equal(first.state.variables.envoy_name, 'Eleanor');
  assert.equal(first.state.variables.authority, 2);
  assert.equal(Object.hasOwn(first.state.inventory, 'grain_sack'), false);
  assert.equal(game.state.variables.authority, 3);
  assert.equal(game.state.inventory.grain_sack, 6);

  walk(game, 'mill_yard', 'copied_records', 'levee_path', 'flood_survey', 'night_council');
  const second = game.checkpoint;
  const expected = game.state;
  assert.notEqual(second, first);
  assert.equal(JSON.stringify(first), firstBytes);
  assert.equal(second.state.passageId, 'night_council');
  assert.equal(second.state.inventory.grain_sack, 6);
  assert.equal(second.state.inventory.sealed_writ, 1);
  assert.deepEqual(second.state.skills, ['commission', 'channel_knowledge']);
  assert.equal(game.state.inventory.grain_sack, 8);
  assert.deepEqual(game.state.skills, ['channel_knowledge']);
  walk(game, 'evidence_hearing', 'ending_compact');
  for (let attempt = 0; attempt < 3; attempt++) {
    game.restoreCheckpoint();
    assert.deepEqual(game.state, expected);
    assert.equal(game.checkpoint, second);
    assert.deepEqual(Object.keys(game.state.inventory), ['coin', 'grain_sack', 'ledger_copy']);
    assert.equal(game.state.journal.at(-1)?.text, 'Eleanor opened the night council with 4 authority and 2 public trust.');
  }
  const fresh = new Game(story, { checkpoint: JSON.parse(JSON.stringify(second)) });
  assert.deepEqual(fresh.state, expected);
});

test('daytime death restores briefing resources, removes acquired evidence, and allows another complete route', () => {
  const game = begin('river_background', 'Eleanor');
  const expected = game.state;
  const checkpoint = game.checkpoint;
  for (let attempt = 0; attempt < 3; attempt++) {
    walk(game, 'mill_yard', 'copied_records', 'levee_path', 'sluice_death');
    assert.equal(game.passage.death, true);
    assert.equal(game.state.inventory.grain_sack, 5);
    assert.equal(game.state.journal.at(-1)?.chapter, 'The River');
    game.retryAfterDeath();
    assert.deepEqual(game.state, expected);
    assert.equal(game.checkpoint, checkpoint);
    assert.equal(game.passage.textInput, undefined);
  }
  walk(game, 'cart_seizure', 'night_council', 'guard_offer', 'ending_guard');
  assert.equal(game.state.variables.plan, 'Guard rationing');
});

test('night death restores evidence, accepted name, journal order, and the current eight-sack reserve', () => {
  const game = begin('river_background', 'Eleanor');
  walk(game, 'mill_yard', 'copied_records', 'levee_path', 'flood_survey', 'night_council');
  const expected = game.state;
  const checkpoint = game.checkpoint;
  for (let attempt = 0; attempt < 3; attempt++) {
    walk(game, 'evacuation_plan', 'night_breach');
    assert.equal(game.passage.death, true);
    assert.equal(game.state.inventory.grain_sack, 7);
    assert.equal(game.state.journal.at(-1)?.chapter, 'Night Council');
    game.retryAfterDeath();
    assert.deepEqual(game.state, expected);
    assert.equal(game.checkpoint, checkpoint);
  }
  walk(game, 'evidence_hearing', 'ending_compact');
  assert.equal(game.state.variables.plan, 'Civic compact');
});

// Only injected memory storage, using this story's actual save identity.
class MemoryStorage implements CheckpointStorage {
  record: string | null = null;
  writes = 0;
  getItem(key: string): string | null { assert.equal(key, storageKey); return this.record; }
  setItem(key: string, value: string): void { assert.equal(key, storageKey); this.writes++; this.record = value; }
}

for (const destination of ['briefing', 'night_council']) {
  test('GameSession serializes, retries, and freshly continues the independent ' + destination + ' checkpoint', () => {
    const storage = new MemoryStorage();
    const session = new GameSession(story, storage, identity);
    assert.equal(session.newGame(() => false), 'started');
    session.navigate('choose_name');
    session.submitText('  Éléonore  ');
    session.navigate('river_background');
    session.navigate('briefing');
    if (destination === 'night_council') {
      for (const id of ['mill_yard', 'copied_records', 'levee_path', 'flood_survey', 'night_council']) session.navigate(id);
    }
    const expected = session.game!.state;
    const checkpoint = session.game!.checkpoint;
    const record = storage.record!;
    const writes = storage.writes;
    const envelope = JSON.parse(record);
    assert.deepEqual(Object.keys(envelope), ['formatVersion', 'storyId', 'storyRevision', 'checkpoint', 'currentState']);
    assert.equal(envelope.formatVersion, SAVE_FORMAT_VERSION);
    assert.equal(envelope.storyId, identity.storyId);
    assert.equal(envelope.storyRevision, identity.storyRevision);
    assert.deepEqual(envelope.checkpoint, checkpoint);
    assert.equal(envelope.checkpoint.state.variables.envoy_name, 'Éléonore');

    const deathPath = destination === 'briefing' ? ['mill_yard', 'copied_records', 'levee_path', 'sluice_death']
      : ['evacuation_plan', 'night_breach'];
    for (const id of deathPath) session.navigate(id);
    session.retryAfterDeath();
    assert.deepEqual(session.game!.state, expected);
    assert.equal(session.game!.checkpoint, checkpoint);
    assert.equal(storage.record, record);
    assert.equal(storage.writes, writes + deathPath.length + 1);

    const copiedStorage = new MemoryStorage();
    copiedStorage.record = JSON.stringify(JSON.parse(record));
    const reopened = new GameSession(story, copiedStorage, identity);
    assert.equal(reopened.startup.status, 'ready');
    const continued = reopened.continueGame();
    assert.deepEqual(continued.state, expected);
    assert.deepEqual(continued.state.skills, expected.skills);
    assert.deepEqual(Object.keys(continued.state.inventory), Object.keys(expected.inventory));
    assert.equal(copiedStorage.writes, 0);
    assert.equal(copiedStorage.record, record);
    const finish = destination === 'briefing' ? ['night_council', 'evacuation_plan', 'paid_ferries', 'ending_refuge']
      : ['evidence_hearing', 'ending_compact'];
    for (const id of finish) reopened.navigate(id);
    assert.equal(continued.passage.id, finish.at(-1));
    assert.equal(copiedStorage.writes, finish.length);
  });
}
