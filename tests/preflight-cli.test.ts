import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = fileURLToPath(new URL('../scripts/check-stories.ts', import.meta.url));
function run(...files: string[]) {
  const result = spawnSync(process.execPath, ['--import', 'tsx', cli, ...files], { cwd: root, encoding: 'utf8', timeout: 15000 });
  assert.equal(result.error, undefined);
  return result;
}

test('CLI checks both bundled stories by default and prints their diagnostic counts', () => {
  const result = run();
  assert.equal(result.status, 0);
  assert.match(result.stdout, /src\/example.story/);
  assert.match(result.stdout, /examples\/provincial-crisis.story/);
  assert.match(result.stdout, /0 errors, 0 warnings, 2 information; 14 route prefixes/);
  assert.match(result.stdout, /0 errors, 0 warnings, 3 information; 1086 route prefixes/);
  assert.match(result.stdout, /Total: 0 errors, 0 warnings, 5 information/);
});

test('CLI supports an explicit filename with spaces and leaves advisory warnings nonfatal', t => {
  const directory = mkdtempSync(join(tmpdir(), 'empires-preflight-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, 'unreachable scene.story');
  const source = '*passage start\n*title Start\nEnd.\n*passage orphan\n*title Orphan\nUnused.';
  writeFileSync(file, source);
  const result = run(file);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /orphan\n\s+WARNING UNREACHABLE_PASSAGE/);
  assert.match(result.stdout, /Action:/);
  assert.match(result.stdout, /Total: 0 errors, 1 warnings, 1 information/);
  assert.equal(readFileSync(file, 'utf8'), source);
});

test('CLI reports parser line errors and confirmed runtime failures, continues checking files, and exits nonzero', t => {
  const directory = mkdtempSync(join(tmpdir(), 'empires-preflight-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const invalid = join(directory, 'syntax.story');
  const runtime = join(directory, 'runtime.story');
  writeFileSync(invalid, '*passage start\n*title Start\nText.\n*continue missing');
  writeFileSync(runtime, '*item coin "Coin"\n*passage start\n*title Start\nBegin.\n*continue fail\n*passage fail\n*title Fail\n*remove_item coin 1\nFail.');
  const result = run(invalid, runtime);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /PARSE_ERROR: Line 4, passage "start": Missing destination/);
  assert.match(result.stdout, /ERROR ENTRY_FAILURE/);
  assert.match(result.stdout, /insufficient inventory/);
  assert.match(result.stdout, /Route: start -> fail/);
  assert.match(result.stdout, /Total: 2 errors/);
});

test('CLI rejects missing/non-story files with useful errors instead of crashing', () => {
  const result = run('README.md', 'examples/does-not-exist.story');
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Expected a .story filename/);
  assert.match(result.stdout, /FILE_ERROR:.*ENOENT/);
  assert.match(result.stdout, /Total: 2 errors/);
});
