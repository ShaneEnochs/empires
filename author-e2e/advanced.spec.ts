import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const source=readFileSync('examples/advanced-authoring.story','utf8');
for(const width of [320,375,768,1280])test('advanced example pages, keyboard choices, formatting and death at '+width,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/author.html');
 await page.getByLabel('Open a .story file').setInputFiles({name:'advanced.story',mimeType:'text/plain',buffer:Buffer.from(source)});
 await page.getByRole('button',{name:'New Game',exact:true}).click();await page.getByRole('radio',{name:'They / them',exact:true}).check();
 await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.locator('#story-content strong em')).toHaveText('Alexander');await expect(page.locator('#story-content')).toContainText('ALEXANDER');
 await expect(page.getByRole('radio')).toHaveCount(0);
 await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.locator('#story-content')).toContainText('They are waiting.');
 await page.getByRole('button',{name:'Character',exact:true}).click();await page.getByRole('button',{name:'Story',exact:true}).click();
 await expect(page.locator('#story-content')).toContainText('They are waiting.');await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.getByRole('radio',{name:'Take the advanced route (10 tokens)',exact:true})).toBeDisabled();
 await page.getByRole('radio',{name:'Risk the crossing',exact:true}).check();await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Try Again',exact:true}).click();await expect(page.locator('#story-content strong em')).toHaveText('Alexander');

 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});

test('real reader resumes page two with exact temps and no repeated rewards using private storage',async({page})=>{
 await page.goto('/author.html');
 async function mount(raw:string|null) {
  await page.evaluate(async({source,raw})=>{
   const readerPath='/src/reader.ts', storyPath='/src/story.ts';
   const {mountReader}=await import(readerPath);const {parseStory}=await import(storyPath);
   let saved=raw;Object.defineProperty(window,'__privateProgress',{configurable:true,get:()=>saved});
   mountReader(document.querySelector('#app'),{title:'Private test',identity:{storyId:'private-test',storyRevision:1},people:[]},parseStory(source),{getItem:()=>saved,setItem:(_key:string,value:string)=>{saved=value;}});
  },{source,raw});
 }
 await mount(null);await page.getByRole('button',{name:'New Game',exact:true}).click();await page.getByRole('radio',{name:'He / him',exact:true}).check();
 await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 const raw=await page.evaluate(()=>Reflect.get(window,'__privateProgress'));
 expect(JSON.parse(raw).context.page).toBe(1);
 await page.reload();await mount(raw);await page.getByRole('button',{name:'Continue Game',exact:true}).click();
 await expect(page.locator('#story-content')).toContainText('He is waiting.');
 expect(await page.evaluate(()=>Reflect.get(window,'__privateProgress'))).toBe(raw);
 await page.getByRole('button',{name:'Character',exact:true}).click();await expect(page.getByRole('region',{name:'Inventory',exact:true})).toContainText('Letter × 1');
});

test('player input cannot introduce authored markup, inline expressions or commands',async({page})=>{
 const draft='*var name ""\n*var ready true\n*passage name\n*title Name\nEnter name.\n*input_text name "Name" -> end\n*passage end\n*title End\n[b]$!{name}[/b] @{ready ${name}|no}';
 await page.goto('/author.html');await page.getByLabel('Open a .story file').setInputFiles({name:'input.story',mimeType:'text/plain',buffer:Buffer.from(draft)});
 await page.getByRole('button',{name:'New Game',exact:true}).click();
 const hostile='[i]<img src=x onerror=alert(1)>[/i] @{ready BAD|NO}';
 await page.getByRole('textbox',{name:'Name',exact:true}).fill(hostile);await page.getByRole('textbox',{name:'Name',exact:true}).press('Enter');
 await expect(page.locator('#story-content strong')).toHaveText(hostile);
 await expect(page.locator('#story-content em, #story-content img')).toHaveCount(0);
});
