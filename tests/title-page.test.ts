import { test } from 'node:test';
import assert from 'node:assert/strict';
import { titlePage, validateTitlePage } from '../src/title-page';
import { readFileSync } from 'node:fs';

test('title page validates all required text and preserves plain text', () => {
  for (const field of Object.keys(titlePage)) {
    for (const invalid of [undefined, null, 4, '', '  ']) {
      assert.throws(() => validateTitlePage({ ...titlePage, [field]: invalid }), new RegExp(field));
    }
  }
  for (const invalid of [null, [], 'title']) assert.throws(() => validateTitlePage(invalid));
  assert.equal(validateTitlePage({ ...titlePage, title: '<b>Title</b>' }).title, '<b>Title</b>');
  assert.ok(Object.isFrozen(titlePage));
});

test('display metadata is independent of stable save identity', () => {
  const changed = validateTitlePage({ ...titlePage, title: 'Another display title' });
  assert.notEqual(changed.title, titlePage.title);
  assert.match(readFileSync('src/catalog.ts', 'utf8'), /identity: \{ storyId: 'provincial-crisis', storyRevision: 1 \}/);
});

test('bundled font is one small WOFF2 with its redistribution license', () => {
  const font = readFileSync('src/fonts/source-serif-4-latin-wght-normal.woff2');
  assert.equal(font.subarray(0, 4).toString(), 'wOF2');
  assert.ok(font.length < 60000);
  assert.match(readFileSync('src/fonts/OFL.txt', 'utf8'), /SIL OPEN FONT LICENSE/);
});
