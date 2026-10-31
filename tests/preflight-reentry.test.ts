import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { TestContext } from 'node:test';
import { Game } from '../src/game';
import { GameSession } from '../src/session';
import { analyzeStory, REPRESENTATIVE_INPUT } from '../src/preflight';
import type { PreflightDiagnostic, PreflightReport } from '../src/preflight';
import { parseStory } from '../src/story';
import type { GameSnapshot, GameState, Story } from '../src/types';

function parsed(...lines: string[]): Story { return parseStory(lines.join('\n')); }
function errors(report: PreflightReport) { return report.diagnostics.filter(diagnostic => diagnostic.severity === 'error'); }
function warnings(report: PreflightReport) { return report.diagnostics.filter(diagnostic => diagnostic.severity === 'warning'); }

/** Observe public navigation without replacing its behavior or touching engine internals. */
function traceNavigation(t: TestContext) {
  const entries: {
    destination: string; before: GameState; after: GameState;
    checkpointBefore: GameSnapshot; checkpointAfter: GameSnapshot;
  }[] = [];
  const games = new Set<Game>();
  const navigate = Game.prototype.navigate;
  t.mock.method(Game.prototype, 'navigate', function (this: Game, destination: string) {
    games.add(this);
    const before = this.state;
    const checkpointBefore = this.checkpoint;
    try { navigate.call(this, destination); } finally {
      entries.push({ destination, before, after: this.state, checkpointBefore, checkpointAfter: this.checkpoint });
    }
  });
  return { entries, games };
}

function reproduce(story: Story, diagnostic: PreflightDiagnostic): void {
  assert.throws(() => {
    const game = new Game(story);
    for (const step of diagnostic.route!.slice(1)) {
      if (step.input === undefined) game.navigate(step.passageId);
      else game.submitText(step.input);
    }
  }, error => error instanceof Error && diagnostic.message.includes(error.message));
}

test('a safe effect-free cycle executes one return and each unvisited immediate exit, then stops', t => {
  const trace = traceNavigation(t);
  const story = parsed(
    '*passage hub', '*title Hub', 'Choose.', '*choice', '#Road -> road', '#End -> end',
    '*passage road', '*title Road', 'Return.', '*continue hub', '*passage end', '*title End', 'Done.',
  );
  const report = analyzeStory(story);
  assert.equal(report.exploredRoutes, 5);
  assert.equal(report.reentryProbes, 1);
  assert.equal(report.successfulReentries, 1);
  assert.equal(report.skippedReentries, 1);
  assert.equal(report.limitReached, false);
  assert.deepEqual(errors(report), []);
  assert.deepEqual(warnings(report), []);
  assert.equal(trace.games.size + 1, report.exploredRoutes); // Initial-only prefix does not navigate.
  assert.equal(report.diagnostics.filter(diagnostic => diagnostic.code === 'REENTRY_TESTED').length, 1);
});

test('intentional journal-only re-entry keeps the original single journal event', t => {
  const trace = traceNavigation(t);
  const story = parsed(
    '*passage queue', '*title Queue', '*journal queued "You queued."', 'Queue.', '*continue offer',
    '*passage offer', '*title Offer', 'Decide.', '*choice', '#Return -> queue', '#Finish -> end',
    '*passage end', '*title End', 'Done.',
  );
  const report = analyzeStory(story);
  const returned = trace.entries.filter(entry => entry.destination === 'queue');
  assert.equal(returned.length, 1);
  assert.deepEqual(returned[0]!.after.journal, [{ id: 'queued', chapter: 'Prologue', text: 'You queued.' }]);
  assert.equal(report.reentryProbes, 1);
  assert.equal(report.successfulReentries, 1);
  assert.deepEqual(errors(report), []);
  assert.deepEqual(warnings(report), []);
});

test('repeatable currency rewards remain warnings; successful returns are not errors', t => {
  const trace = traceNavigation(t);
  const story = parsed(
    '*item coin "Coin"', '*passage earn', '*title Earn', '*add_item coin 10', 'Earn.', '*choice',
    '#Work -> work', '#Leave -> end', '*passage work', '*title Work', 'Return.', '*continue earn',
    '*passage end', '*title End', 'Done.',
  );
  const report = analyzeStory(story);
  const returned = trace.entries.filter(entry => entry.destination === 'earn');
  assert.ok(returned.length > 0);
  assert.ok(returned.every(entry => entry.after.inventory.coin === 20));
  assert.equal(warnings(report)[0]!.code, 'REPEATABLE_EFFECT');
  assert.equal(report.reentryProbes, 1);
  assert.equal(report.successfulReentries, 1);
  assert.deepEqual(errors(report), []);
});

