import { titlePage } from './fixtures/title-page';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { choose, crisisKey, expectPassage, openPanel, returnToStory, expectStartup, startGame, recordedState } from './helpers';

// People metadata remains validated and journal-derived even with its tab hidden.
const people: { name: string; discoveryEvents: string[] }[] =
  JSON.parse(readFileSync('content/harbor-practice.people.json', 'utf8'));
async function knownPeople(page: import('@playwright/test').Page): Promise<string[]> {
  const journal = (await recordedState(page)).journal;
  const ids = new Set(journal.map(event => event.id));
  return people.filter(person => person.discoveryEvents.some(id => ids.has(id))).map(person => person.name);
}

test('Character exposes only Stats and Inventory while other data remains stored', async ({ page }) => {
  await startGame(page);
  const character = await openPanel(page, 'Character');
  await expect(character.getByRole('group', { name: 'Character sections' }).getByRole('button')).toHaveText(['Stats', 'Inventory']);
  await expect(character.getByRole('button', { name: 'Stats', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const inventory = await openPanel(page, 'Inventory');
  await expect(inventory.getByRole('listitem')).toHaveText(['Dispatch Coin × 4', 'Emergency Writ × 1']);
  await expect(page.getByRole('button', { name: 'People', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Skills', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Journal', exact: true })).toHaveCount(0);
  expect((await recordedState(page)).skills).toEqual(['commission']);
});

test('People discovery remains journal-derived through recovery without a visible People tab', async ({ page }) => {
  await startGame(page);
  await expect(knownPeople(page)).resolves.toEqual([]);
  await choose(page, 'Keep the name Mara Vale and begin');
  await choose(page, 'You surveyed these river channels');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  expect(await knownPeople(page)).toEqual(['The customs keeper']);
  await choose(page, 'Investigate the mill accounts');
  expect(await knownPeople(page)).toEqual(['The customs keeper']);
  await choose(page, 'Pay two coins for attested accounts');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await choose(page, "Pay one coin for a pilot's soundings");
  expect(await knownPeople(page)).toEqual(['The customs keeper', 'The mill clerk', 'The pilot']);
  await page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key)!);
    if (saved.currentState.passageId !== 'hired_pilot') throw Error('Expected committed pilot progress');
    delete saved.currentState; saved.formatVersion = 6;
    localStorage.setItem(key, JSON.stringify(saved));
  }, crisisKey);
  await page.reload();
  await expectStartup(page);
  await page.getByRole('button', { name: titlePage.continueGameLabel, exact: true }).click();
  await expectPassage(page, 'Six Sacks and a Day');
  expect(await knownPeople(page)).toEqual(['The customs keeper']);
  await choose(page, 'Investigate the mill accounts');
  await choose(page, 'Pay two coins for attested accounts');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await choose(page, 'Enter the unshored sluice chamber despite the warning');
  expect(await knownPeople(page)).toEqual(['The customs keeper', 'The mill clerk']);
  await page.getByRole('button', { name: 'Try Again', exact: true }).click();
  await expectPassage(page, 'Six Sacks and a Day');
  expect(await knownPeople(page)).toEqual(['The customs keeper']);
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
});
