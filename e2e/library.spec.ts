import { titlePage } from '../src/title-page';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  checkpointRecord, confirmNewGame, expectCharacter as crisisCharacter,
  expectItems, expectPassage, openPanel, panelNames, expectStartup, startGame as startCrisis,
  returnToStory, choose, crisisKey, cityKey, reachBriefing as nameAndBriefing, councilWithEvidence,
} from './helpers';

// An exact revision-1 City Gate initial save, retained as opaque legacy browser data.
const legacyCitySave = JSON.stringify({
  formatVersion: 1, storyId: 'empires-example', storyRevision: 1,
  checkpoint: { state: {
    passageId: 'gate', variables: { influence: 0, honor: 5, loyal: false, character_name: 'Unknown' },
    journal: [], skills: [], inventory: {},
  } },
});

async function action(page: Page, label: string, title: string): Promise<void> {
  if ([titlePage.newGameLabel, 'Continue', titlePage.continueGameLabel, 'Try Again'].includes(label)) {
    await page.getByRole('button', { name: label, exact: true }).click();
  } else {
    await choose(page, label);
  }
  await expectPassage(page, title);
}

async function seedBoth(page: Page): Promise<void> {
  await startCrisis(page);
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: cityKey, raw: legacyCitySave });
  await nameAndBriefing(page);
}

async function records(page: Page) {
  return { city: await checkpointRecord(page, cityKey), crisis: await checkpointRecord(page, crisisKey) };
}

/** Observe native storage calls only; no application/session hooks. */
async function observeStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const accesses: { operation: string; key: string }[] = [];
    Object.defineProperty(window, '__empiresStorageAccess', { value: accesses });
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    const removeItem = Storage.prototype.removeItem;
    Storage.prototype.getItem = function (key: string) {
      if (this === window.localStorage) accesses.push({ operation: 'read', key });
      return getItem.call(this, key);
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === window.localStorage) accesses.push({ operation: 'write', key });
      return setItem.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key: string) {
      if (this === window.localStorage) accesses.push({ operation: 'delete', key });
      return removeItem.call(this, key);
    };
  });
}

async function storageAccess(page: Page): Promise<{ operation: string; key: string }[]> {
  return page.evaluate(() => Reflect.get(window, '__empiresStorageAccess'));
}

test('direct startup reads only Provincial Crisis and never reads a retired City Gate record', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: cityKey, raw: legacyCitySave });
  await observeStorage(page);
  await page.reload();
  await expectStartup(page);
  await expect(page.getByRole('button')).toHaveText([titlePage.newGameLabel]);
  expect(await storageAccess(page)).toEqual([{ operation: 'read', key: crisisKey }]);
  await action(page, titlePage.newGameLabel, 'The Last Ferry');
  expect(await storageAccess(page)).toEqual([
    { operation: 'read', key: crisisKey }, { operation: 'read', key: crisisKey }, { operation: 'write', key: crisisKey },
  ]);
  expect(await checkpointRecord(page, cityKey)).toBe(legacyCitySave);
});

test('reload and Continue preserve both saved records without writing or replaying checkpoint rewards', async ({ page }) => {
  await seedBoth(page);
  const saved = await records(page);
  expect(JSON.parse(saved.crisis!).storyId).toBe('provincial-crisis');
  expect(JSON.parse(saved.crisis!).checkpoint.state.passageId).toBe('briefing');
  await observeStorage(page);
  for (let reload = 0; reload < 2; reload++) {
    await page.reload();
    await expectStartup(page);
    await action(page, titlePage.continueGameLabel, 'Six Sacks and a Day');
    await crisisCharacter(page, ['Rowan 周', '3', '1', 'Undecided']);
    await expectItems(page, 'Skills', ['Provincial Commission', 'Channel Knowledge']);
    await expectItems(page, 'Inventory', ['Dispatch Coin × 4', 'Emergency Writ × 1', 'Grain Sack × 6']);
    expect(await storageAccess(page)).toEqual([{ operation: 'read', key: crisisKey }]);
    expect(await records(page)).toEqual(saved);
  }
});

