import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
const key = 'pokemon:checkpoint:aurelian-league';
const primary = ['Story', 'Character', 'Party', 'Pokédex', 'People'];
const sections = ['Stats', 'Skills', 'Inventory', 'Journal'];
async function proceed(page: Page) { await page.getByRole('button', { name: 'Continue', exact: true }).click(); }
async function choose(page: Page, name: string) { await page.getByRole('radio', { name, exact: true }).check(); await proceed(page); }
async function saved(page: Page) { return page.evaluate(key => localStorage.getItem(key), key); }
async function view(page: Page, name: string) {
  await page.getByRole('navigation', { name: 'Reading views' }).getByRole('button', { name, exact: true }).click();
  if (name === 'Story') await expect(page.locator('.chapter-label')).toBeVisible();
  else await expect(page.locator('.chapter-label')).toBeHidden();
  const heading = page.getByRole('heading', { name: name === 'Story' ? 'Approaching Lezano Aboard the Portia' : name, exact: true });
  if (name !== 'Story') await expect(heading).toBeFocused();
  await expect.poll(() => page.evaluate(() => Math.abs(parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
    - document.querySelector('.reading-header')!.getBoundingClientRect().height))).toBeLessThan(1);
}
for (const width of [320, 1280]) test('primary views, nested Character sections and sticky height stay inert at ' + width, async ({ page }) => {
  await page.setViewportSize({ width, height: 800 }); await page.goto('/');
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  const tabs = page.getByRole('navigation', { name: 'Reading views' }).getByRole('button');
  await expect(tabs).toHaveText(primary);
  const geometry = await tabs.evaluateAll(buttons => buttons.map(button => { const r = button.getBoundingClientRect(); return { y: r.y, width: r.width, height: r.height }; }));
  for (const box of geometry) { expect(box.y).toBe(geometry[0]!.y); expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44); }
  const raw = await saved(page);
  await page.getByRole('radio', { name: "See what's happening at the café", exact: true }).check();
  for (const name of primary.slice(1)) {
    await view(page, name);
    if (name === 'Character') {
      const group = page.getByRole('group', { name: 'Character sections' });
      await expect(group.getByRole('button')).toHaveText(sections);
      await expect(group.getByRole('button', { name: 'Stats', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#character-stats dd')).toHaveText(['Unknown', 'They / Them', '0']);
      for (const section of sections) {
        await group.getByRole('button', { name: section, exact: true }).click();
        await expect(page.getByRole('heading', { name: section, level: 3, exact: true })).toBeFocused();
        await expect(page.locator('#character > section:visible')).toHaveCount(1);
        if (section !== 'Stats') await expect(page.getByRole('region', { name: section, exact: true })).toContainText(section === 'Skills' ? 'No skills acquired yet.' : section === 'Inventory' ? 'No items in inventory.' : 'No journal entries yet.');
        expect(await saved(page)).toBe(raw);
      }
    }
    if (name === 'Pokédex') await expect(page.locator('#pokedex')).toContainText("Install the Pokédex app at registration to start researching Pokémon.");
    expect(await saved(page)).toBe(raw);
  }
  await view(page, 'Story');
  await expect(page.getByRole('radio', { name: "See what's happening at the café", exact: true })).toBeChecked();
  await proceed(page);
  await view(page, 'Pokédex');
  await expect(page.locator('#pokedex')).toContainText("Install the Pokédex app at registration to start researching Pokémon.");
  await expect(page.locator('#pokedex h3')).toHaveCount(0);
  await page.reload(); await page.getByRole('button', { name: 'Continue Game', exact: true }).click();
  const afterEncounter = await saved(page);
  const dex = page.getByRole('button', { name: 'Pokédex', exact: true }); await dex.focus(); await page.keyboard.press('Space');
  await expect(page.locator('#pokedex h3')).toHaveCount(0); expect(await saved(page)).toBe(afterEncounter);
  await page.getByRole('button', { name: 'Story', exact: true }).click();
  for (let i = 0; i < 4; i++) await proceed(page);
  await page.getByRole('textbox', { name: 'Your first name', exact: true }).fill('Draft 周');
  const beforeDraft = await saved(page);
  for (const name of primary.slice(1)) {
    await view(page, name);
    if (name === 'Character') for (const section of sections) await page.getByRole('group', { name: 'Character sections' }).getByRole('button', { name: section, exact: true }).click();
    expect(await saved(page)).toBe(beforeDraft);
  }
  await page.getByRole('button', { name: 'Story', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Your first name', exact: true })).toHaveValue('Draft 周');
  await proceed(page); await choose(page, 'Exchange numbers with Lucia'); await proceed(page); await choose(page, 'They / Them'); await proceed(page);
  await view(page, 'Pokédex');
  await expect(page.locator('#pokedex h3')).toHaveCount(0);
  for (const mentioned of ['Lapras', 'Floatzel', 'Magikarp', 'Charmander', 'Chikorita', 'Piplup']) await expect(page.locator('#pokedex')).not.toContainText(mentioned);
  await view(page, 'Party'); await expect(page.locator('#party li')).toHaveCount(0);
});
