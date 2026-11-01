import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseStory } from '../src/story';
import { analyzeStory } from '../src/preflight';
import { parsePeople, validatePeople } from '../src/people';
const read = (path: string) => readFileSync(path, 'utf8');
const base = 'tools/notepadpp/';

test('Notepad++ completion and UDL contain exactly the documented directives', () => {
  const docs = read('docs/SCRIPTING.md').split('## Supported syntax')[1]!.split('## Character statistics')[0]!;
  const commands = [...new Set([...docs.matchAll(/^\| `\*(\w+)/gm)].map(match => '*' + match[1]))].sort();
  const completion = [...read(base + 'Empires.xml').matchAll(/<KeyWord name="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(completion, commands);
  const udl = read(base + 'Empires-udl.xml');
  assert.match(udl, /name="Empires" ext="story" udlVersion="2.1"/);
  assert.deepEqual(udl.match(/<Keywords name="Keywords1">([^<]+)</)![1]!.split(' ').sort(), commands);
});

test('starter parses, has clean bounded preflight, and its People events validate', () => {
  const story = parseStory(read(base + 'starter.story'));
  assert.equal(analyzeStory(story).diagnostics.filter(d => d.severity !== 'information').length, 0);
  assert.equal(validatePeople(story, parsePeople(JSON.parse(read(base + 'starter.people.json')))).length, 1);
});

test('CMD launcher quotes paths, preserves errors, and invokes the existing CLI', () => {
  const cmd = read(base + 'validate-story.cmd');
  assert.match(cmd, /setlocal DisableDelayedExpansion/);
  assert.match(cmd, /set "STORY_FILE=%~f1"/);
  assert.match(cmd, /pushd "%~dp0\.\.\\\.\."/);
  assert.match(cmd, /node --import tsx scripts\/check-stories.ts "%STORY_FILE%"/);
  assert.match(cmd, /set "VALIDATION_EXIT=%ERRORLEVEL%"\npopd\nexit \/b %VALIDATION_EXIT%/);
  const dir = mkdtempSync(join(tmpdir(), 'Empires spaced draft '));
  try {
    const path = join(dir, 'My saved story.story'); copyFileSync(base + 'starter.story', path);
    const run = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/check-stories.ts', path], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr); assert.match(run.stdout, /0 errors, 0 warnings/);
    const missing = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/check-stories.ts', join(dir, 'missing.story')], { encoding: 'utf8' });
    assert.equal(missing.status, 1); assert.match(missing.stdout, /FILE_ERROR/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
