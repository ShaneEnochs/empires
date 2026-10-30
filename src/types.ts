export type VariableValue = number | boolean | string;
export type Variables = Readonly<Record<string, VariableValue>>;
export type Inventory = Readonly<Record<string, number>>;
export type ComparisonOperator = '==' | '!=' | '>' | '>=' | '<' | '<=';

export type PassageEffect =
  | { readonly kind: 'set'; readonly variable: string; readonly value: VariableValue }
  | { readonly kind: 'add'; readonly variable: string; readonly value: number }
  | { readonly kind: 'journal'; readonly id: string; readonly text: string }
  | { readonly kind: 'grant_skill' | 'revoke_skill'; readonly skillId: string }
  | { readonly kind: 'add_item' | 'remove_item'; readonly itemId: string; readonly quantity: number };

export interface SkillDefinition {
  readonly id: string;
  readonly name: string;
}

export interface ItemDefinition {
  readonly id: string;
  readonly name: string;
}

export interface JournalEntry {
  readonly id: string;
  readonly chapter: string;
  readonly text: string;
}

export type Condition =
  | { readonly variable: string; readonly operator: '==' | '!='; readonly value: VariableValue }
  | { readonly variable: string; readonly operator: '>' | '>=' | '<' | '<='; readonly value: number }
  | { readonly operator: 'has_skill' | 'lacks_skill'; readonly skillId: string }
  | { readonly operator: 'has_item' | 'lacks_item'; readonly itemId: string }
  | { readonly operator: ComparisonOperator; readonly itemId: string; readonly value: number };

export interface Choice {
  readonly label: string;
  readonly destinationId: string;
  readonly condition?: Condition;
}

export interface NarrativeParagraph {
  readonly text: string;
  readonly condition?: Condition;
}

export interface TextInputAction {
  readonly variable: string;
  readonly label: string;
  readonly destinationId: string;
}

export interface Passage {
  readonly id: string;
  readonly chapter: string;
  readonly title: string;
  readonly effects: readonly PassageEffect[];
  readonly paragraphs: readonly NarrativeParagraph[];
  readonly choices: readonly Choice[];
  readonly continueTo?: string;
  readonly textInput?: TextInputAction;
}

export interface Story {
  readonly startId: string;
  readonly initialVariables: Variables;
  readonly skills: readonly SkillDefinition[];
  readonly items: readonly ItemDefinition[];
  readonly passages: readonly Passage[];
}

/** The runtime's single source of gameplay state. */
export interface GameState {
  readonly passageId: string;
  readonly variables: Variables;
  readonly journal: readonly JournalEntry[];
  readonly skills: readonly string[];
  readonly inventory: Inventory;
}

/** Proposed future contract only: state at the destination, before entry effects. */
export interface GameSnapshot {
  readonly state: GameState;
}
