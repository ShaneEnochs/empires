import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { checkpointKey, STORAGE_KEY } from '../src/storage';
import {
  checkpointRecord, chooseName, confirmNewGame, expectCharacter,
  expectItems, expectPassage, openPanel, panelNames, selectStory, startGame,
} from './helpers';
import type { StoryTitle } from './helpers';

const crisisKey = checkpointKey({ storyId: 'provincial-crisis', storyRevision: 1 });
const titles: StoryTitle[] = ['The City Gate', 'Provincial Crisis'];

async function action(page: Page, label: string, title: string): Promise<void> {
  await page.getByRole('button', { name: label, exact: true }).click();
  await expectPassage(page, title);
}

async function startCrisis(page: Page): Promise<void> {
  await page.goto('/');
  await selectStory(page, 'Provincial Crisis');
  await action(page, 'New Game', 'The Last Ferry');
}

async function nameAndBriefing(page: Page, name = 'Rowan 周'): Promise<void> {
  await action(page, 'Enter a different name in the public record', 'The Public Record');
  const field = page.getByRole('textbox', { name: 'Name for the public record', exact: true });
  await field.fill(name);
  await field.press('Enter');
  await expectPassage(page, 'What You Bring');
  await action(page, 'You surveyed these river channels', 'Old Watermarks');
  await action(page, 'Continue', 'Six Sacks and a Day');
}

async function councilWithEvidence(page: Page): Promise<void> {
  await action(page, 'Investigate the mill accounts', 'The Mill Yard');
  await expect(page.getByRole('button', { name: 'Negotiate a protected statement', exact: true })).toHaveCount(0);
  await action(page, 'Pay two coins for attested accounts', 'Ink Paid For');
  await action(page, 'Continue', 'The Unshored Gate');
  await action(page, 'Read the new watermarks from the bank', 'The High-Water Line');
  await action(page, 'Continue', 'When the Seal Expires');
}

async function crisisCharacter(page: Page, values: string[]): Promise<void> {
  const panel = await openPanel(page, 'Character');
  await expect(panel.locator('dt')).toHaveText(['Envoy', 'Authority', 'Public trust', 'Settlement']);
  await expect(panel.locator('dd')).toHaveText(values);
}

async function seedBoth(page: Page): Promise<void> {
  await startGame(page);
  await chooseName(page, 'Eleanor');
  await startCrisis(page);
  await nameAndBriefing(page);
}

async function records(page: Page) {
  return { city: await checkpointRecord(page), crisis: await checkpointRecord(page, crisisKey) };
}

/** Observe native storage calls only; no application/session hooks. */
async function observeStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const accesses: { operation: string; key: string }[] = [];
    Object.defineProperty(window, '__empiresStorageAccess', { value: accesses });
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    const removeItem = Storage.prototype.removeItem;
    Storage.prototype.getItem = function (key: string) {
      if (this === window.localStorage) accesses.push({ operation: 'read', key });
      return getItem.call(this, key);
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === window.localStorage) accesses.push({ operation: 'write', key });
      return setItem.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key: string) {
      if (this === window.localStorage) accesses.push({ operation: 'delete', key });
      return removeItem.call(this, key);
    };
  });
}

async function storageAccess(page: Page): Promise<{ operation: string; key: string }[]> {
  return page.evaluate(() => Reflect.get(window, '__empiresStorageAccess'));
}

