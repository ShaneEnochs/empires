import { parseStory } from './story';
import type { Passage, Story } from './types';
import { mountReader } from './reader';
import './style.css';
import './author.css';

if (!import.meta.env.DEV) throw new Error('Author preview is available only on the development server.');
const tools = document.querySelector<HTMLElement>('#author-tools')!;
const reader = document.querySelector<HTMLElement>('#app')!;
tools.className = 'author-tools';
const title = document.createElement('h1');
title.textContent = 'Local story preview';
const note = document.createElement('p');
note.textContent = 'Files stay in this browser. Save edits in VS Code, then select the file again. Preview progress is temporary. People requires separate catalog metadata.';
const label = document.createElement('label');
label.textContent = 'Open a .story file';
const file = document.createElement('input');
file.type = 'file'; file.accept = '.story'; label.append(file);
const status = document.createElement('p');
status.setAttribute('role', 'status');
const restart = document.createElement('button');
restart.textContent = 'Restart preview'; restart.disabled = true;
const searchLabel = document.createElement('label');
searchLabel.textContent = 'Find passage by ID or title';
const search = document.createElement('input');
search.type = 'search'; search.disabled = true; searchLabel.append(search);
const index = document.createElement('ul');
index.setAttribute('aria-label', 'Passage index');
const detail = document.createElement('section');
detail.setAttribute('aria-label', 'Passage reference');
let story: Story | undefined;
let filename = '';
let selection = 0;
function start(): void {
  if (!story) return;
  // A fresh private slot for each restart; never consult browser storage.
  const records = new Map<string, string>();
  mountReader(reader, { title: filename, identity: { storyId: 'author-preview', storyRevision: 1 }, people: [] }, story, {
    getItem: key => records.get(key) ?? null,
    setItem: (key, value) => { records.set(key, value); },
  });
}
function referenceText(passage: Passage): string {
  const destinations = [...passage.choices.map(choice => choice.destinationId),
        ...(passage.continueTo === undefined ? [] : [passage.continueTo]),
        ...(passage.textInput === undefined ? [] : [passage.textInput.destinationId])];
  return `ID: ${passage.id}. Chapter: ${passage.chapter}. Destinations: ${destinations.join(', ') || 'None'}.`;
}
function renderIndex(): void {
  index.replaceChildren();
  if (!story) return;
  const query = search.value.toLowerCase();
  for (const passage of story.passages) {
    if (!passage.id.toLowerCase().includes(query) && !passage.title.toLowerCase().includes(query)) continue;
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.textContent = `${passage.id}: ${passage.title}`;
    button.addEventListener('click', () => {
      const heading = document.createElement('h2'); heading.textContent = passage.title;
      const info = document.createElement('p');
      info.textContent = referenceText(passage);
      detail.replaceChildren(heading, info);
    });
    const summary = document.createElement('p'); summary.textContent = referenceText(passage);
    item.append(button, summary); index.append(item);
  }
}
file.addEventListener('change', async () => {
  const selected = file.files?.[0];
  file.value = ''; // Allow reselecting the same path after an external edit.
  if (!selected) return;
  const version = ++selection;
  story = undefined; restart.disabled = true; search.disabled = true;
  reader.replaceChildren(); index.replaceChildren(); detail.replaceChildren(); search.value = '';
  status.textContent = 'Reading file…';
  try {
    if (!selected.name.endsWith('.story')) throw new Error('Select a .story file.');
    const source = new TextDecoder('utf-8', { fatal: true }).decode(await selected.arrayBuffer());
    if (version !== selection) return;
    story = parseStory(source); filename = selected.name;
    status.textContent = `Loaded ${filename}: ${story.passages.length} passages. Run preflight for bounded route analysis.`;
    restart.disabled = false; search.disabled = false; renderIndex(); start();
  } catch (error) {
    if (version !== selection) return;
    status.textContent = `Could not open story: ${error instanceof Error ? error.message : String(error)}`;
  }
});
restart.addEventListener('click', start);
search.addEventListener('input', renderIndex);
tools.append(title, note, label, status, restart, searchLabel, index, detail);
