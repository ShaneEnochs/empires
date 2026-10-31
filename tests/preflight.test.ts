import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { analyzeStory, exploreGameplay, REPRESENTATIVE_INPUT } from '../src/preflight';
import type { PreflightDiagnostic, PreflightReport } from '../src/preflight';
import { parseStory } from '../src/story';
import type { Story } from '../src/types';

function parsed(...lines: string[]): Story { return parseStory(lines.join('\n')); }
function errors(report: PreflightReport) { return report.diagnostics.filter(diagnostic => diagnostic.severity === 'error'); }
function warnings(report: PreflightReport) { return report.diagnostics.filter(diagnostic => diagnostic.severity === 'warning'); }
function codes(report: PreflightReport) { return report.diagnostics.map(diagnostic => diagnostic.code); }

function reproduce(story: Story, failure: PreflightDiagnostic): void {
  const route = failure.route!;
  assert.equal(route[0]!.passageId, story.startId);
  assert.throws(() => {
    const game = new Game(story);
    for (const step of route.slice(1)) {
      if (step.input === undefined) game.navigate(step.passageId);
      else game.submitText(step.input);
    }
  }, error => error instanceof Error && failure.message.includes(error.message));
}

const simple = parsed(
  '*passage start', '*title Start', 'A road.', '*continue end',
  '*passage end', '*title End', 'An ordinary ending.',
);

test('a valid simple story permits an ordinary terminal ending and reports its limited scope', () => {
  const report = analyzeStory(simple);
  assert.deepEqual(codes(report), ['ANALYSIS_SCOPE']);
  assert.equal(report.exploredRoutes, 2);
  assert.equal(report.limitReached, false);
  assert.match(report.diagnostics[0]!.message, /does not prove story safety/);
});

test('reports structurally unreachable passages, not normal endings, in authored order', () => {
  const story = parsed(
    '*passage start', '*title Start', 'Ending.',
    '*passage orphan_b', '*title Orphan B', 'Unused.',
    '*passage orphan_a', '*title Orphan A', 'Unused.', '*continue orphan_b',
  );
  const report = analyzeStory(story);
  assert.deepEqual(warnings(report).map(diagnostic => [diagnostic.code, diagnostic.passageId]),
    [['UNREACHABLE_PASSAGE', 'orphan_b'], ['UNREACHABLE_PASSAGE', 'orphan_a']]);
  assert.match(warnings(report)[0]!.message, /Structurally unreachable/);
  assert.deepEqual(errors(report), []);
});

test('conditional destinations are structurally reachable even when gameplay cannot enter them', () => {
  const story = parsed(
    '*var allowed false', '*item token "Token"',
    '*passage start', '*title Start', 'Choose.', '*choice',
    '#Hidden -> blocked [if allowed == true]', '#End -> end',
    '*passage blocked', '*title Blocked', '*remove_item token 1', 'Not reached.',
    '*passage end', '*title End', 'Done.',
  );
  const report = analyzeStory(story);
  assert.deepEqual(warnings(report), []);
  assert.deepEqual(errors(report), []);
  assert.equal(report.exploredRoutes, 2);
});

test('text-input destinations participate in structural reachability', () => {
  const story = parsed(
    '*var name "Unknown"', '*passage start', '*title Name', 'Name yourself.',
    '*input_text name "Name" -> named', '*passage named', '*title Named', 'Welcome.',
  );
  assert.deepEqual(warnings(analyzeStory(story)), []);
});

test('death is an authored termination, not an error or an implicit recovery edge', () => {
  const story = parsed(
    '*passage start', '*title Start', 'A risk.', '*continue dead',
    '*passage dead', '*title Dead', 'The journey ends.', '*death',
  );
  const report = analyzeStory(story);
  assert.deepEqual(codes(report), ['ANALYSIS_SCOPE']);
  assert.equal(report.exploredRoutes, 2);
  assert.equal(report.skippedReentries, 0);
});

