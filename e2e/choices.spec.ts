import { expect, test } from '@playwright/test';
import { checkpointKey } from '../src/storage';
import {
  arrival, checkpointRecord, choose, chooseName, confirmNewGame, expectCharacter,
  expectItems, expectPassage, openPanel, panelNames, returnToStory, selectStory, startGame,
} from './helpers';

for (const width of [320, 375, 768, 1280]) {
  test('deliberate choices preserve state and selection at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await startGame(page);
    const next = page.getByRole('button', { name: 'Next', exact: true });
    const radios = page.getByRole('radio');
    await expect(radios).toHaveCount(4);
    await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
    await expect(next).toBeDisabled();
    const saved = await checkpointRecord(page);
    await page.evaluate(() => {
      const calls: string[] = [];
      Object.defineProperty(window, '__choiceStorageCalls', { value: calls });
      for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
        const original = Storage.prototype[method];
        Object.defineProperty(Storage.prototype, method, { value: function (...args: string[]) {
          calls.push(method);
          return Reflect.apply(original, this, args);
        }});
      }
    });
    const messenger = page.getByRole('radio', { name: 'Speak to the messenger', exact: true });
    // The label is a touch target too; double clicks must only select.
    await messenger.locator('..').dblclick();
    await expect(messenger).toBeChecked();
    await expect(next).toBeEnabled();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The City Gate');
    await page.getByRole('radio', { name: 'Go straight to the council', exact: true }).check();
    await expect(messenger).not.toBeChecked();
    await expect(page.locator('input[type="radio"]:checked')).toHaveCount(1);
    await messenger.check();
    const node = await messenger.elementHandle();
    for (const name of panelNames) {
      await openPanel(page, name);
      await expect(page.getByRole('navigation', { name: 'Passage actions' })).toHaveCount(0);
      await returnToStory(page);
      await expect(messenger).toBeChecked();
      await expect(next).toBeEnabled();
      expect(await node!.evaluate(element => element === document.querySelector('input[type="radio"]'))).toBe(true);
    }
    await expectCharacter(page, ['Alexander', '1', '5', 'No']);
    await expectItems(page, 'Journal', [arrival]);
    await expectItems(page, 'Skills', ['Composure']);
    await expectItems(page, 'Inventory', ['Gold Coin × 10', 'Gate Token × 1']);
    await openPanel(page, 'People');
    await expect(page.getByText('No people recorded yet.', { exact: true })).toBeVisible();
    await returnToStory(page);
    expect(await page.evaluate(() => Reflect.get(window, '__choiceStorageCalls'))).toEqual([]);
    await next.click();
    await expectPassage(page, 'A Quiet Warning');
    await expectCharacter(page, ['Alexander', '3', '4', 'Yes']);
    await expectItems(page, 'Journal', [arrival, 'The messenger accepted your oath. Influence: 3.']);
    await expectItems(page, 'Inventory', ['Gold Coin × 12', 'Gate Token × 1']);
    await expect(page.getByRole('radio')).toHaveCount(0);
    await expect(next).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expectPassage(page, 'The Empty Chair');
    await expect(page.getByRole('navigation', { name: 'Passage actions' }).getByRole('button')).toHaveCount(0);
    expect(await checkpointRecord(page)).toBe(saved);
  });
}

test('native keyboard selection changes one option without advancing and Next receives focus', async ({ page }) => {
  await startGame(page);
  await page.keyboard.press('Tab');
  const messenger = page.getByRole('radio', { name: 'Speak to the messenger', exact: true });
  await expect(messenger).toBeFocused();
  await page.keyboard.press('Space');
  await expect(messenger).toBeChecked();
  await page.keyboard.press('ArrowDown');
  const council = page.getByRole('radio', { name: 'Go straight to the council', exact: true });
  await expect(council).toBeChecked();
  await expect(council).toBeFocused();
  await expect(messenger).not.toBeChecked();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The City Gate');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expectPassage(page, 'The Empty Chair');
  await expectCharacter(page, ['Alexander', '0.5', '5', 'No']);
});

