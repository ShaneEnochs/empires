import { pokemonInformation } from './pokedex-view';
import { discoveredPokemon, pokedexInstalled, pokemonLabel } from './pokedex';
import type { PokedexEntry } from './pokedex';
import type { Game } from './game';
import type { GameState, Story } from './types';

/** A fresh presentation of committed variables; no values are cached in UI state. */
export function characterStats(story: Story, state: GameState): { label: string; value: string }[] {
  return story.stats.map(({ variable, label }) => {
    const value = state.variables[variable];
    return { label, value: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value) };
  });
}

function panel(id: string, title: string, select: (title: string) => void, renderContent: (section: HTMLElement) => void) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = title;
  button.setAttribute('aria-controls', id);
  button.setAttribute('aria-pressed', 'false');
  const section = document.createElement('section');
  section.className = 'info-panel';
  section.id = id;
  section.hidden = true;
  section.setAttribute('aria-labelledby', id + '-heading');

  function render(): void {
    const heading = document.createElement('h2');
    heading.id = id + '-heading';
    heading.textContent = title;
    heading.tabIndex = -1;
    section.replaceChildren(heading);
    renderContent(section);
  }

  button.addEventListener('click', () => select(title));
  return { button, section, render };
}

function list(section: HTMLElement, entries: readonly string[], emptyText: string): void {
  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = emptyText;
    section.append(empty);
    return;
  }
  const items = document.createElement('ul');
  for (const text of entries) {
    const item = document.createElement('li');
    item.textContent = text;
    items.append(item);
  }
  section.append(items);
}

/** Read-only information views; gameplay actions remain in the shared reader. */
export function createPanels(story: Story, game: Game, pokedex: readonly PokedexEntry[], select: (title: string) => void) {
  const character = panel('character', 'Character', select, section => {
    const navigation = document.createElement('div');
    navigation.className = 'character-navigation';
    navigation.setAttribute('role', 'group');
    navigation.setAttribute('aria-label', 'Character sections');
    const views = ['Stats', 'Inventory'].map(title => {
      const id = title.toLowerCase();
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = title;
      button.setAttribute('aria-controls', 'character-' + id);
      const content = document.createElement('section');
      content.id = 'character-' + id;
      content.setAttribute('aria-labelledby', id + '-heading');
      const heading = document.createElement('h3');
      heading.id = id + '-heading';
      heading.textContent = title;
      heading.tabIndex = -1;
      content.append(heading);
      if (title === 'Stats') {
        if (story.stats.length === 0) list(content, [], 'No character information recorded yet.');
        else {
          const stats = document.createElement('dl');
          for (const { label, value } of characterStats(story, game.state)) {
            const term = document.createElement('dt'); term.textContent = label;
            const description = document.createElement('dd'); description.textContent = value;
            stats.append(term, description);
          }
          content.append(stats);
        }
      } else if (title === 'Inventory') {
        list(content, Object.entries(game.state.inventory).map(([id, quantity]) =>
          story.items.find(item => item.id === id)!.name + ' × ' + quantity), 'No items in inventory.');
      }
      button.addEventListener('click', () => {
        show(title);
        heading.focus();
      });
      return { title, button, content };
    });
    function show(title: string): void {
      for (const view of views) {
        view.button.setAttribute('aria-pressed', String(view.title === title));
        view.content.hidden = view.title !== title;
      }
    }
    navigation.append(...views.map(view => view.button));
    section.append(navigation, ...views.map(view => view.content));
    show('Stats');
  });

  const dex = panel('pokedex', 'Pokédex', select, section => {
    if (!pokedexInstalled(game.state)) {
      list(section, [], 'Pokédex access is not available yet.');
      return;
    }
    const discovered = discoveredPokemon(pokedex, game.state);
    if (discovered.length === 0) {
      list(section, [], "No Pokémon recorded yet.");
      return;
    }
    const entries = document.createElement('ul');
    entries.className = 'pokedex-entries';
    for (const entry of discovered) {
      const item = document.createElement('li');
      const details = document.createElement('details');
      const summary = document.createElement('summary'); summary.textContent = pokemonLabel(entry);
      details.append(summary, pokemonInformation(entry)); item.append(details); entries.append(item);
    }
    section.append(entries);
  });

  const party = panel('party', 'Party', select, section => {
    const heading = document.createElement('h3');
    heading.textContent = 'Your Pokémon';
    const count = document.createElement('p');
    count.textContent = `${game.state.party.length} / 6`;
    section.append(heading, count);
    if (game.state.party.length === 0) {
      list(section, [], "You haven't partnered with any Pokémon yet.");
    } else {
      const members = document.createElement('ol');
      for (const member of game.state.party) {
        const item = document.createElement('li');
        item.textContent = member.nickname ? `${member.nickname} (${member.species})` : member.species;
        members.append(item);
      }
      section.append(members);
    }
  });
  const panels = [character, party, dex];
  return {
    buttons: panels.map(panel => panel.button),
    sections: panels.map(panel => panel.section),
    render(title: string): void { panels.find(panel => panel.button.textContent === title)!.render(); },
  };
}
