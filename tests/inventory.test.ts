import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { evaluateCondition } from '../src/condition';
import { Game } from '../src/game';
import { parseStory } from '../src/story';

const definitions = '*item gold_coin "Gold Coin"\n*item potion "Potion"\n*item constructor "Constructor"\n';
const passage = '*passage start\n*title Start\nText.';
const withEffects = (effects: string) => definitions + '*passage start\n*title Start\n' + effects + '\nText.';
const conditional = (condition: string, effects = '') => definitions + '*passage start\n*title Start\n' + effects
  + '\nAlways.\n\n*show_if ' + condition + '\nConditional prose.\n*choice\n#Conditional -> target [if '
  + condition + ']\n#Fallback -> fallback\n*passage target\n*title Target\n*add_item potion 1\nDone.'
  + '\n*passage fallback\n*title Fallback\nDone.';
const max = Number.MAX_SAFE_INTEGER;

test('item definitions interleave with variables/skills in separate namespaces and are frozen', () => {
  const story = parseStory('*var gold_coin 99\n*skill gold_coin "Coin Lore"\n*item gold_coin "Gold Coin"\n'
    + '*var honor 5\n*item potion "Potion"\n*chapter First\n' + passage);
  assert.deepEqual(story.items, [{ id: 'gold_coin', name: 'Gold Coin' }, { id: 'potion', name: 'Potion' }]);
  assert.deepEqual(story.skills, [{ id: 'gold_coin', name: 'Coin Lore' }]);
  assert.equal(story.initialVariables.gold_coin, 99);
  assert.ok(Object.isFrozen(story.items));
  assert.ok(Object.isFrozen(story.items[0]));
  assert.equal(Reflect.set(story.items[0]!, 'name', 'Changed'), false);
  assert.throws(() => Array.prototype.pop.call(story.items), TypeError);
});

test('item IDs are stable across name/order changes and display names may duplicate', () => {
  const original = parseStory('*item field-kit_2 "Kit"\n*item a "Kit"\n' + passage);
  const revised = parseStory('*item a "Renamed"\n*item field-kit_2 "Revised"\n' + passage);
  assert.equal(original.items[0]?.id, revised.items[1]?.id);
  assert.deepEqual(original.items.map(item => item.name), ['Kit', 'Kit']);
});

test('item names decode JSON escapes and remain literal', () => {
  const name = 'A "quoted" item\\path\n♥ $' + '{unknown} <b>Kit</b>';
  const story = parseStory('*item kit ' + JSON.stringify(name) + '\n' + passage);
  assert.equal(story.items[0]?.name, name);
  assert.deepEqual(JSON.parse(JSON.stringify(story)), story);
});

test('duplicate unused item IDs are rejected', () => {
  assert.throws(() => parseStory('*item coin "First"\n*item coin "Second"\n' + passage), /Line 2: Duplicate item ID "coin"/);
});

for (const declaration of [
  '*item', '*item coin', '*item Coin "Coin"', '*item 1coin "Coin"', '*item bad.id "Item"',
  '*item toString "Item"', '*item __proto__ "Item"', '*item coin ""', '*item coin "  "',
  '*item coin "\\n\\t"', '*item coin Name', "*item coin 'Name'", '*item coin "unclosed',
  '*item coin "ok" trailing', '*item coin "bad\\x"', '*item coin 1', '*item coin true',
  '*item coin null', '*item coin []',
]) {
  test('rejects invalid item metadata: ' + declaration, () => {
    assert.throws(() => parseStory(declaration + '\n' + passage), /Line 1:/);
  });
}

test('item declarations cannot follow chapters/passages or appear between chapters', () => {
  for (const body of [
    '*chapter First\n*item coin "Coin"\n' + passage,
    '*passage start\n*title Start\n*item coin "Coin"\nText.',
    passage + '\n*item coin "Coin"',
    passage + '\n*chapter Second\n*item coin "Coin"\n*passage end\n*title End\nDone.',
  ]) {
    assert.throws(() => parseStory(body), /\*item declarations must precede the first passage and all chapter declarations/);
  }
});

