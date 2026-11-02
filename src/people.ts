import type { GameState, Story } from './types';

/** Author-maintained presentation metadata; never part of a game or save. */
export interface PersonReference {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly discoveryEvents: readonly string[];
}

function definitions(entries: readonly PersonReference[]): readonly PersonReference[] {
  return Object.freeze(entries.map(entry => Object.freeze({
    ...entry, discoveryEvents: Object.freeze([...entry.discoveryEvents]),
  })));
}

/** Validate ordinary JSON without trusting runtime field types. */
export function parsePeople(value: unknown): readonly PersonReference[] {
  if (!Array.isArray(value)) throw new Error('People metadata must be a JSON array.');
  const ids = new Set<string>();
  const entries = value.map((entry: unknown, index) => {
    if (!entry || typeof entry !== 'object') throw new Error(`People reference ${index + 1}: expected an object.`);
    const { id, name, description, discoveryEvents } = entry as Record<string, unknown>;
    if (typeof id !== 'string' || !/^[a-z][a-z0-9_-]*$/.test(id) || ids.has(id)
      || typeof name !== 'string' || !name.trim() || typeof description !== 'string' || !description.trim()
      || !Array.isArray(discoveryEvents) || discoveryEvents.length === 0
      || !discoveryEvents.every(event => typeof event === 'string' && /^[a-z][a-z0-9_-]*$/.test(event))) {
      throw new Error(`Invalid or duplicate People reference: ${typeof id === 'string' ? id : index + 1}`);
    }
    ids.add(id);
    return { id, name, description, discoveryEvents: discoveryEvents as string[] };
  });
  return definitions(entries);
}

/** Validate the selected story before constructing its session or reading storage. */
export function validatePeople(story: Story, people: readonly PersonReference[]): readonly PersonReference[] {
  people = parsePeople(people);
  const events = new Set(story.passages.flatMap(passage => passage.effects
    .filter(effect => effect.kind === 'journal').map(effect => effect.id)));
  const ids = new Set<string>();
  for (const person of people) {
    if (!/^[a-z][a-z0-9_-]*$/.test(person.id) || ids.has(person.id)
      || !person.name.trim() || !person.description.trim() || person.discoveryEvents.length === 0) {
      throw new Error('Invalid or duplicate People reference: ' + person.id);
    }
    for (const event of person.discoveryEvents) {
      if (!events.has(event)) throw new Error(`People reference "${person.id}": unknown journal event "${event}".`);
    }
    ids.add(person.id);
  }
  return definitions(people);
}

/** Re-derive discovery from the current journal, including after checkpoint recovery. */
export function encounteredPeople(people: readonly PersonReference[], state: GameState): readonly PersonReference[] {
  return people.filter(person => person.discoveryEvents.some(id => state.journal.some(event => event.id === id)));
}
