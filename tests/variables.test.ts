import assert from 'node:assert/strict';
import { test } from 'node:test';
import { interpolate } from '../src/interpolate';
import { parseStory } from '../src/story';

const passage = '*passage start\n*title Start\nText.';
const storyWithEffects = (declarations: string, effects: string) =>
  `${declarations}\n*passage start\n*title Start\n${effects}\nText.`;

test('parses primitive declarations and preserves their initial values', () => {
  const story = parseStory(`*var count 2\n*var decimal -0.25\n*var loyal false\n*var name "Unknown"\n*var empty ""\n${passage}`);
  assert.deepEqual(story.initialVariables, { count: 2, decimal: -0.25, loyal: false, name: 'Unknown', empty: '' });
});

test('a story with no declarations has an empty variable collection', () => {
  assert.deepEqual(parseStory(passage).initialVariables, {});
});

test('double-quoted strings use JSON escapes, including quotes, backslashes and Unicode', () => {
  const story = parseStory(String.raw`*var name "A \"quoted\" name\\path\n\u2665"` + `\n${passage}`);
  assert.equal(story.initialVariables.name, 'A "quoted" name\\path\n♥');
});

test('accepts finite numeric exponents and negative decimals', () => {
  const story = parseStory(`*var small -1.25e-2\n*var large 1e308\n${passage}`);
  assert.equal(story.initialVariables.small, -0.0125);
  assert.equal(story.initialVariables.large, 1e308);
});

test('rejects duplicate declarations with their source line', () => {
  assert.throws(() => parseStory(`*var count 1\n*var count 2\n${passage}`), /Line 2: Duplicate variable "count"/);
});

for (const declaration of ['*var', '*var count', '*var 1count 0', '*var Upper 0', '*var bad.name 0', '*var two words 0']) {
  test(`rejects malformed declarations: ${declaration}`, () => {
    assert.throws(() => parseStory(`${declaration}\n${passage}`), /Line 1:/);
  });
}

for (const value of ['NaN', 'Infinity', '-Infinity', '1e309', '-1e309', '0x10', '01', '.5', '+1', 'true extra', 'True', 'null', '[]', '{}', 'Unknown', "'Unknown'", '"unclosed', '"ok" trailing', '"bad\\x"', '1 + 2', '${count}']) {
  test(`rejects malformed, non-finite, or nonprimitive literals: ${value}`, () => {
    assert.throws(() => parseStory(`*var count ${value}\n${passage}`), /Line 1:/);
  });
}

test('declarations are permitted only before the first passage', () => {
  assert.throws(() => parseStory(`${passage}\n*var count 0`), /passage "start": \*var declarations must precede/);
});

test('parses ordered literal *set and *add effects without changing initial values', () => {
  const story = parseStory(storyWithEffects('*var count 1\n*var loyal false\n*var name "Unknown"', '*add count -0.5\n*set count 10\n*set loyal true\n*set name "Alexander"'));
  assert.deepEqual(story.passages[0]?.effects, [
    { kind: 'add', variable: 'count', value: -0.5 },
    { kind: 'set', variable: 'count', value: 10 },
    { kind: 'set', variable: 'loyal', value: true },
    { kind: 'set', variable: 'name', value: 'Alexander' },
  ]);
  assert.equal(story.initialVariables.count, 1);
});

for (const effect of ['*set missing 1', '*add missing 1', '*set Count 1', '*set count', '*add', '*set count count', '*add count 1 + 2', '*set count NaN', '*add count Infinity', '*add count 1e309']) {
  test(`rejects invalid effects: ${effect}`, () => {
    assert.throws(() => parseStory(storyWithEffects('*var count 0', effect)), /Line 4, passage "start":/);
  });
}

test('rejects all assignment type changes while allowing integer/decimal changes', () => {
  for (const [initial, value] of [['0', 'true'], ['0', '"1"'], ['false', '0'], ['false', '"true"'], ['"name"', 'true'], ['"name"', '1']]) {
    assert.throws(() => parseStory(storyWithEffects(`*var value ${initial}`, `*set value ${value}`)), /preserve the declared type/);
  }
  assert.deepEqual(parseStory(storyWithEffects('*var count 0', '*set count 0.5')).passages[0]?.effects[0], { kind: 'set', variable: 'count', value: 0.5 });
});