test('a journal-only cycle is tested without accumulation warnings and reports further-return limits', () => {
  const story = parsed(
    '*passage queue', '*title Queue', '*journal queued "You queued."', 'A queue.', '*continue offer',
    '*passage offer', '*title Offer', 'Decide.', '*choice', '#Return -> queue', '#Finish -> end',
    '*passage end', '*title End', 'Done.',
  );
  const report = analyzeStory(story);
  assert.deepEqual(warnings(report), []);
  assert.deepEqual(errors(report), []);
  assert.deepEqual(codes(report), ['REENTRY_TESTED', 'REENTRY_SKIPPED', 'ANALYSIS_SCOPE']);
  assert.equal(report.reentryProbes, 1);
  assert.equal(report.successfulReentries, 1);
  assert.equal(report.skippedReentries, 1);
});

for (const [effect, expected] of [
  ['*add influence 5', 'adds 5 to variable influence'],
  ['*add influence -2', 'adds -2 to variable influence'],
  ['*add_item coin 10', 'adds 10 "Gold Coin" (coin)'],
  ['*remove_item coin 2', 'removes 2 "Gold Coin" (coin)'],
] as const) {
  test('warns about an effect in a self-cycle: ' + effect, () => {
    const story = parsed(
      '*var influence 0', '*item coin "Gold Coin"',
      '*passage start', '*title Start', '*add_item coin 4', 'A road.', '*continue market',
      '*passage market', '*title Market', effect, 'Trade.', '*choice', '#Again -> market', '#Leave -> end',
      '*passage end', '*title End', 'Done.',
    );
    const report = analyzeStory(story);
    assert.equal(warnings(report).length, 1);
    assert.equal(warnings(report)[0]!.code, 'REPEATABLE_EFFECT');
    assert.equal(warnings(report)[0]!.passageId, 'market');
    assert.ok(warnings(report)[0]!.message.includes(expected));
    assert.deepEqual(errors(report), []);
  });
}

test('detects multi-passage cycles, including an authored checkpoint with repeatable effects', () => {
  const story = parsed(
    '*var influence 0', '*passage camp', '*title Camp', '*checkpoint', '*add influence 5',
    'Camp.', '*continue road', '*passage road', '*title Road', 'Return.', '*continue camp',
  );
  const report = analyzeStory(story);
  assert.equal(warnings(report).length, 1);
  assert.match(warnings(report)[0]!.message, /authored checkpoint/);
  assert.match(warnings(report)[0]!.action, /not make ordinary entry effects one-time/);
  assert.equal(report.skippedReentries, 1);
});

test('a conditional graph cycle is a conservative warning, not a confirmed gameplay failure', () => {
  const story = parsed(
    '*var allowed false', '*var influence 0', '*passage start', '*title Start', '*add influence 1',
    'Begin.', '*continue road', '*passage road', '*title Road', 'Decide.', '*choice',
    '#Return -> start [if allowed == true]', '#Finish -> end', '*passage end', '*title End', 'Done.',
  );
  const report = analyzeStory(story);
  assert.equal(warnings(report)[0]!.code, 'REPEATABLE_EFFECT');
  assert.match(warnings(report)[0]!.message, /may not be feasible/);
  assert.deepEqual(errors(report), []);
  assert.equal(report.skippedReentries, 0);
});

test('acyclic rewards, zero additions, and idempotent skill/set effects are not accumulation warnings', () => {
  const story = parsed(
    '*var influence 0', '*skill diplomacy "Diplomacy"', '*item coin "Coin"',
    '*passage start', '*title Start', '*add influence 5', '*add_item coin 10', 'Begin.', '*continue hub',
    '*passage hub', '*title Hub', '*add influence 0', '*set influence 2', '*grant_skill diplomacy',
    'Again.', '*choice', '#Repeat -> hub', '#Finish -> end', '*passage end', '*title End', 'Done.',
  );
  assert.deepEqual(warnings(analyzeStory(story)), []);
});