test('repeatable currency expenses can succeed and do not run an unbounded cycle', t => {
  const trace = traceNavigation(t);
  const story = parsed(
    '*item coin "Coin"', '*passage start', '*title Start', '*add_item coin 3', 'Begin.', '*continue market',
    '*passage market', '*title Market', '*remove_item coin 1', 'Pay.', '*choice',
    '#Again -> market', '#Leave -> end', '*passage end', '*title End', 'Done.',
  );
  const report = analyzeStory(story);
  const repeated = trace.entries.filter(entry => entry.before.passageId === 'market' && entry.destination === 'market');
  assert.ok(repeated.length > 0);
  assert.ok(repeated.every(entry => entry.after.inventory.coin === 1));
  assert.equal(report.reentryProbes, 1);
  assert.deepEqual(errors(report), []);
  assert.equal(warnings(report)[0]!.code, 'REPEATABLE_EFFECT');
});

test('an eligible insufficient-inventory return fails with the repeated ID in its exact route', () => {
  const story = parsed(
    '*item coin "Coin"', '*passage start', '*title Start', '*add_item coin 1', 'Begin.', '*continue market',
    '*passage market', '*title Market', '*remove_item coin 1', 'Pay.', '*choice',
    '#Again -> market', '#Leave -> end', '*passage end', '*title End', 'Done.',
  );
  const report = analyzeStory(story);
  assert.equal(report.reentryProbes, 1);
  assert.equal(report.successfulReentries, 0);
  assert.equal(errors(report).length, 1);
  const failure = errors(report)[0]!;
  assert.deepEqual(failure.route, [{ passageId: 'start' }, { passageId: 'market' }, { passageId: 'market' }]);
  assert.match(failure.message, /insufficient inventory/);
  reproduce(story, failure);
});

test('a successful return can make an eligible immediate exit fail', () => {
  const story = parsed(
    '*item coin "Coin"', '*passage start', '*title Start', '*add_item coin 3', 'Begin.', '*continue market',
    '*passage market', '*title Market', '*remove_item coin 1', 'Pay.', '*choice', '#Road -> road', '#Purchase -> purchase',
    '*passage road', '*title Road', '*remove_item coin 1', 'Return.', '*continue market',
    '*passage purchase', '*title Purchase', '*remove_item coin 1', 'Bought.',
  );
  const report = analyzeStory(story);
  assert.equal(report.reentryProbes, 1);
  assert.equal(report.successfulReentries, 1);
  assert.equal(errors(report).length, 1);
  assert.deepEqual(errors(report)[0]!.route?.map(step => step.passageId), ['start', 'market', 'road', 'market', 'purchase']);
  reproduce(story, errors(report)[0]!);
});

test('an ineligible conditional return is not probed despite its structural cycle', t => {
  const trace = traceNavigation(t);
  const story = parsed(
    '*var allowed false', '*passage hub', '*title Hub', 'Begin.', '*continue road',
    '*passage road', '*title Road', 'Decide.', '*choice', '#Return -> hub [if allowed == true]', '#End -> end',
    '*passage end', '*title End', 'Done.',
  );
  const report = analyzeStory(story);
  assert.equal(report.reentryProbes, 0);
  assert.equal(report.skippedReentries, 0);
  assert.equal(trace.entries.some(entry => entry.destination === 'hub'), false);
  assert.equal(report.diagnostics.some(diagnostic => diagnostic.code === 'REENTRY_TESTED'), false);
});

