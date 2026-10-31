import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { STORAGE_KEY } from '../src/storage';

export const arrival = 'Alexander reached the city with influence 1.';
export const panelNames = ['Character', 'Journal', 'Skills', 'Inventory'] as const;
type PanelName = typeof panelNames[number];
export type StoryTitle = 'The City Gate' | 'Provincial Crisis';

export async function expectPassage(page: Page, title: string): Promise<void> {
  const heading = page.getByRole('heading', { level: 1, name: title, exact: true });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
}

export async function startGame(page: Page): Promise<void> {
  await page.goto('/');
  await selectStory(page);
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await expectPassage(page, 'The City Gate');
}

export async function selectStory(page: Page, title: StoryTitle = 'The City Gate'): Promise<void> {
  await expectPassage(page, 'Empires');
  await page.getByRole('button', { name: 'Select ' + title, exact: true }).click();
  await expectPassage(page, title);
  await expect(page.getByRole('navigation', { name: 'Game startup' })).toBeVisible();
}

export async function openPanel(page: Page, name: PanelName) {
  const button = page.getByRole('button', { name, exact: true });
  if (await button.getAttribute('aria-expanded') === 'false') await button.click();
  const section = page.getByRole('region', { name, exact: true });
  await expect(section).toBeVisible();
  return section;
}

export async function expectCharacter(page: Page, values: string[]): Promise<void> {
  const panel = await openPanel(page, 'Character');
  await expect(panel.locator('dt')).toHaveText(['Name', 'Influence', 'Honor', 'Loyal']);
  await expect(panel.locator('dd')).toHaveText(values);
}

export async function expectItems(page: Page, name: Exclude<PanelName, 'Character'>, items: string[]): Promise<void> {
  const panel = await openPanel(page, name);
  await expect(panel.getByRole('listitem')).toHaveText(items);
}

export async function expectGateState(page: Page): Promise<void> {
  await expectCharacter(page, ['Alexander', '1', '5', 'No']);
  await expectItems(page, 'Journal', [arrival]);
  await expectItems(page, 'Skills', ['Composure']);
  await expectItems(page, 'Inventory', ['Gold Coin × 10', 'Gate Token × 1']);
}

export async function chooseName(page: Page, value: string): Promise<void> {
  await page.getByRole('button', { name: 'Choose a preferred name and background', exact: true }).click();
  await expectPassage(page, 'Choose Your Name');
  await page.getByRole('textbox', { name: 'Preferred name', exact: true }).fill(value);
  await page.getByRole('textbox', { name: 'Preferred name', exact: true }).press('Enter');
  await expectPassage(page, 'Choose Your Background');
}

export async function enterWatchtower(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Explore the abandoned watchtower', exact: true }).click();
  await expectPassage(page, 'The Abandoned Watchtower');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expectPassage(page, 'A Fatal Fall');
  await expect(page.getByText('The stair collapses beneath you. Your journey ends in the silent tower.', { exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Passage actions' }).getByRole('button')).toHaveText(['Try Again']);
}

export async function checkpointRecord(page: Page, key = STORAGE_KEY): Promise<string | null> {
  return page.evaluate(key => localStorage.getItem(key), key);
}

export async function confirmNewGame(page: Page, accept: boolean): Promise<void> {
  const shown = page.waitForEvent('dialog');
  const click = page.getByRole('button', { name: 'New Game', exact: true }).click();
  const dialog = await shown;
  if (accept) await dialog.accept(); else await dialog.dismiss();
  await click;
  expect(dialog.type()).toBe('confirm');
  expect(dialog.message()).toBe('Start a new game? This will replace your existing saved progress.');
}

/** Observe native storage synchronously; do not access or patch application code. */
export async function observeCheckpointWrites(page: Page): Promise<void> {
  await page.addInitScript(key => {
    let writes = 0;
    Object.defineProperty(window, '__empiresCheckpointWrites', { get: () => writes });
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name: string, value: string): void {
      setItem.call(this, name, value);
      if (this === window.localStorage && name === key) writes++;
    };
  }, STORAGE_KEY);
}

export async function checkpointWrites(page: Page): Promise<number> {
  return page.evaluate(() => Reflect.get(window, '__empiresCheckpointWrites') as number);
}
