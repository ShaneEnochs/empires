import { Game } from './game';
import type { Passage, Story } from './types';

export type DiagnosticCode = 'UNREACHABLE_PASSAGE' | 'REPEATABLE_EFFECT' | 'ENTRY_FAILURE'
  | 'REPRESENTATIVE_INPUT' | 'REENTRY_TESTED' | 'REENTRY_SKIPPED' | 'EXPLORATION_LIMIT' | 'ANALYSIS_SCOPE';

/** The first step starts a fresh Game; later steps navigate or submit the recorded input. */
export interface PreflightRouteStep {
  readonly passageId: string;
  readonly input?: string;
}

export interface PreflightDiagnostic {
  readonly code: DiagnosticCode;
  readonly severity: 'error' | 'warning' | 'information';
  readonly passageId?: string;
  readonly message: string;
  readonly action: string;
  /** Includes the attempted destination when entry fails. */
  readonly route?: readonly PreflightRouteStep[];
}

export interface PreflightReport {
  readonly diagnostics: readonly PreflightDiagnostic[];
  /** Number of replayed route prefixes, including initial entry. */
  readonly exploredRoutes: number;
  readonly limitReached: boolean;
  /** Distinct return prefixes attempted, excluding their replay inside follow-up prefixes. */
  readonly reentryProbes: number;
  /** Successful return entries; an immediate exit may still fail separately. */
  readonly successfulReentries: number;
  readonly skippedReentries: number;
}

export const DEFAULT_ROUTE_LIMIT = 2000;
export const REPRESENTATIVE_INPUT = 'Preflight Reader';

function diagnostic(value: PreflightDiagnostic): PreflightDiagnostic {
  return Object.freeze({ ...value, ...(value.route === undefined ? {} : {
    route: Object.freeze(value.route.map(step => Object.freeze({ ...step }))),
  }) });
}

function destinations(passage: Passage): string[] {
  if (passage.death) return [];
  return [...new Set([
    ...passage.choices.map(choice => choice.destinationId),
    ...(passage.continueTo === undefined ? [] : [passage.continueTo]),
    ...(passage.textInput === undefined ? [] : [passage.textInput.destinationId]),
  ])];
}

function reachable(graph: ReadonlyMap<string, readonly string[]>, starts: readonly string[]): Set<string> {
  const seen = new Set<string>(starts);
  const pending = [...starts];
  for (let cursor = 0; cursor < pending.length; cursor++) {
    for (const next of graph.get(pending[cursor]!) ?? []) {
      if (!seen.has(next)) { seen.add(next); pending.push(next); }
    }
  }
  return seen;
}

