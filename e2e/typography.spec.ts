import { test, expect } from '@playwright/test';
import { titlePage } from './fixtures/title-page';
import { startGame } from './helpers';

for (const width of [320, 375, 768, 1280]) {
  test(`Public Sans reader and editable title screen at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('link[rel="stylesheet"][href*="fonts.googleapis.com/css2"]')).toHaveAttribute('href', /family=Public\+Sans/);
    await expect(page.locator('.title-screen .brand')).toHaveCount(0);
    await expect(page.getByRole('heading')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(titlePage.title);
    await expect(page.locator('.startup-description')).toHaveText(titlePage.description);
    await startGame(page);
    await expect(page.locator('.chapter-label')).toHaveCSS('font-weight', '500');
    await expect(page.locator('.chapter-label')).toHaveCSS('font-size', '20px');
    for (const selector of ['.chapter-label', '.view-navigation button', '#story-content > p']) {
      expect(await page.locator(selector).first().evaluate(element => getComputedStyle(element).fontFamily)).toContain('Public Sans');
    }
    expect(await page.locator('#story-content > p').first().evaluate(e => getComputedStyle(e).fontSize)).toBe('18px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
