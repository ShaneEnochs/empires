export interface Choice {
  readonly label: string;
  readonly destinationId: string;
}

export interface Passage {
  readonly id: string;
  readonly title: string;
  readonly text: readonly string[];
  readonly choices: readonly Choice[];
  readonly continueTo?: string;
}

export interface Story {
  readonly startId: string;
  readonly passages: readonly Passage[];
}

/** The runtime's single source of gameplay state. */
export interface GameState {
  readonly passageId: string;
}

/** Proposed future contract only: state at the destination, before entry effects. */
export interface GameSnapshot {
  readonly state: GameState;
}
