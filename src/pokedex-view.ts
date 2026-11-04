import { pokemonLabel } from './pokedex';
import type { DiscoveredPokemon } from './pokedex';

/** Shared, text-only presentation for notebook entries and narrative lookup cards. */
export function pokemonInformation(entry: DiscoveredPokemon): HTMLElement {
  const content = document.createElement('div');
  content.className = 'pokemon-information';
  const status = document.createElement('p');
  status.className = 'discovery-status'; status.textContent = `${entry.status} · ${entry.chapter}`;
  content.append(status);
  const values = document.createElement('dl');
  for (const [label, value] of [['Type', entry.types?.join(' / ')], ['Category', entry.category]]) {
    if (value === undefined) continue;
    const term = document.createElement('dt'); term.textContent = label!;
    const description = document.createElement('dd'); description.textContent = value;
    values.append(term, description);
  }
  if (values.childElementCount) content.append(values);
  const summary = document.createElement('p'); summary.textContent = entry.officialSummary ?? entry.description;
  content.append(summary);
  if (entry.observations.length) {
    const heading = document.createElement('h4'); heading.textContent = 'Your observations';
    const notes = document.createElement('ul'); notes.className = 'pokemon-observations';
    for (const observation of entry.observations) {
      const item = document.createElement('li'); item.textContent = observation.text; notes.append(item);
    }
    content.append(heading, notes);
  }
  return content;
}

export function lookupCard(entry: DiscoveredPokemon): HTMLElement {
  const card = document.createElement('aside');
  card.className = 'pokedex-card'; card.setAttribute('aria-label', 'Pokédex lookup: ' + entry.name);
  const title = document.createElement('h3'); title.textContent = 'Pokédex · ' + pokemonLabel(entry);
  card.append(title, pokemonInformation(entry));
  return card;
}