test('existing stories need no definitions and new games start with frozen empty inventory', () => {
  const story = parseStory(passage);
  assert.deepEqual(story.items, []);
  const game = new Game(story);
  assert.deepEqual(game.state.inventory, {});
  assert.ok(Object.isFrozen(game.state.inventory));
});

for (const quantity of ['1', '5', '100', String(max)]) {
  test('parses positive safe integer quantity: ' + quantity, () => {
    const story = parseStory(withEffects('*add_item gold_coin ' + quantity + '\n*remove_item gold_coin ' + quantity));
    assert.deepEqual(story.passages[0]?.effects, [
      { kind: 'add_item', itemId: 'gold_coin', quantity: Number(quantity) },
      { kind: 'remove_item', itemId: 'gold_coin', quantity: Number(quantity) },
    ]);
    assert.deepEqual(new Game(story).state.inventory, {});
  });
}

for (const quantity of [
  '0', '-0', '-1', '+1', '1.5', '1.0', '.5', '01', '0x10', '1e3', '1e309',
  'NaN', 'Infinity', String(max + 1), '999999999999999999999999999999',
  '"1"', 'true', 'influence', '$' + '{influence}', '1 + 2',
]) {
  test('rejects invalid item effect quantity: ' + quantity, () => {
    for (const command of ['*add_item', '*remove_item']) {
      assert.throws(() => parseStory(withEffects(command + ' gold_coin ' + quantity)), /Line 6, passage "start":/);
    }
  });
}

for (const command of [
  '*add_item', '*remove_item', '*add_item gold_coin', '*remove_item gold_coin',
  '*add_item unknown 1', '*remove_item unknown 1', '*add_item "gold_coin" 1',
  '*remove_item Gold_Coin 1', '*add_item gold_coin 1 extra', '*remove_item gold_coin 1 [if has_item gold_coin]',
]) {
  test('rejects malformed item command: ' + command, () => {
    assert.throws(() => parseStory(withEffects(command)), /passage "start":/);
  });
}

test('item effects are prohibited before title, in prose/choices/conditions, and after navigation', () => {
  for (const command of ['*add_item gold_coin 1', '*remove_item gold_coin 1']) {
    for (const body of [
      command + '\n' + passage,
      '*passage start\n' + command + '\n*title Start\nText.',
      passage + '\n' + command, passage + '\n\nMore.\n' + command,
      passage + '\n*choice\n#Again -> start\n' + command,
      passage + '\n*continue start\n' + command,
      '*passage start\n*title Start\n*show_if has_item gold_coin\n' + command + '\nText.',
      passage + '\n\n*show_if lacks_item gold_coin\nHidden.\n\n' + command,
    ]) {
      assert.throws(() => parseStory(definitions + body), /Effects must appear|immediately following source line/);
    }
  }
});

for (const condition of [
  'has_item', 'lacks_item', 'has_item unknown', 'lacks_item unknown', 'has_item "potion"',
  'has_item Potion', 'has_item 1potion', 'has_item potion extra', 'has_item potion == true',
  'lacks_item potion >= 1', 'item_count', 'item_count potion', 'item_count unknown >= 0',
  'item_count potion = 1', 'item_count potion === 1', 'item_count potion >= -1',
  'item_count potion >= 1.5', 'item_count potion >= 1.0', 'item_count potion >= 01',
  'item_count potion >= NaN', 'item_count potion >= Infinity', 'item_count potion >= 1e309',
  'item_count potion >= ' + String(max + 1), 'item_count potion >= "1"',
  'item_count potion >= other', 'item_count potion >= 1 + 2',
  'has_item potion && lacks_item gold_coin', '(has_item potion)',
  'item_count (potion) >= 1', 'item_count potion >= 1 || true', '!has_item potion',
]) {
  test('rejects item conditions in both contexts: ' + condition, () => {
    assert.throws(() => parseStory(conditional(condition)), /passage "start":/);
    assert.throws(() => parseStory(definitions + passage + '\n*choice\n#Optional -> start [if '
      + condition + ']\n#Fallback -> start'), /passage "start":/);
  });
}

