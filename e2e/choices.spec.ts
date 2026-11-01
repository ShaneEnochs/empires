import { titlePage } from '../src/title-page';
import { expect, test } from '@playwright/test';
import { checkpointKey } from '../src/storage';
import {
  arrival, checkpointRecord, choose, expectCharacter, expectInitialState,
  expectItems, expectPassage, openPanel, panelNames, reachBriefing, returnToStory, expectStartup, startGame,
} from './helpers';

for (const width of [320, 375, 768, 1280]) {
  test('deliberate Continue preserves state and selection at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await startGame(page);
    const advance = page.getByRole('button', { name: 'Continue', exact: true });
    await expect(advance).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toHaveCount(0);
    await expect(page.getByRole('radio')).toHaveCount(2);
    await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
    await expect(advance).toBeDisabled();
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
    const record = page.getByRole('radio', { name: 'Enter a different name in the public record', exact: true });
    await record.locator('..').dblclick();
    await expect(record).toBeChecked();
    await expect(advance).toBeEnabled();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Last Ferry');
    const keep = page.getByRole('radio', { name: 'Keep the name Mara Vale and begin', exact: true });
    await keep.check();
    await expect(record).not.toBeChecked();
    await expect(page.locator('input[type="radio"]:checked')).toHaveCount(1);
    const node = await keep.elementHandle();
    for (const name of panelNames) {
      await openPanel(page, name);
      await expect(page.getByRole('navigation', { name: 'Passage actions' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: titlePage.newGameLabel, exact: true })).toHaveCount(0);
      await returnToStory(page);
      await expect(keep).toBeChecked();
      await expect(advance).toBeEnabled();
      expect(await node!.evaluate(element => element === document.querySelectorAll('input[type="radio"]')[1])).toBe(true);
    }
    await expectInitialState(page);
    await openPanel(page, 'People');
    await expect(page.getByText('No people recorded yet.', { exact: true })).toBeVisible();
    await returnToStory(page);
    expect(await page.evaluate(() => Reflect.get(window, '__choiceStorageCalls'))).toEqual([]);
    await advance.click();
    await expectPassage(page, 'What You Bring');
    await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
    await expect(advance).toBeDisabled();
    await choose(page, 'You surveyed these river channels');
    await expectPassage(page, 'Old Watermarks');
    await expectCharacter(page, ['Mara Vale', '2', '1', 'Undecided']);
    await expectItems(page, 'Journal', [arrival, 'Mara Vale returned as a former river surveyor.']);
    await expectItems(page, 'Skills', ['Provincial Commission', 'Channel Knowledge']);
    await expect(page.getByRole('radio')).toHaveCount(0);
    await expect(advance).toHaveCount(1);
    await expect(advance).toBeEnabled();
    expect(await checkpointRecord(page)).toBe(saved);
    await advance.click();
    await expectPassage(page, 'Six Sacks and a Day');
    await expectCharacter(page, ['Mara Vale', '3', '1', 'Undecided']);
    await expectItems(page, 'Inventory', ['Dispatch Coin × 4', 'Emergency Writ × 1', 'Grain Sack × 6']);
    await expect(advance).toBeDisabled();
  });
}

test('native keyboard selection changes one option without advancing and Continue receives focus', async ({ page }) => {
  await startGame(page);
  await page.keyboard.press('Tab');
  const record = page.getByRole('radio', { name: 'Enter a different name in the public record', exact: true });
  await expect(record).toBeFocused();
  await page.keyboard.press('Space');
  await expect(record).toBeChecked();
  await page.keyboard.press('ArrowDown');
  const keep = page.getByRole('radio', { name: 'Keep the name Mara Vale and begin', exact: true });
  await expect(keep).toBeChecked();
  await expect(keep).toBeFocused();
  await expect(record).not.toBeChecked();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Last Ferry');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expectPassage(page, 'What You Bring');
  await expectInitialState(page);
});

test('reload discards an uncommitted choice and in-game restart controls are absent', async ({ page }) => {
  await startGame(page);
  await reachBriefing(page, 'Eleanor');
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
  await page.getByRole('radio', { name: 'Investigate the mill accounts', exact: true }).check();
  for (const name of panelNames) {
    await openPanel(page, name);
    await expect(page.getByRole('button', { name: titlePage.newGameLabel, exact: true })).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Game tools' })).toHaveCount(0);
  }
  await page.reload();
  await expectStartup(page);
  await page.getByRole('button', { name: titlePage.continueGameLabel, exact: true }).click();
  await expectPassage(page, 'Six Sacks and a Day');
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
});

test('successive authored choice passages clear selection and expose only eligible options', async ({ page }) => {
  await page.goto('/');
  await expectStartup(page);
  await page.getByRole('button', { name: titlePage.newGameLabel, exact: true }).click();
  await choose(page, 'Keep the name Mara Vale and begin');
  await expectPassage(page, 'What You Bring');
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
  await choose(page, 'You surveyed these river channels');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await choose(page, 'Investigate the mill accounts');
  await expect(page.getByRole('radio')).toHaveCount(2);
  await expect(page.getByRole('radio', { name: 'Pay two coins for attested accounts', exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Leave the clerk in peace and inspect the levee', exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Negotiate a protected statement', exact: true })).toHaveCount(0);
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
});

test('failed Continue retains its selection and error, with no effects or save write', async ({ page }) => {
  await page.goto('/');
  await expectStartup(page);
  await page.getByRole('button', { name: titlePage.newGameLabel, exact: true }).click();
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
  await expectStartup(page);
  await page.getByRole('button', { name: titlePage.continueGameLabel, exact: true }).click();
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
    Object.defineProperty(window, '__failedContinueWrites', { get: () => writes });
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      writes++;
      return original.call(this, key, value);
    };
  });
  await choose(page, 'Negotiate a supervised civic compact');
  const selected = page.getByRole('radio', { name: 'Negotiate a supervised civic compact', exact: true });
  await expect(selected).toBeChecked();
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled();
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
  expect(await page.evaluate(() => Reflect.get(window, '__failedContinueWrites'))).toBe(0);
  expect(await checkpointRecord(page, key)).toBe(saved);
  await choose(page, 'Set the hearing aside and evacuate');
  await expectPassage(page, 'Boats Before Possessions');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
});
