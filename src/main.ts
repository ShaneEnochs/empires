import { Game } from './game';
import { parseStory } from './story';
import exampleStory from './example.story?raw';
import './style.css';

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing story container.');
const root = container;

try {
  const game = new Game(parseStory(exampleStory));

  function render(): void {
    const passage = game.passage;
    const heading = document.createElement('h1');
    heading.textContent = passage.title;
    heading.tabIndex = -1;

    const paragraphs = passage.text.map(text => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    });

    const actions = document.createElement('nav');
    actions.setAttribute('aria-label', 'Passage actions');

    function addAction(label: string, destinationId: string): void {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => {
        game.navigate(destinationId);
        render();
      });
      actions.append(button);
    }

    for (const choice of passage.choices) addAction(choice.label, choice.destinationId);
    if (passage.continueTo !== undefined) addAction('Continue', passage.continueTo);

    root.replaceChildren(heading, ...paragraphs, actions);
    heading.focus();
  }

  render();
} catch (error) {
  const message = document.createElement('p');
  message.setAttribute('role', 'alert');
  message.textContent = `Unable to start story: ${error instanceof Error ? error.message : String(error)}`;
  root.replaceChildren(message);
}
