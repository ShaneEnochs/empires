import { test, expect } from '@playwright/test';
test('author preview supports party commands and preserves public saves without uploading files',async({page})=>{
 await page.goto('/author.html');
 await page.evaluate(()=>localStorage.setItem('pokemon:checkpoint:aurelian-league','public bytes'));
 await page.getByLabel('Open a .story file',{exact:true}).setInputFiles({
  name:'party.story',mimeType:'text/plain',buffer:Buffer.from(`*var nickname ""
*pokemon partner "Piplup"
*passage name
*title Nickname
Your partner needs a name.
*input_text nickname "Nickname" -> join
*passage join
*title Joined
*checkpoint
*add_pokemon partner nickname
Your Pokémon joins you.

*show_if has_pokemon partner
Companion: \${nickname}.
*continue leave
*passage leave
*title Left
*remove_pokemon partner
*show_if lacks_pokemon partner
Your companion has left.

This private recovery fixture ends here.
*death`),
 });
 await page.getByRole('button',{name:'New Game',exact:true}).click();
 await page.getByRole('textbox',{name:'Nickname',exact:true}).fill('<b>Pip</b>');
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.getByRole('button',{name:'Party',exact:true})).toHaveCount(0);
 await expect(page.locator('#story-content')).toContainText('Companion: <b>Pip</b>.');
 await expect(page.locator('#story-content b')).toHaveCount(0);
 await page.getByRole('button',{name:'Story',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.getByRole('button',{name:'Party',exact:true})).toHaveCount(0);
 await expect(page.locator('#story-content')).not.toContainText('Companion:');
 await page.getByRole('button',{name:'Story',exact:true}).click();
 await page.getByRole('button',{name:'Try Again',exact:true}).click();
 await expect(page.getByRole('button',{name:'Party',exact:true})).toHaveCount(0);
 await expect(page.locator('#story-content')).toContainText('Companion: <b>Pip</b>.');
 expect(await page.evaluate(()=>localStorage.getItem('pokemon:checkpoint:aurelian-league'))).toBe('public bytes');
 await page.getByRole('button',{name:'Restart preview',exact:true}).click();
 await page.getByRole('button',{name:'New Game',exact:true}).click();
 await expect(page.getByRole('button',{name:'Party',exact:true})).toHaveCount(0);
 await expect(page.locator('#story-content')).not.toContainText('Companion:');
});