test('new passages and reloads start unselected; cancelled New Game keeps the selection', async ({ page }) => {
  await startGame(page);
  await chooseName(page, 'Eleanor');
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  const noble = page.getByRole('radio', { name: 'Raised among nobility', exact: true });
  await noble.check();
  await confirmNewGame(page, false);
  await expect(noble).toBeChecked();
  await page.reload();
  await selectStory(page);
  await page.getByRole('button', { name: 'Continue Game', exact: true }).click();
  await expectPassage(page, 'Choose Your Background');
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
});

test('successive authored choice passages clear selection and expose only eligible options', async ({ page }) => {
  await page.goto('/');
  await selectStory(page, 'Provincial Crisis');
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await choose(page, 'Keep the name Mara Vale and begin');
  await expectPassage(page, 'What You Bring');
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await choose(page, 'You surveyed these river channels');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await choose(page, 'Investigate the mill accounts');
  await expect(page.getByRole('radio')).toHaveCount(2);
  await expect(page.getByRole('radio', { name: 'Pay two coins for attested accounts', exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Leave the clerk in peace and inspect the levee', exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Negotiate a protected statement', exact: true })).toHaveCount(0);
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
});

test('failed Next retains its selection and error, with no effects or save write', async ({ page }) => {
  await page.goto('/');
  await selectStory(page, 'Provincial Crisis');
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await choose(page, 'Keep the name Mara Vale and begin');
  await choose(page, 'You mediated disputes at the provincial court');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await choose(page, 'Investigate the mill accounts');
  await choose(page, 'Negotiate a protected statement');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await choose(page, 'Take the dry road without fresh soundings');
  const key = checkpointKey({ storyId: 'provincial-crisis', storyRevision: 1 });
  // A valid prior save with too little grain exercises the engine's existing
  // atomic entry failure without changing story content or exposing app hooks.
  await page.evaluate(key => {
    const save = JSON.parse(localStorage.getItem(key)!);
    save.checkpoint.state.inventory.grain_sack = 1;
    localStorage.setItem(key, JSON.stringify(save));
  }, key);
  await page.reload();
  await selectStory(page, 'Provincial Crisis');
  await page.getByRole('button', { name: 'Continue Game', exact: true }).click();
  await choose(page, 'Present the attested grain accounts');
  const saved = await checkpointRecord(page, key);
  const character = await openPanel(page, 'Character');
  const values = await character.locator('dd').allTextContents();
  await returnToStory(page);
  const journal = await openPanel(page, 'Journal');
  const entries = await journal.getByRole('listitem').allTextContents();
  await returnToStory(page);
  await page.evaluate(() => {
    let writes = 0;
    Object.defineProperty(window, '__failedNextWrites', { get: () => writes });
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      writes++;
      return original.call(this, key, value);
    };
  });
  await choose(page, 'Negotiate a supervised civic compact');
  const selected = page.getByRole('radio', { name: 'Negotiate a supervised civic compact', exact: true });
  await expect(selected).toBeChecked();
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
  const error = 'Story error: Passage "ending_compact": insufficient inventory for "grain_sack"; cannot remove 6 from 3.';
  await expect(page.getByRole('alert')).toHaveText(error);
  const after = await openPanel(page, 'Character');
  await expect(after.locator('dt')).toHaveText(['Envoy', 'Authority', 'Public trust', 'Settlement']);
  await expect(after.locator('dd')).toHaveText(values);
  await returnToStory(page);
  await expectItems(page, 'Journal', entries);
  await expectItems(page, 'Inventory', ['Dispatch Coin × 4', 'Grain Sack × 3', 'Attested Grain Accounts × 1']);
  await openPanel(page, 'People');
  await returnToStory(page);
  await expect(selected).toBeChecked();
  await expect(page.getByRole('alert')).toHaveText(error);
  expect(await page.evaluate(() => Reflect.get(window, '__failedNextWrites'))).toBe(0);
  expect(await checkpointRecord(page, key)).toBe(saved);
  await choose(page, 'Set the hearing aside and evacuate');
  await expectPassage(page, 'Boats Before Possessions');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
});