test('does not suppress repeat warnings for an unreachable cycle', () => {
  const story = parsed(
    '*var influence 0', '*passage start', '*title Start', 'End.',
    '*passage unused', '*title Unused', '*add influence 1', 'Unused.', '*continue unused',
  );
  assert.deepEqual(warnings(analyzeStory(story)).map(diagnostic => diagnostic.code),
    ['UNREACHABLE_PASSAGE', 'REPEATABLE_EFFECT']);
});

test('reports an eligible insufficient-inventory failure with its exact reproducible route', () => {
  const story = parsed(
    '*item coin "Coin"', '*passage start', '*title Start', 'Begin.', '*continue market',
    '*passage market', '*title Market', 'Choose.', '*choice', '#Buy -> purchase', '#Leave -> end',
    '*passage purchase', '*title Purchase', '*remove_item coin 2', 'Bought.',
    '*passage end', '*title End', 'Done.',
  );
  const report = analyzeStory(story);
  assert.equal(errors(report).length, 1);
  const failure = errors(report)[0]!;
  assert.equal(failure.code, 'ENTRY_FAILURE');
  assert.equal(failure.passageId, 'purchase');
  assert.match(failure.message, /insufficient inventory/);
  assert.deepEqual(failure.route, [{ passageId: 'start' }, { passageId: 'market' }, { passageId: 'purchase' }]);
  assert.match(failure.action, /resource budget/);
  reproduce(story, failure);
});

test('earlier inventory grants make a removal safe despite an empty starting inventory', () => {
  const story = parsed(
    '*item coin "Coin"', '*passage start', '*title Start', '*add_item coin 2', 'Reward.', '*continue pay',
    '*passage pay', '*title Pay', '*remove_item coin 2', 'Paid.',
  );
  assert.deepEqual(errors(analyzeStory(story)), []);
  assert.deepEqual(warnings(analyzeStory(story)), []);
});

for (const [declaration, initial, failure] of [
  ['*var huge 1e308', '*add huge 0', '*add huge 1e308'],
  ['*item coin "Coin"', '*add_item coin 9007199254740991', '*add_item coin 1'],
] as const) {
  test('reproduces runtime overflow: ' + failure, () => {
    const story = parsed(
      declaration, '*passage start', '*title Start', initial, 'Begin.', '*continue overflow',
      '*passage overflow', '*title Overflow', failure, 'Failed.',
    );
    const diagnostic = errors(analyzeStory(story))[0]!;
    assert.equal(diagnostic.passageId, 'overflow');
    assert.match(diagnostic.message, /non-finite|safe integer/);
    reproduce(story, diagnostic);
  });
}

test('initial-entry failure has a concrete one-step route and does not invent initialized gameplay', () => {
  const story = parsed('*item coin "Coin"', '*passage start', '*title Start', '*remove_item coin 1', 'Begin.');
  const report = analyzeStory(story);
  assert.equal(report.exploredRoutes, 1);
  assert.deepEqual(errors(report)[0]!.route, [{ passageId: 'start' }]);
  reproduce(story, errors(report)[0]!);
});

test('input routes record the actual representative value and destination failure', () => {
  const story = parsed(
    '*var name "Unknown"', '*item coin "Coin"', '*passage start', '*title Name', 'Name yourself.',
    '*input_text name "Name" -> named', '*passage named', '*title Named', '*remove_item coin 1', 'Welcome.',
  );
  const report = analyzeStory(story);
  assert.deepEqual(codes(report), ['REPRESENTATIVE_INPUT', 'ENTRY_FAILURE', 'ANALYSIS_SCOPE']);
  assert.deepEqual(errors(report)[0]!.route, [
    { passageId: 'start' }, { passageId: 'named', input: REPRESENTATIVE_INPUT },
  ]);
  reproduce(story, errors(report)[0]!);
});