test('revisiting a checkpoint captures its new pre-entry values and applies effects normally', t => {
  const trace = traceNavigation(t);
  const story = parsed(
    '*var influence 0', '*passage camp', '*title Camp', '*checkpoint', '*add influence 2', 'Camp.', '*continue road',
    '*passage road', '*title Road', '*add influence 5', 'Return.', '*continue camp',
  );
  const report = analyzeStory(story);
  const returned = trace.entries.find(entry => entry.destination === 'camp')!;
  assert.equal(report.successfulReentries, 1);
  assert.equal(returned.before.variables.influence, 7);
  assert.equal(returned.after.variables.influence, 9);
  assert.notEqual(returned.checkpointAfter, returned.checkpointBefore);
  assert.equal(returned.checkpointAfter.state.passageId, 'camp');
  assert.equal(returned.checkpointAfter.state.variables.influence, 7);
  assert.equal(returned.checkpointBefore.state.variables.influence, 0);
});

test('failed checkpoint re-entry preserves its prior committed state and checkpoint', t => {
  const trace = traceNavigation(t);
  const story = parsed(
    '*var influence 0', '*item coin "Coin"', '*skill trade "Trade"',
    '*passage start', '*title Start', '*add_item coin 2', 'Begin.', '*continue camp',
    '*passage camp', '*title Camp', '*checkpoint', '*add influence 2', '*grant_skill trade',
    '*journal camp_event "Camp."', '*remove_item coin 1', 'Camp.', '*continue road',
    '*passage road', '*title Road', '*remove_item coin 1', '*revoke_skill trade', 'Return.', '*continue camp',
  );
  const report = analyzeStory(story);
  const failed = trace.entries.find(entry => entry.before.passageId === 'road' && entry.destination === 'camp')!;
  assert.equal(report.reentryProbes, 1);
  assert.equal(report.successfulReentries, 0);
  assert.equal(failed.after, failed.before);
  assert.equal(failed.checkpointAfter, failed.checkpointBefore);
  assert.deepEqual(errors(report)[0]!.route?.map(step => step.passageId), ['start', 'camp', 'road', 'camp']);
});

test('entry effects can unlock a new conditional action immediately after returning', () => {
  const story = parsed(
    '*var visits 0', '*item coin "Coin"', '*passage hub', '*title Hub', '*add visits 1', 'Choose.', '*choice',
    '#Unlocked -> unlocked [if visits >= 2]', '#Road -> road',
    '*passage road', '*title Road', 'Return.', '*continue hub',
    '*passage unlocked', '*title Unlocked', '*remove_item coin 1', 'Failure.',
  );
  const report = analyzeStory(story);
  assert.equal(report.successfulReentries, 1);
  assert.equal(errors(report).length, 1);
  assert.deepEqual(errors(report)[0]!.route?.map(step => step.passageId), ['hub', 'road', 'hub', 'unlocked']);
  reproduce(story, errors(report)[0]!);
});

test('a return that disables a conditional action does not attempt its now-ineligible exit', () => {
  const story = parsed(
    '*var visits 0', '*item coin "Coin"', '*passage start', '*title Start', '*add_item coin 1', 'Begin.', '*continue hub',
    '*passage hub', '*title Hub', '*add visits 1', 'Choose.', '*choice',
    '#Spend -> spend [if visits == 1]', '#Road -> road',
    '*passage spend', '*title Spend', '*remove_item coin 1', 'Paid.',
    '*passage road', '*title Road', '*remove_item coin 1', 'Return.', '*continue hub',
  );
  const report = analyzeStory(story);
  assert.equal(report.successfulReentries, 1);
  assert.deepEqual(errors(report), []);
});

test('failure routes retain representative text submission before a cycle', () => {
  const story = parsed(
    '*var name "Unknown"', '*item coin "Coin"', '*passage start', '*title Name', '*add_item coin 1', 'Name yourself.',
    '*input_text name "Name" -> hub', '*passage hub', '*title Hub', '*remove_item coin 1', 'Hub.', '*continue road',
    '*passage road', '*title Road', 'Return.', '*continue hub',
  );
  const report = analyzeStory(story);
  const failure = errors(report)[0]!;
  assert.deepEqual(failure.route, [
    { passageId: 'start' }, { passageId: 'hub', input: REPRESENTATIVE_INPUT }, { passageId: 'road' }, { passageId: 'hub' },
  ]);
  assert.equal(report.reentryProbes, 1);
  reproduce(story, failure);
});

