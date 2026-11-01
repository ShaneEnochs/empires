import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game';
import { GameSession } from '../src/session';
import { parseStory } from '../src/story';
import { loadCheckpoint, STORAGE_KEY } from '../src/storage';
const story = parseStory(`*var name "Reader"
*var score 0
*stat score "Score"
*skill listening "Listening"
*item coin "Coin"
*passage start
*title Name
*add score 1
Name?
*input_text name "Name" -> camp
*passage camp
*title Camp
*checkpoint
*add score 2
*add_item coin 3
*grant_skill listening
*journal camp_event "Arrived."
Camp.
*choice
#Reward -> reward
#Death -> death
*passage reward
*title Reward
*add score 4
*add_item coin 5
*revoke_skill listening
*journal reward_event "Reward."
Reward.
*choice
#Death -> death
#End -> end
*passage death
*title Death
*add score -1
*journal died "Died."
Death.
*death
*passage end
*title Ending
*remove_item coin 1
End.`);
function memory() {
  return { raw: null as string | null, writes: 0, fail: false,
    getItem(key: string) { assert.equal(key, STORAGE_KEY); return this.raw; },
    setItem(key: string, value: string) { assert.equal(key, STORAGE_KEY); this.writes++; if (this.fail) throw Error('Full'); this.raw = value; } };
}
function setup() {
  const storage = memory(); const session = new GameSession(story, storage);
  assert.equal(session.newGame(() => false), 'started'); return { storage, session };
}

test('every committed boundary resumes exact frozen state without replay or startup writes', t => {
  const { session, storage } = setup();
  const check = () => {
    const expected = session.game!.state; const checkpoint = session.game!.checkpoint;
    const writes = storage.writes; const raw = storage.raw;
    const spy = t.mock.method(Game.prototype as any, 'enterPassage', () => { throw Error('Must not replay'); });
    const reopened = new GameSession(story, storage);
    assert.equal(reopened.startup.status, 'ready');
    const game = reopened.continueGame();
    assert.deepEqual(game.state, expected); assert.deepEqual(game.checkpoint, checkpoint);
    assert.notEqual(game.state, expected); assert.ok(Object.isFrozen(game.state.inventory));
    assert.equal(spy.mock.callCount(), 0); spy.mock.restore();
    assert.equal(storage.raw, raw); assert.equal(storage.writes, writes);
  };
  check(); session.submitText('  Éléonore 王  '); check();
  assert.equal(storage.writes, 2);
  session.navigate('reward'); check();
  assert.equal(session.game!.state.variables.score, 7);
  assert.deepEqual(session.game!.state.inventory, { coin: 8 });
  assert.deepEqual(session.game!.state.skills, []);
  assert.equal(session.game!.state.journal.length, 2);
  const checkpoint = session.game!.checkpoint;
  session.navigate('death'); check();
  const resumed = new GameSession(story, storage); resumed.continueGame(); resumed.retryAfterDeath();
  assert.deepEqual(resumed.game!.checkpoint, checkpoint);
  assert.equal(resumed.game!.passage.id, 'camp');
  assert.equal(resumed.game!.state.variables.score, 3);
  assert.deepEqual(resumed.game!.state.inventory, { coin: 3 });
  assert.deepEqual(resumed.game!.state.skills, ['listening']);
  assert.equal(resumed.game!.state.journal.length, 1);
  assert.equal(JSON.parse(storage.raw!).currentState.passageId, 'camp');
  assert.throws(() => session.navigate('end')); // Death has no normal navigation.
});

test('terminal endings resume without restarting or replaying inventory removal', () => {
  const { session, storage } = setup(); session.submitText('Ada'); session.navigate('reward'); session.navigate('end');
  const ending = session.game!.state; const writes = storage.writes;
  const game = new GameSession(story, storage).continueGame();
  assert.deepEqual(game.state, ending); assert.equal(game.state.inventory.coin, 7);
  assert.equal(game.passage.choices.length, 0); assert.equal(storage.writes, writes);
});

test('legacy checkpoint records load unchanged then upgrade on next committed action', () => {
  const { session, storage } = setup(); session.submitText('Ada');
  storage.raw = JSON.stringify({ formatVersion: 1, storyId: 'empires-example', storyRevision: 1, checkpoint: session.game!.checkpoint });
  const raw = storage.raw; const writes = storage.writes;
  const legacy = new GameSession(story, storage); const game = legacy.continueGame();
  assert.equal(game.passage.id, 'camp'); assert.equal(game.state.variables.score, 3);
  assert.equal(storage.raw, raw); assert.equal(storage.writes, writes);
  legacy.navigate('reward'); assert.equal(storage.writes, writes + 1);
  assert.equal(JSON.parse(storage.raw!).formatVersion, 2);
  assert.deepEqual(new GameSession(story, storage).continueGame().state, game.state);
});

for (const [label, mutate] of Object.entries({
  missingCurrent: (d: any) => { delete d.currentState; },
  unknownPassage: (d: any) => { d.currentState.passageId = 'missing'; },
  wrongVariable: (d: any) => { d.currentState.variables.score = '3'; },
  extraVariable: (d: any) => { d.currentState.variables.extra = 1; },
  badJournal: (d: any) => { d.currentState.journal[0].chapter = 'Unknown'; },
  duplicateJournal: (d: any) => { d.currentState.journal.push(d.currentState.journal[0]); },
  unknownSkill: (d: any) => { d.currentState.skills.push('unknown'); },
  duplicateSkill: (d: any) => { d.currentState.skills.push('listening'); },
  badInventory: (d: any) => { d.currentState.inventory.coin = -1; },
  unknownItem: (d: any) => { d.currentState.inventory.other = 1; },
  deathCheckpoint: (d: any) => { d.checkpoint.state.passageId = 'death'; },
  ordinaryCheckpoint: (d: any) => { d.checkpoint.state.passageId = 'reward'; },
  revision: (d: any) => { d.storyRevision = 2; },
  story: (d: any) => { d.storyId = 'another'; },
  version: (d: any) => { d.formatVersion = 3; },
  extra: (d: any) => { d.extra = true; },
})) test('invalid progress stays untouched: ' + label, () => {
  const { session, storage } = setup(); session.submitText('Ada');
  const data = JSON.parse(storage.raw!); mutate(data); storage.raw = JSON.stringify(data);
  const raw = storage.raw; const writes = storage.writes;
  assert.equal(loadCheckpoint(storage, story).status, 'invalid');
  assert.equal(new GameSession(story, storage).startup.status, 'invalid');
  assert.equal(storage.raw, raw); assert.equal(storage.writes, writes);
});

test('failed ordinary and retry saves keep in-memory progress and old bytes; later saves recover', () => {
  const { session, storage } = setup(); session.submitText('Ada'); const raw = storage.raw;
  storage.fail = true; session.navigate('reward');
  assert.equal(session.game!.passage.id, 'reward'); assert.equal(storage.raw, raw);
  assert.match(session.notice!.message, /Recent progress could not be saved/);
  session.navigate('death'); session.retryAfterDeath(); assert.equal(storage.raw, raw);
  storage.fail = false; session.navigate('reward'); assert.equal(session.notice, undefined);
  assert.deepEqual(new GameSession(story, storage).continueGame().state, session.game!.state);
});
