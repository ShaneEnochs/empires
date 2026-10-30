export type VariableValue = number | boolean | string;
export type Variables = Readonly<Record<string, VariableValue>>;

export type PassageEffect =
  | { readonly kind: 'set'; readonly variable: string; readonly value: VariableValue }
  | { readonly kind: 'add'; readonly variable: string; readonly value: number };

export interface Choice {
  readonly label: string;
  readonly destinationId: string;
}

export interface Passage {
  readonly id: string;
  readonly title: string;
  readonly effects: readonly PassageEffect[];
  readonly text: readonly string[];
  readonly choices: readonly Choice[];
  readonly continueTo?: string;
}

export interface Story {
  readonly startId: string;
  readonly initialVariables: Variables;
  readonly passages: readonly Passage[];
}

/** The runtime's single source of gameplay state. */
export interface GameState {
  readonly passageId: string;
  readonly variables: Variables;
}

/** Proposed future contract only: state at the destination, before entry effects. */
export interface GameSnapshot {
  readonly state: GameState;
}
