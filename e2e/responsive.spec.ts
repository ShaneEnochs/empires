import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  checkpointRecord, enterWatchtower, expectCharacter, expectPassage, openPanel, panelNames, startGame,
  returnToStory,
} from './helpers';

async function expectLayout(page: Page): Promise<void> {
  const layout = await page.evaluate(() => {
    const bounds = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width, height: rect.height,
        clipped: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1 };
    };
    return {
      width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth,
      controls: [...document.querySelectorAll('button, input')].filter(element => element.getClientRects().length).map(bounds),
      panels: [...document.querySelectorAll('section[aria-labelledby]')].filter(element => element.getClientRects().length).map(bounds),
    };
  });
  expect(layout.width).toBe(page.viewportSize()!.width);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width + 1);
  for (const control of layout.controls) {
    expect(control.left).toBeGreaterThanOrEqual(0);
    expect(control.right).toBeLessThanOrEqual(layout.width);
    expect(control.width).toBeGreaterThanOrEqual(44);
    expect(control.height).toBeGreaterThanOrEqual(44);
    expect(control.clipped).toBe(false);
  }
  for (const panel of layout.panels) {
    expect(panel.left).toBeGreaterThanOrEqual(0);
    expect(panel.right).toBeLessThanOrEqual(layout.width);
    expect(panel.clipped).toBe(false);
  }
}

for (const width of [320, 375, 768, 1280]) {
  test.describe(width + 'px reading interface', () => {
    test.use({ viewport: { width, height: 900 }, isMobile: width <= 375, hasTouch: width <= 375 });

    test('choices, keyboard focus, and exclusive inline views remain usable', async ({ page }) => {
      await startGame(page);
      await expectLayout(page);
      await page.keyboard.press('Tab');
      const choice = page.getByRole('button', { name: 'Speak to the messenger', exact: true });
      await expect(choice).toBeFocused();
      await expect(choice).toBeInViewport();
      const outline = await choice.evaluate(element => {
        const style = getComputedStyle(element);
        return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
      });
      expect(outline.style).not.toBe('none');
      expect(outline.width).toBeGreaterThanOrEqual(2);
      for (const name of panelNames) {
        await openPanel(page, name);
        await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByRole('region')).toHaveCount(1);
        await expect(page.getByRole('navigation', { name: 'Passage actions' })).toHaveCount(0);
        await expectLayout(page);
      }
      await expect(page.getByRole('group', { name: 'Game tools' }).getByRole('button')).toHaveCount(1);
      await returnToStory(page);
      await choice.click();
      await expectPassage(page, 'A Quiet Warning');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await expectPassage(page, 'The Empty Chair');
      await expectCharacter(page, ['Alexander', '2.5', '4', 'Yes']);
      await expectLayout(page);
    });

    test('name input and checkpoint recovery remain visible and usable', async ({ page }) => {
      await startGame(page);
      await page.getByRole('button', { name: 'Choose a preferred name and background', exact: true }).click();
      const field = page.getByRole('textbox', { name: 'Preferred name', exact: true });
      await expect(field).toBeEditable();
      await expect(field).toBeInViewport();
      await expectLayout(page);
      const name = 'Reader ' + width;
      await field.fill(name);
      await field.press('Enter');
      await expectPassage(page, 'Choose Your Background');
      const saved = await checkpointRecord(page);
      for (const panel of panelNames) await openPanel(page, panel);
      await expectLayout(page);
      await returnToStory(page);
      await enterWatchtower(page);
      await expectLayout(page);
      await page.getByRole('button', { name: 'Try Again', exact: true }).click();
      await expectPassage(page, 'Choose Your Background');
      await expectCharacter(page, [name, '1', '5', 'No']);
      expect(await checkpointRecord(page)).toBe(saved);
      await expectLayout(page);
    });
  });
}
