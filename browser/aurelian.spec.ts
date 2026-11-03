import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const key = 'pokemon:checkpoint:aurelian-league';

async function choose(page: Page, label: string) {
  await page.getByRole('radio', { name: label, exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

async function proceed(page: Page) {
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

const routes = [
  {
    pronouns: 'He / Him', first: "See what's happening at the café",
    contact: 'Exchange numbers with Lucia', encounter: 'Introduce yourself to the two contestants',
    additionalPerson: 'Dario',
  },
  {
    pronouns: 'She / Her', first: 'Find a place by the windows',
    contact: 'Politely decline', encounter: 'Stay nearby and listen without interrupting',
    additionalPerson: null,
  },
  {
    pronouns: 'They / Them', first: 'Find a place by the windows',
    contact: 'Exchange numbers with Lucia', encounter: 'Go up to the observation deck instead',
    additionalPerson: null,
  },
] as const;

for (const width of [320, 1280]) for (const route of routes) {
  test('ferry-only chapter, ' + route.pronouns + ', ' + route.encounter + ' at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Aurelian League');
    await page.getByRole('button', { name: 'New Game', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Approaching Lezano');
    const tabs = page.getByRole('navigation', { name: 'Reading views' }).getByRole('button');
    await expect(tabs).toHaveText(['Story', 'Character', 'Party', 'Pokédex', 'People']);
    for (const tab of await tabs.all()) {
      const bounds = await tab.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
    }

    await choose(page, route.first);
    await proceed(page);
    await proceed(page);
    await proceed(page);
    await proceed(page);

    const nameField = page.getByRole('textbox', { name: 'Your first name', exact: true });
    await nameField.fill('   ');
    await nameField.press('Enter');
    await expect(page.getByRole('alert')).toBeVisible();
    await nameField.fill(' Rowan 周 ');
    await nameField.press('Enter');
    await expect(page.getByText('Hi, Rowan 周!', { exact: false })).toBeVisible();

    await choose(page, route.contact);
    await proceed(page);
    await expect(page.getByText(/I use she and her/)).toBeVisible();
    await choose(page, route.pronouns);
    await proceed(page);

    await page.getByRole('button', { name: 'People', exact: true }).click();
    await expect(page.locator('#people')).toContainText('Lucia');
    await page.getByRole('button', { name: 'Story', exact: true }).click();
    await choose(page, 'Ask what she knows about the Laurels');
    await proceed(page);
    await choose(page, route.encounter);
    await proceed(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lezano Harbor');
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0);
    await expect(page.getByText(/the gangway begins to lower/)).toBeVisible();

    const raw = await page.evaluate(storageKey => localStorage.getItem(storageKey), key);
    const save = JSON.parse(raw!);
    expect(save.storyRevision).toBe(5);
    expect(save.currentState.variables.trainer_name).toBe('Rowan 周');
    expect(save.currentState.variables.pronouns).toBe(route.pronouns);
    expect(save.currentState.variables.lucia_contact).toBe(route.contact === 'Exchange numbers with Lucia');
    expect(save.currentState.party).toEqual([]);

    await page.getByRole('button', { name: 'Party', exact: true }).click();
    await expect(page.getByText("You haven't partnered with any Pokémon yet.")).toBeVisible();
    await page.getByRole('button', { name: 'People', exact: true }).click();
    if (route.additionalPerson) {
      await expect(page.locator('#people')).toContainText(route.additionalPerson);
    } else {
      await expect(page.locator('#people')).not.toContainText('Dario');
    }
    await expect(page.locator('#character')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.reload();
    await page.getByRole('button', { name: 'Continue Game', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lezano Harbor');
    await page.getByRole('button', { name: 'Character', exact: true }).click();
    await expect(page.locator('#character dd')).toHaveText(['Rowan 周', route.pronouns]);
    expect(await page.evaluate(storageKey => localStorage.getItem(storageKey), key)).toBe(raw);
  });
}

test('old Empire saves remain isolated and no Pokémon join during the ferry', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('empires:checkpoint:provincial-crisis', 'old progress'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continue Game', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await choose(page, 'Find a place by the windows');
  await page.getByRole('button', { name: 'Party', exact: true }).click();
  await expect(page.locator('#party li')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('empires:checkpoint:provincial-crisis'))).toBe('old progress');
});
