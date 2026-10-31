import type { Game } from './game';
import { GameSession } from './session';
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
    const heading = document.createElement('h1');
    heading.textContent = 'Empires';
    heading.tabIndex = -1;
    root.replaceChildren(heading);
    const startup = session.startup;
    if (startup.status === 'invalid' || startup.status === 'unavailable') {
      const message = document.createElement('p');
      message.textContent = startup.status === 'invalid'
        ? 'A saved game was found, but it cannot be loaded.' : 'Saved progress could not be checked.';
      const reason = document.createElement('p');
      reason.textContent = startup.message;
      root.append(message, reason);
      console.warn('Saved game unavailable:', startup.error);
    }
    const actions = document.createElement('nav');
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

    const skillsButton = document.createElement('button');
    skillsButton.type = 'button';
    skillsButton.textContent = 'Skills';
    skillsButton.setAttribute('aria-controls', 'skills');
    skillsButton.setAttribute('aria-expanded', 'false');
    const skillsSection = document.createElement('section');
    skillsSection.id = 'skills';
    skillsSection.hidden = true;
    skillsSection.setAttribute('aria-labelledby', 'skills-heading');

    function renderSkills(): void {
      const heading = document.createElement('h2');
      heading.id = 'skills-heading';
      heading.textContent = 'Skills';
      skillsSection.replaceChildren(heading);
      if (game.state.skills.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'No skills acquired yet.';
        skillsSection.append(empty);
        return;
      }
      const list = document.createElement('ul');
      for (const id of game.state.skills) {
        const item = document.createElement('li');
        item.textContent = story.skills.find(skill => skill.id === id)!.name;
        list.append(item);
      }
      skillsSection.append(list);
    }

    skillsButton.addEventListener('click', () => {
      skillsSection.hidden = !skillsSection.hidden;
      skillsButton.setAttribute('aria-expanded', String(!skillsSection.hidden));
      if (!skillsSection.hidden) renderSkills();
    });

    const inventoryButton = document.createElement('button');
    inventoryButton.type = 'button';
    inventoryButton.textContent = 'Inventory';
    inventoryButton.setAttribute('aria-controls', 'inventory');
    inventoryButton.setAttribute('aria-expanded', 'false');
    const inventorySection = document.createElement('section');
    inventorySection.id = 'inventory';
    inventorySection.hidden = true;
    inventorySection.setAttribute('aria-labelledby', 'inventory-heading');

    function renderInventory(): void {
      const heading = document.createElement('h2');
      heading.id = 'inventory-heading';
      heading.textContent = 'Inventory';
      inventorySection.replaceChildren(heading);
      const entries = Object.entries(game.state.inventory);
      if (entries.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'No items in inventory.';
        inventorySection.append(empty);
        return;
      }
      const list = document.createElement('ul');
      for (const [id, quantity] of entries) {
        const item = document.createElement('li');
        item.textContent = `${story.items.find(item => item.id === id)!.name} × ${quantity}`;
        list.append(item);
      }
      inventorySection.append(list);
    }

    inventoryButton.addEventListener('click', () => {
      inventorySection.hidden = !inventorySection.hidden;
      inventoryButton.setAttribute('aria-expanded', String(!inventorySection.hidden));
      if (!inventorySection.hidden) renderInventory();
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
            session.navigate(destinationId);
            render();
          } catch (error) {
            showError(error);
          }
        });
        actions.append(button);
      }

      for (const choice of game.availableChoices) addAction(choice.label, choice.destinationId);
      if (passage.continueTo !== undefined) addAction('Continue', passage.continueTo);

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

      root.replaceChildren(heading, ...paragraphs, actions, journalButton, skillsButton, inventoryButton, newGameButton, journalSection, skillsSection, inventorySection);
      renderJournal();
      renderSkills();
      renderInventory();
      renderNotice();
      heading.focus();
    }

    const newGameButton = document.createElement('button');
    newGameButton.type = 'button';
    newGameButton.textContent = 'New Game';
    newGameButton.addEventListener('click', startNewGame);
    render();
  }

  renderStartup();
} catch (error) {
  showError(error);
}
