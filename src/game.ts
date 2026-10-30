import type { GameState, Passage, Story } from './types';

export class Game {
  private currentState: GameState;

  constructor(private readonly story: Story) {
    this.currentState = Object.freeze({ passageId: story.startId });
    this.findPassage(story.startId);
  }

  get state(): GameState {
    return this.currentState;
  }

  get passage(): Passage {
    return this.findPassage(this.currentState.passageId);
  }

  /** One explicit action enters one passage; there is no automatic traversal. */
  navigate(destinationId: string): void {
    const current = this.passage;
    const allowed = current.continueTo === destinationId
      || current.choices.some(choice => choice.destinationId === destinationId);
    if (!allowed) {
      throw new Error(`Passage "${current.id}" has no action to "${destinationId}".`);
    }
    this.findPassage(destinationId);
    this.currentState = Object.freeze({ passageId: destinationId });
  }

  private findPassage(id: string): Passage {
    const passage = this.story.passages.find(passage => passage.id === id);
    if (!passage) throw new Error(`Missing passage "${id}".`);
    return passage;
  }
}
