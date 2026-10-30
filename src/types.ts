export type VariableValue = number | boolean | string;
export type Variables = Readonly<Record<string, VariableValue>>;

export type PassageEffect =
  | { readonly kind: 'set'; readonly variable: string; readonly value: VariableValue }
  | { readonly kind: 'add'; readonly variable: string; readonly value: number }
  | { readonly kind: 'journal'; readonly id: string; readonly text: string };

export interface JournalEntry {
  readonly id: string;
  readonly chapter: string;
  readonly text: string;
}

export type Condition =
  | { readonly variable: string; readonly operator: '==' | '!='; readonly value: VariableValue }
  | { readonly variable: string; readonly operator: '>' | '>=' | '<' | '<='; readonly value: number };

export interface Choice {
  readonly label: string;
  readonly destinationId: string;
  readonly condition?: Condition;
}

export interface NarrativeParagraph {
  readonly text: string;
  readonly condition?: Condition;
}

export interface Passage {
  readonly id: string;
  readonly chapter: string;
  readonly title: string;
  readonly effects: readonly PassageEffect[];
  readonly paragraphs: readonly NarrativeParagraph[];
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
  readonly journal: readonly JournalEntry[];
}

/** Proposed future contract only: state at the destination, before entry effects. */
export interface GameSnapshot {
  readonly state: GameState;
}
