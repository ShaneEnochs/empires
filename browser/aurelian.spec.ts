import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const key = 'pokemon:checkpoint:aurelian-league';

async function choose(page: Page, label: string) {
  await page.getByRole('radio', { name: label, exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

async function proceed(page: Page) {
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

const routes = [
  {
    pronouns: 'He / Him', first: "See what's happening at the café",
    contact: 'Exchange numbers with Lucia', encounter: 'Introduce yourself to the two contestants',
    additionalPerson: 'Cassius',
  },
  {
    pronouns: 'She / Her', first: 'Find a place by the windows',
    contact: 'Politely decline', encounter: 'Stay nearby and listen without interrupting',
    additionalPerson: null,
  },
  {
    pronouns: 'They / Them', first: 'Find a place by the windows',
    contact: 'Exchange numbers with Lucia', encounter: 'Go up to the observation deck instead',
    additionalPerson: null,
  },
] as const;

for (const width of [320, 1280]) for (const route of routes) {
  test('complete Lezano route, ' + route.pronouns + ', ' + route.encounter + ' at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Aurelian League');
    await page.getByRole('button', { name: 'New Game', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Approaching Lezano Aboard the Portia');
    const tabs = page.getByRole('navigation', { name: 'Reading views' }).getByRole('button');
    await expect(tabs).toHaveText(['Story', 'Character', 'Party', 'Pokédex', 'People']);
    for (const tab of await tabs.all()) {
      const bounds = await tab.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
    }

    await expect(page.locator('.chapter-label')).toHaveText('Chapter 1: The Crossing');
    await choose(page, route.first);
    await expect(page.locator('#passage-heading')).toHaveClass(/visually-hidden/);
    await proceed(page);
    await proceed(page);
    await proceed(page);
    await proceed(page);

    const nameField = page.getByRole('textbox', { name: 'Your first name', exact: true });
    await nameField.fill('   ');
    await nameField.press('Enter');
    await expect(page.getByRole('alert')).toBeVisible();
    await nameField.fill(' Rowan 周 ');
    await nameField.press('Enter');
    await expect(page.getByText('Hi, Rowan 周!', { exact: false })).toBeVisible();

    await choose(page, route.contact);
    await proceed(page);
    await expect(page.getByText(/I use she and her/)).toBeVisible();
    await choose(page, route.pronouns);
    await proceed(page);

    await page.getByRole('button', { name: 'People', exact: true }).click();
    await expect(page.locator('#people')).toContainText('Lucia');
    await page.getByRole('button', { name: 'Story', exact: true }).click();
    await choose(page, 'Ask what she knows about the Laurels');
    await proceed(page);
    await choose(page, route.encounter);
    await proceed(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lezano Harbor');
    await expect(page.locator('.chapter-label')).toHaveText('Chapter 2: Orientation');
    await expect(page.getByText(/CHAMP/)).toBeVisible();
    const confront = route.pronouns === 'He / Him';
    await choose(page, confront ? 'Confront him about his rudeness' : 'Ignore him and keep walking');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lezano Harbor');
    await expect(page.getByText(/Once your feet are finally on solid ground/)).toBeVisible();
    await expect(page.getByText(confront ? /Kinda rude there/ : /You decide he isn't worth the trouble/)).toBeVisible();
    await proceed(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lezano Harbor');
    await expect(page.getByText(/starting balance of 100 credits/)).toBeVisible();
    await expect(page.getByText(/Pokédex app/)).toBeVisible();
    await proceed(page); // Opt-in harbor lookup
    await page.getByRole('button', { name: 'Pokédex', exact: true }).click();
    await expect(page.locator('#pokedex')).toContainText("You haven't encountered any Pokémon yet.");
    await page.getByRole('button', { name: 'Story', exact: true }).click();
    const hotel = route.pronouns === 'He / Him';
    await choose(page, hotel ? 'Look up Machoke in your new Pokédex' : 'Put your phone away and make some plans');
    if (hotel) {
      await page.getByRole('button', { name: 'Pokédex', exact: true }).click();
      await expect(page.locator('#pokedex')).toContainText('Machoke');
      await expect(page.locator('#pokedex')).not.toContainText('Wingull');
      await page.getByRole('button', { name: 'Story', exact: true }).click();
      await proceed(page);
    }
    await choose(page, hotel ? 'Head to the hotel and check out your room' : 'Find somewhere nice to eat');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(hotel ? 'The Portico Hotel' : 'The Salt and Thyme');
    await expect(page.locator('#passage-heading')).toHaveClass(/visually-hidden/);
    const quickScan = route.pronouns === 'They / Them';
    if (hotel) {
      await choose(page, 'Offer to help the contestant find her suitcase');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Following a Lead');
      await choose(page, 'Ask the clerk to compare the ferry and hotel delivery lists');
      await proceed(page); // Victra has a lead but no suitcase yet
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Last Step');
      await choose(page, 'Go with Victra and help retrieve the suitcase');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('A Room at Last');
      await proceed(page); // Wingull balcony
      await choose(page, 'Look up Wingull and save a note about your visitor');
      await proceed(page);
    } else {
      await choose(page, quickScan
        ? 'Look up Wattrel in the Pokédex before getting involved'
        : 'Help the server clear diners away from the swinging lantern');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('A Difficult Rescue');
      await choose(page, 'Bring a clean cloth to cover and calm the Wattrel');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('A Table by the Water');
      await choose(page, quickScan
        ? 'Put your phone away and enjoy your lunch'
        : 'Look up Wattrel now and record what happened');
      if (!quickScan) await proceed(page);
    }
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Plans for the Afternoon');
    const meeting = route.contact === 'Exchange numbers with Lucia';
    await expect(page.getByRole('radio')).toHaveCount(2);
    if (meeting) await expect(page.getByText(/Lucia's name appears on the screen/)).toBeVisible();
    else await expect(page.getByText(/The map marks a direct route/)).toBeVisible();
    await choose(page, meeting ? 'Agree to meet Lucia by the harbor fountain' : 'Take the scenic route through the shopping streets');
    const endingTitle = meeting ? 'Meeting Lucia' : 'A Longer Walk';
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(endingTitle);
    await expect(page.locator('#passage-heading')).toHaveClass(/visually-hidden/);
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0);

    const raw = await page.evaluate(storageKey => localStorage.getItem(storageKey), key);
    const save = JSON.parse(raw!);
    expect(save.storyRevision).toBe(8);
    expect(save.currentState.variables.credits).toBe(hotel ? 100 : 88);
    expect(save.currentState.variables.dex_installed).toBe(true);
    expect(save.currentState.variables.victra_case).toBe(hotel ? 'recovered' : 'none');
    expect(save.currentState.variables.hotel_response).toBe(hotel ? 'help' : 'none');
    expect(save.currentState.variables.restaurant_response).toBe(hotel ? 'none' : quickScan ? 'scan' : 'clear');
    expect(save.currentState.variables.livia_impression).toBe(hotel ? 'none' : quickScan ? 'distracted' : 'helpful');
    expect(save.currentState.variables.rival_response).toBe(confront ? 'confront' : 'ignore');
    expect(save.currentState.inventory).toEqual({ league_badge: 1, city_map: 1, hotel_assignment: 1 });
    expect(save.currentState.variables.trainer_name).toBe('Rowan 周');
    expect(save.currentState.variables.pronouns).toBe(route.pronouns);
    expect(save.currentState.variables.lucia_contact).toBe(route.contact === 'Exchange numbers with Lucia');
    expect(save.currentState.party).toEqual([]);

    await page.getByRole('button', { name: 'Party', exact: true }).click();
    await expect(page.getByText("You haven't partnered with any Pokémon yet.")).toBeVisible();
    await page.getByRole('button', { name: 'People', exact: true }).click();
    if (route.additionalPerson) {
      await expect(page.locator('#people')).toContainText(route.additionalPerson);
    } else {
      await expect(page.locator('#people')).not.toContainText('Cassius');
    }
    await expect(page.locator('#character')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.reload();
    await page.getByRole('button', { name: 'Continue Game', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(endingTitle);
    await page.getByRole('button', { name: 'Character', exact: true }).click();
    await expect(page.locator('#character dd')).toHaveText(['Rowan 周', route.pronouns, String(hotel ? 100 : 88)]);
    expect(await page.evaluate(storageKey => localStorage.getItem(storageKey), key)).toBe(raw);
  });
}

test('old Empire saves remain isolated and no Pokémon join during the ferry', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('empires:checkpoint:provincial-crisis', 'old progress'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continue Game', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await choose(page, 'Find a place by the windows');
  await page.getByRole('button', { name: 'Party', exact: true }).click();
  await expect(page.locator('#party li')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('empires:checkpoint:provincial-crisis'))).toBe('old progress');
});


test('People records Lucia at introduction and reveals only learned details across saves', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await expect(page.locator('#people')).toContainText('No people recorded yet.');
  await page.getByRole('button', { name: 'Story', exact: true }).click();

  await choose(page, 'Find a place by the windows');
  await proceed(page); // Ferry context
  await proceed(page); // League advertisement
  await proceed(page); // Advertisement's second reading page
  await proceed(page); // Lucia has introduced herself; name input

  await page.getByRole('button', { name: 'People', exact: true }).click();
  const panel = page.locator('#people');
  const facts = panel.getByRole('list', { name: 'What you know about Lucia' }).getByRole('listitem');
  await expect(panel.getByRole('heading', { name: 'Lucia', exact: true })).toBeVisible();
  await expect(facts).toHaveCount(1);
  await expect(facts.first()).toContainText('journalist');
  await expect(panel).not.toContainText('Floatzel');
  await expect(panel).not.toContainText('wetlands');

  await page.getByRole('button', { name: 'Story', exact: true }).click();
  await page.getByRole('textbox', { name: 'Your first name', exact: true }).fill('Ari');
  await proceed(page);
  await choose(page, 'Politely decline');
  await proceed(page); // Lucia shares her pronouns
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await expect(facts).toHaveCount(2);
  await expect(panel).toContainText('she/her');
  await expect(panel).not.toContainText('exchanged phone numbers');

  await page.getByRole('button', { name: 'Story', exact: true }).click();
  await choose(page, 'They / Them');
  await proceed(page); // An Unusual Beginning
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await expect(facts).toHaveCount(5);
  await expect(panel).toContainText('Floatzel');
  await expect(panel).not.toContainText('little brother');

  await page.getByRole('button', { name: 'Story', exact: true }).click();
  await choose(page, 'Ask why she decided to enter the League');
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await expect(facts).toHaveCount(7);
  await expect(panel).toContainText('little brother');
  await expect(panel).not.toContainText('ranks acts of compassion');
  const raw = await page.evaluate(storageKey => localStorage.getItem(storageKey), key);
  await page.reload();
  await page.getByRole('button', { name: 'Continue Game', exact: true }).click();
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await expect(page.getByRole('list', { name: 'What you know about Lucia' }).getByRole('listitem')).toHaveCount(7);
  expect(await page.evaluate(storageKey => localStorage.getItem(storageKey), key)).toBe(raw);
});