test('library lists both stories without storage access; selecting and going back only reads the selected save', async ({ page }) => {
  await observeStorage(page);
  await page.goto('/');
  await expectPassage(page, 'Empires');
  await expect(page.getByText('Choose a story.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(titles);
  await expect(page.getByRole('button')).toHaveText(titles.map(title => 'Select ' + title));
  expect(await storageAccess(page)).toEqual([]);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Select The City Gate', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expectPassage(page, 'The City Gate');
  await expect(page.getByRole('group', { name: 'Game tools' })).toHaveCount(0);
  expect(await storageAccess(page)).toEqual([{ operation: 'read', key: STORAGE_KEY }]);
  await action(page, 'Back to Stories', 'Empires');
  expect(await storageAccess(page)).toEqual([{ operation: 'read', key: STORAGE_KEY }]);
  await selectStory(page, 'Provincial Crisis');
  await expect(page.getByRole('navigation', { name: 'Game startup' }).getByRole('button'))
    .toHaveText(['New Game', 'Back to Stories']);
  await action(page, 'Back to Stories', 'Empires');
  expect(await storageAccess(page)).toEqual([
    { operation: 'read', key: STORAGE_KEY }, { operation: 'read', key: crisisKey },
  ]);
});

test('both stories keep independent checkpoints across reloads, startup switching, and Continue', async ({ page }) => {
  await seedBoth(page);
  const saved = await records(page);
  expect(JSON.parse(saved.city!).storyId).toBe('empires-example');
  expect(JSON.parse(saved.crisis!).storyId).toBe('provincial-crisis');
  expect(JSON.parse(saved.city!).checkpoint.state.passageId).toBe('choose_background');
  expect(JSON.parse(saved.crisis!).checkpoint.state.passageId).toBe('briefing');

  await observeStorage(page);
  await page.reload();
  expect(await storageAccess(page)).toEqual([]);
  await selectStory(page);
  await expect(page.getByRole('button', { name: 'Continue Game', exact: true })).toBeVisible();
  await action(page, 'Back to Stories', 'Empires');
  await selectStory(page, 'Provincial Crisis');
  await expect(page.getByRole('button', { name: 'Continue Game', exact: true })).toBeVisible();
  await action(page, 'Back to Stories', 'Empires');
  expect(await storageAccess(page)).toEqual([
    { operation: 'read', key: STORAGE_KEY }, { operation: 'read', key: crisisKey },
  ]);
  expect(await records(page)).toEqual(saved);

  await selectStory(page);
  await action(page, 'Continue Game', 'Choose Your Background');
  await expectCharacter(page, ['Eleanor', '1', '5', 'No']);
  await expectItems(page, 'Skills', ['Composure']);
  await expect(page.getByRole('button', { name: 'Back to Stories', exact: true })).toHaveCount(0);
  await page.reload();
  await selectStory(page, 'Provincial Crisis');
  await action(page, 'Continue Game', 'Six Sacks and a Day');
  await crisisCharacter(page, ['Rowan 周', '3', '1', 'Undecided']);
  await expectItems(page, 'Skills', ['Provincial Commission', 'Channel Knowledge']);
  await expectItems(page, 'Inventory', ['Dispatch Coin × 4', 'Emergency Writ × 1', 'Grain Sack × 6']);
  expect(await records(page)).toEqual(saved);
  expect((await storageAccess(page)).filter(access => access.operation !== 'read')).toEqual([]);
});

for (const title of titles) {
  const selectedKey = title === 'The City Gate' ? STORAGE_KEY : crisisKey;
  const otherKey = title === 'The City Gate' ? crisisKey : STORAGE_KEY;

  test('New Game cancellation and replacement affect only ' + title, async ({ page }) => {
    await seedBoth(page);
    const saved = await records(page);
    const otherBytes = await checkpointRecord(page, otherKey);
    await page.reload();
    await selectStory(page, title);
    await confirmNewGame(page, false);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByRole('button', { name: 'Continue Game', exact: true })).toBeVisible();
    expect(await records(page)).toEqual(saved);
    await confirmNewGame(page, true);
    await expectPassage(page, title === 'The City Gate' ? 'The City Gate' : 'The Last Ferry');
    expect(await checkpointRecord(page, otherKey)).toBe(otherBytes);
    const envelope = JSON.parse((await checkpointRecord(page, selectedKey))!);
    expect(envelope.storyRevision).toBe(1);
    expect(envelope.formatVersion).toBe(1);
    expect(envelope.checkpoint.state.passageId).toBe(title === 'The City Gate' ? 'gate' : 'quayside');
  });

  test('a corrupt ' + title + ' save is isolated and only explicitly replaced', async ({ page }) => {
    await seedBoth(page);
    const otherBytes = await checkpointRecord(page, otherKey);
    await page.evaluate(key => localStorage.setItem(key, '{broken'), selectedKey);
    await page.reload();
    await selectStory(page, title);
    await expect(page.getByText('A saved game was found, but it cannot be loaded.', { exact: true })).toBeVisible();
    await expect(page.getByText('The saved data is not readable.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue Game', exact: true })).toHaveCount(0);
    await confirmNewGame(page, false);
    expect(await checkpointRecord(page, selectedKey)).toBe('{broken');
    await action(page, 'Back to Stories', 'Empires');
    await selectStory(page, title === 'The City Gate' ? 'Provincial Crisis' : 'The City Gate');
    await action(page, 'Continue Game', title === 'The City Gate' ? 'Six Sacks and a Day' : 'Choose Your Background');
    expect(await checkpointRecord(page, selectedKey)).toBe('{broken');
    expect(await checkpointRecord(page, otherKey)).toBe(otherBytes);
    await page.reload();
    await selectStory(page, title);
    await confirmNewGame(page, true);
    await expectPassage(page, title === 'The City Gate' ? 'The City Gate' : 'The Last Ferry');
    expect(await checkpointRecord(page, otherKey)).toBe(otherBytes);
  });
}

