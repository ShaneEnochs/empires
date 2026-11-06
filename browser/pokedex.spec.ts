import { test, expect } from '@playwright/test';
for (const width of [320,1280]) test('public views remain inert and readable at '+width+'px', async ({page}) => {
  await page.setViewportSize({width,height:800});
  await page.goto('/');
  await page.getByRole('button',{name:'New Game',exact:true}).click();
  const key='pokemon:checkpoint:aurelian-league';
  const original=await page.evaluate(k=>localStorage.getItem(k),key);
  const tabs=page.getByRole('navigation',{name:'Reading views'}).getByRole('button');
  await expect(tabs).toHaveText(['Story','Character','Party','Pokédex']);
  const geometry=await tabs.evaluateAll(buttons=>buttons.map(button=>({y:button.getBoundingClientRect().y,width:button.getBoundingClientRect().width,height:button.getBoundingClientRect().height})));
  for(const box of geometry){expect(box.y).toBe(geometry[0]!.y);expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
  await page.getByRole('radio',{name:'Remain quiet and watch.',exact:true}).check();
  for(const name of ['Character','Party','Pokédex']){
    await page.getByRole('button',{name,exact:true}).click();
    await expect(page.locator('.chapter-label')).toBeHidden();
    if(name==='Character'){
      const group=page.getByRole('group',{name:'Character sections'});
      await expect(group.getByRole('button')).toHaveText(['Stats','Inventory']);
      await expect(page.locator('#character')).toContainText('Junior League field warden');
      await group.getByRole('button',{name:'Inventory',exact:true}).click();
      await expect(page.getByRole('heading',{name:'Inventory',level:3,exact:true})).toBeFocused();
      await expect(page.locator('#character-inventory').getByRole('listitem')).toHaveText([
        'Canvas shoulder bag × 1', 'Protective gloves × 1', 'Approved Pokémon treats (packet) × 1',
        'First-aid kit × 1', 'Handheld identification scanner × 1', 'Collection net × 1', 'Collapsible carrier × 1',
      ]);
      for(const hidden of ['Skills','Journal','People']) await expect(page.getByRole('button',{name:hidden,exact:true})).toHaveCount(0);
    }
    if(name==='Party') await expect(page.locator('#party')).toContainText("You haven't partnered with any Pokémon yet.");
    if(name==='Pokédex') {
      await expect(page.locator('#pokedex summary')).toHaveText('#0152 Chikorita');
      await page.locator('#pokedex summary').click();
      await expect(page.locator('#pokedex dd')).toHaveText(['Grass']);
      await expect(page.locator('#pokedex .discovery-status')).toHaveText('Encountered · Chapter 1: A Simple Assignment');
    }
    expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(original);
  }
  await page.getByRole('button',{name:'Story',exact:true}).click();
  await expect(page.locator('.chapter-label')).toHaveText('Chapter 1: A Simple Assignment');
  await expect(page.getByRole('radio',{name:'Remain quiet and watch.',exact:true})).toBeChecked();
  expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(original);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
