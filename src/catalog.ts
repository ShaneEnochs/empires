import cityGateSource from './example.story?raw';
import provincialCrisisSource from '../examples/provincial-crisis.story?raw';
import { DEFAULT_SAVE_IDENTITY, validateSaveIdentity } from './storage';
import type { StorySaveIdentity } from './storage';

export interface CatalogStory {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly source: string;
  readonly identity: StorySaveIdentity;
}

/** Static application configuration; importing the catalog never reads saves or enters passages. */
export const storyCatalog: readonly CatalogStory[] = Object.freeze([
  {
    id: 'city-gate',
    title: 'The City Gate',
    description: 'A short introductory adventure involving a city council, an optional character background, and a dangerous watchtower.',
    source: cityGateSource,
    identity: DEFAULT_SAVE_IDENTITY,
  },
  {
    id: 'provincial-crisis',
    title: 'Provincial Crisis',
    description: 'An envoy must respond to a flood, disputed grain supplies, and competing political interests.',
    source: provincialCrisisSource,
    identity: { storyId: 'provincial-crisis', storyRevision: 1 },
  },
].map(entry => Object.freeze({ ...entry, identity: validateSaveIdentity(entry.identity) })));

const catalogIds = new Set<string>();
const saveIds = new Set<string>();
for (const entry of storyCatalog) {
  if (!/^[a-z][a-z0-9_-]*$/.test(entry.id) || catalogIds.has(entry.id)) {
    throw new Error('Invalid or duplicate catalog ID: ' + entry.id);
  }
  if (saveIds.has(entry.identity.storyId)) throw new Error('Duplicate catalog save identity: ' + entry.identity.storyId);
  catalogIds.add(entry.id);
  saveIds.add(entry.identity.storyId);
}
