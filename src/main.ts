import type { Game } from './game';
import { GameSession } from './session';
import { createPanels } from './panels';
import { parseStory } from './story';
import { interpolate } from './interpolate';
import exampleStory from './example.story?raw';
import './style.css';

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing story container.');
const root = container;

function showError(error: unknown): void {
  root.querySelector('#story-error')?.remove();
  const message = document.createElement('p');
  message.setAttribute('role', 'alert');
  message.id = 'story-error';
  message.textContent = `Story error: ${error instanceof Error ? error.message : String(error)}`;
  root.append(message);
}

try {
  const story = parseStory(exampleStory);
  const session = new GameSession(story, {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  });
  let reportedNotice: unknown;

  function renderNotice(): void {
    root.querySelector('#save-status')?.remove();
    const notice = session.notice;
    if (notice === undefined && !session.canPlayWithoutSaving) return;
    const section = document.createElement('section');
    section.id = 'save-status';
    if (notice !== undefined) {
      const message = document.createElement('p');
      message.setAttribute('role', 'alert');
      message.textContent = notice.message;
      section.append(message);
      if (notice.error !== undefined && reportedNotice !== notice) {
        console.warn('Checkpoint persistence:', notice.error);
        reportedNotice = notice;
      }
    }
    if (session.canPlayWithoutSaving) {
      const play = document.createElement('button');
      play.type = 'button';
      play.textContent = 'Play without saving';
      play.addEventListener('click', () => {
        const result = session.playWithoutSaving(() => window.confirm('Play a new game without saving? Progress will be lost when this page closes. Existing saved progress will not be changed.'));
        if (result === 'started') showGameplay(session.game!);
        else if (result === 'failed') renderNotice();
      });
      section.append(play);
    }
    root.append(section);
  }

  function startNewGame(): void {
    const result = session.newGame(() => window.confirm('Start a new game? This will replace your existing saved progress.'));
    if (result === 'started') showGameplay(session.game!);
    else if (result === 'failed') renderNotice();
  }

  function renderStartup(): void {
    root.className = 'startup';
    const heading = document.createElement('h1');
    heading.textContent = 'Empires';
    heading.tabIndex = -1;
    root.replaceChildren(heading);
    const startup = session.startup;
    if (startup.status === 'invalid' || startup.status === 'unavailable') {
      const message = document.createElement('p');
      message.className = 'startup-message';
      message.textContent = startup.status === 'invalid'
        ? 'A saved game was found, but it cannot be loaded.' : 'Saved progress could not be checked.';
      const reason = document.createElement('p');
      reason.textContent = startup.message;
      root.append(message, reason);
      console.warn('Saved game unavailable:', startup.error);
    }
    const actions = document.createElement('nav');
    actions.className = 'startup-actions';
    actions.setAttribute('aria-label', 'Game startup');
    if (startup.status === 'ready') {
      const resume = document.createElement('button');
      resume.type = 'button';
      resume.textContent = 'Continue Game';
      resume.addEventListener('click', () => showGameplay(session.continueGame()));
      actions.append(resume);
    }
    const start = document.createElement('button');
    start.type = 'button';
    start.textContent = 'New Game';
    start.addEventListener('click', startNewGame);
    actions.append(start);
    root.append(actions);
    renderNotice();
    heading.focus();
  }

  function showGameplay(game: Game): void {
    const panels = createPanels(story, game);

    function render(): void {
      const passage = game.passage;
      root.className = passage.death ? 'reading death' : 'reading';
      const heading = document.createElement('h1');
      heading.textContent = passage.title;
      heading.tabIndex = -1;

      const paragraphs = game.visibleParagraphs.map(({ text }) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = interpolate(text, game.state.variables);
        return paragraph;
      });

      const actions = document.createElement('nav');
      actions.className = 'passage-actions';
      actions.setAttribute('aria-label', 'Passage actions');

      function addAction(label: string, action: () => void): void {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.addEventListener('click', () => {
          try {
            action();
            render();
          } catch (error) {
            showError(error);
          }
        });
        actions.append(button);
      }

      if (passage.death) {
        addAction('Try Again', () => session.retryAfterDeath());
      } else {
        for (const choice of game.availableChoices) addAction(choice.label, () => session.navigate(choice.destinationId));
        const destination = passage.continueTo;
        if (destination !== undefined) addAction('Continue', () => session.navigate(destination));
      }

      if (passage.textInput !== undefined) {
        const action = passage.textInput;
        const form = document.createElement('form');
        form.setAttribute('aria-label', 'Text input');
        form.noValidate = true;
        const label = document.createElement('label');
        label.htmlFor = 'player-text';
        label.textContent = action.label;
        const input = document.createElement('input');
        input.id = 'player-text';
        input.type = 'text';
        input.required = true;
        // Native maxLength counts UTF-16 units; Game validates Unicode code points.
        input.value = String(game.state.variables[action.variable]);
        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.textContent = 'Continue';
        form.addEventListener('submit', event => {
          event.preventDefault();
          try {
            session.submitText(input.value);
            render();
          } catch (error) {
            input.setAttribute('aria-invalid', 'true');
            input.setAttribute('aria-describedby', 'story-error');
            showError(error);
            input.focus();
          }
        });
        form.append(label, input, submit);
        actions.append(form);
      }

      root.replaceChildren(heading, ...paragraphs, actions, utilities, ...panels.sections);
      panels.render();
      renderNotice();
      heading.focus();
    }

    const newGameButton = document.createElement('button');
    newGameButton.type = 'button';
    newGameButton.textContent = 'New Game';
    newGameButton.addEventListener('click', startNewGame);
    const utilities = document.createElement('div');
    utilities.className = 'utility-controls';
    utilities.setAttribute('role', 'group');
    utilities.setAttribute('aria-label', 'Game tools');
    utilities.append(...panels.buttons, newGameButton);
    render();
  }

  renderStartup();
} catch (error) {
  showError(error);
}