test('*add requires both a numeric variable and a numeric literal', () => {
  for (const [initial, amount] of [['false', '1'], ['"name"', '1'], ['0', 'true'], ['0', '"1"']]) {
    assert.throws(() => parseStory(storyWithEffects(`*var value ${initial}`, `*add value ${amount}`)), /requires a numeric variable and numeric literal/);
  }
});

test('effects are rejected before a title, within/after prose, and after navigation', () => {
  const declarations = '*var count 0\n';
  for (const body of [
    '*set count 1\n*passage start\n*title Start\nText.',
    '*passage start\n*set count 1\n*title Start\nText.',
    `${passage}\n*set count 1`,
    `${passage}\n\n*add count 1`,
    `${passage}\n*choice\n#Back -> start\n*set count 1`,
    `${passage}\n*continue start\n*add count 1`,
  ]) {
    assert.throws(() => parseStory(declarations + body), /Effects must appear after \*title and before the first narrative paragraph/);
  }
});

test('variable names are case-sensitive and inherited object properties are not declarations', () => {
  assert.throws(() => parseStory(storyWithEffects('*var count 0', '*set Count 1')), /Variable name must match/);
  assert.throws(() => parseStory(storyWithEffects('', '*set constructor "x"')), /Undeclared variable "constructor"/);
  assert.throws(() => parseStory(`${passage} \${constructor}`), /Undeclared variable "constructor"/);
  assert.equal(parseStory(`*var constructor 1\n${passage} \${constructor}`).initialVariables.constructor, 1);
});

test('validates interpolation while preserving placeholders in immutable passage text', () => {
  const story = parseStory('*var count 1\n*passage start\n*title Start\nCount: ${count}.');
  assert.deepEqual(story.passages[0]?.paragraphs, [{ text: 'Count: ${count}.' }]);
  assert.equal(interpolate(story.passages[0]!.paragraphs[0]!.text, { count: 2 }), 'Count: 2.');
});

for (const placeholder of ['${missing}', '${Count}', '${count + 1}', '${ count }', '${}', '${count', '${count${count}}']) {
  test(`rejects undeclared or malformed interpolation: ${placeholder}`, () => {
    assert.throws(() => parseStory(`*var count 0\n${passage} ${placeholder}`), /Line 4, passage "start": (Undeclared|Unclosed) variable/);
  });
}

test('validates variables and effects even in unreachable passages', () => {
  assert.throws(() => parseStory(`${passage}\n*passage unreachable\n*title Other\n\${missing}`), /passage "unreachable": Undeclared variable/);
  assert.throws(() => parseStory(`${passage}\n*passage unreachable\n*title Other\n*set missing 1\nText.`), /passage "unreachable": Undeclared variable/);
});

test('interpolation converts primitives in a single pass without evaluating inserted content', () => {
  const variables = Object.freeze({ count: -0.5, loyal: true, name: '<b>${missing}</b>', other: '$&$$' });
  assert.equal(interpolate('${count} ${loyal} ${name} ${other}', variables), '-0.5 true <b>${missing}</b> $&$$');
  assert.deepEqual(variables, { count: -0.5, loyal: true, name: '<b>${missing}</b>', other: '$&$$' });
});

test('titles, choice labels and string literals do not interpolate', () => {
  const story = parseStory('*var name "${missing}"\n*passage start\n*title ${missing}\n*set name "${still_missing}"\nText.\n*choice\n#${missing} -> start');
  assert.equal(story.initialVariables.name, '${missing}');
  assert.equal(story.passages[0]?.title, '${missing}');
  assert.equal(story.passages[0]?.choices[0]?.label, '${missing}');
  assert.deepEqual(story.passages[0]?.effects[0], { kind: 'set', variable: 'name', value: '${still_missing}' });
});

test('declarations, effect lists and individual effects cannot be mutated by consumers', () => {
  const story = parseStory(storyWithEffects('*var count 0', '*add count 1'));
  assert.equal(Reflect.set(story.initialVariables, 'count', 99), false);
  assert.equal(Reflect.set(story.passages[0]!.effects[0]!, 'value', 99), false);
  assert.throws(() => Array.prototype.push.call(story.passages[0]!.effects, { kind: 'add', variable: 'count', value: 99 }), TypeError);
});
