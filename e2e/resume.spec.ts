import { test, expect } from '@playwright/test';
import { titlePage } from '../src/title-page';
import { startGame, choose, chooseName, checkpointRecord, crisisKey, expectPassage, expectCharacter,
  observeCheckpointWrites, checkpointWrites, openPanel, panelNames, returnToStory } from './helpers';

test('accepted text resumes immediately; drafts and selected choices never persist or write', async ({ page }) => {
  await observeCheckpointWrites(page); await startGame(page);
  await chooseName(page, 'Éléonore 王');
  const saved = await checkpointRecord(page);
  expect(JSON.parse(saved!).currentState.variables.envoy_name).toBe('Éléonore 王');
  expect(JSON.parse(saved!).currentState.passageId).toBe('background');
  const writes = await checkpointWrites(page);
  await page.getByRole('radio', { name: 'You surveyed these river channels', exact: true }).check();
  for (const panel of panelNames) await openPanel(page, panel);
  await returnToStory(page);
  expect(await checkpointWrites(page)).toBe(writes);
  await page.reload(); expect(await checkpointWrites(page)).toBe(0);
  await page.getByRole('button', { name: titlePage.continueGameLabel, exact: true }).click();
  await expectPassage(page, 'What You Bring'); await expectCharacter(page, ['Éléonore 王', '2', '0', 'Undecided']);
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
  expect(await checkpointRecord(page)).toBe(saved); expect(await checkpointWrites(page)).toBe(0);
});

test('legacy progress resumes checkpoint then migrates atomically on an ordinary action', async ({ page }) => {
  await startGame(page); await choose(page, 'Keep the name Mara Vale and begin');
  await choose(page, 'You surveyed these river channels'); await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const old = JSON.parse((await checkpointRecord(page))!); delete old.currentState; old.formatVersion = 1;
  const raw = JSON.stringify(old); await page.evaluate(({key, raw}) => localStorage.setItem(key, raw), {key: crisisKey, raw});
  await observeCheckpointWrites(page); await page.reload();
  expect(await checkpointRecord(page)).toBe(raw); expect(await checkpointWrites(page)).toBe(0);
  await page.getByRole('button', { name: titlePage.continueGameLabel, exact: true }).click();
  await expectPassage(page, 'Six Sacks and a Day'); expect(await checkpointRecord(page)).toBe(raw);
  await choose(page, 'Investigate the mill accounts');
  const migrated = JSON.parse((await checkpointRecord(page))!);
  expect(migrated.formatVersion).toBe(2); expect(migrated.currentState.passageId).toBe('mill_yard');
  expect(migrated.checkpoint).toEqual(old.checkpoint); expect(await checkpointWrites(page)).toBe(1);
  await page.reload(); await page.getByRole('button', { name: titlePage.continueGameLabel, exact: true }).click();
  await expectPassage(page, 'The Mill Yard'); expect(await checkpointWrites(page)).toBe(0);
});

test('unsubmitted input draft is discarded on reopen without overwriting progress', async ({ page }) => {
  await observeCheckpointWrites(page); await startGame(page);
  await choose(page, 'Enter a different name in the public record');
  const raw = await checkpointRecord(page); const writes = await checkpointWrites(page);
  await page.getByRole('textbox', { name: 'Name for the public record', exact: true }).fill('Unsubmitted draft');
  expect(await checkpointRecord(page)).toBe(raw); expect(await checkpointWrites(page)).toBe(writes);
  await page.reload(); await page.getByRole('button', { name: titlePage.continueGameLabel, exact: true }).click();
  await expectPassage(page, 'The Public Record');
  await expect(page.getByRole('textbox', { name: 'Name for the public record', exact: true })).toHaveValue('Mara Vale');
  expect(await checkpointWrites(page)).toBe(0); expect(await checkpointRecord(page)).toBe(raw);
});
