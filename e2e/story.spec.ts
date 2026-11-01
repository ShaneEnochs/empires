import { titlePage } from '../src/title-page';
import { expect, test } from '@playwright/test';
import {
  choose, checkpointRecord, chooseName, expectCharacter, expectItems, expectPassage,
  openPanel, panelNames, startGame, returnToStory,
} from './helpers';

for (const ending of ['guard', 'refuge'] as const) {
  test('the public story retains the complete ' + ending + ' route and terminal action behavior', async ({ page }) => {
    await startGame(page);
    await choose(page, 'Keep the name Mara Vale and begin');
    await choose(page, ending === 'guard' ? 'You mediated disputes at the provincial court' : 'You surveyed these river channels');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await choose(page, 'Bypass fieldwork and convene the council');
    const saved = await checkpointRecord(page);
    await expect(page.getByText('Your seal can no longer turn an instruction into law. Every promise now needs willing hands or armed enforcement.', { exact: true })).toBeVisible();
    if (ending === 'guard') {
      await choose(page, 'Ask the guard to take charge of distribution');
      await choose(page, 'Accept guard-controlled rationing');
      await expectPassage(page, 'An Order Posted at Dawn');
      await expectCharacter(page, ['Mara Vale', '4', '-3', 'Guard rationing']);
      await expectItems(page, 'Skills', ['Diplomacy']);
      await expectItems(page, 'Inventory', ['Dispatch Coin × 4', 'Grain Sack × 4']);
      await expect(page.getByText(/The captain posts your ration order before dawn/)).toBeVisible();
    } else {
      await choose(page, 'Plan an evacuation of the lower town');
      await choose(page, 'Hire the ferry hands for three coins');
      await expectPassage(page, "Hands Who Know Tonight's Water");
      await expect(page.getByRole('radio')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(1);
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await expectPassage(page, 'A Town Above the Water');
      await expectCharacter(page, ['Mara Vale', '3', '2', 'River refuge']);
      await expectItems(page, 'Skills', ['Channel Knowledge']);
      await expectItems(page, 'Inventory', ['Dispatch Coin × 1', 'Grain Sack × 6']);
      await expect(page.getByText(/The last boat reaches the high ground before dawn/)).toBeVisible();
    }
    await expect(page.getByRole('navigation', { name: 'Passage actions' }).getByRole('button')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Try Again', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: titlePage.newGameLabel, exact: true })).toHaveCount(0);
    expect(JSON.parse((await checkpointRecord(page))!).checkpoint).toEqual(JSON.parse(saved!).checkpoint);
    const endingSave = await checkpointRecord(page);
    await page.reload();
    await page.getByRole('button', { name: titlePage.continueGameLabel, exact: true }).click();
    await expectPassage(page, ending === 'guard' ? 'An Order Posted at Dawn' : 'A Town Above the Water');
    expect(await checkpointRecord(page)).toBe(endingSave);
  });
}

test('name drafts survive inspection; Enter accepts trimmed Unicode and HTML-like text without executing it', async ({ page }) => {
  await startGame(page);
  await choose(page, 'Enter a different name in the public record');
  await expectPassage(page, 'The Public Record');
  const field = page.getByRole('textbox', { name: 'Name for the public record', exact: true });
  await expect(field).toHaveValue('Mara Vale');
  await field.fill('Draft alias');
  const saved = await checkpointRecord(page);
  for (const name of panelNames) await openPanel(page, name);
  await returnToStory(page);
  await expect(field).toHaveValue('Draft alias');
  await expectCharacter(page, ['Mara Vale', '2', '0', 'Undecided']);
  await expectPassage(page, 'The Public Record');
  expect(await checkpointRecord(page)).toBe(saved);
  const name = 'Éléonore 王 <b>Envoy</b>';
  await field.fill('  ' + name + '  ');
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(1);
  await field.press('Enter');
  await expectPassage(page, 'What You Bring');
  await expect(page.getByText('Your writ says ' + name + '. It does not say why anyone here should trust you. Before the commission, you made a living in one of two worlds.', { exact: true })).toBeVisible();
  await expectCharacter(page, [name, '2', '0', 'Undecided']);
  await expect(page.locator('main b, main img, main script')).toHaveCount(0);
  await choose(page, 'You mediated disputes at the provincial court');
  await expectPassage(page, "A Clerk's Reputation");
  await expectCharacter(page, [name, '3', '0', 'Undecided']);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expectPassage(page, 'Six Sacks and a Day');
  await expectCharacter(page, [name, '4', '0', 'Undecided']);
  const journal = await openPanel(page, 'Journal');
  await expect(journal.getByRole('listitem').nth(1)).toHaveText(name + ' brought the negotiating habits of the provincial court.');
});

test('invalid text retains the field, focus, and error without navigation or saving', async ({ page }) => {
  await startGame(page);
  await choose(page, 'Enter a different name in the public record');
  const field = page.getByRole('textbox', { name: 'Name for the public record', exact: true });
  const saved = await checkpointRecord(page);
  for (const value of ['', '   ', 'x'.repeat(81)]) {
    await field.fill(value);
    await field.press('Enter');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Public Record');
    await expect(field).toHaveValue(value);
    await expect(field).toBeFocused();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    const error = page.getByRole('alert');
    await expect(error).toHaveText('Story error: Enter between 1 and 80 characters.');
    await expect(field).toHaveAttribute('aria-describedby', (await error.getAttribute('id'))!);
    expect(await checkpointRecord(page)).toBe(saved);
  }
  await field.fill('Eleanor');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expectPassage(page, 'What You Bring');
  await expect(page.getByRole('alert')).toHaveCount(0);
});
