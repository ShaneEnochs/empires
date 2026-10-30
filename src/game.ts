import { evaluateCondition } from './condition';
import { interpolate } from './interpolate';
import type { Choice, GameState, NarrativeParagraph, Passage, Story } from './types';

export class Game {
  private currentState: GameState;

  constructor(private readonly story: Story) {
    this.currentState = this.enterPassage({ passageId: story.startId, variables: story.initialVariables, journal: [] });
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

  get visibleParagraphs(): readonly NarrativeParagraph[] {
    return Object.freeze(this.passage.paragraphs.filter(paragraph =>
      paragraph.condition === undefined || evaluateCondition(paragraph.condition, this.currentState.variables)));
  }

  /** One explicit action enters one passage; there is no automatic traversal. */
  navigate(destinationId: string): void {
    const current = this.passage;
    const allowed = current.continueTo === destinationId
      || this.availableChoices.some(choice => choice.destinationId === destinationId);
    if (!allowed) {
      throw new Error(`Passage "${current.id}" has no action to "${destinationId}".`);
    }
    this.currentState = this.enterPassage({ ...this.currentState, passageId: destinationId });
  }

  private enterPassage(input: GameState): GameState {
    const { passageId } = input;
    const passage = this.findPassage(passageId);
    // Future pre-passage snapshots belong at this boundary, before any effect.
    const next = { passageId, variables: { ...input.variables }, journal: [...input.journal] };
    for (const effect of passage.effects) {
      if (effect.kind === 'set') {
        next.variables[effect.variable] = effect.value;
      } else if (effect.kind === 'add') {
        const before = next.variables[effect.variable];
        if (typeof before !== 'number') throw new Error(`Passage "${passageId}": *add requires a numeric variable.`);
        const value = before + effect.value;
        if (!Number.isFinite(value)) throw new Error(`Passage "${passageId}": *add on "${effect.variable}" produced a non-finite number.`);
        next.variables[effect.variable] = value;
      } else if (!next.journal.some(entry => entry.id === effect.id)) {
        next.journal.push(Object.freeze({
          id: effect.id, chapter: passage.chapter, text: interpolate(effect.text, next.variables),
        }));
      }
    }
    Object.freeze(next.variables);
    Object.freeze(next.journal);
    return Object.freeze(next);
  }

  private findPassage(id: string): Passage {
    const passage = this.story.passages.find(passage => passage.id === id);
    if (!passage) throw new Error(`Missing passage "${id}".`);
    return passage;
  }
}