/** Replay simple paths, one-return probes, and their one-step exits through Game. */
export function exploreGameplay(story: Story, maxRoutes = DEFAULT_ROUTE_LIMIT): PreflightReport {
  if (!Number.isSafeInteger(maxRoutes) || maxRoutes < 1) throw new Error('maxRoutes must be a positive safe integer.');
  const diagnostics: PreflightDiagnostic[] = [];
  const queue: { route: PreflightRouteStep[]; phase: 'ordinary' | 'reentry' | 'followup' }[] = [
    { route: [{ passageId: story.startId }], phase: 'ordinary' },
  ];
  const inputPassages = new Set<string>();
  const reportedFailures = new Set<string>();
  let exploredRoutes = 0;
  let limitReached = false;
  let reentryProbes = 0;
  let successfulReentries = 0;
  let skippedReentries = 0;

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const { route, phase } = queue[cursor]!;
    exploredRoutes++;
    let game: Game;
    let stepIndex = 0;
    try {
      game = new Game(story);
      for (stepIndex = 1; stepIndex < route.length; stepIndex++) {
        const step = route[stepIndex]!;
        if (phase === 'reentry' && stepIndex === route.length - 1) reentryProbes++;
        if (step.input === undefined) game.navigate(step.passageId);
        else {
          const passageId = game.passage.id;
          if (!inputPassages.has(passageId)) {
            inputPassages.add(passageId);
            diagnostics.push(diagnostic({
              code: 'REPRESENTATIVE_INPUT', severity: 'information', passageId,
              message: 'Text input is represented by ' + JSON.stringify(REPRESENTATIVE_INPUT) + '; other values are not explored.',
              action: 'Playtest names and any text-dependent branches with additional valid values.',
            }));
          }
          game.submitText(step.input);
        }
      }
    } catch (error) {
      const failedRoute = route.slice(0, stepIndex + 1);
      const message = 'Executed entry failed: ' + (error instanceof Error ? error.message : String(error));
      const key = JSON.stringify([failedRoute, message]);
      if (!reportedFailures.has(key)) {
        reportedFailures.add(key);
        diagnostics.push(diagnostic({
          code: 'ENTRY_FAILURE', severity: 'error', passageId: failedRoute.at(-1)!.passageId, message,
          action: 'Replay this route and review the destination effects, resource budget, and choice eligibility.',
          route: failedRoute,
        }));
      }
      continue;
    }

    if (phase === 'reentry') successfulReentries++;
    const passage = game.passage;
    // A follow-up is the last step, even when its passage offers more actions.
    if (passage.death || phase === 'followup') continue;
    const input = passage.textInput;
    const nextSteps: PreflightRouteStep[] = input === undefined
      ? [...new Set([
        ...game.availableChoices.map(choice => choice.destinationId),
        ...(passage.continueTo === undefined ? [] : [passage.continueTo]),
      ])].map(passageId => ({ passageId }))
      : [{ passageId: input.destinationId, input: REPRESENTATIVE_INPUT }];
    for (const step of nextSteps) {
      const repeated = route.some(previous => previous.passageId === step.passageId);
      if (phase === 'reentry' && repeated) {
        // No probe may enter a second previously visited passage.
        skippedReentries++;
      } else if (queue.length < maxRoutes) {
        queue.push({
          route: [...route, step],
          phase: phase === 'reentry' ? 'followup' : repeated ? 'reentry' : 'ordinary',
        });
      } else {
        limitReached = true;
        if (repeated) skippedReentries++;
      }
    }
  }
  if (reentryProbes > 0) diagnostics.push(diagnostic({
    code: 'REENTRY_TESTED', severity: 'information',
    message: 'Executed ' + reentryProbes + ' re-entry probes: ' + successfulReentries
      + ' return entries succeeded and ' + (reentryProbes - successfulReentries)
      + ' failed. Immediate exits were checked only within the shared budget and one-step bound.',
    action: 'Review intended repeatable activities and test longer cycles separately; a successful return does not prove later safety.',
  }));
  if (skippedReentries > 0) diagnostics.push(diagnostic({
    code: 'REENTRY_SKIPPED', severity: 'information',
    message: 'Skipped ' + skippedReentries + ' eligible return actions because the one-repeat bound or route budget prevented probing them.',
    action: 'Playtest further repeats separately, and increase maxRoutes if the budget omitted first-return probes.',
  }));
  if (limitReached) diagnostics.push(diagnostic({
    code: 'EXPLORATION_LIMIT', severity: 'information',
    message: 'The ' + maxRoutes + '-route budget omitted eligible ordinary, return, or immediate-exit prefixes; exploration is incomplete.',
    action: 'Increase maxRoutes in exploreGameplay/analyzeStory or add explicit route tests for omitted branches.',
  }));
  diagnostics.push(diagnostic({
    code: 'ANALYSIS_SCOPE', severity: 'information',
    message: 'Exploration permits one repeated entry and at most one subsequent transition to an unvisited passage per route. Longer repeats, other text, checkpoint restoration, and death recovery were not explored; a clean report does not prove story safety.',
    action: 'Keep authored route tests and manual playtests, especially for re-entry, input-dependent branches, and recovery.',
  }));
  return Object.freeze({
    diagnostics: Object.freeze(diagnostics), exploredRoutes, limitReached,
    reentryProbes, successfulReentries, skippedReentries,
  });
}

/** Accepts an already parsed Story; never reads storage or touches an active Game. */
export function analyzeStory(story: Story, maxRoutes = DEFAULT_ROUTE_LIMIT): PreflightReport {
  const diagnostics: PreflightDiagnostic[] = [];
  const graph = new Map(story.passages.map(passage => [passage.id, destinations(passage)]));
  const fromStart = reachable(graph, [story.startId]);
  for (const passage of story.passages) {
    if (!fromStart.has(passage.id)) diagnostics.push(diagnostic({
      code: 'UNREACHABLE_PASSAGE', severity: 'warning', passageId: passage.id,
      message: 'Structurally unreachable from ' + story.startId + ', even when every authored conditional choice is considered traversable.',
      action: 'Add an intended incoming action or remove unused content. Structural reachability alone does not establish gameplay reachability.',
    }));
    if (!reachable(graph, graph.get(passage.id)!).has(passage.id)) continue;
    for (const effect of passage.effects) {
      let change: string;
      if (effect.kind === 'add' && effect.value !== 0) {
        change = 'adds ' + effect.value + ' to variable ' + effect.variable;
      } else if (effect.kind === 'add_item' || effect.kind === 'remove_item') {
        const item = story.items.find(item => item.id === effect.itemId)!;
        change = (effect.kind === 'add_item' ? 'adds ' : 'removes ') + effect.quantity + ' '
          + JSON.stringify(item.name) + ' (' + effect.itemId + ')';
      } else continue; // Journal deduplication and idempotent effects are not accumulation warnings.
      diagnostics.push(diagnostic({
        code: 'REPEATABLE_EFFECT', severity: 'warning', passageId: passage.id,
        message: 'An authored cycle may revisit ' + passage.id + ', which ' + change + ' on every entry.'
          + (passage.checkpoint ? ' This passage is also an authored checkpoint.' : '')
          + ' The cycle may not be feasible under gameplay conditions.',
        action: 'Check whether repeated rewards or expenses are intended; playtest repeat visits.'
          + (passage.checkpoint ? ' Checkpoint metadata does not make ordinary entry effects one-time.' : ''),
      }));
    }
  }
  const exploration = exploreGameplay(story, maxRoutes);
  return Object.freeze({ ...exploration, diagnostics: Object.freeze([...diagnostics, ...exploration.diagnostics]) });
}
