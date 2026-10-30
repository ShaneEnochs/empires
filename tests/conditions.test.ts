import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateCondition } from '../src/condition';
import { Game } from '../src/game';
import { parseStory } from '../src/story';

const declarations = '*var influence 4\n*var honor -1.5\n*var loyal false\n*var faction "guild"\n*var other 4\n';
const start = '*passage start\n*title Start\nText.\n*choice\n';
const endings = '\n*passage target\n*title Target\nDone.\n*passage fallback\n*title Fallback\nDone.';
const source = (suffix: string) => `${declarations}${start}#Conditional -> target ${suffix}\n#Fallback -> fallback${endings}`;

for (const [operator, value, expected] of [
  ['==', 4, true], ['==', 3, false], ['!=', 3, true], ['!=', 4, false],
  ['>', 3, true], ['>', 4, false], ['>=', 4, true], ['>=', 5, false],
  ['<', 5, true], ['<', 4, false], ['<=', 4, true], ['<=', 3, false],
] as const) {
  test(`parses and evaluates influence ${operator} ${value} as ${expected}`, () => {
    const story = parseStory(source(`[if influence ${operator} ${value}]`));
    const condition = story.passages[0]!.choices[0]!.condition!;
    assert.deepEqual(condition, { variable: 'influence', operator, value });
    const game = new Game(story);
    assert.equal(evaluateCondition(condition, game.state.variables), expected);
    assert.deepEqual(game.availableChoices.map(c => c.label), expected ? ['Conditional', 'Fallback'] : ['Fallback']);
  });
}

for (const [operator, value, expected] of [
  ['==', -1.5, true], ['!=', -1.25, true], ['>', -2, true],
  ['>=', -1.5, true], ['<', -1.25, true], ['<=', -1.5, true],
] as const) {
  test(`supports negative decimal comparison honor ${operator} ${value}`, () => {
    const game = new Game(parseStory(source(`[if honor ${operator} ${value}]`)));
    assert.equal(game.availableChoices.some(c => c.label === 'Conditional'), expected);
  });
}

for (const [expression, expected] of [
  ['loyal == false', true], ['loyal == true', false], ['loyal != true', true], ['loyal != false', false],
  ['faction == "guild"', true], ['faction == "Guild"', false], ['faction != "other"', true], ['faction != "guild"', false],
] as const) {
  test(`supports primitive equality: ${expression}`, () => {
    const game = new Game(parseStory(source(`[if ${expression}]`)));
    assert.equal(game.availableChoices.some(c => c.label === 'Conditional'), expected);
  });
}

test('reuses string-literal escapes and permits brackets, arrows and operator-like text inside strings', () => {
  const value = 'guild [if x] -> ] "quoted"\\path && !=';
  const literal = JSON.stringify(value);
  const story = parseStory(source(`[if faction == ${literal}]`).replace('*var faction "guild"', `*var faction ${literal}`));
  assert.equal(story.passages[0]?.choices[0]?.condition?.value, value);
  assert.equal(new Game(story).availableChoices.length, 2);
});

test('accepts empty string literals, finite exponents, and compact operator spacing', () => {
  const empty = parseStory(source('[if faction == ""]').replace('*var faction "guild"', '*var faction ""'));
  assert.equal(new Game(empty).availableChoices.length, 2);
  assert.equal(new Game(parseStory(source('[if influence>=4e0]'))).availableChoices.length, 2);
  assert.equal(new Game(parseStory(source('[if influence >= 4 ]'))).availableChoices.length, 2);
});

for (const suffix of [
  '[if]', '[if ]', '[if influence]', '[if >= 4]', '[if influence >=]',
  '[if influence = 4]', '[if influence === 4]', '[if influence !== 4]', '[if influence <> 4]',
  '[if influence >= 4', 'if influence >= 4]', '[[if influence >= 4]]', '[IF influence >= 4]',
  '[if influence >= 4]]', '[if influence >= 4] trailing', '[if influence >= 4] [if loyal == false]',
  '[if influence >= 4 && loyal == false]', '[if influence >= 4 || loyal == false]',
  '[if influence + 1 >= 4]', '[if (influence >= 4)]', '[if influence >= (4)]',
  '[if influence >= other]', '[if influence >= 2 + 2]', '[if !loyal == true]',
  '[if influence == [4]]', '[if influence == {"value":4}]', '[if influence == null]',
  '[if faction == "unterminated]', "[if faction == 'guild']", '[if faction == "bad\\x"]',
  '[if influence == NaN]', '[if influence == Infinity]', '[if influence > -Infinity]',
  '[if influence >= 1e309]', '[if influence >= -1e309]',
  '[if Influence == 4]', '[if 1value == 4]',
] as const) {
  test(`rejects malformed/unsupported conditions with source context: ${suffix}`, () => {
    assert.throws(() => parseStory(source(suffix)), /Line 10, passage "start":/);
  });
}