test('Provincial Crisis naming, selected metadata, conditional choices, and spending reach a complete ending', async ({ page }) => {
  await startCrisis(page);
  await crisisCharacter(page, ['Mara Vale', '2', '0', 'Undecided']);
  await expectItems(page, 'Skills', ['Provincial Commission']);
  await expectItems(page, 'Inventory', ['Dispatch Coin × 4', 'Emergency Writ × 1']);
  const name = 'Éléonore 王 <b>Envoy</b>';
  await nameAndBriefing(page, name);
  await crisisCharacter(page, [name, '3', '1', 'Undecided']);
  await expect(page.getByText('The keeper will honor a requisition while your commission lasts.', { exact: true })).toBeVisible();
  await councilWithEvidence(page);
  const saved = await checkpointRecord(page, crisisKey);
  await expectItems(page, 'Skills', ['Channel Knowledge']);
  await expectItems(page, 'Inventory', ['Dispatch Coin × 2', 'Grain Sack × 8', 'Attested Grain Accounts × 1']);
  await expect(page.getByText('Your seal can no longer turn an instruction into law. Every promise now needs willing hands or armed enforcement.', { exact: true })).toBeVisible();
  await action(page, 'Present the attested grain accounts', 'Accounts Read Aloud');
  await expect(page.getByRole('button', { name: 'Negotiate a supervised civic compact', exact: true })).toHaveCount(0);
  await action(page, 'Let trusted local delegates carry the compact', 'A Table With More Seats');
  await crisisCharacter(page, [name, '5', '4', 'Civic compact']);
  await expectItems(page, 'Inventory', ['Dispatch Coin × 2', 'Grain Sack × 2', 'Attested Grain Accounts × 1']);
  await expect(page.getByText('The board writes ' + name + ' into the agreement as its guarantor. Its next argument will happen across a table, with the accounts open.', { exact: true })).toBeVisible();
  const journal = await openPanel(page, 'Journal');
  await expect(journal.getByRole('heading', { level: 3 })).toHaveText(['The Writ', 'The River', 'Night Council']);
  await expect(journal.getByRole('listitem')).toHaveCount(8);
  await expect(journal.getByRole('listitem').last()).toHaveText(name + ' secured a civic compact and committed six sacks to public kitchens.');
  await expect(page.getByRole('navigation', { name: 'Passage actions' }).getByRole('button')).toHaveCount(0);
  await expect(page.locator('main b, main img, main script')).toHaveCount(0);
  expect(await checkpointRecord(page, crisisKey)).toBe(saved);
  expect(await checkpointRecord(page)).toBeNull();
});

