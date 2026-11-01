import { expect, test } from '@playwright/test';
import {
  choose, expectPassage, expectStartup, openPanel, panelNames, reachBriefing,
  returnToStory, startGame,
} from './helpers';

for (const width of [320, 375, 768, 1280]) {
  test('compact tabs have one indicator and centered enlarged chapter/title at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expectStartup(page);
    const startup = page.getByRole('heading', { level: 1 });
    const base = await startup.evaluate(element => ({ size: parseFloat(getComputedStyle(element).fontSize), align: getComputedStyle(element).textAlign }));
    expect(base.align).toBe('center');
    await page.keyboard.press('Tab');
    const newGame = page.getByRole('button', { name: 'New Game', exact: true });
    await expect(newGame).toBeFocused();
    await expect(newGame).toBeInViewport();
    await page.keyboard.press('Enter');
    await expectPassage(page, 'The Last Ferry');
    if (width === 320) {
      // Exercise the wider Linux fallback too, including the bold active label.
      await page.addStyleTag({ content: '.view-navigation button { font-family: "DejaVu Sans", sans-serif; }' });
    }
    const navigation = page.getByRole('navigation', { name: 'Reading views' });
    const buttons = navigation.getByRole('button');
    await expect(buttons).toHaveText(['Story', 'Character', 'Journal', 'People']);
    const dimensions = await buttons.evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const range = document.createRange();
      range.selectNodeContents(element);
      const text = range.getBoundingClientRect();
      return { width: rect.width, height: rect.height, y: rect.y, font: parseFloat(style.fontSize),
        textHeight: text.height, lineHeight: parseFloat(style.lineHeight), textWidth: text.width };
    }));
    for (const rect of dimensions) {
      expect(Math.abs(rect.width - dimensions[0]!.width)).toBeLessThanOrEqual(1);
      expect(rect.height).toBe(44);
      expect(rect.y).toBe(dimensions[0]!.y);
      expect(rect.font).toBeGreaterThanOrEqual(13.5);
      expect(rect.font).toBeLessThanOrEqual(14.5);
      expect(rect.textHeight).toBeLessThanOrEqual(rect.lineHeight);
      expect(rect.textWidth).toBeLessThanOrEqual(rect.width);
    }
    for (const name of ['Story', ...panelNames]) {
      const button = navigation.getByRole('button', { name, exact: true });
      await button.hover();
      await expect(button).toHaveCSS('text-decoration-line', 'none');
      await page.mouse.down();
      await expect(button).toHaveCSS('text-decoration-line', 'none');
      await page.mouse.up();
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(button).toHaveCSS('text-decoration-line', 'none');
      const label = await button.evaluate(element => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return { height: element.getBoundingClientRect().height, textHeight: range.getBoundingClientRect().height,
          lineHeight: parseFloat(getComputedStyle(element).lineHeight) };
      });
      expect(label.height).toBe(44);
      expect(label.textHeight).toBeLessThanOrEqual(label.lineHeight);
      await button.focus();
      await page.keyboard.press('Space');
      await expect(button).toHaveCSS('text-decoration-line', 'none');
      const indicators = await buttons.evaluateAll(elements => elements.map(element => {
        const style = getComputedStyle(element);
        return { pressed: element.getAttribute('aria-pressed'), width: parseFloat(style.borderBottomWidth), color: style.borderBottomColor };
      }));
      expect(indicators.filter(indicator => indicator.color !== 'rgba(0, 0, 0, 0)')).toHaveLength(1);
      expect(indicators.find(indicator => indicator.pressed === 'true')!.width).toBe(3);
      await expect(page.getByRole('button', { name: 'New Game', exact: true })).toHaveCount(0);
    }
    await navigation.getByRole('button', { name: 'Story', exact: true }).focus();
    await page.keyboard.press('Tab');
    const character = navigation.getByRole('button', { name: 'Character', exact: true });
    await expect(character).toBeFocused();
    await expect(character).toHaveCSS('text-decoration-line', 'none');
    expect(await character.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
    await returnToStory(page);
    const heading = page.locator('#passage-heading');
    await expect(heading).toHaveCSS('text-align', 'center');
    const size = await heading.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
    const expectedSize = Math.max(1.98 * 16, Math.min(width * 0.044, 2.64 * 16));
    expect(Math.abs(size - expectedSize)).toBeLessThan(0.1);
    const chapter = page.locator('.chapter-label');
    await expect(chapter).toHaveCSS('text-align', 'center');
    await expect(chapter).toHaveCSS('font-size', '14.4px');
    const geometry = await page.evaluate(() => {
      const tabs = document.querySelector('.view-navigation')!.getBoundingClientRect();
      const chapter = document.querySelector('.chapter-label')!.getBoundingClientRect();
      const header = document.querySelector('.reading-header')!.getBoundingClientRect();
      return { gap: chapter.top - tabs.bottom, chapterHeight: chapter.height, headerHeight: header.height,
        scrollPadding: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) };
    });
    expect(geometry.gap).toBe(0);
    expect(geometry.chapterHeight).toBeLessThan(30);
    expect(geometry.headerHeight).toBeLessThan(75);
    expect(Math.abs(geometry.scrollPadding - geometry.headerHeight)).toBeLessThanOrEqual(1);
    await expect(page.locator('#story-content > p').first()).toHaveCSS('text-align', 'start');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });

  test('long passage titles wrap and all views support 200 percent text scaling at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await startGame(page);
    await reachBriefing(page);
    await choose(page, 'Bypass fieldwork and convene the council');
    await choose(page, 'Plan an evacuation of the lower town');
    await choose(page, 'Hire the ferry hands for three coins');
    await expectPassage(page, "Hands Who Know Tonight's Water");
    const heading = page.locator('#passage-heading');
    const metrics = await heading.evaluate(element => ({ height: element.getBoundingClientRect().height, line: parseFloat(getComputedStyle(element).lineHeight) }));
    if (width <= 375) expect(metrics.height).toBeGreaterThan(metrics.line * 1.5);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    for (const view of ['Story', ...panelNames]) {
      if (view === 'Story') await returnToStory(page); else await openPanel(page, view as typeof panelNames[number]);
      const active = page.getByRole('heading', { level: view === 'Story' ? 1 : 2 });
      await expect(active).toBeFocused();
      const rect = await active.boundingBox();
      const header = await page.locator('.reading-header').boundingBox();
      expect(rect!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      for (const button of await page.getByRole('navigation', { name: 'Reading views' }).getByRole('button').all()) {
        const box = await button.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        await expect(button).toHaveCSS('text-decoration-line', 'none');
      }
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await expect(page.locator('.reading-header')).toBeInViewport();
    }
    const motion = await page.locator('button').first().evaluate(element => ({ transition: getComputedStyle(element).transitionDuration, animation: getComputedStyle(element).animationName }));
    expect(motion).toEqual({ transition: '0s', animation: 'none' });
  });
}
