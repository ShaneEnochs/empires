import { titlePage } from './fixtures/title-page';
import { expect, test } from '@playwright/test';
import { choose, expectPassage, openPanel, returnToStory, expectStartup, reachBriefing, centerWithEvidence } from './helpers';

for (const width of [320, 375, 768, 1280]) {
  test('three responsive tabs and the chapter stay together while scrolling at ' + width + 'px', async ({ page }) => {
    // A short viewport exercises substantial real scrolling even on brief passages.
    await page.setViewportSize({ width, height: 240 });
    await page.goto('/');
    await expect(page.locator('.chapter-label')).toHaveCount(0);
    await expectStartup(page);
    await page.getByRole('button', { name: titlePage.newGameLabel, exact: true }).click();
    const navigation = page.getByRole('navigation', { name: 'Reading views' });
    await expect(navigation.getByRole('button')).toHaveText(['Story', 'Inventory', 'Pokédex']);
    const dimensions = await navigation.getByRole('button').evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }));
    for (const [index, bounds] of dimensions.entries()) {
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.y).toBe(dimensions[0]!.y);
      expect(Math.abs(bounds.width - dimensions[0]!.width)).toBeLessThanOrEqual(1);
      expect(bounds.height).toBe(44);
    }
    await expect(page.locator('.chapter-label')).toHaveText('The Writ');
    await page.getByRole('radio', { name: 'Keep the name Mara Vale and begin', exact: true }).check();
    await expect(page.locator('.chapter-label')).toHaveText('The Writ');
    await reachBriefing(page);
    await centerWithEvidence(page);
    await expect(page.locator('.chapter-label')).toHaveText('Night Center');

    for (const view of ['Story', 'Inventory', 'Pokédex'] as const) {
      if (view === 'Story') await returnToStory(page); else await openPanel(page, view);
      await expect(page.getByRole('button', { name: view, exact: true })).toHaveAttribute('aria-pressed', 'true');
      const heading = page.getByRole('heading', { level: view === 'Story' ? 1 : 2 });
      await expect(heading).toBeFocused();
      const bounds = await heading.boundingBox();
      const header = await page.locator('.reading-header').boundingBox();
      expect(bounds!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1);
      await page.evaluate(() => window.scrollTo(0, 500));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(view === 'Story' ? 120 : 0);
      const position = await page.evaluate(() => {
        const wrapper = document.querySelector('.reading-header')!;
        const tabs = document.querySelector('.view-navigation')!.getBoundingClientRect();
        const chapter = document.querySelector('.chapter-label')!.getBoundingClientRect();
        return {
          top: tabs.top, tabsBottom: tabs.bottom, chapterTop: chapter.top,
          chapterBottom: chapter.bottom, chapterHidden: document.querySelector<HTMLElement>('.chapter-label')!.hidden, headerBottom: wrapper.getBoundingClientRect().bottom, viewport: innerHeight,
          position: getComputedStyle(wrapper).position, background: getComputedStyle(wrapper).backgroundColor,
          scrollWidth: document.documentElement.scrollWidth, width: innerWidth,
        };
      });
      expect(position.position).toBe('sticky');
      expect(position.top).toBe(0);
      expect(position.chapterHidden).toBe(view !== 'Story');
      if (view === 'Story') {
        expect(position.chapterTop).toBe(position.tabsBottom);
        expect(position.chapterBottom).toBeLessThan(position.viewport);
      } else expect(position.headerBottom).toBe(position.tabsBottom);
      expect(position.background).not.toBe('rgba(0, 0, 0, 0)');
      expect(position.scrollWidth).toBeLessThanOrEqual(position.width);
      await expect(page.locator('.chapter-label')).toHaveText('Night Center');
      if (view === 'Story') await expect(page.locator('.chapter-label')).toBeVisible();
      else await expect(page.locator('.chapter-label')).toBeHidden();
    }
    // Keyboard focus on a tab stays visible above scrolled reading content.
    await navigation.getByRole('button', { name: 'Story', exact: true }).focus();
    await page.keyboard.press('Tab');
    const character = navigation.getByRole('button', { name: 'Inventory', exact: true });
    await expect(character).toBeFocused();
    await expect(character).toBeInViewport();
    const outline = await character.evaluate(element => getComputedStyle(element).outlineStyle);
    expect(outline).not.toBe('none');
  });
}
