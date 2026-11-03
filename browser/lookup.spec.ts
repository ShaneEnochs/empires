import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
const key='pokemon:checkpoint:aurelian-league';
async function proceed(page:Page){await page.getByRole('button',{name:'Continue',exact:true}).click();}
async function choose(page:Page,name:string){await page.getByRole('radio',{name,exact:true}).check();await proceed(page);}
async function harbor(page:Page){
 await page.goto('/');await page.getByRole('button',{name:'New Game',exact:true}).click();
 await page.getByRole('button',{name:'Pokédex',exact:true}).click();
 await expect(page.locator('#pokedex')).toContainText('Install the Pokédex app at registration');
 await page.getByRole('button',{name:'Story',exact:true}).click();
 await choose(page,"See what's happening at the café");
 for(let i=0;i<4;i++)await proceed(page);
 await page.getByRole('textbox',{name:'Your first name',exact:true}).fill('Ari');await proceed(page);
 await choose(page,'Politely decline');await proceed(page);await choose(page,'They / Them');await proceed(page);
 await choose(page,"Say you'd like to look around before docking");
 await choose(page,'Go up to the observation deck instead');await proceed(page);
 await choose(page,'Ignore him and keep walking');await proceed(page);
 await page.getByRole('button',{name:'Pokédex',exact:true}).click();
 await expect(page.locator('#pokedex')).toContainText('No Pokémon recorded yet.');
 await page.getByRole('button',{name:'Story',exact:true}).click();await proceed(page);
}
for(const width of [320,1280])test('explicit lookup card and accessible collapsed entries preserve progress at '+width,async({page})=>{
 await page.setViewportSize({width,height:850});await harbor(page);
 await expect(page.locator('.pokedex-card')).toHaveCount(0);
 await choose(page,'Look up Machoke in your new Pokédex');
 const card=page.getByRole('complementary',{name:'Pokédex lookup: Machoke'});
 await expect(card).toBeVisible();await expect(card).toContainText('#0067 Machoke');
 await expect(card).toContainText('Fighting');await expect(card).toContainText('Superpower Pokémon');
 await expect(card).toContainText('Machoke has an exceptionally strong');
 await expect(card.locator('.pokemon-trainer-notes li')).toHaveCount(3);
 await expect(card).toContainText('Never remove');
 await expect(card.getByRole('link')).toHaveCount(0);
 await expect(card.locator('.pokemon-observations li')).toHaveCount(1);
 const raw=await page.evaluate(key=>localStorage.getItem(key),key);
 await page.getByRole('button',{name:'Pokédex',exact:true}).click();
 const summary=page.locator('#pokedex summary');await expect(summary).toHaveText(['#0067 Machoke']);
 const details=page.locator('#pokedex details');await expect(details).not.toHaveAttribute('open','');
 const bounds=await summary.boundingBox();expect(bounds!.height).toBeGreaterThanOrEqual(44);
 await summary.focus();await page.keyboard.press('Enter');await expect(details).toHaveAttribute('open','');
 await expect(details.locator('dd')).toHaveText(['Fighting','Superpower Pokémon']);
 await expect(details.locator('.pokemon-trainer-notes li')).toHaveCount(3);
 await expect(details.getByRole('link')).toHaveCount(0);
 await page.keyboard.press('Space');await expect(details).not.toHaveAttribute('open','');
 expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(raw);
 await page.reload();await page.getByRole('button',{name:'Continue Game',exact:true}).click();
 await expect(page.locator('.pokedex-card')).toContainText('#0067 Machoke');
 await page.getByRole('button',{name:'Pokédex',exact:true}).click();await page.locator('#pokedex summary').click();
 await expect(page.locator('#pokedex .pokemon-observations li')).toHaveCount(1);
 expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(raw);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const response of ['scan','help'])test('restaurant '+response+' keeps its authored consequences and scan-only card',async({page})=>{
 await harbor(page);await choose(page,'Look up Wattrel in your new Pokédex');await proceed(page);
 await choose(page,'Find somewhere nice to eat');await expect(page.locator('.pokedex-card')).toHaveCount(0);
 await choose(page,response==='scan'?'Look up Wattrel in the Pokédex before getting involved':'Steady the awning frame while someone moves the lantern');
 if(response==='scan'){
  await expect(page.locator('.pokedex-card')).toContainText('#0940 Wattrel');
  await expect(page.locator('.pokedex-card .pokemon-observations li')).toHaveText([/delaying your help/]);
  await expect(page.getByText(/lantern strikes the edge of a table and breaks/)).toBeVisible();
 }else await expect(page.locator('.pokedex-card')).toHaveCount(0);
 await choose(page,'Fetch a step stool so she can reach the knot safely');
 await choose(page,'Look up Wattrel now and record what happened');
 await expect(page.locator('.pokedex-card .pokemon-observations li')).toHaveText([/was later freed/]);
 await expect(page.locator('.pokedex-card .pokemon-trainer-notes li')).toHaveCount(3);
 await expect(page.locator('.pokedex-card').getByRole('link')).toHaveCount(0);
 const raw=await page.evaluate(key=>localStorage.getItem(key),key),saved=JSON.parse(raw!);
 expect(saved.currentState.variables.livia_impression).toBe(response==='scan'?'distracted':'helpful');
 expect(saved.currentState.variables.credits).toBe(88);
 expect(saved.currentState.journal.some((event:{id:string})=>event.id==='delayed_restaurant_help')).toBe(response==='scan');
 expect(saved.currentState.journal.some((event:{id:string})=>event.id==='livia_disappointed')).toBe(response==='scan');
 await page.getByRole('button',{name:'Pokédex',exact:true}).click();
 await expect(page.locator('#pokedex summary')).toHaveText(['#0940 Wattrel']);await page.locator('#pokedex summary').click();
 const notes=page.locator('#pokedex .pokemon-observations li');await expect(notes).toHaveCount(response==='scan'?3:2);
 await expect(notes.first()).toContainText('ride the breeze');await expect(notes.last()).toContainText('was later freed');
 expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(raw);
});