test('an input action can itself be the one repeated entry', () => {
  const story = parsed(
    '*var name "Unknown"', '*passage name', '*title Name', 'Name yourself.', '*input_text name "Name" -> name',
  );
  const report = analyzeStory(story);
  assert.equal(report.exploredRoutes, 2);
  assert.equal(report.reentryProbes, 1);
  assert.equal(report.successfulReentries, 1);
  assert.equal(report.skippedReentries, 1);
  assert.deepEqual(errors(report), []);
});

test('a death reached immediately after re-entry is terminal and never triggers automatic recovery', t => {
  const trace = traceNavigation(t);
  const retry = t.mock.method(Game.prototype, 'retryAfterDeath', () => { throw new Error('No automatic retry.'); });
  const restore = t.mock.method(Game.prototype, 'restoreCheckpoint', () => { throw new Error('No automatic restore.'); });
  const story = parsed(
    '*var visits 0', '*passage hub', '*title Hub', '*add visits 1', 'Choose.', '*choice',
    '#Risk -> dead [if visits >= 2]', '#Road -> road', '*passage road', '*title Road', 'Return.', '*continue hub',
    '*passage dead', '*title Dead', 'The journey ends.', '*death',
  );
  const report = analyzeStory(story);
  assert.ok(trace.entries.some(entry => entry.after.passageId === 'dead'));
  assert.equal(report.successfulReentries, 1);
  assert.deepEqual(errors(report), []);
  assert.equal(retry.mock.callCount(), 0);
  assert.equal(restore.mock.callCount(), 0);
});

test('ordinary paths, return probes, and immediate exits share one accurately counted route budget', t => {
  const trace = traceNavigation(t);
  const story = parsed(
    '*passage hub', '*title Hub', 'Choose.', '*choice', '#Repeat -> hub', '#Finish -> end',
    '*passage end', '*title End', 'Done.',
  );
  for (const budget of [1, 2, 3, 4]) {
    trace.games.clear();
    const report = analyzeStory(story, budget);
    assert.equal(report.exploredRoutes, budget);
    assert.equal(trace.games.size + 1, report.exploredRoutes);
    assert.equal(report.reentryProbes, budget === 1 ? 0 : 1);
    assert.equal(report.limitReached, budget < 4);
    if (budget === 1) {
      assert.equal(report.skippedReentries, 1);
      assert.equal(report.diagnostics.some(diagnostic => diagnostic.code === 'REENTRY_TESTED'), false);
      assert.match(report.diagnostics.find(diagnostic => diagnostic.code === 'REENTRY_SKIPPED')!.message, /budget/);
    }
  }
});

test('a limited budget can execute one return while reporting another untested first return', () => {
  const story = parsed(
    '*passage hub', '*title Hub', 'Choose.', '*choice', '#Left -> left', '#Right -> right',
    '*passage left', '*title Left', 'Return.', '*continue hub',
    '*passage right', '*title Right', 'Return.', '*continue hub',
  );
  const report = analyzeStory(story, 4);
  assert.equal(report.exploredRoutes, 4);
  assert.equal(report.reentryProbes, 1);
  assert.equal(report.successfulReentries, 1);
  assert.equal(report.limitReached, true);
  assert.equal(report.skippedReentries, 2); // Right's first return and a further return through Left.
  assert.ok(report.diagnostics.some(diagnostic => diagnostic.code === 'EXPLORATION_LIMIT'));
});

test('a shared destination is not duplicated into identical re-entry failure diagnostics', () => {
  const story = parsed(
    '*var visits 0', '*item coin "Coin"', '*passage hub', '*title Hub', '*add visits 1', 'Choose.', '*choice',
    '#First -> fail [if visits >= 2]', '#Also -> fail [if visits >= 2]', '#Road -> road',
    '*passage road', '*title Road', 'Return.', '*continue hub',
    '*passage fail', '*title Fail', '*remove_item coin 1', 'Failure.',
  );
  const report = analyzeStory(story);
  assert.equal(errors(report).length, 1);
  assert.deepEqual(errors(report)[0]!.route?.map(step => step.passageId), ['hub', 'road', 'hub', 'fail']);
});

