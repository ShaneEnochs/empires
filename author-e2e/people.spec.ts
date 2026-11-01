import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const story = readFileSync('tools/notepadpp/starter.story');
const metadata = readFileSync('tools/notepadpp/starter.people.json', 'utf8');

test('optional People files validate, replace, discover and recover without public storage', async ({ page }) => {
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem', 'removeItem']) Object.defineProperty(Storage.prototype, method, {
      value() { throw new Error('Preview must not access public storage'); },
    });
  });
  await page.goto('/author.html');
  const people = page.getByLabel('Open optional .people.json file');
  const upload = (text: string) => people.setInputFiles({ name: 'draft.people.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await upload(metadata);
  await page.getByLabel('Open a .story file').setInputFiles({ name: 'draft.story', mimeType: 'text/plain', buffer: story });
  const start = () => page.getByRole('button', { name: 'New Game', exact: true }).click();
  await start();
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await expect(page.getByRole('region', { name: 'People', exact: true })).toContainText('No people recorded yet.');
  await page.getByRole('button', { name: 'Story', exact: true }).click();
  await page.getByRole('radio', { name: 'Listen to the ferryman', exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await expect(page.getByRole('region', { name: 'People', exact: true })).toContainText('The ferryman');
  await page.getByRole('button', { name: 'Restart preview', exact: true }).click(); await start();
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await expect(page.getByRole('region', { name: 'People', exact: true })).toContainText('No people recorded yet.');
  for (const [text, error] of [ ['{', 'Could not open People'],
    ['{}', 'JSON array'], [JSON.stringify([JSON.parse(metadata)[0], JSON.parse(metadata)[0]]), 'duplicate'],
    [metadata.replace('met_ferryman', 'unknown_event'), 'unknown journal event'] ]) {
    await upload(text!); await expect(page.getByRole('status')).toContainText(error!);
    await expect(page.locator('#app')).toBeEmpty();
    await expect(page.getByRole('button', { name: 'Restart preview', exact: true })).toBeDisabled();
  }
  await upload(metadata.replace('The ferryman', 'A revised ferryman')); await start();
  await page.getByRole('radio', { name: 'Listen to the ferryman', exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await expect(page.getByRole('region', { name: 'People', exact: true })).toContainText('A revised ferryman');
  await page.getByRole('button', { name: 'Clear People file', exact: true }).click(); await start();
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await expect(page.getByRole('region', { name: 'People', exact: true })).toContainText('No people recorded yet.');
});

test('Notepad++ XML files are well-formed and expose language and completions', async ({ page }) => {
  for (const file of ['Empires-udl.xml', 'Empires.xml']) {
    const source = readFileSync('tools/notepadpp/' + file, 'utf8');
    const result = await page.evaluate(source => {
      const xml = new DOMParser().parseFromString(source, 'application/xml');
      return { errors: xml.querySelectorAll('parsererror').length, root: xml.documentElement.tagName };
    }, source);
    expect(result).toEqual({ errors: 0, root: 'NotepadPlus' });
  }
});

test('People selected first can be repaired after story-event mismatch', async ({ page }) => {
  await page.goto('/author.html');
  const people = page.getByLabel('Open optional .people.json file');
  const upload = (text: string) => people.setInputFiles({ name: 'draft.people.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await upload(metadata.replace('met_ferryman', 'unknown_event'));
  await page.getByLabel('Open a .story file').setInputFiles({ name: 'draft.story', mimeType: 'text/plain', buffer: story });
  await expect(page.getByRole('status')).toContainText('unknown journal event');
  await expect(page.locator('#app')).toBeEmpty();
  await upload(metadata);
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await expect(page.locator('#passage-heading')).toHaveText('At the Landing');
});
