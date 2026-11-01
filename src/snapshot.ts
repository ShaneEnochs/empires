import type { GameSnapshot, GameState, JournalEntry, Story, VariableValue } from './types';

function invalid(message: string): never {
  throw new Error('Invalid checkpoint: ' + message);
}

/** Read only own, enumerable data properties; never evaluate accessor callbacks. */
function record(value: unknown, context: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) invalid(context + ' must be a plain object.');
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) invalid(context + ' must be a plain object without inherited data.');
  const entries: [string, unknown][] = [];
  for (const key of Reflect.ownKeys(value)) {
    const property = Object.getOwnPropertyDescriptor(value, key)!;
    if (typeof key !== 'string' || !property.enumerable || !('value' in property)) {
      invalid(context + ' must contain only enumerable string-keyed data properties.');
    }
    entries.push([key, property.value]);
  }
  return Object.fromEntries(entries);
}

function fields(value: Record<string, unknown>, expected: readonly string[], context: string): void {
  if (Object.keys(value).length !== expected.length || expected.some(key => !Object.hasOwn(value, key))) {
    invalid(context + ' must contain exactly: ' + expected.join(', ') + '.');
  }
}

function list(value: unknown, context: string): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || Reflect.ownKeys(value).length !== value.length + 1) invalid(context + ' must be a plain, dense array without extra properties.');
  const result: unknown[] = [];
  for (let index = 0; index < value.length; index++) {
    const property = Object.getOwnPropertyDescriptor(value, String(index));
    if (!property || !property.enumerable || !('value' in property)) invalid(context + ' must contain only own array entries.');
    result.push(property.value);
  }
  return result;
}

/** Validate against this story and return an independent, fully frozen snapshot. */
export function validateSnapshot(value: unknown, story: Story): GameSnapshot {
  return validateStateSnapshot(value, story, false);
}

/** Post-entry progress may include death; validate data without executing effects. */
export function validateCommittedState(value: unknown, story: Story): GameState {
  return validateStateSnapshot({ state: value }, story, true).state;
}

function validateStateSnapshot(value: unknown, story: Story, committed: boolean): GameSnapshot {
  const snapshot = record(value, 'Snapshot');
  fields(snapshot, ['state'], 'Snapshot');
  const state = record(snapshot.state, 'State');
  fields(state, ['passageId', 'variables', 'journal', 'skills', 'inventory'], 'State');
  const passageId = state.passageId;
  const passage = story.passages.find(passage => passage.id === passageId);
  if (typeof passageId !== 'string' || !passage) invalid('Unknown passage ID.');
  if (!committed && passage.death) invalid('Checkpoint destination cannot be a death passage.');

  const sourceVariables = record(state.variables, 'Variables');
  fields(sourceVariables, Object.keys(story.initialVariables), 'Variables');
  const variables: Record<string, VariableValue> = {};
  for (const [id, value] of Object.entries(sourceVariables)) {
    if (typeof value !== typeof story.initialVariables[id]
      || (typeof value !== 'string' && typeof value !== 'boolean' && typeof value !== 'number')
      || (typeof value === 'number' && !Number.isFinite(value))) invalid('Variable "' + id + '" has an incompatible or non-finite value.');
    variables[id] = value;
  }

  const journal: JournalEntry[] = [];
  const journalIds = new Set<string>();
  for (const raw of list(state.journal, 'Journal')) {
    const entry = record(raw, 'Journal entry');
    fields(entry, ['id', 'chapter', 'text'], 'Journal entry');
    const { id, chapter, text } = entry;
    if (typeof id !== 'string' || typeof chapter !== 'string' || typeof text !== 'string') invalid('Journal entries require string IDs, chapters, and text.');
    const origin = story.passages.find(passage => passage.effects.some(effect => effect.kind === 'journal' && effect.id === id));
    if (!origin || origin.chapter !== chapter) invalid('Journal event "' + id + '" is unknown or has the wrong chapter.');
    if (journalIds.has(id)) invalid('Duplicate journal event "' + id + '".');
    journalIds.add(id);
    journal.push(Object.freeze({ id, chapter, text }));
  }

  const skills: string[] = [];
  for (const id of list(state.skills, 'Skills')) {
    if (typeof id !== 'string' || !story.skills.some(skill => skill.id === id)) invalid('Unknown acquired skill.');
    if (skills.includes(id)) invalid('Duplicate acquired skill "' + id + '".');
    skills.push(id);
  }

  const inventory: Record<string, number> = {};
  for (const [id, quantity] of Object.entries(record(state.inventory, 'Inventory'))) {
    if (!story.items.some(item => item.id === id)) invalid('Unknown inventory item "' + id + '".');
    if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity <= 0) invalid('Inventory quantity for "' + id + '" must be a positive safe integer.');
    inventory[id] = quantity;
  }

  return Object.freeze({
    state: Object.freeze({
      passageId, variables: Object.freeze(variables), journal: Object.freeze(journal),
      skills: Object.freeze(skills), inventory: Object.freeze(inventory),
    }),
  });
}
