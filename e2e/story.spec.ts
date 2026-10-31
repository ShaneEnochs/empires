import { expect, test } from '@playwright/test';
import {
  arrival, checkpointRecord, expectCharacter, expectGateState, expectItems, expectPassage, openPanel, panelNames, startGame,
  returnToStory,
} from './helpers';

for (const messenger of [false, true]) {
  test(messenger ? 'Gate → Messenger → Council updates narrative and all panels' : 'Gate → Council keeps the direct route and its conditional prose', async ({ page }) => {
    await startGame(page);
    await expectGateState(page);
    const saved = await checkpointRecord(page);
    const journal = [arrival];
    if (messenger) {
      await page.getByRole('button', { name: 'Speak to the messenger', exact: true }).click();
      await expectPassage(page, 'A Quiet Warning');
      await expect(page.getByText(/The messenger lowers their voice/)).toBeVisible();
      await expectCharacter(page, ['Alexander', '3', '4', 'Yes']);
      await expectItems(page, 'Skills', ['Composure', 'Diplomacy']);
      await expectItems(page, 'Inventory', ['Gold Coin × 12', 'Gate Token × 1']);
      journal.push('The messenger accepted your oath. Influence: 3.');
      await expectItems(page, 'Journal', journal);
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
    } else {
      await page.getByRole('button', { name: 'Go straight to the council', exact: true }).click();
    }

    await expectPassage(page, 'The Empty Chair');
    await expect(page.getByText(/Inside the council hall, an empty chair/)).toBeVisible();
    const influence = messenger ? '2.5' : '0.5';
    await expectCharacter(page, ['Alexander', influence, messenger ? '4' : '5', messenger ? 'Yes' : 'No']);
    await expectItems(page, 'Skills', messenger ? ['Diplomacy'] : []);
    if (!messenger) await expect((await openPanel(page, 'Skills')).getByText('No skills acquired yet.')).toBeVisible();
    await expectItems(page, 'Inventory', [messenger ? 'Gold Coin × 7' : 'Gold Coin × 5']);
    journal.push('You reached the council with influence ' + influence + '.');
    await expectItems(page, 'Journal', journal);
    const journalPanel = await openPanel(page, 'Journal');
    await expect(journalPanel.getByRole('heading', { level: 3 })).toHaveText(['Prologue', 'Chapter One']);
    await returnToStory(page);
    await expect(page.getByText('The coins remaining in your purse offer a small reassurance.', { exact: true })).toBeVisible();
    const diplomatic = page.getByText('Your diplomatic training helps you choose your words.', { exact: true });
    const unaided = page.getByText('Without diplomatic training, you face the council unaided.', { exact: true });
    const extraCoins = page.getByText("The messenger's extra coins remain after the entry fee.", { exact: true });
    if (messenger) {
      await expect(diplomatic).toBeVisible(); await expect(unaided).toHaveCount(0); await expect(extraCoins).toBeVisible();
    } else {
      await expect(unaided).toBeVisible(); await expect(diplomatic).toHaveCount(0); await expect(extraCoins).toHaveCount(0);
    }
    await expect(page.getByRole('navigation', { name: 'Passage actions' }).getByRole('button')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Try Again', exact: true })).toHaveCount(0);
    expect(await checkpointRecord(page)).toBe(saved);
  });
}

test('preferred name, panel inspection, Enter submission, and soldier background use ordinary gameplay', async ({ page }) => {
  await startGame(page);
  await page.getByRole('button', { name: 'Choose a preferred name and background', exact: true }).click();
  await expectPassage(page, 'Choose Your Name');
  const field = page.getByRole('textbox', { name: 'Preferred name', exact: true });
  await expect(field).toHaveValue('Alexander');
  await field.fill('Draft alias');
  const saved = await checkpointRecord(page);
  for (const name of panelNames) await openPanel(page, name);
  await returnToStory(page);
  await expect(field).toHaveValue('Draft alias');
  await expectCharacter(page, ['Alexander', '1', '5', 'No']);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose Your Name');
  expect(await checkpointRecord(page)).toBe(saved);

  const name = 'Éléonore 王 <b>Hero</b>';
  await field.fill('  ' + name + '  ');
  await field.press('Enter');
  await expectPassage(page, 'Choose Your Background');
  await expect(page.getByText('Welcome, ' + name + '. What shaped your life before this journey?', { exact: true })).toBeVisible();
  await expectCharacter(page, [name, '1', '5', 'No']);
  await expectItems(page, 'Journal', [arrival, 'You introduced yourself as ' + name + '.']);
  await expect(page.locator('main b, main img, main script')).toHaveCount(0);
  await page.getByRole('button', { name: 'Trained with soldiers', exact: true }).click();
  await expectPassage(page, "A Soldier's Training");
  await expectCharacter(page, [name, '1', '7', 'Yes']);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expectPassage(page, 'The Empty Chair');
  await expectCharacter(page, [name, '0.5', '7', 'Yes']);
});

test('invalid text retains the form value and focus without navigation or saving', async ({ page }) => {
  await startGame(page);
  await page.getByRole('button', { name: 'Choose a preferred name and background', exact: true }).click();
  const field = page.getByRole('textbox', { name: 'Preferred name', exact: true });
  const saved = await checkpointRecord(page);
  for (const value of ['', '   ', 'x'.repeat(81)]) {
    await field.fill(value);
    await field.press('Enter');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose Your Name');
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
  await expectPassage(page, 'Choose Your Background');
  await expect(page.getByRole('alert')).toHaveCount(0);
});
