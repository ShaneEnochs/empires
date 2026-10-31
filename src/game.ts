import { evaluateCondition } from './condition';
import { interpolate } from './interpolate';
import { validateTextInput } from './input';
import { validateSnapshot } from './snapshot';
import type { Choice, GameSnapshot, GameState, NarrativeParagraph, Passage, Story } from './types';

export class Game {
  private currentState: GameState;
  private currentCheckpoint: GameSnapshot;

  constructor(private readonly story: Story, options?: { readonly checkpoint: unknown }) {
    const snapshot = validateSnapshot(options === undefined ? {
      state: { passageId: story.startId, variables: story.initialVariables, journal: [], skills: [], inventory: {} },
    } : options.checkpoint, story);
    const next = this.enterPassage(snapshot.state);
    this.currentState = next;
    this.currentCheckpoint = snapshot;
  }

  get state(): GameState {
    return this.currentState;
  }

  get checkpoint(): GameSnapshot {
    return this.currentCheckpoint;
  }

  /** Engine recovery only; replays pre-entry state without capturing over it. */
  restoreCheckpoint(): void {
    const snapshot = validateSnapshot(this.currentCheckpoint, this.story);
    this.currentState = this.enterPassage(snapshot.state);
  }

  /** Player recovery is available only after reading an authored death passage. */
  retryAfterDeath(): void {
    if (!this.passage.death) throw new Error('Try Again is only available on a death passage.');
    this.restoreCheckpoint();
  }

  get passage(): Passage {
    return this.findPassage(this.currentState.passageId);
  }

  get availableChoices(): readonly Choice[] {
    return Object.freeze(this.passage.choices.filter(choice =>
      choice.condition === undefined || evaluateCondition(choice.condition, this.currentState)));
  }

  get visibleParagraphs(): readonly NarrativeParagraph[] {
    return Object.freeze(this.passage.paragraphs.filter(paragraph =>
      paragraph.condition === undefined || evaluateCondition(paragraph.condition, this.currentState)));
  }

  /** One explicit action enters one passage; there is no automatic traversal. */
  navigate(destinationId: string): void {
    const current = this.passage;
    const allowed = current.continueTo === destinationId
      || this.availableChoices.some(choice => choice.destinationId === destinationId);
    if (!allowed) {
      throw new Error(`Passage "${current.id}" has no action to "${destinationId}".`);
    }
    this.transition({ ...this.currentState, passageId: destinationId });
  }

  /** The validated current passage alone selects the variable and destination. */
  submitText(value: unknown): void {
    const action = this.passage.textInput;
    if (action === undefined) throw new Error(`Passage "${this.passage.id}" does not offer text input.`);
    const text = validateTextInput(value);
    this.transition({
      ...this.currentState, passageId: action.destinationId,
      variables: { ...this.currentState.variables, [action.variable]: text },
    });
  }

  private transition(input: GameState): void {
    const checkpoint = this.findPassage(input.passageId).checkpoint
      ? validateSnapshot({ state: input }, this.story)
      : this.currentCheckpoint;
    const next = this.enterPassage(input);
    this.currentState = next;
    this.currentCheckpoint = checkpoint;
  }

  private enterPassage(input: GameState): GameState {
    const { passageId } = input;
    const passage = this.findPassage(passageId);
    // Checkpoints preserve this input boundary; effects run only on the copy below.
    const next = {
      passageId, variables: { ...input.variables }, journal: [...input.journal],
      skills: [...input.skills], inventory: { ...input.inventory },
    };
    for (const effect of passage.effects) {
      if (effect.kind === 'set') {
        next.variables[effect.variable] = effect.value;
      } else if (effect.kind === 'add') {
        const before = next.variables[effect.variable];
        if (typeof before !== 'number') throw new Error(`Passage "${passageId}": *add requires a numeric variable.`);
        const value = before + effect.value;
        if (!Number.isFinite(value)) throw new Error(`Passage "${passageId}": *add on "${effect.variable}" produced a non-finite number.`);
        next.variables[effect.variable] = value;
      } else if (effect.kind === 'journal') {
        if (!next.journal.some(entry => entry.id === effect.id)) {
          next.journal.push(Object.freeze({
            id: effect.id, chapter: passage.chapter, text: interpolate(effect.text, next.variables),
          }));
        }
      } else if (effect.kind === 'grant_skill') {
        if (!next.skills.includes(effect.skillId)) next.skills.push(effect.skillId);
      } else if (effect.kind === 'revoke_skill') {
        const index = next.skills.indexOf(effect.skillId);
        if (index !== -1) next.skills.splice(index, 1);
      } else if ('itemId' in effect) {
        const before = Object.hasOwn(next.inventory, effect.itemId) ? next.inventory[effect.itemId]! : 0;
        if (effect.kind === 'remove_item' && before < effect.quantity) {
          throw new Error(`Passage "${passageId}": insufficient inventory for "${effect.itemId}"; cannot remove ${effect.quantity} from ${before}.`);
        }
        const quantity = effect.kind === 'add_item' ? before + effect.quantity : before - effect.quantity;
        if (!Number.isSafeInteger(quantity) || quantity < 0) {
          throw new Error(`Passage "${passageId}": item quantity for "${effect.itemId}" must remain a nonnegative safe integer.`);
        }
        if (quantity === 0) delete next.inventory[effect.itemId];
        else next.inventory[effect.itemId] = quantity;
      }
    }
    Object.freeze(next.variables);
    Object.freeze(next.journal);
    Object.freeze(next.skills);
    Object.freeze(next.inventory);
    return Object.freeze(next);
  }

  private findPassage(id: string): Passage {
    const passage = this.story.passages.find(passage => passage.id === id);
    if (!passage) throw new Error(`Missing passage "${id}".`);
    return passage;
  }
}
