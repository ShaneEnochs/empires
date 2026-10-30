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

  function render(): void {
    const passage = game.passage;
    const heading = document.createElement('h1');
    heading.textContent = passage.title;
    heading.tabIndex = -1;

    const paragraphs = passage.text.map(text => {
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

    root.replaceChildren(heading, ...paragraphs, actions);
    heading.focus();
  }

  render();
} catch (error) {
  showError(error);
}