test('all item references and quantities are validated in unreachable passages', () => {
  for (const body of [
    '*add_item unknown 1\nText.', '*remove_item unknown 1\nText.', '*add_item potion 1.5\nText.',
    'Always.\n\n*show_if has_item unknown\nHidden.',
    'Always.\n\n*show_if lacks_item unknown\nHidden.',
    'Always.\n\n*show_if item_count unknown >= 1\nHidden.',
    'Text.\n*choice\n#Hidden -> start [if has_item unknown]\n#Fallback -> start',
  ]) {
    assert.throws(() => parseStory(definitions + passage + '\n*passage unreachable\n*title Other\n' + body),
      /passage "unreachable":/);
  }
});

test('item conditions require unconditional choice fallbacks and validate hidden destinations', () => {
  for (const condition of ['has_item potion', 'lacks_item potion', 'item_count potion == 0']) {
    assert.throws(() => parseStory(conditional(condition).replace('#Fallback -> fallback\n', '')),
      /requires at least one unconditional choice/);
  }
  assert.throws(() => parseStory(conditional('has_item potion').replace('Conditional -> target', 'Conditional -> missing')),
    /Missing destination "missing"/);
});

test('item keywords remain valid variable IDs with every comparison operator/spacing form', () => {
  for (const name of ['has_item', 'lacks_item', 'item_count']) {
    for (const [operator, eligible] of [['==', true], ['!=', false], ['>=', true], ['<=', true], ['>', false], ['<', false]] as const) {
      for (const [before, after] of [['', ''], [' ', ''], ['', ' '], [' ', ' ']]) {
        const condition = name + before + operator + after + '2';
        const game = new Game(parseStory('*var ' + name + ' 2\n' + conditional(condition)));
        assert.equal(game.availableChoices.length, eligible ? 2 : 1, condition);
        assert.equal(game.visibleParagraphs.length, eligible ? 2 : 1, condition);
      }
    }
  }
});

for (const [operator, value, absent, owned] of [
  ['==', 0, true, false], ['==', 2, false, true], ['!=', 2, true, false],
  ['>', 1, false, true], ['>=', 2, false, true], ['<', 1, true, false],
  ['<=', 0, true, false], ['<=', 2, true, true], ['<', max, true, true],
] as const) {
  test('quantity comparison uses inventory in both contexts: ' + operator + ' ' + value, () => {
    for (const [effects, eligible] of [['', absent], ['*add_item gold_coin 2', owned]] as const) {
      const condition = 'item_count gold_coin' + operator + value;
      const game = new Game(parseStory('*var gold_coin 99\n' + conditional(condition, effects)));
      assert.equal(game.availableChoices.length, eligible ? 2 : 1);
      assert.equal(game.visibleParagraphs.length, eligible ? 2 : 1);
      assert.deepEqual(game.passage.choices[0]?.condition, { operator, itemId: 'gold_coin', value });
    }
  });
}

for (const [condition, effects, eligible] of [
  ['has_item potion', '', false], ['lacks_item potion', '', true],
  ['has_item potion', '*add_item potion 1', true], ['lacks_item potion', '*add_item potion 1', false],
  ['has_item potion', '*add_item potion 1\n*remove_item potion 1', false],
  ['lacks_item potion', '*add_item potion 1\n*remove_item potion 1', true],
] as const) {
  test('possession reads final entry quantities: ' + condition + ', ' + (effects || 'none'), () => {
    const game = new Game(parseStory(conditional(condition, effects)));
    assert.equal(game.availableChoices.length, eligible ? 2 : 1);
    assert.equal(game.visibleParagraphs.length, eligible ? 2 : 1);
  });
}

