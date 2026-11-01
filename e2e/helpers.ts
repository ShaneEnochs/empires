import { titlePage } from '../src/title-page';
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { checkpointKey, STORAGE_KEY } from '../src/storage';

export const crisisKey = checkpointKey({ storyId: 'provincial-crisis', storyRevision: 1 });
export const cityKey = STORAGE_KEY;
export const arrival = 'The last ferry reached Bellwether before the river closed.';
export const panelNames = ['Character', 'Journal', 'People'] as const;
type PanelName = typeof panelNames[number];
type CharacterSection = 'Skills' | 'Inventory';

export async function expectPassage(page: Page, title: string): Promise<void> {
  const heading = page.getByRole('heading', { level: 1, name: title, exact: true });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  if (await heading.getAttribute('id') === 'passage-heading') {
    await expect(heading).toHaveCSS('text-align', 'center');
    await expect(page.getByRole('button', { name: titlePage.newGameLabel, exact: true })).toHaveCount(0);
  }
}

export async function expectStartup(page: Page): Promise<void> {
  await expectPassage(page, titlePage.title);
  await expect(page.getByRole('navigation', { name: 'Game startup' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Select |Back to Stories/ })).toHaveCount(0);
  await expect(page.getByText('The City Gate', { exact: true })).toHaveCount(0);
  await expect(page.locator('.chapter-label')).toHaveCount(0);
}

export async function startGame(page: Page): Promise<void> {
  await page.goto('/');
  await expectStartup(page);
  await page.getByRole('button', { name: titlePage.newGameLabel, exact: true }).click();
  await expectPassage(page, 'The Last Ferry');
  await expect(page.getByRole('button', { name: titlePage.newGameLabel, exact: true })).toHaveCount(0);
}

export async function openPanel(page: Page, name: PanelName | CharacterSection): Promise<Locator> {
  if (name === 'Skills' || name === 'Inventory') {
    const character = await openPanel(page, 'Character');
    return character.getByRole('region', { name, exact: true });
  }
  const button = page.getByRole('button', { name, exact: true });
  if (await button.getAttribute('aria-pressed') !== 'true') await button.click();
  const section = page.getByRole('region', { name, exact: true });
  await expect(section).toBeVisible();
  return section;
}

export async function returnToStory(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Story', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Story', exact: true })).toHaveAttribute('aria-pressed', 'true');
}

export async function expectCharacter(page: Page, values: string[]): Promise<void> {
  const panel = await openPanel(page, 'Character');
  await expect(panel.locator('dt')).toHaveText(['Envoy', 'Authority', 'Public trust', 'Settlement']);
  await expect(panel.locator('dd')).toHaveText(values);
  await returnToStory(page);
}

export async function expectItems(page: Page, name: Exclude<PanelName, 'Character'> | CharacterSection, items: string[]): Promise<void> {
  const panel = await openPanel(page, name);
  await expect(panel.getByRole('listitem')).toHaveText(items);
  await returnToStory(page);
}

/** Authored choices commit only after selecting a native radio and pressing Continue. */
export async function choose(page: Page, label: string): Promise<void> {
  await page.getByRole('radio', { name: label, exact: true }).check();
  const advance = page.getByRole('button', { name: 'Continue', exact: true });
  await expect(advance).toHaveCount(1);
  await advance.click();
}

export async function expectInitialState(page: Page): Promise<void> {
  await expectCharacter(page, ['Mara Vale', '2', '0', 'Undecided']);
  await expectItems(page, 'Journal', [arrival]);
  await expectItems(page, 'Skills', ['Provincial Commission']);
  await expectItems(page, 'Inventory', ['Dispatch Coin × 4', 'Emergency Writ × 1']);
}

export async function chooseName(page: Page, value: string): Promise<void> {
  await choose(page, 'Enter a different name in the public record');
  await expectPassage(page, 'The Public Record');
  const field = page.getByRole('textbox', { name: 'Name for the public record', exact: true });
  await field.fill(value);
  await field.press('Enter');
  await expectPassage(page, 'What You Bring');
}

export async function reachBriefing(page: Page, name = 'Rowan 周'): Promise<void> {
  await chooseName(page, name);
  await choose(page, 'You surveyed these river channels');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expectPassage(page, 'Six Sacks and a Day');
}

export async function councilWithEvidence(page: Page): Promise<void> {
  await choose(page, 'Investigate the mill accounts');
  await expect(page.getByRole('radio', { name: 'Negotiate a protected statement', exact: true })).toHaveCount(0);
  await choose(page, 'Pay two coins for attested accounts');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await choose(page, 'Read the new watermarks from the bank');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expectPassage(page, 'When the Seal Expires');
}

export async function enterSluiceDeath(page: Page): Promise<void> {
  await choose(page, 'Investigate the mill accounts');
  await choose(page, 'Pay two coins for attested accounts');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await choose(page, 'Enter the unshored sluice chamber despite the warning');
  await expectPassage(page, 'Beneath the Shore Timbers');
  await expect(page.getByText("The river takes the commission's bearer before the council can meet.", { exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Passage actions' }).getByRole('button')).toHaveText(['Try Again']);
}

export async function checkpointRecord(page: Page, key = crisisKey): Promise<string | null> {
  return page.evaluate(key => localStorage.getItem(key), key);
}

export async function confirmNewGame(page: Page, accept: boolean): Promise<void> {
  await page.getByRole('button', { name: titlePage.newGameLabel, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Start a new game?', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Starting over will replace your existing saved progress.');
  await dialog.getByRole('button', { name: accept ? 'Start New Game' : 'Cancel', exact: true }).click();
  await expect(dialog).toHaveCount(0);
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
  }, crisisKey);
}

export async function checkpointWrites(page: Page): Promise<number> {
  return page.evaluate(() => Reflect.get(window, '__empiresCheckpointWrites') as number);
}
