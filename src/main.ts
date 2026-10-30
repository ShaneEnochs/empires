import { Game } from './game';
import { parseStory } from './story';
import { interpolate } from './interpolate';
import exampleStory from './example.story?raw';
import './style.css';

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing story container.');
const root = container;

function showError(error: unknown): void {
  root.querySelector('[role="alert"]')?.remove();
  const message = document.createElement('p');
  message.setAttribute('role', 'alert');
  message.textContent = `Story error: ${error instanceof Error ? error.message : String(error)}`;
  root.append(message);
}

try {
  const game = new Game(parseStory(exampleStory));
  const journalButton = document.createElement('button');
  journalButton.type = 'button';
  journalButton.textContent = 'Journal';
  journalButton.setAttribute('aria-controls', 'journal');
  journalButton.setAttribute('aria-expanded', 'false');

  const journalSection = document.createElement('section');
  journalSection.id = 'journal';
  journalSection.hidden = true;
  journalSection.setAttribute('aria-labelledby', 'journal-heading');

  function renderJournal(): void {
    const heading = document.createElement('h2');
    heading.id = 'journal-heading';
    heading.textContent = 'Journal';
    journalSection.replaceChildren(heading);
    if (game.state.journal.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No journal entries yet.';
      journalSection.append(empty);
      return;
    }
    const groups = new Map<string, HTMLUListElement>();
    for (const entry of game.state.journal) {
      let list = groups.get(entry.chapter);
      if (!list) {
        const chapter = document.createElement('h3');
        chapter.textContent = entry.chapter;
        list = document.createElement('ul');
        groups.set(entry.chapter, list);
        journalSection.append(chapter, list);
      }
      const item = document.createElement('li');
      item.textContent = entry.text;
      list.append(item);
    }
  }

  journalButton.addEventListener('click', () => {
    journalSection.hidden = !journalSection.hidden;
    journalButton.setAttribute('aria-expanded', String(!journalSection.hidden));
    if (!journalSection.hidden) renderJournal();
  });

  function render(): void {
    const passage = game.passage;
    const heading = document.createElement('h1');
    heading.textContent = passage.title;
    heading.tabIndex = -1;

    const paragraphs = game.visibleParagraphs.map(({ text }) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = interpolate(text, game.state.variables);
      return paragraph;
    });

    const actions = document.createElement('nav');
    actions.setAttribute('aria-label', 'Passage actions');

    function addAction(label: string, destinationId: string): void {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => {
        try {
          game.navigate(destinationId);
          render();
        } catch (error) {
          showError(error);
        }
      });
      actions.append(button);
    }

    for (const choice of game.availableChoices) addAction(choice.label, choice.destinationId);
    if (passage.continueTo !== undefined) addAction('Continue', passage.continueTo);

    root.replaceChildren(heading, ...paragraphs, actions, journalButton, journalSection);
    renderJournal();
    heading.focus();
  }

  render();
} catch (error) {
  showError(error);
}
