import { titlePage } from './fixtures/title-page';
import { expect, test } from '@playwright/test';
import { choose, crisisKey, expectPassage, openPanel, returnToStory, expectStartup, startGame } from './helpers';

test('Character defaults to Stats and exposes separate Skills, Inventory and grouped Journal', async ({ page }) => {
  await startGame(page);
  const character = await openPanel(page, 'Character');
  await expect(character.getByRole('group', { name: 'Character sections' }).getByRole('button')).toHaveText(['Stats', 'Skills', 'Inventory', 'Journal']);
  await expect(character.getByRole('button', { name: 'Stats', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(character.getByRole('heading', { level: 3 })).toHaveText(['Stats']);
  const skills = await openPanel(page, 'Skills');
  await expect(skills.getByRole('listitem')).toHaveText(['Rescue Training']);
  const inventory = await openPanel(page, 'Inventory');
  await expect(inventory.getByRole('listitem')).toHaveText(['Dispatch Coin × 4', 'Emergency Writ × 1']);
  const journal = await openPanel(page, 'Journal');
  await expect(journal.getByRole('listitem')).toHaveText(['The last ferry reached Bellwether before the river closed.']);
  await expect(journal.getByRole('heading', { level: 4 })).toHaveText(['The Writ']);
  await expect(skills).toBeHidden();
  await expect(inventory).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Reading views' }).getByRole('button', { name: 'Journal', exact: true })).toHaveCount(0);
});

test('Provincial references wait for recording and checkpoint recovery removes later encounters', async ({ page }) => {
  await startGame(page);
  await openPanel(page, 'People');
  await expect(page.getByText('No people recorded yet.', { exact: true })).toBeVisible();
  await returnToStory(page);
  await choose(page, 'Keep the name Mara Vale and begin');
  await choose(page, 'You surveyed these river channels');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  let people = await openPanel(page, 'People');
  await expect(people.getByRole('heading', { level: 3 })).toHaveText(['The customs keeper']);
  await returnToStory(page);
  await choose(page, 'Investigate the mill accounts');
  people = await openPanel(page, 'People');
  // The clerk is in this passage's prose, but there is no encounter event yet.
  await expect(people.getByRole('heading', { level: 3 })).toHaveText(['The customs keeper']);
  await returnToStory(page);
  await choose(page, 'Pay two coins for attested accounts');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await choose(page, "Pay one coin for a pilot's soundings");
  people = await openPanel(page, 'People');
  await expect(people.getByRole('heading', { level: 3 })).toHaveText(['The customs keeper', 'The mill clerk', 'The pilot']);
  await expect(people.getByText('The grain merchant', { exact: true })).toHaveCount(0);
  await expect(people.getByText('The guard captain', { exact: true })).toHaveCount(0);
  await returnToStory(page);
  // A legacy checkpoint-only record must still return before later encounters.
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
  people = await openPanel(page, 'People');
  await expect(people.getByRole('heading', { level: 3 })).toHaveText(['The customs keeper']);
  await returnToStory(page);
  await choose(page, 'Investigate the mill accounts');
  await choose(page, 'Pay two coins for attested accounts');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await choose(page, 'Enter the unshored sluice chamber despite the warning');
  people = await openPanel(page, 'People');
  await expect(people.getByRole('heading', { level: 3 })).toHaveText(['The customs keeper', 'The mill clerk']);
  await returnToStory(page);
  await page.getByRole('button', { name: 'Try Again', exact: true }).click();
  await expectPassage(page, 'Six Sacks and a Day');
  people = await openPanel(page, 'People');
  await expect(people.getByRole('heading', { level: 3 })).toHaveText(['The customs keeper']);
  await returnToStory(page);
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
});
