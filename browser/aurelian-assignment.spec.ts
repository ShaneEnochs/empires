import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
const key = 'pokemon:checkpoint:aurelian-league';
async function choose(page: Page, label: string) {
  await page.getByRole('radio', { name: label, exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}
async function next(page: Page) {
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}
for (const width of [320, 1280]) for (const alternate of [false, true]) {
  test('Chapter 1 completes at ' + width + 'px, branch ' + (alternate ? 'chase/patience' : 'help/clover'), async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Aurelian League');
    await page.getByRole('button', { name: 'New Game', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A Simple Assignment');
    await expect(page.locator('.chapter-label')).toHaveText('Chapter 1: A Simple Assignment');
    await page.getByRole('button', { name: 'People', exact: true }).click();
    await expect(page.locator('#people')).toContainText('Cassius');
    await page.getByRole('button', { name: 'Story', exact: true }).click();
    await choose(page, alternate ? 'Remain quiet and watch.' : 'Give Cassius some encouragement.');
    await next(page); // Reach the orchard.
    await choose(page, alternate ? "Ask whether he's planning to share his entire lunch." : "Remind Cassius that bread isn't on the approved feeding list.");
    await choose(page, alternate ? 'Tell him the report should be accurate.' : "Assure Cassius you won't mention the bread.");
    await next(page); // Finish the family conversation.
    await choose(page, alternate ? 'Go after the Chikorita before it gets away.' : 'Help Cassius get his jacket free.');
    await next(page); // Cassius catches up at the trough.
    await choose(page, alternate ? "Ask why the Chikorita doesn't seem particularly afraid of either of you." : "Ask whether it's safe for the Chikorita to drink from such a rusty pipe.");
    await choose(page, alternate ? 'Sit down near the Chikorita and try to earn its trust.' : 'Gather some fresh clover and try to coax the Chikorita closer.');
    await next(page); // Finish the capture scene.
    await expect(page.getByText(/You hope he's right\./)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0);
    const raw = await page.evaluate(storageKey => localStorage.getItem(storageKey), key);
    const save = JSON.parse(raw!);
    expect(save.storyRevision).toBe(10);
    expect(save.currentState.passageId).toBe('capture_attempt');
    expect(save.currentState.variables.cassius_relationship).toBe(alternate ? 10 : 15);
    expect(save.currentState.variables.capture_plan).toBe(alternate ? 'carrier' : 'clover');
    expect(save.currentState.party).toEqual([]);
    expect(save.currentState.journal.map((e: { id: string }) => e.id)).toEqual(['met_cassius']);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.reload();
    await page.getByRole('button', { name: 'Continue Game', exact: true }).click();
    await expect(page.getByText(/You hope he's right\./)).toBeVisible();
  });
}
test('previous Empire browser saves remain untouched', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('empires:checkpoint:provincial-crisis', 'old progress'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continue Game', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('empires:checkpoint:provincial-crisis'))).toBe('old progress');
});
