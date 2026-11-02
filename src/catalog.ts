import { titlePage } from './title-page';
import aurelianLeagueSource from '../content/aurelian-league.story?raw';
import { validateSaveIdentity } from './storage';
import type { StorySaveIdentity } from './storage';
import type { PersonReference } from './people';

export interface CatalogStory {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly source: string;
  readonly identity: StorySaveIdentity;
  readonly people: readonly PersonReference[];
}

/** Static application configuration; importing the catalog never reads saves or enters passages. */
export const storyCatalog: readonly CatalogStory[] = Object.freeze([
  {
    id: 'aurelian-league',
    title: titlePage.title,
    description: titlePage.description,
    source: aurelianLeagueSource,
    identity: { storyId: 'aurelian-league', storyRevision: 1 },
    people: Object.freeze([]),
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
