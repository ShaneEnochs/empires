import type { Game } from './game';
import type { GameState, Story } from './types';

/** A fresh presentation of committed variables; no values are cached in UI state. */
export function characterStats(story: Story, state: GameState): { label: string; value: string }[] {
  return story.stats.map(({ variable, label }) => {
    const value = state.variables[variable];
    return { label, value: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value) };
  });
}

function panel(id: string, title: string, renderContent: (section: HTMLElement) => void) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = title;
  button.setAttribute('aria-controls', id);
  button.setAttribute('aria-expanded', 'false');
  const section = document.createElement('section');
  section.className = 'info-panel';
  section.id = id;
  section.hidden = true;
  section.setAttribute('aria-labelledby', id + '-heading');

  function render(): void {
    const heading = document.createElement('h2');
    heading.id = id + '-heading';
    heading.textContent = title;
    section.replaceChildren(heading);
    renderContent(section);
  }

  button.addEventListener('click', () => {
    section.hidden = !section.hidden;
    button.setAttribute('aria-expanded', String(!section.hidden));
    if (!section.hidden) render();
  });
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

/** The four fixed read-only panels; passage actions and focus stay in main.ts. */
export function createPanels(story: Story, game: Game) {
  const character = panel('character', 'Character', section => {
    if (story.stats.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No character statistics configured.';
      section.append(empty);
      return;
    }
    const stats = document.createElement('dl');
    for (const { label, value } of characterStats(story, game.state)) {
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');
      description.textContent = value;
      stats.append(term, description);
    }
    section.append(stats);
  });

  const journal = panel('journal', 'Journal', section => {
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

  const skills = panel('skills', 'Skills', section => {
    list(section, game.state.skills.map(id => story.skills.find(skill => skill.id === id)!.name),
      'No skills acquired yet.');
  });

  const inventory = panel('inventory', 'Inventory', section => {
    list(section, Object.entries(game.state.inventory).map(([id, quantity]) =>
      story.items.find(item => item.id === id)!.name + ' × ' + quantity),
      'No items in inventory.');
  });

  const panels = [character, journal, skills, inventory];
  return {
    buttons: panels.map(panel => panel.button),
    sections: panels.map(panel => panel.section),
    render(): void { for (const panel of panels) panel.render(); },
  };
}
