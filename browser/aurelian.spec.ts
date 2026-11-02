import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
const key = 'pokemon:checkpoint:aurelian-league';
async function choose(page: Page, label: string) {
  await page.getByRole('radio', {name:label,exact:true}).check();
  await page.getByRole('button', {name:'Continue',exact:true}).click();
}
async function proceed(page: Page) { await page.getByRole('button',{name:'Continue',exact:true}).click(); }
for (const [species, pronouns, nickname] of [
 ['Charmander','He / Him','Ember'], ['Chikorita','She / Her','Leaf'], ['Piplup','They / Them','Pip'],
] as const) for (const width of [320,1280]) {
 test(`${species}, ${pronouns}, nickname and resume at ${width}px`, async ({page}) => {
  await page.setViewportSize({width,height:800});
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toHaveText('The Aurelian League');
  await expect(page.getByText('Begin your Pokémon journey in the Aurelia region, where eight Laurels stand between you and the inaugural Aurelian championship.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'New Game',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('Approaching Lezano');
  const tabs = page.getByRole('navigation',{name:'Reading views'}).getByRole('button');
  await expect(tabs).toHaveText(['Story','Character','Party','Journal','People']);
  for (const tab of await tabs.all()) {const bounds=await tab.boundingBox();expect(bounds!.height).toBeGreaterThanOrEqual(44);expect(bounds!.width).toBeGreaterThanOrEqual(44);}
  await page.getByRole('button',{name:'Party',exact:true}).click();
  await expect(page.getByText("You haven't partnered with any Pokémon yet.")).toBeVisible();
  await page.getByRole('button',{name:'Story',exact:true}).click(); await proceed(page);await proceed(page);
  const input = page.getByRole('textbox',{name:'Your first name',exact:true});
  await input.fill('   ');await input.press('Enter');await expect(page.getByRole('alert')).toBeVisible();
  await input.fill('  Rowan 周  ');await input.press('Enter');
  await choose(page,pronouns);await proceed(page);
  await page.getByRole('button',{name:'People',exact:true}).click();
  await expect(page.locator('#people')).toContainText('Lucia');
  await page.getByRole('button',{name:'Story',exact:true}).click();
  await choose(page,'Wish her luck and look around the ferry');
  await choose(page,'Head outside for some peace and quiet');
  await proceed(page);await proceed(page);await proceed(page);
  for (const examine of ['Charmander','Chikorita','Piplup']) {
   await choose(page,'Examine '+examine);
   await expect(page.getByRole('heading',{level:1})).toHaveText('Meeting '+examine);
   await choose(page,'Keep looking');
  }
  await choose(page,'Examine '+species);await choose(page,'Choose '+species);
  await choose(page,'Give a nickname');
  await page.getByRole('textbox',{name:'Pokémon nickname',exact:true}).fill(nickname);
  await proceed(page);
  await expect(page.getByRole('heading',{level:1})).toHaveText('Your Journey Begins');
  const raw = await page.evaluate(key=>localStorage.getItem(key),key);
  const save=JSON.parse(raw!);expect(save.currentState.party).toEqual([{id:'starter_'+species.toLowerCase(),species,nickname}]);
  expect(save.currentState.variables.trainer_name).toBe('Rowan 周');
  expect(save.currentState.variables.use_plural_verbs).toBe(pronouns==='They / Them');
  for (const view of ['Character','Party','Journal','People']) {
   await page.getByRole('button',{name:view,exact:true}).click();
   await expect(page.getByRole('heading',{name:view,exact:true})).toBeFocused();
   if(view==='Party') await expect(page.getByRole('region',{name:'Party',exact:true}).getByRole('listitem')).toHaveText([`${nickname} (${species})`]);
   if(view==='Character') await expect(page.locator('#character dd')).toHaveText(['Rowan 周',pronouns]);
   expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(raw);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.reload();await page.getByRole('button',{name:'Continue Game',exact:true}).click();
  await page.getByRole('button',{name:'Party',exact:true}).click();
  await expect(page.locator('#party li')).toHaveText([`${nickname} (${species})`]);
  expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(raw);
 });
}
for (const species of ['Charmander','Chikorita','Piplup']) test(`keep ${species}'s species name; old saves remain isolated`,async({page})=>{
 // Intentionally seed the former namespace to verify it is left untouched.
 await page.addInitScript(()=>localStorage.setItem('empires:checkpoint:provincial-crisis','old progress'));
 await page.goto('/'); await expect(page.getByRole('button',{name:'Continue Game',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'New Game',exact:true}).click();await proceed(page);await proceed(page);
 await page.getByRole('textbox',{name:'Your first name',exact:true}).fill('Ari');await proceed(page);
 await choose(page,'They / Them');await proceed(page);
 await choose(page,'Wish her luck and look around the ferry');
 await choose(page,'Go over and speak to the two contestants');
 await proceed(page);await proceed(page);await proceed(page);
 await choose(page,'Examine '+species);await choose(page,'Choose '+species);await choose(page,'Keep the species name');
 await page.getByRole('button',{name:'Party',exact:true}).click();await expect(page.locator('#party li')).toHaveText([species]);
 expect(await page.evaluate(()=>localStorage.getItem('empires:checkpoint:provincial-crisis'))).toBe('old progress');
});
