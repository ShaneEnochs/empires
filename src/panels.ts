import { discoveredPokemon } from './pokedex';
import type { PokedexEntry } from './pokedex';
import type { Game } from './game';
import type { GameState, Story } from './types';
import { encounteredPeople } from './people';
import type { PersonReference } from './people';

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
export function createPanels(story: Story, game: Game, people: readonly PersonReference[], pokedex: readonly PokedexEntry[], select: (title: string) => void) {
  const character = panel('character', 'Character', select, section => {
    const navigation = document.createElement('div');
    navigation.className = 'character-navigation';
    navigation.setAttribute('role', 'group');
    navigation.setAttribute('aria-label', 'Character sections');
    const views = ['Stats', 'Skills', 'Inventory', 'Journal'].map(title => {
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
        if (story.stats.length === 0) list(content, [], 'No character statistics configured.');
        else {
          const stats = document.createElement('dl');
          for (const { label, value } of characterStats(story, game.state)) {
            const term = document.createElement('dt'); term.textContent = label;
            const description = document.createElement('dd'); description.textContent = value;
            stats.append(term, description);
          }
          content.append(stats);
        }
      } else if (title === 'Skills') {
        list(content, game.state.skills.map(id => story.skills.find(skill => skill.id === id)!.name), 'No skills acquired yet.');
      } else if (title === 'Inventory') {
        list(content, Object.entries(game.state.inventory).map(([id, quantity]) =>
          story.items.find(item => item.id === id)!.name + ' × ' + quantity), 'No items in inventory.');
      } else {
        if (game.state.journal.length === 0) list(content, [], 'No journal entries yet.');
        const groups = new Map<string, HTMLUListElement>();
        for (const entry of game.state.journal) {
          let items = groups.get(entry.chapter);
          if (!items) {
            const chapter = document.createElement('h4'); chapter.textContent = entry.chapter;
            items = document.createElement('ul'); groups.set(entry.chapter, items);
            content.append(chapter, items);
          }
          const item = document.createElement('li'); item.textContent = entry.text; items.append(item);
        }
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
    const discovered = discoveredPokemon(pokedex, game.state);
    if (discovered.length === 0) {
      list(section, [], "You haven't encountered any Pokémon yet.");
      return;
    }
    const entries = document.createElement('ul');
    entries.className = 'pokedex-entries';
    for (const entry of discovered) {
      const item = document.createElement('li');
      const heading = document.createElement('h3'); heading.textContent = entry.name;
      const status = document.createElement('p');
      status.className = 'discovery-status'; status.textContent = `${entry.status} · ${entry.chapter}`;
      const description = document.createElement('p'); description.textContent = entry.description;
      item.append(heading, status, description); entries.append(item);
    }
    section.append(entries);
  });

  const reference = panel('people', 'People', select, section => {
    const discovered = encounteredPeople(people, game.state);
    if (discovered.length === 0) {
      list(section, [], 'No people recorded yet.');
      return;
    }
    const entries = document.createElement('ul');
    for (const person of discovered) {
      const item = document.createElement('li');
      const heading = document.createElement('h3');
      heading.textContent = person.name;
      const description = document.createElement('p');
      description.textContent = person.description;
      item.append(heading, description);
      entries.append(item);
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
  const panels = [character, party, dex, reference];
  return {
    buttons: panels.map(panel => panel.button),
    sections: panels.map(panel => panel.section),
    render(title: string): void { panels.find(panel => panel.button.textContent === title)!.render(); },
  };
}
