import { expect, test } from '@playwright/test';
import { expectPassage, expectStartup, openPanel, panelNames } from './helpers';

test('unavailable storage preserves startup and requires consent before unsaved gameplay', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = function () { throw new DOMException('Storage unavailable', 'SecurityError'); };
  });
  await page.goto('/');
  await expectStartup(page);
  await expect(page.getByText('Saved progress could not be checked.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue Game', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'New Game', exact: true })).toBeVisible();
  await page.locator('#save-status').getByRole('button', { name: 'Play without saving', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Provincial Crisis');
  await expect(page.getByRole('button', { name: 'Play without saving', exact: true })).toBeFocused();
  await page.locator('#save-status').getByRole('button', { name: 'Play without saving', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Play without saving', exact: true }).click();
  await expectPassage(page, 'The Last Ferry');
  await expect(page.getByRole('button', { name: 'New Game', exact: true })).toHaveCount(0);
  for (const name of panelNames) {
    await openPanel(page, name);
    await expect(page.getByRole('alert')).toHaveText('Playing without saving. Progress in this game will be lost when this page closes. Existing saved progress is unchanged.');
  }
});
