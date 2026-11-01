import { storyCatalog } from './catalog';
import type { CatalogStory } from './catalog';
import { parseStory } from './story';
import { mountReader, appHeader, showError } from './reader';
import './style.css';

const root = document.querySelector<HTMLElement>('#app')!;
if (!root) throw new Error('Missing story container.');

function selectStory(entry: CatalogStory): void {
  mountReader(root, entry, parseStory(entry.source), {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  }, storyCatalog.length > 1 ? renderLibrary : undefined);
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
      try { selectStory(entry); } catch (error) { showError(root, error); }
    });
    item.append(title, description, select);
    stories.append(item);
  }
  root.replaceChildren(appHeader(), heading, introduction, stories);
  heading.focus();
}

if (storyCatalog.length === 1) {
  try { selectStory(storyCatalog[0]!); } catch (error) { showError(root, error); }
} else {
  renderLibrary();
}