test('same-ID variables, skills, and items remain independent', () => {
  const source = [
    '*var gold_coin 99', '*var loyal true', '*var faction "guild"',
    '*skill gold_coin "Coin Lore"', '*item gold_coin "Gold Coin"',
    '*passage start', '*title Start', '*grant_skill gold_coin', '*add_item gold_coin 2', 'Always.',
    '', '*show_if gold_coin == 99', 'Variable.', '', '*show_if loyal == true', 'Boolean.',
    '', '*show_if faction == "guild"', 'String.', '', '*show_if has_skill gold_coin', 'Skill.',
    '', '*show_if has_item gold_coin', 'Item.', '', '*show_if item_count gold_coin == 2', 'Quantity.',
  ].join('\n');
  const game = new Game(parseStory(source));
  assert.deepEqual(game.visibleParagraphs.map(p => p.text), ['Always.', 'Variable.', 'Boolean.', 'String.', 'Skill.', 'Item.', 'Quantity.']);
});

test('effects accumulate and remove quantities; zero deletes and reacquisition moves to the end', () => {
  const game = new Game(parseStory(withEffects([
    '*add_item gold_coin 2', '*add_item potion 3', '*add_item gold_coin 5',
    '*remove_item gold_coin 6', '*remove_item gold_coin 1', '*add_item gold_coin 4',
  ].join('\n'))));
  assert.deepEqual(game.state.inventory, { potion: 3, gold_coin: 4 });
  assert.deepEqual(Object.keys(game.state.inventory), ['potion', 'gold_coin']);
  const empty = new Game(parseStory(withEffects('*add_item gold_coin 1\n*remove_item gold_coin 1')));
  assert.equal(Object.hasOwn(empty.state.inventory, 'gold_coin'), false);
});

test('constructor and other inherited properties never count as owned items', () => {
  const empty = new Game(parseStory(definitions + passage));
  for (const itemId of ['constructor', 'toString', 'gold_coin']) {
    assert.equal(evaluateCondition({ operator: 'has_item', itemId }, empty.state), false);
    assert.equal(evaluateCondition({ operator: 'lacks_item', itemId }, empty.state), true);
    assert.equal(evaluateCondition({ operator: '==', itemId, value: 0 }, empty.state), true);
  }
  const inherited = { ...empty.state, inventory: Object.create({ gold_coin: 100 }) };
  assert.equal(evaluateCondition({ operator: 'has_item', itemId: 'gold_coin' }, inherited), false);
  assert.equal(evaluateCondition({ operator: '==', itemId: 'gold_coin', value: 0 }, inherited), true);
  assert.deepEqual(new Game(parseStory(withEffects('*add_item constructor 2\n*remove_item constructor 1'))).state.inventory,
    { constructor: 1 });
  assert.throws(() => new Game(parseStory(withEffects('*remove_item constructor 1'))), /insufficient inventory.*"constructor"/);
});

const cycle = definitions + '*var count 0\n*passage start\n*title Start\n*add count 1\n*add_item gold_coin 2\n'
  + '*add_item potion 1\nStart.\n*continue consume\n*passage consume\n*title Consume\n*remove_item gold_coin 1\n'
  + 'Always.\n\n*show_if item_count gold_coin >= 2\nEnough.\n*choice\n#Enough -> start [if item_count gold_coin >= 2]\n#Return -> start';

test('initial entry and legitimate returns apply effects once; repeated reads are side-effect free', () => {
  const game = new Game(parseStory(cycle));
  const initial = game.state;
  assert.deepEqual(initial.inventory, { gold_coin: 2, potion: 1 });
  for (let i = 0; i < 3; i++) {
    game.availableChoices; game.visibleParagraphs; Object.entries(game.state.inventory);
    assert.equal(game.state, initial);
  }
  game.navigate('consume');
  assert.deepEqual(Object.keys(game.state.inventory), ['gold_coin', 'potion']);
  assert.deepEqual(game.availableChoices.map(c => c.label), ['Return']);
  assert.equal(game.visibleParagraphs.length, 1);
  game.navigate('start');
  assert.equal(game.state.variables.count, 2);
  game.navigate('consume');
  assert.deepEqual(game.availableChoices.map(c => c.label), ['Enough', 'Return']);
  assert.equal(game.visibleParagraphs.length, 2);
  assert.deepEqual(game.state.inventory, { gold_coin: 2, potion: 2 });
  assert.deepEqual(initial.inventory, { gold_coin: 2, potion: 1 });
});

