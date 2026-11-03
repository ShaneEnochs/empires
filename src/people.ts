import type { GameState, Story } from './types';

/** A detail displayed only after one of its authored journal events is recorded. */
export interface PersonFact {
  readonly text: string;
  readonly discoveryEvents: readonly string[];
}

/** Author-maintained presentation metadata; never part of a game or save. */
export interface PersonReference {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly discoveryEvents: readonly string[];
  readonly facts?: readonly PersonFact[];
}

const validId = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z][a-z0-9_-]*$/.test(value);

const validEvents = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every(validId)
  && new Set(value).size === value.length;

function definitions(entries: readonly PersonReference[]): readonly PersonReference[] {
  return Object.freeze(entries.map(entry => Object.freeze({
    id: entry.id, name: entry.name, description: entry.description,
    discoveryEvents: Object.freeze([...entry.discoveryEvents]),
    ...(entry.facts === undefined ? {} : {
      facts: Object.freeze(entry.facts.map(fact => Object.freeze({
        text: fact.text, discoveryEvents: Object.freeze([...fact.discoveryEvents]),
      }))),
    }),
  })));
}

/** Validate ordinary JSON without trusting runtime field types. */
export function parsePeople(value: unknown): readonly PersonReference[] {
  if (!Array.isArray(value)) throw new Error('People metadata must be a JSON array.');
  const ids = new Set<string>();
  const entries = value.map((entry: unknown, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`People reference ${index + 1}: expected an object.`);
    }
    const { id, name, description, discoveryEvents, facts } = entry as Record<string, unknown>;
    if (!validId(id) || ids.has(id) || typeof name !== 'string' || !name.trim()
      || typeof description !== 'string' || !description.trim() || !validEvents(discoveryEvents)) {
      throw new Error(`Invalid or duplicate People reference: ${typeof id === 'string' ? id : index + 1}`);
    }
    ids.add(id);
    let parsedFacts: PersonFact[] | undefined;
    if (facts !== undefined) {
      if (!Array.isArray(facts) || facts.length === 0) {
        throw new Error(`People reference "${id}": facts must be a nonempty array.`);
      }
      const texts = new Set<string>();
      parsedFacts = facts.map((fact: unknown, factIndex: number) => {
        if (!fact || typeof fact !== 'object' || Array.isArray(fact)) {
          throw new Error(`People reference "${id}": invalid fact ${factIndex + 1}.`);
        }
        const { text, discoveryEvents: events } = fact as Record<string, unknown>;
        if (typeof text !== 'string' || !text.trim() || texts.has(text) || !validEvents(events)) {
          throw new Error(`People reference "${id}": invalid or duplicate fact ${factIndex + 1}.`);
        }
        texts.add(text);
        return { text, discoveryEvents: events };
      });
    }
    return {
      id, name, description, discoveryEvents,
      ...(parsedFacts === undefined ? {} : { facts: parsedFacts }),
    };
  });
  return definitions(entries);
}

/** Validate the selected story before constructing its session or reading storage. */
export function validatePeople(story: Story, people: readonly PersonReference[]): readonly PersonReference[] {
  people = parsePeople(people);
  const events = new Set(story.passages.flatMap(passage => passage.effects
    .filter(effect => effect.kind === 'journal').map(effect => effect.id)));
  for (const person of people) {
    for (const event of [
      ...person.discoveryEvents,
      ...(person.facts ?? []).flatMap(fact => fact.discoveryEvents),
    ]) {
      if (!events.has(event)) throw new Error(`People reference "${person.id}": unknown journal event "${event}".`);
    }
  }
  return definitions(people);
}

/** Re-derive discovery from the current journal, including after checkpoint recovery. */
export function encounteredPeople(people: readonly PersonReference[], state: GameState): readonly PersonReference[] {
  const journalIds = new Set(state.journal.map(event => event.id));
  return people.filter(person => person.discoveryEvents.some(id => journalIds.has(id)));
}

/** Reveal only facts already learned; reading a profile never writes game state. */
export function learnedPersonFacts(person: PersonReference, state: GameState): readonly string[] {
  const journalIds = new Set(state.journal.map(event => event.id));
  return Object.freeze((person.facts ?? [])
    .filter(fact => fact.discoveryEvents.some(id => journalIds.has(id)))
    .map(fact => fact.text));
}