for (const legacy of [legacyCitySave, '{broken legacy save']) {
  test('startup replacement preserves legacy City Gate bytes: ' + (legacy === legacyCitySave ? 'valid' : 'corrupt'), async ({ page }) => {
    await seedBoth(page);
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: cityKey, raw: legacy });
    const saved = await records(page);
    await page.reload();
    await expectStartup(page);
    await confirmNewGame(page, false);
    expect(await records(page)).toEqual(saved);
    await confirmNewGame(page, true);
    await expectPassage(page, 'The Last Ferry');
    expect(await checkpointRecord(page, cityKey)).toBe(legacy);
    const envelope = JSON.parse((await checkpointRecord(page))!);
    expect(envelope.storyId).toBe('provincial-crisis');
    expect(envelope.storyRevision).toBe(1);
    expect(envelope.formatVersion).toBe(1);
    expect(envelope.checkpoint.state.passageId).toBe('quayside');
  });
}

test('corrupt Provincial Crisis data stays isolated and requires explicit replacement', async ({ page }) => {
  await seedBoth(page);
  await page.evaluate(key => localStorage.setItem(key, '{broken'), crisisKey);
  await page.reload();
  await expectStartup(page);
  await expect(page.getByText('The saved data is not readable.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: titlePage.continueGameLabel, exact: true })).toHaveCount(0);
  await confirmNewGame(page, false);
  expect(await checkpointRecord(page)).toBe('{broken');
  expect(await checkpointRecord(page, cityKey)).toBe(legacyCitySave);
  await confirmNewGame(page, true);
  await expectPassage(page, 'The Last Ferry');
  expect(await checkpointRecord(page, cityKey)).toBe(legacyCitySave);
});

test('Provincial Crisis naming, selected metadata, conditional choices, and spending reach a complete ending', async ({ page }) => {
  await startCrisis(page);
  await crisisCharacter(page, ['Mara Vale', '2', '0', 'Undecided']);
  await expectItems(page, 'Skills', ['Provincial Commission']);
  await expectItems(page, 'Inventory', ['Dispatch Coin × 4', 'Emergency Writ × 1']);
  const name = 'Éléonore 王 <b>Envoy</b>';
  await nameAndBriefing(page, name);
  await crisisCharacter(page, [name, '3', '1', 'Undecided']);
  await expect(page.getByText('The keeper will honor a requisition while your commission lasts.', { exact: true })).toBeVisible();
  await councilWithEvidence(page);
  const saved = await checkpointRecord(page, crisisKey);
  await expectItems(page, 'Skills', ['Channel Knowledge']);
  await expectItems(page, 'Inventory', ['Dispatch Coin × 2', 'Grain Sack × 8', 'Attested Grain Accounts × 1']);
  await expect(page.getByText('Your seal can no longer turn an instruction into law. Every promise now needs willing hands or armed enforcement.', { exact: true })).toBeVisible();
  await action(page, 'Present the attested grain accounts', 'Accounts Read Aloud');
  await expect(page.getByRole('radio', { name: 'Negotiate a supervised civic compact', exact: true })).toHaveCount(0);
  await action(page, 'Let trusted local delegates carry the compact', 'A Table With More Seats');
  await crisisCharacter(page, [name, '5', '4', 'Civic compact']);
  await expectItems(page, 'Inventory', ['Dispatch Coin × 2', 'Grain Sack × 2', 'Attested Grain Accounts × 1']);
  await expect(page.getByText('The board writes ' + name + ' into the agreement as its guarantor. Its next argument will happen across a table, with the accounts open.', { exact: true })).toBeVisible();
  const journal = await openPanel(page, 'Journal');
  await expect(journal.getByRole('heading', { level: 3 })).toHaveText(['The Writ', 'The River', 'Night Council']);
  await expect(journal.getByRole('listitem')).toHaveCount(8);
  await expect(journal.getByRole('listitem').last()).toHaveText(name + ' secured a civic compact and committed six sacks to public kitchens.');
  await returnToStory(page);
  await expect(page.getByRole('navigation', { name: 'Passage actions' }).getByRole('button')).toHaveCount(0);
  await expect(page.locator('main b, main img, main script')).toHaveCount(0);
  expect(await checkpointRecord(page, crisisKey)).toBe(saved);
  expect(await checkpointRecord(page, cityKey)).toBeNull();
});

for (const checkpoint of ['briefing', 'night_council']) {
  test('Provincial Crisis death and retry restore the complete ' + checkpoint + ' checkpoint without saving', async ({ page }) => {
    await observeStorage(page);
    await seedBoth(page);
    if (checkpoint === 'night_council') await councilWithEvidence(page);
    const saved = await records(page);
    const writes = (await storageAccess(page)).filter(access => access.operation !== 'read');
    const name = 'Rowan 周';
    const expectedSkills = checkpoint === 'briefing' ? ['Provincial Commission', 'Channel Knowledge'] : ['Channel Knowledge'];
    const expectedItems = checkpoint === 'briefing'
      ? ['Dispatch Coin × 4', 'Emergency Writ × 1', 'Grain Sack × 6']
      : ['Dispatch Coin × 2', 'Grain Sack × 8', 'Attested Grain Accounts × 1'];
    const heading = checkpoint === 'briefing' ? 'Six Sacks and a Day' : 'When the Seal Expires';
    const journal = await openPanel(page, 'Journal');
    const expectedJournal = await journal.getByRole('listitem').allTextContents();
    await returnToStory(page);
    for (let cycle = 0; cycle < 2; cycle++) {
      if (checkpoint === 'briefing') {
        await action(page, 'Investigate the mill accounts', 'The Mill Yard');
        await action(page, 'Pay two coins for attested accounts', 'Ink Paid For');
        await action(page, 'Continue', 'The Unshored Gate');
        await action(page, 'Enter the unshored sluice chamber despite the warning', 'Beneath the Shore Timbers');
        await expect(page.getByText("The river takes the commission's bearer before the council can meet.", { exact: true })).toBeVisible();
      } else {
        await action(page, 'Plan an evacuation of the lower town', 'Boats Before Possessions');
        await expect(page.getByRole('radio', { name: 'Hire the ferry hands for three coins', exact: true })).toHaveCount(0);
        await action(page, 'Force the damaged sluice as a shortcut despite the risk', 'The Gate Gives Way');
        await expect(page.getByText('The meeting has ended. The river has not.', { exact: true })).toBeVisible();
      }
      await expect(page.getByRole('navigation', { name: 'Passage actions' }).getByRole('button')).toHaveText(['Try Again']);
      expect(await records(page)).toEqual(saved);
      expect((await storageAccess(page)).filter(access => access.operation !== 'read')).toEqual(writes);
      await page.getByRole('button', { name: 'Try Again', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expectPassage(page, heading);
      await crisisCharacter(page, [name, checkpoint === 'briefing' ? '3' : '4', checkpoint === 'briefing' ? '1' : '2', 'Undecided']);
      await expectItems(page, 'Skills', expectedSkills);
      await expectItems(page, 'Inventory', expectedItems);
      await expectItems(page, 'Journal', expectedJournal);
      await expect(page.getByRole('textbox')).toHaveCount(0);
      expect(await records(page)).toEqual(saved);
      expect((await storageAccess(page)).filter(access => access.operation !== 'read')).toEqual(writes);
    }
    await page.reload();
    await expectStartup(page);
    await action(page, titlePage.continueGameLabel, heading);
    await expectItems(page, 'Journal', expectedJournal);
    await expectItems(page, 'Skills', expectedSkills);
    await expectItems(page, 'Inventory', expectedItems);
    expect(await records(page)).toEqual(saved);
    expect((await storageAccess(page)).filter(access => access.operation !== 'read')).toEqual([]);
  });
}

test('failed Provincial Crisis automatic save keeps its in-memory recovery and warning without changing either persisted story', async ({ page }) => {
  await seedBoth(page);
  const saved = await records(page);
  await page.evaluate(key => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name: string, value: string) {
      if (this === localStorage && name === key) throw new DOMException('Storage full', 'QuotaExceededError');
      return setItem.call(this, name, value);
    };
  }, crisisKey);
  await councilWithEvidence(page);
  const warning = 'The latest checkpoint could not be saved. Closing this page may lose progress since the last saved checkpoint.';
  await expect(page.getByRole('alert')).toHaveText(warning);
  for (const name of panelNames) {
    await openPanel(page, name);
    await expect(page.getByRole('alert')).toHaveText(warning);
  }
  await returnToStory(page);
  expect(await records(page)).toEqual(saved);
  await action(page, 'Plan an evacuation of the lower town', 'Boats Before Possessions');
  await action(page, 'Force the damaged sluice as a shortcut despite the risk', 'The Gate Gives Way');
  await action(page, 'Try Again', 'When the Seal Expires');
  await crisisCharacter(page, ['Rowan 周', '4', '2', 'Undecided']);
  await expectItems(page, 'Inventory', ['Dispatch Coin × 2', 'Grain Sack × 8', 'Attested Grain Accounts × 1']);
  await expect(page.getByRole('alert')).toHaveText(warning);
  expect(await records(page)).toEqual(saved);
  await page.reload();
  await expectStartup(page);
  await action(page, titlePage.continueGameLabel, 'Six Sacks and a Day');
  await crisisCharacter(page, ['Rowan 周', '3', '1', 'Undecided']);
  await expect(page.getByRole('alert')).toHaveCount(0);
});