for (const expression of ['influence == "4"', 'influence != false', 'loyal == 0', 'faction == true', 'honor > "-1.5"']) {
  test(`rejects incompatible comparison types: ${expression}`, () => {
    assert.throws(() => parseStory(source(`[if ${expression}]`)), /Condition operands must have compatible types/);
  });
}

for (const operator of ['>', '>=', '<', '<=']) {
  test(`rejects ${operator} ordering on strings and booleans`, () => {
    assert.throws(() => parseStory(source(`[if loyal ${operator} false]`)), /Ordering comparisons require numbers/);
    assert.throws(() => parseStory(source(`[if faction ${operator} "guild"]`)), /Ordering comparisons require numbers/);
  });
}

test('undeclared and inherited property names are not accepted as condition variables', () => {
  assert.throws(() => parseStory(source('[if missing == 4]')), /Line 10, passage "start": Undeclared variable "missing"/);
  assert.throws(() => parseStory(source('[if constructor == 4]')), /Undeclared variable "constructor"/);
  const declared = parseStory(`*var constructor 4\n${source('[if constructor == 4]')}`);
  assert.equal(new Game(declared).availableChoices.length, 2);
});

test('rejects condition-looking syntax on the label side instead of treating it as literal text', () => {
  const bad = `${declarations}${start}#Conditional [if influence >= 4] -> target\n#Fallback -> fallback${endings}`;
  assert.throws(() => parseStory(bad), /Line 10, passage "start": Choice conditions must follow the destination/);
});

test('every conditional block needs an unconditional fallback, even if its conditions are initially true', () => {
  const noFallback = source('[if influence >= 4]').replace('#Fallback -> fallback\n', '');
  assert.throws(() => parseStory(noFallback), /Line 9, passage "start": .*at least one unconditional choice/);
  assert.throws(() => parseStory(source('[if influence >= 4]').replace('#Fallback -> fallback', '#Other -> fallback [if loyal == false]')), /at least one unconditional choice/);
});

test('validates destinations of initially unavailable choices', () => {
  const missing = source('[if influence > 100]').replace('Conditional -> target', 'Conditional -> missing');
  assert.throws(() => parseStory(missing), /Line 10, passage "start": Missing destination "missing"/);
});

test('invalid conditions in unreachable passages prevent all game initialization', () => {
  let game: Game | undefined;
  const invalid = `${declarations}*passage first\n*title First\nDone.\n${start}#Conditional -> target [if missing == 4]\n#Fallback -> fallback${endings}`;
  assert.throws(() => { game = new Game(parseStory(invalid)); }, /passage "start": Undeclared variable "missing"/);
  assert.equal(game, undefined);
});

test('conditional Continue is unsupported while ordinary Continue and terminal passages remain valid', () => {
  const ordinary = `${declarations}*passage first\n*title First\nText.\n*continue target${endings}`;
  assert.throws(() => parseStory(ordinary.replace('*continue target', '*continue target [if loyal == false]')), /Continue destination must match/);
  const game = new Game(parseStory(ordinary));
  assert.deepEqual(game.availableChoices, []);
  game.navigate('target');
  assert.deepEqual(game.availableChoices, []);
  const before = game.state;
  assert.throws(() => game.navigate('fallback'), /has no action/);
  assert.equal(game.state, before);
});

test('unconditional choices retain their authored data, order and behavior', () => {
  const story = parseStory(source('').replace('Conditional -> target ', 'Conditional -> target'));
  const game = new Game(story);
  assert.deepEqual(game.availableChoices, story.passages[0]?.choices);
  assert.equal(Object.hasOwn(game.availableChoices[0]!, 'condition'), false);
  game.navigate('target');
  assert.equal(game.state.passageId, 'target');
});

