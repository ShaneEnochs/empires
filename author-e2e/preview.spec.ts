import { expect, test } from '@playwright/test';
const source = `*var name "Unknown"
*var ready true
*stat name "Name"
*skill listening "Listening"
*item token "Token"
*chapter Arrival
*passage start
*title Your name
Welcome.
*input_text name "Name" -> camp
*passage camp
*title Camp
*checkpoint
*grant_skill listening
*add_item token 1
*journal arrived "Arrived at camp."
Hello, \${name}.
*choice
#Risk the bridge -> fatal [if ready == true]
#Wait safely -> end
#Hidden option -> end [if ready == false]
*passage fatal
*title Fallen
You fall.
*death
*passage end
*title Rest
You rest.
*continue finish
*passage finish
*title Finished
The end.`;

test('local upload uses the shared reader, index, restart and isolated checkpoints', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('empires:checkpoint:provincial-crisis', 'existing public save');
    localStorage.setItem('empires:checkpoint:empires-example', 'existing example save');
    const accesses: string[] = [];
    Object.defineProperty(window, '__storageCalls', { value: accesses });
    for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
      const original = Storage.prototype[method];
      Object.defineProperty(Storage.prototype, method, { value: function (...args: string[]) {
        accesses.push(method); return Reflect.apply(original, this, args);
      } });
    }
  });
  await page.goto('/author.html');
  const upload = page.getByLabel('Open a .story file');
  const open = async (name: string, text: string) => upload.setInputFiles({ name, mimeType: 'text/plain', buffer: Buffer.from(text) });
  await open('Independent draft.story', source);
  await expect(page.getByRole('status')).toContainText('5 passages');
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Ada');
  await page.getByRole('textbox', { name: 'Name', exact: true }).press('Enter');
  await expect(page.locator('#passage-heading')).toHaveText('Camp');
  await page.getByLabel('Find passage by ID or title').fill('fallen');
  await expect(page.getByRole('list', { name: 'Passage index' }).getByRole('button')).toHaveText(['fatal: Fallen']);
  await page.getByRole('button', { name: 'fatal: Fallen', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Passage reference' })).toContainText('Chapter: Arrival. Destinations: None.');
  await expect(page.locator('#passage-heading')).toHaveText('Camp');
  for (const view of ['Character', 'Journal', 'People']) {
    await page.getByRole('button', { name: view, exact: true }).click();
    if (view === 'Character') {
      await expect(page.getByRole('region', { name: 'Character', exact: true })).toContainText('Ada');
      await expect(page.getByRole('region', { name: 'Inventory', exact: true })).toContainText('Token × 1');
      await expect(page.getByRole('region', { name: 'Skills', exact: true })).toContainText('Listening');
    }
    if (view === 'Journal') await expect(page.getByRole('region', { name: 'Journal', exact: true })).toContainText('Arrived at camp.');
    if (view === 'People') await expect(page.getByRole('region', { name: 'People', exact: true })).toContainText('No people recorded yet.');
  }
  await page.getByRole('button', { name: 'Story', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Hidden option', exact: true })).toHaveCount(0);
  await page.getByRole('radio', { name: 'Risk the bridge', exact: true }).check();
  await expect(page.locator('#passage-heading')).toHaveText('Camp');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Try Again', exact: true }).click();
  await expect(page.locator('#passage-heading')).toHaveText('Camp');
  await page.getByRole('button', { name: 'Character', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Inventory', exact: true })).toContainText('Token × 1');
  await page.getByRole('button', { name: 'Story', exact: true }).click();
  await page.getByRole('radio', { name: 'Wait safely', exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('#passage-heading')).toHaveText('Rest');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('#passage-heading')).toHaveText('Finished');
  await expect(page.getByRole('navigation', { name: 'Passage actions' }).getByRole('button')).toHaveCount(0);
  await page.getByRole('button', { name: 'Restart preview', exact: true }).click();
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await expect(page.locator('#passage-heading')).toHaveText('Your name');
  await open('Replacement.story', '*passage only\n*title Replacement\nA fresh story.');
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await expect(page.locator('#passage-heading')).toHaveText('Replacement');
  await open('Replacement.story', '*passage only\n*title Revised\nUpdated prose.');
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await expect(page.locator('#passage-heading')).toHaveText('Revised');
  await open('Broken.story', '*passage broken');
  await expect(page.getByRole('status')).toContainText('Could not open story:');
  await expect(page.getByRole('button', { name: 'Restart preview', exact: true })).toBeDisabled();
  await expect(page.locator('#app')).toBeEmpty();
  expect(await page.evaluate(() => Reflect.get(window, '__storageCalls'))).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('empires:checkpoint:provincial-crisis'))).toBe('existing public save');
  expect(await page.evaluate(() => localStorage.getItem('empires:checkpoint:empires-example'))).toBe('existing example save');
});