test('committed inventories are frozen, independent, and JSON-serializable', () => {
  const story = parseStory(cycle);
  const first = new Game(story);
  const second = new Game(story);
  const previous = first.state;
  first.navigate('consume');
  assert.notEqual(first.state.inventory, previous.inventory);
  assert.notEqual(second.state.inventory, previous.inventory);
  assert.deepEqual(second.state.inventory, { gold_coin: 2, potion: 1 });
  assert.equal(Reflect.set(first.state.inventory, 'gold_coin', 99), false);
  assert.equal(Reflect.deleteProperty(first.state.inventory, 'gold_coin'), false);
  assert.equal(Reflect.set(first.state, 'inventory', {}), false);
  assert.deepEqual(JSON.parse(JSON.stringify(first.state)), first.state);
});

test('item effects, conditions, and derived views are immutable', () => {
  const game = new Game(parseStory(conditional('item_count potion >= 1', '*add_item potion 1')));
  assert.equal(Reflect.set(game.passage.effects[0]!, 'quantity', 100), false);
  assert.equal(Reflect.set(game.passage.paragraphs[1]!.condition!, 'value', 100), false);
  assert.equal(Reflect.set(game.passage.choices[0]!.condition!, 'itemId', 'gold_coin'), false);
  assert.ok(Object.isFrozen(game.availableChoices));
  assert.ok(Object.isFrozen(game.visibleParagraphs));
});

test('unavailable item destinations reject navigation without changing any state', () => {
  for (const condition of ['has_item potion', 'item_count gold_coin >= 10']) {
    const game = new Game(parseStory(conditional(condition)));
    const before = game.state;
    assert.throws(() => game.navigate('target'), /has no action/);
    assert.equal(game.state, before);
    assert.deepEqual(game.state.inventory, {});
    game.navigate('fallback');
    assert.equal(game.state.passageId, 'fallback');
  }
});

test('shared destinations permit an eligible choice even beside an unavailable one', () => {
  const source = conditional('has_item potion').replace('#Fallback -> fallback',
    '#Absent -> target [if lacks_item gold_coin]\n#Fallback -> fallback');
  const game = new Game(parseStory(source));
  game.navigate('target');
  assert.deepEqual(game.state.inventory, { potion: 1 });
  const blocked = new Game(parseStory(source.replace('lacks_item gold_coin', 'has_item gold_coin')));
  assert.throws(() => blocked.navigate('target'), /has no action/);
  const fallback = new Game(parseStory(source.replace('#Fallback -> fallback', '#Fallback -> target')));
  fallback.navigate('target');
  assert.equal(fallback.state.passageId, 'target');
});

const failure = (effects: string, initial = 5) => definitions + '*var count 0\n*var huge 1e308\n*skill diplomacy "Diplomacy"\n'
  + '*passage start\n*title Start\n*add_item gold_coin ' + initial + '\nStart.\n*choice\n#Risk -> risk\n#Prepare -> prepare\n'
  + '*passage risk\n*title Risk\n' + effects + '\nRisk.\n*passage prepare\n*title Prepare\n*add_item potion 1\nPrepared.';

for (const [effects, initial, error] of [
  ['*add count 2\n*grant_skill diplomacy\n*journal attempt "Attempt"\n*add_item gold_coin 5\n*remove_item gold_coin 100', 5, /insufficient inventory/],
  ['*add_item gold_coin 1\n*journal attempt "Attempt"\n*grant_skill diplomacy\n*add count 2\n*remove_item potion 1', 5, /insufficient inventory/],
  ['*add count 2\n*journal attempt "Attempt"\n*grant_skill diplomacy\n*add_item gold_coin 1\n*remove_item gold_coin 1', max, /safe integer/],
  ['*remove_item gold_coin 6\n*add_item gold_coin 100', 5, /insufficient inventory/],
  ['*add_item potion 1\n*remove_item gold_coin 1\n*grant_skill diplomacy\n*journal attempt "Attempt"\n*add huge 1e308', 5, /non-finite/],
] as const) {
  test('mixed failure discards every effect, including invalid intermediate quantities: ' + effects, () => {
    const game = new Game(parseStory(failure(effects, initial)));
    const before = game.state;
    const serialized = JSON.stringify(before);
    for (let i = 0; i < 3; i++) {
      assert.throws(() => game.navigate('risk'), error);
      assert.equal(game.state, before);
      assert.equal(JSON.stringify(game.state), serialized);
    }
    game.navigate('prepare');
    assert.deepEqual(game.state.inventory, { gold_coin: initial, potion: 1 });
    assert.deepEqual(before.inventory, { gold_coin: initial });
  });
}

