import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const docs = readFileSync('docs/SCRIPTING.md', 'utf8');
const source = docs.split('<!-- pronoun-template -->')[1]!.split('```text\n')[1]!.split('```')[0]!;
for (const [label, subject, possessive, verb] of [
  ['He / him', 'He', 'His', 'is'], ['She / her', 'She', 'Her', 'is'], ['They / them', 'They', 'Their', 'are'],
]) test('pronoun template renders safely in isolated preview: ' + label, async ({ page }) => {
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem', 'removeItem']) Object.defineProperty(Storage.prototype, method, {
      value() { throw Error('Preview must not access public storage'); },
    });
  });
  await page.goto('/author.html');
  await page.getByLabel('Open a .story file').setInputFiles({ name: 'pronouns.story', mimeType: 'text/plain', buffer: Buffer.from(source) });
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await page.getByRole('radio', { name: label, exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('#story-content')).toContainText(`${subject} ${verb} ready to begin.`);
  await page.getByRole('button', { name: 'Journal', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Journal', exact: true })).toContainText(`${possessive} journey began at the gate.`);
});
