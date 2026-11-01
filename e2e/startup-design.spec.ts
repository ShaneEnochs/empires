import { titlePage } from '../src/title-page';
import { expect, test } from '@playwright/test';
import { checkpointRecord, crisisKey, expectPassage } from './helpers';

for (const width of [320,375,768,1280]) {
  test('title screen and replacement dialog remain accessible at '+width+'px', async ({page}) => {
    await page.setViewportSize({width,height:900});
    page.on('dialog', () => { throw new Error('Native confirmation must not open'); });
    await page.goto('/');
    const heading=page.getByRole('heading',{level:1});
    await expect(heading).toBeFocused();
    await expect(heading).toHaveCSS('outline-style','none');
    await expect(heading).toHaveCSS('text-align','center');
    await expect(page.locator('.startup-description')).toHaveText(titlePage.description);
    const start=page.getByRole('button',{name:titlePage.newGameLabel,exact:true});
    await expect(start).toHaveClass('primary-action');
    await page.keyboard.press('Tab'); await expect(start).toBeFocused();
    expect(await start.evaluate(e=>parseFloat(getComputedStyle(e).outlineWidth))).toBeGreaterThanOrEqual(2);
    await page.keyboard.press('Enter');
    await expectPassage(page,'The Last Ferry');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const saved=await checkpointRecord(page);
    await page.reload();
    await expect(page.getByRole('button',{name:titlePage.continueGameLabel,exact:true})).toHaveClass('primary-action');
    await expect(start).not.toHaveClass('primary-action');
    await start.click();
    const dialog=page.getByRole('dialog',{name:'Start a new game?',exact:true});
    const cancel=dialog.getByRole('button',{name:'Cancel',exact:true});
    const approve=dialog.getByRole('button',{name:'Start New Game',exact:true});
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Tab');await expect(approve).toBeFocused();
    await page.keyboard.press('Tab');await expect(cancel).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);await expect(start).toBeFocused();
    expect(await checkpointRecord(page)).toBe(saved);
    await start.click(); await expect(cancel).toBeFocused();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const box=await dialog.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);
    await page.evaluate(()=>{
      let writes=0;Object.defineProperty(window,'__confirmationWrites',{get:()=>writes});
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){ writes++;return original.call(this,key,value); };
    });
    await approve.evaluate((e:HTMLButtonElement)=>{e.click();e.click();});
    await expectPassage(page,'The Last Ferry');
    expect(await page.evaluate(()=>Reflect.get(window,'__confirmationWrites'))).toBe(1);
  });
}

test('approval rechecks storage and a failed replacement preserves bytes and startup',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:titlePage.newGameLabel,exact:true}).click();
  const saved=await checkpointRecord(page);await page.reload();
  await page.getByRole('button',{name:titlePage.newGameLabel,exact:true}).click();
  await page.evaluate(key=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(name,value){if(name===key)throw new DOMException('Full','QuotaExceededError');return original.call(this,name,value);};
  },crisisKey);
  await page.getByRole('dialog').getByRole('button',{name:'Start New Game',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('The new game was not started because it could not be saved.');
  expect(await checkpointRecord(page)).toBe(saved);
  await expect(page.getByRole('button',{name:titlePage.newGameLabel,exact:true})).toBeFocused();
  await expect(page.getByRole('button',{name:titlePage.continueGameLabel,exact:true})).toBeVisible();
});

test('approval rechecks availability after opening the dialog',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:titlePage.newGameLabel,exact:true}).click();await page.reload();
  await page.getByRole('button',{name:titlePage.newGameLabel,exact:true}).click();
  await page.evaluate(()=>{Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError');};});
  await page.getByRole('dialog').getByRole('button',{name:'Start New Game',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Saved progress could not be checked. A new saved game was not started.');
  await expect(page.getByRole('button',{name:titlePage.newGameLabel,exact:true})).toBeFocused();
});