test('representative input affects ordinary string conditions without covering all possible names', () => {
  const story = parsed(
    '*var name "Unknown"', '*item coin "Coin"', '*passage start', '*title Name', 'Name yourself.',
    '*input_text name "Name" -> named', '*passage named', '*title Named', 'Choose.', '*choice',
    '#Representative -> pay [if name == "Preflight Reader"]', '#Special -> special [if name == "Special"]',
    '#Leave -> end', '*passage pay', '*title Pay', '*remove_item coin 1', 'Pay.',
    '*passage special', '*title Special', '*remove_item coin 2', 'Other name.',
    '*passage end', '*title End', 'Done.',
  );
  const report = analyzeStory(story);
  assert.deepEqual(errors(report).map(diagnostic => diagnostic.passageId), ['pay']);
  assert.deepEqual(warnings(report), []);
  assert.ok(codes(report).includes('REPRESENTATIVE_INPUT'));
});

test('converging branches retain distinct skills, variables, and inventory when querying Game eligibility', () => {
  const story = parsed(
    '*var ready false', '*skill trade "Trade"', '*item coin "Coin"',
    '*passage start', '*title Start', 'Choose.', '*choice', '#Funded -> funded', '#Unfunded -> unfunded',
    '*passage funded', '*title Funded', '*grant_skill trade', '*set ready true', '*add_item coin 2', 'Funded.', '*continue hub',
    '*passage unfunded', '*title Unfunded', '*set ready true', 'Unfunded.', '*continue hub',
    '*passage hub', '*title Hub', 'Decide.', '*choice', '#Trade -> skill_pay [if has_skill trade]',
    '#Count -> count_pay [if item_count coin >= 2]', '#Pay -> pay [if ready == true]', '#Leave -> end',
    '*passage skill_pay', '*title Skill Pay', '*remove_item coin 2', 'Paid.',
    '*passage count_pay', '*title Count Pay', '*remove_item coin 2', 'Paid.',
    '*passage pay', '*title Pay', '*remove_item coin 2', 'Paid.', '*passage end', '*title End', 'Done.',
  );
  const report = analyzeStory(story);
  assert.equal(errors(report).length, 1);
  assert.deepEqual(errors(report)[0]!.route?.map(step => step.passageId), ['start', 'unfunded', 'hub', 'pay']);
  reproduce(story, errors(report)[0]!);
});

test('shared destinations are explored once per state when an eligible choice offers them', () => {
  const story = parsed(
    '*var ready false', '*passage start', '*title Start', 'Choose.', '*choice',
    '#Hidden -> end [if ready == true]', '#Fallback -> end', '*passage end', '*title End', 'Done.',
  );
  assert.equal(exploreGameplay(story).exploredRoutes, 2);
});

test('the route budget reports omitted prefixes and does not claim success for unexplored failures', () => {
  const story = parsed(
    '*item coin "Coin"', '*passage start', '*title Start', 'Choose.', '*choice',
    '#First -> end', '#Later -> fail', '*passage end', '*title End', 'Done.',
    '*passage fail', '*title Fail', '*remove_item coin 1', 'Fail.',
  );
  const limited = analyzeStory(story, 2);
  assert.equal(limited.exploredRoutes, 2);
  assert.equal(limited.limitReached, true);
  assert.deepEqual(errors(limited), []);
  assert.match(limited.diagnostics.find(diagnostic => diagnostic.code === 'EXPLORATION_LIMIT')!.message, /incomplete/);
  assert.equal(errors(analyzeStory(story, 3)).length, 1);
  assert.equal(analyzeStory(simple, 2).limitReached, false);
});

test('a budget preventing text submission does not claim a representative value was submitted', () => {
  const story = parsed(
    '*var name "Unknown"', '*passage start', '*title Name', 'Name yourself.',
    '*input_text name "Name" -> end', '*passage end', '*title End', 'Done.',
  );
  assert.deepEqual(codes(analyzeStory(story, 1)), ['EXPLORATION_LIMIT', 'ANALYSIS_SCOPE']);
});

