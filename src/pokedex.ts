import type { GameState, Story } from './types';

/** Incremental species metadata; journal events are the sole discovery state. */
export interface PokedexEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly discoveryEvents: readonly string[];
  readonly acquisitionEvents: readonly string[];
}

export function parsePokedex(value: unknown): readonly PokedexEntry[] {
  if (!Array.isArray(value)) throw new Error('Pokédex metadata must be a JSON array.');
  const ids = new Set<string>();
  const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-z][a-z0-9_-]*$/.test(id);
  const events = (value: unknown): value is string[] => Array.isArray(value)
    && value.every(validId) && new Set(value).size === value.length;
  return Object.freeze(value.map((raw: unknown, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`Pokédex entry ${index + 1}: expected an object.`);
    const { id, name, description, discoveryEvents, acquisitionEvents = [] } = raw as Record<string, unknown>;
    if (!validId(id) || ids.has(id) || typeof name !== 'string' || !name.trim()
      || typeof description !== 'string' || !description.trim()
      || !events(discoveryEvents) || !events(acquisitionEvents)
      || discoveryEvents.length + acquisitionEvents.length === 0) {
      throw new Error(`Invalid or duplicate Pokédex entry: ${typeof id === 'string' ? id : index + 1}`);
    }
    ids.add(id);
    return Object.freeze({ id, name, description,
      discoveryEvents: Object.freeze([...discoveryEvents]), acquisitionEvents: Object.freeze([...acquisitionEvents]),
    });
  }));
}

export function validatePokedex(story: Story, value: unknown): readonly PokedexEntry[] {
  const entries = parsePokedex(value);
  const events = new Set(story.passages.flatMap(passage => passage.effects
    .filter(effect => effect.kind === 'journal').map(effect => effect.id)));
  for (const entry of entries) {
    for (const event of [...entry.discoveryEvents, ...entry.acquisitionEvents]) {
      if (!events.has(event)) throw new Error(`Pokédex entry "${entry.id}": unknown journal event "${event}".`);
    }
  }
  return entries;
}

/** Never inspect prose, names, inventory, or a separate mutable discovery store. */
export function discoveredPokemon(entries: readonly PokedexEntry[], state: GameState) {
  return entries.flatMap(entry => {
    const first = state.journal.findIndex(event => entry.discoveryEvents.includes(event.id) || entry.acquisitionEvents.includes(event.id));
    if (first === -1) return [];
    const acquired = state.journal.some(event => entry.acquisitionEvents.includes(event.id));
    return [{ ...entry, status: acquired ? 'Acquired' : 'Encountered', chapter: state.journal[first]!.chapter, first }];
  }).sort((a, b) => a.first - b.first);
}
