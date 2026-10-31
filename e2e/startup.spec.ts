import { expect, test } from '@playwright/test';
import { STORAGE_KEY } from '../src/storage';
import {
  arrival, checkpointRecord, checkpointWrites, chooseName, confirmNewGame,
  expectCharacter, expectGateState, expectItems, expectPassage, observeCheckpointWrites, selectStory, startGame,
} from './helpers';

test('first visit offers New Game and captures the initial pre-entry checkpoint', async ({ page }) => {
  await page.goto('/');
  await selectStory(page);
  await expect(page.getByRole('navigation', { name: 'Game startup' }).getByRole('button')).toHaveText(['New Game', 'Back to Stories']);
  expect(await checkpointRecord(page)).toBeNull();

  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await expectPassage(page, 'The City Gate');
  await expectGateState(page);
  const record = await checkpointRecord(page);
  expect(record).not.toBeNull();
  const checkpoint = JSON.parse(record!).checkpoint.state;
  expect(checkpoint).toEqual({
    passageId: 'gate',
    variables: { influence: 0, honor: 5, loyal: false, character_name: 'Unknown' },
    journal: [], skills: [], inventory: {},
  });
});

test('Continue resumes the initial checkpoint and drops ordinary unsaved passage progress', async ({ page }) => {
  await observeCheckpointWrites(page);
  await startGame(page);
  const saved = await checkpointRecord(page);
  await page.getByRole('button', { name: 'Speak to the messenger', exact: true }).click();
  await expectPassage(page, 'A Quiet Warning');
  await expectCharacter(page, ['Alexander', '3', '4', 'Yes']);
  expect(await checkpointRecord(page)).toBe(saved);
  expect(await checkpointWrites(page)).toBe(1);

  await page.reload();
  await selectStory(page);
  await expect(page.getByRole('button', { name: 'Continue Game', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue Game', exact: true }).click();
  await expectPassage(page, 'The City Gate');
  await expectGateState(page);
  expect(await checkpointRecord(page)).toBe(saved);
  expect(await checkpointWrites(page)).toBe(0);
});

test('a new page continues the authored checkpoint with its name, not the later council passage', async ({ page, context }) => {
  await startGame(page);
  await chooseName(page, 'Eleanor');
  const saved = await checkpointRecord(page);
  await page.getByRole('button', { name: 'Raised among nobility', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expectPassage(page, 'The Empty Chair');
  await expectCharacter(page, ['Eleanor', '2.5', '5', 'No']);

  const reopened = await context.newPage();
  await observeCheckpointWrites(reopened);
  for (let load = 0; load < 2; load++) {
    await reopened.goto('/');
    await selectStory(reopened);
    await reopened.getByRole('button', { name: 'Continue Game', exact: true }).click();
    await expectPassage(reopened, 'Choose Your Background');
    await expectCharacter(reopened, ['Eleanor', '1', '5', 'No']);
    await expectItems(reopened, 'Journal', [arrival, 'You introduced yourself as Eleanor.']);
    await expectItems(reopened, 'Skills', ['Composure']);
    await expectItems(reopened, 'Inventory', ['Gold Coin × 10', 'Gate Token × 1']);
    await expect(reopened.getByRole('textbox')).toHaveCount(0);
    expect(await checkpointRecord(reopened)).toBe(saved);
    expect(await checkpointWrites(reopened)).toBe(0);
  }
});

test('New Game cancellation preserves progress; confirmation replaces it with fresh progress', async ({ page }) => {
  await startGame(page);
  await chooseName(page, 'Eleanor');
  await page.getByRole('button', { name: 'Raised among nobility', exact: true }).click();
  await expectPassage(page, 'A Noble Upbringing');
  const saved = await checkpointRecord(page);

  await confirmNewGame(page, false);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A Noble Upbringing');
  await expectCharacter(page, ['Eleanor', '3', '5', 'No']);
  await expectItems(page, 'Skills', ['Composure', 'Diplomacy']);
  await expectItems(page, 'Journal', [arrival, 'You introduced yourself as Eleanor.', 'Eleanor learned the customs of the royal court.']);
  expect(await checkpointRecord(page)).toBe(saved);

  await confirmNewGame(page, true);
  await expectPassage(page, 'The City Gate');
  await expectGateState(page);
  expect(JSON.parse((await checkpointRecord(page))!).checkpoint.state.passageId).toBe('gate');
  expect(await checkpointRecord(page)).not.toBe(saved);
});

test('invalid stored checkpoint explains the problem, preserves its bytes, and requires overwrite confirmation', async ({ page }) => {
  await startGame(page);
  const invalid = JSON.parse((await checkpointRecord(page))!);
  invalid.checkpoint.state.passageId = 'removed_passage';
  const raw = JSON.stringify(invalid);
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: STORAGE_KEY, raw });
  await page.reload();

  await selectStory(page);
  await expect(page.getByText('A saved game was found, but it cannot be loaded.', { exact: true })).toBeVisible();
  await expect(page.getByText('The saved checkpoint is not compatible with this story.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue Game', exact: true })).toHaveCount(0);
  expect(await checkpointRecord(page)).toBe(raw);
  await confirmNewGame(page, false);
  expect(await checkpointRecord(page)).toBe(raw);
  await confirmNewGame(page, true);
  await expectPassage(page, 'The City Gate');
  await expectGateState(page);
});
