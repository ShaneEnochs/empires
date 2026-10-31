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

export const cityGatePeople = definitions([
  {
    id: 'messenger', name: 'The messenger',
    description: 'A messenger at the city gate who asks you to listen to the council and gives you two gold coins.',
    discoveryEvents: ['met_messenger'],
  },
  {
    id: 'council_clerk', name: 'The council clerk',
    description: 'The clerk who collects your gate token and the five-coin entry fee at the council hall.',
    discoveryEvents: ['met_council'],
  },
]);

export const provincialCrisisPeople = definitions([
  {
    id: 'town_clerk', name: 'The town clerk',
    description: 'A clerk who recognizes your handwriting from a past arbitration at the provincial court.',
    discoveryEvents: ['clerk_background'],
  },
  {
    id: 'customs_keeper', name: 'The customs keeper',
    description: 'The keeper who signs six public grain sacks into your charge and honors the emergency writ until it expires.',
    discoveryEvents: ['mandate_briefed'],
  },
  {
    id: 'mill_clerk', name: 'The mill clerk',
    description: 'A junior clerk who can certify the private grain accounts and fears losing his post.',
    discoveryEvents: ['copied_records', 'sworn_testimony'],
  },
  {
    id: 'pilot', name: 'The pilot',
    description: 'A local pilot who takes soundings for one coin and teaches you the safe channel bearings.',
    discoveryEvents: ['hired_pilot'],
  },
  {
    id: 'governors_secretary', name: "The governor's secretary",
    description: 'The secretary who records the early release of grain to the relief kitchen as unauthorized.',
    discoveryEvents: ['relief_kitchen'],
  },
  {
    id: 'merchant', name: 'The grain merchant',
    description: "A merchant who advances three sacks in exchange for three coins and a guarantee against next year's harvest.",
    discoveryEvents: ['merchant_bond'],
  },
  {
    id: 'captain', name: 'The guard captain',
    description: 'The captain who offers to enforce rationing in exchange for control of the depot gates and queues.',
    discoveryEvents: ['guard_requested'],
  },
]);

/** Validate the selected story before constructing its session or reading storage. */
export function validatePeople(story: Story, people: readonly PersonReference[]): readonly PersonReference[] {
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
