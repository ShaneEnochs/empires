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

/** The three fixed read-only views; passage actions and focus stay in main.ts. */
export function createPanels(story: Story, game: Game, people: readonly PersonReference[], select: (title: string) => void) {
  const character = panel('character', 'Character', select, section => {
    const statistics = document.createElement('section');
    statistics.setAttribute('aria-labelledby', 'statistics-heading');
    const heading = document.createElement('h3');
    heading.id = 'statistics-heading';
    heading.textContent = 'Character Statistics';
    statistics.append(heading);
    if (story.stats.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No character statistics configured.';
      statistics.append(empty);
    } else {
      const stats = document.createElement('dl');
      for (const { label, value } of characterStats(story, game.state)) {
        const term = document.createElement('dt');
        term.textContent = label;
        const description = document.createElement('dd');
        description.textContent = value;
        stats.append(term, description);
      }
      statistics.append(stats);
    }
    section.append(statistics);
    for (const [id, title, entries, empty] of [
      ['skills', 'Skills', game.state.skills.map(id => story.skills.find(skill => skill.id === id)!.name), 'No skills acquired yet.'],
      ['inventory', 'Inventory', Object.entries(game.state.inventory).map(([id, quantity]) =>
        story.items.find(item => item.id === id)!.name + ' × ' + quantity), 'No items in inventory.'],
    ] as const) {
      const group = document.createElement('section');
      group.setAttribute('aria-labelledby', id + '-heading');
      const heading = document.createElement('h3');
      heading.id = id + '-heading';
      heading.textContent = title;
      group.append(heading);
      list(group, entries, empty);
      section.append(group);
    }
  });

  const journal = panel('journal', 'Journal', select, section => {
    if (game.state.journal.length === 0) {
      list(section, [], 'No journal entries yet.');
      return;
    }
    const groups = new Map<string, HTMLUListElement>();
    for (const entry of game.state.journal) {
      let items = groups.get(entry.chapter);
      if (!items) {
        const chapter = document.createElement('h3');
        chapter.textContent = entry.chapter;
        items = document.createElement('ul');
        groups.set(entry.chapter, items);
        section.append(chapter, items);
      }
      const item = document.createElement('li');
      item.textContent = entry.text;
      items.append(item);
    }
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

  const panels = [character, journal, reference];
  return {
    buttons: panels.map(panel => panel.button),
    sections: panels.map(panel => panel.section),
    render(title: string): void { panels.find(panel => panel.button.textContent === title)!.render(); },
  };
}
