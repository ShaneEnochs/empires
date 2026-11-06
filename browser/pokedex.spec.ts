import { test, expect } from '@playwright/test';
for (const width of [320,1280]) test('public views remain inert and readable at '+width+'px', async ({page}) => {
  await page.setViewportSize({width,height:800});
  await page.goto('/');
  await page.getByRole('button',{name:'New Game',exact:true}).click();
  const key='pokemon:checkpoint:aurelian-league';
  const original=await page.evaluate(k=>localStorage.getItem(k),key);
  const tabs=page.getByRole('navigation',{name:'Reading views'}).getByRole('button');
  await expect(tabs).toHaveText(['Story','Character','Party','Pokédex','People']);
  const geometry=await tabs.evaluateAll(buttons=>buttons.map(button=>({y:button.getBoundingClientRect().y,width:button.getBoundingClientRect().width,height:button.getBoundingClientRect().height})));
  for(const box of geometry){expect(box.y).toBe(geometry[0]!.y);expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
  await page.getByRole('radio',{name:'Remain quiet and watch.',exact:true}).check();
  for(const name of ['Character','Party','Pokédex','People']){
    await page.getByRole('button',{name,exact:true}).click();
    await expect(page.locator('.chapter-label')).toBeHidden();
    if(name==='Character'){
      const group=page.getByRole('group',{name:'Character sections'});
      await expect(group.getByRole('button')).toHaveText(['Stats','Skills','Inventory','Journal']);
      await expect(page.locator('#character')).toContainText('No character statistics configured.');
      for(const section of ['Skills','Inventory','Journal']){
        await group.getByRole('button',{name:section,exact:true}).click();
        await expect(page.getByRole('heading',{name:section,level:3,exact:true})).toBeFocused();
        if(section==='Journal') await expect(page.locator('#character')).toContainText('Cassius');
      }
    }
    if(name==='Party') await expect(page.locator('#party')).toContainText("You haven't partnered with any Pokémon yet.");
    if(name==='Pokédex') await expect(page.locator('#pokedex')).toContainText('No Pokémon recorded yet.');
    if(name==='People') await expect(page.locator('#people')).toContainText('Cassius');
    expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(original);
  }
  await page.getByRole('button',{name:'Story',exact:true}).click();
  await expect(page.locator('.chapter-label')).toHaveText('Chapter 1: A Simple Assignment');
  await expect(page.getByRole('radio',{name:'Remain quiet and watch.',exact:true})).toBeChecked();
  expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(original);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
