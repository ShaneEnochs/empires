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
  assert.match(readFileSync('src/catalog.ts', 'utf8'), /identity: \{ storyId: 'aurelian-league', storyRevision: 12 \}/);
});

test('Public Sans is used for reader and author preview with a system fallback', () => {
  const css = readFileSync('src/style.css', 'utf8');
  assert.match(css, /--font-literary: 'Public Sans', system-ui, sans-serif;/);
  assert.match(css, /--font-ui: 'Public Sans', system-ui, sans-serif;/);
  assert.doesNotMatch(css, /Source Serif 4/);
  for (const entrypoint of ['index.html', 'author.html']) {
    const html = readFileSync(entrypoint, 'utf8');
    assert.match(html, /fonts.googleapis.com\/css2\?family=Public\+Sans/);
    assert.match(html, /display=swap/);
  }
});