test('a successful retry after failure records only successful effects', () => {
  const source = failure('*add count 1\n*grant_skill diplomacy\n*journal attempt "Attempt"\n*remove_item gold_coin 10')
    .replace('*add_item potion 1\nPrepared.', '*add_item gold_coin 10\nPrepared.\n*continue risk');
  const game = new Game(parseStory(source));
  assert.throws(() => game.navigate('risk'), /insufficient inventory/);
  game.navigate('prepare'); game.navigate('risk');
  assert.deepEqual(game.state.inventory, { gold_coin: 5 });
  assert.equal(game.state.variables.count, 1);
  assert.deepEqual(game.state.skills, ['diplomacy']);
  assert.deepEqual(game.state.journal.map(entry => entry.id), ['attempt']);
});

test('failure rolls back a skill revocation and an earlier item deletion', () => {
  const source = failure('*revoke_skill diplomacy\n*remove_item gold_coin 5\n*journal attempt "Attempt"\n*remove_item potion 1')
    .replace('*add_item gold_coin 5\nStart.', '*grant_skill diplomacy\n*add_item gold_coin 5\nStart.');
  const game = new Game(parseStory(source));
  const before = game.state;
  assert.throws(() => game.navigate('risk'), /insufficient inventory/);
  assert.equal(game.state, before);
  assert.deepEqual(before.skills, ['diplomacy']);
  assert.deepEqual(before.inventory, { gold_coin: 5 });
});

test('failed initial entry exposes no partially initialized game', () => {
  for (const effects of [
    '*add_item gold_coin 5\n*remove_item gold_coin 6',
    '*add_item gold_coin ' + max + '\n*add_item gold_coin 1\n*remove_item gold_coin 1',
    '*add_item potion 1\n*add huge 1e308',
  ]) {
    let game: Game | undefined;
    const story = parseStory('*var huge 1e308\n*skill diplomacy "Diplomacy"\n'
      + withEffects('*grant_skill diplomacy\n*journal attempt "Attempt"\n' + effects));
    assert.throws(() => { game = new Game(story); }, /insufficient inventory|safe integer|non-finite/);
    assert.equal(game, undefined);
    assert.equal(story.initialVariables.huge, 1e308);
  }
});

test('both original routes preserve skills/journal/chapters and demonstrate removal and item conditions', () => {
  const story = parseStory(readFileSync(new URL('../src/example.story', import.meta.url), 'utf8'));
  for (const viaMessenger of [false, true]) {
    const game = new Game(story);
    assert.deepEqual(game.state.inventory, { gold_coin: 10, gate_token: 1 });
    if (viaMessenger) game.navigate('messenger');
    game.navigate('council');
    assert.deepEqual(game.state.inventory, { gold_coin: viaMessenger ? 7 : 5 });
    assert.equal(Object.hasOwn(game.state.inventory, 'gate_token'), false);
    assert.deepEqual(game.state.skills, viaMessenger ? ['diplomacy'] : []);
    assert.equal(game.state.journal.length, viaMessenger ? 3 : 2);
    assert.equal(game.passage.chapter, 'Chapter One');
    assert.ok(game.visibleParagraphs.some(p => p.text.includes('small reassurance')));
    assert.equal(game.visibleParagraphs.some(p => p.text.includes("messenger's extra coins")), viaMessenger);
  }
});