for (const limit of [0, -1, 1.5, NaN, Infinity]) {
  test('rejects an invalid exploration limit: ' + String(limit), () => {
    assert.throws(() => exploreGameplay(simple, limit), /positive safe integer/);
    assert.throws(() => analyzeStory(simple, limit), /positive safe integer/);
  });
}

test('diagnostics use deterministic authored/effect order followed by breadth-first gameplay order', () => {
  const story = parsed(
    '*var influence 0', '*item coin "Coin"', '*passage start', '*title Start', 'Choose.', '*choice',
    '#Z -> z_failure', '#A -> a_failure', '*passage z_failure', '*title Z', '*remove_item coin 1', 'Z.',
    '*passage a_failure', '*title A', '*remove_item coin 1', 'A.',
    '*passage unused', '*title Unused', '*add influence 1', '*add_item coin 1', 'Unused.', '*continue unused',
  );
  const report = analyzeStory(story);
  assert.deepEqual(report.diagnostics.map(diagnostic => [diagnostic.code, diagnostic.passageId]), [
    ['UNREACHABLE_PASSAGE', 'unused'], ['REPEATABLE_EFFECT', 'unused'], ['REPEATABLE_EFFECT', 'unused'],
    ['ENTRY_FAILURE', 'z_failure'], ['ENTRY_FAILURE', 'a_failure'], ['ANALYSIS_SCOPE', undefined],
  ]);
  assert.deepEqual(analyzeStory(story), report);
  assert.deepEqual(JSON.parse(JSON.stringify(report)), report);
});

test('preflight never modifies Story or another Game state/checkpoint; exposed diagnostics and routes are immutable', () => {
  const story = parsed(
    '*var influence 1', '*item coin "Coin"', '*passage start', '*title Start', '*add influence 1', 'Begin.', '*continue fail',
    '*passage fail', '*title Fail', '*add influence 5', '*remove_item coin 1', 'Fail.',
  );
  const active = new Game(story);
  const state = active.state;
  const checkpoint = active.checkpoint;
  const storyJson = JSON.stringify(story);
  const stateJson = JSON.stringify(state);
  const checkpointJson = JSON.stringify(checkpoint);
  const report = analyzeStory(story);
  assert.equal(JSON.stringify(story), storyJson);
  assert.equal(JSON.stringify(active.state), stateJson);
  assert.equal(JSON.stringify(active.checkpoint), checkpointJson);
  assert.equal(active.state, state);
  assert.equal(active.checkpoint, checkpoint);
  assert.ok(Object.isFrozen(report));
  assert.ok(Object.isFrozen(report.diagnostics));
  const failure = errors(report)[0]!;
  assert.ok(Object.isFrozen(failure));
  assert.ok(Object.isFrozen(failure.route));
  assert.ok(Object.isFrozen(failure.route![0]));
  assert.throws(() => { (failure.route![0] as { passageId: string }).passageId = 'changed'; }, TypeError);
});

for (const [file, expectedRoutes, probes, skipped] of [
  ['src/example.story', 14, 0, 0], ['examples/provincial-crisis.story', 1098, 4, 4],
] as const) {
  test('preflights the unchanged included story: ' + file, () => {
    const story = parseStory(readFileSync(new URL('../' + file, import.meta.url), 'utf8'));
    const report = analyzeStory(story);
    assert.deepEqual(errors(report), []);
    assert.deepEqual(warnings(report), []);
    assert.equal(report.exploredRoutes, expectedRoutes);
    assert.equal(report.reentryProbes, probes);
    assert.equal(report.successfulReentries, probes);
    assert.equal(report.skippedReentries, skipped);
    assert.equal(report.limitReached, false);
    assert.deepEqual(codes(report), skipped
      ? ['REPRESENTATIVE_INPUT', 'REENTRY_TESTED', 'REENTRY_SKIPPED', 'ANALYSIS_SCOPE']
      : ['REPRESENTATIVE_INPUT', 'ANALYSIS_SCOPE']);
  });
}
