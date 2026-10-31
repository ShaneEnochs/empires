import { expect, test } from '@playwright/test';
import {
  arrival, checkpointRecord, checkpointWrites, chooseName, enterWatchtower, expectCharacter,
  expectGateState, expectItems, expectPassage, observeCheckpointWrites, selectStory, startGame,
} from './helpers';

test('death before an authored checkpoint restores initial state without reward accumulation or save writes', async ({ page }) => {
  await observeCheckpointWrites(page);
  await startGame(page);
  await expectGateState(page);
  const saved = await checkpointRecord(page);
  expect(await checkpointWrites(page)).toBe(1);
  await expect(page.getByRole('button', { name: 'Try Again', exact: true })).toHaveCount(0);

  for (let cycle = 0; cycle < 3; cycle++) {
    await enterWatchtower(page);
    await expectCharacter(page, ['Alexander', '2', '5', 'No']);
    await expectItems(page, 'Skills', ['Diplomacy']);
    await expectItems(page, 'Inventory', ['Gold Coin × 11', 'Gate Token × 1']);
    await expectItems(page, 'Journal', [arrival, 'You explored the abandoned watchtower.']);
    expect(await checkpointRecord(page)).toBe(saved);
    expect(await checkpointWrites(page)).toBe(1);
    await page.getByRole('button', { name: 'Try Again', exact: true }).click();
    await expectPassage(page, 'The City Gate');
    await expectGateState(page);
    await expect(page.getByRole('button', { name: 'Try Again', exact: true })).toHaveCount(0);
    expect(await checkpointRecord(page)).toBe(saved);
    expect(await checkpointWrites(page)).toBe(1);
  }
});

test('retry preserves a checkpointed name and complete acquired state; reload after death resumes that checkpoint', async ({ page }) => {
  await observeCheckpointWrites(page);
  await startGame(page);
  await chooseName(page, 'Eleanor');
  const saved = await checkpointRecord(page);
  expect(await checkpointWrites(page)).toBe(2);

  for (let cycle = 0; cycle < 3; cycle++) {
    await enterWatchtower(page);
    await page.getByRole('button', { name: 'Try Again', exact: true }).click();
    await expectPassage(page, 'Choose Your Background');
    await expectCharacter(page, ['Eleanor', '1', '5', 'No']);
    await expectItems(page, 'Journal', [arrival, 'You introduced yourself as Eleanor.']);
    await expectItems(page, 'Skills', ['Composure']);
    await expectItems(page, 'Inventory', ['Gold Coin × 10', 'Gate Token × 1']);
    await expect(page.getByRole('textbox')).toHaveCount(0);
    expect(await checkpointRecord(page)).toBe(saved);
    expect(await checkpointWrites(page)).toBe(2);
  }

  await enterWatchtower(page);
  await page.reload();
  await selectStory(page);
  await page.getByRole('button', { name: 'Continue Game', exact: true }).click();
  await expectPassage(page, 'Choose Your Background');
  await expectCharacter(page, ['Eleanor', '1', '5', 'No']);
  await expectItems(page, 'Journal', [arrival, 'You introduced yourself as Eleanor.']);
  expect(await checkpointRecord(page)).toBe(saved);
  expect(await checkpointWrites(page)).toBe(0);
});