for (const checkpoint of ['briefing', 'night_council']) {
  test('Provincial Crisis death and retry restore the complete ' + checkpoint + ' checkpoint without saving', async ({ page }) => {
    await observeStorage(page);
    await seedBoth(page);
    if (checkpoint === 'night_council') await councilWithEvidence(page);
    const saved = await records(page);
    const writes = (await storageAccess(page)).filter(access => access.operation !== 'read');
    const name = 'Rowan 周';
    const expectedSkills = checkpoint === 'briefing' ? ['Provincial Commission', 'Channel Knowledge'] : ['Channel Knowledge'];
    const expectedItems = checkpoint === 'briefing'
      ? ['Dispatch Coin × 4', 'Emergency Writ × 1', 'Grain Sack × 6']
      : ['Dispatch Coin × 2', 'Grain Sack × 8', 'Attested Grain Accounts × 1'];
    const heading = checkpoint === 'briefing' ? 'Six Sacks and a Day' : 'When the Seal Expires';
    const journal = await openPanel(page, 'Journal');
    const expectedJournal = await journal.getByRole('listitem').allTextContents();
    for (let cycle = 0; cycle < 2; cycle++) {
      if (checkpoint === 'briefing') {
        await action(page, 'Investigate the mill accounts', 'The Mill Yard');
        await action(page, 'Pay two coins for attested accounts', 'Ink Paid For');
        await action(page, 'Continue', 'The Unshored Gate');
        await action(page, 'Enter the unshored sluice chamber despite the warning', 'Beneath the Shore Timbers');
        await expect(page.getByText("The river takes the commission's bearer before the council can meet.", { exact: true })).toBeVisible();
      } else {
        await action(page, 'Plan an evacuation of the lower town', 'Boats Before Possessions');
        await expect(page.getByRole('button', { name: 'Hire the ferry hands for three coins', exact: true })).toHaveCount(0);
        await action(page, 'Force the damaged sluice as a shortcut despite the risk', 'The Gate Gives Way');
        await expect(page.getByText('The meeting has ended. The river has not.', { exact: true })).toBeVisible();
      }
      await expect(page.getByRole('navigation', { name: 'Passage actions' }).getByRole('button')).toHaveText(['Try Again']);
      expect(await records(page)).toEqual(saved);
      expect((await storageAccess(page)).filter(access => access.operation !== 'read')).toEqual(writes);
      await page.getByRole('button', { name: 'Try Again', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expectPassage(page, heading);
      await crisisCharacter(page, [name, checkpoint === 'briefing' ? '3' : '4', checkpoint === 'briefing' ? '1' : '2', 'Undecided']);
      await expectItems(page, 'Skills', expectedSkills);
      await expectItems(page, 'Inventory', expectedItems);
      await expectItems(page, 'Journal', expectedJournal);
      await expect(page.getByRole('textbox')).toHaveCount(0);
      expect(await records(page)).toEqual(saved);
      expect((await storageAccess(page)).filter(access => access.operation !== 'read')).toEqual(writes);
    }
    await page.reload();
    await selectStory(page, 'Provincial Crisis');
    await action(page, 'Continue Game', heading);
    await expectItems(page, 'Journal', expectedJournal);
    await expectItems(page, 'Skills', expectedSkills);
    await expectItems(page, 'Inventory', expectedItems);
    expect(await records(page)).toEqual(saved);
    expect((await storageAccess(page)).filter(access => access.operation !== 'read')).toEqual([]);
  });
}

test('failed Provincial Crisis automatic save keeps its in-memory recovery and warning without changing either persisted story', async ({ page }) => {
  await seedBoth(page);
  const saved = await records(page);
  await page.evaluate(key => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name: string, value: string) {
      if (this === localStorage && name === key) throw new DOMException('Storage full', 'QuotaExceededError');
      return setItem.call(this, name, value);
    };
  }, crisisKey);
  await councilWithEvidence(page);
  const warning = 'The latest checkpoint could not be saved. Closing this page may lose progress since the last saved checkpoint.';
  await expect(page.getByRole('alert')).toHaveText(warning);
  expect(await records(page)).toEqual(saved);
  await action(page, 'Plan an evacuation of the lower town', 'Boats Before Possessions');
  await action(page, 'Force the damaged sluice as a shortcut despite the risk', 'The Gate Gives Way');
  await action(page, 'Try Again', 'When the Seal Expires');
  await crisisCharacter(page, ['Rowan 周', '4', '2', 'Undecided']);
  await expectItems(page, 'Inventory', ['Dispatch Coin × 2', 'Grain Sack × 8', 'Attested Grain Accounts × 1']);
  await expect(page.getByRole('alert')).toHaveText(warning);
  expect(await records(page)).toEqual(saved);
  await page.reload();
  await selectStory(page, 'Provincial Crisis');
  await action(page, 'Continue Game', 'Six Sacks and a Day');
  await crisisCharacter(page, ['Rowan 周', '3', '1', 'Undecided']);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

for (const width of [320, 375]) {
  test('story library and both startup screens remain accessible at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expectPassage(page, 'Empires');
    for (const title of titles) {
      const button = page.getByRole('button', { name: 'Select ' + title, exact: true });
      for (let tab = 0; tab < (title === 'The City Gate' ? 1 : 2); tab++) await page.keyboard.press('Tab');
      await expect(button).toBeFocused();
      await expect(button).toBeInViewport();
      const layout = await button.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { width: bounds.width, height: bounds.height, outline: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth), pageWidth: document.documentElement.scrollWidth };
      });
      expect(layout.width).toBeGreaterThanOrEqual(44);
      expect(layout.height).toBeGreaterThanOrEqual(44);
      expect(layout.pageWidth).toBeLessThanOrEqual(width + 1);
      expect(layout.outline).not.toBe('none');
      expect(layout.outlineWidth).toBeGreaterThanOrEqual(2);
      await page.keyboard.press('Enter');
      await expectPassage(page, title);
      await expect(page.getByRole('button', { name: 'New Game', exact: true })).toBeInViewport();
      await action(page, 'Back to Stories', 'Empires');
    }
    await selectStory(page, 'Provincial Crisis');
    await action(page, 'New Game', 'The Last Ferry');
    await action(page, 'Enter a different name in the public record', 'The Public Record');
    const field = page.getByRole('textbox', { name: 'Name for the public record', exact: true });
    await expect(field).toBeInViewport();
    await field.fill('Mobile Reader');
    for (const name of panelNames) await openPanel(page, name);
    await expect(field).toHaveValue('Mobile Reader');
    await field.press('Enter');
    await expectPassage(page, 'What You Bring');
    await crisisCharacter(page, ['Mobile Reader', '2', '0', 'Undecided']);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
  });
}
