import { titlePage } from '../src/title-page';
import { expect, test } from '@playwright/test';
import {
  arrival, checkpointRecord, checkpointWrites, enterSluiceDeath, expectCharacter,
  expectItems, expectPassage, expectStartup, observeCheckpointWrites, reachBriefing, startGame,
} from './helpers';

test('repeated death and retry restore the named checkpoint without reward accumulation and with one save per commit', async ({ page }) => {
  await observeCheckpointWrites(page);
  await startGame(page);
  await reachBriefing(page, 'Eleanor');
  const saved = await checkpointRecord(page);
  expect(await checkpointWrites(page)).toBe(5);
  const journal = [arrival, 'Eleanor returned as a former river surveyor.', 'Eleanor accepted six public grain sacks with authority 3.'];
  for (let cycle = 0; cycle < 3; cycle++) {
    await enterSluiceDeath(page);
    await expectCharacter(page, ['Eleanor', '4', '1', 'Undecided']);
    await expectItems(page, 'Inventory', ['Dispatch Coin × 2', 'Emergency Writ × 1', 'Grain Sack × 5', 'Attested Grain Accounts × 1']);
    await expectItems(page, 'Journal', [...journal, 'Eleanor paid two coins for attested grain accounts.', 'Eleanor was lost beneath the unshored sluice.']);
    expect(JSON.parse((await checkpointRecord(page))!).checkpoint).toEqual(JSON.parse(saved!).checkpoint);
    expect(await checkpointWrites(page)).toBe(5 + cycle * 5 + 4);
    await page.getByRole('button', { name: 'Try Again', exact: true }).click();
    await expectPassage(page, 'Six Sacks and a Day');
    await expectCharacter(page, ['Eleanor', '3', '1', 'Undecided']);
    await expectItems(page, 'Journal', journal);
    await expectItems(page, 'Skills', ['Provincial Commission', 'Channel Knowledge']);
    await expectItems(page, 'Inventory', ['Dispatch Coin × 4', 'Emergency Writ × 1', 'Grain Sack × 6']);
    await expect(page.getByRole('button', { name: 'Try Again', exact: true })).toHaveCount(0);
    expect(await checkpointRecord(page)).toBe(saved);
    expect(await checkpointWrites(page)).toBe(5 + (cycle + 1) * 5);
  }
});

test('reload after death resumes death; Try Again recovers the complete checkpoint and never prompts for the accepted name again', async ({ page }) => {
  await observeCheckpointWrites(page);
  await startGame(page);
  await reachBriefing(page, 'Eleanor');
  await enterSluiceDeath(page);
  const saved = await checkpointRecord(page);
  await page.reload();
  await expectStartup(page);
  await page.getByRole('button', { name: titlePage.continueGameLabel, exact: true }).click();
  await expectPassage(page, 'Beneath the Shore Timbers');
  await page.getByRole('button', { name: 'Try Again', exact: true }).click();
  await expectPassage(page, 'Six Sacks and a Day');
  await expectCharacter(page, ['Eleanor', '3', '1', 'Undecided']);
  await expectItems(page, 'Journal', [arrival, 'Eleanor returned as a former river surveyor.', 'Eleanor accepted six public grain sacks with authority 3.']);
  await expectItems(page, 'Skills', ['Provincial Commission', 'Channel Knowledge']);
  await expectItems(page, 'Inventory', ['Dispatch Coin × 4', 'Emergency Writ × 1', 'Grain Sack × 6']);
  await expect(page.getByRole('textbox')).toHaveCount(0);
  expect(JSON.parse((await checkpointRecord(page))!).checkpoint).toEqual(JSON.parse(saved!).checkpoint);
  expect(await checkpointWrites(page)).toBe(1);
});
