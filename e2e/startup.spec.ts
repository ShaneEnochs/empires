import { titlePage } from '../src/title-page';
import { expect, test } from '@playwright/test';
import {
  arrival, checkpointRecord, checkpointWrites, choose, confirmNewGame, crisisKey,
  expectCharacter, expectInitialState, expectItems, expectPassage, expectStartup,
  observeCheckpointWrites, reachBriefing, startGame,
} from './helpers';

test('first visit directly offers Provincial Crisis startup and captures its initial pre-entry checkpoint', async ({ page }) => {
  await page.goto('/');
  await expectStartup(page);
  await expect(page.getByRole('navigation', { name: 'Game startup' }).getByRole('button')).toHaveText([titlePage.newGameLabel]);
  expect(await checkpointRecord(page)).toBeNull();
  await page.getByRole('button', { name: titlePage.newGameLabel, exact: true }).click();
  await expectPassage(page, 'The Last Ferry');
  await expectInitialState(page);
  const save = JSON.parse((await checkpointRecord(page))!);
  expect(save).toEqual({
    formatVersion: 1, storyId: 'provincial-crisis', storyRevision: 1,
    checkpoint: { state: {
      passageId: 'quayside',
      variables: { envoy_name: 'Mara Vale', authority: 2, trust: 0, plan: 'Undecided', workers_fed: false, river_warning: false, bonded: false },
      journal: [], skills: [], inventory: {},
    } },
  });
});

test('Continue Game resumes the initial checkpoint and drops ordinary unsaved passage progress', async ({ page }) => {
  await observeCheckpointWrites(page);
  await startGame(page);
  const saved = await checkpointRecord(page);
  await choose(page, 'Keep the name Mara Vale and begin');
  await choose(page, 'You mediated disputes at the provincial court');
  await expectPassage(page, "A Clerk's Reputation");
  await expectCharacter(page, ['Mara Vale', '3', '0', 'Undecided']);
  expect(await checkpointRecord(page)).toBe(saved);
  expect(await checkpointWrites(page)).toBe(1);
  await page.reload();
  await expectStartup(page);
  await page.getByRole('button', { name: titlePage.continueGameLabel, exact: true }).click();
  await expectPassage(page, 'The Last Ferry');
  await expectInitialState(page);
  expect(await checkpointRecord(page)).toBe(saved);
  expect(await checkpointWrites(page)).toBe(0);
});

test('a new page resumes a revision-1 authored checkpoint, accepted name, and complete acquired state', async ({ page, context }) => {
  await startGame(page);
  await reachBriefing(page, 'Eleanor');
  const saved = await checkpointRecord(page);
  await choose(page, 'Investigate the mill accounts');
  await choose(page, 'Pay two coins for attested accounts');
  await expectPassage(page, 'Ink Paid For');
  const reopened = await context.newPage();
  await observeCheckpointWrites(reopened);
  for (let load = 0; load < 2; load++) {
    await reopened.goto('/');
    await expectStartup(reopened);
    await reopened.getByRole('button', { name: titlePage.continueGameLabel, exact: true }).click();
    await expectPassage(reopened, 'Six Sacks and a Day');
    await expectCharacter(reopened, ['Eleanor', '3', '1', 'Undecided']);
    await expectItems(reopened, 'Journal', [arrival, 'Eleanor returned as a former river surveyor.', 'Eleanor accepted six public grain sacks with authority 3.']);
    await expectItems(reopened, 'Skills', ['Provincial Commission', 'Channel Knowledge']);
    await expectItems(reopened, 'Inventory', ['Dispatch Coin × 4', 'Emergency Writ × 1', 'Grain Sack × 6']);
    await expect(reopened.getByRole('textbox')).toHaveCount(0);
    expect(await checkpointRecord(reopened)).toBe(saved);
    expect(await checkpointWrites(reopened)).toBe(0);
  }
});

test('startup New Game cancellation retains progress and confirmation replaces only its checkpoint', async ({ page }) => {
  await startGame(page);
  await reachBriefing(page, 'Eleanor');
  const saved = await checkpointRecord(page);
  await expect(page.getByRole('button', { name: titlePage.newGameLabel, exact: true })).toHaveCount(0);
  await page.reload();
  await expectStartup(page);
  await confirmNewGame(page, false);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(titlePage.title);
  await expect(page.getByRole('button', { name: titlePage.newGameLabel, exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: titlePage.continueGameLabel, exact: true })).toBeVisible();
  expect(await checkpointRecord(page)).toBe(saved);
  await page.getByRole('button', { name: titlePage.continueGameLabel, exact: true }).click();
  await expectPassage(page, 'Six Sacks and a Day');
  await expectCharacter(page, ['Eleanor', '3', '1', 'Undecided']);
  await page.reload();
  await expectStartup(page);
  await confirmNewGame(page, true);
  await expectPassage(page, 'The Last Ferry');
  await expectInitialState(page);
  expect(JSON.parse((await checkpointRecord(page))!).checkpoint.state.passageId).toBe('quayside');
  expect(await checkpointRecord(page)).not.toBe(saved);
});

test('an invalid checkpoint is explained and kept until confirmed replacement', async ({ page }) => {
  await startGame(page);
  const invalid = JSON.parse((await checkpointRecord(page))!);
  invalid.checkpoint.state.passageId = 'removed_passage';
  const raw = JSON.stringify(invalid);
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: crisisKey, raw });
  await page.reload();
  await expectStartup(page);
  await expect(page.getByText('A saved game was found, but it cannot be loaded.', { exact: true })).toBeVisible();
  await expect(page.getByText('The saved checkpoint is not compatible with this story.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: titlePage.continueGameLabel, exact: true })).toHaveCount(0);
  expect(await checkpointRecord(page)).toBe(raw);
  await confirmNewGame(page, false);
  expect(await checkpointRecord(page)).toBe(raw);
  await confirmNewGame(page, true);
  await expectPassage(page, 'The Last Ferry');
  await expectInitialState(page);
});
