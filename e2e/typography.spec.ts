import { test, expect } from '@playwright/test';
import { titlePage } from '../src/title-page';
import { startGame } from './helpers';

for (const width of [320, 375, 768, 1280]) {
  test(`bundled literary font and editable title screen at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const fontRequests: string[] = [];
    page.on('request', request => { if (request.resourceType() === 'font') fontRequests.push(request.url()); });
    await page.goto('/');
    await expect(page.locator('.brand')).toHaveText(titlePage.brand);
    await expect(page.locator('h1')).toHaveText(titlePage.title);
    await expect(page.locator('.startup-description')).toHaveText(titlePage.description);
    await startGame(page);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('500 20px "Source Serif 4"'))).toBe(true);
    expect(fontRequests.length).toBeGreaterThan(0);
    expect(fontRequests.every(url => url.startsWith('http://127.0.0.1:4175/assets/') && url.endsWith('.woff2'))).toBe(true);
    await expect(page.locator('.chapter-label')).toHaveCSS('font-weight', '500');
    await expect(page.locator('.chapter-label')).toHaveCSS('font-size', '20px');
    expect(await page.locator('.chapter-label').evaluate(e => getComputedStyle(e).fontFamily)).toContain('Source Serif 4');
    expect(await page.locator('.view-navigation button').first().evaluate(e => getComputedStyle(e).fontFamily)).toContain('system-ui');
    expect(await page.locator('#story-content > p').first().evaluate(e => getComputedStyle(e).fontSize)).toBe('18px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
