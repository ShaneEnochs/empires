import { expect, test } from '@playwright/test';
import {
  arrival, checkpointRecord, checkpointWrites, enterSluiceDeath, expectCharacter,
  expectItems, expectPassage, expectStartup, observeCheckpointWrites, reachBriefing, startGame,
} from './helpers';

test('repeated death and retry restore the named checkpoint without reward accumulation or saving', async ({ page }) => {
  await observeCheckpointWrites(page);
  await startGame(page);
  await reachBriefing(page, 'Eleanor');
  const saved = await checkpointRecord(page);
  expect(await checkpointWrites(page)).toBe(2);
  const journal = [arrival, 'Eleanor returned as a former river surveyor.', 'Eleanor accepted six public grain sacks with authority 3.'];
  for (let cycle = 0; cycle < 3; cycle++) {
    await enterSluiceDeath(page);
    await expectCharacter(page, ['Eleanor', '4', '1', 'Undecided']);
    await expectItems(page, 'Inventory', ['Dispatch Coin × 2', 'Emergency Writ × 1', 'Grain Sack × 5', 'Attested Grain Accounts × 1']);
    await expectItems(page, 'Journal', [...journal, 'Eleanor paid two coins for attested grain accounts.', 'Eleanor was lost beneath the unshored sluice.']);
    expect(await checkpointRecord(page)).toBe(saved);
    expect(await checkpointWrites(page)).toBe(2);
    await page.getByRole('button', { name: 'Try Again', exact: true }).click();
    await expectPassage(page, 'Six Sacks and a Day');
    await expectCharacter(page, ['Eleanor', '3', '1', 'Undecided']);
    await expectItems(page, 'Journal', journal);
    await expectItems(page, 'Skills', ['Provincial Commission', 'Channel Knowledge']);
    await expectItems(page, 'Inventory', ['Dispatch Coin × 4', 'Emergency Writ × 1', 'Grain Sack × 6']);
    await expect(page.getByRole('button', { name: 'Try Again', exact: true })).toHaveCount(0);
    expect(await checkpointRecord(page)).toBe(saved);
    expect(await checkpointWrites(page)).toBe(2);
  }
});

test('reload after death resumes the existing complete checkpoint and never prompts for the accepted name again', async ({ page }) => {
  await observeCheckpointWrites(page);
  await startGame(page);
  await reachBriefing(page, 'Eleanor');
  const saved = await checkpointRecord(page);
  await enterSluiceDeath(page);
  await page.reload();
  await expectStartup(page);
  await page.getByRole('button', { name: 'Continue Game', exact: true }).click();
  await expectPassage(page, 'Six Sacks and a Day');
  await expectCharacter(page, ['Eleanor', '3', '1', 'Undecided']);
  await expectItems(page, 'Journal', [arrival, 'Eleanor returned as a former river surveyor.', 'Eleanor accepted six public grain sacks with authority 3.']);
  await expectItems(page, 'Skills', ['Provincial Commission', 'Channel Knowledge']);
  await expectItems(page, 'Inventory', ['Dispatch Coin × 4', 'Emergency Writ × 1', 'Grain Sack × 6']);
  await expect(page.getByRole('textbox')).toHaveCount(0);
  expect(await checkpointRecord(page)).toBe(saved);
  expect(await checkpointWrites(page)).toBe(0);
});