test('breadth-first diagnostics remain deterministic and retain distinct failure routes to the same passage', () => {
  const story = parsed(
    '*item coin "Coin"', '*passage hub', '*title Hub', 'Choose.', '*choice', '#Road -> road', '#Fail -> fail',
    '*passage road', '*title Road', 'Return.', '*continue hub',
    '*passage fail', '*title Fail', '*remove_item coin 1', 'Failure.',
  );
  const report = analyzeStory(story);
  assert.deepEqual(errors(report).map(diagnostic => diagnostic.route?.map(step => step.passageId)), [
    ['hub', 'fail'], ['hub', 'road', 'hub', 'fail'],
  ]);
  assert.deepEqual(report.diagnostics.map(diagnostic => diagnostic.code),
    ['ENTRY_FAILURE', 'ENTRY_FAILURE', 'REENTRY_TESTED', 'REENTRY_SKIPPED', 'ANALYSIS_SCOPE']);
  assert.deepEqual(analyzeStory(story), report);
  assert.deepEqual(JSON.parse(JSON.stringify(report)), report);
});

test('a follow-up is never expanded into arbitrary additional forward transitions', t => {
  const trace = traceNavigation(t);
  const story = parsed(
    '*var visits 0', '*item coin "Coin"', '*passage hub', '*title Hub', '*add visits 1', 'Choose.', '*choice',
    '#Exit -> exit [if visits >= 2]', '#Road -> road', '*passage road', '*title Road', 'Return.', '*continue hub',
    '*passage exit', '*title Exit', 'Onward.', '*continue deeper',
    '*passage deeper', '*title Deeper', '*remove_item coin 1', 'Beyond coverage.',
  );
  const report = analyzeStory(story);
  assert.ok(trace.entries.some(entry => entry.destination === 'exit'));
  assert.equal(trace.entries.some(entry => entry.destination === 'deeper'), false);
  assert.equal(report.limitReached, false);
  assert.deepEqual(errors(report), []);
  assert.match(report.diagnostics.find(diagnostic => diagnostic.code === 'ANALYSIS_SCOPE')!.message, /at most one subsequent transition/);
});

test('re-entry analysis leaves active gameplay, both saved records, and story definitions untouched', () => {
  const story = parsed(
    '*var influence 0', '*passage camp', '*title Camp', '*checkpoint', '*add influence 2', 'Camp.', '*continue road',
    '*passage road', '*title Road', 'Return.', '*continue camp',
  );
  const records = new Map<string, string>([['empires:checkpoint:provincial-crisis', 'Other saved progress']]);
  let accesses = 0;
  const session = new GameSession(story, {
    getItem(key) { accesses++; return records.get(key) ?? null; },
    setItem(key, value) { accesses++; records.set(key, value); },
  });
  assert.equal(session.newGame(() => true), 'started');
  session.navigate('road');
  const game = session.game!;
  const state = game.state;
  const checkpoint = game.checkpoint;
  const before = JSON.stringify({ story, state, checkpoint, records: [...records] });
  accesses = 0;
  const report = analyzeStory(story);
  assert.equal(report.successfulReentries, 1);
  assert.equal(session.game, game);
  assert.equal(game.state, state);
  assert.equal(game.checkpoint, checkpoint);
  assert.equal(accesses, 0);
  assert.equal(JSON.stringify({ story, state: game.state, checkpoint: game.checkpoint, records: [...records] }), before);
});

test('the real Provincial Crisis queue returns remain playable and keep one original journal event', t => {
  const trace = traceNavigation(t);
  const story = parseStory(readFileSync(new URL('../examples/provincial-crisis.story', import.meta.url), 'utf8'));
  const report = analyzeStory(story);
  const returns = trace.entries.filter(entry => entry.before.passageId === 'bonded_offer' && entry.destination === 'depot_queue');
  assert.equal(report.reentryProbes, 4);
  assert.equal(report.successfulReentries, 4);
  assert.ok(returns.length >= report.reentryProbes); // Follow-up prefixes also replay their successful return.
  for (const entry of returns) {
    assert.deepEqual(entry.after.journal, entry.before.journal);
    assert.equal(entry.after.journal.filter(event => event.id === 'depot_queue').length, 1);
    assert.deepEqual(entry.after.variables, entry.before.variables);
    assert.deepEqual(entry.after.inventory, entry.before.inventory);
  }
  assert.deepEqual(errors(report), []);
  assert.deepEqual(warnings(report), []);
});
