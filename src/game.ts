import { evaluateCondition } from './condition';
import type { Choice, GameState, Passage, Story, Variables } from './types';

export class Game {
  private currentState: GameState;

  constructor(private readonly story: Story) {
    this.currentState = this.enterPassage(story.startId, story.initialVariables);
  }

  get state(): GameState {
    return this.currentState;
  }

  get passage(): Passage {
    return this.findPassage(this.currentState.passageId);
  }

  get availableChoices(): readonly Choice[] {
    return Object.freeze(this.passage.choices.filter(choice =>
      choice.condition === undefined || evaluateCondition(choice.condition, this.currentState.variables)));
  }

  /** One explicit action enters one passage; there is no automatic traversal. */
  navigate(destinationId: string): void {
    const current = this.passage;
    const allowed = current.continueTo === destinationId
      || this.availableChoices.some(choice => choice.destinationId === destinationId);
    if (!allowed) {
      throw new Error(`Passage "${current.id}" has no action to "${destinationId}".`);
    }
    this.currentState = this.enterPassage(destinationId, this.currentState.variables);
  }

  private enterPassage(passageId: string, input: Variables): GameState {
    const passage = this.findPassage(passageId);
    // Future pre-passage snapshots belong at this boundary, before any effect.
    const next = { passageId, variables: { ...input } };
    for (const effect of passage.effects) {
      if (effect.kind === 'set') {
        next.variables[effect.variable] = effect.value;
      } else {
        const before = next.variables[effect.variable];
        if (typeof before !== 'number') throw new Error(`Passage "${passageId}": *add requires a numeric variable.`);
        const value = before + effect.value;
        if (!Number.isFinite(value)) throw new Error(`Passage "${passageId}": *add on "${effect.variable}" produced a non-finite number.`);
        next.variables[effect.variable] = value;
      }
    }
    Object.freeze(next.variables);
    return Object.freeze(next);
  }

  private findPassage(id: string): Passage {
    const passage = this.story.passages.find(passage => passage.id === id);
    if (!passage) throw new Error(`Missing passage "${id}".`);
    return passage;
  }
}