test('eligibility uses committed values after entry effects and repeated reads never reapply effects', () => {
  const story = parseStory(source('[if influence >= 5]').replace('*title Start\n', '*title Start\n*add influence 1\n'));
  const game = new Game(story);
  const before = game.state;
  for (let i = 0; i < 3; i++) {
    assert.deepEqual(game.availableChoices.map(c => c.label), ['Conditional', 'Fallback']);
    assert.equal(game.state, before);
    assert.equal(game.state.variables.influence, 5);
  }
  assert.equal(story.initialVariables.influence, 4);
});

test('ineligible navigation is rejected by Game without changing any state or entering the destination', () => {
  const story = parseStory(source('[if influence >= 5]').replace('*title Target\n', '*title Target\n*add influence 100\n'));
  const game = new Game(story);
  const before = game.state;
  assert.deepEqual(game.availableChoices.map(c => c.label), ['Fallback']);
  assert.equal(game.passage.choices.length, 2);
  assert.throws(() => game.navigate('target'), /has no action/);
  assert.equal(game.state, before);
  assert.deepEqual(game.state.variables, story.initialVariables);
  game.navigate('fallback');
  assert.equal(game.state.passageId, 'fallback');
});

test('a legitimate re-entry recomputes eligibility after its new entry effects', () => {
  const text = source('[if influence >= 5]')
    .replace('*title Start\n', '*title Start\n*add influence 0.5\n')
    .replace('*title Fallback\nDone.', '*title Fallback\nDone.\n*continue start');
  const game = new Game(parseStory(text));
  assert.equal(game.state.variables.influence, 4.5);
  assert.deepEqual(game.availableChoices.map(c => c.label), ['Fallback']);
  game.navigate('fallback');
  game.navigate('start');
  assert.equal(game.state.variables.influence, 5);
  assert.deepEqual(game.availableChoices.map(c => c.label), ['Conditional', 'Fallback']);
  game.navigate('target');
  assert.equal(game.state.passageId, 'target');
});

test('one eligible conditional choice permits a shared destination, and all false ones deny it', () => {
  const shared = source('[if influence > 100]').replace('#Fallback -> fallback', '#Second -> target [if loyal == false]\n#Fallback -> fallback');
  const game = new Game(parseStory(shared));
  assert.deepEqual(game.availableChoices.map(c => c.label), ['Second', 'Fallback']);
  game.navigate('target');
  assert.equal(game.state.passageId, 'target');
  const blocked = new Game(parseStory(shared.replace('loyal == false', 'loyal == true')));
  const before = blocked.state;
  assert.throws(() => blocked.navigate('target'), /has no action/);
  assert.equal(blocked.state, before);
});

test('an unconditional choice can permit the same destination as a false conditional choice', () => {
  const game = new Game(parseStory(source('[if influence > 100]').replace('#Fallback -> fallback', '#Fallback -> target')));
  assert.deepEqual(game.availableChoices.map(c => c.label), ['Fallback']);
  game.navigate('target');
  assert.equal(game.state.passageId, 'target');
});

test('an eligible choice still uses atomic entry and cannot commit partial effects on failure', () => {
  const text = `*var huge 1e308\n${source('[if influence >= 4]')}`
    .replace('*title Target\n', '*title Target\n*add influence 1\n*add huge 1e308\n');
  const game = new Game(parseStory(text));
  const before = game.state;
  assert.throws(() => game.navigate('target'), /non-finite/);
  assert.equal(game.state, before);
  assert.deepEqual(game.availableChoices.map(c => c.label), ['Conditional', 'Fallback']);
});

test('conditions and available choice views are immutable data, not mutable runtime state', () => {
  const story = parseStory(source('[if influence >= 4]'));
  const game = new Game(story);
  const authored = game.passage.choices;
  const view = game.availableChoices;
  assert.equal(Reflect.set(view[0]!.condition!, 'value', 100), false);
  assert.equal(Reflect.set(view[0]!, 'condition', undefined), false);
  assert.throws(() => Array.prototype.pop.call(view), TypeError);
  assert.equal(Reflect.set(view, 0, view[1]), false);
  assert.deepEqual(JSON.parse(JSON.stringify(authored[0]?.condition)), { variable: 'influence', operator: '>=', value: 4 });
  assert.equal(game.passage.choices, authored);
  assert.equal(game.availableChoices.length, 2);
});

test('equality is strict, conditions do not coerce values, and missing own variables fail closed', () => {
  assert.equal(evaluateCondition({ variable: 'value', operator: '==', value: 4 }, { value: '4' }), false);
  assert.equal(evaluateCondition({ variable: 'constructor', operator: '!=', value: 4 }, {}), false);
});
