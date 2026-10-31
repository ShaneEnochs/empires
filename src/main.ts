import type { Game } from './game';
import { GameSession } from './session';
import { storyCatalog } from './catalog';
import type { CatalogStory } from './catalog';
import { createPanels } from './panels';
import { parseStory } from './story';
import { interpolate } from './interpolate';
import { validatePeople } from './people';
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
  (root.querySelector('#story-content') ?? root).append(message);
}

function appHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'app-header';
  const brand = document.createElement('p');
  brand.className = 'brand';
  brand.textContent = 'Empires';
  header.append(brand);
  return header;
}

function selectStory(entry: CatalogStory): void {
  const story = parseStory(entry.source);
  const people = validatePeople(story, entry.people);
  const session = new GameSession(story, {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  }, entry.identity);
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
    root.insertBefore(section, root.querySelector('.reading-header')?.nextSibling ?? null);
  }

  function startNewGame(): void {
    const result = session.newGame(() => window.confirm('Start a new game? This will replace your existing saved progress.'));
    if (result === 'started') showGameplay(session.game!);
    else if (result === 'failed') renderNotice();
  }

  function renderStartup(): void {
    root.className = 'startup';
    const heading = document.createElement('h1');
    heading.textContent = entry.title;
    heading.tabIndex = -1;
    root.replaceChildren(appHeader(), heading);
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
    const back = document.createElement('button');
    back.type = 'button';
    back.textContent = 'Back to Stories';
    back.addEventListener('click', renderLibrary);
    actions.append(back);
    root.append(actions);
    renderNotice();
    heading.focus();
  }

  function showGameplay(game: Game): void {
    const storyContent = document.createElement('section');
    storyContent.id = 'story-content';
    storyContent.setAttribute('aria-labelledby', 'passage-heading');
    const storyButton = document.createElement('button');
    storyButton.type = 'button';
    storyButton.textContent = 'Story';
    storyButton.setAttribute('aria-controls', 'story-content');
    storyButton.addEventListener('click', () => selectView('Story'));
    const panels = createPanels(story, game, people, selectView);
    const navigation = document.createElement('nav');
    navigation.className = 'view-navigation';
    navigation.setAttribute('aria-label', 'Reading views');
    navigation.append(storyButton, ...panels.buttons);
    const chapter = document.createElement('p');
    chapter.className = 'chapter-label';
    const header = document.createElement('header');
    header.className = 'reading-header';
    header.append(navigation, chapter);
    function selectView(name: string): void {
      storyContent.hidden = name !== 'Story';
      storyButton.setAttribute('aria-pressed', String(name === 'Story'));
      for (let index = 0; index < panels.sections.length; index++) {
        const section = panels.sections[index]!;
        const active = panels.buttons[index]!.textContent === name;
        section.hidden = !active;
        panels.buttons[index]!.setAttribute('aria-pressed', String(active));
        if (active) {
          panels.render(name);
          const back = document.createElement('button');
          back.type = 'button';
          back.textContent = 'Return to Story';
          back.addEventListener('click', () => selectView('Story'));
          section.append(back);
          section.querySelector<HTMLElement>('h2')!.focus();
        }
      }
      if (name === 'Story') storyContent.querySelector<HTMLElement>('h1')!.focus();
    }

    function render(): void {
      const passage = game.passage;
      root.className = passage.death ? 'reading death' : 'reading';
      const heading = document.createElement('h1');
      heading.id = 'passage-heading';
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

      function addAction(label: string, action: () => void): HTMLButtonElement {
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
        return button;
      }

      if (passage.death) {
        addAction('Try Again', () => session.retryAfterDeath());
      } else {
        const choices = game.availableChoices;
        if (choices.length > 0) {
          const group = document.createElement('fieldset');
          group.className = 'choices';
          const legend = document.createElement('legend');
          legend.className = 'visually-hidden';
          legend.textContent = 'Choose an action';
          group.append(legend);
          let selected: typeof choices[number] | undefined;
          const next = addAction('Next', () => {
            if (selected !== undefined) session.navigate(selected.destinationId);
          });
          next.disabled = true;
          for (const [index, choice] of choices.entries()) {
            const row = document.createElement('label');
            row.className = 'choice-row';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'passage-choice';
            // Use the option index: distinct authored choices may share a destination.
            radio.value = String(index);
            radio.addEventListener('change', () => {
              selected = choice;
              next.disabled = false;
            });
            const text = document.createElement('span');
            text.textContent = choice.label;
            row.append(radio, text);
            group.append(row);
          }
          actions.prepend(group);
        }
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

      chapter.textContent = passage.chapter;
      storyContent.replaceChildren(heading, ...paragraphs, actions);
      root.replaceChildren(header, storyContent, ...panels.sections, utilities);
      selectView('Story');
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
    utilities.append(newGameButton);
    render();
  }

  renderStartup();
}

function renderLibrary(): void {
  root.className = 'startup';
  const heading = document.createElement('h1');
  heading.textContent = 'Your next story';
  heading.tabIndex = -1;
  const introduction = document.createElement('p');
  introduction.textContent = 'Choose a story.';
  const stories = document.createElement('ul');
  stories.className = 'story-library';
  for (const entry of storyCatalog) {
    const item = document.createElement('li');
    const title = document.createElement('h2');
    title.textContent = entry.title;
    const description = document.createElement('p');
    description.textContent = entry.description;
    const select = document.createElement('button');
    select.type = 'button';
    select.textContent = 'Select ' + entry.title;
    select.addEventListener('click', () => {
      try { selectStory(entry); } catch (error) { showError(error); }
    });
    item.append(title, description, select);
    stories.append(item);
  }
  root.replaceChildren(appHeader(), heading, introduction, stories);
  heading.focus();
}

renderLibrary();
